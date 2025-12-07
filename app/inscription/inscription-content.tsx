'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff } from 'lucide-react'

export default function InscriptionContent() {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    departement: '',
    motDePasse: '',
    confirmationMotDePasse: '',
    dateNaissance: ''
  })
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState('')
  const [chargement, setChargement] = useState(false)
  const [showPasswords, setShowPasswords] = useState(false)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErreur('')
    setSucces('')
    setChargement(true)

    // Validation
    if (formData.motDePasse !== formData.confirmationMotDePasse) {
      setErreur('Les mots de passe ne correspondent pas')
      setChargement(false)
      return
    }

    if (formData.motDePasse.length < 6) {
      setErreur('Le mot de passe doit contenir au moins 6 caractères')
      setChargement(false)
      return
    }

    try {
      const response = await fetch('/api/auth/inscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSucces('Inscription réussie ! Redirection...')
        setTimeout(() => {
          router.push('/connexion?message=Inscription réussie. Veuillez vous connecter.')
        }, 1500)
      } else {
        setErreur(data.message || 'Erreur lors de l\'inscription')
      }
    } catch (err) {
      console.error(err)
      setErreur('Erreur de connexion au serveur')
    } finally {
      setChargement(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--color-offwhite)' }}>
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
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
            Rejoignez notre équipe et gérez vos projets efficacement
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-white py-8 px-6 shadow-lg rounded-lg border-t-4" style={{ borderTopColor: 'var(--color-gold)' }}>
          <h2 className="text-center text-2xl font-bold mb-2" style={{ color: 'var(--color-black-deep)' }}>
            Créer un compte
          </h2>
          <p className="text-center text-sm text-gray-600 mb-6">
            Rejoignez notre plateforme de gestion intégrée
          </p>
            <form className="space-y-6" onSubmit={handleSubmit}>
              {erreur && (
                <div className="p-4 rounded-lg border border-red-200 bg-red-50 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-600"></div>
                  <span className="text-red-800 text-sm font-medium">{erreur}</span>
                </div>
              )}

              {succes && (
                <div className="p-4 rounded-lg border border-green-200 bg-green-50 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-600"></div>
                  <span className="text-green-800 text-sm font-medium">{succes}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="prenom" className="block text-sm font-semibold" style={{ color: 'var(--color-black-deep)' }}>
                    Prénom *
                  </label>
                  <input
                    id="prenom"
                    name="prenom"
                    type="text"
                    required
                    value={formData.prenom}
                    onChange={handleChange}
                    placeholder="Jean"
                    className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label htmlFor="nom" className="block text-sm font-semibold" style={{ color: 'var(--color-black-deep)' }}>
                    Nom *
                  </label>
                  <input
                    id="nom"
                    name="nom"
                    type="text"
                    required
                    value={formData.nom}
                    onChange={handleChange}
                    placeholder="Dupont"
                    className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold" style={{ color: 'var(--color-black-deep)' }}>
                  Email *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="jean.dupont@example.com"
                  className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="telephone" className="block text-sm font-semibold" style={{ color: 'var(--color-black-deep)' }}>
                    Téléphone (optionnel)
                  </label>
                  <input
                    id="telephone"
                    name="telephone"
                    type="tel"
                    value={formData.telephone}
                    onChange={handleChange}
                    placeholder="+33 6 12 34 56 78"
                    className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label htmlFor="departement" className="block text-sm font-semibold" style={{ color: 'var(--color-black-deep)' }}>
                    Département
                  </label>
                  <select
                    id="departement"
                    name="departement"
                    value={formData.departement}
                    onChange={handleChange}
                    className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition bg-white"
                  >
                    <option value="">Sélectionnez un département</option>
                    <option value="Comptabilité">Comptabilité</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Développement">Développement</option>
                    <option value="Communication">Communication</option>
                    <option value="Formation">Formation</option>
                    <option value="Direction">Direction</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="dateNaissance" className="block text-sm font-semibold" style={{ color: 'var(--color-black-deep)' }}>
                  Date de naissance (optionnel)
                </label>
                <input
                  id="dateNaissance"
                  name="dateNaissance"
                  type="date"
                  value={formData.dateNaissance}
                  onChange={handleChange}
                  className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition"
                />
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div>
                  <label htmlFor="motDePasse" className="block text-sm font-semibold" style={{ color: 'var(--color-black-deep)' }}>
                    Mot de passe *
                  </label>
                  <div className="mt-2 relative">
                    <input
                      id="motDePasse"
                      name="motDePasse"
                      type={showPasswords ? 'text' : 'password'}
                      required
                      value={formData.motDePasse}
                      onChange={handleChange}
                      placeholder="Minimum 6 caractères"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition"
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
                  <label htmlFor="confirmationMotDePasse" className="block text-sm font-semibold" style={{ color: 'var(--color-black-deep)' }}>
                    Confirmer le mot de passe *
                  </label>
                  <input
                    id="confirmationMotDePasse"
                    name="confirmationMotDePasse"
                    type={showPasswords ? 'text' : 'password'}
                    required
                    value={formData.confirmationMotDePasse}
                    onChange={handleChange}
                    placeholder="Confirmez votre mot de passe"
                    className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={chargement}
                className="w-full py-2 px-4 rounded-lg font-semibold text-white transition hover:opacity-90 disabled:opacity-60 mt-6"
                style={{ backgroundColor: 'var(--color-gold)', color: 'var(--color-black-deep)' }}
              >
                {chargement ? 'Inscription en cours...' : 'S\'inscrire'}
              </button>

              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Vous avez déjà un compte ?{' '}
                  <Link href="/connexion" className="font-semibold transition hover:opacity-75" style={{ color: 'var(--color-gold)' }}>
                    Se connecter
                  </Link>
                </p>
              </div>
            </form>
        </div>
      </div>
    </div>
  )
}
