import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export default function Button({
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
        {
          'bg-primary text-white hover:bg-primary/90 focus-visible:ring-primary shadow-[0_0_20px_rgba(37,99,235,0.3)]': variant === 'primary',
          'bg-white/10 text-slate-900 hover:bg-white/20 focus-visible:ring-white border border-white/5': variant === 'secondary',
          'bg-transparent text-slate-900 border border-white/20 hover:bg-white/10 focus-visible:ring-white': variant === 'outline',
          'bg-transparent text-slate-700 hover:text-slate-900 hover:bg-white/10 focus-visible:ring-white': variant === 'ghost',
          'bg-danger text-slate-900 hover:bg-danger/90 focus-visible:ring-danger shadow-[0_0_20px_rgba(239,68,68,0.3)]': variant === 'danger',
          'h-9 px-4 text-sm rounded-lg': size === 'sm',
          'h-11 px-6 text-base rounded-xl': size === 'md',
          'h-14 px-8 text-lg rounded-2xl': size === 'lg',
          'opacity-50 cursor-not-allowed': disabled || isLoading,
          'active:scale-[0.98]': !disabled && !isLoading,
        },
        className
      )}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      {children}
    </button>
  );
}
