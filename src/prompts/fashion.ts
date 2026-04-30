import type { UserProfile } from '@/types';
import { getSeason, estimateTemperature, getGenderLabel, formatCurrency } from '@/lib/utils';

export function buildFashionSystemPrompt(): string {
  return `あなたは婚活専門のプロスタイリストです。
婚活市場において相手に好印象を与えるファッション提案を行います。

## 重要ルール
- 季節・気温・天気・デート内容・予算・相手の雰囲気に応じて毎回違う提案をする
- テンプレ提案は禁止
- 実際に購入できる具体的な商品を提案する
- URLは実在する可能性が高いページを示す（ZARA、UNIQLO等の実在ブランド）
- 予算内で最大効果を出す提案

## 出力形式（必ずこのJSON形式）
\`\`\`json
{
  "plans": [
    {
      "type": "high-brand",
      "label": "ハイブランドプラン",
      "items": [
        {
          "name": "<商品名>",
          "brand": "<ブランド名>",
          "price": <価格(円)>,
          "url": "<ブランド公式サイトのURL>",
          "reason": "<このアイテムを選んだ理由>",
          "category": "<トップス/ボトムス/シューズ/アクセサリー等>"
        }
      ],
      "totalPrice": <合計金額>,
      "impression": "<このコーデで相手に与える印象>",
      "stylingTips": "<着こなしのポイント>"
    },
    {
      "type": "cost-effective",
      "label": "コスパプラン",
      ...
    },
    {
      "type": "budget",
      "label": "節約プラン",
      ...
    }
  ]
}
\`\`\``;
}

export function buildFashionUserPrompt(
  user: UserProfile,
  currentDate: string,
  season: string,
  temperature: number,
  weather: string,
  dateType: string
): string {
  const gender = getGenderLabel(user.gender);
  const fashionBudget = user.fashionBudget ?? 20000;
  const budgets = {
    'high-brand': fashionBudget * 3,
    'cost-effective': fashionBudget,
    budget: Math.round(fashionBudget * 0.4),
  };

  return `## 対象者情報
- 性別: ${gender}
- 年齢: ${user.age}歳
- 身長: ${user.height}cm
- 居住エリア: ${user.residenceArea}
- 希望する相手像: ${user.desiredPartner}
- 服の好み: ${user.fashionStyle}
- 通常ファッション予算: ${formatCurrency(fashionBudget)}

## デート条件
- 日付: ${currentDate}（${season}）
- 気温: ${temperature}℃
- 天気: ${weather}
- デートタイプ: ${dateType}
- デートエリア: ${user.dateArea}
- デート時間帯: ${user.dateTimeSlot}

## 予算設定
- ハイブランドプラン: ${formatCurrency(budgets['high-brand'])}まで
- コスパプラン: ${formatCurrency(budgets['cost-effective'])}まで
- 節約プラン: ${formatCurrency(budgets.budget)}まで

## 提案要件
1. 上記3プランをそれぞれ提案すること
2. 各プランは上下4-5アイテム（トップス・ボトムス・シューズ・アウター・アクセサリー等）
3. 婚活デートに適した清潔感・好印象重視
4. ${season}の気温${temperature}℃に適した季節感
5. ${gender}が異性に好印象を与えるスタイリング
6. 実在するブランドの実際の商品ライン
7. 合計金額を各プランで明示`;
}
