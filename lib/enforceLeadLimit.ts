import { supabaseAdmin } from '@/lib/supabase/admin'
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
  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('plan')
    .eq('owner_id', ownerId)
    .maybeSingle()

  const plan: PlanName = isValidPlan(sub?.plan) ? sub!.plan : 'starter'
  if (!isValidPlan(sub?.plan)) {
    console.warn(`[enforceLeadLimit] Geçersiz plan "${sub?.plan}" owner: ${ownerId} → starter`)
  }

  const limits = PLAN_LIMITS[plan]
  if (limits.maxMonthlyLeads === null) return // enterprise = sınırsız

  // UTC kullan — Vercel sunucuları UTC çalışır
  const now = new Date()
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))

  // Tüm statuslar dahil — iptal/ekle döngüsüyle bypass önlenir
  const { count } = await supabaseAdmin
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', ownerId)
    .gte('created_at', startOfMonth.toISOString())

  const current = count || 0
  const afterAdd = current + addingCount

  if (afterAdd > limits.maxMonthlyLeads) {
    const remaining = Math.max(0, limits.maxMonthlyLeads - current)
    console.warn(`[enforceLeadLimit] Limit aşıldı: owner=${ownerId} current=${current} adding=${addingCount} limit=${limits.maxMonthlyLeads}`)
    throw new LeadLimitError(
      `${limits.label} planında aylık en fazla ${limits.maxMonthlyLeads} lead eklenebilir. ` +
      `Mevcut: ${current}, kalan: ${remaining}${addingCount > 1 ? `, eklenen: ${addingCount}` : ''}.`
    )
  }
}