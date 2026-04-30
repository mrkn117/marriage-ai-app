'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Clock,
  DollarSign,
  MessageCircle,
  AlertTriangle,
  Phone,
  CloudRain,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Copy,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDiagnosis } from '@/context/DiagnosisContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select, Input, Textarea } from '@/components/ui/Input';
import { formatCurrency, cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { DatePlan } from '@/types';

const timeSlotOptions = [
  { value: 'lunch', label: 'ランチ（11:00〜14:00）' },
  { value: 'dinner', label: 'ディナー（18:00〜）' },
  { value: 'half-day', label: '半日（〜5時間）' },
  { value: 'full-day', label: '1日（5時間以上）' },
];

export default function DatePlanPage() {
  const { user, userProfile } = useAuth();
  const { currentDatePlan, setCurrentDatePlan } = useDiagnosis();

  const [area, setArea] = useState(userProfile?.dateArea ?? '');
  const [budget, setBudget] = useState(String(userProfile?.dateBudget ?? 10000));
  const [timeSlot, setTimeSlot] = useState<'lunch' | 'dinner' | 'half-day' | 'full-day'>(userProfile?.dateTimeSlot ?? 'dinner');
  const [isFirstDate, setIsFirstDate] = useState(true);
  const [partnerDesc, setPartnerDesc] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<DatePlan | null>(currentDatePlan);
  const [copied, setCopied] = useState(false);
  const [expandedSchedule, setExpandedSchedule] = useState<number | null>(0);

  const handleGenerate = async () => {
    if (!userProfile) {
      toast.error('プロフィールを設定してください');
      return;
    }
    if (!area.trim()) {
      toast.error('デートエリアを入力してください');
      return;
    }
    setGenerating(true);
    const controller = new AbortController();
    const abortTimer = setTimeout(() => controller.abort(), 62_000);
    try {
      let response: Response;
      try {
        response = await fetch('/api/dateplan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userProfile: { ...userProfile, uid: user!.uid },
            area,
            budget: Number(budget),
            timeSlot,
            isFirstDate,
            partnerDescription: partnerDesc || '特に指定なし',
          }),
          signal: controller.signal,
        });
      } catch (fetchErr: any) {
        if (fetchErr?.name === 'AbortError') {
          throw new Error('タイムアウトしました。しばらく後に再試行してください。');
        }
        throw new Error('通信エラーが発生しました。ネットワークを確認してください。');
      }

      if (!response.ok) {
        const status = response.status;
        let errMsg = `生成に失敗しました（HTTP ${status}）`;
        if (status === 504 || status === 524 || status === 408) {
          errMsg = 'タイムアウトしました。しばらく後に再試行してください。';
        } else {
          try {
            const errJson = await response.json();
            if (errJson?.error) errMsg = errJson.error;
          } catch { /* non-JSON error body */ }
        }
        throw new Error(errMsg);
      }

      let data: any;
      try {
        data = await response.json();
      } catch {
        throw new Error('サーバーの返答を解析できませんでした。再度お試しください。');
      }

      setResult(data);
      setCurrentDatePlan(data);
      toast.success('デートプランを生成しました！');
    } catch (err: any) {
      toast.error(err.message || '生成に失敗しました。もう一度お試しください');
    } finally {
      clearTimeout(abortTimer);
      setGenerating(false);
    }
  };

  const copyInvite = async () => {
    if (!result?.invitePhrase) return;
    try {
      await navigator.clipboard.writeText(result.invitePhrase);
      setCopied(true);
      toast.success('コピーしました');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('コピーできませんでした。テキストを手動でコピーしてください。');
    }
  };

  return (
    <AuthGuard requireProfile>
      <div className="min-h-screen bg-dark-900 radial-glow pt-20 pb-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">デートプラン生成</h1>
            <p className="text-white/50 text-sm">
              エリア・予算・相手のタイプから、誘い文句まで含めた完全なデートプランを自動生成します。
            </p>
          </div>

          {/* Input Form */}
          <Card variant="glass" className="mb-6">
            <h2 className="text-white font-semibold mb-4">プラン条件</h2>
            <div className="space-y-4">
              <Input
                label="デートエリア *"
                placeholder="例：東京（恵比寿・代官山）、大阪（梅田）"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="予算（円）"
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  hint="1人あたりの目安"
                />
                <Select
                  label="時間帯"
                  options={timeSlotOptions}
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value as 'lunch' | 'dinner' | 'half-day' | 'full-day')}
                />
              </div>

              {/* First/Second date toggle */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">デートの回数</label>
                <div className="flex gap-3">
                  {[
                    { label: '初回デート', value: true },
                    { label: '2回目以降', value: false },
                  ].map(({ label, value }) => (
                    <button
                      key={String(value)}
                      onClick={() => setIsFirstDate(value)}
                      className={cn(
                        'flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all border',
                        isFirstDate === value
                          ? 'bg-primary-500/20 border-primary-500/30 text-primary-300'
                          : 'bg-white/[0.03] border-white/10 text-white/50 hover:text-white/70'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <Textarea
                label="相手の情報（任意）"
                placeholder="例：25歳女性、カフェやおしゃれな空間が好き。グルメに詳しい。会話は盛り上がった。"
                rows={3}
                hint="入力するほど最適化されます"
                value={partnerDesc}
                onChange={(e) => setPartnerDesc(e.target.value)}
              />
            </div>

            <Button
              onClick={handleGenerate}
              loading={generating}
              fullWidth
              className="mt-5"
            >
              {generating ? 'AI生成中...' : (
                <>
                  <Sparkles className="w-4 h-4" />
                  デートプランを生成
                </>
              )}
            </Button>
          </Card>

          {/* Results */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              {/* Plan Header */}
              <Card variant="highlighted">
                <div className="flex items-start justify-between mb-2">
                  <h2 className="text-white font-bold text-xl">{result.planName}</h2>
                  <span className="text-sm text-white/40 bg-white/10 px-3 py-1 rounded-full">
                    {formatCurrency(result.totalBudget)}
                  </span>
                </div>
                {(result as any).concept && (
                  <p className="text-white/60 text-sm">{(result as any).concept}</p>
                )}
              </Card>

              {/* Schedule */}
              <Card variant="glass">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-primary-400" />
                  <h3 className="text-white font-semibold">スケジュール</h3>
                </div>
                <div className="space-y-3">
                  {result.schedule.map((item, i) => (
                    <div key={i} className="border border-white/5 rounded-xl overflow-hidden">
                      <button
                        className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/[0.03] transition-colors"
                        onClick={() => setExpandedSchedule(expandedSchedule === i ? null : i)}
                      >
                        <div className="w-16 flex-shrink-0">
                          <span className="text-primary-400 font-bold text-sm">{item.time}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm">{item.venue}</p>
                          <p className="text-white/40 text-xs">{item.activity}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-white/40 text-xs hidden sm:block">{formatCurrency(item.budget)}</span>
                          {expandedSchedule === i ? (
                            <ChevronUp className="w-4 h-4 text-white/30" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-white/30" />
                          )}
                        </div>
                      </button>
                      {expandedSchedule === i && (
                        <div className="px-4 pb-4 border-t border-white/5 pt-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-white/40 text-xs mb-0.5">場所・住所</p>
                              <p className="text-white/80">{item.address}</p>
                            </div>
                            <div>
                              <p className="text-white/40 text-xs mb-0.5">予算</p>
                              <p className="text-white/80">{formatCurrency(item.budget)}</p>
                            </div>
                            <div className="sm:col-span-2">
                              <p className="text-white/40 text-xs mb-0.5">ここでのポイント</p>
                              <p className="text-white/80">{item.tips}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>

              {/* Conversation Flow */}
              <Card variant="glass">
                <div className="flex items-center gap-2 mb-3">
                  <MessageCircle className="w-5 h-5 text-green-400" />
                  <h3 className="text-white font-semibold">会話の流れ</h3>
                </div>
                <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">
                  {result.conversationFlow}
                </p>
              </Card>

              {/* NG Actions */}
              <Card variant="glass">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <h3 className="text-white font-semibold">NG行動</h3>
                </div>
                <div className="space-y-2">
                  {result.ngActions.map((ng, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-red-400 text-xs font-bold">✗</span>
                      </div>
                      <p className="text-white/70 text-sm">{ng}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Invite Phrase */}
              <Card variant="glass">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Phone className="w-5 h-5 text-purple-400" />
                    <h3 className="text-white font-semibold">誘い文句（LINEメッセージ）</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyInvite}
                    icon={copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  >
                    {copied ? 'コピー済み' : 'コピー'}
                  </Button>
                </div>
                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">
                    {result.invitePhrase}
                  </p>
                </div>
              </Card>

              {/* Rainy Day */}
              <Card variant="glass">
                <div className="flex items-center gap-2 mb-3">
                  <CloudRain className="w-5 h-5 text-blue-400" />
                  <h3 className="text-white font-semibold">雨の日代替プラン</h3>
                </div>
                <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">
                  {result.rainyDayAlternative}
                </p>
              </Card>
            </motion.div>
          )}

          {!result && !generating && (
            <div className="text-center py-16 text-white/30">
              <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>条件を設定して「デートプランを生成」を押してください</p>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
