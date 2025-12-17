# 🚀 PROCHAINES ÉTAPES - NOTIFICATIONS & PAIEMENTS

**Date:** 3 Décembre 2025  
**Audit Status:** ✅ Terminé  
**Prochaines étapes:** Déploiement & Enhancements  

---

## 🎯 Tableau de Bord - Étapes à Venir

```
ACTUEL (3 Dec 2025)         FUTUR
┌──────────────────┐        ┌──────────────────────────┐
│ ✅ AUDIT COMPLET │   →    │ 🔨 DÉPLOIEMENT           │
│ ✅ TESTS MANUELS │   →    │ ⚙️ CONFIGURATION CRON    │
│ ✅ DOCUMENTATION │   →    │ 📧 EMAIL NOTIFICATIONS   │
│ ✅ CODE REVIEW   │   →    │ 🔔 WEBSOCKET TEMPS RÉEL  │
└──────────────────┘        │ 📊 ANALYTICS DASHBOARD   │
                            └──────────────────────────┘
```

---

## 📋 PHASE 1: DÉPLOIEMENT (1-2 jours)

### Jour 1: Préparation

**Matin (2 heures)**
```
[ ] 1. Backup de la base de données
    $ pg_dump DATABASE_URL > backup_2025_12_03.sql

[ ] 2. Vérifier les migrations Prisma
    $ npx prisma migrate status
    
[ ] 3. Tester les endpoints API en production
    $ npm run build

[ ] 4. Vérifier les variables d'environnement
    $ cat .env.production.local | grep -E "DATABASE|CRON"
```

**Après-midi (3 heures)**
```
[ ] 5. Déployer sur Vercel
    $ git push origin main
    
[ ] 6. Vérifier les logs Vercel
    → Vercel Dashboard → Project → Logs

[ ] 7. Tester les endpoints en production
    $ curl https://yourapp.vercel.app/api/notifications

[ ] 8. Tester le frontend
    → https://yourapp.vercel.app/dashboard/manager
```

### Jour 2: Validation

**Matin (2 heures)**
```
[ ] 1. Créer des notifications de test
    $ node scripts/testPaymentNotificationReminder.js

[ ] 2. Vérifier dans le dashboard
    → Bell icon doit afficher les notifications

[ ] 3. Tester le marquage comme lu
    → Cliquer sur notification

[ ] 4. Vérifier les logs
    → Console devtools (F12)
```

**Après-midi (2 heures)**
```
[ ] 5. Validation équipe
    → Inviter 2-3 utilisateurs à tester

[ ] 6. Feedback utilisateurs
    → Collecter les retours

[ ] 7. Documenter problèmes éventuels
    → Créer issues si nécessaire

[ ] 8. Marquer comme déployé
    → Mettre à jour ce document
```

---

## 🔨 PHASE 2: CONFIGURATION CRON (1 jour)

### Configuration Vercel CRON

**Créer `vercel.json`:**

```json
{
  "crons": [
    {
      "path": "/api/cron/check-late-payments",
      "schedule": "0 0 * * *"
    }
  ]
}
```

**Commandes:**
```bash
[ ] 1. Créer fichier vercel.json
    $ cat > vercel.json << 'EOF'
    {
      "crons": [
        {
          "path": "/api/cron/check-late-payments",
          "schedule": "0 0 * * *"
        }
      ]
    }
    EOF

[ ] 2. Configurer .env.production
    CRON_SECRET=your_super_secret_here

[ ] 3. Deployer avec CRON
    $ git add vercel.json
    $ git commit -m "Configure CRON jobs"
    $ git push origin main

[ ] 4. Vérifier dans Vercel Dashboard
    → Project → Settings → Crons
```

**Tester le CRON:**

```bash
[ ] 1. Déclencher manuellement
    $ curl -H "Authorization: Bearer your_secret_here" \\
      https://yourapp.vercel.app/api/cron/check-late-payments

[ ] 2. Vérifier les logs
    → Vercel Dashboard → Logs

[ ] 3. Vérifier les notifications créées
    $ npx prisma studio
    # Aller à Notification, filtre par type = 'ALERTE'
```

---

## 📧 PHASE 3: EMAIL NOTIFICATIONS (2-3 jours)

### 3.1 Configurer Nodemailer (ou SendGrid)

**Installation:**
```bash
npm install nodemailer sendgrid
```

**Créer `lib/email.ts`:**

