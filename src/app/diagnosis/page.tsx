'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Target,
  Calendar,
  TrendingUp,
  ArrowRight,
  Share2,
  Shirt,
  MapPin,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDiagnosis } from '@/context/DiagnosisContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getDiagnosisResult } from '@/lib/firestore';
import { getScoreLevel, formatDate, cn } from '@/lib/utils';
import type { DiagnosisResult } from '@/types';
import Link from 'next/link';

const scoreItems = [
  { key: 'firstImpression', label: '第一印象', max: 20 },
  { key: 'cleanliness', label: '清潔感', max: 15 },
  { key: 'expression', label: '表情', max: 15 },
  { key: 'postureAndBody', label: '姿勢・体型', max: 20 },
  { key: 'profileBalance', label: '基本情報バランス', max: 15 },
  { key: 'marketValue', label: '婚活市場評価', max: 15 },
] as const;

function DiagnosisContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { currentDiagnosis, setCurrentDiagnosis } = useDiagnosis();
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const diagnosisId = searchParams.get('id');

  useEffect(() => {
    const load = async () => {
      if (currentDiagnosis && (!diagnosisId || diagnosisId === currentDiagnosis.id)) {
        setResult(currentDiagnosis);
        setLoading(false);
        return;
      }
      if (diagnosisId) {
        try {
          const r = await getDiagnosisResult(diagnosisId);
          setResult(r);
        } catch (e) {
          console.error(e);
        }
      }
      setLoading(false);
    };
    load();
  }, [diagnosisId, currentDiagnosis]);

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-dark-900 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary-400 animate-spin" />
        </div>
      </AuthGuard>
    );
  }

  if (!result) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-dark-900 pt-20 flex items-center justify-center px-4">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-white font-bold text-xl mb-2">診断結果が見つかりません</h2>
            <Link href="/upload"><Button>診断を受ける</Button></Link>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const level = getScoreLevel(result.scores.total);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-dark-900 radial-glow pt-20 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center justify-between"
          >
            <div>
              <p className="text-white/40 text-sm">{formatDate(result.createdAt)}</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">診断結果</h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: '婚活AI診断結果', text: `総合スコア: ${result.scores.total}点` });
                }
              }}
              icon={<Share2 className="w-4 h-4" />}
            >
              シェア
            </Button>
          </motion.div>

          {/* Total Score */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card variant="glass" className="mb-6 text-center">
              <p className="text-white/50 text-sm mb-4">総合点</p>
              <div className="relative w-40 h-40 mx-auto mb-6">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="44" fill="none"
                    stroke="url(#resultGrad)" strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="276"
                    strokeDashoffset={276 - (276 * result.scores.total / 100)}
                    className="transition-all duration-1500"
                  />
                  <defs>
                    <linearGradient id="resultGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ec4899" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-black text-white">{result.scores.total}</span>
                  <span className="text-sm text-white/40">/ 100点</span>
                </div>
              </div>

              <div className={cn('inline-flex items-center gap-2 px-5 py-2.5 rounded-full border mb-4', level.bgColor, 'border-current/20')}>
                <span className={cn('text-2xl font-black', level.color)}>{level.label}</span>
                <span className={cn('text-sm', level.color)}>{level.description}</span>
              </div>

              {/* Harsh Evaluation Banner */}
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5 text-left">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-300 font-bold text-sm mb-1">辛口評価</p>
                    <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">
                      {result.harshEvaluation}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Score Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card variant="glass" className="mb-6">
              <h2 className="text-white font-bold text-lg mb-5">項目別スコア</h2>
              <div className="space-y-4">
                {scoreItems.map(({ key, label, max }) => {
                  const score = result.scores[key];
                  const pct = (score / max) * 100;
                  const color = pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500';
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-white/70 text-sm">{label}</span>
                        <span className="text-white font-bold text-sm">
                          {score} <span className="text-white/30 font-normal">/ {max}</span>
                        </span>
                      </div>
                      <div className="progress-bar">
                        <motion.div
                          className={cn('progress-fill', color)}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: 0.3 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>

          {/* Strengths & Weaknesses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6"
          >
            <Card variant="glass">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <h3 className="text-white font-semibold">良い点</h3>
              </div>
              <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">
                {result.strengths}
              </p>
            </Card>
            <Card variant="glass">
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="w-5 h-5 text-red-400" />
                <h3 className="text-white font-semibold">弱い点</h3>
              </div>
              <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">
                {result.weaknesses}
              </p>
            </Card>
          </motion.div>

          {/* Market View */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card variant="glass" className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <h3 className="text-white font-semibold">婚活市場での見え方</h3>
              </div>
              <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">
                {result.marketView}
              </p>
            </Card>
          </motion.div>

          {/* Improvement Priority */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card variant="glass" className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-orange-400" />
                <h3 className="text-white font-semibold">改善優先順位</h3>
              </div>
              <div className="space-y-3">
                {result.improvementPriority.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold',
                      i === 0 ? 'bg-red-500/20 text-red-400' :
                      i === 1 ? 'bg-orange-500/20 text-orange-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    )}>
                      {i + 1}
                    </div>
                    <p className="text-white/80 text-sm pt-1">{item}</p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Action Plans */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8"
          >
            <Card variant="glass">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-primary-400" />
                <h3 className="text-white font-semibold">今週やること</h3>
              </div>
              <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">
                {result.thisWeekAction}
              </p>
            </Card>
            <Card variant="glass">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-purple-400" />
                <h3 className="text-white font-semibold">1ヶ月以内にやること</h3>
              </div>
              <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">
                {result.oneMonthAction}
              </p>
            </Card>
          </motion.div>

          {/* Next Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <Link href="/fashion" className="block">
              <div className="p-5 rounded-2xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/15 transition-all group cursor-pointer">
                <Shirt className="w-8 h-8 text-purple-400 mb-3" />
                <h3 className="text-white font-semibold">服装提案を見る</h3>
                <p className="text-white/50 text-sm mt-1">季節・デートに合わせた3プラン</p>
                <div className="flex items-center gap-1 text-purple-400 text-sm mt-3 group-hover:gap-2 transition-all">
                  服装提案へ <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
            <Link href="/dateplan" className="block">
              <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/15 transition-all group cursor-pointer">
                <MapPin className="w-8 h-8 text-blue-400 mb-3" />
                <h3 className="text-white font-semibold">デートプランを作る</h3>
                <p className="text-white/50 text-sm mt-1">エリア・予算・相手から生成</p>
                <div className="flex items-center gap-1 text-blue-400 text-sm mt-3 group-hover:gap-2 transition-all">
                  プラン生成へ <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          </motion.div>
        </div>
      </div>
    </AuthGuard>
  );
}

export default function DiagnosisPage() {
  return (
    <Suspense>
      <DiagnosisContent />
    </Suspense>
  );
}
