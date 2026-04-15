import { supabaseAdmin } from '@/lib/supabase/admin'
import { resolveTenantContext } from '@/lib/tenant/resolveTenantId'

type TeamMemberRow = {
  user_id: string
  owner_id: string
  is_active: boolean
}

type LeadRow = {
  assigned_to: string | null
  created_at: string
}

export async function findAssignableAgent(ownerId: string) {
  if (!ownerId) {
    throw new Error('findAssignableAgent fonksiyonuna ownerId gelmedi')
  }

  const tenant = await resolveTenantContext(ownerId)
  const ownerIds = tenant.readOwnerIds

  // 1) Bu owner'a ait aktif ekip üyelerini al
  const { data: teamMembers, error: teamError } = await supabaseAdmin
    .from('team_members')
    .select('user_id, owner_id, is_active')
    .eq('is_active', true)
    .in('owner_id', ownerIds)
    .order('created_at', { ascending: true })

  if (teamError) {
    throw new Error(`TEAM MEMBERS ERROR: ${teamError.message}`)
  }

  if (!teamMembers || teamMembers.length === 0) {
    return null
  }

  const agents = (teamMembers as TeamMemberRow[]).map((member) => member.user_id)

  // 2) Bu owner için en son atanmış lead'i bul
  const { data: lastAssignedLead, error: leadError } = await supabaseAdmin
    .from('leads')
    .select('assigned_to, created_at')
    .in('owner_id', ownerIds)
    .in('assigned_to', agents)
    .not('assigned_to', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (leadError) {
    throw new Error(`LEADS ERROR: ${leadError.message}`)
  }

  // 3) Daha önce atama yoksa ilk agent'i ver
  if (!lastAssignedLead) {
    return agents[0]
  }

  const lastAssignedTo = (lastAssignedLead as LeadRow).assigned_to

  // 4) Son atanan agent'in index'ini bul
  const currentIndex = agents.findIndex((agentId) => agentId === lastAssignedTo)

  // Son atanan bulunamazsa yine ilk agent
  if (currentIndex === -1) {
    return agents[0]
  }

  // 5) Sıradaki agent'e geç
  const nextIndex = (currentIndex + 1) % agents.length

  return agents[nextIndex]
}
