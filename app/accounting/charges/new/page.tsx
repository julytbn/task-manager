'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';

// Types
type ChargeStatus = 'BROUILLON' | 'EN_ATTENTE' | 'VALIDEE' | 'REJETEE' | 'REMBOURSEE';
type ChargeType = 'FOURNISSEUR' | 'SALAIRE' | 'LOYER' | 'MATERIEL' | 'SERVICE' | 'DIVERS';
type PaymentMethod = 'CARTE' | 'VIREMENT' | 'CHEQUE' | 'PRELEVEMENT' | 'LIQUIDE' | 'AUTRE';

interface ChargeFormData {
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
  paymentMethod: PaymentMethod;
  paymentDate?: string;
  notes?: string;
  attachments: File[];
}

// Composants UI
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
    {children}
  </div>
);

const Label = ({ htmlFor, children, required = false, className = '' }: { 
  htmlFor: string; 
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}) => (
  <label htmlFor={htmlFor} className={`block text-sm font-medium text-gray-700 mb-1 ${className}`}>
    {children}
    {required && <span className="text-red-500">*</span>}
  </label>
);

const Input = ({ 
  id, 
  type = 'text', 
  value, 
  onChange, 
  placeholder = '', 
  className = '',
  required = false,
  min,
  max,
  step,
  disabled = false
}: {
  id: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  disabled?: boolean;
}) => (
  <input
    type={type}
    id={id}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    required={required}
    min={min}
    max={max}
    step={step}
    disabled={disabled}
    className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${disabled ? 'bg-gray-100' : 'bg-white'} ${className}`}
  />
);

const Textarea = ({ 
  id, 
  value, 
  onChange, 
  placeholder = '', 
  rows = 3, 
  className = '',
  required = false
}: {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  required?: boolean;
}) => (
  <textarea
    id={id}
    value={value}
    onChange={onChange}
    rows={rows}
    placeholder={placeholder}
    required={required}
    className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${className}`}
  />
);

