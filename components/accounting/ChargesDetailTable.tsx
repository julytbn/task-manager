'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ChargeDetaillee {
  id: string;
  date: string;
  fournisseur: string;
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
  avecTVA: boolean;
  categorie: string;
  description?: string;
}

interface ChargesDetailTableProps {
  dossierId: string;
  filter?: 'TOUS' | 'AVEC_TVA' | 'SANS_TVA';
}

export default function ChargesDetailTable({ dossierId, filter = 'TOUS' }: ChargesDetailTableProps) {
  const [charges, setCharges] = useState<ChargeDetaillee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPageWithTVA, setCurrentPageWithTVA] = useState(1);
  const [currentPageWithoutTVA, setCurrentPageWithoutTVA] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    // Réinitialiser les sélections quand le dossierId change
    setSelectedIds(new Set());
    
    const fetchCharges = async () => {
      console.log('📊 [ChargesDetailTable] Component mounted with dossierId:', dossierId);
      
      if (!dossierId || dossierId === '') {
        console.error('📊 [ChargesDetailTable] dossierId is empty or undefined!');
        setError('ID du dossier manquant');
        setLoading(false);
        setCharges([]);
        return;
      }

      try {
        const url = `/api/dossiers/${dossierId}/charges-detaillees`;
        console.log('📊 [ChargesDetailTable] Fetching from:', url);
        
        const response = await fetch(url);
        console.log('📊 [ChargesDetailTable] Response status:', response.status);
        console.log('📊 [ChargesDetailTable] Response headers:', {
          contentLength: response.headers.get('content-length'),
          contentType: response.headers.get('content-type'),
        });
        
        if (response.ok) {
          const responseText = await response.text();
          console.log('📊 [ChargesDetailTable] Response text length:', responseText.length);
          console.log('📊 [ChargesDetailTable] Response text:', responseText);

          if (!responseText || responseText.trim().length === 0) {
            console.log('📊 [ChargesDetailTable] Response body is empty, setting empty array');
            setCharges([]);
            setLoading(false);
            return;
          }

          try {
            const data = JSON.parse(responseText);
            console.log('📊 [ChargesDetailTable] Parsed JSON:', data);
            
            const chargesData = Array.isArray(data) ? data : data.charges || [];
            console.log('📊 [ChargesDetailTable] Charges count:', chargesData.length);
            setCharges(chargesData);
          } catch (parseErr) {
            console.error('📊 [ChargesDetailTable] JSON parse error:', parseErr);
            console.error('📊 [ChargesDetailTable] Response was:', responseText);
            setError('Erreur: Format de réponse invalide');
          }
        } else {
          const errorText = await response.text();
          console.error('📊 [ChargesDetailTable] HTTP error:', response.status, response.statusText);
          console.error('📊 [ChargesDetailTable] Error response:', errorText);
          setError(`Erreur ${response.status}: ${response.statusText}`);
        }
      } catch (err) {
        console.error('📊 [ChargesDetailTable] Fetch error:', err);
        setError(`Erreur: ${err instanceof Error ? err.message : 'Erreur serveur'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCharges();
  }, [dossierId]);

  if (loading) {
    return <p className="text-gray-500">Chargement des charges...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  // Séparer les charges AVEC TVA et SANS TVA
  const chargesAvecTVA = charges.filter(c => c.avecTVA);
  const chargesSansTVA = charges.filter(c => !c.avecTVA);

  // Pagination pour charges avec TVA
  const startIndexWithTVA = (currentPageWithTVA - 1) * itemsPerPage;
  const chargesAvecTVAPaginated = chargesAvecTVA.slice(startIndexWithTVA, startIndexWithTVA + itemsPerPage);
  const totalPagesWithTVA = Math.ceil(chargesAvecTVA.length / itemsPerPage);

  // Pagination pour charges sans TVA
  const startIndexWithoutTVA = (currentPageWithoutTVA - 1) * itemsPerPage;
  const chargesSansTVAPaginated = chargesSansTVA.slice(startIndexWithoutTVA, startIndexWithoutTVA + itemsPerPage);
  const totalPagesWithoutTVA = Math.ceil(chargesSansTVA.length / itemsPerPage);

  // Calculer les totaux
  const totalHTAvecTVA = chargesAvecTVA.reduce((sum, c) => sum + c.montantHT, 0);
  const totalTVA = chargesAvecTVA.reduce((sum, c) => sum + c.montantTVA, 0);
  const totalTTCAvecTVA = chargesAvecTVA.reduce((sum, c) => sum + c.montantTTC, 0);
  const totalSansTVA = chargesSansTVA.reduce((sum, c) => sum + c.montantHT, 0);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const handleDeleteCharge = async (chargeId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette charge?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/dossiers/${dossierId}/charges-detaillees/${chargeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Rafraîchir la liste
        setCharges(charges.filter(c => c.id !== chargeId));
        console.log('✅ Charge supprimée:', chargeId);
      } else {
        const errorData = await response.json();
        alert('Erreur: ' + (errorData.message || 'Impossible de supprimer la charge'));
      }
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      alert('Erreur lors de la suppression de la charge');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSelection = (chargeId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(chargeId)) {
      newSelected.delete(chargeId);
    } else {
      newSelected.add(chargeId);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = (charges: ChargeDetaillee[]) => {
    if (selectedIds.size === charges.length && charges.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(charges.map(c => c.id)));
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedIds.size} charge(s)?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const deletePromises = Array.from(selectedIds).map(chargeId =>
        fetch(`/api/dossiers/${dossierId}/charges-detaillees/${chargeId}`, {
          method: 'DELETE',
        })
      );

      await Promise.all(deletePromises);
      
      // Rafraîchir la liste
      setCharges(charges.filter(c => !selectedIds.has(c.id)));
      setSelectedIds(new Set());
      console.log('✅ Charges supprimées:', selectedIds.size);
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      alert('Erreur lors de la suppression des charges');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* BARRE DE SÉLECTION */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-blue-900 font-semibold">
              {selectedIds.size} charge{selectedIds.size > 1 ? 's' : ''} sélectionnée{selectedIds.size > 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedIds(new Set())}
              disabled={isDeleting}
              className="px-4 py-2 bg-gray-400 hover:bg-gray-500 disabled:bg-gray-300 text-white rounded font-semibold transition"
            >
              Annuler
            </button>
            <button
              onClick={deleteSelected}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded font-semibold transition"
            >
              {isDeleting ? '🗑️ Suppression...' : '🗑️ Supprimer les sélectionnées'}
            </button>
          </div>
        </div>
      )}

      {/* CHARGES AVEC TVA */}
      {(filter === 'TOUS' || filter === 'AVEC_TVA') && (
        <Card>
          <CardHeader className="bg-blue-50 border-b-2 border-blue-200">
            <CardTitle className="text-lg font-bold text-blue-900">
              📋 LES ACHATS AVEC TVA
            </CardTitle>
            <p className="text-sm text-blue-700 mt-2">
              {chargesAvecTVA.length} facture{chargesAvecTVA.length > 1 ? 's' : ''} | TVA déductible: {formatCurrency(totalTVA)}
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            {chargesAvecTVA.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucune charge avec TVA</p>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-300 bg-gray-50">
                        <th className="text-center p-2 font-bold text-gray-700">
                          <input
                            type="checkbox"
                            checked={selectedIds.size === chargesAvecTVAPaginated.length && chargesAvecTVAPaginated.length > 0}
                            onChange={() => toggleSelectAll(chargesAvecTVAPaginated)}
                            className="w-5 h-5 cursor-pointer"
                          />
                        </th>
                        <th className="text-left p-2 font-bold text-gray-700">DATE</th>
                        <th className="text-left p-2 font-bold text-gray-700">RAISON SOCIALE</th>
                        <th className="text-right p-2 font-bold text-gray-700">MONTANT HT</th>
                        <th className="text-right p-2 font-bold text-gray-700">MONTANT TVA</th>
                        <th className="text-right p-2 font-bold text-gray-700">MONTANT TTC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chargesAvecTVAPaginated.map((charge) => (
                        <tr key={charge.id} className="border-b border-gray-200 hover:bg-blue-50 transition">
                          <td className="p-2 text-center">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(charge.id)}
                              onChange={() => toggleSelection(charge.id)}
                              className="w-5 h-5 cursor-pointer"
                            />
                          </td>
                          <td className="p-2 text-gray-700">{formatDate(charge.date)}</td>
                          <td className="p-2 text-gray-700 font-medium">{charge.fournisseur}</td>
                          <td className="p-2 text-right font-semibold text-gray-900">
                            {formatCurrency(charge.montantHT)}
                          </td>
                          <td className="p-2 text-right font-semibold text-blue-600">
                            {formatCurrency(charge.montantTVA)}
                          </td>
                          <td className="p-2 text-right font-bold text-blue-700">
                            {formatCurrency(charge.montantTTC)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-t-blue-300 bg-blue-50 font-bold">
                        <td colSpan={3} className="p-2 text-right text-blue-900">
                          TOTAL
                        </td>
                        <td className="p-2 text-right text-blue-900 border-l border-blue-200">
                          {formatCurrency(totalHTAvecTVA)}
                        </td>
                        <td className="p-2 text-right text-blue-700 border-l border-blue-200">
                          {formatCurrency(totalTVA)}
                        </td>
                        <td className="p-2 text-right text-blue-700 border-l border-blue-200">
                          {formatCurrency(totalTTCAvecTVA)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Pagination pour AVEC TVA */}
                {totalPagesWithTVA > 1 && (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded border border-gray-200">
                    <div className="text-sm text-gray-600">
                      Page {currentPageWithTVA} sur {totalPagesWithTVA}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPageWithTVA(Math.max(1, currentPageWithTVA - 1))}
                        disabled={currentPageWithTVA === 1}
                        className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        ← Précédent
                      </button>
                      <button
                        onClick={() => setCurrentPageWithTVA(Math.min(totalPagesWithTVA, currentPageWithTVA + 1))}
                        disabled={currentPageWithTVA === totalPagesWithTVA}
                        className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        Suivant →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* CHARGES SANS TVA */}
      {(filter === 'TOUS' || filter === 'SANS_TVA') && (
        <Card>
          <CardHeader className="bg-amber-50 border-b-2 border-amber-200">
            <CardTitle className="text-lg font-bold text-amber-900">
              📋 LES ACHATS SANS TVA
            </CardTitle>
            <p className="text-sm text-amber-700 mt-2">
              {chargesSansTVA.length} facture{chargesSansTVA.length > 1 ? 's' : ''}
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            {chargesSansTVA.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucune charge sans TVA</p>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-300 bg-gray-50">
                        <th className="text-center p-2 font-bold text-gray-700">
                          <input
                            type="checkbox"
                            checked={selectedIds.size === chargesSansTVAPaginated.length && chargesSansTVAPaginated.length > 0}
                            onChange={() => toggleSelectAll(chargesSansTVAPaginated)}
                            className="w-5 h-5 cursor-pointer"
                          />
                        </th>
                        <th className="text-left p-2 font-bold text-gray-700">DATE</th>
                        <th className="text-left p-2 font-bold text-gray-700">RAISON SOCIALE</th>
                        <th className="text-right p-2 font-bold text-gray-700">MONTANT HT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chargesSansTVAPaginated.map((charge) => (
                        <tr key={charge.id} className="border-b border-gray-200 hover:bg-amber-50 transition">
                          <td className="p-2 text-center">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(charge.id)}
                              onChange={() => toggleSelection(charge.id)}
                              className="w-5 h-5 cursor-pointer"
                            />
                          </td>
                          <td className="p-2 text-gray-700">{formatDate(charge.date)}</td>
                          <td className="p-2 text-gray-700 font-medium">{charge.fournisseur}</td>
                          <td className="p-2 text-right font-semibold text-gray-900">
                            {formatCurrency(charge.montantHT)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-t-amber-300 bg-amber-50 font-bold">
                        <td colSpan={3} className="p-2 text-right text-amber-900">
                          TOTAL
                        </td>
                        <td className="p-2 text-right text-amber-900 border-l border-amber-200">
                          {formatCurrency(totalSansTVA)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Pagination pour SANS TVA */}
                {totalPagesWithoutTVA > 1 && (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded border border-gray-200">
                    <div className="text-sm text-gray-600">
                      Page {currentPageWithoutTVA} sur {totalPagesWithoutTVA}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPageWithoutTVA(Math.max(1, currentPageWithoutTVA - 1))}
                        disabled={currentPageWithoutTVA === 1}
                        className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        ← Précédent
                      </button>
                      <button
                        onClick={() => setCurrentPageWithoutTVA(Math.min(totalPagesWithoutTVA, currentPageWithoutTVA + 1))}
                        disabled={currentPageWithoutTVA === totalPagesWithoutTVA}
                        className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        Suivant →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* RÉSUMÉ */}
      {(chargesAvecTVA.length > 0 || chargesSansTVA.length > 0) && filter === 'TOUS' && (
        <Card className="bg-gradient-to-r from-blue-50 to-amber-50">
          <CardHeader>
            <CardTitle className="text-lg">📊 RÉSUMÉ GLOBAL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-blue-100 rounded-lg border border-blue-300">
                <p className="text-xs text-blue-700 font-semibold">Total HT Avec TVA</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {formatCurrency(totalHTAvecTVA)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg border border-blue-300">
                <p className="text-xs text-blue-700 font-semibold">TVA Récupérable</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {formatCurrency(totalTVA)}
                </p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg border border-amber-300">
                <p className="text-xs text-amber-700 font-semibold">Total HT Sans TVA</p>
                <p className="text-2xl font-bold text-amber-900 mt-1">
                  {formatCurrency(totalSansTVA)}
                </p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg border border-gray-300">
                <p className="text-xs text-gray-700 font-semibold">TOTAL GÉNÉRAL</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(totalHTAvecTVA + totalSansTVA)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
