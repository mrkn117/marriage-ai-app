import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { buildDiagnosisSystemPrompt, buildDiagnosisUserPrompt } from '@/prompts/diagnosis';
import type { DiagnoseRequest, DiagnosisResult, DiagnosisScores } from '@/types';

// NOTE: Firebase is NOT imported at the top level.
// We use dynamic import inside the handler so that Firebase initialization
// errors (which happen at module-load time) are caught in try-catch.

// Vercel Hobby plan hard cap is 60 s — set explicitly so Next.js doesn't apply a lower default
export const maxDuration = 60;

const SUPPORTED_PREFIXES = [
  'data:image/jpeg;base64,',
  'data:image/jpg;base64,',
  'data:image/png;base64,',
  'data:image/gif;base64,',
  'data:image/webp;base64,',
];

function sanitizeDataUrl(url: string): string {
  if (!url.startsWith('data:image/')) return url;
  const comma = url.indexOf(',');
  if (comma === -1) return url;
  return url.slice(0, comma + 1) + url.slice(comma + 1).replace(/\s+/g, '');
}

function isOpenAICompatible(url: string): boolean {
  if (url.startsWith('https://')) return true;
  return SUPPORTED_PREFIXES.some((p) => url.startsWith(p));
}

function parseJson(content: string): any {
  try { return JSON.parse(content); } catch { /* next */ }
  const m2 = content.match(/```json\s*([\s\S]*?)\s*```/);
  if (m2) try { return JSON.parse(m2[1]); } catch { /* next */ }
  const m3 = content.match(/```\s*([\s\S]*?)\s*```/);
  if (m3) try { return JSON.parse(m3[1]); } catch { /* next */ }
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try { return JSON.parse(content.slice(start, end + 1)); } catch { /* next */ }
  }
  return null;
}

export async function POST(req: NextRequest) {
  // ── Global catch-all: any uncaught error returns structured JSON ──
  try {
    return await handleDiagnose(req);
  } catch (err: any) {
    console.error('[diagnose] Unhandled error:', err);
    return NextResponse.json(
      { error: `予期しないエラー: ${err?.message ?? String(err)}` },
      { status: 500 }
    );
  }
}

async function handleDiagnose(req: NextRequest): Promise<NextResponse> {
  // ── 1. Parse request body ──────────────────────────────────────────
  let body: DiagnoseRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'リクエスト解析失敗' }, { status: 400 });
  }

  const { userProfile, imageUrls, currentDate } = body;

  if (!imageUrls?.length) {
    return NextResponse.json({ error: '画像が必要です' }, { status: 400 });
  }
  if (!userProfile) {
    return NextResponse.json({ error: 'プロフィールが必要です' }, { status: 400 });
  }

  // ── 2. Sanitize and validate image URLs ───────────────────────────
  const validUrls = imageUrls.map(sanitizeDataUrl).filter(isOpenAICompatible);

  if (validUrls.length === 0) {
    return NextResponse.json(
      { error: '非対応の画像形式です（JPEG/PNG/WebPで撮影してください）' },
      { status: 400 }
    );
  }

  // ── 3. Call OpenAI Vision API ─────────────────────────────────────
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI APIキーが設定されていません（環境変数未設定）' }, { status: 500 });
  }
  let completion;
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 55_000, // must finish before Vercel's 60 s function kill
    });
    completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: buildDiagnosisSystemPrompt() },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: buildDiagnosisUserPrompt(userProfile, validUrls, currentDate),
            },
            ...validUrls.map((url) => ({
              type: 'image_url' as const,
              image_url: { url, detail: 'auto' as const },
            })),
          ],
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });
  } catch (err: any) {
    console.error('[diagnose] OpenAI error:', err?.message, err?.status);
    const msg = err?.message ?? 'OpenAI APIエラー';
    const isTimeout = msg.includes('timeout') || msg.includes('timed out') || err?.status === 408;
    return NextResponse.json(
      { error: isTimeout ? 'AIの応答がタイムアウトしました。再度お試しください。' : `AI呼び出し失敗: ${msg}` },
      { status: 500 }
    );
  }

  const choice = completion.choices[0];
  const rawContent = choice?.message?.content ?? '';
  const finishReason = choice?.finish_reason;

  // ── 4. Handle content filter / empty response ─────────────────────
  if (finishReason === 'content_filter' || !rawContent.trim()) {
    return NextResponse.json(
      { error: 'AIが画像を処理できませんでした。本人のみが写った写真をお使いください。' },
      { status: 422 }
    );
  }

  // ── 5. Parse JSON response ────────────────────────────────────────
  const parsed = parseJson(rawContent);
  if (!parsed) {
    console.error('[diagnose] Parse failed. Content:', rawContent.slice(0, 300));
    return NextResponse.json(
      { error: 'AIの返答を解析できませんでした。再度お試しください。' },
      { status: 500 }
    );
  }

  // ── 6. Build normalized scores ────────────────────────────────────
  const scores: DiagnosisScores = {
    firstImpression: Math.min(20, Math.max(0, Number(parsed.scores?.firstImpression) || 10)),
    cleanliness:     Math.min(15, Math.max(0, Number(parsed.scores?.cleanliness)     || 8)),
    expression:      Math.min(15, Math.max(0, Number(parsed.scores?.expression)      || 8)),
    postureAndBody:  Math.min(20, Math.max(0, Number(parsed.scores?.postureAndBody)  || 10)),
    profileBalance:  Math.min(15, Math.max(0, Number(parsed.scores?.profileBalance)  || 8)),
    marketValue:     Math.min(15, Math.max(0, Number(parsed.scores?.marketValue)     || 8)),
    total: 0,
  };
  scores.total =
    scores.firstImpression + scores.cleanliness + scores.expression +
    scores.postureAndBody + scores.profileBalance + scores.marketValue;

  const diagnosisData: Omit<DiagnosisResult, 'id'> = {
    userId: userProfile.uid ?? '',
    scores,
    harshEvaluation: String(parsed.harshEvaluation ?? ''),
    strengths:       String(parsed.strengths       ?? ''),
    weaknesses:      String(parsed.weaknesses      ?? ''),
    marketView:      String(parsed.marketView      ?? ''),
    improvementPriority: Array.isArray(parsed.improvementPriority)
      ? parsed.improvementPriority.map(String)
      : [],
    thisWeekAction:  String(parsed.thisWeekAction  ?? ''),
    oneMonthAction:  String(parsed.oneMonthAction  ?? ''),
    createdAt: new Date(),
    imageUrls: [],
  };

  // ── 7. Save to Firestore (non-fatal, 5 s timeout) ─────────────────
  // Dynamic import so Firebase init errors don't crash the whole route.
  let id = `local_${Date.now()}`;
  try {
    const { saveDiagnosisResult } = await import('@/lib/firestore');
    id = await Promise.race([
      saveDiagnosisResult(diagnosisData),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('Firestore timeout')), 5000)
      ),
    ]);
  } catch (err: any) {
    // Firestore failure is logged but does NOT block the diagnosis result.
    console.error('[diagnose] Firestore save failed (non-fatal):', err?.message);
  }

  return NextResponse.json({ id, ...diagnosisData, imageUrls: validUrls });
}
