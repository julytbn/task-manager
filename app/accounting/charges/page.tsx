'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter, Download, MoreHorizontal } from 'lucide-react';

// Utilisation de table HTML standard pour l'instant
const Table = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full overflow-auto">
    <table className="w-full caption-bottom text-sm">
      {children}
    </table>
  </div>
);

const TableHeader = ({ children }: { children: React.ReactNode }) => (
  <thead className="[&_tr]:border-b">
    {children}
  </thead>
);

const TableBody = ({ children }: { children: React.ReactNode }) => (
  <tbody className="[&_tr:last-child]:border-0">
    {children}
  </tbody>
);

const TableRow = ({ children, ...props }: { children: React.ReactNode } & React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr 
    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
    {...props}
  >
    {children}
  </tr>
);

const TableHead = ({ children = '', className = '' }: { children?: React.ReactNode, className?: string }) => (
  <th className={`h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 ${className}`}>
    {children}
  </th>
);

const TableCell = ({ children, className = '', colSpan, ...props }: { children: React.ReactNode, className?: string, colSpan?: number } & React.HTMLAttributes<HTMLTableCellElement>) => (
  <td colSpan={colSpan} className={`p-4 align-middle ${className}`} {...props}>
    {children}
  </td>
);

// Composant DropdownMenu simplifié
const DropdownMenu = ({ children }: { children: React.ReactNode }) => (
  <div className="relative">
    {children}
  </div>
);

const DropdownMenuTrigger = ({ children }: { children: React.ReactNode }) => (
  <div className="cursor-pointer">
    {children}
  </div>
);

const DropdownMenuContent = ({ children }: { children: React.ReactNode }) => (
  <div className="absolute right-0 z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
    {children}
  </div>
);

const DropdownMenuItem = ({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) => (
  <div 
    className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
    onClick={onClick}
  >
    {children}
  </div>
);

// Types
type Charge = {
  id: string;
  reference: string;
  description: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending' | 'cancelled';
  category: string;
};

// Données simulées
const mockCharges: Charge[] = [
  {
    id: '1',
    reference: 'CHG-2023-001',
    description: 'Achat fournitures de bureau',
    amount: 1250.5,
    date: '2023-12-01',
    status: 'paid',
    category: 'Fournitures',
  },
  {
    id: '2',
    reference: 'CHG-2023-002',
    description: 'Abonnement logiciel',
    amount: 299.99,
    date: '2023-12-05',
    status: 'pending',
    category: 'Logiciels',
  },
  {
    id: '3',
    reference: 'CHG-2023-003',
    description: 'Frais de déplacement',
    amount: 450.0,
    date: '2023-12-10',
    status: 'paid',
    category: 'Déplacements',
  },
];

export default function ChargesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredCharges = mockCharges.filter((charge) => {
    const matchesSearch = charge.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      charge.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || charge.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || charge.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalAmount = filteredCharges.reduce((sum, charge) => sum + charge.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestion des charges</h1>
          <p className="text-muted-foreground">
            Consultez et gérez toutes les charges de l'entreprise
          </p>
        </div>
        <Button asChild>
          <Link href="/accounting/charges/new">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle charge
          </Link>
        </Button>
      </div>

      <div className="bg-card rounded-lg border p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Rechercher une charge..."
              className="w-full rounded-lg border bg-background pl-8 pr-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <select
              className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="paid">Payé</option>
              <option value="pending">En attente</option>
              <option value="cancelled">Annulé</option>
            </select>
            
            <select
              className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">Toutes catégories</option>
              <option value="Fournitures">Fournitures</option>
              <option value="Logiciels">Logiciels</option>
              <option value="Déplacements">Déplacements</option>
              <option value="Services">Services</option>
            </select>
            
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCharges.length > 0 ? (
                filteredCharges.map((charge) => (
                  <TableRow key={charge.id}>
                    <TableCell className="font-medium">{charge.reference}</TableCell>
                    <TableCell>{charge.description}</TableCell>
                    <TableCell>
                      {new Date(charge.date).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>{charge.category}</TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'EUR',
                      }).format(charge.amount)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          charge.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : charge.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {charge.status === 'paid'
                          ? 'Payé'
                          : charge.status === 'pending'
                          ? 'En attente'
                          : 'Annulé'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="relative">
                        <button 
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0"
                          onClick={(e) => {
                            e.preventDefault();
                            // Gérer l'ouverture du menu déroulant
                          }}
                        >
                          <span className="sr-only">Ouvrir le menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        <div className="absolute right-0 z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md hidden">
                          <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
                            <Link href={`/accounting/charges/${charge.id}`}>
                              Voir les détails
                            </Link>
                          </div>
                          <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
                            <Link href={`/accounting/charges/${charge.id}/edit`}>
                              Modifier
                            </Link>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Aucune charge trouvée
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-between items-center pt-4">
          <div className="text-sm text-muted-foreground">
            {filteredCharges.length} charge{filteredCharges.length > 1 ? 's' : ''} au total
          </div>
          <div className="font-medium">
            Total: {new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'EUR',
            }).format(totalAmount)}
          </div>
        </div>
      </div>
    </div>
  );
}
