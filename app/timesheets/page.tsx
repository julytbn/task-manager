'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, subDays, startOfWeek, endOfWeek, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';

// Types
type TimesheetStatus = 'BROUILLON' | 'SOUMIS' | 'APPROUVE' | 'REJETE' | 'PAYE';

type Employee = {
  id: string;
  name: string;
  position: string;
  department: string;
  avatar?: string;
};

type TimesheetEntry = {
  id: string;
  employee: Employee;
  weekStart: string;
  weekEnd: string;
  status: TimesheetStatus;
  totalHours: number;
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
};

// Données de démonstration
const mockEmployees: Employee[] = [
  { id: '1', name: 'Jean Dupont', position: 'Développeur Senior', department: 'IT' },
  { id: '2', name: 'Marie Martin', position: 'Designer UI/UX', department: 'Design' },
  { id: '3', name: 'Pierre Durand', position: 'Chef de Projet', department: 'Gestion' },
  { id: '4', name: 'Sophie Bernard', position: 'Développeuse Frontend', department: 'IT' },
  { id: '5', name: 'Thomas Leroy', position: 'Développeur Backend', department: 'IT' },
];

const generateMockTimesheets = (): TimesheetEntry[] => {
  const today = new Date();
  const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  
  return [
    {
      id: '1',
      employee: mockEmployees[0],
      weekStart: format(subDays(currentWeekStart, 7), 'yyyy-MM-dd'),
      weekEnd: format(endOfWeek(subDays(currentWeekStart, 7), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      status: 'APPROUVE',
      totalHours: 38.5,
      submittedAt: '2025-12-01T14:30:00',
      approvedAt: '2025-12-02T09:15:00',
      approvedBy: 'Admin User'
    },
    {
      id: '2',
      employee: mockEmployees[1],
      weekStart: format(subDays(currentWeekStart, 7), 'yyyy-MM-dd'),
      weekEnd: format(endOfWeek(subDays(currentWeekStart, 7), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      status: 'SOUMIS',
      totalHours: 40,
      submittedAt: '2025-12-02T16:45:00',
    },
    {
      id: '3',
      employee: mockEmployees[2],
      weekStart: format(subDays(currentWeekStart, 7), 'yyyy-MM-dd'),
      weekEnd: format(endOfWeek(subDays(currentWeekStart, 7), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      status: 'BROUILLON',
      totalHours: 0,
    },
    {
      id: '4',
      employee: mockEmployees[3],
      weekStart: format(currentWeekStart, 'yyyy-MM-dd'),
      weekEnd: format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      status: 'BROUILLON',
      totalHours: 0,
    },
  ];
};

// Composants UI
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
    {children}
  </div>
);

const Badge = ({ 
  status, 
  className = '' 
}: { 
  status: TimesheetStatus; 
  className?: string;
}) => {
  const statusStyles = {
    BROUILLON: 'bg-gray-100 text-gray-800',
    SOUMIS: 'bg-blue-100 text-blue-800',
    APPROUVE: 'bg-green-100 text-green-800',
    REJETE: 'bg-red-100 text-red-800',
    PAYE: 'bg-purple-100 text-purple-800',
  };

  const statusLabels = {
    BROUILLON: 'Brouillon',
    SOUMIS: 'Soumis',
    APPROUVE: 'Approuvé',
    REJETE: 'Rejeté',
    PAYE: 'Payé',
  };

  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status]} ${className}`}
    >
      {statusLabels[status]}
    </span>
  );
};

const Button = ({ 
  children, 
  variant = 'primary',
  onClick,
  className = '',
  disabled = false,
  isLoading = false
}: { 
  children: React.ReactNode; 
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
}) => {
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
    ghost: 'hover:bg-gray-100 text-gray-700',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium ${variantClasses[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Traitement...
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default function TimesheetsManagerPage() {
  const router = useRouter();
  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('TOUS');
  const [selectedWeek, setSelectedWeek] = useState<string>('CETTE_SEMAINE');
  const [searchQuery, setSearchQuery] = useState('');

  // Charger les données
  useEffect(() => {
    const fetchTimesheets = async () => {
      try {
        // Simuler un chargement
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Récupérer les données de démonstration
        const data = generateMockTimesheets();
        setTimesheets(data);
      } catch (error) {
        console.error('Erreur lors du chargement des feuilles de temps :', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimesheets();
  }, []);

  // Filtrer les feuilles de temps
  const filteredTimesheets = timesheets.filter(timesheet => {
    // Filtre par statut
    if (selectedStatus !== 'TOUS' && timesheet.status !== selectedStatus) {
      return false;
    }
    
    // Filtre par recherche
    if (searchQuery && !timesheet.employee.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Filtre par semaine
    if (selectedWeek === 'CETTE_SEMAINE') {
      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
      
      const timesheetWeekStart = new Date(timesheet.weekStart);
      return timesheetWeekStart >= weekStart && timesheetWeekStart <= weekEnd;
    }
    
    if (selectedWeek === 'SEMAINE_DERNIERE') {
      const lastWeekStart = startOfWeek(subDays(new Date(), 7), { weekStartsOn: 1 });
      const lastWeekEnd = endOfWeek(subDays(new Date(), 7), { weekStartsOn: 1 });
      
      const timesheetWeekStart = new Date(timesheet.weekStart);
      return timesheetWeekStart >= lastWeekStart && timesheetWeekStart <= lastWeekEnd;
    }
    
    return true;
  });

  // Gérer l'approbation d'une feuille de temps
  const handleApprove = async (id: string) => {
    try {
      // Simuler une requête API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setTimesheets(prev => 
        prev.map(timesheet => 
          timesheet.id === id 
            ? { 
                ...timesheet, 
                status: 'APPROUVE',
                approvedAt: new Date().toISOString(),
                approvedBy: 'Manager' 
              } 
            : timesheet
        )
      );
    } catch (error) {
      console.error('Erreur lors de l\'approbation :', error);
    }
  };

  // Gérer le rejet d'une feuille de temps
  const handleReject = async (id: string) => {
    try {
      // Simuler une requête API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setTimesheets(prev => 
        prev.map(timesheet => 
          timesheet.id === id 
            ? { 
                ...timesheet, 
                status: 'REJETE',
                approvedAt: new Date().toISOString(),
                approvedBy: 'Manager' 
              } 
            : timesheet
        )
      );
    } catch (error) {
      console.error('Erreur lors du rejet :', error);
    }
  };

  // Obtenir le libellé de la semaine
  const getWeekLabel = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isSameDay(start, end)) {
      return format(start, 'd MMM yyyy', { locale: fr });
    }
    
    return `${format(start, 'd', { locale: fr })} - ${format(end, 'd MMM yyyy', { locale: fr })}`;
  };

  // Obtenir le libellé de la date de soumission
  const getSubmittedAtLabel = (dateString?: string) => {
    if (!dateString) return 'Non soumis';
    
    const date = new Date(dateString);
    return `Soumis le ${format(date, 'd MMM yyyy à HH:mm', { locale: fr })}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des feuilles de temps</h1>
          <p className="mt-1 text-sm text-gray-500">
            Consultez et gérez les feuilles de temps de vos collaborateurs
          </p>
        </div>
        <div className="mt-4 md:mt-0
        ">
          <Link 
            href="/timesheets/export" 
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exporter en Excel
          </Link>
        </div>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Rechercher un employé
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type="text"
                id="search"
                className="block w-full pr-10 sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nom de l'employé..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              id="status"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="TOUS">Tous les statuts</option>
              <option value="BROUILLON">Brouillon</option>
              <option value="SOUMIS">Soumis</option>
              <option value="APPROUVE">Approuvé</option>
              <option value="REJETE">Rejeté</option>
              <option value="PAYE">Payé</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="week" className="block text-sm font-medium text-gray-700 mb-1">
              Période
            </label>
            <select
              id="week"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
            >
              <option value="CETTE_SEMAINE">Cette semaine</option>
              <option value="SEMAINE_DERNIERE">Semaine dernière</option>
              <option value="TOUTES">Toutes les périodes</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 p-3 rounded-full">
              <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 truncate">Feuilles à valider</p>
              <p className="text-2xl font-semibold text-gray-900">
                {timesheets.filter(t => t.status === 'SOUMIS').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 p-3 rounded-full">
              <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 truncate">Approuvées ce mois</p>
              <p className="text-2xl font-semibold text-gray-900">
                {timesheets.filter(t => t.status === 'APPROUVE').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-100 p-3 rounded-full">
              <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 truncate">Heures moyennes</p>
              <p className="text-2xl font-semibold text-gray-900">
                {timesheets.length > 0 
                  ? (timesheets.reduce((acc, curr) => acc + curr.totalHours, 0) / timesheets.length).toFixed(1)
                  : '0.0'}
              </p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-100 p-3 rounded-full">
              <svg className="h-6 w-6 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 truncate">Équipe</p>
              <p className="text-2xl font-semibold text-gray-900">
                {new Set(timesheets.map(t => t.employee.id)).size}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tableau des feuilles de temps */}
      <Card>
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employé
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Période
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Heures
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Soumis le
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTimesheets.length > 0 ? (
                  filteredTimesheets.map((timesheet) => (
                    <tr key={timesheet.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {timesheet.employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {timesheet.employee.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {timesheet.employee.position}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {getWeekLabel(timesheet.weekStart, timesheet.weekEnd)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(timesheet.weekStart), 'd MMM yyyy', { locale: fr })} - {format(new Date(timesheet.weekEnd), 'd MMM yyyy', { locale: fr })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">
                          {timesheet.totalHours.toFixed(1)} heures
                        </div>
                        <div className="text-sm text-gray-500">
                          {timesheet.status === 'BROUILLON' ? 'Non renseigné' : 'Temps complet'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge status={timesheet.status} />
                        {timesheet.approvedBy && (
                          <div className="text-xs text-gray-500 mt-1">
                            Par {timesheet.approvedBy}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getSubmittedAtLabel(timesheet.submittedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link 
                            href={`/timesheets/${timesheet.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Voir
                          </Link>
                          
                          {timesheet.status === 'SOUMIS' && (
                            <>
                              <button
                                onClick={() => handleApprove(timesheet.id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                Approuver
                              </button>
                              <button
                                onClick={() => handleReject(timesheet.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Rejeter
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                      Aucune feuille de temps trouvée avec les critères sélectionnés.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {filteredTimesheets.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Précédent
              </button>
              <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Suivant
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Affichage de <span className="font-medium">1</span> à <span className="font-medium">{filteredTimesheets.length}</span> sur{' '}
                  <span className="font-medium">{filteredTimesheets.length}</span> résultats
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                    <span className="sr-only">Précédent</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-blue-600 hover:bg-gray-50">
                    1
                  </button>
                  <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                    <span className="sr-only">Suivant</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
