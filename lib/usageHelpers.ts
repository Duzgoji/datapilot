
import { supabase } from '@/lib/supabase/client'
import { getPlanLimits } from './planLimits'

// Müşterinin mevcut planını çek
export const getCustomerPlan = async (ownerId: string): Promise<string> => {
  const { data } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('owner_id', ownerId)
    .single()
  return data?.plan || 'starter'
}

// Kullanıcı sayısı
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

// Şube sayısı
export const getBranchUsage = async (ownerId: string): Promise<number> => {
  const { count } = await supabase
    .from('branches')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', ownerId)
  return count || 0
}

// Bu ayki lead sayısı
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

// Limit kontrolü — true = izin ver, false = engelle
export const checkLimit = async (
  ownerId: string,
  type: 'user' | 'branch' | 'lead'
): Promise<{ allowed: boolean; message: string }> => {
  const plan = await getCustomerPlan(ownerId)
  const limits = getPlanLimits(plan)

  if (type === 'user') {
    if (limits.maxUsers === null) return { allowed: true, message: '' }
    const usage = await getUserUsage(ownerId)
    if (usage >= limits.maxUsers) {
      return {
        allowed: false,
        message: `${limits.label} plan kapsamında en fazla ${limits.maxUsers} kullanıcı ekleyebilirsiniz.`
      }
    }
  }

  if (type === 'branch') {
    if (limits.maxBranches === null) return { allowed: true, message: '' }
    const usage = await getBranchUsage(ownerId)
    if (usage >= limits.maxBranches) {
      return {
        allowed: false,
        message: `${limits.label} plan kapsamında en fazla ${limits.maxBranches} şube ekleyebilirsiniz.`
      }
    }
  }

  if (type === 'lead') {
    if (limits.maxMonthlyLeads === null) return { allowed: true, message: '' }
    const usage = await getMonthlyLeadUsage(ownerId)
    if (usage >= limits.maxMonthlyLeads) {
      return {
        allowed: false,
        message: `Bu ayki potansiyel müşteri limitinize ulaştınız (${limits.maxMonthlyLeads}). Plan yükselterek devam edebilirsiniz.`
      }
    }
  }

  return { allowed: true, message: '' }
}