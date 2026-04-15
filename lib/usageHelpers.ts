import { supabase } from '@/lib/supabase/client'
import { fetchTenantContext } from '@/lib/tenant/client'
import { PLAN_LIMITS, PlanName, isValidPlan } from './planLimits'

export const getCurrentPlan = async (ownerId: string): Promise<PlanName> => {
  const tenant = await fetchTenantContext(ownerId)
  const { data, error } = await supabase
    .from('subscriptions')
    .select('owner_id, plan')
    .in('owner_id', tenant.readOwnerIds)

  if (error) {
    console.warn(`[getCurrentPlan] DB error for owner ${ownerId}:`, error.message)
    return 'starter'
  }

  const resolved =
    data?.find((row) => row.owner_id === tenant.tenantId) ||
    data?.find((row) => row.owner_id === tenant.profileId) ||
    data?.[0]

  if (!resolved) {
    console.warn(`[getCurrentPlan] No subscription found for owner ${ownerId} - defaulting to starter`)
    return 'starter'
  }

  if (!isValidPlan(resolved.plan)) {
    console.warn(`[getCurrentPlan] Invalid plan "${resolved.plan}" for owner ${ownerId} - defaulting to starter`)
    return 'starter'
  }

  return resolved.plan
}

export const resolvePlan = (raw: string | null | undefined): PlanName => {
  if (!isValidPlan(raw)) {
    if (raw) console.warn(`[resolvePlan] Invalid plan value: "${raw}" - defaulting to starter`)
    return 'starter'
  }
  return raw
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

const LIMIT_LABELS: Record<LimitType, string> = {
  user: 'kullanici',
  branch: 'sube',
  lead: 'potansiyel musteri',
}

export const checkLimit = async (
  ownerId: string,
  type: LimitType,
  addingCount = 1
): Promise<{ allowed: boolean; message: string }> => {
  try {
    const plan = await getCurrentPlan(ownerId)
    const limits = PLAN_LIMITS[plan]

    let currentUsage = 0
    if (type === 'user') currentUsage = await getUserUsage(ownerId)
    if (type === 'branch') currentUsage = await getBranchUsage(ownerId)
    if (type === 'lead') currentUsage = await getMonthlyLeadUsage(ownerId)

    let max: number | null = null
    if (type === 'user') max = limits.maxUsers
    if (type === 'branch') max = limits.maxBranches
    if (type === 'lead') max = limits.maxMonthlyLeads

    if (max === null) return { allowed: true, message: '' }

    const afterAdd = currentUsage + addingCount
    if (afterAdd > max) {
      const label = LIMIT_LABELS[type]
      const remaining = Math.max(0, max - currentUsage)
      return {
        allowed: false,
        message:
          `${limits.label} planinda en fazla ${max} ${label} ekleyebilirsiniz. ` +
          `Su an: ${currentUsage}, kalan: ${remaining}. ` +
          (addingCount > 1 ? `${addingCount} tane eklemeye calisiyorsunuz. ` : '') +
          `Daha fazla kapasite icin planinizi yukseltin.`,
      }
    }

    return { allowed: true, message: '' }
  } catch (err: unknown) {
    return { allowed: false, message: err instanceof Error ? err.message : 'Bilinmeyen hata' }
  }
}
