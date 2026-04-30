'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shirt,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Sun,
  Cloud,
  CloudRain,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDiagnosis } from '@/context/DiagnosisContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select, Input } from '@/components/ui/Input';
import { getSeason, estimateTemperature, formatCurrency, cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { FashionSuggestion, FashionPlan } from '@/types';

const weatherOptions = [
  { value: '晴れ', label: '晴れ' },
  { value: '曇り', label: '曇り' },
  { value: '雨', label: '雨' },
];

const dateTypeOptions = [
  { value: 'カジュアルランチ', label: 'カジュアルランチ' },
  { value: 'おしゃれなディナー', label: 'おしゃれなディナー' },
  { value: '美術館・展覧会', label: '美術館・展覧会' },
  { value: 'テーマパーク', label: 'テーマパーク' },
  { value: 'ショッピング', label: 'ショッピング' },
  { value: '映画', label: '映画' },
  { value: 'カフェ巡り', label: 'カフェ巡り' },
  { value: '公園・アウトドア', label: '公園・アウトドア' },
];

const planTypeConfig = {
  'high-brand': {
    label: 'ハイブランドプラン',
    color: 'from-yellow-500 to-amber-500',
    textColor: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10 border-yellow-500/20',
    icon: '✨',
  },
  'cost-effective': {
    label: 'コスパプラン',
    color: 'from-green-500 to-emerald-500',
    textColor: 'text-green-400',
    bgColor: 'bg-green-500/10 border-green-500/20',
    icon: '⚡',
  },
  budget: {
    label: '節約プラン',
    color: 'from-blue-500 to-cyan-500',
    textColor: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/20',
    icon: '💡',
  },
};

export default function FashionPage() {
  const { user, userProfile } = useAuth();
  const { currentFashion, setCurrentFashion } = useDiagnosis();

  const now = new Date();
  const month = now.getMonth() + 1;
  const defaultSeason = getSeason(month);
  const defaultTemp = estimateTemperature(month);

  const [weather, setWeather] = useState('晴れ');
  const [dateType, setDateType] = useState('カジュアルランチ');
  const [temperature, setTemperature] = useState(String(defaultTemp));
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<FashionSuggestion | null>(currentFashion);
  const [activePlan, setActivePlan] = useState<'high-brand' | 'cost-effective' | 'budget'>(
    userProfile?.fashionPreference ?? 'cost-effective'
  );
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const handleGenerate = async () => {
    if (!userProfile) {
      toast.error('プロフィールを設定してください');
      return;
    }
    setGenerating(true);
    const controller = new AbortController();
    const abortTimer = setTimeout(() => controller.abort(), 62_000);
    try {
      const season = getSeason(now.getMonth() + 1);
      let response: Response;
      try {
        response = await fetch('/api/fashion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userProfile: { ...userProfile, uid: user?.uid ?? '' },
            currentDate: now.toISOString().split('T')[0],
            season,
            temperature: Number(temperature),
            weather,
            dateType,
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
      setCurrentFashion(data);
      toast.success('服装提案を生成しました！');
    } catch (err: any) {
      toast.error(err.message || '生成に失敗しました。もう一度お試しください');
    } finally {
      clearTimeout(abortTimer);
      setGenerating(false);
    }
  };

  const toggleItem = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const currentPlanData = result?.plans.find((p) => p.type === activePlan);

  return (
    <AuthGuard requireProfile>
      <div className="min-h-screen bg-dark-900 radial-glow pt-20 pb-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">季節連動 服装提案</h1>
            <p className="text-white/50 text-sm">
              デート内容・気温・天気に合わせて毎回最適なコーデを提案します。服装は診断とは完全分離。
            </p>
          </div>

          {/* Settings */}
          <Card variant="glass" className="mb-6">
            <h2 className="text-white font-semibold mb-4">デート条件を入力</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <Select
                label="天気"
                options={weatherOptions}
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
              />
              <Input
                label="気温（℃）"
                type="number"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
              />
              <Select
                label="デートの内容"
                options={dateTypeOptions}
                value={dateType}
                onChange={(e) => setDateType(e.target.value)}
              />
            </div>
            <div className="text-sm text-white/40 mb-4">
              <span className="font-medium text-white/60">現在の季節:</span> {defaultSeason} / エリア: {userProfile?.dateArea ?? '未設定'}
            </div>
            <Button onClick={handleGenerate} loading={generating} fullWidth>
              {generating ? 'AI生成中...' : (
                <>
                  <Sparkles className="w-4 h-4" />
                  服装提案を生成
                </>
              )}
            </Button>
          </Card>

          {/* Results */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Plan selector */}
              <div className="flex gap-2 mb-5">
                {(['high-brand', 'cost-effective', 'budget'] as const).map((type) => {
                  const cfg = planTypeConfig[type];
                  const plan = result.plans.find((p) => p.type === type);
                  return (
                    <button
                      key={type}
                      onClick={() => setActivePlan(type)}
                      className={cn(
                        'flex-1 py-3 px-3 rounded-xl border text-center transition-all duration-200',
                        activePlan === type
                          ? `${cfg.bgColor} ${cfg.textColor}`
                          : 'bg-white/[0.02] border-white/10 text-white/40 hover:text-white/60'
                      )}
                    >
                      <div className="text-lg mb-0.5">{cfg.icon}</div>
                      <div className="text-xs font-medium leading-tight">
                        {type === 'high-brand' ? 'ハイブランド' : type === 'cost-effective' ? 'コスパ' : '節約'}
                      </div>
                      {plan && (
                        <div className="text-xs mt-0.5">
                          {formatCurrency(plan.totalPrice)}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Current Plan */}
              {currentPlanData && (
                <FashionPlanCard
                  plan={currentPlanData}
                  expandedItems={expandedItems}
                  onToggleItem={toggleItem}
                />
              )}
            </motion.div>
          )}

          {!result && !generating && (
            <div className="text-center py-16 text-white/30">
              <Shirt className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>条件を設定して「服装提案を生成」を押してください</p>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}

function FashionPlanCard({
  plan,
  expandedItems,
  onToggleItem,
}: {
  plan: FashionPlan;
  expandedItems: Record<string, boolean>;
  onToggleItem: (id: string) => void;
}) {
  const cfg = planTypeConfig[plan.type];

  return (
    <Card variant="glass">
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${cfg.bgColor} mb-4`}>
        <span className={`font-bold text-sm ${cfg.textColor}`}>{plan.label}</span>
        <span className={`text-sm ${cfg.textColor}`}>合計: {formatCurrency(plan.totalPrice)}</span>
      </div>

      {/* Impression */}
      <div className="mb-5 p-4 rounded-xl bg-white/5">
        <p className="text-white/50 text-xs mb-1">このコーデで与える印象</p>
        <p className="text-white text-sm font-medium">{plan.impression}</p>
      </div>

      {/* Items */}
      <div className="space-y-3 mb-5">
        <h3 className="text-white/70 text-sm font-medium">アイテム一覧</h3>
        {(Array.isArray(plan.items) ? plan.items : []).map((item, i) => {
          const itemId = `${plan.type}-${i}`;
          const isExpanded = expandedItems[itemId];
          return (
            <div key={i} className="border border-white/5 rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 hover:bg-white/[0.03] transition-colors text-left"
                onClick={() => onToggleItem(itemId)}
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag className={`w-4 h-4 flex-shrink-0 ${cfg.textColor}`} />
                  <div>
                    <p className="text-white text-sm font-medium">{item.name}</p>
                    <p className="text-white/40 text-xs">{item.brand} · {formatCurrency(item.price)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/30 hidden sm:block">{item.category}</span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-white/30" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white/30" />
                  )}
                </div>
              </button>
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-white/5">
                  <p className="text-white/60 text-sm mt-3 mb-3">{item.reason}</p>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 text-sm ${cfg.textColor} hover:underline`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      ブランドサイトで見る
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Styling Tips */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
        <p className="text-white/50 text-xs mb-1.5">着こなしポイント</p>
        <p className="text-white/80 text-sm leading-relaxed">{plan.stylingTips}</p>
      </div>
    </Card>
  );
}
