import React from 'react';
import Link from 'next/link';
import { Lock, ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-dark-900 pt-20 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> トップへ戻る
        </Link>
        <div className="flex items-center gap-3 mb-8">
          <Lock className="w-8 h-8 text-primary-400" />
          <h1 className="text-2xl font-bold text-white">プライバシーポリシー</h1>
        </div>
        <div className="glass rounded-2xl p-8 text-white/70 text-sm leading-relaxed space-y-6">
          <section>
            <h2 className="text-white font-semibold text-lg mb-2">収集する情報</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>メールアドレス（認証用）</li>
              <li>プロフィール情報（年齢・職業・年収等）</li>
              <li>アップロードした写真（診断目的のみ）</li>
              <li>診断結果・利用履歴</li>
            </ul>
          </section>
          <section>
            <h2 className="text-white font-semibold text-lg mb-2">情報の利用目的</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>AI診断サービスの提供</li>
              <li>個別最適化されたアドバイスの生成</li>
              <li>サービス改善のための統計分析</li>
            </ul>
          </section>
          <section>
            <h2 className="text-white font-semibold text-lg mb-2">データの保管・セキュリティ</h2>
            <p>Firebase（Google Cloud）を使用して暗号化されたデータを保管します。画像データは診断完了後も保持しますが、アカウント削除時にすべて削除されます。</p>
          </section>
          <section>
            <h2 className="text-white font-semibold text-lg mb-2">第三者への提供</h2>
            <p>AI分析のためOpenAI APIを使用します。アップロードされた画像はOpenAIの利用規約に従って処理されます。それ以外の第三者への個人情報の提供は行いません。</p>
          </section>
          <section>
            <h2 className="text-white font-semibold text-lg mb-2">データの削除</h2>
            <p>プロフィール設定画面からアカウントを削除すると、すべての個人情報・写真・診断結果が完全に削除されます。</p>
          </section>
          <p className="text-white/30 text-xs">最終更新日：2024年1月1日</p>
        </div>
      </div>
    </div>
  );
}
