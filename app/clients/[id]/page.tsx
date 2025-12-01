import UiLayout from "../../../components/UiLayout"
import Link from "next/link"
import { prisma } from "../../../lib/prisma"

type Props = { params: { id: string } }

export default async function ClientPage({ params }: Props) {
  const client = await prisma.client.findUnique({ where: { id: params.id } })

  return (
    <UiLayout>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-blue-900">Fiche client — {params.id}</h2>
        <div className="space-x-2">
          <Link href="/clients" className="text-sm text-gray-700">Retour</Link>
        </div>
      </div>

      {client ? (
        <div className="mt-6 p-4 bg-white rounded shadow">
          <div className="font-medium text-lg">{client.nom} {client.prenom ?? ''}</div>
          <div className="text-sm text-gray-600">Email: {client.email ?? '—'}</div>
          <div className="text-sm text-gray-600">Tel: {client.telephone ?? '—'}</div>
          <div className="mt-3 text-gray-700">Adresse: {client.adresse ?? '—'}</div>
        </div>
      ) : (
        <div className="mt-6 p-4 bg-white rounded shadow text-red-600">Client introuvable.</div>
      )}
    </UiLayout>
  )
}
