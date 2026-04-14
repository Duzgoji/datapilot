import { supabase } from '@/lib/supabase/client'
import { PLAN_LIMITS, PlanName, isValidPlan } from './planLimits'

// ─── TEK PLAN KAYNAĞI ─────────────────────────────────────────────────────────

/**
 * Her panelde plan buradan okunur.
 * Kayıt yoksa veya geçersizse 'starter' döner — ama her zaman loglar.
 * Sessiz fallback YOK.
 */
export const getCurrentPlan = async (ownerId: string): Promise<PlanName> => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('owner_id', ownerId)
    .maybeSingle()

  if (error) {
    console.warn(`[getCurrentPlan] DB error for owner ${ownerId}:`, error.message)
    return 'starter'
  }
  if (!data) {
    console.warn(`[getCurrentPlan] No subscription found for owner ${ownerId} — defaulting to starter`)
    return 'starter'
  }
  if (!isValidPlan(data.plan)) {
    console.warn(`[getCurrentPlan] Invalid plan "${data.plan}" for owner ${ownerId} — defaulting to starter`)
    return 'starter'
  }
  return data.plan
}

/**
 * State'te zaten yüklü plan varsa (UI render) bu ile doğrula.
 * Geçersizse logla, 'starter' dön.
 */
export const resolvePlan = (raw: string | null | undefined): PlanName => {
  if (!isValidPlan(raw)) {
    if (raw) console.warn(`[resolvePlan] Invalid plan value: "${raw}" — defaulting to starter`)
    return 'starter'
  }
  return raw
}

// ─── USAGE ────────────────────────────────────────────────────────────────────

export const getUserUsage = async (ownerId: string): Promise<number> => {
  const { data: branches } = await supabase
    .from('branches').select('id').eq('owner_id', ownerId)
  const branchIds = (branches || []).map(b => b.id)
  if (branchIds.length === 0) return 0
  const { count } = await supabase
    .from('team_members')
    .select('*', { count: 'exact', head: true })
    .in('branch_id', branchIds)
  return count || 0
}

export const getBranchUsage = async (ownerId: string): Promise<number> => {
  const { count } = await supabase
    .from('branches').select('*', { count: 'exact', head: true }).eq('owner_id', ownerId)
  return count || 0
}

export const getMonthlyLeadUsage = async (ownerId: string): Promise<number> => {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const { count } = await supabase
    .from('leads').select('*', { count: 'exact', head: true })
    .eq('owner_id', ownerId).gte('created_at', startOfMonth)
  return count || 0
}

// ─── LİMİT KONTROL ────────────────────────────────────────────────────────────

type LimitType = 'user' | 'branch' | 'lead'

const LIMIT_LABELS: Record<LimitType, string> = {
  user: 'kullanıcı',
  branch: 'şube',
  lead: 'potansiyel müşteri',
}

/**
 * addingCount: bulk işlem için kaç tane ekleniyor (default 1)
 */
export const checkLimit = async (
  ownerId: string,
  type: LimitType,
  addingCount = 1
): Promise<{ allowed: boolean; message: string }> => {
  try {
    const plan = await getCurrentPlan(ownerId)
    const limits = PLAN_LIMITS[plan]

    let currentUsage = 0
    if (type === 'user')   currentUsage = await getUserUsage(ownerId)
    if (type === 'branch') currentUsage = await getBranchUsage(ownerId)
    if (type === 'lead')   currentUsage = await getMonthlyLeadUsage(ownerId)

    let max: number | null = null
    if (type === 'user')   max = limits.maxUsers
    if (type === 'branch') max = limits.maxBranches
    if (type === 'lead')   max = limits.maxMonthlyLeads

    if (max === null) return { allowed: true, message: '' }

    const afterAdd = currentUsage + addingCount
    if (afterAdd > max) {
      const label = LIMIT_LABELS[type]
      const remaining = Math.max(0, max - currentUsage)
      return {
        allowed: false,
        message:
          `${limits.label} planında en fazla ${max} ${label} ekleyebilirsiniz. ` +
          `Şu an: ${currentUsage}, kalan: ${remaining}. ` +
          (addingCount > 1 ? `${addingCount} tane eklemeye çalışıyorsunuz. ` : '') +
          `Daha fazla kapasite için planınızı yükseltin.`
      }
    }
    return { allowed: true, message: '' }
  } catch (err: any) {
    return { allowed: false, message: err.message }
  }
}