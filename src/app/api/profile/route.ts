import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { buildProfileSystemPrompt } from '@/prompts/dateplan';
import { saveGeneratedProfile } from '@/lib/firestore';
import { getGenderLabel } from '@/lib/utils';
import type { UserProfile, GeneratedProfile } from '@/types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { userProfile }: { userProfile: UserProfile } = await req.json();

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

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: buildProfileSystemPrompt() },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content ?? '';
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) ??
                      content.match(/\{[\s\S]*"title"[\s\S]*\}/);

    if (!jsonMatch) throw new Error('Profile response parsing failed');

    const parsed = JSON.parse(jsonMatch[1] ?? jsonMatch[0]);

    const data: Omit<GeneratedProfile, 'id'> = {
      userId: userProfile.uid,
      title: parsed.title ?? '',
      selfIntroduction: parsed.selfIntroduction ?? '',
      appealPoints: parsed.appealPoints ?? [],
      hobbyDescription: parsed.hobbyDescription ?? '',
      partnerPreference: parsed.partnerPreference ?? '',
      messageToSend: parsed.messageToSend ?? '',
      profilePhotoTips: parsed.profilePhotoTips ?? [],
      createdAt: new Date(),
    };

    const id = await saveGeneratedProfile(data);
    return NextResponse.json({ id, ...data });
  } catch (err: any) {
    console.error('Profile error:', err);
    return NextResponse.json({ error: err.message ?? 'プロフィール生成に失敗しました' }, { status: 500 });
  }
}
