'use client'

import { useEffect, useState } from 'react'
import { logClientAuditEvent } from '@/lib/audit/client'
import { supabase } from '@/lib/supabase/client'
import { fetchTenantContext, getCanonicalCustomerId, logTenantWriteUsage, resolveOperationalOwnerId } from '@/lib/tenant/client'
import { useRouter } from 'next/navigation'
import MetaConnect from '@/components/MetaConnect'

const menuStructure = [
  { key: 'dashboard', label: 'Dashboard', icon: 'ğŸ“Š' },
  {
    key: 'meta', label: 'Meta Reklam', icon: 'ğŸ“£', children: [
      { key: 'meta-kampanyalar', label: 'Kampanyalar' },
      { key: 'meta-leadformlar', label: 'Potansiyel MÃ¼ÅŸteri FormlarÄ±' },
      { key: 'meta-leadler', label: 'Potansiyel MÃ¼ÅŸteri YÃ¶netimi' },
      { key: 'meta-analitik', label: 'Analitik & Raporlar' },
      { key: 'meta-ekip', label: 'Ekip & SatÄ±ÅŸÃ§Ä±lar' },
    ]
  },
  {
    key: 'veri', label: 'Veri Merkezi', icon: 'ğŸ“‚', children: [
      { key: 'veri-yukle', label: 'Veri YÃ¼kle' },
      { key: 'veri-setlerim', label: 'Veri Setlerim' },
      { key: 'veri-analiz', label: 'Analiz' },
      { key: 'veri-raporlar', label: 'Raporlar' },
    ]
  },
  { key: 'ayarlar', label: 'Ayarlar', icon: 'âš™ï¸' },
]

