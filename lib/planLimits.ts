export const PLAN_LIMITS: Record<string, {
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

export const getPlanLimits = (plan: string) => {
  return PLAN_LIMITS[plan] || PLAN_LIMITS['starter']
}