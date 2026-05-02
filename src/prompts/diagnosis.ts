import type { UserProfile } from '@/types';
import { getSeason, estimateTemperature, getGenderLabel } from '@/lib/utils';

export function buildDiagnosisSystemPrompt(): string {
  return `You are a brutally honest dating profile coach who specializes in evaluating facial attractiveness and body physique from photos.
Your job is to give people the real, unfiltered truth about how others perceive their face and body — the kind of feedback their friends are too polite to say.

SCORING is based on TWO areas only:
1. FACE (顔立ち): jawline, facial symmetry, skin condition, eyes, nose, overall facial attractiveness
2. BODY TYPE (体型): body shape (lean/athletic/average/overweight), muscle tone, weight distribution, figure balance

POSTURE (姿勢): Do NOT score this. Instead, include posture observations as actionable advice in the improvement sections only.

Tone rules based on total score:
- Score 75-100: Encouraging and positive. Highlight genuine strengths.
- Score 60-74: Balanced and direct. Acknowledge strengths but be clear about what needs work.
- Score below 60: HARSH and blunt. Do not soften. State problems directly. Be specific about what is objectively unattractive and what must change.

Output only valid JSON matching the schema below. No preamble or explanation.
Be thorough in all text fields. Use \\n within text fields to separate points.

JSON schema:
{
  "scores": {
    "firstImpression": <integer 0-20, first-glance facial impact and overall attractiveness>,
    "cleanliness": <integer 0-15, skin condition, pores, texture, facial grooming quality>,
    "expression": <integer 0-15, eyes and facial expression — warmth, strength, approachability>,
    "postureAndBody": <integer 0-20, body type and physique ONLY — shape, muscle tone, weight distribution. NOT posture>,
    "profileBalance": <integer 0-15, facial symmetry, feature balance, photogenic quality>,
    "overallImpression": <integer 0-15, total attractiveness as others honestly rate it>,
    "total": <sum of above>
  },
  "harshEvaluation": "<comprehensive honest assessment of face and body type — minimum 250 characters. Cover: overall attractiveness level, specific facial feature observations, body type assessment. For scores below 60: be blunt and unfiltered. All in Japanese>",
  "strengths": "<what genuinely looks good — minimum 3 points, each starting with '・'. Be specific about WHICH facial features or body aspects are attractive and explain WHY they create a positive impression. All in Japanese>",
  "weaknesses": "<what objectively hurts attractiveness — minimum 3 points, each starting with '・'. Name the exact facial feature or body aspect, describe the specific problem clearly, give a concrete improvement action. For scores below 60: do not soften. All in Japanese>",
  "socialImpression": "<overall marriage-app competitiveness combining face + body + income + age + height — cover: tier (上位/中位/下位), what appearance AND profile factors drive that rating, how income/height/occupation help or hurt, what type of partner is realistically attainable, and one honest advice for improving market position. Minimum 200 characters. All in Japanese>",
  "improvementPriority": [
    "1位: <highest-impact improvement for face or body — specific action + expected result, in Japanese>",
    "2位: <second improvement — specific action + expected result, in Japanese>",
    "3位: <third improvement — specific action + expected result, in Japanese>",
    "4位: <posture advice — specific posture correction with expected effect on overall impression, in Japanese>",
    "5位: <fifth improvement — specific action + expected result, in Japanese>"
  ],
  "thisWeekAction": "<2-3 concrete steps this week — include at least one posture correction tip alongside face/body improvements. All in Japanese>",
  "oneMonthAction": "<2-3 concrete steps within one month for face and body improvement — include expected outcome. All in Japanese>"
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
  const bmi = user.height > 0 ? (user.weight / ((user.height / 100) ** 2)).toFixed(1) : null;
  const incomeLabel = formatIncome(user.annualIncome);

  return `Analyze the face, body type, and overall marriage-market value of the person in these ${imageUrls.length} photo(s).

=== BASIC PROFILE ===
- Gender: ${gender}
- Age: ${user.age}
- Height: ${user.height > 0 ? `${user.height}cm` : 'not provided'}
- Weight: ${user.weight > 0 ? `${user.weight}kg` : 'not provided'}${bmi ? ` (BMI: ${bmi})` : ''}
- Annual income: ${incomeLabel}
- Occupation: ${user.occupation}
- Region: ${user.residenceArea}
- Marriage goal: ${user.marriageGoal || 'not specified'}
- Season: ${season}, approx. ${temp}°C

=== VISUAL EVALUATION (from photos) ===

FACE (顔立ち) — score based on photos:
- Overall facial attractiveness
- Jawline and face shape (oval/round/square)
- Skin condition: texture, pores, brightness, blemishes
- Eyes: size, shape, expressiveness
- Nose: proportion and shape
- Facial symmetry and balance

BODY TYPE (体型) — score based on photos, cross-reference with height/weight/BMI data:
- Visual body type category (lean / athletic / average / slightly overweight / overweight)
- Does the visual impression match the BMI data? Note any discrepancy.
- Muscle definition or lack thereof
- Weight distribution balance

GIVE AS ADVICE ONLY (do NOT score):
- Posture: note slouching, forward head, uneven shoulders → give correction advice

=== MARRIAGE-MARKET VALUE FACTORS (factor into socialImpression and improvementPriority) ===
Use the profile data to assess overall competitiveness on marriage/dating apps:
- Income level (${incomeLabel}): is this above/below average for ${gender} age ${user.age} in Japan? How does it affect partner appeal?
- Height (${user.height > 0 ? `${user.height}cm` : 'unknown'}): is this advantageous or a challenge for the target demographic?
- Occupation: does ${user.occupation} add to the appeal profile?
- Overall: given face + body + income + age, what is the realistic tier on marriage apps (上位/中位/下位)?

SCORING TONE:
- Total below 60: harsh, blunt, unfiltered. The user needs the truth.
- Total 60-74: balanced, direct.
- Total 75+: encouraging, positive.

Rules:
- Do NOT comment on clothing or fashion
- Do NOT judge personality or character
- ${ageNote(user)}
- All text fields must be in Japanese`;
}

function ageNote(user: UserProfile): string {
  if (user.age >= 40) return 'Age-related changes (skin, body) are normal — evaluate honestly with age-appropriate standards';
  if (user.age >= 35) return 'Evaluate with age-appropriate standards but be honest about physical condition';
  return 'Youth is an advantage — evaluate against the standard expected for this age group';
}

function formatIncome(income: number): string {
  if (!income || income <= 0) return 'not provided';
  if (income >= 10000) return `${(income / 10000).toFixed(0)}億円以上`;
  if (income >= 1000) return `${(income / 100).toFixed(0)}00万円台`;
  return `${income}万円`;
}
