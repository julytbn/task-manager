"use client";

import { useState, useEffect } from 'react';
import { Button, Card } from '@/components/ui';
import { useSession } from 'next-auth/react';

// Updated Goal type to reflect task-oriented goals
interface Goal {
  id: string;
  titre: string; // Task title
  description?: string; // Task details
  statut: 'À faire' | 'En cours' | 'Terminé'; // Task status
  valeurCible?: number; // Target value
}

export default function EmployeeGoals() {
  const { data: session } = useSession();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoal, setNewGoal] = useState({ titre: '', description: '', statut: 'À faire', valeurCible: 0 });

  useEffect(() => {
    fetch('/api/objectifs')
      .then((res) => res.json())
      .then((data) => setGoals(data))
      .catch((err) => console.error('Erreur lors du chargement des objectifs:', err));
  }, []);

  // Updated handleCreateGoal to include task status
  const handleCreateGoal = async () => {
    if (!newGoal.titre || !newGoal.valeurCible) {
      alert('Veuillez remplir tous les champs requis.');
      return;
    }

    try {
      const res = await fetch('/api/objectifs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newGoal,
          employeId: session?.user?.id, // Ajout de l'identifiant de l'employé
        }),
      });

      if (res.ok) {
        const createdGoal = await res.json();
        setGoals((prev) => [...prev, createdGoal]);
        setNewGoal({ titre: '', description: '', valeurCible: 0, statut: 'À faire' });
        alert('Objectif créé avec succès !');
      } else {
        const error = await res.json();
        alert(`Erreur : ${error.error}`);
      }
    } catch (error) {
      console.error('Erreur lors de la création de l’objectif:', error);
      alert('Une erreur est survenue.');
    }
  };

  const handleUpdateGoal = async (id: string, statut: 'À faire' | 'En cours' | 'Terminé') => {
    try {
      const res = await fetch('/api/objectifs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, statut }),
      });

      if (res.ok) {
        const updatedGoal = await res.json();
        setGoals((prev) => prev.map((goal) => (goal.id === id ? updatedGoal : goal)));
      } else {
        console.error('Erreur lors de la mise à jour de l’objectif');
      }
    } catch (error) {
      console.error('Erreur serveur:', error);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      const res = await fetch(`/api/objectifs?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setGoals((prev) => prev.filter((goal) => goal.id !== id));
      } else {
        console.error('Erreur lors de la suppression de l’objectif');
      }
    } catch (error) {
      console.error('Erreur serveur:', error);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mes Objectifs</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 border rounded shadow">
          <h2 className="text-lg font-semibold">Note de performance</h2>
          <p className="text-4xl font-bold">5 / 10</p>
          <p className="text-sm">Basé sur le ratio tâches complétées / assignées</p>
          <div className="w-full bg-gray-200 rounded-full h-4 mt-2">
            <div className="bg-blue-600 h-4 rounded-full" style={{ width: '10%' }}></div>
          </div>
          <p className="text-xs mt-1">Objectif du mois : terminer 10 tâches — Progression : 1 / 10</p>
        </div>

        <div className="p-4 border rounded shadow">
          <h2 className="text-lg font-semibold">Commentaire du manager</h2>
          <p className="text-sm">Aucun commentaire disponible.</p>
        </div>

        <div className="p-4 border rounded shadow">
          <h2 className="text-lg font-semibold">Objectifs</h2>
          <ul className="list-disc pl-5">
            <li>Terminer 10 tâches ce mois</li>
            <li>Réduire les tâches en retard</li>
            <li>Améliorer le temps moyen d'exécution</li>
          </ul>
        </div>
      </div>

      <Card className="p-4 space-y-4">
        <h2 className="text-lg font-semibold">Créer une nouvelle tâche</h2>
        <input
          placeholder="Titre de la tâche"
          value={newGoal.titre}
          onChange={(e) => setNewGoal({ ...newGoal, titre: e.target.value })}
          className="border rounded p-2 w-full"
        />
        <textarea
          placeholder="Description de la tâche"
          value={newGoal.description}
          onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
          className="border rounded p-2 w-full"
        />
        <input
          type="number"
          placeholder="Valeur cible"
          value={newGoal.valeurCible}
          onChange={(e) => setNewGoal({ ...newGoal, valeurCible: parseFloat(e.target.value) })}
          className="border rounded p-2 w-full"
        />
        <Button onClick={handleCreateGoal}>Créer</Button>
      </Card>

      <div className="space-y-4">
        {goals.map((goal) => (
          <Card key={goal.id} className="p-4 space-y-2">
            <h3 className="text-lg font-semibold">{goal.titre}</h3>
            <p className="text-sm text-gray-600">{goal.description}</p>
            <p className="text-sm font-medium">Statut : {goal.statut}</p>
            <div className="flex items-center gap-2">
              <Button onClick={() => handleUpdateGoal(goal.id, 'En cours')}>Marquer comme En cours</Button>
              <Button onClick={() => handleUpdateGoal(goal.id, 'Terminé')}>Marquer comme Terminé</Button>
              <Button variant="danger" onClick={() => handleDeleteGoal(goal.id)}>
                Supprimer
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}