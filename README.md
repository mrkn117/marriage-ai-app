# 婚活AI診断アプリ

AIを活用した婚活総合サポートアプリ。写真と基本情報から婚活市場での評価を辛口診断し、具体的な改善策・季節連動の服装提案・デートプランを生成します。

## 機能一覧

| 機能 | 説明 |
|------|------|
| AI写真診断 | GPT-4oによる多角的な外見分析（服装除く） |
| 100点辛口評価 | 6項目の個別スコア＋婚活市場での立ち位置 |
| 改善優先順位 | 今週・1ヶ月以内の具体的行動提案 |
| 季節連動服装提案 | 気温・天気・デート内容に応じた3プラン |
| デートプラン生成 | 誘い文句・会話の流れ・NG行動まで完全生成 |
| プロフィール生成 | マッチングアプリ用自己紹介文の自動作成 |
| 診断履歴 | スコア推移グラフ付き全履歴管理 |
| 管理画面 | ユーザー・診断データの管理 |

---

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **AI分析**: OpenAI GPT-4o Vision API
- **認証**: Firebase Authentication (Email/Google)
- **データベース**: Firebase Firestore
- **ストレージ**: Firebase Storage
- **デプロイ**: Vercel推奨

---

## セットアップ手順

### 1. 依存関係のインストール

```bash
cd marriage-ai-app
npm install
```

### 2. Firebase プロジェクト作成

