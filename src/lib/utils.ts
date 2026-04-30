import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined, fmt = 'yyyy年MM月dd日'): string {
  if (!date) return '';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    return format(d, fmt, { locale: ja });
  } catch {
    return '';
  }
}

export function getSeason(month: number): string {
  if (month >= 3 && month <= 5) return '春';
  if (month >= 6 && month <= 8) return '夏';
  if (month >= 9 && month <= 11) return '秋';
  return '冬';
}

export function getSeasonEn(month: number): string {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

export function estimateTemperature(month: number): number {
  const temps: Record<number, number> = {
    1: 5, 2: 6, 3: 10, 4: 16, 5: 21, 6: 25,
    7: 29, 8: 31, 9: 26, 10: 20, 11: 14, 12: 8,
  };
  return temps[month] ?? 20;
}

export function getBMI(height: number, weight: number): number {
  if (!height || !weight || height <= 0) return 0;
  const h = height / 100;
  const bmi = weight / (h * h);
  if (!isFinite(bmi)) return 0;
  return Math.round(bmi * 10) / 10;
}

export function getBMICategory(bmi: number): string {
  if (!bmi || bmi <= 0) return '不明';
  if (bmi < 18.5) return '痩せ型';
  if (bmi < 25) return '標準';
  if (bmi < 30) return 'やや肥満';
  return '肥満';
}

export function getScoreLevel(score: number): {
  label: string;
  color: string;
  bgColor: string;
  description: string;
} {
  if (score >= 80) return {
    label: 'S級',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/10',
    description: '婚活市場で有利な立ち位置'
  };
  if (score >= 70) return {
    label: 'A級',
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
    description: '悪くないが改善の余地あり'
  };
  if (score >= 60) return {
    label: 'B級',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    description: '普通。埋もれやすい'
  };
  if (score >= 50) return {
    label: 'C級',
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/10',
    description: '平均以下。改善必須'
  };
  return {
    label: 'D級',
    color: 'text-red-400',
    bgColor: 'bg-red-400/10',
    description: '現状では婚活市場で戦えない'
  };
}

export function formatCurrency(amount: number): string {
  if (!isFinite(amount) || isNaN(amount)) return '—';
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function getGenderLabel(gender: string): string {
  const map: Record<string, string> = {
    male: '男性',
    female: '女性',
    other: 'その他',
  };
  return map[gender] ?? gender;
}

export function getTimeSlotLabel(slot: string): string {
  const map: Record<string, string> = {
    lunch: 'ランチ',
    dinner: 'ディナー',
    'half-day': '半日',
    'full-day': '1日',
  };
  return map[slot] ?? slot;
}

export function getFashionPrefLabel(pref: string): string {
  const map: Record<string, string> = {
    'high-brand': 'ハイブランド',
    'cost-effective': 'コスパ重視',
    budget: '安さ重視',
  };
  return map[pref] ?? pref;
}
