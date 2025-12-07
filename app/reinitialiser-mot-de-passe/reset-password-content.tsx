'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff, Check, AlertCircle, ArrowLeft } from 'lucide-react'

export default function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [passwordReset, setPasswordReset] = useState(false)

  useEffect(() => {
    if (!token) {
      setMessage({ 
        type: 'error', 
        text: 'Token de réinitialisation invalide ou expiré' 
      })
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (newPassword !== confirmPassword) {
      setMessage({ 
        type: 'error', 
        text: 'Les mots de passe ne correspondent pas' 
      })
      return
    }

    if (newPassword.length < 6) {
      setMessage({ 
        type: 'error', 
        text: 'Le mot de passe doit contenir au moins 6 caractères' 
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token, 
          newPassword 
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setPasswordReset(true)
        setMessage({ 
          type: 'success', 
          text: 'Mot de passe réinitialisé avec succès' 
        })
        setTimeout(() => {
          router.push('/connexion')
        }, 2000)
      } else {
        setMessage({ 
          type: 'error', 
          text: data.message || 'Erreur lors de la réinitialisation' 
        })
      }
    } catch (err) {
      console.error(err)
      setMessage({ 
        type: 'error', 
        text: 'Erreur de connexion au serveur' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col justify-center px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--color-offwhite)' }}>
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Image
                src="/kekeli-logo.svg"
                alt="Kekeli Logo"
                width={80}
                height={40}
              />
            </div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--color-gold)' }}>
              KEKELI GROUP
            </h1>
          </div>

          <div className="bg-white py-8 px-6 shadow-lg rounded-lg border-t-4" style={{ borderTopColor: 'var(--color-gold)' }}>
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#fee2e2' }}>
                <AlertCircle size={24} className="text-red-600" />
              </div>
              <p className="text-center text-gray-700 font-medium">Lien invalide ou expiré</p>
              <p className="text-center text-sm text-gray-600 mb-4">
                Le lien de réinitialisation est invalide ou a expiré. Veuillez réessayer.
              </p>
              <Link href="/mot-de-passe-oublie" className="inline-flex items-center gap-2 text-sm transition hover:opacity-75" style={{ color: 'var(--color-gold)' }}>
                <ArrowLeft size={16} />
                Demander un nouveau lien
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--color-offwhite)' }}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo et titre en haut */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/kekeli-logo.svg"
              alt="Kekeli Logo"
              width={80}
              height={40}
            />
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-gold)' }}>
            KEKELI GROUP
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            Créer un nouveau mot de passe
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-white py-8 px-6 shadow-lg rounded-lg border-t-4" style={{ borderTopColor: 'var(--color-gold)' }}>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {message && (
              <div className={`p-4 rounded-lg border flex items-center gap-2 ${
                message.type === 'success' 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                {message.type === 'success' ? (
                  <Check className="text-green-600" size={18} />
                ) : (
                  <AlertCircle className="text-red-600" size={18} />
                )}
                <span className={`text-sm font-medium ${
                  message.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {message.text}
                </span>
              </div>
            )}

            {!passwordReset ? (
              <>
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-semibold" style={{ color: 'var(--color-black-deep)' }}>
                    Nouveau mot de passe
                  </label>
                  <div className="mt-2 relative">
                    <input
                      id="newPassword"
                      name="newPassword"
                      type={showPasswords ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                    >
                      {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold" style={{ color: 'var(--color-black-deep)' }}>
                    Confirmer le mot de passe
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPasswords ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2 px-4 rounded-lg font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: 'var(--color-gold)', color: 'var(--color-black-deep)' }}
                >
                  {isLoading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
                </button>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--color-gold)' }}>
                  <Check size={24} style={{ color: 'var(--color-black-deep)' }} />
                </div>
                <p className="text-gray-700 font-medium mb-2">Mot de passe réinitialisé !</p>
                <p className="text-sm text-gray-600">
                  Vous allez être redirigé vers la connexion...
                </p>
              </div>
            )}

            {!passwordReset && (
              <div className="text-center pt-4 border-t border-gray-200">
                <Link href="/connexion" className="inline-flex items-center gap-2 text-sm transition hover:opacity-75" style={{ color: 'var(--color-gold)' }}>
                  <ArrowLeft size={16} />
                  Retour à la connexion
                </Link>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
