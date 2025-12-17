import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function AbonnementsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex-1 overflow-auto">
      {children}
    </div>
  )
}
