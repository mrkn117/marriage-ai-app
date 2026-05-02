'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, CheckCircle, User, MapPin, Heart, Shirt } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { OnboardingFormData } from '@/types';

const schema = z.object({
  nickname: z.string().min(1, '必須'),
  gender: z.enum(['male', 'female', 'other']),
  age: z.coerce.number().min(18, '18歳以上').max(80, '80歳以下'),
  height: z.coerce.number().min(140, '身長を確認').max(220, '身長を確認'),
  weight: z.coerce.number().min(30, '体重を確認').max(200, '体重を確認'),
  annualIncome: z.coerce.number().min(0, '0以上'),
  occupation: z.string().min(1, '必須'),
  residenceArea: z.string().min(1, '必須'),
  marriageGoal: z.string().min(1, '必須'),
  desiredPartner: z.string().min(1, '必須'),
  weaknesses: z.string().optional().default(''),
  concerns: z.string().optional().default(''),
  dateArea: z.string().min(1, '必須'),
  dateBudget: z.coerce.number().min(1000, '1000円以上'),
  dateTimeSlot: z.enum(['lunch', 'dinner', 'half-day', 'full-day']),
  fashionStyle: z.string().optional().default(''),
  fashionBudget: z.coerce.number().min(0, '0以上'),
  fashionPreference: z.enum(['high-brand', 'cost-effective', 'budget']),
});

const steps = [
  { id: 0, title: '基本情報', icon: User, desc: 'あなた自身について' },
  { id: 1, title: '婚活情報', icon: Heart, desc: '婚活の目的・希望' },
  { id: 2, title: 'デート情報', icon: MapPin, desc: 'デートのスタイル' },
  { id: 3, title: 'ファッション', icon: Shirt, desc: '服装の好み・予算' },
];

const genderOptions = [
  { value: 'male', label: '男性' },
  { value: 'female', label: '女性' },
  { value: 'other', label: 'その他' },
];

const timeSlotOptions = [
  { value: 'lunch', label: 'ランチ（11:00〜14:00）' },
  { value: 'dinner', label: 'ディナー（18:00〜）' },
  { value: 'half-day', label: '半日（〜5時間）' },
  { value: 'full-day', label: '1日（5時間以上）' },
];

const fashionPrefOptions = [
  { value: 'high-brand', label: 'ハイブランド志向（品質・ブランド重視）' },
  { value: 'cost-effective', label: 'コスパ重視（品質とコストのバランス）' },
  { value: 'budget', label: '安さ重視（とにかく安く）' },
];

const occupationOptions = [
  { value: '会社員', label: '会社員' },
  { value: '公務員', label: '公務員' },
  { value: '自営業', label: '自営業・フリーランス' },
  { value: '経営者', label: '経営者・役員' },
  { value: '医療・福祉', label: '医療・福祉・介護' },
  { value: '教育', label: '教育・研究' },
  { value: 'IT', label: 'IT・エンジニア' },
  { value: '金融', label: '金融・保険' },
  { value: '飲食', label: '飲食・サービス業' },
  { value: '学生', label: '学生' },
  { value: '無職・求職中', label: '無職・求職中' },
  { value: 'その他', label: 'その他' },
];

