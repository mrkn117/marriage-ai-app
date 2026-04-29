'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export function Input({
  label,
  error,
  hint,
  icon,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-');

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-white/80">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-white/40">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={cn(
            'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50',
            'transition-all duration-200',
            icon && 'pl-10',
            error && 'border-red-500/50 focus:ring-red-500/50',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-white/40">{hint}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, className, id, ...props }: TextareaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-');

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-white/80">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(
          'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 resize-none',
          'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50',
          'transition-all duration-200',
          error && 'border-red-500/50',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-white/40">{hint}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, hint, options, className, id, ...props }: SelectProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-');

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-white/80">
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={cn(
          'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white',
          'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50',
          'transition-all duration-200 appearance-none',
          error && 'border-red-500/50',
          className
        )}
        style={{ colorScheme: 'dark' }}
        {...props}
      >
        <option value="" disabled className="bg-dark-800">選択してください</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-dark-800">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-white/40">{hint}</p>}
    </div>
  );
}
