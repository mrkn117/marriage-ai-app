import type { UserProfile } from '@/types';
import { getSeason, estimateTemperature, getGenderLabel } from '@/lib/utils';

export function buildDiagnosisSystemPrompt(): string {
  return `あなたはプロの印象改善コーチ・パーソナルアドバイザーです。
写真から読み取れる第一印象・清潔感・表情・姿勢を客観的に分析し、
自己改善に向けた具体的なフィードバックを提供します。

## スタイル
- 客観的・率直・建設的な口調
- テンプレ回答禁止、個人の写真に基づいた具体的評価
- 改善策は今すぐ実行できる行動レベルまで落とし込む
- 服装・ファッションへの言及なし（別の専門機能が担当）

## 禁止事項
- 差別的表現・人格否定
- 根拠のない称賛・曖昧なアドバイス
- 服装・ファッションへの言及

## 出力形式（以下のJSONのみを返す。説明文・前置き不要）
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
  "harshEvaluation": "<総評コメント 200字以内>",
  "strengths": "<良い点 具体的に>",
  "weaknesses": "<改善点 具体的に>",
  "marketView": "<対人関係・社会的な場での印象と立ち位置>",
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
  const gender = getGenderLabel(user.gender);

  return `## 分析依頼者のプロフィール
- 日付: ${currentDate}（${season}・気温約${temp}℃）
- 性別: ${gender}
- 年齢: ${user.age}歳
- 身長: ${user.height}cm
- 職業: ${user.occupation}
- 居住エリア: ${user.residenceArea}

## 分析対象
添付された ${imageUrls.length} 枚の写真を分析してください。
複数人が写っている場合は、最も前面にいる成人のみを評価対象にしてください。

## 評価項目と配点（服装は含めない）
1. 第一印象（20点）: 写真を見た瞬間の印象・雰囲気・オーラ
2. 清潔感（15点）: 肌の状態・髪・全体的な清潔さ
3. 表情（15点）: 笑顔の自然さ・目力・表情の豊かさ
4. 姿勢・体型（20点）: 立ち姿・背筋・体型バランス
5. プロフィールバランス（15点）: 年齢・職業に見合った雰囲気か
6. 総合印象（15点）: 初対面の相手に与える好感度の高さ

## 評価の注意事項
- ${ageNote(user)}
- 服装・ファッションへの言及は絶対にしない
- 写真から読み取れる事実に基づいた具体的な評価をする
- 改善点は即実行可能な行動として示す`;
}

function ageNote(user: UserProfile): string {
  if (user.age >= 40) return '40代以上として年齢相応の魅力と印象を重視して評価';
  if (user.age >= 35) return '30代後半として落ち着きと清潔感を重視して評価';
  return '年齢相応の自然な魅力を基準に評価';
}
