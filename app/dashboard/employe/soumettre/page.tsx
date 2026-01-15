import SubmitTaskForm from '../../../../components/dashboard/SubmitTaskForm'

export const metadata = { 
  title: 'Soumettre une tâche | Tableau de bord Employé' 
}

export default function Page(){
  return (
    <div>
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Soumettre une tâche</h1>
              <p className="mt-1 text-sm text-gray-600">
                Soumettez une tâche terminée pour le suivi et la facturation
              </p>
            </div>
          </div>
          <div className="mt-2 border-b border-gray-200"></div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <SubmitTaskForm />
        </div>
    </div>
  )
}
