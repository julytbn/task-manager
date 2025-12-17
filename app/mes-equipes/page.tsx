"use client"

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layouts/MainLayout';
import UserTeamsTable from '@/components/UserTeamsTable';
import { AlertCircle } from 'lucide-react';

type Team = {
  id: string;
  name: string;
  description?: string;
  membersCount: number;
  members: Array<{ id: string; name: string; role: string }>;
  projects: Array<{ id: string; name: string }>;
  status: 'Active' | 'En attente' | 'Surchargée';
  createdAt: string;
};

export default function MesEquipesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/connexion');
      return;
    }

    if (status === 'authenticated') {
      fetchUserTeams();
    }
  }, [status, router]);

  const fetchUserTeams = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/user/teams', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des équipes');
      }

      const data = await response.json();
      setTeams(data);
      setError(null);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Impossible de charger vos équipes. Veuillez réessayer plus tard.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeamSelect = (teamId: string) => {
    router.push(`/equipes/${teamId}`);
  };

  if (status === 'loading' || isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Mes équipes</h1>
          <p className="mt-1 text-sm text-gray-500">
            Consultez les équipes auxquelles vous appartenez et gérez vos activités.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <UserTeamsTable 
            teams={teams} 
            onTeamSelect={handleTeamSelect} 
          />
        </div>

        {teams.length === 0 && !isLoading && !error && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune équipe</h3>
            <p className="mt-1 text-sm text-gray-500">
              Vous n'êtes membre d'aucune équipe pour le moment.
            </p>
            <div className="mt-6">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => router.push('/equipes')}
              >
                <svg
                  className="-ml-1 mr-2 h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Voir toutes les équipes
              </button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
