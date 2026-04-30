import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { buildFashionSystemPrompt, buildFashionUserPrompt } from '@/prompts/fashion';
import { getSeason, estimateTemperature } from '@/lib/utils';
import type { FashionRequest, FashionSuggestion } from '@/types';

export const maxDuration = 60;

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
  try {
    return await handleFashion(req);
  } catch (err: any) {
    console.error('[fashion] Unhandled error:', err);
    return NextResponse.json(
      { error: `予期しないエラー: ${err?.message ?? String(err)}` },
      { status: 500 }
    );
  }
}

async function handleFashion(req: NextRequest): Promise<NextResponse> {
  // 1. Parse request
  let body: FashionRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'リクエスト解析失敗' }, { status: 400 });
  }

  const { userProfile, currentDate, season, temperature, weather, dateType } = body;

  if (!userProfile) {
    return NextResponse.json({ error: 'プロフィールが必要です' }, { status: 400 });
  }

  // 2. Check API key
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OpenAI APIキーが設定されていません（環境変数未設定）' },
      { status: 500 }
    );
  }

  // 3. Call OpenAI with timeout
  let completion;
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 55_000 });
    completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: buildFashionSystemPrompt() },
        {
          role: 'user',
          content: buildFashionUserPrompt(userProfile, currentDate, season, temperature, weather, dateType),
        },
      ],
      temperature: 0.8,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    });
  } catch (err: any) {
    console.error('[fashion] OpenAI error:', err?.message, err?.status);
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

  // 4. Handle content filter / empty response
  if (finishReason === 'content_filter' || !rawContent.trim()) {
    return NextResponse.json(
      { error: 'AIがリクエストを処理できませんでした。条件を変えて再度お試しください。' },
      { status: 422 }
    );
  }

  // 5. Parse JSON response
  const parsed = parseJson(rawContent);
  if (!parsed) {
    console.error('[fashion] Parse failed. finish_reason:', finishReason, 'Content:', rawContent.slice(0, 300));
    const errMsg = finishReason === 'length'
      ? 'AI応答が長すぎて切れました。再度お試しください。'
      : 'AIの返答を解析できませんでした。再度お試しください。';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }

  const data: Omit<FashionSuggestion, 'id'> = {
    userId: userProfile.uid ?? '',
    season,
    temperature: String(temperature),
    weather,
    dateType,
    plans: Array.isArray(parsed.plans) ? parsed.plans : [],
    createdAt: new Date(),
  };

  // 6. Save to Firestore (non-fatal, 5s timeout)
  let id = `local_${Date.now()}`;
  try {
    const { saveFashionSuggestion } = await import('@/lib/firestore');
    id = await Promise.race([
      saveFashionSuggestion(data),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('Firestore timeout')), 5000)
      ),
    ]);
  } catch (err: any) {
    console.error('[fashion] Firestore save failed (non-fatal):', err?.message);
  }

  return NextResponse.json({ id, ...data });
}
