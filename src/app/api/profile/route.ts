import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { buildProfileSystemPrompt } from '@/prompts/dateplan';
import { getGenderLabel } from '@/lib/utils';
import type { UserProfile, GeneratedProfile } from '@/types';

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
    return await handleProfile(req);
  } catch (err: any) {
    console.error('[profile] Unhandled error:', err);
    return NextResponse.json(
      { error: `予期しないエラー: ${err?.message ?? String(err)}` },
      { status: 500 }
    );
  }
}

async function handleProfile(req: NextRequest): Promise<NextResponse> {
  // 1. Parse request
  let userProfile: UserProfile;
  try {
    const body = await req.json();
    userProfile = body.userProfile;
  } catch {
    return NextResponse.json({ error: 'リクエスト解析失敗' }, { status: 400 });
  }

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

  const userPrompt = `## プロフィール作成依頼

### 基本情報
- 性別: ${getGenderLabel(userProfile.gender)}
- 年齢: ${userProfile.age}歳
- 職業: ${userProfile.occupation}
- 年収: ${userProfile.annualIncome}万円
- 居住エリア: ${userProfile.residenceArea}
- 身長: ${userProfile.height}cm

### 婚活情報
- 婚活目的: ${userProfile.marriageGoal}
- 希望する相手像: ${userProfile.desiredPartner}
- 苦手なこと: ${userProfile.weaknesses || '特になし'}
- 悩み: ${userProfile.concerns || '特になし'}

### デート・ライフスタイル
- よく行くエリア: ${userProfile.dateArea}
- デートスタイル: ${userProfile.dateTimeSlot}
- ファッション嗜好: ${userProfile.fashionStyle || '特になし'}

### 要件
1. マッチングアプリで使える自己紹介文（300-400字）を作成
2. 相手が「会ってみたい」と思う内容
3. 事実ベースで嘘はなし
4. 具体的なエピソード・数字を含む
5. 最初に送るメッセージ文例も含める`;

  // 3. Call OpenAI with timeout
  let completion;
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 55_000 });
    completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: buildProfileSystemPrompt() },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });
  } catch (err: any) {
    console.error('[profile] OpenAI error:', err?.message, err?.status);
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
      { error: 'AIがリクエストを処理できませんでした。再度お試しください。' },
      { status: 422 }
    );
  }

  // 5. Parse JSON response
  const parsed = parseJson(rawContent);
  if (!parsed) {
    console.error('[profile] Parse failed. finish_reason:', finishReason, 'Content:', rawContent.slice(0, 300));
    const errMsg = finishReason === 'length'
      ? 'AI応答が長すぎて切れました。再度お試しください。'
      : 'AIの返答を解析できませんでした。再度お試しください。';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }

  const data: Omit<GeneratedProfile, 'id'> = {
    userId: userProfile.uid ?? '',
    title: String(parsed.title ?? ''),
    selfIntroduction: String(parsed.selfIntroduction ?? ''),
    appealPoints: Array.isArray(parsed.appealPoints)
      ? parsed.appealPoints.map((p: any) => String(p ?? ''))
      : [],
    hobbyDescription: String(parsed.hobbyDescription ?? ''),
    partnerPreference: String(parsed.partnerPreference ?? ''),
    messageToSend: String(parsed.messageToSend ?? ''),
    profilePhotoTips: Array.isArray(parsed.profilePhotoTips)
      ? parsed.profilePhotoTips.map((t: any) => String(t ?? ''))
      : [],
    createdAt: new Date(),
  };

  // 6. Save to Firestore (non-fatal, 5s timeout)
  let id = `local_${Date.now()}`;
  try {
    const { saveGeneratedProfile } = await import('@/lib/firestore');
    id = await Promise.race([
      saveGeneratedProfile(data),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('Firestore timeout')), 5000)
      ),
    ]);
  } catch (err: any) {
    console.error('[profile] Firestore save failed (non-fatal):', err?.message);
  }

  return NextResponse.json({ id, ...data });
}
