'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  format, 
  addWeeks, 
  subWeeks, 
  startOfWeek, 
  endOfWeek, 
  isSameWeek, 
  isSameDay, 
  addDays,
  isWeekend,
  parseISO,
  eachDayOfInterval,
  isAfter,
  isBefore
} from 'date-fns';
import { fr } from 'date-fns/locale';

// Types
type TimesheetStatus = 'BROUILLON' | 'SOUMIS' | 'APPROUVE' | 'REJETE' | 'PAYE';

type Project = {
  id: string;
  code: string;
  name: string;
  client: string;
};

type TimesheetEntry = {
  id: string;
  project: Project;
  task: string;
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
  total: number;
  notes: string;
};

type TimesheetWeek = {
  id: string;
  startDate: Date;
  endDate: Date;
  status: TimesheetStatus;
  entries: TimesheetEntry[];
  submittedAt?: Date;
  approvedAt?: Date;
  approvedBy?: string;
  comments?: string;
  totalHours: number;
};

// Données de démonstration
const mockProjects: Project[] = [
  { id: '1', code: 'PRJ-001', name: 'Site Web Client A', client: 'Client A' },
  { id: '2', code: 'PRJ-002', name: 'App Mobile Client B', client: 'Client B' },
  { id: '3', code: 'INT', name: 'Formation Interne', client: 'Interne' },
];

