import { getServerAuthSession } from './session'
import { redirect } from 'next/navigation'

export function allowedRolesForDashboard() {
  return ['ADMIN', 'MANAGER']
}

export async function requireRoleForDashboard() {
  const session = await getServerAuthSession()
  if (!session?.user) {
    redirect('/connexion')
  }

  const role = session.user?.role
  if (!role) redirect('/connexion')

  if (role === 'EMPLOYE') {
    // employés voient leur dashboard employé
    redirect('/dashboard/employe')
  }

  if (role === 'CONSULTANT') {
    // consultant -> rediriger vers la liste projets (accès limité)
    redirect('/projets')
  }

  // ADMIN and MANAGER continue to dashboard
  return session
}

export async function requireManagerOrAdmin() {
  const session = await getServerAuthSession()
  if (!session?.user) redirect('/connexion')

  const role = session.user?.role
  if (!role) redirect('/connexion')

  if (role !== 'ADMIN' && role !== 'MANAGER') {
    // non-authorized users redirected
    redirect('/connexion')
  }

  return session
}
