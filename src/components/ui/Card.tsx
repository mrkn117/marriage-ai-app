'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'highlighted';
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

export function Card({
  variant = 'default',
  padding = 'md',
  className,
  children,
  ...props
}: CardProps) {
  const variants = {
    default: 'bg-white/5 border border-white/10',
    glass: 'bg-white/[0.03] border border-white/[0.07] backdrop-blur-sm',
    highlighted: 'bg-gradient-to-br from-primary-500/10 to-purple-500/10 border border-primary-500/20',
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={cn(
        'rounded-2xl',
        variants[variant],
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function CardHeader({ title, subtitle, icon, action, className, ...props }: CardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between mb-4', className)} {...props}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-400">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-white font-semibold">{title}</h3>
          {subtitle && <p className="text-white/50 text-sm">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
