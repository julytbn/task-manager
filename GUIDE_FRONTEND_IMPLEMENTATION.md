# 🚀 GUIDE D'IMPLÉMENTATION FRONTEND

**Date:** 9 décembre 2025  
**Objectif:** Synchroniser le frontend React avec la nouvelle architecture Prisma

---

## 📋 RÉSUMÉ DES CHANGEMENTS FRONTEND

| Composant | Avant | Après | Priorité |
|---|---|---|---|
| `NouveauProjetModal` | Service unique | Multi-sélection services | 🔴 P1 |
| `ProjetDetails` | Affiche 1 service | Affiche N services | 🔴 P1 |
| `NouveauFactureModal` | Affiche 1 service | Affiche services du projet | 🟡 P2 |
| `app/api/projets/route.ts` | `serviceId` (string) | `serviceIds` (string[]) | 🔴 P1 |
| Type `Projet` | `serviceId + service` | `montantTotal + projetServices[]` | 🔴 P1 |

---

## 🔴 PRIORITÉ 1: NouveauProjetModal

### Types TypeScript

**Avant:**
```typescript
// types/projet.ts
export interface Projet {
  id: string;
  titre: string;
  clientId: string;
  serviceId: string;      // ← UN SEUL
  service: Service;
  budget?: number;
  montantEstime?: number;
}

export interface CreateProjetInput {
  titre: string;
  clientId: string;
  serviceId: string;      // ← UN SEUL
  budget?: number;
}
```

**Après:**
```typescript
// types/projet.ts
export interface ProjetService {
  id: string;
  projetId: string;
  serviceId: string;
  montant?: number;
  ordre: number;
  dateAjout: string;
  service?: Service;
}

export interface Projet {
  id: string;
  titre: string;
  clientId: string;
  projetServices: ProjetService[];  // ← PLUSIEURS
  montantTotal?: number;             // ← CALCULÉ
  budget?: number;
}

export interface CreateProjetInput {
  titre: string;
  clientId: string;
  serviceIds: string[];    // ← PLUSIEURS
  budget?: number;
}
```

### Composant React

**Avant:**
```typescript
// components/NouveauProjetModal.tsx
import { Form, FormField } from "@/components/ui/form";

export function NouveauProjetModal() {
  return (
    <Form>
      <FormField
        name="titre"
        render={() => <input placeholder="Titre du projet" />}
      />
      
      <FormField
        name="clientId"
        render={() => <ClientSelect />}
      />
      
      {/* ❌ AVANT: Service unique */}
      <FormField
        name="serviceId"
        render={() => <ServiceSelect single={true} />}
      />
      
      <FormField
        name="budget"
        render={() => <input type="number" placeholder="Budget" />}
      />
    </Form>
  );
}
```

**Après:**
```typescript
// components/NouveauProjetModal.tsx
import { Form, FormField, FormControl } from "@/components/ui/form";
import { MultiSelect } from "@/components/ui/multi-select";
import { ServiceSelect } from "@/components/ServiceSelect";

interface ServiceOption {
  id: string;
  nom: string;
  prix: number;
  categorie: string;
}

export function NouveauProjetModal() {
  const [selectedServices, setSelectedServices] = useState<ServiceOption[]>([]);
  const montantTotal = selectedServices.reduce((sum, s) => sum + (s.prix || 0), 0);

  return (
    <Form>
      <FormField
        name="titre"
        render={() => <input placeholder="Titre du projet" />}
      />
      
      <FormField
        name="clientId"
        render={() => <ClientSelect />}
      />
      
      {/* ✅ APRÈS: Services multiples */}
      <FormField
        name="serviceIds"
        label="Services du projet"
        render={({ field }) => (
          <div className="space-y-2">
            <ServiceSelect
              multiple={true}
              value={selectedServices}
              onChange={(services) => {
                setSelectedServices(services);
                field.onChange(services.map(s => s.id));
              }}
            />
            
            {/* ✅ Afficher les services sélectionnés */}
            {selectedServices.length > 0 && (
              <div className="bg-slate-50 p-3 rounded border">
                <div className="text-sm font-medium mb-2">Services sélectionnés:</div>
                <div className="space-y-1">
                  {selectedServices.map((s, idx) => (
                    <div key={s.id} className="flex justify-between text-sm">
                      <span>{idx + 1}. {s.nom}</span>
                      <span className="font-mono">{s.prix?.toLocaleString()} FCFA</span>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                  <span>Total:</span>
                  <span className="text-blue-600">{montantTotal.toLocaleString()} FCFA</span>
                </div>
              </div>
            )}
          </div>
        )}
      />
      
      <FormField
        name="budget"
        render={() => <input type="number" placeholder="Budget estimé" />}
      />
    </Form>
  );
}
```

### Route API

