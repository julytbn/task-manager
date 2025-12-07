/**
 * Script de test pour vérifier l'API /api/notifications
 * Usage: npm run dev (dans un autre terminal), puis node scripts/testNotificationsAPI.js
 */

const http = require('http')

async function testNotificationsAPI() {
  console.log('🧪 Test API /api/notifications\n')

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/notifications',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': 'your_session_cookie_here' // À remplacer
    }
  }

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`)
        console.log(`Headers:`, res.headers)
        console.log(`Response:`, data)

        if (res.statusCode === 200) {
          try {
            const notifications = JSON.parse(data)
            console.log(`\n✅ ${notifications.length} notification(s) reçue(s)`)
            notifications.forEach((n, i) => {
              console.log(`\n${i + 1}. ${n.titre || n.message}`)
              console.log(`   ID: ${n.id}`)
              console.log(`   Type: ${n.type}`)
              console.log(`   Lu: ${n.lu ? 'Oui' : 'Non'}`)
              console.log(`   Créée: ${n.dateCreation}`)
            })
          } catch (e) {
            console.log('⚠️  Impossible de parser JSON:', e.message)
          }
        } else if (res.statusCode === 401) {
          console.log('\n❌ 401 Non autorisé - Session invalide ou manquante')
          console.log('💡 Solution: Connecte-toi dans le navigateur d\'abord, puis réessaye')
        } else {
          console.log('\n❌ Erreur API')
        }

        resolve()
      })
    })

    req.on('error', (error) => {
      console.error('❌ Erreur requête:', error)
      reject(error)
    })

    req.end()
  })
}

// Alternative: tester avec fetch si Node >= 18
async function testWithFetch() {
  console.log('🧪 Test API /api/notifications (avec fetch)\n')

  try {
    const res = await fetch('http://localhost:3000/api/notifications', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Envoie les cookies
    })

    console.log(`Status: ${res.status}`)
    console.log(`OK: ${res.ok}`)

    const data = await res.json()
    console.log(`Response:`, data)

    if (res.status === 200) {
      console.log(`\n✅ ${data.length || 0} notification(s) reçue(s)`)
      if (Array.isArray(data)) {
        data.forEach((n, i) => {
          console.log(`\n${i + 1}. ${n.titre || n.message}`)
          console.log(`   ID: ${n.id}`)
          console.log(`   Type: ${n.type}`)
          console.log(`   Lu: ${n.lu ? 'Oui' : 'Non'}`)
          console.log(`   Créée: ${n.dateCreation}`)
        })
      }
    } else if (res.status === 401) {
      console.log('\n❌ 401 Non autorisé - Session invalide ou manquante')
      console.log('💡 Solution: Connecte-toi dans le navigateur d\'abord')
    } else {
      console.log(`\n❌ Erreur ${res.status}`)
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  }
}

// Vérifier la table notifications en base
async function testDatabaseDirectly() {
  console.log('\n\n🗄️  Vérification directe de la base de données\n')

  const { PrismaClient } = require('@prisma/client')
  const prisma = new PrismaClient()

  try {
    const allNotifications = await prisma.notification.findMany({
      take: 10,
      orderBy: { dateCreation: 'desc' },
      include: {
        utilisateur: {
          select: { email: true, nom: true }
        }
      }
    })

    console.log(`✅ ${allNotifications.length} notification(s) dans la base de données:\n`)
    allNotifications.forEach((n, i) => {
      console.log(`${i + 1}. ${n.titre || n.message}`)
      console.log(`   ID: ${n.id}`)
      console.log(`   Destinataire: ${n.utilisateur.email} (${n.utilisateur.nom})`)
      console.log(`   Type: ${n.type}`)
      console.log(`   Lu: ${n.lu ? 'Oui' : 'Non'}`)
      console.log(`   Créée: ${new Date(n.dateCreation).toLocaleString()}`)
      console.log(`   Lien: ${n.lien || 'Aucun'}\n`)
    })

    // Chercher les managers
    console.log('\n👥 Managers en base de données:\n')
    const managers = await prisma.utilisateur.findMany({
      where: { role: 'MANAGER' },
      select: { id: true, email: true, nom: true }
    })

    managers.forEach(m => {
      console.log(`- ${m.nom} (${m.email}) - ID: ${m.id}`)
    })

  } catch (error) {
    console.error('❌ Erreur Prisma:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter les tests
;(async () => {
  try {
    // Vérifier la base d'abord
    await testDatabaseDirectly()

    // Ensuite tester l'API
    console.log('\n' + '='.repeat(60))
    await testWithFetch()
  } catch (error) {
    console.error('Erreur globale:', error)
  }
})()
