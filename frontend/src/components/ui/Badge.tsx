import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'primary' | 'purple' | 'lime' | 'outline';
  size?: 'sm' | 'md';
  dot?: boolean;
  pulse?: boolean;
  className?: string;
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  pulse = false,
  className = '',
}: BadgeProps) {
  const variants = {
    neutral: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800',
    outline: 'bg-transparent text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700',
    success: 'bg-lime-400/10 text-lime-700 dark:text-lime-400 border-lime-400/30',
    lime: 'bg-lime-400/15 text-lime-800 dark:text-lime-300 border-lime-400/40 font-semibold',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/40',
    danger: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/40',
    primary: 'bg-neutral-900 text-lime-400 dark:bg-neutral-900 dark:text-lime-300 border-neutral-800',
    purple: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800',
  };

  const dotColors = {
    neutral: 'bg-neutral-400',
    outline: 'bg-neutral-400',
    success: 'bg-lime-400 shadow-[0_0_6px_rgba(163,230,53,0.8)]',
    lime: 'bg-lime-400 shadow-[0_0_6px_rgba(163,230,53,0.8)]',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    primary: 'bg-lime-400 shadow-[0_0_6px_rgba(163,230,53,0.8)]',
    purple: 'bg-neutral-500',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 font-medium leading-none',
    md: 'text-xs px-2.5 py-1 font-medium leading-none',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          {pulse && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${dotColors[variant]}`}
            />
          )}
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotColors[variant]}`} />
        </span>
      )}
      <span>{children}</span>
    </span>
  );
}
