'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { BarChart3, Calendar, Users, FileText, TrendingUp, Clock } from 'lucide-react';

interface DashboardCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  color: string;
}

function DashboardCard({ icon, title, description, href, color }: DashboardCardProps) {
  return (
    <Link href={href}>
      <div className={`card cursor-pointer group relative overflow-hidden`}>
        {/* Background gradient */}
        <div className={`absolute inset-0 ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
        
        {/* Content */}
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[var(--color-black-deep)] mb-2">{title}</h3>
            <p className="text-sm text-gray-600 mb-4">{description}</p>
            <button className="text-sm font-medium text-[var(--color-gold)] hover:text-[var(--color-gold-accent)] transition-colors">
              Accéder →
            </button>
          </div>
          <div className={`flex-shrink-0 ${color} p-3 rounded-lg text-white group-hover:scale-110 transition-transform duration-300`}>
            {icon}
          </div>
        </div>

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--color-gold)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    </Link>
  );
}

export default function DashboardWelcome() {
  const { data: session } = useSession();
  const displayName = session?.user?.prenom || 'Utilisateur';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="fade-in">
        <h1 className="text-3xl font-bold mb-2">
          Bienvenue, <span className="gold-gradient-text">{displayName}</span>!
        </h1>
        <p className="text-gray-600 text-lg">
          Gérez efficacement vos projets, équipes et facturation
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 slide-in-down" style={{ animationDelay: '0.1s' }}>
        {[
          { label: 'Projets actifs', value: '12', color: 'bg-blue-500' },
          { label: 'Équipes', value: '5', color: 'bg-green-500' },
          { label: 'Tâches assignées', value: '24', color: 'bg-purple-500' },
          { label: 'Factures en attente', value: '3', color: 'bg-orange-500' }
        ].map((stat, idx) => (
          <div key={idx} className="card">
            <div className={`${stat.color} w-12 h-12 rounded-lg mb-4 opacity-20`} />
            <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-[var(--color-black-deep)]">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Dashboard Cards */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-[var(--color-black-deep)]">Accès rapide</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 slide-in-right" style={{ animationDelay: '0.2s' }}>
          <DashboardCard
            icon={<BarChart3 size={24} />}
            title="Projets"
            description="Gérez vos projets, assignations et délais"
            href="/projets"
            color="bg-blue-500"
          />
          <DashboardCard
            icon={<Users size={24} />}
            title="Équipes"
            description="Gérez les membres et les rôles des équipes"
            href="/equipes"
            color="bg-green-500"
          />
          <DashboardCard
            icon={<Calendar size={24} />}
            title="Tâches"
            description="Visualisez et validez toutes vos tâches"
            href="/kanban"
            color="bg-purple-500"
          />
          <DashboardCard
            icon={<Clock size={24} />}
            title="Feuilles de temps"
            description="Suivi des heures et du temps des équipes"
            href="/timesheets"
            color="bg-yellow-500"
          />
          <DashboardCard
            icon={<FileText size={24} />}
            title="Factures"
            description="Créez et gérez vos factures professionnelles"
            href="/factures"
            color="bg-orange-500"
          />
          <DashboardCard
            icon={<TrendingUp size={24} />}
            title="Abonnements"
            description="Gérez vos plans et abonnements clients"
            href="/abonnements"
            color="bg-pink-500"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="slide-in-down" style={{ animationDelay: '0.3s' }}>
        <h2 className="text-xl font-semibold text-[var(--color-black-deep)] mb-4">Activité récente</h2>
        <div className="card">
          <div className="space-y-3">
            <p className="text-gray-500 text-center py-8">Aucune activité récente pour le moment</p>
          </div>
        </div>
      </div>
    </div>
  );
}
