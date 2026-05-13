import { fetchTenantContext } from '@/lib/tenant/client'
import { supabase } from '@/lib/supabase/client'

export type PlanName = 'custom'

export const getCurrentPlan = async (ownerId: string): Promise<PlanName> => {
  return 'custom'
}

export const resolvePlan = (raw: string | null | undefined): PlanName => {
  return 'custom'
}

export const getUserUsage = async (ownerId: string): Promise<number> => {
  const tenant = await fetchTenantContext(ownerId)
  const { data: branches } = await supabase
    .from('branches')
    .select('id')
    .in('owner_id', tenant.readOwnerIds)

  const branchIds = (branches || []).map((branch) => branch.id)
  if (branchIds.length === 0) return 0

  const { count } = await supabase
    .from('team_members')
    .select('*', { count: 'exact', head: true })
    .in('branch_id', branchIds)

  return count || 0
}

export const getBranchUsage = async (ownerId: string): Promise<number> => {
  const tenant = await fetchTenantContext(ownerId)
  const { count } = await supabase
    .from('branches')
    .select('*', { count: 'exact', head: true })
    .in('owner_id', tenant.readOwnerIds)

  return count || 0
}

export const getMonthlyLeadUsage = async (ownerId: string): Promise<number> => {
  const tenant = await fetchTenantContext(ownerId)
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const { count } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .in('owner_id', tenant.readOwnerIds)
    .gte('created_at', startOfMonth)

  return count || 0
}

type LimitType = 'user' | 'branch' | 'lead'

export const checkLimit = async (
  ownerId: string,
  type: LimitType,
  addingCount = 1
): Promise<{ allowed: boolean; message: string }> => {
  return { allowed: true, message: '' }
}