**Avant:**
```typescript
// app/api/projets/route.ts
export async function POST(req: Request) {
  const { titre, clientId, serviceId, budget } = await req.json();

  const projet = await prisma.projet.create({
    data: {
      titre,
      clientId,
      serviceId,           // ← UN SEUL
      budget,
      statut: "EN_COURS",
    },
  });

  return Response.json(projet);
}
```

**Après:**
```typescript
// app/api/projets/route.ts
export async function POST(req: Request) {
  const { titre, clientId, serviceIds = [], budget } = await req.json();

  // Valider les services
  if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
    return Response.json(
      { error: "Au moins un service doit être sélectionné" },
      { status: 400 }
    );
  }

  // Vérifier les services existent
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } }
  });

  if (services.length !== serviceIds.length) {
    return Response.json(
      { error: "Un ou plusieurs services n'existent pas" },
      { status: 400 }
    );
  }

  // Créer le projet
  const projet = await prisma.projet.create({
    data: {
      titre,
      clientId,
      budget,
      statut: "EN_COURS",
      // Les ProjetServices sont créés ci-après
    },
  });

  // Créer les associations ProjetService
  let montantTotal = 0;
  for (const [idx, serviceId] of serviceIds.entries()) {
    const service = services.find(s => s.id === serviceId)!;
    const montant = service.prix || 0;
    montantTotal += montant;

    await prisma.projetService.create({
      data: {
        projetId: projet.id,
        serviceId,
        montant,
        ordre: idx + 1,
      },
    });
  }

  // Mettre à jour montantTotal
  const updatedProjet = await prisma.projet.update({
    where: { id: projet.id },
    data: { montantTotal },
    include: {
      projetServices: {
        include: { service: true },
        orderBy: { ordre: 'asc' }
      },
      client: true,
    },
  });

  return Response.json(updatedProjet);
}
```

---

## 🟡 PRIORITÉ 2: ProjetDetails

**Avant:**
```typescript
// components/ProjetDetails.tsx
export function ProjetDetails({ projetId }: { projetId: string }) {
  const [projet, setProjet] = useState<Projet>();

  useEffect(() => {
    fetch(`/api/projets/${projetId}`)
      .then(r => r.json())
      .then(setProjet);
  }, [projetId]);

  return (
    <div className="space-y-4">
      <h2>{projet?.titre}</h2>
      
      {/* ❌ AVANT: Un seul service */}
      <div>
        <label>Service:</label>
        <p>{projet?.service?.nom}</p>
        <p>Prix: {projet?.service?.prix}</p>
      </div>

      <div>
        <label>Budget estimé:</label>
        <p>{projet?.montantEstime}</p>
      </div>
    </div>
  );
}
```

**Après:**
```typescript
// components/ProjetDetails.tsx
export function ProjetDetails({ projetId }: { projetId: string }) {
  const [projet, setProjet] = useState<Projet>();

  useEffect(() => {
    fetch(`/api/projets/${projetId}`)
      .then(r => r.json())
      .then(setProjet);
  }, [projetId]);

  return (
    <div className="space-y-4">
      <h2>{projet?.titre}</h2>
      
      {/* ✅ APRÈS: Plusieurs services */}
      <div className="bg-white p-4 rounded border">
        <div className="font-medium mb-3">Services du projet</div>
        
        {projet?.projetServices && projet.projetServices.length > 0 ? (
          <div className="space-y-2">
            {projet.projetServices.map((ps) => (
              <div key={ps.id} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                <div>
                  <p className="font-medium">{ps.service?.nom}</p>
                  <p className="text-sm text-gray-600">{ps.service?.categorie}</p>
                </div>
                <span className="font-mono font-bold">{ps.montant?.toLocaleString()} FCFA</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Aucun service associé</p>
        )}
      </div>

      {/* ✅ Afficher le montant TOTAL (calculé) */}
      <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-500">
        <div className="flex justify-between items-center">
          <span className="font-medium">Montant total du projet:</span>
          <span className="text-2xl font-bold text-blue-600">
            {projet?.montantTotal?.toLocaleString()} FCFA
          </span>
        </div>
      </div>

      {/* Budget estimé pour comparaison */}
      {projet?.budget && (
        <div className="text-sm text-gray-600">
          Budget estimé: {projet.budget.toLocaleString()} FCFA
        </div>
      )}
    </div>
  );
}
```

---

## 🟢 PRIORITÉ 3: NouveauFactureModal

**Avant:**
```typescript
// components/NouveauFactureModal.tsx - LE SERVICE ÉTAIT ABSENT
export function NouveauFactureModal() {
  // Création facture pour projet
  // Mais sans afficher les services du projet
}
```

