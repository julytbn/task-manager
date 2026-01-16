"use client"

import React, { InputHTMLAttributes } from 'react'
import { LucideIcon } from 'lucide-react'

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  icon?: LucideIcon
  error?: string
  helperText?: string
  variant?: 'primary' | 'secondary'
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({
    label,
    icon: Icon,
    error,
    helperText,
    variant = 'primary',
    className,
    ...props
  }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="block text-sm font-semibold text-[var(--color-black-deep)] uppercase tracking-wide">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <Icon
              size={18}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[var(--color-gold)] pointer-events-none"
            />
          )}
          <input
            ref={ref}
            className={`w-full ${Icon ? 'pl-12' : 'px-4'} py-3 rounded-lg bg-[var(--color-offwhite)] text-[var(--color-black-deep)] border-2 transition-all duration-200 placeholder:text-[var(--color-anthracite)]/70 focus:outline-none ${
              error
                ? 'border-red-500 focus:border-red-600'
                : 'border-[var(--color-gold)]/30 focus:border-[var(--color-gold)]'
            } ${className}`}
            {...props}
          />
        </div>
        {error && (
          <p className="text-sm text-red-600 font-medium flex items-center gap-1">
            ⚠️ {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-xs text-[var(--color-anthracite)]/70">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

FormField.displayName = 'FormField'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading = false, children, ...props }, ref) => {
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2.5 text-base',
      lg: 'px-6 py-3 text-lg',
    }

    const variantClasses = {
      primary:
        'btn-primary hover:bg-[var(--color-gold-accent)] active:scale-95',
      secondary:
        'btn-secondary hover:bg-[var(--color-gold)] hover:text-[var(--color-black-deep)]',
      danger:
        'bg-red-600 text-white rounded-lg border-none hover:bg-red-700 active:scale-95',
    }

    return (
      <button
        ref={ref}
        disabled={isLoading || props.disabled}
        className={`font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]} ${variantClasses[variant]}`}
        {...props}
      >
        {isLoading && (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  error?: string
  options: Array<{ label: string; value: string | number }>
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="block text-sm font-semibold text-[var(--color-black-deep)] uppercase tracking-wide">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full px-4 py-3 rounded-lg bg-[var(--color-offwhite)] text-[var(--color-black-deep)] border-2 transition-all duration-200 focus:outline-none ${
            error
              ? 'border-red-500 focus:border-red-600'
              : 'border-[var(--color-gold)]/30 focus:border-[var(--color-gold)]'
          } ${className}`}
          {...props}
        >
          <option value="">-- Sélectionner --</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-sm text-red-600 font-medium">⚠️ {error}</p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'
