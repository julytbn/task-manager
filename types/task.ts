export type Priority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  createdAt: Date
  dueDate?: Date
  priority: Priority
}

export type FilterType = 'all' | 'active' | 'completed'