export default function OnboardingPage() {
  const { userProfile, updateUserProfile } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      gender: 'male',
      age: 25,
      height: 170,
      weight: 65,
      dateTimeSlot: 'dinner',
      fashionPreference: 'cost-effective',
      fashionBudget: 20000,
      dateBudget: 10000,
      annualIncome: 300,
      occupation: '会社員',
      residenceArea: '',
      nickname: '',
      marriageGoal: '',
      desiredPartner: '',
      dateArea: '',
    },
  });

  // Prefill if profile exists
  useEffect(() => {
    if (userProfile) {
      Object.entries(userProfile).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          setValue(k as keyof OnboardingFormData, v as never);
        }
      });
    }
  }, [userProfile, setValue]);

  const stepFields: Record<number, (keyof OnboardingFormData)[]> = {
    0: ['nickname', 'gender', 'age', 'height', 'weight', 'annualIncome', 'occupation', 'residenceArea'],
    1: ['marriageGoal', 'desiredPartner', 'weaknesses', 'concerns'],
    2: ['dateArea', 'dateBudget', 'dateTimeSlot'],
    3: ['fashionStyle', 'fashionBudget', 'fashionPreference'],
  };

  const handleNext = async () => {
    const valid = await trigger(stepFields[step]);
    if (valid) setStep((s) => s + 1);
  };

  const onSubmit = async (data: OnboardingFormData) => {
    setSaving(true);
    try {
      await updateUserProfile({ ...data, updatedAt: new Date() });
      toast.success('プロフィールを保存しました！');
      router.push('/upload');
    } catch (err: any) {
      toast.error(err?.message ?? '保存に失敗しました。再度お試しください');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-dark-900 radial-glow pt-20 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Step indicator */}
          <div className="flex items-center mb-8">
            {steps.map((s, i) => (
              <React.Fragment key={s.id}>
                <div
                  className={cn(
                    'flex items-center gap-2 transition-all',
                    step === i ? 'opacity-100' : step > i ? 'opacity-60' : 'opacity-30'
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                    step > i
                      ? 'bg-primary-500 text-white'
                      : step === i
                      ? 'bg-primary-500/20 border-2 border-primary-500 text-primary-400'
                      : 'bg-white/5 border border-white/10 text-white/40'
                  )}>
                    {step > i ? <CheckCircle className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={cn('text-xs font-medium hidden sm:block', step === i ? 'text-white' : 'text-white/40')}>
                    {s.title}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={cn('flex-1 h-px mx-2', step > i ? 'bg-primary-500/50' : 'bg-white/10')} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Form */}
          <div className="glass rounded-3xl p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">{steps[step].title}</h2>
              <p className="text-white/40 text-sm mt-1">{steps[step].desc}</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {/* Step 0: Basic Info */}
                  {step === 0 && (
                    <>
                      <Input
                        label="ニックネーム *"
                        placeholder="例：たろう"
                        error={errors.nickname?.message}
                        {...register('nickname')}
                      />
                      <Select
                        label="性別 *"
                        options={genderOptions}
                        error={errors.gender?.message}
                        {...register('gender')}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="年齢 *"
                          type="number"
                          placeholder="25"
                          hint="歳"
                          error={errors.age?.message}
                          {...register('age')}
                        />
                        <Input
                          label="年収 *"
                          type="number"
                          placeholder="350"
                          hint="万円"
                          error={errors.annualIncome?.message}
                          {...register('annualIncome')}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="身長 *"
                          type="number"
                          placeholder="170"
                          hint="cm"
                          error={errors.height?.message}
                          {...register('height')}
                        />
                        <Input
                          label="体重 *"
                          type="number"
                          placeholder="65"
                          hint="kg"
                          error={errors.weight?.message}
                          {...register('weight')}
                        />
                      </div>
                      <Select
                        label="職業 *"
                        options={occupationOptions}
                        error={errors.occupation?.message}
                        {...register('occupation')}
                      />
                      <Input
                        label="居住エリア *"
                        placeholder="例：東京都渋谷区、大阪府梅田"
                        hint="都道府県・市区町村まで"
                        error={errors.residenceArea?.message}
                        {...register('residenceArea')}
                      />
                    </>
                  )}

                  {/* Step 1: Marriage Goal */}
                  {step === 1 && (
                    <>
                      <Textarea
                        label="婚活目的 *"
                        placeholder="例：2年以内に結婚したい。お互いを尊重できるパートナーを見つけたい。"
                        rows={3}
                        error={errors.marriageGoal?.message}
                        {...register('marriageGoal')}
                      />
                      <Textarea
                        label="希望する相手像 *"
                        placeholder="例：年齢は25〜35歳、穏やかで家庭的な方。仕事に理解がある方。"
                        rows={3}
                        error={errors.desiredPartner?.message}
                        {...register('desiredPartner')}
                      />
                      <Textarea
                        label="苦手なこと"
                        placeholder="例：大人数でのパーティー系婚活、強引なアプローチ"
                        rows={2}
                        hint="任意"
                        {...register('weaknesses')}
                      />
                      <Textarea
                        label="婚活の悩み"
                        placeholder="例：マッチングはするが2回目に繋がらない。プロフィールの書き方がわからない。"
                        rows={3}
                        hint="任意 / AIが個別の改善策を提案します"
                        {...register('concerns')}
                      />
                    </>
                  )}

                  {/* Step 2: Date Info */}
                  {step === 2 && (
                    <>
                      <Input
                        label="デート希望エリア *"
                        placeholder="例：東京（恵比寿・代官山エリア）"
                        error={errors.dateArea?.message}
                        {...register('dateArea')}
                      />
                      <Input
                        label="デート予算 *"
                        type="number"
                        placeholder="10000"
                        hint="円（1人あたりの目安）"
                        error={errors.dateBudget?.message}
                        {...register('dateBudget')}
                      />
                      <Select
                        label="デート時間帯 *"
                        options={timeSlotOptions}
                        error={errors.dateTimeSlot?.message}
                        {...register('dateTimeSlot')}
                      />
                    </>
                  )}

                  {/* Step 3: Fashion */}
                  {step === 3 && (
                    <>
                      <Textarea
                        label="服装の好み"
                        placeholder="例：シンプルでキレイめなスタイルが好き。あまり派手すぎないもの。"
                        rows={3}
                        hint="任意 / AIがスタイリングの方向性に活用します"
                        {...register('fashionStyle')}
                      />
                      <Input
                        label="服の予算（1着あたりの目安）"
                        type="number"
                        placeholder="20000"
                        hint="円"
                        error={errors.fashionBudget?.message}
                        {...register('fashionBudget')}
                      />
                      <Select
                        label="ファッション志向 *"
                        options={fashionPrefOptions}
                        error={errors.fashionPreference?.message}
                        {...register('fashionPreference')}
                      />
                    </>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex items-center gap-3 mt-8 pt-6 border-t border-white/5">
                {step > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep((s) => s - 1)}
                    icon={<ChevronLeft className="w-4 h-4" />}
                  >
                    戻る
                  </Button>
                )}
                <div className="flex-1" />
                {step < steps.length - 1 ? (
                  <Button type="button" onClick={handleNext}>
                    次へ
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button type="submit" loading={saving}>
                    <CheckCircle className="w-4 h-4" />
                    保存して診断へ
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
