"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PrevisionSalaire {
  id: string;
  employeId: string;
  mois: number;
  annee: number;
  montantPrevu: number;
  montantNotifie: number | null;
  dateNotification: string | null;
  employe: {
    nom: string;
    prenom: string;
    email: string;
    tarifHoraire: number | null;
  };
}

interface SalaryStats {
  total: number;
  moyenne: number;
  nombreMois: number;
  previsions: PrevisionSalaire[];
}

export default function SalaryForecastDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [forecasts, setForecasts] = useState<PrevisionSalaire[]>([]);
  const [stats, setStats] = useState<SalaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user?.id) {
      fetchForecasts();
    }
  }, [session, status, router]);

  async function fetchForecasts() {
    try {
      setLoading(true);
      setError(null);

      // Récupérer les prévisions de l'utilisateur actuel
      const response = await fetch(
        `/api/salary-forecasts?employeeId=${session?.user?.id}`
      );
      if (!response.ok) throw new Error("Erreur lors de la récupération");
      const data = await response.json();
      setForecasts(data.data);

      // Récupérer les statistiques
      const statsResponse = await fetch(
        `/api/salary-forecasts/statistics/${session?.user?.id}?months=12`
      );
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  const monthNames = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin mb-4">⏳</div>
          <p>Chargement des prévisions salariales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            💰 Prévision de Salaires
          </h1>
          <p className="text-gray-600 mt-2">
            Consultez vos prévisions salariales mensuelles
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
            ❌ {error}
          </div>
        )}

        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-gray-600 text-sm">Total (12 derniers mois)</div>
              <div className="text-3xl font-bold text-green-600 mt-2">
                {stats.total.toFixed(2)}€
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-gray-600 text-sm">Moyenne mensuelle</div>
              <div className="text-3xl font-bold text-blue-600 mt-2">
                {stats.moyenne.toFixed(2)}€
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-gray-600 text-sm">Mois avec données</div>
              <div className="text-3xl font-bold text-purple-600 mt-2">
                {stats.nombreMois}
              </div>
            </div>
          </div>
        )}

        {/* Tableau des prévisions */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Prévisions mensuelles</h2>
          </div>

          {forecasts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>Aucune prévision salariale disponible</p>
              <p className="text-sm mt-2">
                Les prévisions s'affichent après validation de vos timesheets
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Mois
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Montant prévu
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Statut notification
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Date notification
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {forecasts.map((forecast) => (
                    <tr
                      key={forecast.id}
                      className="border-b border-gray-200 hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 text-sm">
                        {monthNames[forecast.mois - 1]} {forecast.annee}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-green-600">
                        {forecast.montantPrevu.toFixed(2)}€
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {forecast.dateNotification ? (
                          <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            ✓ Notifié
                          </span>
                        ) : (
                          <span className="inline-block px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                            En attente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {forecast.dateNotification
                          ? new Date(forecast.dateNotification).toLocaleDateString(
                              "fr-FR"
                            )
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Information */}
        <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">
            ℹ️ Comment fonctionne la prévision ?
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              • La prévision est calculée automatiquement après validation de
              vos timesheets
            </li>
            <li>
              • Le calcul: Total heures validées × Votre tarif horaire
            </li>
            <li>
              • Vous recevrez une notification 5 jours avant le paiement
            </li>
            <li>• Les prévisions sont mises à jour en temps réel</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-4">
          <Link
            href="/dashboard/timesheets"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ← Voir mes timesheets
          </Link>
          <button
            onClick={fetchForecasts}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            🔄 Actualiser
          </button>
        </div>
      </div>
    </div>
  );
}
