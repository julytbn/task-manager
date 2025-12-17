'use client';

import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface MarkPaidModalProps {
  montantTotal: number;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { montant: number; moyenPaiement: string; reference: string }) => Promise<void>;
}

export default function MarkSalaryPaidModal({
  montantTotal,
  isOpen,
  onClose,
  onSubmit,
}: MarkPaidModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    montant: montantTotal,
    moyenPaiement: 'VIREMENT_BANCAIRE',
    reference: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.reference.trim()) {
      setError('La référence de paiement est requise');
      return;
    }

    if (formData.montant <= 0) {
      setError('Le montant doit être positif');
      return;
    }

    try {
      setLoading(true);
      await onSubmit(formData);
      setFormData({
        montant: montantTotal,
        moyenPaiement: 'VIREMENT_BANCAIRE',
        reference: '',
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du paiement');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Marquer comme payé</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Montant */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Montant (FCFA)
            </label>
            <input
              type="number"
              value={formData.montant}
              onChange={(e) =>
                setFormData({ ...formData, montant: parseFloat(e.target.value) })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <p className="text-xs text-gray-600 mt-1">
              Montant total prévu: {montantTotal.toLocaleString('fr-FR')} FCFA
            </p>
          </div>

          {/* Moyen de paiement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Moyen de paiement
            </label>
            <select
              value={formData.moyenPaiement}
              onChange={(e) =>
                setFormData({ ...formData, moyenPaiement: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="VIREMENT_BANCAIRE">Virement Bancaire</option>
              <option value="CHEQUE">Chèque</option>
              <option value="MOBILE_MONEY">Mobile Money</option>
              <option value="ESPECES">Espèces</option>
              <option value="CARTE_BANCAIRE">Carte Bancaire</option>
            </select>
          </div>

          {/* Référence */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Référence de paiement
            </label>
            <input
              type="text"
              value={formData.reference}
              onChange={(e) =>
                setFormData({ ...formData, reference: e.target.value })
              }
              placeholder="Ex: TRF-2025-04-001"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <p className="text-xs text-gray-600 mt-1">
              Numéro ou référence de la transaction
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              {loading ? 'En cours...' : '✅ Confirmer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
