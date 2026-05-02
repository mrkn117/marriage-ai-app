import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { buildDiagnosisSystemPrompt, buildDiagnosisUserPrompt } from '@/prompts/diagnosis';
import type { DiagnoseRequest, DiagnosisResult, DiagnosisScores } from '@/types';

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

// Fallback prompt used when primary prompt triggers content filter
function buildFallbackSystemPrompt(): string {
  return `You are a JSON data processor. Analyze photos and return structured data.
Output only valid JSON. No explanation needed.`;
}

function buildFallbackUserPrompt(imageCount: number): string {
  return `Analyze ${imageCount} photo(s) of a person. Return impression analysis as JSON:
{
  "scores": {
    "firstImpression": <int 0-20>,
    "cleanliness": <int 0-15>,
    "expression": <int 0-15>,
    "postureAndBody": <int 0-20>,
    "profileBalance": <int 0-15>,
    "overallImpression": <int 0-15>,
    "total": <sum>
  },
  "harshEvaluation": "<200字以内の総評（日本語）>",
  "strengths": "<良い点（日本語）>",
  "weaknesses": "<改善点（日本語）>",
  "socialImpression": "<対人的な印象（日本語）>",
  "improvementPriority": ["1位: ...", "2位: ...", "3位: ..."],
  "thisWeekAction": "<今週できる行動（日本語）>",
  "oneMonthAction": "<1ヶ月以内の行動（日本語）>"
}`;
}

async function callVisionAPI(
  openai: OpenAI,
  systemPrompt: string,
  userText: string,
  validUrls: string[],
): Promise<OpenAI.Chat.ChatCompletion> {
  return openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'text', text: userText },
          ...validUrls.map((url) => ({
            type: 'image_url' as const,
            image_url: { url, detail: 'auto' as const },
          })),
        ],
      },
    ],
    temperature: 0.7,
    max_tokens: 2500,
    response_format: { type: 'json_object' },
  });
}

export async function POST(req: NextRequest) {
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

  // ── 3. Check API key ──────────────────────────────────────────────
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI APIキーが設定されていません（環境変数未設定）' }, { status: 500 });
  }

  // ── 4. First OpenAI call (20s timeout) ───────────────────────────
  let rawContent = '';
  let finishReason: string | null = null;

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 20_000 });
    const completion = await callVisionAPI(
      openai,
      buildDiagnosisSystemPrompt(),
      buildDiagnosisUserPrompt(userProfile, validUrls, currentDate),
      validUrls,
    );
    rawContent = completion.choices[0]?.message?.content ?? '';
    finishReason = completion.choices[0]?.finish_reason ?? null;
    console.log('[diagnose] First attempt finish_reason:', finishReason, 'content_length:', rawContent.length);
  } catch (err: any) {
    const msg = err?.message ?? '';
    const isTimeout = msg.includes('timeout') || msg.includes('timed out') || err?.status === 408;
    if (!isTimeout) {
      console.error('[diagnose] First attempt OpenAI error:', msg);
      return NextResponse.json(
        { error: `AI呼び出し失敗: ${msg}` },
        { status: 500 }
      );
    }
    // On timeout, fall through to retry
    console.warn('[diagnose] First attempt timed out, retrying...');
  }

  // ── 5. Retry with fallback prompt if filtered/empty/timed-out ────
  const needsRetry = finishReason === 'content_filter' || !rawContent.trim();
  if (needsRetry) {
    console.warn('[diagnose] Retrying with fallback prompt. finishReason:', finishReason);
    try {
      const openai2 = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 30_000 });
      const retry = await callVisionAPI(
        openai2,
        buildFallbackSystemPrompt(),
        buildFallbackUserPrompt(validUrls.length),
        validUrls,
      );
      rawContent = retry.choices[0]?.message?.content ?? '';
      finishReason = retry.choices[0]?.finish_reason ?? null;
      console.log('[diagnose] Retry finish_reason:', finishReason, 'content_length:', rawContent.length);
    } catch (retryErr: any) {
      console.error('[diagnose] Retry also failed:', retryErr?.message);
      const msg = retryErr?.message ?? '';
      const isTimeout = msg.includes('timeout') || msg.includes('timed out');
      return NextResponse.json(
        { error: isTimeout ? 'AIの応答がタイムアウトしました。再度お試しください。' : '写真の処理に失敗しました。明るい場所・単色背景で撮り直してください。' },
        { status: 500 }
      );
    }
  }

  // ── 6. Final check on response ────────────────────────────────────
  if (finishReason === 'content_filter') {
    return NextResponse.json(
      { error: '写真の処理を完了できませんでした。正面向き・明るい場所・白や灰色の背景で撮り直してください。' },
      { status: 422 }
    );
  }
  if (!rawContent.trim()) {
    return NextResponse.json(
      { error: 'AIの応答が空でした。しばらく後にもう一度お試しください。' },
      { status: 422 }
    );
  }
  if (finishReason === 'length') {
    console.warn('[diagnose] Response truncated. Raw:', rawContent.slice(0, 200));
  }

  // ── 7. Parse JSON response ────────────────────────────────────────
  const parsed = parseJson(rawContent);
  if (!parsed) {
    console.error('[diagnose] Parse failed. finish_reason:', finishReason, 'Content:', rawContent.slice(0, 300));
    const errMsg = finishReason === 'length'
      ? 'AI応答が長すぎて切れました。再度お試しください。'
      : 'AIの返答を解析できませんでした。再度お試しください。';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }

  // ── 8. Build normalized scores ────────────────────────────────────
  const scores: DiagnosisScores = {
    firstImpression: Math.min(20, Math.max(0, Number(parsed.scores?.firstImpression) || 10)),
    cleanliness:     Math.min(15, Math.max(0, Number(parsed.scores?.cleanliness)     || 8)),
    expression:      Math.min(15, Math.max(0, Number(parsed.scores?.expression)      || 8)),
    postureAndBody:  Math.min(20, Math.max(0, Number(parsed.scores?.postureAndBody)  || 10)),
    profileBalance:  Math.min(15, Math.max(0, Number(parsed.scores?.profileBalance)  || 8)),
    overallImpression: Math.min(15, Math.max(0, Number(parsed.scores?.overallImpression) || 8)),
    total: 0,
  };
  scores.total =
    scores.firstImpression + scores.cleanliness + scores.expression +
    scores.postureAndBody + scores.profileBalance + scores.overallImpression;

  const diagnosisData: Omit<DiagnosisResult, 'id'> = {
    userId: userProfile.uid ?? '',
    scores,
    harshEvaluation: String(parsed.harshEvaluation ?? ''),
    strengths:       String(parsed.strengths       ?? ''),
    weaknesses:      String(parsed.weaknesses      ?? ''),
    socialImpression: String(parsed.socialImpression ?? ''),
    improvementPriority: Array.isArray(parsed.improvementPriority)
      ? parsed.improvementPriority.map(String)
      : [],
    thisWeekAction:  String(parsed.thisWeekAction  ?? ''),
    oneMonthAction:  String(parsed.oneMonthAction  ?? ''),
    createdAt: new Date(),
    imageUrls: [],
  };

  // ── 9. Save to Firestore (non-fatal, 5s timeout) ──────────────────
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
    console.error('[diagnose] Firestore save failed (non-fatal):', err?.message);
  }

  return NextResponse.json({ id, ...diagnosisData });
}