```typescript
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // App password, pas mot de passe Google
  },
})

export async function sendLatePaymentEmail(
  managerEmail: string,
  clientName: string,
  daysLate: number,
  montant: number
) {
  const emailContent = `
    <h1>⚠️ Alerte: Paiement en Retard</h1>
    <p>Le paiement de <strong>${montant} FCFA</strong> de <strong>${clientName}</strong></p>
    <p>est en retard de <strong>${daysLate} jours</strong>.</p>
    <a href="https://yourapp.com/dashboard/manager/paiements">Voir les détails</a>
  `

  await transporter.sendMail({
    from: process.env.SMTP_FROM_EMAIL,
    to: managerEmail,
    subject: `⚠️ Paiement en retard - ${clientName}`,
    html: emailContent,
  })
}
```

### 3.2 Intégrer dans le Service

**Modifier `lib/paymentLateService.ts`:**

```typescript
import { sendLatePaymentEmail } from '@/lib/email'

export async function checkAndNotifyLatePayments() {
  // ... code existant ...

  for (const { payment, daysLate } of latePayments) {
    try {
      const managers = await prisma.utilisateur.findMany({
        where: { role: 'MANAGER' },
      })

      for (const manager of managers) {
        // Créer notification (existant)
        await prisma.notification.create({
          data: {
            utilisateurId: manager.id,
            titre: `Paiement en retard - ${payment.client.nom}`,
            message: `Le paiement de ${payment.montant} FCFA...`,
            type: 'ALERTE',
            lien: `/dashboard/manager/paiements`,
          },
        })

        // NOUVEAU: Envoyer email
        try {
          await sendLatePaymentEmail(
            manager.email,
            payment.client.nom,
            daysLate,
            payment.montant
          )
          console.log(`📧 Email sent to ${manager.email}`)
        } catch (emailError) {
          console.error(`Failed to send email to ${manager.email}:`, emailError)
          // Continuer même si email échoue
        }
      }
    } catch (error) {
      console.error(`Error notifying for payment ${payment.id}:`, error)
    }
  }
}
```

### 3.3 Configurer .env

```env
# Gmail (moins sécurisé, pas recommandé)
SMTP_USER=your-email@gmail.com
SMTP_PASS=your_app_password_not_password

# SendGrid (recommandé)
SENDGRID_API_KEY=SG.your_key_here
SENDGRID_FROM_EMAIL=noreply@yourapp.com

# Notifications
CRON_SECRET=your_super_secret_here
```

### 3.4 Tester

```bash
[ ] 1. Tester l'envoi d'email
    $ node scripts/testEmailNotification.js

[ ] 2. Vérifier dans mailbox
    → Inbox du manager

[ ] 3. Vérifier les templates
    → S'assurer que le HTML est bon
```

---

## 🔔 PHASE 4: WEBSOCKET TEMPS RÉEL (3-5 jours)

### 4.1 Installer Socket.io

```bash
npm install socket.io socket.io-client
npm install -D @types/socket.io
```

### 4.2 Créer Serveur WebSocket

**Créer `app/api/socket/route.ts`:**

```typescript
import { Server as SocketIOServer } from 'socket.io'
import { NextResponse } from 'next/server'

let io: SocketIOServer

export function POST(req: Request) {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (!io) {
    io = new SocketIOServer({
      cors: { origin: process.env.NEXT_PUBLIC_APP_URL },
    })
  }

  // Émettre nouvelle notification
  io.emit('notification:new', req.body)
  
  return NextResponse.json({ success: true })
}

export { io }
```

### 4.3 Intégrer dans le Frontend

**Modifier `components/ManagerHeader.tsx`:**

```typescript
import { io } from 'socket.io-client'

export default function ManagerHeader() {
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    // Connexion WebSocket
    const socket = io()

    // Écouter les nouvelles notifications
    socket.on('notification:new', (newNotification) => {
      setNotifications(prev => [newNotification, ...prev])
      setUnreadCount(prev => prev + 1)
    })

    return () => socket.disconnect()
  }, [])

  // ... reste du code ...
}
```

### 4.4 Émettre depuis le Service

**Modifier `lib/paymentLateService.ts`:**

```typescript
import { io } from '@/app/api/socket/route'

export async function checkAndNotifyLatePayments() {
  // ... code existant ...

  for (const { payment, daysLate } of latePayments) {
    for (const manager of managers) {
      const notification = await prisma.notification.create({
        data: { /* ... */ },
      })

      // NOUVEAU: Émettre via WebSocket
      io.emit('notification:new', notification)
    }
  }
}
```

---

## 📊 PHASE 5: ANALYTICS DASHBOARD (3-5 jours)

### 5.1 Créer une Page d'Analytics

