import type { UserProfile } from '@/types';
import { getSeason, estimateTemperature, getGenderLabel } from '@/lib/utils';

export function buildDiagnosisSystemPrompt(): string {
  return `You are a professional photo coach and first-impression consultant with 15 years of experience coaching dating app users.
Your task is to thoroughly analyze profile photos and provide detailed, actionable feedback on how effectively they communicate the subject's personality and presence.

Focus exclusively on:
- What the photos communicate visually (composition, lighting, background, framing, expression, posture)
- Grooming and presentation quality as visible in the photo
- Body language and confidence signals
- How well the photos would perform as social/dating profile images
- Specific, concrete improvements the person can make

Output only valid JSON matching the schema below. No preamble or explanation.
Be thorough and detailed in all text fields — each field should be multiple sentences with specific observations.
Use newlines (\\n) within text fields to separate points for readability.

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
  "harshEvaluation": "<comprehensive honest assessment of the photo set in Japanese — minimum 200 characters. Cover: overall effectiveness, strongest and weakest aspects, how a stranger would react seeing these photos for the first time, specific observations about lighting/composition/expression/posture, and the single most important thing that needs to change>",
  "strengths": "<detailed analysis of what works well — minimum 3 specific points, each on a new line starting with '・'. For each point explain WHY it works and what positive signal it sends to viewers. All in Japanese>",
  "weaknesses": "<detailed analysis of what needs improvement — minimum 3 specific points, each on a new line starting with '・'. For each point explain the specific problem, why it hurts the photo's effectiveness, and give a concrete fix. All in Japanese>",
  "socialImpression": "<detailed description of how a stranger would perceive this person from these photos alone — cover: first reaction (within 3 seconds), personality traits inferred from the photos, trustworthiness/approachability level, estimated social confidence, what type of person would be attracted vs. put off by these photos. Minimum 150 characters. All in Japanese>",
  "improvementPriority": [
    "1位: <most impactful improvement — state the action AND explain the expected outcome, in Japanese>",
    "2位: <second improvement — state the action AND explain the expected outcome, in Japanese>",
    "3位: <third improvement — state the action AND explain the expected outcome, in Japanese>",
    "4位: <fourth improvement — state the action AND explain the expected outcome, in Japanese>",
    "5位: <fifth improvement — state the action AND explain the expected outcome, in Japanese>"
  ],
  "thisWeekAction": "<specific step-by-step action plan for this week — include 2-3 concrete steps with details on HOW to execute them. All in Japanese>",
  "oneMonthAction": "<specific action plan for within one month — include 2-3 concrete steps with details on WHAT to do and WHY it will improve the photos. All in Japanese>"
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

  return `Please analyze the following ${imageUrls.length} profile photo(s) and provide a thorough, detailed photo coaching report.

Subject context:
- Season/conditions: ${season}, approx. ${temp}°C
- Gender presentation: ${gender}
- Age group: ${user.age}s
- Occupation: ${user.occupation}
- Region: ${user.residenceArea}

Evaluation criteria (do NOT comment on clothing/fashion — separate feature handles that):
1. First impression (20pts): Visual impact and immediate emotional reaction — lighting quality, background, composition, overall clarity
2. Grooming (15pts): Hair styling, skin condition, facial hair (if applicable), overall cleanliness visible in photo
3. Expression (15pts): Naturalness and warmth of smile, eye contact energy, genuine vs. forced expression, approachability
4. Body language (20pts): Posture alignment, shoulder tension vs. ease, stance confidence, physical comfort in front of camera
5. Profile suitability (15pts): How well photos match the age group, dating context, and social norms of the region
6. Overall effectiveness (15pts): How competitive this photo set is vs. typical profiles; would it get clicks/swipes?

Instructions for thoroughness:
- Write detailed, multi-sentence analysis for EVERY text field
- Be specific: mention exactly what you observe (e.g. "the lighting creates a shadow under the chin" not just "lighting is bad")
- For improvements, give actionable steps the person can actually execute
- ${ageNote(user)}
- Base all feedback strictly on what is visible in the photos
- Do NOT comment on clothing or fashion items
- Frame all feedback as professional photo coaching, not personal judgement
- All text fields must be in Japanese`;
}

function ageNote(user: UserProfile): string {
  if (user.age >= 40) return 'Emphasize maturity, confidence, and experience as positive attributes';
  if (user.age >= 35) return 'Emphasize composure, reliability, and natural confidence';
  return 'Emphasize natural energy, approachability, and authentic expression';
}
