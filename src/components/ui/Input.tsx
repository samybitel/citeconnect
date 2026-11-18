'use client';

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type LabelHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const fieldBase =
  'focus-ring w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors disabled:cursor-not-allowed disabled:bg-slate-50 dark:border-[#2c3a58] dark:bg-[#0d1526] dark:text-slate-100 dark:placeholder:text-slate-500 dark:disabled:bg-[#11192a]';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  function Input({ className, invalid, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(fieldBase, 'h-11', invalid && 'border-red-400 dark:border-red-500/70', className)}
        {...props}
      />
    );
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(
  function Textarea({ className, invalid, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(fieldBase, 'min-h-[96px] py-2.5', invalid && 'border-red-400 dark:border-red-500/70', className)}
        {...props}
      />
    );
  },
);

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200', className)} {...props} />;
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{children}</p>;
}

export function FieldHint({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-1.5 text-xs text-muted">{children}</p>;
}