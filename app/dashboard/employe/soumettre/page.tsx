import SubmitTaskForm from '../../../../components/dashboard/SubmitTaskForm'
import MainLayout from '@/components/layouts/MainLayout'

export const metadata = { title: 'Soumettre une tâche' }

export default function Page(){
  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold gold-gradient-text">Soumettre une tâche</h1>
          <p className="text-[var(--color-anthracite)]/70 mt-2">Soumettez une tâche terminée pour le suivi et facturation</p>
        </div>

        <div>
          <SubmitTaskForm />
        </div>
      </div>
    </MainLayout>
  )
}
