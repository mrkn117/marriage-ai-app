import type { UserProfile } from '@/types';
import { getSeason, estimateTemperature, getGenderLabel } from '@/lib/utils';

export function buildDiagnosisSystemPrompt(): string {
  return `You are a professional photo coach and first-impression consultant.
Your task is to analyze profile photos and provide actionable feedback on how effectively they communicate the subject's personality and presence.

Focus exclusively on:
- What the photos communicate visually (composition, lighting, expression, posture)
- Grooming and presentation quality as visible in the photo
- Body language and confidence signals
- How well the photos would perform as social profile images

Output only valid JSON matching the schema below. No preamble or explanation.

JSON schema:
{
  "scores": {
    "firstImpression": <integer 0-20, photo's immediate visual impact>,
    "cleanliness": <integer 0-15, grooming and presentation quality>,
    "expression": <integer 0-15, expressiveness and warmth communicated>,
    "postureAndBody": <integer 0-20, confidence and body language signals>,
    "profileBalance": <integer 0-15, age-appropriate presentation>,
    "overallImpression": <integer 0-15, overall photo effectiveness>,
    "total": <sum of above>
  },
  "harshEvaluation": "<objective analysis in Japanese, max 200 chars>",
  "strengths": "<specific positive aspects visible in the photos, in Japanese>",
  "weaknesses": "<specific areas for improvement, in Japanese>",
  "socialImpression": "<how this photo set would be perceived in social contexts, in Japanese>",
  "improvementPriority": [
    "1位: <top improvement action, in Japanese>",
    "2位: <second improvement action, in Japanese>",
    "3位: <third improvement action, in Japanese>"
  ],
  "thisWeekAction": "<one concrete action achievable this week, in Japanese>",
  "oneMonthAction": "<one concrete action achievable within a month, in Japanese>"
}`;
}

export function buildDiagnosisUserPrompt(
  user: UserProfile,
  imageUrls: string[],
  currentDate: string
): string {
  const date = new Date(currentDate);
  const month = date.getMonth() + 1;
  const season = getSeason(month);
  const temp = estimateTemperature(month);
  const gender = getGenderLabel(user.gender);

  return `Please analyze the following ${imageUrls.length} profile photo(s) and provide a photo coaching report.

Subject context:
- Season/conditions: ${season}, approx. ${temp}°C
- Gender presentation: ${gender}
- Age group: ${user.age}s
- Occupation: ${user.occupation}
- Region: ${user.residenceArea}

Evaluation criteria (do NOT comment on clothing/fashion — separate feature handles that):
1. First impression (20pts): Visual impact and overall presence in the photo
2. Grooming (15pts): Hair, skin care, and presentation quality visible in photo
3. Expression (15pts): Naturalness of smile, eye contact energy, emotional warmth
4. Body language (20pts): Posture, stance confidence, physical ease
5. Profile suitability (15pts): How well photos match the age group and social context
6. Overall effectiveness (15pts): How well this photo set would work for social profiles

Important:
- Base all feedback strictly on what is visible in the photos
- ${ageNote(user)}
- Do not comment on clothing or fashion items
- Frame all feedback as photo coaching advice, not personal judgement
- All text fields must be in Japanese`;
}

function ageNote(user: UserProfile): string {
  if (user.age >= 40) return 'Emphasize maturity, confidence, and experience as positive attributes';
  if (user.age >= 35) return 'Emphasize composure, reliability, and natural confidence';
  return 'Emphasize natural energy, approachability, and authentic expression';
}
