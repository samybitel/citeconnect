import { cn, initials as makeInitials } from '@/lib/utils';

export function Avatar({
  src,
  firstName,
  lastName,
  size = 'md',
  className,
}: {
  src?: string | null;
  firstName: string;
  lastName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const sizes = {
    sm: 'h-9 w-9 text-xs',
    md: 'h-11 w-11 text-sm',
    lg: 'h-16 w-16 text-lg',
    xl: 'h-24 w-24 text-2xl',
  };
  if (src) {
    return (
      <img
        src={src}
        alt={`Photo de ${firstName} ${lastName}`}
        className={cn('rounded-full object-cover ring-2 ring-white dark:ring-[#11192a]', sizes[size], className)}
      />
    );
  }
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-navy font-semibold text-white ring-2 ring-white dark:ring-[#11192a]',
        sizes[size],
        className,
      )}
      aria-hidden
    >
      {makeInitials(firstName, lastName)}
    </div>
  );
}