'use client'

import { useEnums, EnumType, EnumValue } from '@/lib/useEnums'

interface EnumSelectProps {
  type: EnumType
  value: string
  onChange: (value: string) => void
  label?: string
  required?: boolean
  placeholder?: string
  disabled?: boolean
}

export function EnumSelect({
  type,
  value,
  onChange,
  label,
  required = false,
  placeholder = 'Sélectionner...',
  disabled = false
}: EnumSelectProps) {
  const { data, loading, error } = useEnums(type)

  if (error) {
    return (
      <div className="text-red-500 text-sm">
        Erreur: {error}
      </div>
    )
  }

  return (
    <div>
      {label && <label className="text-sm block mb-1">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading || disabled}
        required={required}
        className="w-full border rounded px-2 py-1 disabled:bg-gray-100"
      >
        {!required && <option value="">{placeholder}</option>}
        {data.map((item: EnumValue) => (
          <option key={item.id} value={item.cle}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  )
}
