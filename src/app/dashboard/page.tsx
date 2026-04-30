'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Camera,
  Shirt,
  MapPin,
  History,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Star,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getUserDiagnoses } from '@/lib/firestore';
import { getScoreLevel, formatDate, getSeason, estimateTemperature } from '@/lib/utils';
import type { DiagnosisResult } from '@/types';

const quickLinks = [
  {
    href: '/upload',
    icon: Camera,
    label: 'AI診断を受ける',
    desc: '写真をアップロードして診断',
    color: 'from-primary-500 to-rose-500',
    highlight: true,
  },
  {
    href: '/fashion',
    icon: Shirt,
    label: '服装提案',
    desc: '季節・デートに合わせた提案',
    color: 'from-purple-500 to-violet-500',
    highlight: false,
  },
  {
    href: '/dateplan',
    icon: MapPin,
    label: 'デートプラン',
    desc: 'エリア別完全プラン生成',
    color: 'from-blue-500 to-cyan-500',
    highlight: false,
  },
  {
    href: '/history',
    icon: History,
    label: '診断履歴',
    desc: '過去の診断を振り返る',
    color: 'from-green-500 to-emerald-500',
    highlight: false,
  },
];

export default function DashboardPage() {
  const { user, userProfile } = useAuth();
  const [recentDiagnoses, setRecentDiagnoses] = useState<DiagnosisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const now = new Date();
  const month = now.getMonth() + 1;
  const season = getSeason(month);
  const temp = estimateTemperature(month);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    Promise.race([
      getUserDiagnoses(user.uid, 3),
      new Promise<DiagnosisResult[]>((_, reject) =>
        setTimeout(() => reject(new Error('Firestore timeout')), 10_000)
      ),
    ])
      .then((data) => { if (mounted) setRecentDiagnoses(data); })
      .catch((err) => {
        console.error('Failed to load diagnoses:', err);
        if (mounted) setLoadError(true);
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [user]);

  const latestDiagnosis = recentDiagnoses[0];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-dark-900 pt-20 pb-12 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <p className="text-white/40 text-sm mb-1">{season} · 気温約{temp}℃</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              こんにちは、{userProfile?.nickname ?? 'ユーザー'}さん
            </h1>
            {!userProfile?.age && (
              <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-300 font-medium text-sm">プロフィールが未設定です</p>
                  <p className="text-amber-400/60 text-xs mt-0.5">診断精度向上のためにプロフィールを設定してください</p>
                  <Link href="/onboarding" className="inline-flex items-center gap-1 text-amber-400 text-xs mt-2 hover:text-amber-300 font-medium">
                    設定する <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}
          </motion.div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {quickLinks.map((link, i) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Link href={link.href}>
                  <div className={`relative p-5 rounded-2xl border transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer ${
                    link.highlight
                      ? 'bg-gradient-to-br from-primary-500/15 to-rose-500/15 border-primary-500/30'
                      : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06]'
                  }`}>
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center mb-3 shadow-lg`}>
                      <link.icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-white font-semibold text-sm">{link.label}</p>
                    <p className="text-white/40 text-xs mt-0.5">{link.desc}</p>
                    {link.highlight && (
                      <div className="absolute top-3 right-3">
                        <span className="text-xs bg-primary-500 text-white px-2 py-0.5 rounded-full font-medium">おすすめ</span>
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Firestore load error notice */}
          {loadError && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-300">
              診断履歴の読み込みに失敗しました。ページを再読み込みしてください。
            </div>
          )}

          {/* Latest Diagnosis Result */}
          {latestDiagnosis ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card variant="glass" className="mb-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-white font-bold text-lg">最新の診断結果</h2>
                    <p className="text-white/40 text-xs mt-0.5">
                      {latestDiagnosis.createdAt ? formatDate(latestDiagnosis.createdAt) : ''}
                    </p>
                  </div>
                  <Link href={`/diagnosis?id=${latestDiagnosis.id}`}>
                    <Button variant="ghost" size="sm">
                      詳細を見る <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>

                <div className="flex items-center gap-6">
                  {/* Score ring */}
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                      <circle
                        cx="50" cy="50" r="42" fill="none"
                        stroke="url(#dashGrad)" strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray="264"
                        strokeDashoffset={264 - (264 * latestDiagnosis.scores.total / 100)}
                      />
                      <defs>
                        <linearGradient id="dashGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#ec4899" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-black text-white">{latestDiagnosis.scores.total}</span>
                      <span className="text-xs text-white/40">/100</span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    {(() => {
                      const level = getScoreLevel(latestDiagnosis.scores.total);
                      return (
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${level.bgColor} mb-2`}>
                          <span className={`text-sm font-bold ${level.color}`}>{level.label}</span>
                          <span className={`text-xs ${level.color} opacity-75`}>{level.description}</span>
                        </div>
                      );
                    })()}
                    <p className="text-white/70 text-sm line-clamp-2">
                      {latestDiagnosis.harshEvaluation}
                    </p>
                  </div>
                </div>

                {/* Score breakdown */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-5 pt-5 border-t border-white/5">
                  {[
                    { label: '第一印象', score: latestDiagnosis.scores.firstImpression, max: 20 },
                    { label: '清潔感', score: latestDiagnosis.scores.cleanliness, max: 15 },
                    { label: '表情', score: latestDiagnosis.scores.expression, max: 15 },
                    { label: '姿勢・体型', score: latestDiagnosis.scores.postureAndBody, max: 20 },
                    { label: '基本情報', score: latestDiagnosis.scores.profileBalance, max: 15 },
                    { label: '市場評価', score: latestDiagnosis.scores.marketValue, max: 15 },
                  ].map((item) => (
                    <div key={item.label} className="text-center">
                      <div className="text-white font-bold text-lg">{item.score}</div>
                      <div className="text-white/30 text-xs">/{item.max}</div>
                      <div className="text-white/50 text-xs mt-0.5 leading-tight">{item.label}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card variant="highlighted" className="text-center py-12">
                <Camera className="w-12 h-12 text-primary-400 mx-auto mb-4" />
                <h3 className="text-white font-bold text-lg mb-2">まだ診断を受けていません</h3>
                <p className="text-white/50 text-sm mb-6">
                  写真をアップロードして、婚活市場での自分の評価を知りましょう
                </p>
                <Link href="/upload">
                  <Button>
                    診断を始める
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
