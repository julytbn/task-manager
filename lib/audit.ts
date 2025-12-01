import { prisma } from '@/lib/prisma'

export type AuditActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'ADD_MEMBER' | 'REMOVE_MEMBER' | 'PROMOTE_LEAD'

export async function logAuditEquipe(
  action: AuditActionType,
  equipeId: string,
  changes?: Record<string, any>,
  userId?: string
) {
  try {
    const message = `[${action}] Équipe #${equipeId} ${JSON.stringify(changes || {})}`
    console.log(`[AUDIT] ${message}`)
    // Future: store in database audit table if created
  } catch (err) {
    console.error('Audit logging error', err)
  }
}
