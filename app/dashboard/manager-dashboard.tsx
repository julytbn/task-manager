'use client';
import { useEffect, useState, useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import MainLayout from '@/components/layouts/MainLayout';
import DashboardSalaryWidget from '@/components/dashboard/DashboardSalaryWidget';
import DashboardSalaryCoverageChart from '@/components/dashboard/DashboardSalaryCoverageChart';
import { TrendingUp, TrendingDown, AlertCircle, Clock, Users, CheckCircle2 } from 'lucide-react';

// Enregistrement des composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

interface KPI {
  activeClients: number;
  projectsInProgress: number;
  projectsCompleted: number;
  totalHours: number;
  revenueThisMonth: number;
  chargesThisMonthTotal: number;
  estimatedProfit: number;
}

interface MonthlyData {
  month: string;
  revenue: number;
  charges: number;
}

interface EmployeeProductivity {
  name: string;
  hours: number;
}

interface Alert {
  type: 'warning' | 'danger' | 'info' | 'success';
  title: string;
  message: string;
  icon: string;
}

export default function ManagerDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<KPI | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [employeeProductivity, setEmployeeProductivity] = useState<EmployeeProductivity[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch('/api/dashboard/analytics');
        if (!res.ok) throw new Error('Failed to fetch dashboard data');

        const data = await res.json();
        setKpis(data.kpis);
        setMonthlyData(data.monthlyData || []);
        setEmployeeProductivity(data.employeeProductivity || []);
        setAlerts(data.alerts || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Erreur lors du chargement du dashboard');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Données pour les graphiques
  const chartRevenueData = useMemo(() => {
    return {
      labels: monthlyData.map(d => d.month),
      datasets: [{
        label: 'Recettes',
        data: monthlyData.map(d => d.revenue),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
      }],
    };
  }, [monthlyData]);

  const chartExpensesData = useMemo(() => {
    return {
      labels: monthlyData.map(d => d.month),
      datasets: [{
        label: 'Charges',
        data: monthlyData.map(d => d.charges),
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true,
      }],
    };
  }, [monthlyData]);

  const chartProfitData = useMemo(() => {
    const profitData = monthlyData.map(d => d.revenue - d.charges);
    return {
      labels: monthlyData.map(d => d.month),
      datasets: [{
        label: 'Bénéfice',
        data: profitData,
        backgroundColor: profitData.map(p => p >= 0 ? '#10B981' : '#EF4444'),
      }],
    };
  }, [monthlyData]);

  const chartProductivityData = useMemo(() => {
    return {
      labels: employeeProductivity.map(e => e.name),
      datasets: [{
        label: 'Heures travaillées',
        data: employeeProductivity.map(e => e.hours),
        backgroundColor: '#FFD700',
        borderRadius: 4,
      }],
    };
  }, [employeeProductivity]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="bg-red-50 border border-red-400 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </MainLayout>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
    }).format(amount);
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Tableau de bord</h1>
            <p className="text-gray-500 mt-2">Vue d'ensemble de votre entreprise</p>
          </div>
        </div>

        {/* 🔔 ALERTES EN HAUT */}
        {alerts.length > 0 && (
          <div className="space-y-3">
            {alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border-l-4 flex gap-3 ${
                  alert.type === 'danger'
                    ? 'bg-red-50 border-red-400'
                    : alert.type === 'warning'
                    ? 'bg-yellow-50 border-yellow-400'
                    : 'bg-blue-50 border-blue-400'
                }`}
              >
                <AlertCircle
                  size={20}
                  className={
                    alert.type === 'danger'
                      ? 'text-red-600'
                      : alert.type === 'warning'
                      ? 'text-yellow-600'
                      : 'text-blue-600'
                  }
                />
                <div>
                  <h3 className="font-semibold text-sm">{alert.title}</h3>
                  <p className="text-sm">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 1️⃣ KPIs - CARTES PRINCIPALES */}
        {kpis && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Clients actifs */}
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-[var(--color-gold)] hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--color-anthracite)] font-medium">Clients actifs</p>
                  <p className="text-3xl font-bold text-[var(--color-black-deep)] mt-2">{kpis.activeClients}</p>
                </div>
                <Users size={32} className="text-[var(--color-gold)] opacity-20" />
              </div>
            </div>

            {/* Projets en cours */}
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--color-anthracite)] font-medium">Projets en cours</p>
                  <p className="text-3xl font-bold text-[var(--color-black-deep)] mt-2">{kpis.projectsInProgress}</p>
                </div>
                <CheckCircle2 size={32} className="text-blue-500 opacity-20" />
              </div>
            </div>

            {/* Heures travaillées */}
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--color-anthracite)] font-medium">Heures ce mois</p>
                  <p className="text-3xl font-bold text-[var(--color-black-deep)] mt-2">{kpis.totalHours}</p>
                </div>
                <Clock size={32} className="text-purple-500 opacity-20" />
              </div>
            </div>

            {/* Bénéfice */}
            <div className={`p-6 rounded-lg shadow border-l-4 ${kpis.estimatedProfit >= 0 ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'} hover:shadow-lg transition-shadow cursor-pointer`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--color-anthracite)] font-medium">Bénéfice estimé</p>
                  <p className={`text-3xl font-bold mt-2 ${kpis.estimatedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(kpis.estimatedProfit)}
                  </p>
                </div>
                {kpis.estimatedProfit >= 0 ? (
                  <TrendingUp size={32} className="text-green-500 opacity-20" />
                ) : (
                  <TrendingDown size={32} className="text-red-500 opacity-20" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2️⃣ PRÉVISIONS SALARIALES - NEW */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DashboardSalaryWidget />
          <DashboardSalaryCoverageChart />
        </div>

        {/* 3️⃣ GRAPHIQUES ANALYTICS */}
        {kpis && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recettes */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-[var(--color-black-deep)] mb-4">Évolution des recettes</h2>
              <div className="h-80">
                <Line
                  data={chartRevenueData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                  }}
                />
              </div>
            </div>

            {/* Charges */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-[var(--color-black-deep)] mb-4">Évolution des charges</h2>
              <div className="h-80">
                <Line
                  data={chartExpensesData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                  }}
                />
              </div>
            </div>

            {/* Bénéfice */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-[var(--color-black-deep)] mb-4">Bénéfice mensuel</h2>
              <div className="h-80">
                <Bar
                  data={chartProfitData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                  }}
                />
              </div>
            </div>

            {/* Productivité par employé */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-[var(--color-black-deep)] mb-4">Productivité des employés</h2>
              <div className="h-80">
                <Bar
                  data={chartProductivityData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* 3️⃣ RÉSUMÉ FINANCIER */}
        {kpis && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-semibold text-[var(--color-anthracite)]">Recettes ce mois</h3>
              <p className="text-2xl font-bold text-green-600 mt-2">{formatCurrency(kpis.revenueThisMonth)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-semibold text-[var(--color-anthracite)]">Charges ce mois</h3>
              <p className="text-2xl font-bold text-red-600 mt-2">{formatCurrency(kpis.chargesThisMonthTotal)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-semibold text-[var(--color-anthracite)]">Projets terminés</h3>
              <p className="text-2xl font-bold text-blue-600 mt-2">{kpis.projectsCompleted}</p>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
