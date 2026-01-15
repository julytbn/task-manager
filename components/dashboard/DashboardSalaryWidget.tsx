'use client';

import { useEffect, useState } from 'react';
import { Calendar, AlertCircle, Users, DollarSign, CheckCircle2, Clock } from 'lucide-react';
import MarkSalaryPaidModal from './MarkSalaryPaidModal';

interface SalaryWidget {
  montantTotal: number;
  nombreEmployes: number;
  dateLimite: Date;
  mois: number;
  annee: number;
  isPaid: boolean;
  prévisions: {
    id: string;
    nomEmploye: string;
    montantPrevu: number;
    dateNotification?: Date;
  }[];
}

export default function DashboardSalaryWidget() {
  const [data, setData] = useState<SalaryWidget | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSalaryData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/dashboard/salary-widget');
        if (!res.ok) throw new Error('Failed to fetch salary data');
        const result = await res.json();
        // Convert dateLimite string to Date object
        if (result.dateLimite && typeof result.dateLimite === 'string') {
          result.dateLimite = new Date(result.dateLimite);
        }
        setData(result);
      } catch (err) {
        console.error('Error fetching salary data:', err);
        setError('Erreur lors du chargement des données salariales');
      } finally {
        setLoading(false);
      }
    };

    fetchSalaryData();
  }, []);

  const handleMarkPaid = async (formData: {
    montant: number;
    moyenPaiement: string;
    reference: string;
  }) => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/salary/mark-paid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          clientId: 'system', // À adapter selon votre logique
          factureId: 'system', // À adapter selon votre logique
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark salary as paid');
      }

      setIsModalOpen(false);
      // Recharger les données
      const res = await fetch('/api/dashboard/salary-widget');
      if (res.ok) {
        const result = await res.json();
        // Convert dateLimite string to Date object
        if (result.dateLimite && typeof result.dateLimite === 'string') {
          result.dateLimite = new Date(result.dateLimite);
        }
        setData(result);
      }
    } catch (error) {
      console.error('Error marking salary as paid:', error);
      alert('Erreur lors de l\'enregistrement du paiement');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center text-red-600">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>{error || 'Aucune donnée disponible'}</span>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const monthName = new Date(data.annee, data.mois - 1).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });

  const daysUntilDeadline = Math.ceil(
    (data.dateLimite.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const statusColor = data.isPaid
    ? 'bg-green-50 border-green-200'
    : daysUntilDeadline > 0
      ? 'bg-yellow-50 border-yellow-200'
      : 'bg-red-50 border-red-200';

  const statusText = data.isPaid
    ? '✅ Payé'
    : daysUntilDeadline > 0
      ? `⚠️ À régler (J-${daysUntilDeadline})`
      : '🚨 Retard de paiement';

  const statusIcon = data.isPaid ? (
    <CheckCircle2 className="w-6 h-6 text-green-600" />
  ) : daysUntilDeadline <= 0 ? (
    <AlertCircle className="w-6 h-6 text-red-600" />
  ) : (
    <Clock className="w-6 h-6 text-yellow-600" />
  );

  return (
    <div className={`border rounded-lg p-6 ${statusColor}`}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
            Prévisions Salariales
          </h3>
          <p className="text-sm text-gray-600 mt-1">{monthName}</p>
        </div>
        <div>{statusIcon}</div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded p-4">
          <p className="text-xs font-medium text-gray-600 uppercase">Total à payer</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatCurrency(data.montantTotal)}
          </p>
        </div>

        <div className="bg-white rounded p-4">
          <p className="text-xs font-medium text-gray-600 uppercase">Employés</p>
          <p className="text-2xl font-bold text-gray-900 mt-1 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            {data.nombreEmployes}
          </p>
        </div>

        <div className="bg-white rounded p-4">
          <p className="text-xs font-medium text-gray-600 uppercase">Délai paiement</p>
          <p className="text-2xl font-bold text-gray-900 mt-1 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            {new Date(data.dateLimite).getDate()}
          </p>
        </div>
      </div>

      <div className="mb-6 pb-6 border-b border-gray-200">
        <p className="text-sm font-medium text-gray-700 mb-3">Statut</p>
        <div className="flex items-center justify-between">
          <span className="text-sm">{statusText}</span>
          {!data.isPaid && (
            <button
              onClick={() => setIsModalOpen(true)}
              disabled={isSaving}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              Marquer comme payé
            </button>
          )}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Détail par employé</p>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {data.prévisions.map((prévision) => (
            <div
              key={prévision.id}
              className="flex items-center justify-between text-sm bg-white p-2 rounded"
            >
              <span className="text-gray-700">{prévision.nomEmploye}</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(prévision.montantPrevu)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      <MarkSalaryPaidModal
        montantTotal={data.montantTotal}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleMarkPaid}
      />
    </div>
  );
}