1. [Firebase Console](https://console.firebase.google.com/) でプロジェクト作成
2. 「Authentication」→ メール/パスワード・Google を有効化
3. 「Firestore Database」→ 本番モードで作成
4. 「Storage」→ 有効化
5. プロジェクト設定 → 「マイアプリ」でWebアプリを追加 → 設定値を確認

### 3. OpenAI API キー取得

1. [OpenAI Platform](https://platform.openai.com/) でAPIキー発行
2. GPT-4o の利用権限があることを確認

### 4. 環境変数の設定

```bash
cp .env.local.example .env.local
```

`.env.local` を編集して実際の値を入力：

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
OPENAI_API_KEY=sk-your_key_here
ADMIN_EMAIL=your_admin@email.com
```

### 5. Firebase セキュリティルール適用

Firestore コンソールで `config/firestore.rules` の内容をコピー＆ペースト。
Storage コンソールで `config/storage.rules` の内容をコピー＆ペースト。

Firestore の「インデックス」タブに以下の複合インデックスを追加：
- コレクション: `diagnoses`, フィールド: `userId` (昇順), `createdAt` (降順)
- コレクション: `fashion`, フィールド: `userId` (昇順), `createdAt` (降順)
- コレクション: `dateplans`, フィールド: `userId` (昇順), `createdAt` (降順)

### 6. ローカル起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開く。

---

## プロジェクト構成

```
marriage-ai-app/
├── src/
│   ├── app/
│   │   ├── page.tsx              # ランディングページ
│   │   ├── login/                # ログイン
│   │   ├── register/             # 新規登録
│   │   ├── reset-password/       # パスワードリセット
│   │   ├── dashboard/            # ダッシュボード
│   │   ├── onboarding/           # プロフィール入力（4ステップ）
│   │   ├── upload/               # 写真アップロード
│   │   ├── diagnosis/            # 診断結果表示
│   │   ├── fashion/              # 服装提案
│   │   ├── dateplan/             # デートプラン生成
│   │   ├── profile-gen/          # プロフィール文生成
│   │   ├── history/              # 診断履歴
│   │   ├── admin/                # 管理画面
│   │   ├── terms/                # 利用規約
│   │   ├── privacy/              # プライバシーポリシー
│   │   ├── disclaimer/           # 免責事項
│   │   └── api/
│   │       ├── diagnose/         # AI診断API（GPT-4o Vision）
│   │       ├── fashion/          # 服装提案API
│   │       ├── dateplan/         # デートプランAPI
│   │       ├── profile/          # プロフィール生成API
│   │       └── admin/            # 管理APIエンドポイント
│   ├── components/
│   │   ├── ui/                   # Button, Input, Card, Badge等
│   │   ├── layout/               # Header
│   │   └── auth/                 # AuthGuard
│   ├── context/
│   │   ├── AuthContext.tsx       # 認証状態管理
│   │   └── DiagnosisContext.tsx  # 診断データ状態管理
│   ├── lib/
│   │   ├── firebase.ts           # Firebase初期化
│   │   ├── firestore.ts          # Firestore CRUD操作
│   │   ├── storage.ts            # Firebase Storage操作
│   │   └── utils.ts              # ユーティリティ関数
│   ├── prompts/
│   │   ├── diagnosis.ts          # AI診断プロンプト
│   │   ├── fashion.ts            # ファッション提案プロンプト
│   │   └── dateplan.ts           # デートプラン・プロフィールプロンプト
│   └── types/
│       └── index.ts              # TypeScript型定義
├── config/
│   ├── firestore.rules           # Firestoreセキュリティルール
│   ├── storage.rules             # Storageセキュリティルール
│   └── firestore.indexes.json    # Firestoreインデックス設定
└── .env.local.example            # 環境変数テンプレート
```

---

## API一覧

### POST /api/diagnose
写真URLとユーザープロフィールから AI診断を実行

**Request Body:**
```json
{
  "userProfile": { ... },
  "imageUrls": ["https://..."],
  "currentDate": "2024-01-15"
}
```

**Response:**
```json
{
  "id": "firestore_doc_id",
  "scores": {
    "firstImpression": 15,
    "cleanliness": 12,
    "expression": 11,
    "postureAndBody": 14,
    "profileBalance": 10,
    "marketValue": 10,
    "total": 72
  },
  "harshEvaluation": "...",
  "strengths": "...",
  "weaknesses": "...",
  "marketView": "...",
  "improvementPriority": ["1位: ...", "2位: ..."],
  "thisWeekAction": "...",
  "oneMonthAction": "..."
}
```

### POST /api/fashion
季節・デート条件に合わせた服装3プランを生成

### POST /api/dateplan
エリア・予算・相手情報から完全デートプランを生成

### POST /api/profile
ユーザー情報からマッチングアプリ用プロフィールを生成

---

## DB構成（Firestore）

| コレクション | 説明 |
|------------|------|
| `users/{uid}` | ユーザープロフィール |
| `diagnoses/{id}` | 診断結果（userId, scores, 評価テキスト）|
| `fashion/{id}` | 服装提案（userId, plans配列）|
| `dateplans/{id}` | デートプラン（userId, schedule配列）|
| `profiles/{uid}/generated/{id}` | 生成プロフィール |

---

## スコアリング基準

| 項目 | 配点 |
|------|------|
| 第一印象 | 20点 |
| 清潔感 | 15点 |
| 表情 | 15点 |
| 姿勢・体型 | 20点 |
| 基本情報とのバランス | 15点 |
| 婚活市場評価 | 15点 |
| **合計** | **100点** |

| スコア | ランク | 評価 |
|--------|--------|------|
| 80点以上 | S級 | 婚活市場で有利 |
| 70〜79点 | A級 | 悪くないが改善余地あり |
| 60〜69点 | B級 | 普通・埋もれやすい |
| 50〜59点 | C級 | 平均以下・改善必須 |
| 49点以下 | D級 | 現状では厳しい |

---

## 管理方法

管理者メールアドレス（`.env.local` の `ADMIN_EMAIL`）でログインすると、ヘッダーのプロフィールメニューから管理画面へアクセスできます。

管理画面で確認できるもの：
- 総ユーザー数・総診断数
- 平均スコア・低スコアユーザー数
- 最近の診断一覧
- 登録ユーザー一覧

---

## デプロイ（Vercel推奨）

```bash
# Vercel CLIでデプロイ
npx vercel

# 環境変数をVercelダッシュボードで設定
# （.env.localの全項目をVercel Environment Variablesに追加）
```

---

## 開発継続方法

```bash
# 開発サーバー起動
npm run dev

# 型チェック
npm run type-check

# ビルド確認
npm run build
```

---

## ライセンス

MIT License
