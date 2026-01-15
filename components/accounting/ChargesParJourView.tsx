'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Charge {
  id: string;
  date: string;
  fournisseur: string;
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
  tauxTVA: number;
  categorie: string;
  description: string;
}

interface ChargesParJourViewProps {
  dossierId: string;
  onDelete?: (chargeId: string) => Promise<void>;
}

export default function ChargesParJourView({
  dossierId,
  onDelete,
}: ChargesParJourViewProps) {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  useEffect(() => {
    const fetchCharges = async () => {
      try {
        const response = await fetch(
          `/api/dossiers/${dossierId}/charges-detaillees/par-jour`
        );
        if (response.ok) {
          const data = await response.json();
          setCharges(data.charges || []);
        } else {
          setError('Erreur lors du chargement des charges');
        }
      } catch (err) {
        setError('Erreur serveur');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCharges();
  }, [dossierId]);

  // Group by date
  const chargesByDate = charges.reduce(
    (acc, charge) => {
      if (!acc[charge.date]) acc[charge.date] = [];
      acc[charge.date].push(charge);
      return acc;
    },
    {} as Record<string, Charge[]>
  );

  const sortedDates = Object.keys(chargesByDate).sort().reverse();

  const handleDelete = async (chargeId: string) => {
    if (
      !confirm(
        'Êtes-vous sûr de vouloir supprimer cette charge? Elle sera recalculée dans les totaux.'
      )
    )
      return;

    try {
      const response = await fetch(
        `/api/dossiers/${dossierId}/charges-detaillees/${chargeId}`,
        { method: 'DELETE' }
      );
      if (response.ok) {
        setCharges(charges.filter((c) => c.id !== chargeId));
        if (onDelete) await onDelete(chargeId);
      }
    } catch (err) {
      alert('Erreur lors de la suppression');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-gray-500">Chargement des charges...</p>
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

  if (sortedDates.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-gray-500">Aucune charge enregistrée</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {sortedDates.map((date) => {
        const dayCharges = chargesByDate[date];
        const totalHT = dayCharges.reduce((sum, c) => sum + c.montantHT, 0);
        const totalTVA = dayCharges.reduce((sum, c) => sum + c.montantTVA, 0);
        const totalTTC = dayCharges.reduce((sum, c) => sum + c.montantTTC, 0);
        const isExpanded = expandedDate === date;

        return (
          <div key={date} className="border rounded-lg overflow-hidden">
            {/* Header */}
            <button
              onClick={() =>
                setExpandedDate(isExpanded ? null : date)
              }
              className="w-full p-4 bg-gray-50 hover:bg-gray-100 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="text-left">
                  <p className="font-semibold">
                    {new Date(date).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-sm text-gray-500">{dayCharges.length} charge(s)</p>
                </div>
              </div>

              <div className="flex items-center gap-6 mr-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total HT</p>
                  <p className="font-semibold">
                    {totalHT.toLocaleString('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">TVA</p>
                  <p className="font-semibold text-blue-600">
                    {totalTVA.toLocaleString('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total TTC</p>
                  <p className="font-semibold text-green-600">
                    {totalTTC.toLocaleString('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                    })}
                  </p>
                </div>

                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                )}
              </div>
            </button>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="p-4 bg-white space-y-3 border-t">
                {dayCharges.map((charge) => (
                  <div
                    key={charge.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-semibold text-sm">{charge.fournisseur}</p>
                          <p className="text-xs text-gray-500">{charge.categorie}</p>
                          {charge.description && (
                            <p className="text-xs text-gray-600 italic">
                              {charge.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 mr-4">
                      <div className="text-right min-w-[100px]">
                        <p className="text-xs text-gray-500">HT</p>
                        <p className="font-semibold text-sm">
                          {charge.montantHT.toLocaleString('fr-FR', {
                            style: 'currency',
                            currency: 'EUR',
                          })}
                        </p>
                      </div>
                      <div className="text-right min-w-[100px]">
                        <p className="text-xs text-gray-500">TVA {charge.tauxTVA}%</p>
                        <p className="font-semibold text-sm text-blue-600">
                          {charge.montantTVA.toLocaleString('fr-FR', {
                            style: 'currency',
                            currency: 'EUR',
                          })}
                        </p>
                      </div>
                      <div className="text-right min-w-[100px]">
                        <p className="text-xs text-gray-500">TTC</p>
                        <p className="font-semibold text-sm text-green-600">
                          {charge.montantTTC.toLocaleString('fr-FR', {
                            style: 'currency',
                            currency: 'EUR',
                          })}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(charge.id)}
                      className="ml-4"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
