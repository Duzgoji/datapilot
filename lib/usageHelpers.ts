import { supabase } from '@/lib/supabase/client'
import { PLAN_LIMITS } from './planLimits'

// Plan çözümleme
export const getCustomerPlan = async (ownerId: string): Promise<string> => {
  const { data } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('owner_id', ownerId)
    .single()
  return data?.plan || 'starter'
}

// Kullanıcı sayısı — sadece bu owner'a ait şubeler
export const getUserUsage = async (ownerId: string): Promise<number> => {
  const { data: branches } = await supabase
    .from('branches')
    .select('id')
    .eq('owner_id', ownerId)
  const branchIds = (branches || []).map(b => b.id)
  if (branchIds.length === 0) return 0
  const { count } = await supabase
    .from('team_members')
    .select('*', { count: 'exact', head: true })
    .in('branch_id', branchIds)
  return count || 0
}

// Şube sayısı — sadece bu owner'a ait
export const getBranchUsage = async (ownerId: string): Promise<number> => {
  const { count } = await supabase
    .from('branches')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', ownerId)
  return count || 0
}

// Bu ayki lead sayısı — sadece bu owner'a ait
export const getMonthlyLeadUsage = async (ownerId: string): Promise<number> => {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const { count } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', ownerId)
    .gte('created_at', startOfMonth)
  return count || 0
}

// ── Merkezi limit kontrolü ─────────────────────────────────────────────────

type LimitType = 'user' | 'branch' | 'lead'

interface CheckLimitParams {
  plan: string
  type: LimitType
  currentUsage: number
}

const LIMIT_LABELS: Record<LimitType, string> = {
  user: 'kullanıcı',
  branch: 'şube',
  lead: 'potansiyel müşteri',
}

export const checkLimitOrThrow = ({ plan, type, currentUsage }: CheckLimitParams): void => {
  const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.starter
  const label = LIMIT_LABELS[type]

  let max: number | null = null
  if (type === 'user') max = limits.maxUsers
  if (type === 'branch') max = limits.maxBranches
  if (type === 'lead') max = limits.maxMonthlyLeads

  // null = sınırsız (enterprise)
  if (max === null) return

  if (currentUsage >= max) {
    throw new Error(
      `${limits.label} planında en fazla ${max} ${label} ekleyebilirsiniz. ` +
      `Daha fazla kapasite için planınızı yükseltin.`
    )
  }
}

// Tüm limit kontrolü — fresh data ile (concurrency koruması)
export const checkLimit = async (
  ownerId: string,
  type: LimitType
): Promise<{ allowed: boolean; message: string }> => {
  try {
    const plan = await getCustomerPlan(ownerId)

    let currentUsage = 0
    if (type === 'user') currentUsage = await getUserUsage(ownerId)
    if (type === 'branch') currentUsage = await getBranchUsage(ownerId)
    if (type === 'lead') currentUsage = await getMonthlyLeadUsage(ownerId)

    checkLimitOrThrow({ plan, type, currentUsage })
    return { allowed: true, message: '' }
  } catch (err: any) {
    return { allowed: false, message: err.message }
  }
}