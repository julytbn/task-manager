# Automatisation des vérifications de paiements en retard (check-late)

Ce document décrit comment configurer et exécuter automatiquement la vérification des paiements en retard (`/api/paiements/check-late`) en utilisant :

- GitHub Actions (déjà ajouté dans `.github/workflows/check-late.yml`)
- Cron (Linux) via `scripts/runCheckLate.sh`
- Task Scheduler (Windows) via `scripts/runCheckLate.ps1`

> Le endpoint accepte un header `x-internal-secret` égal à la variable d'environnement `CHECK_LATE_SECRET` pour autoriser les appels automatisés.

## 1) Générer un secret

Sur Linux/macOS :

```bash
# Générer un secret hex
openssl rand -hex 24

# Ou uuid
uuidgen
```

Sur PowerShell (Windows) :

```powershell
# Générer un GUID
[guid]::NewGuid().ToString()
```

Copie ce secret et ajoute-le à la configuration de ton serveur/producton et aux secrets GitHub.

## 2) Variables d'environnement requises

- `CHECK_LATE_SECRET` : le secret partagé utilisé pour sécuriser l'appel.
- `BASE_URL` (pour GitHub Actions) : l'URL publique de ton application (ex. `https://app.example.com`).

### GitHub Actions
Ajoute dans `Settings → Secrets and variables → Actions` :
- `CHECK_LATE_SECRET` = <ton secret>
- `BASE_URL` = https://ton-app-url

Le workflow `.github/workflows/check-late.yml` utilise ces secrets pour appeler l'endpoint quotidiennement.

## 3) Tester localement

Assure-toi que ton app tourne sur `localhost:3000` (ou adapte l'URL dans le script). Ensuite :

Linux/macOS (bash) :

```bash
export CHECK_LATE_SECRET="<ton secret>"
sh ./scripts/runCheckLate.sh
```

Windows PowerShell :

```powershell
$env:CHECK_LATE_SECRET = '<ton secret>'
.\scripts\runCheckLate.ps1
```

Ou appelle directement le endpoint avec curl :

```bash
curl -X GET "http://localhost:3000/api/paiements/check-late" -H "x-internal-secret: <ton secret>"
```

## 4) Programmer le cron (Linux)

Editer la crontab (`crontab -e`) et ajouter une ligne (ex : tous les jours à 07:00) :

```cron
0 7 * * * cd /path/to/project && /usr/bin/env CHECK_LATE_SECRET="<ton secret>" /bin/bash ./scripts/runCheckLate.sh >> /var/log/check-late.log 2>&1
```

Assure-toi que le chemin vers `runCheckLate.sh` est correct et que `CHECK_LATE_SECRET` est exporté dans l'environnement ou passé sur la ligne.

## 5) Programmer Task Scheduler (Windows)

1. Ouvrir `Task Scheduler`.
2. Créer une tâche basique.
3. Définir le déclencheur (quotidien, horaire désiré).
4. Dans `Actions`, créer une action qui exécute `PowerShell.exe` avec argument :
   ```text
   -File "C:\path\to\project\scripts\runCheckLate.ps1"
   ```
5. Dans `Conditions`/`Settings`, configurer selon besoin.
6. Assure-toi que la variable d'environnement `CHECK_LATE_SECRET` est disponible pour la session (ou modifie le script pour lire le secret depuis un fichier protégé).

## 6) Notes de production

- Pour éviter les notifications en double, le service vérifie maintenant s'il existe déjà une notification ALERTE non lue et récente pour le même paiement.
- Pense à surveiller les logs `/var/log/check-late.log` ou la sortie du workflow GitHub Actions.
- Optionnel : ajouter envoi d'emails/SMS lors de la création d'une notification critique.

## 7) Dépannage

- Si le workflow GitHub Actions échoue, vérifie `Actions → Workflow runs` pour les logs et assure-toi que `BASE_URL` et `CHECK_LATE_SECRET` sont corrects.
- Si la requête retourne 401/403, vérifie que tu fournis bien l'en-tête `x-internal-secret` et que la valeur correspond à `CHECK_LATE_SECRET`.

