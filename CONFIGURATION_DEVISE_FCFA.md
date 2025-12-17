# 💱 Configuration Devise FCFA - Kekeli Group Task Manager

**Date**: 17 Décembre 2025  
**Projet**: Kekeli Group Task Manager  
**Devise Officielle**: **FCFA** (Franc CFA)

---

## 1. DÉCISION DE DEVISE

### Contexte
Le projet Kekeli Group doit utiliser **FCFA** (Franc CFA) comme devise officielle pour tous les calculs financiers et prévisions salariales.

### Remplacement Global
✅ Tous les symboles **€** (Euro) sont remplacés par **FCFA**  
✅ Tous les montants affichés utilisent **FCFA**  
✅ Tous les calculs et estimations sont en **FCFA**

---

## 2. APPLICATIONS IMPACTÉES

### 2.1 Prévisions Salariales
**Fichier**: `lib/services/salaryForecasting/salaryForecastService.ts`

```typescript
// AVANT (€)
const montantPrevu = totalHours * 15  // 15€/h

// APRÈS (FCFA)
const montantPrevu = totalHours * 7500  // 7500 FCFA/h
```

**Exemple de taux conversion approximatif:**
| Rôle | Ancien (€/h) | Nouveau (FCFA/h) | Ratio |
|------|-------------|-----------------|-------|
| Développeur Junior | 15€ | 9,825 FCFA | 1€ = 655 FCFA |
| Développeur Senior | 25€ | 16,375 FCFA | (variable) |
| Consultant | 35€ | 22,925 FCFA | (variable) |
| Chef de Projet | 30€ | 19,650 FCFA | (variable) |

### 2.2 Dashboard Salariales
**Fichier**: `app/dashboard/salary-forecasts/page.tsx`

**Affichage mis à jour:**
```
Ce mois: 1 500 000 FCFA
Mois prochain: 1 400 000 FCFA
Total 3 mois: 4 200 000 FCFA
Moyenne: 1 400 000 FCFA
```

### 2.3 Configuration Admin
**Fichier**: `app/admin/salary-settings/page.tsx`

**Interface administrateur:**
```
Employé | Email | Tarif Horaire (FCFA/h) | Actions
Jean D. | jean@... | 7500 FCFA/h | ✏️
Sophie M. | sophie@... | 9000 FCFA/h | ✏️
Pierre L. | pierre@... | 10500 FCFA/h | ✏️
```

### 2.4 Notifications & Emails
**Contenu de notification:**
```
Sujet: "Prévision Salariale - Janvier 2025"
Message: "Bonjour Jean,
Votre prévision salariale pour janvier 2025 est estimée à:
1 500 000 FCFA

Vous recevrez votre paiement dans 5 jours."
```

### 2.5 API Responses
**Exemple de réponse API:**
```json
{
  "success": true,
  "data": {
    "id": "cuid123",
    "employeId": "emp001",
    "mois": 1,
    "annee": 2025,
    "montantPrevu": 1500000,
    "montantNotifie": 1500000,
    "dateNotification": "2025-01-21T10:30:00Z",
    "devise": "FCFA"
  }
}
```

---

## 3. TARIFS HORAIRES RECOMMANDÉS (EN FCFA)

### Échelle de tarification pour Kekeli Group

| Fonction | Tarif Horaire | Équivalent Mensuel (160h) |
|----------|---------------|--------------------------|
| Stagiaire | 4,000 FCFA | 640,000 FCFA |
| Développeur Junior (1-2 ans) | 7,500 FCFA | 1,200,000 FCFA |
| Développeur Confirmé (3-5 ans) | 9,000 FCFA | 1,440,000 FCFA |
| Développeur Senior (5+ ans) | 12,000 FCFA | 1,920,000 FCFA |
| Tech Lead | 14,000 FCFA | 2,240,000 FCFA |
| Consultant | 10,500 FCFA | 1,680,000 FCFA |
| Chef de Projet | 11,000 FCFA | 1,760,000 FCFA |
| Directeur Technique | 15,000 FCFA | 2,400,000 FCFA |

### Configuration dans la base de données
```sql
-- Exemple d'INSERT avec tarifs FCFA
INSERT INTO utilisateurs (nom, prenom, email, tarifHoraire, role)
VALUES 
  ('Diallo', 'Jean', 'jean@kekeli.com', 7500, 'EMPLOYE'),
  ('Traoré', 'Sophie', 'sophie@kekeli.com', 9000, 'MANAGER'),
  ('Ba', 'Pierre', 'pierre@kekeli.com', 10500, 'CONSULTANT');
```

---

## 4. MISE À JOUR DE LA DEVISE DANS LE CODE

### 4.1 Variable d'Environnement (Recommandé)
```bash
# .env.local
NEXT_PUBLIC_CURRENCY=FCFA
NEXT_PUBLIC_CURRENCY_SYMBOL=FCFA
NEXT_PUBLIC_EXCHANGE_RATE=1  # FCFA = 1 FCFA (baseline)
```

