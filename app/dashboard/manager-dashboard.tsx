'use client';
import { useEffect, useState, useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import MainLayout from '@/components/MainLayout';
import AnalyticsDashboard from './analytics-dashboard';

// Types
type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string;
};

type Payment = {
  id: string;
  amount: number;
  status: string;
  date: string;
  description: string;
};

// Enregistrement des composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

type User = {
  id?: string;
  role?: string;
};

export default function ManagerDashboard() {
  // Simulation d'un utilisateur administrateur pour le test
  const [user, setUser] = useState<User>({ role: 'ADMIN' });
  const [loading, setLoading] = useState(false);
  
  // Données simulées
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Tâche 1', status: 'TODO', priority: 'HIGH', dueDate: '2023-12-15' },
    { id: '2', title: 'Tâche 2', status: 'IN_PROGRESS', priority: 'MEDIUM', dueDate: '2023-12-20' },
    { id: '3', title: 'Tâche 3', status: 'DONE', priority: 'LOW', dueDate: '2023-12-10' },
  ]);

  const [payments, setPayments] = useState<Payment[]>([
    { id: '1', amount: 1000, status: 'PAID', date: '2023-12-01', description: 'Paiement 1' },
    { id: '2', amount: 500, status: 'PENDING', date: '2023-12-05', description: 'Paiement 2' },
  ]);

  const paymentsTotals = useMemo(() => {
    const paid = payments
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
      
    const pending = payments
      .filter(p => p.status === 'PENDING')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
      
    return {
      total: paid + pending,
      paid,
      pending
    };
  }, [payments]);

  // Calcul des statistiques
  const taskStats = useMemo(() => {
    const todo = tasks.filter(t => 
      t.status && t.status.toUpperCase() === 'TODO'
    ).length;
    
    const inProgress = tasks.filter(t => 
      t.status && t.status.toUpperCase() === 'IN_PROGRESS'
    ).length;
    
    const done = tasks.filter(t => 
      t.status && t.status.toUpperCase() === 'DONE'
    ).length;
    
    return { todo, inProgress, done };
  }, [tasks]);

  // Si l'utilisateur est administrateur, afficher le tableau de bord analytique
  if (user?.role === 'ADMIN') {
    return <AnalyticsDashboard />;
  }

  // Afficher un indicateur de chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Tableau de bord</h1>
        
        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium">Tâches à faire</h3>
            <p className="text-2xl font-bold">{taskStats.todo}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium">En cours</h3>
            <p className="text-2xl font-bold">{taskStats.inProgress}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium">Terminées</h3>
            <p className="text-2xl font-bold">{taskStats.done}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium">Paiements</h3>
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat('fr-FR', { 
                style: 'currency', 
                currency: 'EUR' 
              }).format(paymentsTotals.total)}
            </p>
          </div>
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Progression des tâches</h3>
            <div className="h-64">
              <Doughnut
                data={{
                  labels: ['À faire', 'En cours', 'Terminées'],
                  datasets: [{
                    data: [taskStats.todo, taskStats.inProgress, taskStats.done],
                    backgroundColor: ['#E0E0E0', '#FFD700', '#10B981'],
                    borderWidth: 0,
                  }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Paiements</h3>
            <div className="h-64">
              <Doughnut
                data={{
                  labels: ['Payés', 'En attente'],
                  datasets: [{
                    data: [paymentsTotals.paid, paymentsTotals.pending],
                    backgroundColor: ['#10B981', '#FFD700'],
                    borderWidth: 0,
                  }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
