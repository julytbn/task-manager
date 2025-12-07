'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Check, AlertCircle } from 'lucide-react'

export default function ForgotPasswordContent() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setEmailSent(true)
        setMessage({ 
          type: 'success', 
          text: 'Un lien de réinitialisation a été envoyé à votre adresse email' 
        })
      } else {
        setMessage({ 
          type: 'error', 
          text: data.message || 'Une erreur est survenue. Veuillez réessayer.' 
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
            Réinitialiser votre mot de passe
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

            {!emailSent ? (
              <>
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold" style={{ color: 'var(--color-black-deep)' }}>
                    Adresse Email
                  </label>
                  <p className="text-xs text-gray-600 mt-1 mb-2">
                    Entrez l'adresse email associée à votre compte. Nous vous enverrons un lien pour réinitialiser votre mot de passe.
                  </p>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition"
                    placeholder="vous@example.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2 px-4 rounded-lg font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: 'var(--color-gold)', color: 'var(--color-black-deep)' }}
                >
                  {isLoading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
                </button>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--color-gold)' }}>
                  <Check size={24} style={{ color: 'var(--color-black-deep)' }} />
                </div>
                <p className="text-gray-700 font-medium mb-2">Email envoyé !</p>
                <p className="text-sm text-gray-600 mb-6">
                  Vérifiez votre boîte mail et cliquez sur le lien fourni pour réinitialiser votre mot de passe.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEmailSent(false)
                    setEmail('')
                    setMessage(null)
                  }}
                  className="text-sm transition hover:opacity-75" style={{ color: 'var(--color-gold)' }}
                >
                  Réessayer avec un autre email
                </button>
              </div>
            )}

            <div className="text-center pt-4 border-t border-gray-200">
              <Link href="/connexion" className="inline-flex items-center gap-2 text-sm transition hover:opacity-75" style={{ color: 'var(--color-gold)' }}>
                <ArrowLeft size={16} />
                Retour à la connexion
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
