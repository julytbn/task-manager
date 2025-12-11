'use client';

import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
  Title
} from 'chart.js';

// Enregistrement des composants nécessaires pour Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
  Title
);

// Types
type FinancialData = {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
};

type ProjectData = {
  id: string;
  name: string;
  revenue: number;
  cost: number;
  profit: number;
  profitMargin: number;
};

type ExpenseCategory = {
  category: string;
  amount: number;
  percentage: number;
  color: string;
};

// Données de démonstration
const generateMockData = () => {
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  const currentMonth = new Date().getMonth();
  
  // Générer des données pour les 6 derniers mois
  const financialData: FinancialData[] = [];
  
  for (let i = 5; i >= 0; i--) {
    const monthIndex = (currentMonth - i + 12) % 12;
    const revenue = Math.floor(Math.random() * 100000) + 50000;
    const expenses = Math.floor(Math.random() * 60000) + 30000;
    
    financialData.push({
      month: months[monthIndex],
      revenue,
      expenses,
      profit: revenue - expenses
    });
  }
  
  // Données de projets
  const projects: ProjectData[] = [
    { id: '1', name: 'Site Web Client A', revenue: 75000, cost: 45000, profit: 30000, profitMargin: 40 },
    { id: '2', name: 'App Mobile B', revenue: 120000, cost: 80000, profit: 40000, profitMargin: 33.3 },
    { id: '3', name: 'Refonte Site', revenue: 50000, cost: 35000, profit: 15000, profitMargin: 30 },
    { id: '4', name: 'Maintenance C', revenue: 30000, cost: 10000, profit: 20000, profitMargin: 66.7 },
  ];
  
  // Catégories de dépenses
  const expenseCategories: ExpenseCategory[] = [
    { category: 'Salaires', amount: 35000, percentage: 50, color: '#3b82f6' },
    { category: 'Matériel', amount: 10000, percentage: 14.3, color: '#10b981' },
    { category: 'Loyer', amount: 8000, percentage: 11.4, color: '#f59e0b' },
    { category: 'Services', amount: 7000, percentage: 10, color: '#8b5cf6' },
    { category: 'Autres', amount: 10000, percentage: 14.3, color: '#6b7280' },
  ];
  
  // Calculer les totaux
  const currentMonthData = financialData[financialData.length - 1];
  const previousMonthData = financialData[financialData.length - 2];
  
  const revenueChange = previousMonthData 
    ? ((currentMonthData.revenue - previousMonthData.revenue) / previousMonthData.revenue) * 100 
    : 0;
    
  const expensesChange = previousMonthData
    ? ((currentMonthData.expenses - previousMonthData.expenses) / previousMonthData.expenses) * 100
    : 0;
  
  const totalRevenue = financialData.reduce((sum, item) => sum + item.revenue, 0);
  const totalExpenses = financialData.reduce((sum, item) => sum + item.expenses, 0);
  const totalProfit = totalRevenue - totalExpenses;
  const profitMargin = (totalProfit / totalRevenue) * 100;
  
  return {
    financialData,
    projects,
    expenseCategories,
    totals: {
      revenue: totalRevenue,
      expenses: totalExpenses,
      profit: totalProfit,
      profitMargin: isNaN(profitMargin) ? 0 : profitMargin,
      revenueChange,
      expensesChange
    }
  };
};

