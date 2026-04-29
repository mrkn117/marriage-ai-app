import React from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-dark-900 pt-20 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> トップへ戻る
        </Link>
        <div className="flex items-center gap-3 mb-8">
          <AlertTriangle className="w-8 h-8 text-amber-400" />
          <h1 className="text-2xl font-bold text-white">免責事項</h1>
        </div>
        <div className="glass rounded-2xl p-8 text-white/70 text-sm leading-relaxed space-y-6">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <p className="text-amber-300 font-medium">重要なお知らせ</p>
            <p className="text-amber-400/80 text-sm mt-1">本サービスのAI診断結果は参考情報であり、結婚・交際の成否を保証するものではありません。</p>
          </div>
          <section>
            <h2 className="text-white font-semibold mb-2">AI診断の限界</h2>
            <p>AIによる分析は統計的・一般的な傾向に基づくものです。個人の魅力・内面・相性等、写真や情報では判断できない要素は含まれません。</p>
          </section>
          <section>
            <h2 className="text-white font-semibold mb-2">評価の客観性について</h2>
            <p>診断評価はAIモデルの判断によるものであり、特定の価値観・基準に基づきます。すべての人に同様の基準が適用されるわけではありません。</p>
          </section>
          <section>
            <h2 className="text-white font-semibold mb-2">精神的影響について</h2>
            <p>辛口評価がメンタルに影響を与える可能性があります。自身の状態を考慮した上でご利用ください。診断結果により精神的に不安定になった場合は、専門家へのご相談をお勧めします。</p>
          </section>
          <section>
            <h2 className="text-white font-semibold mb-2">サービス提供者の責任</h2>
            <p>本サービスの利用により生じた損害・トラブルについて、サービス提供者は一切の責任を負いません。</p>
          </section>
          <p className="text-white/30 text-xs">最終更新日：2024年1月1日</p>
        </div>
      </div>
    </div>
  );
}
