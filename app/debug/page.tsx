'use client'

import { useEffect, useState } from 'react'
import MainLayout from '@/components/MainLayout'

export default function DebugPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/debug/my-data')
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(String(err))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return <MainLayout><div className="p-8">Chargement...</div></MainLayout>
  if (error) return <MainLayout><div className="p-8 text-red-600">Erreur: {error}</div></MainLayout>

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        <h1 className="text-3xl font-bold">Debug - Données de l'employé</h1>

        {/* User Info */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-bold mb-4">Infos Utilisateur</h2>
          <div className="space-y-2">
            <p><strong>ID:</strong> {data?.user?.id}</p>
            <p><strong>Nom:</strong> {data?.user?.prenom} {data?.user?.nom}</p>
            <p><strong>Email:</strong> {data?.user?.email}</p>
            <p><strong>Rôle:</strong> {data?.user?.role}</p>
          </div>
        </div>

        {/* Mes Tâches */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-bold mb-4">
            Tâches Assignées à Moi ({data?.tachesAssigneeAMoi?.count || 0})
          </h2>
          {data?.tachesAssigneeAMoi?.count > 0 ? (
            <div className="space-y-2">
              {data?.tachesAssigneeAMoi?.data?.map((t: any) => (
                <div key={t.id} className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <p><strong>{t.titre}</strong></p>
                  <p className="text-sm text-gray-600">ID: {t.id}</p>
                  <p className="text-sm text-gray-600">assigneAId: {t.assigneAId}</p>
                  <p className="text-sm text-gray-600">projetId: {t.projetId}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">❌ Aucune tâche assignée</p>
          )}
        </div>

        {/* Mes Projets */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-bold mb-4">
            Projets ({data?.mesProjetsDirect?.count || 0})
          </h2>
          {data?.mesProjetsDirect?.count > 0 ? (
            <div className="space-y-2">
              {data?.mesProjetsDirect?.data?.map((p: any) => (
                <div key={p.id} className="p-3 bg-green-50 border border-green-200 rounded">
                  <p><strong>{p.titre}</strong></p>
                  <p className="text-sm text-gray-600">ID: {p.id}</p>
                  <p className="text-sm text-gray-600">Tâches: {p._count?.taches}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Aucun projet</p>
          )}
        </div>

        {/* Toutes les Tâches (échantillon) */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-bold mb-4">
            Échantillon de Toutes les Tâches ({data?.echantillonToutesTaches?.count || 0})
          </h2>
          {data?.echantillonToutesTaches?.count > 0 ? (
            <div className="space-y-2">
              {data?.echantillonToutesTaches?.data?.map((t: any) => (
                <div key={t.id} className="p-3 bg-gray-50 border border-gray-200 rounded text-sm">
                  <p><strong>{t.titre}</strong></p>
                  <p className="text-gray-600">assigneAId: {t.assigneAId || 'null'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Aucune tâche</p>
          )}
        </div>

        {/* Raw JSON */}
        <div className="bg-gray-900 text-green-400 rounded-lg p-6 font-mono text-sm overflow-auto max-h-96">
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      </div>
    </MainLayout>
  )
}
