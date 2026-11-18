import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center dark:border-[#2c3a58]', className)}>
      {icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-[#172138] dark:text-slate-500">
          {icon}
        </div>
      )}
      <div>
        <p className="font-medium text-slate-700 dark:text-slate-200">{title}</p>
        {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}