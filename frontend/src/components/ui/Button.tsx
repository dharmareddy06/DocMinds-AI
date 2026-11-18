import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'lime';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-lime-400/50 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

  const variants = {
    primary:
      'bg-lime-400 hover:bg-lime-300 text-neutral-950 font-semibold shadow-xs hover:shadow-[0_0_14px_rgba(163,230,53,0.35)] active:scale-[0.98] border border-transparent',
    lime:
      'bg-lime-400 hover:bg-lime-300 text-neutral-950 font-semibold shadow-xs hover:shadow-[0_0_14px_rgba(163,230,53,0.35)] active:scale-[0.98] border border-transparent',
    secondary:
      'bg-neutral-100 hover:bg-neutral-200 text-neutral-900 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-800',
    outline:
      'bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 hover:border-lime-400/50 hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-800 dark:text-neutral-200 shadow-2xs',
    ghost:
      'bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-lime-500 dark:hover:text-lime-400 text-neutral-600 dark:text-neutral-300',
    danger:
      'bg-neutral-900 hover:bg-rose-600 text-white dark:bg-rose-950/60 dark:hover:bg-rose-900 dark:text-rose-200 border border-neutral-200 dark:border-rose-900/40',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5 h-8',
    md: 'text-xs sm:text-sm px-3.5 py-2 gap-2 h-9',
    lg: 'text-sm px-4 py-2.5 gap-2 h-10',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-0.5 mr-1.5 h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : leftIcon ? (
        <span className="shrink-0">{leftIcon}</span>
      ) : null}
      <span>{children}</span>
      {!isLoading && rightIcon ? <span className="shrink-0">{rightIcon}</span> : null}
    </button>
  );
}
