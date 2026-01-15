'use client'
import { Card } from '@/components/ui'
import { Clock, Users, Target, AlertCircle } from 'lucide-react'

interface TimesheetKPIsProps {
  totalHours: number
  activeEmployees: number
  projectHours: { [key: string]: number }
  unvalidatedHours: number
  estimatedCost: number
}

export default function TimesheetKPIs({
  totalHours,
  activeEmployees,
  projectHours,
  unvalidatedHours,
  estimatedCost
}: TimesheetKPIsProps) {
  const stats = [
    {
      label: 'Total heures travaillées',
      value: `${totalHours.toFixed(1)}h`,
      icon: Clock,
      color: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      label: 'Employés actifs',
      value: activeEmployees,
      icon: Users,
      color: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      label: 'Heures non validées',
      value: `${unvalidatedHours.toFixed(1)}h`,
      icon: AlertCircle,
      color: 'bg-yellow-50',
      textColor: 'text-yellow-600'
    },
    {
      label: 'Coût estimé du travail',
      value: `—`, // Pas calculé sans tarif horaire
      icon: Target,
      color: 'bg-purple-50',
      textColor: 'text-purple-600'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon
        return (
          <Card key={idx} className={`${stat.color} p-6 rounded-lg border border-gray-200`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
              </div>
              <Icon className={`${stat.textColor} opacity-20`} size={32} />
            </div>
          </Card>
        )
      })}
    </div>
  )
}
