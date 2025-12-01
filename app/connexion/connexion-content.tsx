 'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import LoginHeader from '../../components/LoginHeader'

function ConnexionContent() {
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState('')
  const [chargement, setChargement] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const message = searchParams.get('message')
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
    <>
      <LoginHeader />
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Connexion à Kekeli Group
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Accédez à votre espace de travail
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {erreur && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {erreur}
              </div>
            )}

            {searchParams.get('message') && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                {searchParams.get('message')}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="motDePasse" className="block text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <input
                id="motDePasse"
                name="motDePasse"
                type="password"
                required
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={chargement}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
              >
                {chargement ? 'Connexion...' : 'Se connecter'}
              </button>
            </div>

            <div className="text-center">
              <Link href="/inscription" className="text-blue-600 hover:text-blue-500">
                Pas de compte ? S&apos;inscrire
              </Link>
            </div>
          </form>
        </div>
      </div>
      </div>
    </>
  )
}

export default function Connexion() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <ConnexionContent />
    </Suspense>
  )
}
