// Test de connexion au serveur d'upload
// À exécuter dans la console du navigateur (F12)

async function testUploadServer() {
  const UPLOAD_SERVER_URL = 'http://localhost:4000'
  
  console.log('🔍 Test de connexion au serveur d\'upload...')
  console.log(`📍 URL cible: ${UPLOAD_SERVER_URL}`)
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    
    const response = await fetch(`${UPLOAD_SERVER_URL}/health`, {
      method: 'GET',
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Serveur d\'upload actif:', data)
      return true
    } else {
      console.error('❌ Serveur d\'upload répond mais erreur:', response.status)
      return false
    }
  } catch (err) {
    console.error('❌ Impossible de se connecter:', err)
    return false
  }
}

// Lancer le test
testUploadServer()