const Select = ({ 
  id, 
  value, 
  onChange, 
  options, 
  className = '',
  required = false,
  disabled = false
}: {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string; disabled?: boolean }[];
  className?: string;
  required?: boolean;
  disabled?: boolean;
}) => (
  <select
    id={id}
    value={value}
    onChange={onChange}
    required={required}
    disabled={disabled}
    className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${disabled ? 'bg-gray-100' : 'bg-white'} ${className}`}
  >
    {options.map((option) => (
      <option 
        key={option.value} 
        value={option.value}
        disabled={option.disabled}
      >
        {option.label}
      </option>
    ))}
  </select>
);

const Button = ({ 
  children, 
  type = 'button', 
  variant = 'primary',
  onClick,
  className = '',
  disabled = false,
  isLoading = false
}: { 
  children: React.ReactNode; 
  type?: 'button' | 'submit' | 'reset';
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
      type={type}
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

// Données de démonstration
const mockProjects = [
  { id: '1', name: 'Site web client A' },
  { id: '2', name: 'Application mobile B' },
  { id: '3', name: 'Refonte site vitrine' },
];

const typeOptions = [
  { value: 'FOURNISSEUR', label: 'Fournisseur' },
  { value: 'SALAIRE', label: 'Salaire' },
  { value: 'LOYER', label: 'Loyer' },
  { value: 'MATERIEL', label: 'Matériel' },
  { value: 'SERVICE', label: 'Service' },
  { value: 'DIVERS', label: 'Divers' },
];

const statusOptions = [
  { value: 'BROUILLON', label: 'Brouillon' },
  { value: 'EN_ATTENTE', label: 'En attente de paiement' },
  { value: 'VALIDEE', label: 'Payée' },
  { value: 'REJETEE', label: 'Rejetée' },
  { value: 'REMBOURSEE', label: 'Remboursée' },
];

const paymentMethodOptions = [
  { value: 'CARTE', label: 'Carte bancaire' },
  { value: 'VIREMENT', label: 'Virement bancaire' },
  { value: 'CHEQUE', label: 'Chèque' },
  { value: 'PRELEVEMENT', label: 'Prélèvement' },
  { value: 'LIQUIDE', label: 'Espèces' },
  { value: 'AUTRE', label: 'Autre moyen de paiement' },
];

const categoryOptions = [
  { value: 'SALAIRES_CHARGES_SOCIALES', label: 'Salaires & Charges Sociales' },
  { value: 'LOYER_IMMOBILIER', label: 'Loyer & Immobilier' },
  { value: 'UTILITIES', label: 'Électricité & Gaz' },
  { value: 'MATERIEL_EQUIPEMENT', label: 'Matériel & Équipement' },
  { value: 'TRANSPORT_DEPLACEMENT', label: 'Transport & Déplacement' },
  { value: 'FOURNITURES_BUREAUTIQUE', label: 'Fournitures Bureautiques' },
  { value: 'MARKETING_COMMUNICATION', label: 'Marketing & Communication' },
  { value: 'ASSURANCES', label: 'Assurances' },
  { value: 'TAXES_IMPOTS', label: 'Taxes & Impôts' },
  { value: 'AUTRES_CHARGES', label: 'Autres Charges' },
];

export default function NewChargePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // État du formulaire
  const [formData, setFormData] = useState<ChargeFormData>({
    reference: `CHG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    description: '',
    amount: 0,
    tva: 20,
    date: format(new Date(), 'yyyy-MM-dd'),
    dueDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), // 30 jours plus tard
    status: 'BROUILLON',
    type: 'FOURNISSEUR',
    category: '',
    provider: '',
    projectId: '',
    paymentMethod: 'CARTE',
    paymentDate: '',
    notes: '',
    attachments: [],
  });

  // Gestion du changement des champs du formulaire
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [id]: id === 'amount' || id === 'tva' ? parseFloat(value) || 0 : value
    }));
    
    // Effacer l'erreur du champ modifié
    if (errors[id]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  // Gestion du téléchargement des pièces jointes
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...newFiles]
      }));
    }
  };

  // Supprimer une pièce jointe
  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  // Calculer le montant TTC
  const calculateTotalWithTax = () => {
    const amount = formData.amount || 0;
    const tva = formData.tva || 0;
    return amount * (1 + tva / 100);
  };

  // Valider le formulaire
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.description) {
      newErrors.description = 'La description est requise';
    }
    
    if (formData.amount <= 0) {
      newErrors.amount = 'Le montant doit être supérieur à 0';
    }
    
    if (!formData.date) {
      newErrors.date = 'La date est requise';
    }

    if (!formData.category) {
      newErrors.category = 'La catégorie est requise';
    }
    
    if (formData.status === 'VALIDEE' && !formData.paymentDate) {
      newErrors.paymentDate = 'La date de paiement est requise pour une charge validée';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Envoyer les données en JSON (pas FormData)
      const response = await fetch('/api/charges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          montant: formData.amount,
          categorie: formData.category,
          description: formData.description,
          date: formData.date,
          notes: formData.notes || '',
          projetId: formData.projectId || undefined,
        }),
      });
      
      if (!response.ok) {
        let errorMessage = 'Erreur lors de la création';
        try {
          const error = await response.json();
          errorMessage = error.message || error.error || errorMessage;
        } catch (e) {
          // Si la réponse n'est pas JSON, utiliser le texte du statut
          errorMessage = `Erreur ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log('Charge créée avec succès:', result);
      
      // Rediriger vers la liste des charges après création réussie
      router.push('/accounting/charges');
      
    } catch (error) {
      console.error('Erreur lors de la création de la charge :', error);
      setErrors({
        submit: error instanceof Error ? error.message : 'Une erreur est survenue lors de la création de la charge. Veuillez réessayer.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mettre à jour la date de paiement si le statut est défini sur "Payée"
  useEffect(() => {
    if (formData.status === 'VALIDEE' && !formData.paymentDate) {
      setFormData(prev => ({
        ...prev,
        paymentDate: format(new Date(), 'yyyy-MM-dd')
      }));
    }
  }, [formData.status]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Nouvelle charge</h1>
        <Link 
          href="/accounting/charges" 
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          &larr; Retour à la liste
        </Link>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne de gauche - Informations générales */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <h2 className="text-lg font-medium mb-6 pb-2 border-b border-gray-200">Informations générales</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="reference" required>Référence</Label>
                  <Input
                    id="reference"
                    value={formData.reference}
                    onChange={handleInputChange}
                    disabled
                  />
                </div>
                
                <div>
                  <Label htmlFor="date" required>Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="description" required>Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Décrivez la charge en détail"
                    required
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                </div>
                
                <div>
                  <Label htmlFor="amount" required>Montant HT (€)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amount || ''}
                    onChange={handleInputChange}
                    placeholder="0,00"
                    required
                  />
                  {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
                </div>
                
                <div>
                  <Label htmlFor="tva">TVA (%)</Label>
                  <Input
                    id="tva"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.tva}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="md:col-span-2 pt-2">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <span className="text-sm font-medium text-gray-700">Montant TTC :</span>
                    <span className="text-lg font-semibold">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(calculateTotalWithTax())}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Détails du fournisseur */}
            <Card>
              <h2 className="text-lg font-medium mb-6 pb-2 border-b border-gray-200">Fournisseur et catégorisation</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="provider">Fournisseur</Label>
                  <Input
                    id="provider"
                    value={formData.provider || ''}
                    onChange={handleInputChange}
                    placeholder="Nom du fournisseur"
                  />
                </div>
                
                <div>
                  <Label htmlFor="type" required>Type de charge</Label>
                  <Select
                    id="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    options={typeOptions}
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="category" required>Catégorie</Label>
                  <Select
                    id="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    options={[
                      { value: '', label: 'Sélectionnez une catégorie', disabled: true },
                      ...categoryOptions
                    ]}
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="projectId">Projet associé (optionnel)</Label>
                  <Select
                    id="projectId"
                    value={formData.projectId || ''}
                    onChange={handleInputChange}
                    options={[
                      { value: '', label: 'Aucun projet associé' },
                      ...mockProjects.map(p => ({ value: p.id, label: p.name }))
                    ]}
                  />
                </div>
              </div>
            </Card>
            
            {/* Pièces jointes */}
            <Card>
              <h2 className="text-lg font-medium mb-6 pb-2 border-b border-gray-200">Pièces jointes</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                      </svg>
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Cliquez pour téléverser</span> ou glissez-déposez
                      </p>
                      <p className="text-xs text-gray-500">PDF, JPG, PNG (MAX. 10MB)</p>
                    </div>
                    <input 
                      id="attachments" 
                      type="file" 
                      className="hidden" 
                      multiple
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
                
                {formData.attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Fichiers joints :</h4>
                    <ul className="space-y-2">
                      {formData.attachments.map((file, index) => (
                        <li key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                          <div className="flex items-center space-x-2">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-sm text-gray-700 truncate max-w-xs">{file.name}</span>
                            <span className="text-xs text-gray-500">
                              {(file.size / 1024).toFixed(1)} KB
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
            
            {/* Notes */}
            <Card>
              <h2 className="text-lg font-medium mb-4">Notes</h2>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={handleInputChange}
                placeholder="Ajoutez des notes ou des détails supplémentaires..."
                rows={4}
              />
            </Card>
          </div>
          
          {/* Colonne de droite - Paiement et statut */}
          <div className="space-y-6">
            <Card>
              <h2 className="text-lg font-medium mb-6 pb-2 border-b border-gray-200">Paiement</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="status" required>Statut</Label>
                  <Select
                    id="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    options={statusOptions}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="paymentMethod" required>Moyen de paiement</Label>
                  <Select
                    id="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    options={paymentMethodOptions}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="dueDate" className={formData.status === 'EN_ATTENTE' ? '' : 'opacity-50'}>
                    Date d'échéance
                  </Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    disabled={formData.status !== 'EN_ATTENTE'}
                  />
                </div>
                
                <div>
                  <Label 
                    htmlFor="paymentDate" 
                    className={formData.status === 'VALIDEE' ? '' : 'opacity-50'}
                  >
                    Date de paiement
                  </Label>
                  <Input
                    id="paymentDate"
                    type="date"
                    value={formData.paymentDate || ''}
                    onChange={handleInputChange}
                    disabled={formData.status !== 'VALIDEE'}
                    max={format(new Date(), 'yyyy-MM-dd')}
                  />
                  {errors.paymentDate && <p className="mt-1 text-sm text-red-600">{errors.paymentDate}</p>}
                </div>
                
                <div className="pt-4 mt-4 border-t border-gray-200">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Montant HT :</span>
                    <span className="text-sm font-medium">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(formData.amount || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">TVA ({formData.tva}%) :</span>
                    <span className="text-sm font-medium">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format((formData.amount || 0) * (formData.tva / 100))}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 mt-2 border-t border-gray-200 font-medium">
                    <span>Total TTC :</span>
                    <span className="text-lg">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(calculateTotalWithTax())}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Actions */}
            <div className="sticky top-4 space-y-3">
              <Button 
                type="submit" 
                variant="primary" 
                className="w-full justify-center"
                isLoading={isSubmitting}
              >
                Enregistrer la charge
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                className="w-full justify-center"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    status: 'BROUILLON'
                  }));
                  // Soumettre le formulaire avec le statut brouillon
                  handleSubmit({ preventDefault: () => {} } as React.FormEvent);
                }}
                isLoading={isSubmitting}
              >
                Enregistrer comme brouillon
              </Button>
              
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full justify-center text-red-600 hover:bg-red-50"
                onClick={() => router.push('/accounting/charges')}
              >
                Annuler
              </Button>
              
              {errors.submit && (
                <div className="p-3 mt-4 text-sm text-red-700 bg-red-50 rounded-md">
                  {errors.submit}
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
