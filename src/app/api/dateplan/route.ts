import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { buildDatePlanSystemPrompt, buildDatePlanUserPrompt } from '@/prompts/dateplan';
import { saveDatePlan } from '@/lib/firestore';
import type { DatePlanRequest, DatePlan } from '@/types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body: DatePlanRequest = await req.json();
    const { userProfile, area, budget, timeSlot, isFirstDate, partnerDescription } = body;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: buildDatePlanSystemPrompt() },
        {
          role: 'user',
          content: buildDatePlanUserPrompt(
            userProfile,
            area,
            budget,
            timeSlot,
            isFirstDate,
            partnerDescription
          ),
        },
      ],
      temperature: 0.8,
      max_tokens: 3000,
    });

    const content = completion.choices[0]?.message?.content ?? '';
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) ??
                      content.match(/\{[\s\S]*"planName"[\s\S]*\}/);

    if (!jsonMatch) throw new Error('Date plan response parsing failed');

    const parsed = JSON.parse(jsonMatch[1] ?? jsonMatch[0]);

    const data: Omit<DatePlan, 'id'> = {
      userId: userProfile.uid,
      planName: parsed.planName ?? 'デートプラン',
      area,
      totalBudget: budget,
      timeSlot,
      isFirstDate,
      partnerType: partnerDescription,
      schedule: parsed.schedule ?? [],
      conversationFlow: parsed.conversationFlow ?? '',
      ngActions: parsed.ngActions ?? [],
      invitePhrase: parsed.invitePhrase ?? '',
      rainyDayAlternative: parsed.rainyDayAlternative ?? '',
      createdAt: new Date(),
    };

    const id = await saveDatePlan(data);
    return NextResponse.json({ id, ...data });
  } catch (err: any) {
    console.error('Date plan error:', err);
    return NextResponse.json({ error: err.message ?? 'デートプランの生成に失敗しました' }, { status: 500 });
  }
}
