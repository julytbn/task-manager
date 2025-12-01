import { EnumValue } from './useEnums'

export function enumToSelectOptions(enumValues: EnumValue[]) {
  return enumValues.map((e) => ({
    value: e.cle,
    label: e.label
  }))
}

export function enumToSelectOptionsForSelect(enumValues: EnumValue[]): Array<{ value: string; label: string }> {
  return enumValues.map((e) => ({
    value: e.cle,
    label: e.label
  }))
}

// Pour les options de select HTML standard
export function enumToHTMLOptions(enumValues: EnumValue[]) {
  return enumValues.map((e) => `<option value="${e.cle}">${e.label}</option>`).join('\n')
}

// Créer un objet de mapping pour les couleurs/styles
export const statusColorMap: Record<string, string> = {
  'A_FAIRE': 'bg-gray-100 text-gray-700 border-gray-300',
  'EN_COURS': 'bg-blue-100 text-blue-700 border-blue-300',
  'EN_REVISION': 'bg-yellow-100 text-yellow-700 border-yellow-300',
  'TERMINE': 'bg-green-100 text-green-700 border-green-300',
  'ANNULE': 'bg-red-100 text-red-700 border-red-300'
}

export const priorityColorMap: Record<string, string> = {
  'BASSE': 'bg-gray-50 border-gray-200',
  'MOYENNE': 'bg-yellow-50 border-yellow-200',
  'HAUTE': 'bg-orange-50 border-orange-200',
  'URGENTE': 'bg-red-50 border-red-200'
}
