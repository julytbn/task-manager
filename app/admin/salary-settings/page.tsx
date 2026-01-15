"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Utilisateur {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  tarifHoraire: number | null;
  role: string;
}

export default function SalarySettingsAdmin() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [employees, setEmployees] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTariff, setNewTariff] = useState<string>("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user?.role === "ADMIN") {
      fetchEmployees();
    } else {
      router.push("/dashboard");
    }
  }, [session, status, router]);

  async function fetchEmployees() {
    try {
      setLoading(true);
      const response = await fetch("/api/employees?includeHourlyRate=true");
      if (!response.ok) throw new Error("Erreur lors de la récupération");
      const data = await response.json();
      setEmployees(data.data);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Erreur inconnue",
      });
    } finally {
      setLoading(false);
    }
  }

  async function updateTariff(employeeId: string, newRate: number | null) {
    try {
      setSaving(employeeId);
      setMessage(null);

      const response = await fetch("/api/employees/update-tariff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, tarifHoraire: newRate }),
      });

      if (!response.ok) throw new Error("Erreur lors de la mise à jour");

      setEmployees(
        employees.map((emp) =>
          emp.id === employeeId ? { ...emp, tarifHoraire: newRate } : emp
        )
      );
      setMessage({
        type: "success",
        text: "Tarif horaire mis à jour avec succès",
      });
      setEditingId(null);
      setNewTariff("");
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Erreur inconnue",
      });
    } finally {
      setSaving(null);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            💼 Configuration des Salaires
          </h1>
          <p className="text-gray-600 mt-2">
            Gérez les tarifs horaires des employés pour les prévisions de
            salaires
          </p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Employé
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Tarif horaire
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr
                    key={employee.id}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {employee.prenom} {employee.nom}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {employee.email}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        {employee.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {editingId === employee.id ? (
                        <div className="flex gap-2">
                          <input
                            type="number"
                            step="0.01"
                            value={newTariff}
                            onChange={(e) => setNewTariff(e.target.value)}
                            placeholder="Tarif horaire"
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                            autoFocus
                          />
                          <span className="text-gray-600">FCFA/h</span>
                        </div>
                      ) : (
                        <span className="font-semibold text-green-600">
                          {employee.tarifHoraire
                            ? `${employee.tarifHoraire.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} FCFA/h`
                            : "Non défini"}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {editingId === employee.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              updateTariff(employee.id, parseFloat(newTariff))
                            }
                            disabled={saving === employee.id || !newTariff}
                            className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                          >
                            ✓ Confirmer
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setNewTariff("");
                            }}
                            className="px-2 py-1 bg-gray-300 text-gray-800 rounded text-xs hover:bg-gray-400"
                          >
                            ✕ Annuler
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingId(employee.id);
                            setNewTariff(
                              employee.tarifHoraire?.toString() || ""
                            );
                          }}
                          className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                        >
                          ✏️ Modifier
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {employees.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              Aucun employé trouvé
            </div>
          )}
        </div>

        <div className="mt-8 p-6 bg-yellow-50 rounded-lg border border-yellow-200">
          <h3 className="font-semibold text-yellow-900 mb-2">
            ⚠️ Important
          </h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>
              • Le tarif horaire est obligatoire pour les calculs de prévision
            </li>
            <li>
              • Les modifications s'appliquent automatiquement aux futures
              prévisions
            </li>
            <li>
              • Les timesheets validés recalculeront les prévisions
              automatiquement
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
