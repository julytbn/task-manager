'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';

// Types
type ChargeStatus = 'BROUILLON' | 'EN_ATTENTE' | 'VALIDEE' | 'REJETEE' | 'REMBOURSEE';
type ChargeType = 'FOURNISSEUR' | 'SALAIRE' | 'LOYER' | 'MATERIEL' | 'SERVICE' | 'DIVERS';

interface Charge {
  id: string;
  reference: string;
  description: string;
  amount: number;
  tva: number;
  date: string;
  dueDate: string;
  status: ChargeStatus;
  type: ChargeType;
  category: string;
  provider?: string;
  projectId?: string;
  projectName?: string;
  paymentMethod: string;
  paymentDate?: string;
  notes?: string;
  attachments: string[];
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
}

// Composants UI
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, variant = 'default' }: { 
  children: React.ReactNode; 
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}) => {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]}`}>
      {children}
    </span>
  );
};

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary',
  className = '',
  disabled = false
}: { 
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  className?: string;
  disabled?: boolean;
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
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium ${variantClasses[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

// Données de démonstration
const mockCharges: Charge[] = [
  {
    id: '1',
    reference: 'CHG-2023-001',
    description: 'Achat matériel informatique',
    amount: 1250.50,
    tva: 20,
    date: '2023-11-15',
    dueDate: '2023-12-15',
    status: 'VALIDEE',
    type: 'MATERIEL',
    category: 'Équipement',
    provider: 'Informatique Pro',
    paymentMethod: 'CARTE',
    paymentDate: '2023-11-16',
    notes: 'Ordinateur portable et accessoires',
    attachments: ['facture-001.pdf'],
    createdAt: '2023-11-15T10:30:00Z',
    createdBy: {
      id: '1',
      name: 'John Doe',
      email: 'john.doe@example.com'
    }
  },
  {
    id: '2',
    reference: 'CHG-2023-002',
    description: 'Loyer bureau',
    amount: 1500,
    tva: 20,
    date: '2023-12-01',
    dueDate: '2023-12-05',
    status: 'EN_ATTENTE',
    type: 'LOYER',
    category: 'Frais fixes',
    paymentMethod: 'VIREMENT',
    notes: 'Loyer du mois de décembre',
    attachments: ['quittance-12-2023.pdf'],
    createdAt: '2023-11-30T09:15:00Z',
    createdBy: {
      id: '2',
      name: 'Jane Smith',
      email: 'jane.smith@example.com'
    }
  },
  {
    id: '3',
    reference: 'CHG-2023-003',
    description: 'Services de nettoyage',
    amount: 450,
    tva: 20,
    date: '2023-12-05',
    dueDate: '2023-12-20',
    status: 'BROUILLON',
    type: 'SERVICE',
    category: 'Prestations',
    provider: 'CleanPro Services',
    paymentMethod: 'PRELEVEMENT',
    notes: 'Nettoyage mensuel des bureaux',
    attachments: [],
    createdAt: '2023-12-04T14:20:00Z',
    createdBy: {
      id: '1',
      name: 'John Doe',
      email: 'john.doe@example.com'
    }
  },
  {
    id: '4',
    reference: 'CHG-2023-004',
    description: 'Formation équipe',
    amount: 1200,
    tva: 20,
    date: '2023-11-20',
    dueDate: '2023-11-30',
    status: 'REJETEE',
    type: 'SERVICE',
    category: 'Formation',
    provider: 'Formation Pro',
    paymentMethod: 'VIREMENT',
    notes: 'Formation React avancé pour 3 personnes',
    attachments: ['devis-formation-123.pdf'],
    createdAt: '2023-11-15T11:45:00Z',
    createdBy: {
      id: '3',
      name: 'Robert Johnson',
      email: 'robert.j@example.com'
    }
  },
  {
    id: '5',
    reference: 'CHG-2023-005',
    description: 'Abonnement logiciel',
    amount: 99.99,
    tva: 20,
    date: '2023-12-01',
    dueDate: '2023-12-01',
    status: 'VALIDEE',
    type: 'SERVICE',
    category: 'Abonnements',
    provider: 'SaaS Company',
    paymentMethod: 'CARTE',
    paymentDate: '2023-12-01',
    notes: 'Abonnement mensuel à Figma Pro',
    attachments: ['facture-figma-12-2023.pdf'],
    createdAt: '2023-11-25T16:30:00Z',
    createdBy: {
      id: '2',
      name: 'Jane Smith',
      email: 'jane.smith@example.com'
    }
  }
];

// Options de filtre
const statusOptions = [
  { value: '', label: 'Tous les statuts' },
  { value: 'BROUILLON', label: 'Brouillon' },
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'VALIDEE', label: 'Validée' },
  { value: 'REJETEE', label: 'Rejetée' },
  { value: 'REMBOURSEE', label: 'Remboursée' },
];

const typeOptions = [
  { value: '', label: 'Tous les types' },
  { value: 'FOURNISSEUR', label: 'Fournisseur' },
  { value: 'SALAIRE', label: 'Salaire' },
  { value: 'LOYER', label: 'Loyer' },
  { value: 'MATERIEL', label: 'Matériel' },
  { value: 'SERVICE', label: 'Service' },
  { value: 'DIVERS', label: 'Divers' },
];

export default function ChargesListPage() {
  const router = useRouter();
  const [charges, setCharges] = useState<Charge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchCharges = async () => {
      try {
        // Simuler un chargement
        setTimeout(() => {
          setCharges(mockCharges);
          setIsLoading(false);
        }, 800);
      } catch (err) {
        setError('Erreur lors du chargement des charges');
        console.error(err);
        setIsLoading(false);
      }
    };

    fetchCharges();
  }, []);

  const getStatusBadge = (status: ChargeStatus) => {
    const statusMap = {
      BROUILLON: { variant: 'default', label: 'Brouillon' },
      EN_ATTENTE: { variant: 'warning', label: 'En attente' },
      VALIDEE: { variant: 'success', label: 'Validée' },
      REJETEE: { variant: 'danger', label: 'Rejetée' },
      REMBOURSEE: { variant: 'info', label: 'Remboursée' },
    };

    const { variant, label } = statusMap[status];
    return <Badge variant={variant as any}>{label}</Badge>;
  };

  const getTypeBadge = (type: ChargeType) => {
    const typeMap = {
      FOURNISSEUR: 'bg-purple-100 text-purple-800',
      SALAIRE: 'bg-blue-100 text-blue-800',
      LOYER: 'bg-yellow-100 text-yellow-800',
      MATERIEL: 'bg-green-100 text-green-800',
      SERVICE: 'bg-indigo-100 text-indigo-800',
      DIVERS: 'bg-gray-100 text-gray-800',
    };

    const typeLabels = {
      FOURNISSEUR: 'Fournisseur',
      SALAIRE: 'Salaire',
      LOYER: 'Loyer',
      MATERIEL: 'Matériel',
      SERVICE: 'Service',
      DIVERS: 'Divers',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeMap[type]}`}>
        {typeLabels[type]}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: fr });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // Filtrer les charges
  const filteredCharges = charges.filter(charge => {
    // Filtre par terme de recherche
    const matchesSearch = 
      charge.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      charge.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (charge.provider && charge.provider.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filtre par statut
    const matchesStatus = !statusFilter || charge.status === statusFilter;
    
    // Filtre par type
    const matchesType = !typeFilter || charge.type === typeFilter;
    
    // Filtre par date
    const chargeDate = new Date(charge.date);
    const startDate = dateRange.start ? new Date(dateRange.start) : null;
    const endDate = dateRange.end ? new Date(dateRange.end) : null;
    
    let matchesDate = true;
    if (startDate) {
      startDate.setHours(0, 0, 0, 0);
      if (chargeDate < startDate) matchesDate = false;
    }
    if (endDate) {
      endDate.setHours(23, 59, 59, 999);
      if (chargeDate > endDate) matchesDate = false;
    }
    
    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCharges.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCharges.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Calculer les totaux
  const totalAmount = filteredCharges.reduce((sum, charge) => sum + charge.amount, 0);
  const paidAmount = filteredCharges
    .filter(charge => charge.status === 'VALIDEE' || charge.status === 'REMBOURSEE')
    .reduce((sum, charge) => sum + charge.amount, 0);
  const pendingAmount = filteredCharges
    .filter(charge => charge.status === 'EN_ATTENTE' || charge.status === 'BROUILLON')
    .reduce((sum, charge) => sum + charge.amount, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* En-tête */}
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Gestion des charges
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Consultez et gérez l'ensemble des charges de l'entreprise
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4
        ">
          <Button 
            variant="primary" 
            onClick={() => router.push('/accounting/charges/new')}
          >
            Nouvelle charge
          </Button>
        </div>
      </div>

      {/* Cartes de synthèse */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total des charges</dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(totalAmount)}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Dépenses payées</dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(paidAmount)}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">En attente</dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(pendingAmount)}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-gray-500 rounded-md p-3">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total des charges</dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {filteredCharges.length}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtres */}
      <Card className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Recherche
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Référence, description, fournisseur..."
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Type de charge
            </label>
            <select
              id="type"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Du
              </label>
              <input
                type="date"
                id="startDate"
                value={dateRange.start}
                onChange={(e) => {
                  setDateRange({ ...dateRange, start: e.target.value });
                  setCurrentPage(1);
                }}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                Au
              </label>
              <input
                type="date"
                id="endDate"
                value={dateRange.end}
                onChange={(e) => {
                  setDateRange({ ...dateRange, end: e.target.value });
                  setCurrentPage(1);
                }}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <Button 
            variant="outline" 
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('');
              setTypeFilter('');
              setDateRange({ start: '', end: '' });
              setCurrentPage(1);
            }}
          >
            Réinitialiser les filtres
          </Button>
        </div>
      </Card>

      {/* Liste des charges */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Référence
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fournisseur
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    Aucune charge trouvée avec les critères sélectionnés.
                  </td>
                </tr>
              ) : (
                currentItems.map((charge) => (
                  <tr key={charge.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <Link href={`/accounting/charges/${charge.id}`} className="text-blue-600 hover:text-blue-900">
                        {charge.reference}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {charge.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {charge.provider || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getTypeBadge(charge.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(charge.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {formatCurrency(charge.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getStatusBadge(charge.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        href={`/accounting/charges/${charge.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Voir
                      </Link>
                      <Link 
                        href={`/accounting/charges/${charge.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Modifier
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Affichage de <span className="font-medium">{indexOfFirstItem + 1}</span> à{' '}
                  <span className="font-medium">
                    {Math.min(indexOfLastItem, filteredCharges.length)}
                  </span>{' '}
                  sur <span className="font-medium">{filteredCharges.length}</span> résultats
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Précédent</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                    <button
                      key={number}
                      onClick={() => paginate(number)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === number
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {number}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
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
      </div>

      {/* Bouton d'export */}
      <div className="mt-6 flex justify-end">
        <Button variant="outline">
          <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Exporter en Excel
        </Button>
      </div>
    </div>
  );
}
