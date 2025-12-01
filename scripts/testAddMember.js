const fetch = globalThis.fetch || require('node-fetch')

async function main() {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  console.log('Using base URL:', base)

  // 1) fetch one equipe
  const equipesRes = await fetch(`${base}/api/equipes`)
  const equipes = await equipesRes.json()
  if (!Array.isArray(equipes) || equipes.length === 0) {
    console.error('No equipes found in DB')
    process.exit(1)
  }
  const equipe = equipes[0]
  console.log('Using equipe:', equipe.id, equipe.nom)

  // 2) fetch users and pick one who has email
  const usersRes = await fetch(`${base}/api/utilisateurs`)
  const users = await usersRes.json()
  const user = (users || []).find(u => u.email)
  if (!user) {
    console.error('No user with email found')
    process.exit(1)
  }
  console.log('Using utilisateur:', user.id, user.email)

  // 3) POST add member
  const postRes = await fetch(`${base}/api/equipes/${equipe.id}/membres`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ utilisateurId: user.id, role: 'MEMBRE' })
  })
  const body = await postRes.json()
  console.log('Status:', postRes.status)
  console.log('Response body:', JSON.stringify(body, null, 2))

  if (body.emailPreviewUrl) {
    console.log('\nEmail preview URL (Ethereal):', body.emailPreviewUrl)
  } else {
    console.log('\nNo email preview returned. If SMTP configured, check SMTP logs or .env settings.')
  }
}

main().catch(err => { console.error(err); process.exit(1) })
