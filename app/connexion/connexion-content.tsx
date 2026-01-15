 'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff } from 'lucide-react'

function ConnexionContent() {
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState('')
  const [chargement, setChargement] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const message = searchParams?.get('message')
    if (message) {
      setErreur('')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErreur('')
    setChargement(true)

    try {
      const result = await signIn('credentials', {
        email,
        motDePasse,
        redirect: false
      })

      if (result?.error) {
        setErreur('Email ou mot de passe incorrect')
      } else {
        const session = await getSession()
        const role = session?.user?.role as string | undefined

        if (role === 'ADMIN' || role === 'MANAGER') {
          router.push('/dashboard')
        } else if (role === 'EMPLOYE') {
          router.push('/dashboard/employe')
        } else if (role === 'CONSULTANT') {
          router.push('/projets')
        } else {
          router.push('/')
        }
      }
    } catch (err) {
      console.error(err)
      setErreur('Erreur de connexion')
    } finally {
      setChargement(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--color-offwhite)' }}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo et titre en haut */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-8">
            <div className="relative w-40 h-32 flex items-center justify-center group">
              {/* Glow background effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-gold)]/25 to-[var(--color-gold)]/10 rounded-xl blur-3xl opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>
              {/* Logo container - Pure black */}
              <div className="absolute inset-0 bg-[#000000] rounded-xl shadow-2xl border border-[var(--color-gold)]/50"></div>
              {/* Logo image */}
              <img
                src="/imgkekeli.jpg"
                alt="Kekeli Logo"
                className="relative w-36 h-28 object-contain drop-shadow-2xl group-hover:scale-110 transition-transform duration-300"
                style={{
                  filter: 'drop-shadow(0 4px 12px rgba(212, 175, 55, 0.7)) brightness(1.7) contrast(2.3) saturate(1.5)',
                }}
              />
            </div>
          </div>
          <h1 className="text-4xl font-bold gold-gradient-text drop-shadow-lg">
            KEKELI GROUP
          </h1>
          <p className="text-sm text-[var(--color-anthracite)] mt-3 font-medium">
            Connectez-vous pour accéder à votre espace de travail
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-white py-8 px-6 shadow-lg rounded-lg border-t-4" style={{ borderTopColor: 'var(--color-gold)' }}>
            <form className="space-y-6" onSubmit={handleSubmit}>
              {erreur && (
                <div className="p-4 rounded-lg border border-red-200 bg-red-50 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-600"></div>
                  <span className="text-red-800 text-sm font-medium">{erreur}</span>
                </div>
              )}

              {searchParams?.get('message') && (
                <div className="p-4 rounded-lg border border-green-200 bg-green-50 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-600"></div>
                  <span className="text-green-800 text-sm font-medium">{searchParams?.get('message')}</span>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-semibold" style={{ color: 'var(--color-black-deep)' }}>
                  Adresse Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition"
                  placeholder="vous@example.com"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="motDePasse" className="block text-sm font-semibold" style={{ color: 'var(--color-black-deep)' }}>
                    Mot de passe
                  </label>
                  <Link href="/mot-de-passe-oublie" className="text-xs transition hover:opacity-75" style={{ color: 'var(--color-gold)' }}>
                    Mot de passe oublié ?
                  </Link>
                </div>
                <div className="mt-2 relative">
                  <input
                    id="motDePasse"
                    name="motDePasse"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={motDePasse}
                    onChange={(e) => setMotDePasse(e.target.value)}
                    className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={chargement}
                  className="w-full py-2 px-4 rounded-lg font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: 'var(--color-gold)', color: 'var(--color-black-deep)' }}
                >
                  {chargement ? 'Connexion en cours...' : 'Se connecter'}
                </button>
              </div>

              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Pas de compte ?{' '}
                  <Link href="/inscription" className="font-semibold transition hover:opacity-75" style={{ color: 'var(--color-gold)' }}>
                    S&apos;inscrire
                  </Link>
                </p>
              </div>
            </form>
        </div>
      </div>
    </div>
  )
}

export default function Connexion() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <ConnexionContent />
    </Suspense>
  )
}
