'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { History, ArrowRight, Loader2, Camera } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getUserDiagnoses } from '@/lib/firestore';
import { getScoreLevel, formatDate, cn } from '@/lib/utils';
import type { DiagnosisResult } from '@/types';

export default function HistoryPage() {
  const { user } = useAuth();
  const [diagnoses, setDiagnoses] = useState<DiagnosisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!user) return;
    getUserDiagnoses(user.uid, 20)
      .then(setDiagnoses)
      .catch((err) => {
        console.error('Failed to load diagnoses:', err);
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-dark-900 radial-glow pt-20 pb-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">診断履歴</h1>
              <p className="text-white/40 text-sm mt-1">過去の診断結果を振り返りましょう</p>
            </div>
            <Link href="/upload">
              <Button size="sm">
                新しく診断 <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
            </div>
          ) : loadError ? (
            <Card variant="glass" className="text-center py-16">
              <History className="w-12 h-12 text-red-400/50 mx-auto mb-4" />
              <h3 className="text-white font-semibold text-lg mb-2">読み込みに失敗しました</h3>
              <p className="text-white/40 text-sm mb-6">
                ネットワークを確認してページを再読み込みしてください
              </p>
              <Button onClick={() => window.location.reload()}>再読み込み</Button>
            </Card>
          ) : diagnoses.length === 0 ? (
            <Card variant="glass" className="text-center py-16">
              <Camera className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <h3 className="text-white font-semibold text-lg mb-2">まだ診断履歴がありません</h3>
              <p className="text-white/40 text-sm mb-6">
                写真をアップロードして最初の診断を受けましょう
              </p>
              <Link href="/upload">
                <Button>診断を始める</Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Score trend */}
              {diagnoses.length >= 2 && (
                <Card variant="glass" className="mb-6">
                  <h2 className="text-white font-semibold mb-4">スコア推移</h2>
                  <div className="flex items-end gap-2 h-16">
                    {[...diagnoses].reverse().slice(-8).map((d, i) => {
                      const level = getScoreLevel(d.scores.total);
                      return (
                        <div key={d.id} className="flex-1 flex flex-col items-center gap-1">
                          <span className={`text-xs ${level.color} font-bold`}>{d.scores.total}</span>
                          <div
                            className={`w-full rounded-sm bg-gradient-to-t from-primary-500 to-purple-500 opacity-70`}
                            style={{ height: `${d.scores.total}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-2 text-xs text-white/30 text-right">
                    最新 {diagnoses.length} 回の診断
                  </div>
                </Card>
              )}

              {/* List */}
              {diagnoses.map((d, i) => {
                const level = getScoreLevel(d.scores.total);
                return (
                  <motion.div
                    key={d.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link href={`/diagnosis?id=${d.id}`}>
                      <Card variant="glass" className="hover:bg-white/[0.05] transition-all cursor-pointer group">
                        <div className="flex items-center gap-4">
                          {/* Score */}
                          <div className="relative w-16 h-16 flex-shrink-0">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                              <circle
                                cx="50" cy="50" r="42" fill="none"
                                stroke="url(#histGrad)" strokeWidth="10"
                                strokeLinecap="round"
                                strokeDasharray="264"
                                strokeDashoffset={264 - (264 * d.scores.total / 100)}
                              />
                              <defs>
                                <linearGradient id="histGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#ec4899" />
                                  <stop offset="100%" stopColor="#a855f7" />
                                </linearGradient>
                              </defs>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-lg font-black text-white">{d.scores.total}</span>
                              <span className="text-xs text-white/30">/100</span>
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn('font-bold text-sm', level.color)}>{level.label}</span>
                              {i === 0 && (
                                <Badge variant="primary" size="sm">最新</Badge>
                              )}
                            </div>
                            <p className="text-white/60 text-xs line-clamp-2">
                              {d.harshEvaluation}
                            </p>
                            <p className="text-white/30 text-xs mt-1.5">{d.createdAt ? formatDate(d.createdAt) : ''}</p>
                          </div>

                          <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0" />
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
