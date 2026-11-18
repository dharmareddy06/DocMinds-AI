import React from 'react';

export interface ProgressBarProps {
  value: number; // 0 to 100
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'lime' | 'neutral' | 'indigo' | 'emerald' | 'amber';
  animated?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  label,
  showPercentage = false,
  size = 'md',
  color = 'lime',
  animated = false,
  className = '',
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  const heightClasses = {
    sm: 'h-1',
    md: 'h-1.5',
    lg: 'h-2',
  };

  const colorClasses = {
    lime: 'bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.5)]',
    neutral: 'bg-neutral-800 dark:bg-neutral-200',
    indigo: 'bg-lime-400',
    emerald: 'bg-lime-400',
    amber: 'bg-amber-600 dark:bg-amber-500',
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1 text-xs text-neutral-500 dark:text-neutral-400">
          {label && <span>{label}</span>}
          {showPercentage && <span className="font-mono text-[11px]">{Math.round(clampedValue)}%</span>}
        </div>
      )}
      <div className={`w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden ${heightClasses[size]}`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${colorClasses[color]} ${
            animated ? 'opacity-80' : ''
          }`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
