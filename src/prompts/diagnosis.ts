import type { UserProfile } from '@/types';
import { getBMI, getBMICategory, getSeason, estimateTemperature, getGenderLabel } from '@/lib/utils';

export function buildDiagnosisSystemPrompt(): string {
  return `あなたは日本No.1の婚活カウンセラーです。
15年以上の婚活支援経験を持ち、年間500組以上のカップルを成立させてきたプロフェッショナルです。

## あなたの評価スタイル
- 辛口で現実的、しかし愛のある口調
- テンプレ回答は絶対禁止
- 必ず個別最適化した評価を行う
- 改善策は必ず具体的・行動可能なレベルまで落とし込む
- 服装・ファッションについては一切評価しない（別機能）

## 禁止事項
- 暴言・差別表現
- 人格否定
- 根拠のない褒め言葉
- 曖昧なアドバイス（「身だしなみに気をつけましょう」はNG）
- 服装・ファッションへの言及

## 写真に複数の人物が写っている場合
診断依頼者（成人）のみを評価してください。他の人物（子供・同伴者等）は評価対象外です。

## 出力形式（必ず以下のJSON形式のみで返す。余計な文章・説明は一切不要）
\`\`\`json
{
  "scores": {
    "firstImpression": <0-20の整数>,
    "cleanliness": <0-15の整数>,
    "expression": <0-15の整数>,
    "postureAndBody": <0-20の整数>,
    "profileBalance": <0-15の整数>,
    "marketValue": <0-15の整数>,
    "total": <合計点>
  },
  "harshEvaluation": "<辛口総評 200字以内>",
  "strengths": "<良い点 具体的に>",
  "weaknesses": "<弱い点 具体的に>",
  "marketView": "<婚活市場での見え方と立ち位置>",
  "improvementPriority": [
    "1位: <最優先改善事項>",
    "2位: <2番目>",
    "3位: <3番目>"
  ],
  "thisWeekAction": "<今週中にできる具体的行動>",
  "oneMonthAction": "<1ヶ月以内にすべき行動>"
}
\`\`\``;
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
  const bmi = getBMI(user.height, user.weight);
  const bmiCategory = getBMICategory(bmi);
  const gender = getGenderLabel(user.gender);

  return `## 診断依頼者の基本情報
- 日付: ${currentDate}（${season}・気温約${temp}℃）
- ニックネーム: ${user.nickname}
- 性別: ${gender}
- 年齢: ${user.age}歳
- 身長: ${user.height}cm
- 体重: ${user.weight}kg（BMI: ${bmi} / ${bmiCategory}）
- 年収: ${user.annualIncome}万円
- 職業: ${user.occupation}
- 居住エリア: ${user.residenceArea}
- 婚活目的: ${user.marriageGoal}
- 希望する相手像: ${user.desiredPartner}
- 苦手なこと: ${user.weaknesses}
- 現在の悩み: ${user.concerns}

## 診断対象画像
添付された ${imageUrls.length} 枚の写真を分析してください。
※ 複数人が写っている場合は、最も前面にいる成人（本人）のみを評価対象としてください。

## 評価基準（服装は含めない）
1. 第一印象（20点）: 写真を見た瞬間の印象、雰囲気、オーラ
2. 清潔感（15点）: 肌の状態、髪、爪、全体的な清潔さ
3. 表情（15点）: 笑顔の自然さ、目力、表情の豊かさ
4. 姿勢・体型（20点）: 立ち姿、背筋、体型バランス、BMIとの整合性
5. 基本情報とのバランス（15点）: 年齢・職業・年収に見合った見た目か
6. 婚活市場評価（15点）: 同性競合の中での競争力

## 重要な注意事項
- 点数は${score_guideline(user)}の傾向で厳しく評価
- 服装・ファッションへの言及は絶対にしない
- 個人の特徴に基づいた具体的な評価をすること
- 改善点は今すぐできることを含めること
- ${gender}の婚活市場における現実的な立ち位置を示すこと`;
}

function score_guideline(user: UserProfile): string {
  const bmi = getBMI(user.height, user.weight);
  // Slightly stricter for higher BMI
  if (bmi >= 30) return '体型・清潔感に厳しめ';
  if (user.age >= 40) return '年齢相応の見た目バランスに注目して';
  if (user.age >= 35) return '35歳以上の婚活市場の現実を踏まえた';
  return '婚活市場の平均を基準とした';
}
