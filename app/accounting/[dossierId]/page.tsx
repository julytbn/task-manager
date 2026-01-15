'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ChargeDetaileeForm from '@/components/accounting/ChargeDetaileeForm';
import ChargesParJourView from '@/components/accounting/ChargesParJourView';
import SituationFinanciereView from '@/components/accounting/SituationFinanciereView';
import ChargesDetailTable from '@/components/accounting/ChargesDetailTable';

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
}

export default function DossierDetailPage() {
  const params = useParams();
  const dossierId = (params?.dossierId as string) || '';
  const router = useRouter();

  const [dossier, setDossier] = useState<DossierComptable | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('situation');

  useEffect(() => {
    fetchDossier();
  }, [dossierId]);

  const fetchDossier = async () => {
    try {
      const response = await fetch(`/api/dossiers/${dossierId}`);
      if (response.ok) {
        const data = await response.json();
        setDossier(data);
      }
    } catch (error) {
      console.error('Erreur récupération dossier:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChargeAdded = () => {
    fetchDossier();
  };

  if (loading) {
    return (
      <div className="p-6">
        <p>Chargement...</p>
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-500">Dossier non trouvé</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/accounting" className="hover:text-gray-700">
          Comptabilité
        </Link>
        <span>/</span>
        <span>
          {dossier.mois}/{dossier.annee}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Dossier {dossier.mois}/{dossier.annee}
          </h1>
          {dossier.client && (
            <p className="text-gray-500 mt-1">
              {dossier.client.prenom} {dossier.client.nom} -{' '}
              {dossier.client.entreprise}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <span
            className={`px-3 py-1 rounded font-semibold ${
              dossier.statut === 'VALIDE'
                ? 'bg-green-100 text-green-800'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            {dossier.statut}
          </span>
          <Button variant="outline" onClick={() => router.push('/accounting')}>
            ← Retour
          </Button>
        </div>
      </div>

      {/* Résumé rapide */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-500 text-sm mb-1">Entrées</p>
            <p className="text-2xl font-bold">
              {(dossier.totalEntrees / 1000).toFixed(1)}k€
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-500 text-sm mb-1">Charges HT</p>
            <p className="text-2xl font-bold">
              {(dossier.totalChargesHT / 1000).toFixed(1)}k€
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-500 text-sm mb-1">TVA</p>
            <p className="text-2xl font-bold">
              {(dossier.totalTVA / 1000).toFixed(1)}k€
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-500 text-sm mb-1">Résultat</p>
            <p
              className={`text-2xl font-bold ${
                dossier.resultat >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {(dossier.resultat / 1000).toFixed(1)}k€
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="charges-detail">Détail des Charges</TabsTrigger>
          <TabsTrigger value="situation">Situation financière</TabsTrigger>
          <TabsTrigger value="charges">Charges par jour</TabsTrigger>
          <TabsTrigger value="ajouter">Ajouter charge</TabsTrigger>
        </TabsList>

        <TabsContent value="charges-detail" className="space-y-4">
          <ChargesDetailTable dossierId={dossierId} />
        </TabsContent>

        <TabsContent value="situation" className="space-y-4">
          <SituationFinanciereView dossierId={dossierId} />
        </TabsContent>

        <TabsContent value="charges" className="space-y-4">
          <ChargesParJourView dossierId={dossierId} />
        </TabsContent>

        <TabsContent value="ajouter" className="space-y-4">
          <ChargeDetaileeForm
            dossierId={dossierId}
            onSuccess={handleChargeAdded}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
