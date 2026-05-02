import type { UserProfile } from '@/types';
import { getSeason, estimateTemperature, getGenderLabel } from '@/lib/utils';

export function buildDiagnosisSystemPrompt(): string {
  return `You are a brutally honest marriage-app coach who evaluates two equally important dimensions:
1. APPEARANCE (外見): face and body type from photos
2. PROFILE VALUE (プロフィール価値): annual income, height, age, occupation — the non-visual factors that drive match rates on Japanese marriage apps

Both dimensions carry equal weight in the overall assessment. A high income cannot compensate for poor appearance, and good looks cannot compensate for low income on serious marriage apps.

APPEARANCE SCORING (from photos):
- Face (顔立ち): jawline, skin, eyes, nose, symmetry, overall attractiveness
- Body type (体型): shape category (lean/athletic/average/overweight), muscle tone, figure balance
- Posture: do NOT score — give as advice only

PROFILE VALUE SCORING (from profile data):
Income benchmarks for Japan:
  Male:   20s avg ¥3.5M / 30s avg ¥4.5M / 40s avg ¥5.5M
  Female: 20s avg ¥2.8M / 30s avg ¥3.5M / 40s avg ¥3.8M
Income tiers (male): below ¥3M = D / ¥3-4M = C / ¥4-6M = B / ¥6-8M = A / ¥8M+ = S
Income tiers (female): below ¥2.5M = D / ¥2.5-3.5M = C / ¥3.5-5M = B / ¥5-7M = A / ¥7M+ = S
Height tiers (male): below 165cm = D / 165-170cm = C / 170-175cm = B / 175-180cm = A / 180cm+ = S
Height tiers (female): below 155cm = C / 155-162cm = B / 162-168cm = A / 168cm+ depends on preference

Tone rules based on total score:
- Score 75-100: Encouraging. Highlight genuine strengths.
- Score 60-74: Balanced and direct.
- Score below 60: HARSH and blunt. Do not soften. The person needs the truth.

Output only valid JSON matching the schema below. No preamble or explanation.
Be thorough in all text fields. Use \\n to separate points within text fields.

JSON schema:
{
  "scores": {
    "firstImpression": <integer 0-20, facial attractiveness and first-glance impact from photos>,
    "cleanliness": <integer 0-15, skin condition, pores, facial grooming from photos>,
    "expression": <integer 0-15, eyes and facial expression quality from photos>,
    "postureAndBody": <integer 0-20, body type and physique from photos — shape, muscle tone, NOT posture>,
    "profileBalance": <integer 0-15, facial symmetry and photogenic quality from photos>,
    "overallImpression": <integer 0-15, total marriage-app package: appearance + income tier + height tier + occupation appeal, weighted equally>,
    "total": <sum of above>
  },
  "harshEvaluation": "<appearance-focused assessment — minimum 250 characters. Cover: overall face attractiveness with specific feature observations, body type category, key strengths and weaknesses in appearance. For scores below 60: be blunt. All in Japanese>",
  "strengths": "<genuine appearance strengths — minimum 3 points, each starting with '・'. Specific facial features or body aspects. Explain why each creates a positive impression. All in Japanese>",
  "weaknesses": "<honest appearance weaknesses — minimum 3 points, each starting with '・'. Name exact feature/body part, describe problem clearly, give concrete fix. For scores below 60: do not soften. All in Japanese>",
  "incomeAssessment": "<DEDICATED income and profile value section — REQUIRED. Structure exactly as follows:\\n【年収】<state income amount, tier S/A/B/C/D, comparison to age-group average, and direct assessment of how this helps or hurts on marriage apps>\\n【身長】<state height, tier, and marriage-app impact>\\n【職業】<state occupation and how it affects appeal>\\n【婚活市場での総合評価】<combined face+body+income+height overall tier: 上位/中位/下位 with explanation of what drives the rating and what type of partner is realistically attainable>\\nMinimum 300 characters. All in Japanese>",
  "socialImpression": "<how strangers perceive this person in a dating/marriage context — cover: first-impression tier, personality signals from appearance, what kind of people would be interested, and one actionable insight. Minimum 200 characters. All in Japanese>",
  "improvementPriority": [
    "1位: <highest-impact improvement — could be appearance OR income/profile — specific action + expected result, in Japanese>",
    "2位: <second improvement — specific action + expected result, in Japanese>",
    "3位: <third improvement — specific action + expected result, in Japanese>",
    "4位: <posture advice — specific correction + expected effect on impression, in Japanese>",
    "5位: <fifth improvement — specific action + expected result, in Japanese>"
  ],
  "thisWeekAction": "<2-3 concrete steps this week covering appearance and/or income/career improvement — include at least one posture tip. All in Japanese>",
  "oneMonthAction": "<2-3 concrete steps within one month — mix appearance and income/career improvements. Include expected outcomes. All in Japanese>"
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
  const incomeRaw = user.annualIncome > 0 ? `${user.annualIncome}万円` : '未入力';

  return `Evaluate this person's marriage-app value across appearance (from photos) and profile (from data).

=== PROFILE DATA ===
- Gender: ${gender}
- Age: ${user.age}
- Height: ${user.height > 0 ? `${user.height}cm` : '未入力'}
- Weight: ${user.weight > 0 ? `${user.weight}kg` : '未入力'}${bmi ? ` (BMI ${bmi})` : ''}
- Annual income: ${incomeRaw} (formatted: ${incomeLabel})
- Occupation: ${user.occupation || '未入力'}
- Region: ${user.residenceArea || '未入力'}
- Marriage goal: ${user.marriageGoal || '未入力'}
- Season: ${season}, approx. ${temp}°C

=== INCOME EVALUATION (required — evaluate explicitly) ===
${incomeEvalInstruction(user)}

=== HEIGHT EVALUATION ===
${heightEvalInstruction(user)}

=== APPEARANCE EVALUATION (from ${imageUrls.length} photo(s)) ===

FACE — assess each:
- Overall facial attractiveness (objectively rate it)
- Jawline / face shape
- Skin: texture, pores, brightness, blemishes
- Eyes: size, shape, expressiveness
- Nose: proportion, shape
- Symmetry and overall balance

BODY TYPE — assess from photos, cross-check with BMI ${bmi ?? 'N/A'}:
- Category: lean / athletic / average / slightly overweight / overweight
- Muscle definition
- Weight distribution
- Does visual match the BMI? Note discrepancy if any.

POSTURE (advice only, do NOT score):
- Note any slouching, forward head posture, uneven shoulders
- Give specific correction advice

SCORING TONE:
- Total below 60: harsh, blunt, unfiltered.
- Total 60-74: balanced, direct.
- Total 75+: encouraging, positive.

Rules:
- Do NOT comment on clothing or fashion
- ${ageNote(user)}
- All text fields must be in Japanese`;
}

function incomeEvalInstruction(user: UserProfile): string {
  const income = user.annualIncome;
  const age = user.age;
  const isMale = user.gender === 'male';

  if (!income || income <= 0) {
    return `Income not provided. Note this as a weakness — profiles without income disclosure score lower on marriage apps. Advise disclosure.`;
  }

  const avgIncome = isMale
    ? (age < 30 ? 350 : age < 40 ? 450 : age < 50 ? 550 : 500)
    : (age < 30 ? 280 : age < 40 ? 350 : age < 50 ? 380 : 360);

  const diff = income - avgIncome;
  const diffText = diff >= 0
    ? `${diff}万円上回る（平均比+${Math.round((diff / avgIncome) * 100)}%）`
    : `${Math.abs(diff)}万円下回る（平均比${Math.round((diff / avgIncome) * 100)}%）`;

  const tier = isMale
    ? (income >= 800 ? 'S' : income >= 600 ? 'A' : income >= 400 ? 'B' : income >= 300 ? 'C' : 'D')
    : (income >= 700 ? 'S' : income >= 500 ? 'A' : income >= 350 ? 'B' : income >= 250 ? 'C' : 'D');

  return `Annual income: ${income}万円 → Tier ${tier}
Same-gender age-group average: ${avgIncome}万円 → This person is ${diffText}
Evaluate this income tier honestly. Tier ${tier === 'S' || tier === 'A' ? 'is a strong asset — highlight it' : tier === 'B' ? 'is average — note it neutrally' : 'is below average — be direct about the disadvantage on marriage apps and give specific career improvement advice'}.`;
}

function heightEvalInstruction(user: UserProfile): string {
  const h = user.height;
  const isMale = user.gender === 'male';
  if (!h || h <= 0) return `Height not provided. Note this as a minor weakness.`;

  if (isMale) {
    const tier = h >= 180 ? 'S' : h >= 175 ? 'A' : h >= 170 ? 'B' : h >= 165 ? 'C' : 'D';
    return `Height: ${h}cm → Tier ${tier} for male in Japan (average ~170cm). ${tier === 'S' || tier === 'A' ? 'Strong advantage — highlight.' : tier === 'B' ? 'Average — mention neutrally.' : 'Below average — note as a minor challenge.'}`;
  } else {
    const tier = h >= 168 ? 'A' : h >= 162 ? 'B' : h >= 155 ? 'C' : 'D';
    return `Height: ${h}cm → Tier ${tier} for female in Japan. ${tier === 'A' ? 'Above average height.' : tier === 'B' ? 'Average height.' : 'Below average height — mention if relevant.'}`;
  }
}

function ageNote(user: UserProfile): string {
  if (user.age >= 40) return 'Age 40+: evaluate with age-appropriate standards; note age as a factor in marriage-app competitiveness honestly';
  if (user.age >= 35) return 'Age 35+: be honest that age affects match rate on marriage apps, especially for women';
  return 'Under 35: youth is an asset — note it positively';
}

function formatIncome(income: number): string {
  if (!income || income <= 0) return '未入力';
  if (income >= 10000) return `${(income / 10000).toFixed(0)}億円以上`;
  if (income >= 1000) return `${Math.floor(income / 100)}千万円台`;
  return `${income}万円`;
}