const STATUS_LABELS: any = {
  new: { label: 'Yeni', color: 'bg-blue-100 text-blue-700' },
  called: { label: 'ArÄ±ndÄ±', color: 'bg-yellow-100 text-yellow-700' },
  appointment_scheduled: { label: 'Randevu', color: 'bg-purple-100 text-purple-700' },
  procedure_done: { label: 'SatÄ±ÅŸ', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Ä°ptal', color: 'bg-red-100 text-red-700' },
}

const SOURCE_LABELS: any = {
  manual: { label: 'Manuel', color: 'bg-gray-100 text-gray-600' },
  meta_form: { label: 'Meta Form', color: 'bg-blue-100 text-blue-600' },
  instagram_dm: { label: 'Instagram DM', color: 'bg-pink-100 text-pink-600' },
  whatsapp: { label: 'WhatsApp', color: 'bg-green-100 text-green-600' },
  website: { label: 'Web Sitesi', color: 'bg-purple-100 text-purple-600' },
  referral: { label: 'Referans', color: 'bg-orange-100 text-orange-600' },
}

export default function CustomerPage() {
  const router = useRouter()
const [profile, setProfile] = useState<any>(null)
const [tenantId, setTenantId] = useState('')
const [branches, setBranches] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['meta'])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [saving, setSaving] = useState(false)

  const [showAddBranch, setShowAddBranch] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [branchName, setBranchName] = useState('')
  const [branchContact, setBranchContact] = useState('')
  const [branchEmail, setBranchEmail] = useState('')
  const [commissionModel, setCommissionModel] = useState('fixed_rate')
  const [commissionValue, setCommissionValue] = useState('')

  const [showAddMember, setShowAddMember] = useState(false)
  const [memberName, setMemberName] = useState('')
  const [memberEmail, setMemberEmail] = useState('')
  const [memberPassword, setMemberPassword] = useState('')
  const [memberCommission, setMemberCommission] = useState('')
  const [memberBranch, setMemberBranch] = useState('')

  const [showAddLead, setShowAddLead] = useState(false)
  const [leadName, setLeadName] = useState('')
  const [leadPhone, setLeadPhone] = useState('')
  const [leadEmail, setLeadEmail] = useState('')
  const [leadBranch, setLeadBranch] = useState('')
  const [leadSource, setLeadSource] = useState('manual')
  const [leadAssignTo, setLeadAssignTo] = useState('')
  const [leadNote, setLeadNote] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('meta') === 'connected') {
      setActiveTab('ayarlar')
    }
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (profileData?.role !== 'customer') { router.push('/login'); return }
    setProfile(profileData)
    const tenant = await fetchTenantContext(user.id)
    setTenantId(tenant.tenantId)

    const { data: branchesData } = await supabase
      .from('branches').select('*')
      .in('owner_id', tenant.readOwnerIds)
      .order('created_at', { ascending: false })
    setBranches(branchesData || [])

    if (branchesData && branchesData.length > 0) {
      const branchIds = branchesData.map((b: any) => b.id)

      const { data: leadsData } = await supabase
        .from('leads').select('*')
        .in('branch_id', branchIds)
        .order('created_at', { ascending: false })
      setLeads(leadsData || [])

      const { data: membersData } = await supabase
        .from('team_members').select('*, profiles(full_name, email), branches(branch_name)')
        .in('branch_id', branchIds)
      setTeamMembers(membersData || [])
    }

    setLoading(false)
  }

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const tenant = await fetchTenantContext(user.id)
    logTenantWriteUsage(tenant, 'customer_analytics', 'branch')

    const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase()
    const { data, error } = await supabase.from('branches').insert({
      owner_id: tenant.tenantId,
      branch_name: branchName,
      contact_name: branchContact,
      contact_email: branchEmail,
      commission_model: commissionModel,
      commission_value: parseFloat(commissionValue) || 0,
      invite_code: inviteCode,
      is_active: true,
    }).select().single()

    if (!error && data) {
      setInviteLink(`${window.location.origin}/join/${inviteCode}`)
      setBranchName(''); setBranchContact(''); setBranchEmail('')
      setCommissionModel('fixed_rate'); setCommissionValue('')
      loadData()
    }
    setSaving(false)
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const { data, error } = await supabase.auth.signUp({
      email: memberEmail, password: memberPassword,
      options: { data: { full_name: memberName, role: 'team' } }
    })

    if (error) { alert(error.message); setSaving(false); return }

    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id, email: memberEmail,
        full_name: memberName, role: 'team', is_active: true,
      })
      await supabase.from('team_members').insert({
        branch_id: memberBranch,
        user_id: data.user.id,
        role: 'agent',
        commission_rate: parseFloat(memberCommission) || 0,
      })
      setMemberName(''); setMemberEmail(''); setMemberPassword('')
      setMemberCommission(''); setMemberBranch('')
      setShowAddMember(false)
      loadData()
    }
    setSaving(false)
  }

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const tenant = await fetchTenantContext(user.id)
    const selectedBranchRecord = branches.find((branch: any) => branch.id === leadBranch)
    const leadOwnerId = resolveOperationalOwnerId(
      tenant,
      'customer_analytics',
      'lead',
      selectedBranchRecord?.owner_id
    )
    const canonicalCustomerId = getCanonicalCustomerId(tenant)

    const leadCode = 'DP-' + Date.now().toString().slice(-6)

    const { data: newLeadData, error } = await supabase.from('leads').insert({
      lead_code: leadCode,
      branch_id: leadBranch,
      owner_id: leadOwnerId,
      assigned_to: leadAssignTo || null,
      full_name: leadName,
      phone: leadPhone,
      email: leadEmail || null,
      source: leadSource,
      note: leadNote || null,
      status: 'new',
      customer_id: canonicalCustomerId,
    }).select().single()

    if (!error) {
      await logClientAuditEvent({
        action: 'lead_created',
        entityType: 'lead',
        entityId: newLeadData?.id || null,
        tenantId: canonicalCustomerId || leadOwnerId,
        metadata: {
          source: leadSource,
          owner_id: leadOwnerId,
          customer_id: canonicalCustomerId,
        },
      })
    }

    setLeadName(''); setLeadPhone(''); setLeadEmail('')
    setLeadBranch(''); setLeadSource('manual')
    setLeadAssignTo(''); setLeadNote('')
    setShowAddLead(false)
    loadData()
    setSaving(false)
  }

  const handleToggleBranch = async (branch: any) => {
    await supabase.from('branches').update({ is_active: !branch.is_active }).eq('id', branch.id)
    loadData()
  }

  const handleToggleMember = async (member: any) => {
    await supabase.from('team_members').update({ is_active: !member.is_active }).eq('id', member.id)
    loadData()
  }

  const handleAssignLead = async (leadId: string, userId: string) => {
    await supabase.from('leads').update({ assigned_to: userId }).eq('id', leadId)
    loadData()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const toggleMenu = (key: string) => {
    setExpandedMenus(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  const getPageTitle = () => {
    for (const item of menuStructure) {
      if (item.key === activeTab) return item.label
      if (item.children) {
        const child = item.children.find(c => c.key === activeTab)
        if (child) return `${item.label} â€º ${child.label}`
      }
    }
    return 'Dashboard'
  }

  const totalSales = leads.filter(l => l.status === 'procedure_done').length
  const totalRevenue = leads.filter(l => l.status === 'procedure_done').reduce((sum, l) => sum + (l.procedure_amount || 0), 0)
  const conversionRate = leads.length > 0 ? ((totalSales / leads.length) * 100).toFixed(1) : '0'

  if (loading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <img src="/logo.png" alt="DataPilot" className="h-7 w-auto" />
        <p className="text-gray-500 text-sm">YÃ¼kleniyor...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Menüyü kapat"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/50 md:hidden"
        />
      )}

      {/* SIDEBAR */}
      <div className={`${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 ${sidebarCollapsed ? 'md:w-16' : 'md:w-64'} w-64 min-h-screen bg-slate-900 flex flex-col fixed left-0 top-0 shadow-xl transition-all duration-300 z-40`}>
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          {!sidebarCollapsed ? (
            <>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">D</span>
                </div>
                <span className="text-white font-bold">DataPilot</span>
              </div>
              <button onClick={() => setSidebarCollapsed(true)} className="text-slate-500 hover:text-white text-xs">â—€</button>
            </>
          ) : (
            <button onClick={() => setSidebarCollapsed(false)} className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-sm">D</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/5 hover:text-white md:hidden"
            aria-label="Menüyü kapat"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        {!sidebarCollapsed && (
          <div className="px-4 py-3 border-b border-slate-700">
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Firma</p>
            <p className="text-white font-semibold text-sm truncate">{profile?.company_name || profile?.full_name}</p>
            <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full mt-1 inline-block">
              {profile?.sector || 'MÃ¼ÅŸteri'}
            </span>
          </div>
        )}

        <nav className="flex-1 p-2 overflow-y-auto space-y-0.5">
          {menuStructure.map(item => (
            <div key={item.key}>
              <button
                onClick={() => {
                  if (item.children) toggleMenu(item.key)
                  else {
                    setActiveTab(item.key)
                    setMobileMenuOpen(false)
                  }
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${activeTab === item.key ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                <span className="flex-shrink-0">{item.icon}</span>
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 text-sm">{item.label}</span>
                    {item.children && (
                      <span className="text-xs opacity-60">{expandedMenus.includes(item.key) ? 'â–¼' : 'â–¶'}</span>
                    )}
                  </>
                )}
              </button>
              {item.children && expandedMenus.includes(item.key) && !sidebarCollapsed && (
                <div className="ml-3 mt-0.5 border-l border-slate-700 pl-3 space-y-0.5">
                  {item.children.map(child => (
                    <button key={child.key} onClick={() => { setActiveTab(child.key); setMobileMenuOpen(false) }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${activeTab === child.key ? 'bg-blue-600 text-white font-medium' : 'text-slate-500 hover:bg-slate-800 hover:text-white'}`}>
                      {child.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {!sidebarCollapsed && (
          <div className="p-3 border-t border-slate-700">
            <div className="flex items-center gap-2.5 px-2 mb-2">
              <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">{profile?.full_name?.charAt(0)}</span>
              </div>
              <div className="overflow-hidden">
                <p className="text-white text-xs font-semibold truncate">{profile?.full_name}</p>
                <p className="text-slate-400 text-xs truncate">{profile?.email}</p>
              </div>
            </div>
            <button onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white">
              ğŸšª Ã‡Ä±kÄ±ÅŸ Yap
            </button>
          </div>
        )}
      </div>

      {/* MAIN */}
      <div className="ml-0 min-w-0 flex-1 overflow-x-hidden transition-all duration-300 md:ml-16">

        {/* TOP BAR */}
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 shadow-sm sm:px-6">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 md:hidden"
            aria-label="Menüyü aç"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2.5 4h11M2.5 8h11M2.5 12h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
          <div className="relative flex-1 max-w-sm">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">ğŸ”</span>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Potansiyel mÃ¼ÅŸteri, satÄ±ÅŸÃ§Ä± ara..."
              className="w-full pl-8 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => { setActiveTab('meta-leadler'); setShowAddLead(true) }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded-lg font-medium">
              + Potansiyel MÃ¼ÅŸteri Ekle
            </button>
            <button onClick={() => { setActiveTab('meta-ekip'); setShowAddMember(true) }}
              className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-2 rounded-lg font-medium">
              + SatÄ±ÅŸÃ§Ä± Ekle
            </button>
            <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg">ğŸ””</button>
            <span className="bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full">
              {profile?.company_name || 'MÃ¼ÅŸteri'}
            </span>
          </div>
        </div>

        <div className="p-6">
          <p className="text-xs text-gray-400 mb-5">DataPilot â€º <span className="text-gray-700 font-medium">{getPageTitle()}</span></p>

          {/* DASHBOARD */}
          {activeTab === 'dashboard' && (
            <>
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Toplam Potansiyel MÃ¼ÅŸteri', value: leads.length, icon: 'ğŸ“‹', color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Toplam SatÄ±ÅŸ', value: totalSales, icon: 'âœ…', color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'DÃ¶nÃ¼ÅŸÃ¼m OranÄ±', value: `%${conversionRate}`, icon: 'ğŸ“ˆ', color: 'text-purple-600', bg: 'bg-purple-50' },
                  { label: 'Toplam Ciro', value: `â‚º${totalRevenue.toLocaleString()}`, icon: 'ğŸ’°', color: 'text-amber-600', bg: 'bg-amber-50' },
                ].map(card => (
                  <div key={card.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center text-xl mb-3`}>{card.icon}</div>
                    <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{card.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 text-sm">Son Potansiyel MÃ¼ÅŸteriler</h3>
                    <button onClick={() => setActiveTab('meta-leadler')} className="text-xs text-blue-600 hover:underline">TÃ¼mÃ¼ â†’</button>
                  </div>
                  {leads.length === 0 && <p className="p-6 text-xs text-gray-400 text-center">HenÃ¼z potansiyel mÃ¼ÅŸteri yok.</p>}
                  {leads.slice(0, 6).map(lead => (
                    <div key={lead.id} className="px-4 py-3 flex items-center justify-between border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 text-sm">{lead.full_name || 'Ä°simsiz'}</p>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${SOURCE_LABELS[lead.source]?.color || 'bg-gray-100 text-gray-500'}`}>
                            {SOURCE_LABELS[lead.source]?.label || lead.source}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{lead.phone} â€¢ {new Date(lead.created_at).toLocaleDateString('tr-TR')}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_LABELS[lead.status]?.color}`}>
                        {STATUS_LABELS[lead.status]?.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <h3 className="font-bold text-gray-900 text-sm mb-3">Åubeler</h3>
                    {branches.length === 0 && <p className="text-xs text-gray-400">HenÃ¼z ÅŸube yok.</p>}
                    {branches.slice(0, 4).map(b => (
                      <div key={b.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <span className="text-xs font-medium text-gray-900">{b.branch_name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${b.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {b.is_active ? 'Aktif' : 'Pasif'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <h3 className="font-bold text-gray-900 text-sm mb-3">Ekip</h3>
                    {teamMembers.length === 0 && <p className="text-xs text-gray-400">HenÃ¼z satÄ±ÅŸÃ§Ä± yok.</p>}
                    {teamMembers.slice(0, 4).map(m => (
                      <div key={m.id} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0">
                        <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-purple-600 text-xs font-bold">{m.profiles?.full_name?.charAt(0)}</span>
                        </div>
                        <span className="text-xs font-medium text-gray-900 truncate">{m.profiles?.full_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* LEAD YÃ–NETÄ°MÄ° */}
          {activeTab === 'meta-leadler' && (
            <>
              <div className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
                {[
                  { label: 'Toplam', value: leads.length, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Randevu', value: leads.filter(l => l.status === 'appointment_scheduled').length, color: 'text-purple-600', bg: 'bg-purple-50' },
                  { label: 'SatÄ±ÅŸ', value: totalSales, color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'Ä°ptal', value: leads.filter(l => l.status === 'cancelled').length, color: 'text-red-600', bg: 'bg-red-50' },
                ].map(s => (
                  <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center border border-gray-100`}>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-gray-500">{leads.length} potansiyel mÃ¼ÅŸteri</p>
                <button onClick={() => setShowAddLead(!showAddLead)}
                  className="flex min-h-[40px] w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 sm:w-auto">
                  + Manuel Potansiyel MÃ¼ÅŸteri Ekle
                </button>
              </div>

              {showAddLead && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="font-bold text-gray-900">Yeni Potansiyel MÃ¼ÅŸteri Ekle</h3>
                    <button onClick={() => setShowAddLead(false)} className="flex h-10 w-10 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600">âœ•</button>
                  </div>
                  <form onSubmit={handleAddLead} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Ad Soyad *</label>
                      <input value={leadName} onChange={e => setLeadName(e.target.value)} required
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ad Soyad" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Telefon *</label>
                      <input value={leadPhone} onChange={e => setLeadPhone(e.target.value)} required
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="05xx xxx xx xx" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">E-posta</label>
                      <input type="email" value={leadEmail} onChange={e => setLeadEmail(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="ornek@email.com" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Åube *</label>
                      <select value={leadBranch} onChange={e => setLeadBranch(e.target.value)} required
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Åube seÃ§in...</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.branch_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Kaynak</label>
                      <select value={leadSource} onChange={e => setLeadSource(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="manual">Manuel GiriÅŸ</option>
                        <option value="meta_form">Meta Form</option>
                        <option value="instagram_dm">Instagram DM</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="website">Web Sitesi</option>
                        <option value="referral">Referans</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">SatÄ±ÅŸÃ§Ä±ya Ata</label>
                      <select value={leadAssignTo} onChange={e => setLeadAssignTo(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Atama yapma</option>
                        {teamMembers.filter(m => m.role === 'agent').map(m => (
                          <option key={m.user_id} value={m.user_id}>{m.profiles?.full_name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Not</label>
                      <textarea value={leadNote} onChange={e => setLeadNote(e.target.value)} rows={2}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ek not..." />
                    </div>
                    <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row">
                      <button type="submit" disabled={saving}
                        className="min-h-[40px] rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white">
                        {saving ? 'Ekleniyor...' : 'Potansiyel MÃ¼ÅŸteri Ekle'}
                      </button>
                      <button type="button" onClick={() => setShowAddLead(false)}
                        className="min-h-[40px] rounded-lg border border-gray-200 px-5 py-2.5 text-sm text-gray-600">Ä°ptal</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                {leads.length === 0 ? (
                  <div className="p-12 text-center">
                    <span className="text-4xl mb-3 block">ğŸ“­</span>
                    <p className="text-gray-500 text-sm">HenÃ¼z potansiyel mÃ¼ÅŸteri yok.</p>
                  </div>
                ) : leads.map(lead => (
                  <div key={lead.id} className="px-5 py-3.5 flex items-center justify-between border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 text-sm">{lead.full_name || 'Ä°simsiz'}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${SOURCE_LABELS[lead.source]?.color || 'bg-gray-100 text-gray-500'}`}>
                          {SOURCE_LABELS[lead.source]?.label || lead.source}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{lead.phone} {lead.email && `â€¢ ${lead.email}`}</p>
                      <p className="text-xs text-gray-400">{lead.lead_code} â€¢ {new Date(lead.created_at).toLocaleDateString('tr-TR')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!lead.assigned_to && (
                        <select onChange={e => { if (e.target.value) handleAssignLead(lead.id, e.target.value) }}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500">
                          <option value="">Ata...</option>
                          {teamMembers.filter(m => m.role === 'agent').map(m => (
                            <option key={m.user_id} value={m.user_id}>{m.profiles?.full_name}</option>
                          ))}
                        </select>
                      )}
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_LABELS[lead.status]?.color}`}>
                        {STATUS_LABELS[lead.status]?.label}
                      </span>
                      {lead.procedure_amount > 0 && (
                        <span className="text-xs font-bold text-green-600">â‚º{lead.procedure_amount.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* EKÄ°P & SATIÅÃ‡ILAR */}
          {activeTab === 'meta-ekip' && (
            <>
              <div className="mb-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-bold text-gray-900">Åubeler</h3>
                  <button onClick={() => { setShowAddBranch(!showAddBranch); setInviteLink('') }}
                    className="flex min-h-[40px] w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 sm:w-auto">
                    + Åube Ekle
                  </button>
                </div>

                {showAddBranch && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
                    {inviteLink ? (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <p className="text-green-700 font-medium text-sm mb-2">âœ… Åube eklendi!</p>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <input readOnly value={inviteLink} className="flex-1 bg-white border border-green-300 rounded-lg px-3 py-2 text-xs" />
                          <button onClick={() => { navigator.clipboard.writeText(inviteLink); alert('KopyalandÄ±!') }}
                            className="min-h-[40px] rounded-lg bg-green-600 px-3 py-2 text-xs text-white">Kopyala</button>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleAddBranch} className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Åube AdÄ± *</label>
                          <input value={branchName} onChange={e => setBranchName(e.target.value)} required
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Åube adÄ±" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Ä°letiÅŸim KiÅŸisi</label>
                          <input value={branchContact} onChange={e => setBranchContact(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ad Soyad" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">E-posta</label>
                          <input type="email" value={branchEmail} onChange={e => setBranchEmail(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="sube@email.com" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Komisyon Modeli</label>
                          <select value={commissionModel} onChange={e => setCommissionModel(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="fixed_rate">Sabit Oran (%)</option>
                            <option value="fixed_amount">Sabit Tutar (â‚º)</option>
                            <option value="tiered">Kademeli</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            {commissionModel === 'fixed_amount' ? 'Tutar (â‚º)' : 'Oran (%)'}
                          </label>
                          <input type="number" value={commissionValue} onChange={e => setCommissionValue(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={commissionModel === 'fixed_amount' ? '500' : '10'} />
                        </div>
                        <div className="col-span-2 flex gap-3">
                          <button type="submit" disabled={saving}
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium">
                            {saving ? 'Ekleniyor...' : 'Åube Ekle'}
                          </button>
                          <button type="button" onClick={() => setShowAddBranch(false)}
                            className="border border-gray-200 text-gray-600 px-5 py-2.5 rounded-lg text-sm">Ä°ptal</button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                  {branches.length === 0 ? (
                    <div className="p-10 text-center">
                      <span className="text-3xl mb-2 block">ğŸ¢</span>
                      <p className="text-gray-500 text-sm">HenÃ¼z ÅŸube yok.</p>
                    </div>
                  ) : branches.map(b => (
                    <div key={b.id} className="px-5 py-4 flex items-center justify-between border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{b.branch_name}</p>
                        <p className="text-xs text-gray-500">{b.contact_name} {b.contact_email && `â€¢ ${b.contact_email}`}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                            {b.commission_model === 'fixed_rate' ? `%${b.commission_value} komisyon` : `â‚º${b.commission_value} komisyon`}
                          </span>
                          <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                            {leads.filter(l => l.branch_id === b.id).length} lead
                          </span>
                        </div>
                      </div>
                      <button onClick={() => handleToggleBranch(b)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${b.is_active ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${b.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-bold text-gray-900">SatÄ±ÅŸÃ§Ä±lar</h3>
                  <button onClick={() => setShowAddMember(!showAddMember)}
                    className="flex min-h-[40px] w-full items-center justify-center rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 sm:w-auto">
                    + SatÄ±ÅŸÃ§Ä± Ekle
                  </button>
                </div>

                {showAddMember && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
                    <form onSubmit={handleAddMember} className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Ad Soyad *</label>
                        <input value={memberName} onChange={e => setMemberName(e.target.value)} required
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Ad Soyad" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Åube *</label>
                        <select value={memberBranch} onChange={e => setMemberBranch(e.target.value)} required
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="">Åube seÃ§in...</option>
                          {branches.map(b => (
                            <option key={b.id} value={b.id}>{b.branch_name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">E-posta *</label>
                        <input type="email" value={memberEmail} onChange={e => setMemberEmail(e.target.value)} required
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="satis@email.com" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Åifre *</label>
                        <input type="password" value={memberPassword} onChange={e => setMemberPassword(e.target.value)} required
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="En az 6 karakter" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Prim OranÄ± (%)</label>
                        <input type="number" value={memberCommission} onChange={e => setMemberCommission(e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="5" />
                      </div>
                      <div className="col-span-2 flex gap-3">
                        <button type="submit" disabled={saving}
                          className="bg-purple-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium">
                          {saving ? 'Ekleniyor...' : 'SatÄ±ÅŸÃ§Ä± Ekle'}
                        </button>
                        <button type="button" onClick={() => setShowAddMember(false)}
                          className="border border-gray-200 text-gray-600 px-5 py-2.5 rounded-lg text-sm">Ä°ptal</button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                  {teamMembers.length === 0 ? (
                    <div className="p-10 text-center">
                      <span className="text-3xl mb-2 block">ğŸ‘¥</span>
                      <p className="text-gray-500 text-sm">HenÃ¼z satÄ±ÅŸÃ§Ä± yok.</p>
                    </div>
                  ) : teamMembers.map(m => {
                    const memberLeads = leads.filter(l => l.assigned_to === m.user_id)
                    const memberSales = memberLeads.filter(l => l.status === 'procedure_done')
                    const memberRevenue = memberSales.reduce((sum, l) => sum + (l.procedure_amount || 0), 0)
                    const commission = memberRevenue * ((m.commission_rate || 0) / 100)
                    return (
                      <div key={m.id} className="px-5 py-4 flex items-center justify-between border-b border-gray-50 last:border-0 hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <span className="text-purple-600 font-bold text-sm">{m.profiles?.full_name?.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{m.profiles?.full_name}</p>
                            <p className="text-xs text-gray-500">{m.branches?.branch_name} â€¢ %{m.commission_rate} prim</p>
                            <div className="flex gap-2 mt-1">
                              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{memberLeads.length} potansiyel mÃ¼ÅŸteri</span>
                              <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">{memberSales.length} satÄ±ÅŸ</span>
                              <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">â‚º{commission.toLocaleString()} prim</span>
                            </div>
                          </div>
                        </div>
                        <button onClick={() => handleToggleMember(m)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${m.is_active ? 'bg-green-500' : 'bg-gray-300'}`}>
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${m.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {/* AYARLAR */}
          {activeTab === 'ayarlar' && (
            <MetaConnect ownerId={tenantId || profile?.id} />
          )}

          {/* ANALÄ°TÄ°K */}
          {activeTab === 'meta-analitik' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <span className="text-5xl mb-4 block">ğŸ“Š</span>
              <h3 className="font-bold text-gray-900 mb-2">Analitik & Raporlar</h3>
              <p className="text-gray-500 text-sm mb-6">TÃ¼m verilerinizi analiz edin, AI raporu oluÅŸturun</p>
              <button onClick={() => router.push('/customer/analytics')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium">
                ğŸ“Š Analitik SayfasÄ±na Git
              </button>
            </div>
          )}

          {/* VERÄ° YÃœKLE */}
          {activeTab === 'veri-yukle' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <span className="text-5xl mb-4 block">ğŸ“‚</span>
              <h3 className="font-bold text-gray-900 mb-2">Veri Merkezi</h3>
              <p className="text-gray-500 text-sm mb-6">Excel dosyanÄ±zÄ± yÃ¼kleyerek leadlerinizi sisteme aktarÄ±n</p>
              <button onClick={() => router.push('/customer/upload')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium">
                ğŸ“¥ Veri YÃ¼kleme SayfasÄ±na Git
              </button>
            </div>
          )}

          {/* PLACEHOLDER */}
          {!['dashboard', 'meta-leadler', 'meta-ekip', 'ayarlar', 'meta-analitik', 'veri-yukle'].includes(activeTab) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <span className="text-5xl mb-4 block">ğŸš§</span>
              <h3 className="font-bold text-gray-900 mb-2">{getPageTitle()}</h3>
              <p className="text-gray-500 text-sm">Bu modÃ¼l yakÄ±nda eklenecek.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}


