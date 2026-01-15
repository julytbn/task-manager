'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ChargeDetaillee {
  id: string;
  fournisseur: string;
  designation: string;
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
  avecTVA: boolean;
  date: string;
  categorie?: string;
}

interface SituationData {
  totalEntrees: number;
  totalChargesHT: number;
  totalChargesTVA: number;
  totalChargesTTC: number;
  totalChargesAvecTVA?: number;
  totalChargesSansTVA?: number;
  nombreChargesAvecTVA?: number;
  nombreChargesSansTVA?: number;
  resultatNet: number;
  chargesParCategorie: Record<string, number>;
  chargesParFournisseur: Record<string, number>;
  chargesParJour: Record<string, number>;
  chargesDetailees?: ChargeDetaillee[];
  tauxTVAMoyen: number;
}

interface SituationFinanciereViewProps {
  dossierId: string;
}

export default function SituationFinanciereView({
  dossierId,
}: SituationFinanciereViewProps) {
  const [situation, setSituation] = useState<SituationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSituation = async () => {
      try {
        const response = await fetch(
          `/api/dossiers/${dossierId}/situation-financiere?summary=true`
        );
        if (response.ok) {
          const data = await response.json();
          setSituation(data);
        } else {
          setError('Erreur lors du chargement de la situation');
        }
      } catch (err) {
        setError('Erreur serveur');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSituation();
  }, [dossierId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-gray-500">Chargement de la situation financière...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!situation) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-gray-500">Aucune situation disponible</p>
        </CardContent>
      </Card>
    );
  }

  const tauxTVA = situation.totalChargesHT > 0
    ? ((situation.totalChargesTVA / situation.totalChargesHT) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Résumé Principal */}
      <Card>
        <CardHeader>
          <CardTitle>Résumé Financier - {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-gray-600 text-sm">Entrées</p>
              <p className="text-2xl font-bold text-blue-600">
                {(situation.totalEntrees / 1000).toFixed(1)}k€
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-gray-600 text-sm">Charges HT</p>
              <p className="text-2xl font-bold text-orange-600">
                {(situation.totalChargesHT / 1000).toFixed(1)}k€
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-gray-600 text-sm">TVA ({tauxTVA}%)</p>
              <p className="text-2xl font-bold text-purple-600">
                {(situation.totalChargesTVA / 1000).toFixed(1)}k€
              </p>
            </div>
            <div
              className={`p-4 rounded-lg ${
                situation.resultatNet >= 0 ? 'bg-green-50' : 'bg-red-50'
              }`}
            >
              <p className="text-gray-600 text-sm">Résultat Net</p>
              <p
                className={`text-2xl font-bold ${
                  situation.resultatNet >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {(situation.resultatNet / 1000).toFixed(1)}k€
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charges Avec TVA vs Sans TVA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Charges AVEC TVA */}
        <Card>
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-lg text-blue-900">
              📋 Charges AVEC TVA
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded">
                  <p className="text-xs text-gray-600">Nombre</p>
                  <p className="text-lg font-semibold">
                    {situation.nombreChargesAvecTVA || 0}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded">
                  <p className="text-xs text-gray-600">Montant HT</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {(
                      (situation.totalChargesAvecTVA || 0) / 1000
                    ).toFixed(1)}
                    k€
                  </p>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded border border-blue-200">
                <p className="text-xs text-gray-600">TVA Récupérable</p>
                <p className="text-xl font-semibold text-blue-700">
                  {(situation.totalChargesTVA / 1000).toFixed(1)}k€
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charges SANS TVA */}
        <Card>
          <CardHeader className="bg-amber-50">
            <CardTitle className="text-lg text-amber-900">
              📋 Charges SANS TVA
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-amber-50 rounded">
                  <p className="text-xs text-gray-600">Nombre</p>
                  <p className="text-lg font-semibold">
                    {situation.nombreChargesSansTVA || 0}
                  </p>
                </div>
                <div className="p-3 bg-amber-50 rounded">
                  <p className="text-xs text-gray-600">Montant HT</p>
                  <p className="text-lg font-semibold text-amber-600">
                    {(
                      (situation.totalChargesSansTVA || 0) / 1000
                    ).toFixed(1)}
                    k€
                  </p>
                </div>
              </div>
              <div className="p-3 bg-amber-100 rounded border border-amber-200">
                <p className="text-xs text-gray-600">Total HT</p>
                <p className="text-xl font-semibold text-amber-700">
                  {(
                    (situation.totalChargesSansTVA || 0) / 1000
                  ).toFixed(1)}
                  k€
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Détails des Charges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Par Catégorie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📊 Charges par Catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {Object.entries(situation.chargesParCategorie)
                .sort(([, a], [, b]) => b - a)
                .map(([categorie, montant]) => {
                  const percentage = (montant / situation.totalChargesHT) * 100;
                  return (
                    <div key={categorie} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          {categorie.replace(/_/g, ' ')}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {montant.toLocaleString('fr-FR', {
                            style: 'currency',
                            currency: 'EUR',
                          })}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-500 h-2.5 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 text-right">{percentage.toFixed(1)}%</p>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Par Fournisseur */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🏢 Top Fournisseurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {Object.entries(situation.chargesParFournisseur)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 15)
                .map(([fournisseur, montant]) => {
                  const percentage = (montant / situation.totalChargesHT) * 100;
                  return (
                    <div key={fournisseur} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 truncate pr-2">
                          {fournisseur}
                        </span>
                        <span className="text-sm font-semibold text-gray-900 flex-shrink-0">
                          {montant.toLocaleString('fr-FR', {
                            style: 'currency',
                            currency: 'EUR',
                          })}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-amber-500 h-2.5 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 text-right">{percentage.toFixed(1)}%</p>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analyse & Métriques */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📈 Analyse & Métriques</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-gray-50 rounded border border-gray-200">
              <p className="text-xs text-gray-600 font-semibold">Ratio Charges/Entrées</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {situation.totalEntrees > 0
                  ? ((situation.totalChargesHT / situation.totalEntrees) * 100).toFixed(1)
                  : 0}
                %
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded border border-gray-200">
              <p className="text-xs text-gray-600 font-semibold">Jours Actifs</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {Object.keys(situation.chargesParJour).length}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded border border-gray-200">
              <p className="text-xs text-gray-600 font-semibold">Charge Moy/Jour</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {Object.keys(situation.chargesParJour).length > 0
                  ? (situation.totalChargesHT /
                    Object.keys(situation.chargesParJour).length).toLocaleString(
                    'fr-FR',
                    { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }
                  )
                  : '0€'}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded border border-gray-200">
              <p className="text-xs text-gray-600 font-semibold">Fournisseurs</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {Object.keys(situation.chargesParFournisseur).length}
              </p>
            </div>
          </div>

          {/* Avertissements */}
          <div className="space-y-2 pt-4 border-t">
            {situation.resultatNet < 0 && (
              <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-red-700 text-sm font-medium flex items-start">
                <span className="mr-2">⚠️</span>
                <span>Résultat négatif! Les charges ({(situation.totalChargesHT / 1000).toFixed(1)}k€) dépassent les entrées ({(situation.totalEntrees / 1000).toFixed(1)}k€)</span>
              </div>
            )}
            {situation.totalEntrees > 0 &&
              (situation.totalChargesHT / situation.totalEntrees) > 0.8 && (
                <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-lg text-yellow-700 text-sm font-medium flex items-start">
                  <span className="mr-2">⚡</span>
                  <span>Ratio de charges élevé ({((situation.totalChargesHT / situation.totalEntrees) * 100).toFixed(1)}% &gt; 80%)</span>
                </div>
              )}
            {Object.keys(situation.chargesParFournisseur).length > 20 && (
              <div className="p-3 bg-blue-50 border border-blue-300 rounded-lg text-blue-700 text-sm font-medium flex items-start">
                <span className="mr-2">ℹ️</span>
                <span>Nombreux fournisseurs ({Object.keys(situation.chargesParFournisseur).length}). Vérifier les doublons possibles</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
