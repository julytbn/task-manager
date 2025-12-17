'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface CoverageData {
  label: string;
  salaires: number;
  recettes: number;
  couverture: number;
}

export default function DashboardSalaryCoverageChart() {
  const [data, setData] = useState<CoverageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCoverageData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/dashboard/salary-coverage');
        if (!res.ok) throw new Error('Failed to fetch coverage data');
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching coverage data:', err);
        setError('Erreur lors du chargement du graphique');
      } finally {
        setLoading(false);
      }
    };

    fetchCoverageData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📊 Charges Salariales vs Recettes
        </h3>
        <div className="flex items-center text-gray-600">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>{error || 'Aucune donnée disponible'}</span>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculer les statistiques globales
  const totalSalaries = data.reduce((sum, d) => sum + d.salaires, 0);
  const totalRevenue = data.reduce((sum, d) => sum + d.recettes, 0);
  const averageCoverage = Math.round(
    data.reduce((sum, d) => sum + d.couverture, 0) / data.length
  );

  const isCoveredSufficiently = averageCoverage >= 100;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📊 Charges Salariales vs Recettes
        </h3>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded p-4">
            <p className="text-xs font-medium text-gray-600 uppercase">Total Salaires</p>
            <p className="text-xl font-bold text-blue-600 mt-1">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'XOF',
                maximumFractionDigits: 0,
              }).format(totalSalaries)}
            </p>
          </div>

          <div className="bg-green-50 rounded p-4">
            <p className="text-xs font-medium text-gray-600 uppercase">Total Recettes</p>
            <p className="text-xl font-bold text-green-600 mt-1">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'XOF',
                maximumFractionDigits: 0,
              }).format(totalRevenue)}
            </p>
          </div>

          <div className={`rounded p-4 ${isCoveredSufficiently ? 'bg-emerald-50' : 'bg-red-50'}`}>
            <p className="text-xs font-medium text-gray-600 uppercase">Couverture Moyenne</p>
            <div className="flex items-center mt-1">
              {isCoveredSufficiently ? (
                <TrendingUp className="w-5 h-5 text-emerald-600 mr-2" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600 mr-2" />
              )}
              <p className={`text-xl font-bold ${isCoveredSufficiently ? 'text-emerald-600' : 'text-red-600'}`}>
                {averageCoverage}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Graphique combiné */}
      <div className="mb-4">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="label"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickFormatter={formatCurrency}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              domain={[0, 200]}
              label={{ value: 'Couverture %', angle: 90, position: 'insideRight', offset: -5 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
              formatter={(value: number, name: string) => {
                if (name === 'couverture') return `${value}%`;
                return new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'XOF',
                  maximumFractionDigits: 0,
                }).format(value);
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar
              yAxisId="left"
              dataKey="salaires"
              fill="#3b82f6"
              name="Charges Salariales"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              yAxisId="left"
              dataKey="recettes"
              fill="#10b981"
              name="Recettes"
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="couverture"
              stroke="#f59e0b"
              strokeWidth={2}
              name="Couverture %"
              dot={{ fill: '#f59e0b', r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Légende et explications */}
      <div className="border-t pt-4 mt-4">
        <p className="text-sm text-gray-600">
          📌 <strong>Couverture</strong>: Pourcentage des recettes couvrant les salaires. Un ratio ≥100% signifie que les recettes
          couvrent entièrement les charges salariales.
        </p>
      </div>
    </div>
  );
}
