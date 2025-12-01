import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import ManagerDashboard from './manager-dashboard'

// Server component to redirect employees to their dashboard
export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  // If user is employee, redirect to employee dashboard
  if (session?.user?.role === 'EMPLOYE') {
    redirect('/dashboard/employe')
  }
  
  // If not authenticated, redirect to login
  if (!session) {
    redirect('/connexion')
  }
  
  // Manager dashboard continues
  return <ManagerDashboard />
}
