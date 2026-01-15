'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ChargeDetaileeFormProps {
  dossierId: string;
  onSuccess?: () => void;
}

export default function ChargeDetaileeForm({
  dossierId,
  onSuccess,
}: ChargeDetaileeFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    fournisseur: '',
    montantHT: 0,
    avecTVA: false,
    tauxTVA: 20,
    categorie: 'AUTRES',
    description: '',
  });

  // Auto-calc TVA
  const montantTVA =
    formData.avecTVA && formData.montantHT > 0
      ? (formData.montantHT * formData.tauxTVA) / 100
      : 0;
  const montantTTC = formData.montantHT + montantTVA;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : type === 'number'
            ? parseFloat(value) || 0
            : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `/api/dossiers/${dossierId}/charges-detaillees`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        setSuccess('Charge ajoutée avec succès!');
        setFormData({
          date: new Date().toISOString().split('T')[0],
          fournisseur: '',
          montantHT: 0,
          avecTVA: false,
          tauxTVA: 20,
          categorie: 'AUTRES',
          description: '',
        });
        if (onSuccess) onSuccess();
      } else {
        const data = await response.json();
        setError(data.error || 'Erreur lors de l\'ajout de la charge');
      }
    } catch (err) {
      setError('Erreur serveur');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ajouter une charge</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded">
              {success}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>

            {/* Fournisseur */}
            <div className="space-y-2">
              <Label htmlFor="fournisseur">Fournisseur</Label>
              <Input
                id="fournisseur"
                type="text"
                name="fournisseur"
                placeholder="EDF, Orange, etc."
                value={formData.fournisseur}
                onChange={handleChange}
                required
              />
            </div>

            {/* Montant HT */}
            <div className="space-y-2">
              <Label htmlFor="montantHT">Montant HT (€)</Label>
              <Input
                id="montantHT"
                type="number"
                name="montantHT"
                placeholder="0"
                value={formData.montantHT}
                onChange={handleChange}
                step="0.01"
                required
              />
            </div>

            {/* Catégorie */}
            <div className="space-y-2">
              <Label htmlFor="categorie">Catégorie</Label>
              <select
                id="categorie"
                name="categorie"
                value={formData.categorie}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="UTILITIES">Utilities (électricité, eau)</option>
                <option value="SERVICES">Services</option>
                <option value="FOURNITURES_BUREAUTIQUE">Fournitures bureau</option>
                <option value="FOURNITURES">Fournitures</option>
                <option value="AUTRES">Autres</option>
              </select>
            </div>
          </div>

          {/* TVA Section */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  id="avecTVA"
                  name="avecTVA"
                  checked={formData.avecTVA}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
                <Label htmlFor="avecTVA" className="cursor-pointer">
                  Avec TVA?
                </Label>
              </div>

              {formData.avecTVA && (
                <div className="space-y-2">
                  <Label htmlFor="tauxTVA">Taux TVA (%)</Label>
                  <Input
                    id="tauxTVA"
                    type="number"
                    name="tauxTVA"
                    value={formData.tauxTVA}
                    onChange={handleChange}
                    step="0.1"
                    min="0"
                    max="100"
                  />
                </div>
              )}

              {/* Résumé TVA */}
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div>
                  <p className="text-gray-600 text-sm">Montant HT</p>
                  <p className="text-lg font-semibold">
                    {formData.montantHT.toLocaleString('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">TVA ({formData.tauxTVA}%)</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {montantTVA.toLocaleString('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Montant TTC</p>
                  <p className="text-lg font-semibold text-green-600">
                    {montantTTC.toLocaleString('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Input
              id="description"
              type="text"
              name="description"
              placeholder="Notes sur cette charge..."
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'En cours...' : 'Ajouter la charge'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
