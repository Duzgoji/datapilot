import { supabaseAdmin } from '@/lib/supabase/admin'
import { resolveTenantContext } from '@/lib/tenant/resolveTenantId'
import { PLAN_LIMITS, isValidPlan, type PlanName } from './planLimits'

export class LeadLimitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LeadLimitError'
  }
}

export async function enforceLeadLimit(
  ownerId: string,
  addingCount = 1
): Promise<void> {
  const tenant = await resolveTenantContext(ownerId)
  const ownerIds = tenant.readOwnerIds

  const { data: subscriptions } = await supabaseAdmin
    .from('subscriptions')
    .select('owner_id, plan')
    .in('owner_id', ownerIds)

  const sub =
    subscriptions?.find((row) => row.owner_id === tenant.tenantId) ||
    subscriptions?.find((row) => row.owner_id === tenant.profileId) ||
    subscriptions?.[0] ||
    null

  const plan: PlanName = isValidPlan(sub?.plan) ? sub.plan : 'starter'
  if (!isValidPlan(sub?.plan)) {
    console.warn(`[enforceLeadLimit] Gecersiz plan "${sub?.plan}" owner: ${ownerId} -> starter`)
  }

  const limits = PLAN_LIMITS[plan]
  if (limits.maxMonthlyLeads === null) return

  const now = new Date()
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))

  const { count } = await supabaseAdmin
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .in('owner_id', ownerIds)
    .gte('created_at', startOfMonth.toISOString())

  const current = count || 0
  const afterAdd = current + addingCount

  if (afterAdd > limits.maxMonthlyLeads) {
    const remaining = Math.max(0, limits.maxMonthlyLeads - current)
    console.warn(
      `[enforceLeadLimit] Limit asildi: owner=${tenant.tenantId} current=${current} adding=${addingCount} limit=${limits.maxMonthlyLeads}`
    )
    throw new LeadLimitError(
      `${limits.label} planinda aylik en fazla ${limits.maxMonthlyLeads} lead eklenebilir. ` +
        `Mevcut: ${current}, kalan: ${remaining}${addingCount > 1 ? `, eklenen: ${addingCount}` : ''}.`
    )
  }
}