**Créer `app/dashboard/analytics/page.tsx`:**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState({
    totalNotifications: 0,
    latePayments: 0,
    resolvedToday: 0,
    avgDaysLate: 0,
    chartData: []
  })

  useEffect(() => {
    const fetchStats = async () => {
      const res = await fetch('/api/analytics/notifications')
      const data = await res.json()
      setStats(data)
    }
    fetchStats()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Notifications Analytics</h1>
      
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-600">Total Notifications</div>
          <div className="text-2xl font-bold">{stats.totalNotifications}</div>
        </div>
        
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-600">Late Payments</div>
          <div className="text-2xl font-bold text-red-600">{stats.latePayments}</div>
        </div>
        
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-600">Resolved Today</div>
          <div className="text-2xl font-bold text-green-600">{stats.resolvedToday}</div>
        </div>
        
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-600">Avg Days Late</div>
          <div className="text-2xl font-bold">{stats.avgDaysLate.toFixed(1)}</div>
        </div>
      </div>

      <div className="bg-white p-8 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Notifications par Jour (7 jours)</h2>
        <BarChart width={800} height={300} data={stats.chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#8884d8" />
        </BarChart>
      </div>
    </div>
  )
}
```

### 5.2 Créer l'API

**Créer `app/api/analytics/notifications/route.ts`:**

```typescript
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Total notifications
    const totalNotifications = await prisma.notification.count()

    // Paiements en retard
    const latePayments = await prisma.paiement.count({
      where: { statut: 'EN_ATTENTE' }
    })

    // Notifications résolues aujourd'hui
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const resolvedToday = await prisma.notification.count({
      where: {
        lu: true,
        dateModification: { gte: today }
      }
    })

    // Moyenne jours de retard
    const avgDaysLate = 5.2 // Calculer depuis la BD

    // Données pour graphique
    const chartData = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const count = await prisma.notification.count({
        where: {
          dateCreation: {
            gte: new Date(date.setHours(0, 0, 0, 0)),
            lte: new Date(date.setHours(23, 59, 59, 999))
          }
        }
      })
      chartData.push({
        date: date.toLocaleDateString('fr-FR'),
        count
      })
    }

    return NextResponse.json({
      totalNotifications,
      latePayments,
      resolvedToday,
      avgDaysLate,
      chartData
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

---

## 📅 TIMELINE COMPLÈTE

```
DÉCEMBRE 2025

┌─────────┬─────────────────────────────────────┐
│ Date    │ Étape                               │
├─────────┼─────────────────────────────────────┤
│ 3 Dec   │ ✅ Audit complet terminé            │
│ 4-5 Dec │ → Phase 1: Déploiement             │
│ 6 Dec   │ → Phase 2: Configuration CRON      │
│ 7-9 Dec │ → Phase 3: Email notifications     │
│ 10-12   │ → Phase 4: WebSocket temps réel    │
│ 13-15   │ → Phase 5: Analytics dashboard     │
│ 16 Dec  │ ✨ Tous les enhancements livrés    │
└─────────┴─────────────────────────────────────┘
```

---

## 🎯 Points d'Attention

### Avant Déploiement
- [ ] Backup de la BD
- [ ] Test en staging
- [ ] Vérifier les migrations
- [ ] Charger les variables d'env

### Pendant Déploiement
- [ ] Monitorer les logs
- [ ] Avoir un plan de rollback
- [ ] Notifier l'équipe
- [ ] Rester disponible pour supporter

### Après Déploiement
- [ ] Vérifier les notifications arrivent
- [ ] Demander feedback utilisateurs
- [ ] Corriger bugs éventuels
- [ ] Documenter leçons apprises

---

## 🆘 Troubleshooting

### Si le CRON ne se déclenche pas
```bash
# Vérifier dans Vercel Dashboard
→ Project → Deployments → Cron Jobs

# Vérifier les logs
→ Project → Logs → Filter by /api/cron
```

### Si les emails ne s'envoient pas
```bash
# Vérifier SMTP settings
$ cat .env.production.local | grep SMTP

# Tester la connexion
$ node scripts/testEmailConnection.js

# Vérifier les logs
$ npm run logs
```

### Si WebSocket ne se connecte pas
```bash
# Vérifier dans console dev (F12)
Console → chercher "socket"

# Vérifier les logs serveur
$ npm run dev -- --verbose
```

---

## 📞 Points de Contact

- **Déploiement:** DevOps/DevEx
- **Configuration CRON:** Backend Lead
- **Email setup:** Backend Lead
- **WebSocket:** Full Stack Lead
- **Analytics:** Data/Frontend Lead

---

## ✨ Conclusion

**État actuel:** ✅ Production-ready  
**Prochaines étapes:** Déploiement + Enhancements  
**Timeline:** 10-14 jours pour tout livrer  
**Effort estimé:** 20-25 jours/développeur  

**Recommandation:** Commencer par Phase 1 (Déploiement) immédiatement.

---

**Document créé par:** GitHub Copilot  
**Date:** 3 Décembre 2025  
**Version:** 1.0  
**Dernière mise à jour:** 3 Décembre 2025
