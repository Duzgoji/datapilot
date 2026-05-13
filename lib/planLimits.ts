export type PlanName = 'custom'

export const PLAN_LIMITS: Record<PlanName, {
  label: string
  price: number
  maxUsers: number | null
  maxBranches: number | null
  maxMonthlyLeads: number | null
}> = {
  custom: {
    label: 'DataPilot',
    price: 0,
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
  return true // Herkese tam erişim
}