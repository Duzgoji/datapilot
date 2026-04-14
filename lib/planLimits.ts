export type PlanName = 'starter' | 'pro' | 'enterprise'

export const PLAN_LIMITS: Record<PlanName, {
  label: string
  price: number
  maxUsers: number | null
  maxBranches: number | null
  maxMonthlyLeads: number | null
}> = {
  starter: {
    label: 'Starter',
    price: 2000,
    maxUsers: 2,
    maxBranches: 1,
    maxMonthlyLeads: 400,
  },
  pro: {
    label: 'Pro',
    price: 5500,
    maxUsers: 10,
    maxBranches: 3,
    maxMonthlyLeads: 2000,
  },
  enterprise: {
    label: 'Enterprise',
    price: 15000,
    maxUsers: null,
    maxBranches: null,
    maxMonthlyLeads: null,
  },
}

export const VALID_PLANS = Object.keys(PLAN_LIMITS) as PlanName[]

export function getPlanLimits(plan: PlanName) {
  return PLAN_LIMITS[plan]
}

export function isValidPlan(plan: string | null | undefined): plan is PlanName {
  return !!plan && VALID_PLANS.includes(plan as PlanName)
}