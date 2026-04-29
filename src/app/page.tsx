'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Heart,
  Camera,
  Star,
  Shirt,
  MapPin,
  ArrowRight,
  Zap,
  Shield,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

const features = [
  {
    icon: Camera,
    title: 'AI写真診断',
    description: '顔・全身・横・後ろ姿を多角的に分析。婚活市場での第一印象を数値化。',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: Zap,
    title: '辛口100点診断',
    description: 'テンプレなし・個別最適化。現実を直視して婚活力を劇的改善。',
    color: 'from-orange-500 to-amber-500',
  },
  {
    icon: Shirt,
    title: '季節連動服装提案',
    description: '気温・天気・デート内容に合わせてハイブランド/コスパ/節約の3プラン。',
    color: 'from-purple-500 to-violet-500',
  },
  {
    icon: MapPin,
    title: 'デートプラン生成',
    description: 'エリア・予算・相手のタイプから、誘い文句まで含めた完全プラン。',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: TrendingUp,
    title: '改善優先順位',
    description: '今週やること・1ヶ月以内のアクションを具体的に提示。',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Shield,
    title: 'データ完全保護',
    description: 'Firebase暗号化・いつでも削除可能。あなたのプライバシーを守ります。',
    color: 'from-gray-500 to-slate-500',
  },
];

const scoreExamples = [
  { range: '80点以上', grade: 'S級', desc: '婚活市場で有利。さらなる高みへ', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
  { range: '70点台', grade: 'A級', desc: '悪くないが弱点あり。改善余地大', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20' },
  { range: '60点台', grade: 'B級', desc: '普通。埋もれている可能性大', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
  { range: '50点台', grade: 'C級', desc: '平均以下。今すぐ改善を', color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20' },
  { range: '49点以下', grade: 'D級', desc: '現状では厳しい。徹底改善必須', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dark-900 radial-glow overflow-hidden">
      {/* Hero */}
      <section className="relative pt-24 pb-20 px-4">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-300 text-sm font-medium mb-8">
              <AlertTriangle className="w-4 h-4" />
              ただ褒めるだけの診断ではありません
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
              現実を見ろ。<br />
              <span className="gradient-text">婚活AI診断</span>
            </h1>

            <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
              写真と基本情報から、婚活市場での<span className="text-white/90 font-semibold">本当の評価</span>を辛口分析。<br />
              テンプレなし・個別最適化・具体的な改善策で、<br className="hidden sm:block" />
              あなたの婚活力を底上げします。
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="group shadow-xl shadow-primary-500/20">
                  無料で診断を始める
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg">
                  ログイン
                </Button>
              </Link>
            </div>

            <p className="mt-4 text-white/30 text-xs">
              無料登録・クレジットカード不要 / データはいつでも削除可
            </p>
          </motion.div>

          {/* Hero score preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16 max-w-sm mx-auto"
          >
            <div className="glass rounded-3xl p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-purple-500/5" />
              <div className="relative">
                <p className="text-white/40 text-sm mb-2">診断例</p>
                <div className="w-32 h-32 mx-auto relative mb-4">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="45" fill="none"
                      stroke="url(#scoreGrad)" strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray="283"
                      strokeDashoffset="113"
                      className="transition-all duration-1000"
                    />
                    <defs>
                      <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ec4899" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-white">60</span>
                    <span className="text-xs text-white/40">/ 100</span>
                  </div>
                </div>
                <p className="text-red-400 font-bold text-sm">「普通です。このままでは埋もれます」</p>
                <p className="text-white/40 text-xs mt-2">← 婚活カウンセラーAIの辛口評価</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Score Scale */}
      <section className="py-16 px-4 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              5段階の辛口評価
            </h2>
            <p className="text-white/50">現実から目を背けない、婚活市場の真実</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {scoreExamples.map((s) => (
              <div
                key={s.grade}
                className={`p-4 rounded-xl border ${s.bg} text-center`}
              >
                <div className={`text-2xl font-black ${s.color} mb-1`}>{s.grade}</div>
                <div className="text-white/60 text-xs mb-2">{s.range}</div>
                <div className="text-white/80 text-xs">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              全機能で婚活力を底上げ
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">
              診断から改善・実践まで、婚活成功に必要なすべてを1つのアプリで
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="glass rounded-2xl p-6 hover:bg-white/[0.05] transition-all duration-300 group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="glass rounded-3xl p-10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-purple-500/10" />
            <div className="relative">
              <Heart className="w-12 h-12 text-primary-400 mx-auto mb-4" />
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                あなたの婚活、<br />本気で変えませんか？
              </h2>
              <p className="text-white/60 mb-8">
                無料登録して、まず診断を受けてみてください。<br />
                厳しい言葉の先に、本当の改善があります。
              </p>
              <Link href="/register">
                <Button size="lg" fullWidth className="max-w-xs mx-auto">
                  無料で始める
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary-400" />
              <span className="text-white/60 text-sm font-medium">婚活AI診断</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-white/40">
              <Link href="/terms" className="hover:text-white/70 transition-colors">利用規約</Link>
              <Link href="/privacy" className="hover:text-white/70 transition-colors">プライバシーポリシー</Link>
              <Link href="/disclaimer" className="hover:text-white/70 transition-colors">免責事項</Link>
            </div>
            <p className="text-white/30 text-xs">© 2024 婚活AI診断. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
