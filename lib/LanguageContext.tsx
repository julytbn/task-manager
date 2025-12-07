import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Language, TranslationKey, t } from '@/lib/translations'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('fr')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Charger la langue depuis localStorage au montage du composant
    const savedLanguage = localStorage.getItem('user_language') as Language | null
    if (savedLanguage && ['fr', 'en', 'es'].includes(savedLanguage)) {
      setLanguageState(savedLanguage)
    } else {
      setLanguageState('fr')
    }
    setMounted(true)
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('user_language', lang)
    document.documentElement.lang = lang
  }

  const translate = (key: TranslationKey): string => {
    return t(language, key)
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translate }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    // Retourner une valeur par défaut si le contexte n'est pas disponible
    return {
      language: 'fr' as Language,
      setLanguage: () => {},
      t: (key: TranslationKey) => t('fr', key)
    }
  }
  return context
}
