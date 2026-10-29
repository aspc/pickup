import Link from 'next/link'
import { forwardRef, type ComponentProps } from 'react'

import { cn } from '@/utils/tailwind'
import { Spinner } from './Spinner'

const variants = {
  primary: 'bg-navy text-white hover:bg-navy-700 active:bg-navy-900',
  accent: 'bg-sage text-white hover:bg-sage-strong',
  secondary:
    'border border-line-strong bg-card text-ink hover:border-navy-300 hover:bg-sunken',
  ghost: 'text-navy hover:bg-sunken',
  danger: 'bg-danger text-white hover:bg-danger-strong',
  'danger-ghost': 'text-danger hover:bg-danger-tint',
  'on-navy': 'border border-navy-500 text-white hover:bg-navy-700',
}

const sizes = {
  sm: 'h-9 gap-1.5 px-3 text-sm',
  md: 'h-11 gap-2 px-4 text-[15px]',
  lg: 'h-12 gap-2 px-5 text-base',
}

type ButtonVariant = keyof typeof variants
type ButtonSize = keyof typeof sizes

interface ButtonStyleOptions {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
}

export const buttonClasses = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
}: ButtonStyleOptions = {}) =>
  cn(
    'inline-flex select-none items-center justify-center whitespace-nowrap rounded-md font-medium [&_svg]:shrink-0',
    'transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[0.97]',
    'disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    sizes[size],
    fullWidth && 'w-full',
  )

type ButtonProps = ComponentProps<'button'> &
  ButtonStyleOptions & { loading?: boolean }

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant,
      size,
      fullWidth,
      loading = false,
      disabled,
      className,
      children,
      type = 'button',
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          buttonClasses({ variant, size, fullWidth }),
          loading && 'disabled:opacity-90',
          className,
        )}
        {...props}
      >
        {loading && <Spinner size="sm" />}
        {children}
      </button>
    )
  },
)

type ButtonLinkProps = ComponentProps<typeof Link> & ButtonStyleOptions

export function ButtonLink({
  variant,
  size,
  fullWidth,
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(buttonClasses({ variant, size, fullWidth }), className)}
      {...props}
    />
  )
}
