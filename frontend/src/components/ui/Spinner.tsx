import { cn } from '@/utils/tailwind'

const sizes = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-[3px]',
}

interface SpinnerProps {
  size?: keyof typeof sizes
  label?: string
  className?: string
}

export function Spinner({
  size = 'md',
  label = 'Loading',
  className,
}: SpinnerProps) {
  return (
    <span role="status" className={cn('inline-flex', className)}>
      <span
        aria-hidden
        className={cn(
          'animate-spin rounded-full border-current border-r-transparent opacity-80',
          sizes[size],
        )}
      />
      <span className="sr-only">{label}</span>
    </span>
  )
}
