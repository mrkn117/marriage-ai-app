import React from 'react';
import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-dark-900 pt-20 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> トップへ戻る
        </Link>
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-primary-400" />
          <h1 className="text-2xl font-bold text-white">利用規約</h1>
        </div>
        <div className="glass rounded-2xl p-8 prose prose-invert max-w-none text-white/70 text-sm leading-relaxed space-y-6">
          <section>
            <h2 className="text-white font-semibold text-lg mb-2">第1条（サービスの目的）</h2>
            <p>本サービス「婚活AI診断」（以下「本サービス」）は、AIを活用した婚活サポートを提供することを目的とします。提供する情報は参考情報であり、結果を保証するものではありません。</p>
          </section>
          <section>
            <h2 className="text-white font-semibold text-lg mb-2">第2条（禁止事項）</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>他人の画像・個人情報を無断で使用すること</li>
              <li>本サービスの不正利用・システムへの攻撃</li>
              <li>虚偽の情報の入力</li>
              <li>商業目的での無断利用</li>
              <li>18歳未満による利用</li>
            </ul>
          </section>
          <section>
            <h2 className="text-white font-semibold text-lg mb-2">第3条（個人情報の取扱い）</h2>
            <p>ユーザーが入力した個人情報・画像は、AI診断サービスの提供のみに使用します。第三者への提供は行いません。詳細はプライバシーポリシーをご確認ください。</p>
          </section>
          <section>
            <h2 className="text-white font-semibold text-lg mb-2">第4条（免責事項）</h2>
            <p>AI診断結果はあくまで参考情報です。実際の婚活の成果を保証するものではありません。診断結果による判断はユーザー自身の責任において行ってください。</p>
          </section>
          <section>
            <h2 className="text-white font-semibold text-lg mb-2">第5条（サービスの変更・停止）</h2>
            <p>本サービスは予告なく内容の変更・停止をする場合があります。</p>
          </section>
          <p className="text-white/30 text-xs">最終更新日：2024年1月1日</p>
        </div>
      </div>
    </div>
  );
}
