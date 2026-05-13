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
  return
}