const generateMockTimesheet = (startDate: Date): TimesheetWeek => {
  const weekStart = startOfWeek(startDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  
  const entries: TimesheetEntry[] = [
    {
      id: '1',
      project: mockProjects[0],
      task: 'Développement Frontend',
      monday: 8,
      tuesday: 8,
      wednesday: 6,
      thursday: 8,
      friday: 7,
      saturday: 0,
      sunday: 0,
      total: 37,
      notes: ''
    },
    {
      id: '2',
      project: mockProjects[1],
      task: 'Tests API',
      monday: 0,
      tuesday: 0,
      wednesday: 2,
      thursday: 0,
      friday: 1,
      saturday: 0,
      sunday: 0,
      total: 3,
      notes: 'Tests d\'intégration'
    },
    {
      id: '3',
      project: mockProjects[2],
      task: 'Formation React',
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0,
      total: 0,
      notes: ''
    }
  ];

  // Calculer le total des heures
  const totalHours = entries.reduce((sum, entry) => sum + entry.total, 0);

  return {
    id: format(weekStart, 'yyyy-MM-dd'),
    startDate: weekStart,
    endDate: weekEnd,
    status: 'BROUILLON',
    entries,
    totalHours,
    submittedAt: undefined,
    approvedAt: undefined,
  };
};

const generateMockTimesheets = () => {
  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  return [
    {
      id: '1',
      startDate: format(subWeeks(currentWeekStart, 2), 'yyyy-MM-dd'),
      endDate: format(endOfWeek(subWeeks(currentWeekStart, 2), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      status: 'APPROUVE',
      totalHours: 40,
      submittedAt: '2025-11-22T16:45:00',
      approvedAt: '2025-11-23T11:20:00',
      approvedBy: 'Marie Martin',
      days: Array(5).fill(0).map((_, i) => ({
        date: addWeeks(startOfWeek(subWeeks(currentWeekStart, 2), { weekStartsOn: 1 }), i),
        hours: 8,
        notes: i === 2 ? 'Réunion client' : ''
      }))
    },
    {
      id: '2',
      startDate: format(subWeeks(currentWeekStart, 1), 'yyyy-MM-dd'),
      endDate: format(endOfWeek(subWeeks(currentWeekStart, 1), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      status: 'APPROUVE',
      totalHours: 40,
      submittedAt: '2025-11-22T16:45:00',
      approvedAt: '2025-11-23T11:20:00',
      approvedBy: 'Marie Martin',
      days: Array(5).fill(0).map((_, i) => ({
        date: addWeeks(startOfWeek(subWeeks(currentWeekStart, 1), { weekStartsOn: 1 }), i),
        hours: 8,
        notes: i === 2 ? 'Réunion client' : ''
      }))
    },
    {
      id: '3',
      startDate: format(currentWeekStart, 'yyyy-MM-dd'),
      endDate: format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      status: 'SOUMIS',
      totalHours: 40,
      submittedAt: '2025-11-29T17:30:00',
      days: Array(5).fill(0).map((_, i) => ({
        date: addWeeks(startOfWeek(currentWeekStart, { weekStartsOn: 1 }), i),
        hours: 8,
        notes: i === 4 ? 'Télétravail' : ''
      }))
    },
    {
      id: '4',
      startDate: format(addWeeks(currentWeekStart, 1), 'yyyy-MM-dd'),
      endDate: format(endOfWeek(addWeeks(currentWeekStart, 1), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      status: 'BROUILLON',
      totalHours: 0,
      days: Array(5).fill(0).map((_, i) => ({
        date: addWeeks(startOfWeek(addWeeks(currentWeekStart, 1), { weekStartsOn: 1 }), i),
        hours: 0,
        notes: ''
      }))
    }
  ];
};

// Composants UI
const Card = ({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string 
}) => (
  <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
    {children}
  </div>
);

const Badge = ({ status }: { status: TimesheetStatus }) => {
  const statusStyles = {
    BROUILLON: 'bg-gray-100 text-gray-800',
    SOUMIS: 'bg-blue-100 text-blue-800',
    APPROUVE: 'bg-green-100 text-green-800',
    REJETE: 'bg-red-100 text-red-800',
    PAYE: 'bg-purple-100 text-purple-800',
  };

  const statusLabels = {
    BROUILLON: 'Brouillon',
    SOUMIS: 'En attente',
    APPROUVE: 'Approuvé',
    REJETE: 'Rejeté',
    PAYE: 'Payé',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status]}`}>
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

export default function MyTimesheetsPage() {
  const router = useRouter();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [timesheets, setTimesheets] = useState<TimesheetWeek[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'en-cours' | 'historique'>('en-cours');
  const [editingTimesheet, setEditingTimesheet] = useState<TimesheetWeek | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Charger les données
  useEffect(() => {
    const fetchTimesheets = async () => {
      try {
        // Simuler un chargement
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Récupérer les données de démonstration
        const data = generateMockTimesheets();
        setTimesheets(data);
        
        // Définir la semaine en cours comme semaine sélectionnée par défaut
        const currentWeekData = data.find(ts => 
          isSameWeek(new Date(ts.startDate), new Date(), { weekStartsOn: 1 })
        );
        
        if (currentWeekData) {
          setEditingTimesheet(currentWeekData);
        } else {
          // Créer une nouvelle feuille de temps pour la semaine en cours si elle n'existe pas
          const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
          const newTimesheet: TimesheetWeek = {
            id: `new-${Date.now()}`,
            startDate: format(weekStart, 'yyyy-MM-dd'),
            endDate: format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
            status: 'BROUILLON',
            totalHours: 0,
            days: Array(5).fill(0).map((_, i) => ({
              date: addWeeks(weekStart, i),
              hours: 0,
              notes: ''
            }))
          };
          setTimesheets(prev => [newTimesheet, ...prev]);
          setEditingTimesheet(newTimesheet);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des feuilles de temps :', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimesheets();
  }, []);

  // Mettre à jour les heures totales lorsque les jours changent
  useEffect(() => {
    if (editingTimesheet) {
      const totalHours = editingTimesheet.days.reduce((sum, day) => sum + (day.hours || 0), 0);
      
      if (totalHours !== editingTimesheet.totalHours) {
        setEditingTimesheet({
          ...editingTimesheet,
          totalHours: parseFloat(totalHours.toFixed(2))
        });
      }
    }
  }, [editingTimesheet]);

  // Passer à la semaine suivante
  const nextWeek = () => {
    const nextWeekDate = addWeeks(currentWeek, 1);
    setCurrentWeek(nextWeekDate);
    
    // Vérifier si une feuille de temps existe pour cette semaine
    const weekTimesheet = timesheets.find(ts => 
      isSameWeek(new Date(ts.startDate), nextWeekDate, { weekStartsOn: 1 })
    );
    
    if (weekTimesheet) {
      setEditingTimesheet(weekTimesheet);
    } else {
      // Créer une nouvelle feuille de temps pour la semaine
      const weekStart = startOfWeek(nextWeekDate, { weekStartsOn: 1 });
      const newTimesheet: TimesheetWeek = {
        id: `new-${Date.now()}`,
        startDate: format(weekStart, 'yyyy-MM-dd'),
        endDate: format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        status: 'BROUILLON',
        totalHours: 0,
        days: Array(5).fill(0).map((_, i) => ({
          date: addWeeks(weekStart, i),
          hours: 0,
          notes: ''
        }))
      };
      
      setTimesheets(prev => [newTimesheet, ...prev]);
      setEditingTimesheet(newTimesheet);
    }
  };

  // Revenir à la semaine précédente
  const prevWeek = () => {
    const prevWeekDate = subWeeks(currentWeek, 1);
    setCurrentWeek(prevWeekDate);
    
    // Vérifier si une feuille de temps existe pour cette semaine
    const weekTimesheet = timesheets.find(ts => 
      isSameWeek(new Date(ts.startDate), prevWeekDate, { weekStartsOn: 1 })
    );
    
    if (weekTimesheet) {
      setEditingTimesheet(weekTimesheet);
    } else {
      // Créer une nouvelle feuille de temps pour la semaine
      const weekStart = startOfWeek(prevWeekDate, { weekStartsOn: 1 });
      const newTimesheet: TimesheetWeek = {
        id: `new-${Date.now()}`,
        startDate: format(weekStart, 'yyyy-MM-dd'),
        endDate: format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        status: 'BROUILLON',
        totalHours: 0,
        days: Array(5).fill(0).map((_, i) => ({
          date: addWeeks(weekStart, i),
          hours: 0,
          notes: ''
        }))
      };
      
      setTimesheets(prev => [newTimesheet, ...prev]);
      setEditingTimesheet(newTimesheet);
    }
  };

  // Mettre à jour les heures d'un jour
  const updateDayHours = (dayIndex: number, hours: number) => {
    if (!editingTimesheet) return;
    
    const newDays = [...editingTimesheet.days];
    newDays[dayIndex] = {
      ...newDays[dayIndex],
      hours: Math.max(0, Math.min(24, hours || 0))
    };
    
    setEditingTimesheet({
      ...editingTimesheet,
      days: newDays,
      status: 'BROUILLON' // Revenir à l'état brouillon si modifié
    });
  };

  // Mettre à jour les notes d'un jour
  const updateDayNotes = (dayIndex: number, notes: string) => {
    if (!editingTimesheet) return;
    
    const newDays = [...editingTimesheet.days];
    newDays[dayIndex] = {
      ...newDays[dayIndex],
      notes
    };
    
    setEditingTimesheet({
      ...editingTimesheet,
      days: newDays,
      status: 'BROUILLON' // Revenir à l'état brouillon si modifié
    });
  };

  // Soumettre la feuille de temps
  const handleSubmitTimesheet = async () => {
    if (!editingTimesheet) return;
    
    try {
      setIsSubmitting(true);
      
      // Simuler une requête API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedTimesheet: TimesheetWeek = {
        ...editingTimesheet,
        status: 'SOUMIS',
        submittedAt: new Date().toISOString()
      };
      
      // Mettre à jour la liste des feuilles de temps
      setTimesheets(prev => 
        prev.map(ts => 
          ts.id === updatedTimesheet.id ? updatedTimesheet : ts
        )
      );
      
      setEditingTimesheet(updatedTimesheet);
      setShowSubmitModal(false);
      
      // Afficher un message de succès
      alert('Votre feuille de temps a été soumise avec succès !');
    } catch (error) {
      console.error('Erreur lors de la soumission :', error);
      alert('Une erreur est survenue lors de la soumission de votre feuille de temps.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enregistrer comme brouillon
  const saveAsDraft = async () => {
    if (!editingTimesheet) return;
    
    try {
      setIsSubmitting(true);
      
      // Simuler une requête API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedTimesheet: TimesheetWeek = {
        ...editingTimesheet,
        status: 'BROUILLON'
      };
      
      // Mettre à jour la liste des feuilles de temps
      setTimesheets(prev => 
        prev.map(ts => 
          ts.id === updatedTimesheet.id ? updatedTimesheet : ts
        )
      );
      
      setEditingTimesheet(updatedTimesheet);
      
      // Afficher un message de succès
      alert('Votre brouillon a été enregistré.');
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement :', error);
      alert('Une erreur est survenue lors de l\'enregistrement de votre brouillon.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Obtenir le libellé de la semaine
  const getWeekLabel = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isSameDay(start, end)) {
      return format(start, 'd MMM yyyy', { locale: fr });
    }
    
    return `Semaine du ${format(start, 'd MMM yyyy', { locale: fr })} au ${format(end, 'd MMM yyyy', { locale: fr })}`;
  };

  // Vérifier si la semaine est la semaine en cours
  const isCurrentWeek = editingTimesheet && isSameWeek(
    new Date(editingTimesheet.startDate), 
    new Date(), 
    { weekStartsOn: 1 }
  );

  // Filtrer les feuilles de temps pour l'historique (toutes sauf la semaine en cours)
  const historicalTimesheets = timesheets.filter(ts => 
    !isSameWeek(new Date(ts.startDate), new Date(editingTimesheet?.startDate || ''), { weekStartsOn: 1 })
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes feuilles de temps</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gérez vos heures de travail et soumettez vos feuilles de temps
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <a
            href="#"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Demande de congé
          </a>
        </div>
      </div>

      {/* Onglets */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('en-cours')}
            className={`${activeTab === 'en-cours' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Feuille en cours
          </button>
          <button
            onClick={() => setActiveTab('historique')}
            className={`${activeTab === 'historique' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Historique
          </button>
        </nav>
      </div>

      {activeTab === 'en-cours' && (
        <>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : editingTimesheet ? (
            <div className="space-y-6">
              {/* En-tête avec navigation par semaine */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <button
                    onClick={prevWeek}
                    className="p-1 rounded-full text-gray-400 hover:text-gray-500"
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <h2 className="mx-4 text-lg font-medium text-gray-900">
                    {getWeekLabel(editingTimesheet.startDate, editingTimesheet.endDate)}
                  </h2>
                  <button
                    onClick={nextWeek}
                    className="p-1 rounded-full text-gray-400 hover:text-gray-500"
                    disabled={!!isCurrentWeek}
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {isCurrentWeek && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Semaine en cours
                    </span>
                  )}
                </div>
                <div className="mt-4 sm:mt-0 flex items-center">
                  <Badge status={editingTimesheet.status} />
                  {editingTimesheet.status === 'SOUMIS' && editingTimesheet.submittedAt && (
                    <span className="ml-2 text-sm text-gray-500">
                      Soumis le {format(new Date(editingTimesheet.submittedAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                    </span>
                  )}
                </div>
              </div>

              {/* Tableau des heures */}
              <Card>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Jour
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Heures
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {editingTimesheet.days.map((day, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {format(day.date, 'EEEE d MMMM yyyy', { locale: fr })}
                            </div>
                            <div className="text-sm text-gray-500">
                              {format(day.date, 'EEEE', { locale: fr })}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <input
                                type="number"
                                min="0"
                                max="24"
                                step="0.5"
                                value={day.hours || ''}
                                onChange={(e) => updateDayHours(index, parseFloat(e.target.value))}
                                className="w-24 px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                disabled={editingTimesheet.status !== 'BROUILLON'}
                              />
                              <span className="ml-2 text-sm text-gray-500">heures</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={day.notes || ''}
                              onChange={(e) => updateDayNotes(index, e.target.value)}
                              placeholder="Ajouter une note..."
                              className="w-full px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              disabled={editingTimesheet.status !== 'BROUILLON'}
                            />
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Total
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {editingTimesheet.totalHours.toFixed(1)} heures
                        </td>
                        <td className="px-6 py-4">
                          {editingTimesheet.status === 'BROUILLON' && (
                            <span className="text-sm text-gray-500">
                              {editingTimesheet.totalHours < 35 ? 'Temps partiel' : 'Temps plein'}
                            </span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Actions */}
                <div className="mt-6 flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                  <Button
                    variant="outline"
                    onClick={saveAsDraft}
                    disabled={editingTimesheet.status !== 'BROUILLON' || isSubmitting}
                    className="w-full sm:w-auto justify-center"
                  >
                    Enregistrer comme brouillon
                  </Button>
                  
                  <Button
                    variant="primary"
                    onClick={() => setShowSubmitModal(true)}
                    disabled={editingTimesheet.status !== 'BROUILLON' || isSubmitting}
                    className="w-full sm:w-auto justify-center"
                  >
                    Soumettre la feuille de temps
                  </Button>
                </div>
              </Card>

              {/* Commentaires du manager (si disponible) */}
              {editingTimesheet.comments && (
                <Card className="border-l-4 border-yellow-400">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Commentaire du manager</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>{editingTimesheet.comments}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune feuille de temps trouvée</h3>
              <p className="mt-1 text-sm text-gray-500">Commencez par créer une nouvelle feuille de temps.</p>
              <div className="mt-6">
                <Button
                  variant="primary"
                  onClick={() => {
                    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
                    const newTimesheet: TimesheetWeek = {
                      id: `new-${Date.now()}`,
                      startDate: format(weekStart, 'yyyy-MM-dd'),
                      endDate: format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
                      status: 'BROUILLON',
                      totalHours: 0,
                      days: Array(5).fill(0).map((_, i) => ({
                        date: addWeeks(weekStart, i),
                        hours: 0,
                        notes: ''
                      }))
                    };
                    setTimesheets(prev => [newTimesheet, ...prev]);
                    setEditingTimesheet(newTimesheet);
                  }}
                >
                  Nouvelle feuille de temps
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'historique' && (
        <div className="space-y-6">
          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
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
                  {historicalTimesheets.length > 0 ? (
                    historicalTimesheets.map((timesheet) => (
                      <tr key={timesheet.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {getWeekLabel(timesheet.startDate, timesheet.endDate)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {timesheet.totalHours.toFixed(1)} heures
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge status={timesheet.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {timesheet.submittedAt ? (
                            format(new Date(timesheet.submittedAt), 'dd/MM/yyyy', { locale: fr })
                          ) : (
                            'Non soumis'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setEditingTimesheet(timesheet);
                              setActiveTab('en-cours');
                              setCurrentWeek(new Date(timesheet.startDate));
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Voir
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                        Aucune feuille de temps dans l'historique.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de confirmation de soumission */}
      {showSubmitModal && editingTimesheet && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                  <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Soumettre la feuille de temps
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Êtes-vous sûr de vouloir soumettre votre feuille de temps pour la période du{' '}
                      {format(new Date(editingTimesheet.startDate), 'dd/MM/yyyy', { locale: fr })} au{' '}
                      {format(new Date(editingTimesheet.endDate), 'dd/MM/yyyy', { locale: fr })} ?
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                      Total des heures : <span className="font-medium">{editingTimesheet.totalHours.toFixed(1)} heures</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <Button
                  variant="primary"
                  onClick={handleSubmitTimesheet}
                  isLoading={isSubmitting}
                  className="w-full justify-center sm:col-start-2"
                >
                  Confirmer la soumission
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowSubmitModal(false)}
                  disabled={isSubmitting}
                  className="mt-3 sm:mt-0 w-full justify-center"
                >
                  Annuler
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
