import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from 'react'

import { cn } from '@/utils/tailwind'

const controlClasses = (invalid?: boolean) =>
  cn(
    'w-full rounded-md border bg-card px-3.5 text-[15px] text-ink placeholder:text-stone-light',
    'transition-[border-color,box-shadow] duration-150 ease-out',
    'focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/25 focus-visible:ring-offset-0',
    'disabled:cursor-not-allowed disabled:bg-sunken disabled:text-stone',
    invalid
      ? 'border-danger focus:border-danger focus:ring-danger/20'
      : 'border-line-strong hover:border-navy-300',
  )

interface FieldProps {
  label: ReactNode
  htmlFor: string
  hint?: ReactNode
  error?: ReactNode
  required?: boolean
  className?: string
  children: ReactNode
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  className,
  children,
}: FieldProps) {
  const hintId = hint ? `${htmlFor}-hint` : undefined
  const errorId = error ? `${htmlFor}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  // Link hint and error text to the control so screen readers announce them.
  const control = Children.map(children, (child) =>
    isValidElement(child) && describedBy
      ? cloneElement(child as ReactElement<{ 'aria-describedby'?: string }>, {
          'aria-describedby': describedBy,
        })
      : child,
  )

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink">
        {label}
        {required && (
          <span aria-hidden className="ml-0.5 text-danger">
            *
          </span>
        )}
      </label>
      {control}
      {hint && (
        <p id={hintId} className="text-[13px] text-stone">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-[13px] font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

type InputProps = ComponentProps<'input'> & { invalid?: boolean }

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(controlClasses(invalid), 'h-11', className)}
      {...props}
    />
  )
})

type TextareaProps = ComponentProps<'textarea'> & { invalid?: boolean }

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ invalid, className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(controlClasses(invalid), 'min-h-24 py-2.5', className)}
        {...props}
      />
    )
  },
)

type SelectProps = ComponentProps<'select'> & { invalid?: boolean }

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ invalid, className, children, ...props }, ref) {
    return (
      <div className="relative">
        <select
          ref={ref}
          aria-invalid={invalid || undefined}
          className={cn(
            controlClasses(invalid),
            'h-11 appearance-none pr-10',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path
            d="M5 7.5l5 5 5-5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    )
  },
)

type CheckboxProps = Omit<ComponentProps<'input'>, 'type'> & {
  label: ReactNode
  description?: ReactNode
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ label, description, className, id, ...props }, ref) {
    return (
      <label
        htmlFor={id}
        className={cn(
          'flex cursor-pointer items-start gap-3 text-[15px] text-ink',
          className,
        )}
      >
        <input
          ref={ref}
          id={id}
          type="checkbox"
          className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-line-strong accent-sage"
          {...props}
        />
        <span>
          {label}
          {description && (
            <span className="mt-0.5 block text-[13px] text-stone">
              {description}
            </span>
          )}
        </span>
      </label>
    )
  },
)