### 4.2 Utiliser dans les composants
```typescript
// lib/constants.ts
export const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || 'FCFA'

// app/dashboard/salary-forecasts/page.tsx
<td className="amount">
  {new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',  // Code ISO pour CFA Franc
    maximumFractionDigits: 0
  }).format(forecast.montantPrevu)}
</td>
```

### 4.3 Localization
```typescript
// Utilisé partout pour affichage FCFA
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Usage
const displayAmount = formatCurrency(1500000)  // "1 500 000 FCFA"
```

---

## 5. ÉTAPES DE MIGRATION

### Phase 1: Documentation ✅
- [x] Mise à jour des documents de spécification
- [x] Mise à jour de la documentation technique
- [x] Clarification des tarifs FCFA

### Phase 2: Base de Données (À FAIRE)
- [ ] Migration Prisma pour insérer tarifs en FCFA
- [ ] Vérifier tous les champs montant/prix
- [ ] Mettre à jour les fixtures de test

### Phase 3: Backend (À FAIRE)
- [ ] Valider calculs avec FCFA dans `salaryForecastService.ts`
- [ ] Mettre à jour endpoints API pour retourner FCFA
- [ ] Tester format de réponse JSON

### Phase 4: Frontend (À FAIRE)
- [ ] Mettre à jour `salary-forecasts/page.tsx` pour afficher FCFA
- [ ] Mettre à jour `salary-settings/page.tsx` interface admin
- [ ] Mettre à jour les labels et placeholders
- [ ] Tester formatage des montants

### Phase 5: Tests (À FAIRE)
- [ ] Tests unitaires avec montants FCFA
- [ ] Tests d'intégration bout-en-bout
- [ ] Tests de performance avec calculs FCFA
- [ ] Validation des notifications emails

---

## 6. EXEMPLES CONCRETS

### Calcul de Prévision Salariale

**Employé**: Jean Diallo  
**Tarif horaire**: 7,500 FCFA/h  
**Heures travaillées (Janvier 2025)**: 82h

```
Calcul:
  Heures régulières: 80h × 7,500 = 600,000 FCFA
  Heures supplémentaires: 2h × 7,500 × 1.25 = 18,750 FCFA
  ─────────────────────────────────────────────
  Total prévu: 618,750 FCFA

Dashboard affichage:
  "Prévision salariale janvier 2025: 618 750 FCFA"
```

### Email de Notification

```
Subject: Prévision Salariale - Janvier 2025
From: system@kekeli.com
To: jean.diallo@kekeli.com

───────────────────────────────────

Bonjour Jean,

Votre prévision salariale pour janvier 2025 a été calculée:

📊 MONTANT ESTIMÉ: 618 750 FCFA

Détails:
  • Heures normales: 80h × 7 500 FCFA = 600 000 FCFA
  • Heures supplémentaires: 2h × 9 375 FCFA = 18 750 FCFA
  • Total: 618 750 FCFA

📅 Paiement prévu: 27 janvier 2025

Vous recevrez votre paiement dans 5 jours.

Cordialement,
Système Kekeli Group
───────────────────────────────────
```

---

## 7. POINTS DE CONTRÔLE

### ✅ À Vérifier
- [ ] Tous les tarifs horaires sont en FCFA
- [ ] Affichage montants formatés avec séparateurs (ex: 1 500 000)
- [ ] Emails contiennent FCFA
- [ ] API responses incluent devise
- [ ] Pas de références restantes à €
- [ ] Taux de change documenté si conversion externe

### ⚠️ Points d'Attention
- **Arrondis**: Les calculs FCFA peuvent avoir plus de décimales
- **Conversion**: Utiliser XOF (code ISO) pour Intl API
- **Localisation**: Format française pour séparateurs (1 500 000, pas 1,500,000)
- **Précision**: Stocker en entiers (FCFA), pas en floats

---

## 8. RESSOURCES

### Taux de Change (Reference)
- 1 EUR ≈ 655 FCFA (variable selon marché)
- 1 USD ≈ 600 FCFA (variable selon marché)

### Code ISO
- **XOF**: Franc CFA (West African CFA Franc)
- Utilisé dans: Bénin, Burkina Faso, Côte d'Ivoire, Mali, Niger, Sénégal, Togo

### Format Intl.NumberFormat
```javascript
new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'XOF',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
}).format(1500000)
// Retourne: "1 500 000 CFA Fr"
```

---

## 9. DOCUMENT CONNECTÉS

- [IMPLEMENTATION_PREVISIONS_SALARIALES.md](IMPLEMENTATION_PREVISIONS_SALARIALES.md) - Détails techniques
- [CAHIER_DES_CHARGES_FINAL.md](CAHIER_DES_CHARGES_FINAL.md) - Spécifications complètes
- [DOCUMENTATION_SALARY_FORECAST.md](DOCUMENTATION_SALARY_FORECAST.md) - Doc API

---

**Statut**: 🟡 En cours de déploiement  
**Priorité**: 🔴 Haute - Affecte tous calculs financiers  
**Responsable**: Équipe backend & frontend