// Composant de carte de statistique
const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  changeLabel,
  isCurrency = true
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  change?: number;
  changeLabel?: string;
  isCurrency?: boolean;
}) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900">
          {isCurrency ? `${value.toLocaleString('fr-FR')} €` : `${value.toFixed(1)}%`}
        </p>
        {change !== undefined && (
          <div className={`mt-2 flex items-center text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? (
              <ArrowUpRight className="h-4 w-4 mr-1" />
            ) : (
              <ArrowDownRight className="h-4 w-4 mr-1" />
            )}
            <span>{Math.abs(change).toFixed(1)}% {changeLabel}</span>
          </div>
        )}
      </div>
      <div className="p-3 rounded-full bg-blue-50">
        <Icon className="h-6 w-6 text-blue-600" />
      </div>
    </div>
  </div>
);

// Composant de graphique en ligne pour les recettes et les charges
const RevenueExpenseChart = ({ data }: { data: FinancialData[] }) => {
  const chartData = {
    labels: data.map(item => item.month),
    datasets: [
      {
        label: 'Recettes',
        data: data.map(item => item.revenue),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Charges',
        data: data.map(item => item.expenses),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(context.parsed.y);
            }
            return label;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
          }
        }
      }
    },
  };

  return <Line data={chartData} options={options} />;
};

// Composant de graphique en barres pour la rentabilité par projet
const ProjectProfitabilityChart = ({ projects }: { projects: ProjectData[] }) => {
  const chartData = {
    labels: projects.map(project => project.name),
    datasets: [
      {
        label: 'Bénéfice (€)',
        data: projects.map(project => project.profit),
        backgroundColor: '#3b82f6',
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const project = projects[context.dataIndex];
            return [
              `Bénéfice: ${project.profit.toLocaleString('fr-FR')} €`,
              `Marge: ${project.profitMargin.toFixed(1)}%`
            ];
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
          }
        }
      }
    },
  };

  return <Bar data={chartData} options={options} />;
};

// Composant de graphique en anneau pour les charges par catégorie
const ExpenseByCategoryChart = ({ categories }: { categories: ExpenseCategory[] }) => {
  const chartData = {
    labels: categories.map(item => item.category),
    datasets: [
      {
        data: categories.map(item => item.amount),
        backgroundColor: categories.map(item => item.color),
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const category = categories[context.dataIndex];
            return [
              `${category.category}: ${category.amount.toLocaleString('fr-FR')} €`,
              `${category.percentage}% du total`
            ];
          }
        }
      },
    },
  };

  return <Doughnut data={chartData} options={options} />;
};

// Composant principal du tableau de bord analytique
export default function AnalyticsDashboard() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simuler un chargement asynchrone
    const timer = setTimeout(() => {
      try {
        const mockData = generateMockData();
        setData(mockData);
        setIsLoading(false);
      } catch (err) {
        setError('Erreur lors du chargement des données');
        setIsLoading(false);
        console.error(err);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord analytique</h1>
        <p className="mt-1 text-sm text-gray-500">
          Aperçu des performances financières et de la rentabilité
        </p>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Recettes ce mois"
          value={data?.totals.revenue || 0}
          icon={DollarSign}
          change={data?.totals.revenueChange || 0}
          changeLabel="par rapport au mois dernier"
        />
        <StatCard
          title="Charges ce mois"
          value={data?.totals.expenses || 0}
          icon={TrendingUp}
          change={data?.totals.expensesChange || 0}
          changeLabel="par rapport au mois dernier"
        />
        <StatCard
          title="Profit net"
          value={data?.totals.profit || 0}
          icon={BarChart3}
          change={data?.totals.profitMargin || 0}
          changeLabel="marge"
          isCurrency={false}
        />
        <StatCard
          title="Marge bénéficiaire"
          value={data?.totals.profitMargin || 0}
          icon={PieChart}
          isCurrency={false}
        />
      </div>

      {/* Graphique Recettes vs Charges */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recettes vs Charges (6 derniers mois)</h2>
        <div className="h-80">
          <RevenueExpenseChart data={data?.financialData || []} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rentabilité par projet */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Rentabilité par projet</h2>
          <div className="h-80">
            <ProjectProfitabilityChart projects={data?.projects || []} />
          </div>
        </div>

        {/* Répartition des charges */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Répartition des charges</h2>
          <div className="flex flex-col lg:flex-row h-80">
            <div className="w-full lg:w-1/2">
              <ExpenseByCategoryChart categories={data?.expenseCategories || []} />
            </div>
            <div className="w-full lg:w-1/2 mt-6 lg:mt-0 lg:pl-6">
              <div className="space-y-4">
                {data?.expenseCategories.map((category: ExpenseCategory) => (
                  <div key={category.category} className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-700">{category.category}</span>
                        <span className="text-gray-500">{category.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="h-2 rounded-full" 
                          style={{
                            width: `${category.percentage}%`,
                            backgroundColor: category.color
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
