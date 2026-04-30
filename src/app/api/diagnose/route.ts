import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { buildDiagnosisSystemPrompt, buildDiagnosisUserPrompt } from '@/prompts/diagnosis';
import { saveDiagnosisResult } from '@/lib/firestore';
import type { DiagnoseRequest, DiagnosisResult, DiagnosisScores } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const body: DiagnoseRequest = await req.json();
    const { userProfile, imageUrls, currentDate } = body;

    if (!imageUrls || imageUrls.length === 0) {
      return NextResponse.json({ error: '画像が必要です' }, { status: 400 });
    }
    if (!userProfile) {
      return NextResponse.json({ error: 'プロフィールが必要です' }, { status: 400 });
    }
    // Ensure all image URLs are valid data URLs or https URLs
    const validImageUrls = imageUrls.filter(
      (url) => url.startsWith('data:image/') || url.startsWith('https://')
    );
    if (validImageUrls.length === 0) {
      return NextResponse.json({ error: '有効な画像がありません' }, { status: 400 });
    }

    // Build vision messages with image URLs
    const imageMessages = validImageUrls.map((url) => ({
      type: 'image_url' as const,
      image_url: { url, detail: 'high' as const },
    }));

    const userText = buildDiagnosisUserPrompt(userProfile, validImageUrls, currentDate);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: buildDiagnosisSystemPrompt(),
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: userText },
            ...imageMessages,
          ],
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content ?? '';

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      // fallback: extract JSON block if present
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) ??
                        content.match(/\{[\s\S]*"scores"[\s\S]*\}/);
      if (!jsonMatch) throw new Error('AI response parsing failed');
      parsed = JSON.parse(jsonMatch[1] ?? jsonMatch[0]);
    }

    // Validate and normalize scores
    const scores: DiagnosisScores = {
      firstImpression: Math.min(20, Math.max(0, parsed.scores?.firstImpression ?? 10)),
      cleanliness: Math.min(15, Math.max(0, parsed.scores?.cleanliness ?? 8)),
      expression: Math.min(15, Math.max(0, parsed.scores?.expression ?? 8)),
      postureAndBody: Math.min(20, Math.max(0, parsed.scores?.postureAndBody ?? 10)),
      profileBalance: Math.min(15, Math.max(0, parsed.scores?.profileBalance ?? 8)),
      marketValue: Math.min(15, Math.max(0, parsed.scores?.marketValue ?? 8)),
      total: 0,
    };
    scores.total = Object.values(scores).reduce((a, b) => a + b, 0) - scores.total;

    const diagnosisData: Omit<DiagnosisResult, 'id'> = {
      userId: userProfile.uid,
      scores,
      harshEvaluation: parsed.harshEvaluation ?? '',
      strengths: parsed.strengths ?? '',
      weaknesses: parsed.weaknesses ?? '',
      marketView: parsed.marketView ?? '',
      improvementPriority: Array.isArray(parsed.improvementPriority) ? parsed.improvementPriority : [],
      thisWeekAction: parsed.thisWeekAction ?? '',
      oneMonthAction: parsed.oneMonthAction ?? '',
      createdAt: new Date(),
      imageUrls: [],  // base64 URLs are too large for Firestore; store empty
    };

    const id = await saveDiagnosisResult(diagnosisData);

    // Return imageUrls in response (for in-memory display) but don't persist base64 to Firestore
    return NextResponse.json({ id, ...diagnosisData, imageUrls: validImageUrls });
  } catch (err: any) {
    console.error('Diagnosis error:', err);
    return NextResponse.json(
      { error: err.message ?? '診断に失敗しました' },
      { status: 500 }
    );
  }
}
