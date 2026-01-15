'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

interface DossierComptable {
  id: string;
  clientId: string;
  mois: number;
  annee: number;
  statut: 'EN_COURS' | 'VALIDE';
  totalEntrees: number;
  totalChargesHT: number;
  totalTVA: number;
  resultat: number;
  client?: {
    nom: string;
    prenom: string;
    entreprise?: string;
  };
  createdAt: string;
}

export default function AccountingPage() {
  const [dossiers, setDossiers] = useState<DossierComptable[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    // À remplacer par la logique réelle d'obtention du clientId
    const id = localStorage.getItem('clientId');
    if (id) {
      setClientId(id);
      fetchDossiers(id);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchDossiers = async (cId: string) => {
    try {
      const response = await fetch(`/api/clients/${cId}/dossiers`);
      if (response.ok) {
        const data = await response.json();
        setDossiers(data);
      }
    } catch (error) {
      console.error('Erreur récupération dossiers:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewDossier = async () => {
    const now = new Date();
    const mois = now.getMonth() + 1;
    const annee = now.getFullYear();

    try {
      const response = await fetch('/api/dossiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          mois,
          annee,
          notes: `Dossier ${mois}/${annee}`,
        }),
      });

      if (response.ok) {
        const newDossier = await response.json();
        setDossiers([newDossier, ...dossiers]);
      }
    } catch (error) {
      console.error('Erreur création dossier:', error);
    }
  };

  if (!clientId) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-500">
              Client ID non trouvé. Veuillez d'abord vous connecter.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Comptabilité VIP</h1>
          <p className="text-gray-500 mt-1">Gestion des dossiers comptables mensuels</p>
        </div>
        <Button onClick={createNewDossier} className="gap-2">
          <span>➕</span>
          Nouveau dossier
        </Button>
      </div>

      {/* Dossiers Grid */}
      {dossiers.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <p className="text-gray-500 mb-4">Aucun dossier comptable</p>
            <Button onClick={createNewDossier} variant="outline">
              Créer le premier dossier
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dossiers.map((dossier) => (
            <Link key={dossier.id} href={`/accounting/${dossier.id}`}>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {dossier.mois}/{dossier.annee}
                      </CardTitle>
                      {dossier.client && (
                        <p className="text-sm text-gray-500 mt-1">
                          {dossier.client.prenom} {dossier.client.nom}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        dossier.statut === 'VALIDE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {dossier.statut}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Entrées:</span>
                      <span className="font-semibold">
                        {dossier.totalEntrees.toLocaleString('fr-FR', {
                          style: 'currency',
                          currency: 'EUR',
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Charges HT:</span>
                      <span>
                        {dossier.totalChargesHT.toLocaleString('fr-FR', {
                          style: 'currency',
                          currency: 'EUR',
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">TVA:</span>
                      <span>
                        {dossier.totalTVA.toLocaleString('fr-FR', {
                          style: 'currency',
                          currency: 'EUR',
                        })}
                      </span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>Résultat:</span>
                      <span
                        className={
                          dossier.resultat >= 0 ? 'text-green-600' : 'text-red-600'
                        }
                      >
                        {dossier.resultat.toLocaleString('fr-FR', {
                          style: 'currency',
                          currency: 'EUR',
                        })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
