import UiLayout from "../../../components/UiLayout"

type Props = { params: { id: string } }

export default function TachePage({ params }: Props) {
  return (
    <UiLayout>
      <h2 className="text-2xl font-bold text-blue-900">Détail tâche — {params.id}</h2>
      <div className="mt-6 p-4 bg-white rounded shadow">Informations et actions pour la tâche {params.id}</div>
    </UiLayout>
  )
}
