'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">Kekeli Group</h1>
          <h2 className="text-2xl font-semibold text-gray-900">Créer un compte</h2>
          <p className="mt-2 text-sm text-gray-600">
            Rejoignez notre plateforme de gestion intégrée
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-lg rounded-lg">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {erreur && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {erreur}
              </div>
            )}

            {succes && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                {succes}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="prenom" className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone (optionnel)
              </label>
              <input
                id="telephone"
                name="telephone"
                type="tel"
                value={formData.telephone}
                onChange={handleChange}
                placeholder="+33 6 12 34 56 78"
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label htmlFor="departement" className="block text-sm font-medium text-gray-700 mb-1">
                Département
              </label>
              <select
                id="departement"
                name="departement"
                value={formData.departement}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
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

            <div>
              <label htmlFor="dateNaissance" className="block text-sm font-medium text-gray-700 mb-1">
                Date de naissance (optionnel)
              </label>
              <input
                id="dateNaissance"
                name="dateNaissance"
                type="date"
                value={formData.dateNaissance}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor="motDePasse" className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe *
                </label>
                <input
                  id="motDePasse"
                  name="motDePasse"
                  type="password"
                  required
                  value={formData.motDePasse}
                  onChange={handleChange}
                  placeholder="Minimum 6 caractères"
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label htmlFor="confirmationMotDePasse" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmer le mot de passe *
                </label>
                <input
                  id="confirmationMotDePasse"
                  name="confirmationMotDePasse"
                  type="password"
                  required
                  value={formData.confirmationMotDePasse}
                  onChange={handleChange}
                  placeholder="Confirmez votre mot de passe"
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={chargement}
              className="w-full flex justify-center py-2 px-4 rounded-md shadow-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed transition"
            >
              {chargement ? 'Inscription en cours...' : 'S\'inscrire'}
            </button>

            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Vous avez déjà un compte ?{' '}
                <Link href="/connexion" className="font-medium text-blue-600 hover:text-blue-500 transition">
                  Se connecter
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-gray-500">
        © 2025 Kekeli Group. Tous droits réservés.
      </p>
    </div>
  )
}
