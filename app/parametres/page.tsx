"use client"

import React, { useEffect, useState } from 'react'
import MainLayout from '@/components/MainLayout'
import { useSession } from 'next-auth/react'
import { Eye, EyeOff, Check, AlertCircle } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'

export default function ParametresPage() {
  const { data: session, update } = useSession()
  const { language, setLanguage, t } = useLanguage()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Profil
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [email, setEmail] = useState('')

  // Mot de passe
  const [showPasswords, setShowPasswords] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  // Préférences
  const [theme, setTheme] = useState('light')
  const [emailNotifications, setEmailNotifications] = useState(true)

  useEffect(() => {
    if (session?.user) {
      setNom(session.user.nom || '')
      setPrenom(session.user.prenom || '')
      setEmail(session.user.email || '')
    }

    // Charger les préférences depuis localStorage
    const preferences = localStorage.getItem('user_preferences')
    if (preferences) {
      try {
        const prefs = JSON.parse(preferences)
        setTheme(prefs.theme || 'light')
        setEmailNotifications(prefs.emailNotifications !== false)
      } catch (err) {
        console.error('Erreur chargement préférences:', err)
      }
    }

    // Appliquer le thème
    applyTheme(theme)
  }, [])

  const applyTheme = (selectedTheme: string) => {
    const html = document.documentElement
    if (selectedTheme === 'dark') {
      html.classList.add('dark')
      html.style.colorScheme = 'dark'
    } else {
      html.classList.remove('dark')
      html.style.colorScheme = 'light'
    }
  }

  const savePreferences = async () => {
    const preferences = {
      theme,
      emailNotifications
    }
    localStorage.setItem('user_preferences', JSON.stringify(preferences))
    applyTheme(theme)
    setMessage({ type: 'success', text: t('preferencesSaved') })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom, prenom, email }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erreur lors de la mise à jour')
      }

      await update()
      setMessage({ type: 'success', text: t('profileUpdated') })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : t('error') })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setMessage(null)

    if (newPassword !== confirmPassword) {
      setPasswordError(t('passwordsNotMatch'))
      return
    }

    if (newPassword.length < 6) {
      setPasswordError(t('passwordTooShort'))
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erreur lors du changement de mot de passe')
      }

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setMessage({ type: 'success', text: t('passwordChanged') })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : t('passwordChangeError') })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-8 max-w-4xl">
        <div>
          <h1 className="text-4xl font-bold gold-gradient-text">{t('settings')}</h1>
          <p className="text-gray-600 mt-2">{t('settingsDescription')}</p>
        </div>

        {/* Messages */}
        {message && (
          <div className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <Check className="text-green-600" size={20} />
            ) : (
              <AlertCircle className="text-red-600" size={20} />
            )}
            <span className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </span>
          </div>
        )}

        {/* Profil */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('personalInfo')}</h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('lastName')}</label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
                  placeholder={t('enterLastName')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('firstName')}</label>
                <input
                  type="text"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
                  placeholder={t('enterFirstName')}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
                placeholder={t('enterEmail')}
              />
            </div>
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-[var(--color-gold)] text-[var(--color-black-deep)] font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition"
              >
                {isLoading ? t('updating') : t('update')}
              </button>
            </div>
          </form>
        </div>

        {/* Changer le mot de passe */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('security')}</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('currentPassword')}</label>
              <div className="relative">
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
                  placeholder={t('enterCurrentPassword')}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('newPassword')}</label>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
                placeholder={t('enterNewPassword')}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('confirmPassword')}</label>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
                placeholder={t('confirmNewPassword')}
                required
              />
            </div>

            {passwordError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                {passwordError}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
              >
                {isLoading ? t('changingPassword') : t('changePassword')}
              </button>
            </div>
          </form>
        </div>

        {/* Apparence et Préférences */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('appearance')}</h2>
          <div className="space-y-6">
            {/* Thème */}
            <div className="flex items-center justify-between pb-6 border-b border-gray-200">
              <div>
                <h3 className="font-semibold text-gray-900">{t('theme')}</h3>
                <p className="text-sm text-gray-600 mt-1">{t('chooseTheme')}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setTheme('dark')}
                  className={`px-4 py-2 rounded-lg transition font-medium ${
                    theme === 'dark'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {t('dark')}
                </button>
                <button
                  onClick={() => setTheme('light')}
                  className={`px-4 py-2 rounded-lg transition font-medium ${
                    theme === 'light'
                      ? 'bg-gray-100 text-gray-900 border-2 border-gray-900'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {t('light')}
                </button>
              </div>
            </div>

            {/* Palette couleurs */}
            <div className="flex items-center justify-between pb-6 border-b border-gray-200">
              <div>
                <h3 className="font-semibold text-gray-900">{t('palette')}</h3>
                <p className="text-sm text-gray-600 mt-1">{t('paletteDescription')}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[var(--color-gold)] border-2 border-[var(--color-gold)]" title="Or" />
                <div className="w-8 h-8 rounded-full bg-[var(--color-black-deep)] border-2 border-gray-300" title="Noir profond" />
              </div>
            </div>

            {/* Langue */}
            <div className="flex items-center justify-between pb-6 border-b border-gray-200">
              <div>
                <h3 className="font-semibold text-gray-900">{t('language')}</h3>
                <p className="text-sm text-gray-600 mt-1">{t('selectLanguage')}</p>
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'fr' | 'en' | 'es')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] bg-white"
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{t('emailNotifications')}</h3>
                <p className="text-sm text-gray-600 mt-1">{t('emailNotificationsDescription')}</p>
              </div>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="sr-only"
                />
                <span className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  emailNotifications ? 'bg-[var(--color-gold)]' : 'bg-gray-300'
                }`}>
                  <span className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${
                    emailNotifications ? 'translate-x-6' : ''
                  }`} />
                </span>
              </label>
            </div>

            <div className="flex justify-end pt-6 border-t border-gray-200 mt-6">
              <button
                onClick={savePreferences}
                className="px-6 py-2 bg-[var(--color-gold)] text-[var(--color-black-deep)] font-semibold rounded-lg hover:opacity-90 transition"
              >
                {t('savePreferences')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