**Après:**
```typescript
// components/NouveauFactureModal.tsx
export function NouveauFactureModal() {
  const [projetId, setProjetId] = useState("");
  const [projet, setProjet] = useState<Projet>();

  useEffect(() => {
    if (!projetId) return;
    
    fetch(`/api/projets/${projetId}`)
      .then(r => r.json())
      .then(setProjet);
  }, [projetId]);

  return (
    <Form>
      <FormField
        name="projetId"
        render={() => (
          <ProjetSelect 
            value={projetId}
            onChange={setProjetId}
          />
        )}
      />

      {/* ✅ Afficher les services du projet */}
      {projet?.projetServices && projet.projetServices.length > 0 && (
        <div className="bg-slate-50 p-3 rounded">
          <p className="text-sm font-medium mb-2">Services du projet:</p>
          <div className="space-y-1">
            {projet.projetServices.map((ps) => (
              <div key={ps.id} className="flex justify-between text-sm">
                <span>• {ps.service?.nom}</span>
                <span>{ps.montant?.toLocaleString()} FCFA</span>
              </div>
            ))}
          </div>
          <div className="border-t mt-2 pt-2 font-bold flex justify-between">
            <span>Total du projet:</span>
            <span>{projet.montantTotal?.toLocaleString()} FCFA</span>
          </div>
        </div>
      )}

      {/* Montant de la facture */}
      <FormField
        name="montant"
        label="Montant de la facture"
        render={() => <input type="number" placeholder="Ex: 50% du montant total" />}
      />

      <FormField
        name="notes"
        render={() => <textarea placeholder="Notes sur la facture" />}
      />
    </Form>
  );
}
```

---

## 🔄 ROUTE API - Récupérer Projet Complet

**Nouveau endpoint:**
```typescript
// app/api/projets/[id]/route.ts
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const projet = await prisma.projet.findUnique({
    where: { id },
    include: {
      projetServices: {
        include: {
          service: {
            select: {
              id: true,
              nom: true,
              categorie: true,
              prix: true,
              description: true,
            },
          },
        },
        orderBy: { ordre: 'asc' },
      },
      client: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          entreprise: true,
        },
      },
      factures: {
        select: {
          id: true,
          numero: true,
          montantTotal: true,
          statut: true,
          dateEmission: true,
        },
        orderBy: { dateEmission: 'desc' },
      },
      taches: {
        select: {
          id: true,
          titre: true,
          statut: true,
          priorite: true,
        },
        take: 5, // Top 5 tâches
      },
    },
  });

  if (!projet) {
    return Response.json({ error: "Projet non trouvé" }, { status: 404 });
  }

  return Response.json(projet);
}
```

---

## ✅ CHECKLIST IMPLÉMENTATION

### Phase 1: Types & API (P1)
- [ ] Mettre à jour types `Projet` et `ProjetService`
- [ ] Mettre à jour `CreateProjetInput`
- [ ] Modifier `POST /api/projets` pour accepter `serviceIds[]`
- [ ] Modifier `GET /api/projets/[id]` pour inclure `projetServices`
- [ ] Tester l'API avec Postman/curl

### Phase 2: Frontend (P1)
- [ ] Mettre à jour `NouveauProjetModal` → Multi-sélection services
- [ ] Afficher montant total en temps réel
- [ ] Mettre à jour `ProjetDetails` → Afficher N services
- [ ] Afficher montantTotal calculé

### Phase 3: Factures (P2)
- [ ] Mettre à jour `NouveauFactureModal` → Afficher services du projet
- [ ] Mettre à jour `FactureDetails` → Montrer lien aux services
- [ ] Tester la génération de factures

### Phase 4: Tests (P2)
- [ ] Tests unitaires pour les composants
- [ ] Tests d'intégration API
- [ ] Tests E2E du workflow complet

---

## 🧪 EXEMPLE D'UTILISATION

```typescript
// Créer un projet avec 3 services
const response = await fetch('/api/projets', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    titre: 'Audit Complet 2025',
    clientId: 'client123',
    serviceIds: [
      'service_audit_fiscal_id',    // 300000
      'service_comptabilite_id',    // 200000
      'service_conseil_id'          // 50000
    ],
    budget: 600000
  })
});

const projet = await response.json();
// Résultat:
// {
//   id: 'proj123',
//   titre: 'Audit Complet 2025',
//   montantTotal: 550000,  ← CALCULÉ AUTOMATIQUEMENT
//   projetServices: [
//     { id: 'ps1', montant: 300000, service: { nom: 'Audit Fiscal', ... } },
//     { id: 'ps2', montant: 200000, service: { nom: 'Comptabilité', ... } },
//     { id: 'ps3', montant: 50000, service: { nom: 'Conseil', ... } }
//   ]
// }
```

---

## 🚀 PROCHAINES ÉTAPES

1. **Implémenter Phase 1 & 2** (Types + API + Modal)
2. **Tester avec données réelles**
3. **Implémenter Phase 3** (Factures)
4. **Déployer en production**

**Questions ?** Consultez `IMPLEMENTATION_AUDIT_COMPLET.md` pour plus de détails.
