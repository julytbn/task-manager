import React, { useState } from 'react';

const priorities = [
  { value: 'BASSE', label: 'Basse' },
  { value: 'MOYENNE', label: 'Moyenne' },
  { value: 'HAUTE', label: 'Haute' },
  { value: 'URGENTE', label: 'Urgente' },
];

type Service = { id: string; nom: string };
type Project = { id: string; titre: string };

interface SubmitTaskFormProps {
  services?: Service[];
  projects?: Project[];
}

export default function SubmitTaskForm({ services = [], projects = [] }: SubmitTaskFormProps) {
  const [form, setForm] = useState<{
    titre: string;
    description: string;
    dateEcheance: string;
    priorite: string;
    service: string;
    projet: string;
    files: File[];
  }>({
    titre: '',
    description: '',
    dateEcheance: '',
    priorite: 'MOYENNE',
    service: '',
    projet: '',
    files: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, files: Array.from(e.target.files ?? []) }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    const fd = new FormData();
    fd.append('titre', form.titre);
    fd.append('description', form.description);
    fd.append('dateEcheance', form.dateEcheance);
    fd.append('priorite', form.priorite);
    fd.append('service', form.service);
    fd.append('statut', 'SOUMISE'); // Ajouter le statut SOUMISE
    if (form.projet) fd.append('projet', form.projet);
    form.files.forEach(f => fd.append('files', f));
    try {
      const res = await fetch('/api/taches', {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) throw new Error(await res.text());
      setSuccess('Tâche soumise avec succès !');
      setForm({ titre: '', description: '', dateEcheance: '', priorite: 'MOYENNE', service: '', projet: '', files: [] });
    } catch (err) {
      let message = 'Erreur lors de la soumission';
      if (err instanceof Error) message += ' : ' + err.message;
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Soumettre une tâche</h2>
      <div className="mb-2">
        <label className="block font-semibold">Titre *</label>
        <input name="titre" value={form.titre} onChange={handleChange} required className="w-full border p-2 rounded" />
      </div>
      <div className="mb-2">
        <label className="block font-semibold">Description *</label>
        <textarea name="description" value={form.description} onChange={handleChange} required className="w-full border p-2 rounded" />
      </div>
      <div className="mb-2">
        <label className="block font-semibold">Date d'échéance *</label>
        <input type="date" name="dateEcheance" value={form.dateEcheance} onChange={handleChange} required className="w-full border p-2 rounded" />
      </div>
      <div className="mb-2">
        <label className="block font-semibold">Priorité *</label>
        <select name="priorite" value={form.priorite} onChange={handleChange} required className="w-full border p-2 rounded">
          {priorities.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>
      <div className="mb-2">
        <label className="block font-semibold">Service *</label>
        <select name="service" value={form.service} onChange={handleChange} required className="w-full border p-2 rounded">
          <option value="">Sélectionner...</option>
          {services.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
        </select>
      </div>
      <div className="mb-2">
        <label className="block font-semibold">Projet (optionnel)</label>
        <select name="projet" value={form.projet} onChange={handleChange} className="w-full border p-2 rounded">
          <option value="">Aucun</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.titre}</option>)}
        </select>
      </div>
      <div className="mb-2">
        <label className="block font-semibold">Fichiers justificatifs</label>
        <input type="file" multiple onChange={handleFileChange} className="w-full border p-2 rounded" />
      </div>
      <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded mt-2">{loading ? 'Envoi...' : 'Soumettre ma tâche'}</button>
      {error && <div className="text-red-600 mt-2">{error}</div>}
      {success && <div className="text-green-600 mt-2">{success}</div>}
    </form>
  );
}
