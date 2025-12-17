import MainLayout from '@/components/layouts/MainLayout'
import ClientDetailTabs from '../../../components/ClientDetailTabs'
import { prisma } from '../../../lib/prisma'

export default async function ClientPage({ params }: { params: { id: string } }) {
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      abonnements: true,
      projets: {
        include: {
          projetServices: {
            include: { service: true },
            orderBy: { ordre: 'asc' }
          },
        },
      },
      factures: true,
      paiements: true,
      documents: true,
      souhaits: true,
    } as any,
  })

  if (!client) {
    return (
      <MainLayout>
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">Client introuvable.</div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold gold-gradient-text">Détails du client</h1>
            <p className="text-[var(--color-anthracite)] mt-2">{client.nom}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-[var(--color-offwhite)] rounded-lg shadow-sm border border-[var(--color-border)]">
          <ClientDetailTabs client={client} />
        </div>
      </div>
    </MainLayout>
  )
}
