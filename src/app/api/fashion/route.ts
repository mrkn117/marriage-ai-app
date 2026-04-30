import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { buildFashionSystemPrompt, buildFashionUserPrompt } from '@/prompts/fashion';
import { saveFashionSuggestion } from '@/lib/firestore';
import { getSeason, estimateTemperature } from '@/lib/utils';
import type { FashionRequest, FashionSuggestion } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const body: FashionRequest = await req.json();
    const { userProfile, currentDate, season, temperature, weather, dateType } = body;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: buildFashionSystemPrompt() },
        {
          role: 'user',
          content: buildFashionUserPrompt(
            userProfile,
            currentDate,
            season,
            temperature,
            weather,
            dateType
          ),
        },
      ],
      temperature: 0.8,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content ?? '';
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) ??
                        content.match(/\{[\s\S]*"plans"[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Fashion response parsing failed');
      parsed = JSON.parse(jsonMatch[1] ?? jsonMatch[0]);
    }

    const data: Omit<FashionSuggestion, 'id'> = {
      userId: userProfile.uid,
      season,
      temperature: String(temperature),
      weather,
      dateType,
      plans: parsed.plans ?? [],
      createdAt: new Date(),
    };

    const id = await saveFashionSuggestion(data);
    return NextResponse.json({ id, ...data });
  } catch (err: any) {
    console.error('Fashion error:', err);
    return NextResponse.json({ error: err.message ?? 'ファッション提案に失敗しました' }, { status: 500 });
  }
}
