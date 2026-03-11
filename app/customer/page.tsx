'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import MetaConnect from '@/components/MetaConnect'

const menuStructure = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  {
    key: 'meta', label: 'Meta Reklam', icon: '📣', children: [
      { key: 'meta-kampanyalar', label: 'Kampanyalar' },
      { key: 'meta-leadformlar', label: 'Lead Formları' },
      { key: 'meta-baglanti', label: 'Meta Bağlantısı' },
    ]
  },
  {
    key: 'leadler', label: 'Leadlar', icon: '📋', children: [
      { key: 'leadler-liste', label: 'Lead Listesi' },
      { key: 'leadler-dagitim', label: 'Lead Dağıtımı' },
    ]
  },
  {
    key: 'ekip', label: 'Ekip', icon: '👥', children: [
      { key: 'ekip-sube', label: 'Şubeler' },
      { key: 'ekip-liste', label: 'Satışçılar' },
    ]
  },
  {
    key: 'performans', label: 'Performans', icon: '📈', children: [
      { key: 'performans-genel', label: 'Genel Performans' },
      { key: 'performans-karsilastirma', label: 'Karşılaştırma' },
    ]
  },
  {
    key: 'veri', label: 'Veri Merkezi', icon: '📂', children: [
      { key: 'veri-yukle', label: 'Veri Yükle' },
      { key: 'veri-setlerim', label: 'Veri Setlerim' },
    ]
  },
  { key: 'ayarlar', label: 'Ayarlar', icon: '⚙️' },
]

const STATUS_LABELS: any = {
  new: { label: 'Yeni', color: 'bg-blue-100 text-blue-700' },
  called: { label: 'Arandı', color: 'bg-yellow-100 text-yellow-700' },
  appointment_scheduled: { label: 'Randevu', color: 'bg-purple-100 text-purple-700' },
  procedure_done: { label: 'Satış', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'İptal', color: 'bg-red-100 text-red-700' },
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
  const [branches, setBranches] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['leadler', 'ekip'])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDate, setFilterDate] = useState('all')
  const [saving, setSaving] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  // Branch form
  const [showAddBranch, setShowAddBranch] = useState(false)
  const [branchInviteLink, setBranchInviteLink] = useState('')
  const [branchName, setBranchName] = useState('')
  const [branchContact, setBranchContact] = useState('')
  const [branchEmail, setBranchEmail] = useState('')
  const [commissionModel, setCommissionModel] = useState('fixed_rate')
  const [commissionValue, setCommissionValue] = useState('')

  // Member form
  const [showAddMember, setShowAddMember] = useState(false)
  const [memberName, setMemberName] = useState('')
  const [memberEmail, setMemberEmail] = useState('')
  const [memberPassword, setMemberPassword] = useState('')
  const [memberCommission, setMemberCommission] = useState('')
  const [memberBranch, setMemberBranch] = useState('')
  const [memberRole, setMemberRole] = useState('agent')

  // Lead form
  const [showAddLead, setShowAddLead] = useState(false)
  const [leadName, setLeadName] = useState('')
  const [leadPhone, setLeadPhone] = useState('')
  const [leadEmail, setLeadEmail] = useState('')
  const [leadBranch, setLeadBranch] = useState('')
  const [leadSource, setLeadSource] = useState('manual')
  const [leadAssignTo, setLeadAssignTo] = useState('')
  const [leadNote, setLeadNote] = useState('')

  // Member detail
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [memberTab, setMemberTab] = useState<'leads' | 'hakedis' | 'loglar'>('leads')

  // Lead status update
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [newStatus, setNewStatus] = useState('')
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailLead, setDetailLead] = useState<any>(null)
  const [leadHistory, setLeadHistory] = useState<any[]>([])
  const [statusNote, setStatusNote] = useState('')
  const [procedureType, setProcedureType] = useState('')
  const [procedureAmount, setProcedureAmount] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [appointmentDate, setAppointmentDate] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('meta') === 'connected') setActiveTab('meta-baglanti')
    loadData()

    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (profileData?.role !== 'customer') { router.push('/login'); return }
    setProfile(profileData)

    const { data: branchesData } = await supabase
      .from('branches').select('*').eq('owner_id', user.id).order('created_at', { ascending: false })
    setBranches(branchesData || [])

    if (branchesData && branchesData.length > 0) {
      const branchIds = branchesData.map((b: any) => b.id)
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads').select('*').in('branch_id', branchIds).order('created_at', { ascending: false })
      if (leadsError) console.error('Leads error:', leadsError)
      console.log('branchIds:', branchIds, 'leads:', leadsData?.length)
      setLeads(leadsData || [])

      const { data: membersData } = await supabase
        .from('team_members').select('*, profiles(full_name, email), branches(branch_name)').in('branch_id', branchIds)
      setTeamMembers(membersData || [])
    }

    setLoading(false)
  }

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase()
    const { data, error } = await supabase.from('branches').insert({
      owner_id: user.id, branch_name: branchName, contact_name: branchContact,
      contact_email: branchEmail, commission_model: commissionModel,
      commission_value: parseFloat(commissionValue) || 0, invite_code: inviteCode, is_active: true,
    }).select().single()
    if (!error && data) {
      setBranchInviteLink(`${window.location.origin}/join/${inviteCode}`)
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
        id: data.user.id, email: memberEmail, full_name: memberName, role: 'team', is_active: true,
      })
      await supabase.from('team_members').insert({
        branch_id: memberBranch, user_id: data.user.id,
        role: memberRole, commission_rate: parseFloat(memberCommission) || 0,
      })
      setMemberName(''); setMemberEmail(''); setMemberPassword('')
      setMemberCommission(''); setMemberBranch(''); setMemberRole('agent')
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
    const leadCode = 'DP-' + Date.now().toString().slice(-6)
    const { error } = await supabase.from('leads').insert({
      lead_code: leadCode, branch_id: leadBranch, owner_id: user.id,
      assigned_to: leadAssignTo || null, full_name: leadName, phone: leadPhone,
      email: leadEmail || null, source: leadSource, note: leadNote || null, status: 'new',
    })
    if (!error) {
      setLeadName(''); setLeadPhone(''); setLeadEmail('')
      setLeadBranch(''); setLeadSource('manual'); setLeadAssignTo(''); setLeadNote('')
      setShowAddLead(false)
      await loadData()
    }
    setSaving(false)
  }

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLead || !newStatus) return
    setSaving(true)
    const updates: any = { status: newStatus }
    if (newStatus === 'called') updates.called_at = new Date().toISOString()
    if (newStatus === 'appointment_scheduled') updates.appointment_date = appointmentDate
    if (newStatus === 'procedure_done') {
      updates.procedure_type = procedureType
      updates.procedure_amount = parseFloat(procedureAmount) || 0
      updates.procedure_date = new Date().toISOString()
    }
    if (newStatus === 'cancelled') updates.cancel_reason = cancelReason
    await supabase.from('leads').update(updates).eq('id', selectedLead.id)
    await supabase.from('lead_history').insert({
      lead_id: selectedLead.id, changed_by: profile.id,
      old_status: selectedLead.status, new_status: newStatus, note: statusNote,
    })
    setSelectedLead(null)
    setStatusNote(''); setProcedureType(''); setProcedureAmount(''); setCancelReason(''); setAppointmentDate('')
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

  const openDetailModal = async (lead: any) => {
    setDetailLead(lead)
    setShowDetailModal(true)
    const { data } = await supabase
      .from('lead_history')
      .select('*, profiles(full_name)')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: false })
    setLeadHistory(data || [])
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const toggleMenu = (key: string) => {
    setExpandedMenus(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
  }

  const getPageTitle = () => {
    for (const item of menuStructure) {
      if (item.key === activeTab) return item.label
      if (item.children) {
        const child = item.children.find(c => c.key === activeTab)
        if (child) return `${item.label} › ${child.label}`
      }
    }
    return 'Dashboard'
  }

  const totalSales = leads.filter(l => l.status === 'procedure_done').length
  const totalRevenue = leads.filter(l => l.status === 'procedure_done').reduce((sum, l) => sum + (l.procedure_amount || 0), 0)
  const conversionRate = leads.length > 0 ? ((totalSales / leads.length) * 100).toFixed(1) : '0'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekEnd = new Date(today)
  weekEnd.setDate(today.getDate() + 7)

  const filteredLeads = leads.filter(l => {
    const matchesSearch =
      l.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.phone?.includes(searchQuery) ||
      l.lead_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || l.status === filterStatus
    let matchesDate = true
    if (filterDate !== 'all' && l.appointment_at) {
      const d = new Date(l.appointment_at)
      d.setHours(0, 0, 0, 0)
      if (filterDate === 'today') matchesDate = d.getTime() === today.getTime()
      else if (filterDate === 'this_week') matchesDate = d >= today && d <= weekEnd
      else if (filterDate === 'overdue') matchesDate = d < today
    } else if (filterDate !== 'all') {
      matchesDate = false
    }
    return matchesSearch && matchesStatus && matchesDate
  })

  if (loading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
          <span className="text-white font-bold text-xl">D</span>
        </div>
        <p className="text-gray-500 text-sm">Yükleniyor...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100 flex">

      {/* SIDEBAR */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} min-h-screen bg-slate-900 flex flex-col fixed left-0 top-0 shadow-xl transition-all duration-300 z-20`}>
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          {!sidebarCollapsed ? (
            <>
              <div className="flex items-center gap-2.5">
                <img src="/logo2.png" alt="DataPilot" className="h-6 w-auto" />
                <span className="text-white font-bold">DataPilot</span>
              </div>
              <button onClick={() => setSidebarCollapsed(true)} className="text-slate-500 hover:text-white text-xs">◀</button>
            </>
          ) : (
            <button onClick={() => setSidebarCollapsed(false)} className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-sm">D</span>
            </button>
          )}
        </div>

        {!sidebarCollapsed && (
          <div className="px-4 py-3 border-b border-slate-700">
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Firma</p>
            <p className="text-white font-semibold text-sm truncate">{profile?.company_name || profile?.full_name}</p>
            <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full mt-1 inline-block">
              {profile?.sector || 'Müşteri'}
            </span>
          </div>
        )}

        <nav className="flex-1 p-2 overflow-y-auto space-y-0.5">
          {menuStructure.map(item => (
            <div key={item.key}>
              <button
                onClick={() => item.children ? toggleMenu(item.key) : setActiveTab(item.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${activeTab === item.key ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                <span className="flex-shrink-0">{item.icon}</span>
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 text-sm">{item.label}</span>
                    {item.children && (
                      <span className="text-xs opacity-60">{expandedMenus.includes(item.key) ? '▼' : '▶'}</span>
                    )}
                  </>
                )}
              </button>
              {item.children && expandedMenus.includes(item.key) && !sidebarCollapsed && (
                <div className="ml-3 mt-0.5 border-l border-slate-700 pl-3 space-y-0.5">
                  {item.children.map(child => (
                    <button key={child.key} onClick={() => setActiveTab(child.key)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${activeTab === child.key ? 'bg-blue-600 text-white font-medium' : 'text-slate-500 hover:bg-slate-800 hover:text-white'}`}>
                      {child.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* MAIN */}
      <div className={`${sidebarCollapsed ? 'ml-16' : 'ml-64'} flex-1 transition-all duration-300`}>

        {/* TOP BAR */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center sticky top-0 z-10 shadow-sm">
          <h1 className="font-semibold text-gray-800 text-sm">{getPageTitle()}</h1>
          <div className="flex items-center gap-2 ml-auto">

            {/* PROFİL DROPDOWN */}
            <div className="relative" ref={profileMenuRef}>
              <button onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl px-3 py-1.5 transition-colors">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">{profile?.full_name?.charAt(0)}</span>
                </div>
                <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">{profile?.full_name}</span>
                <span className="text-gray-400 text-xs">{showProfileMenu ? '▲' : '▼'}</span>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-semibold text-gray-900 text-sm">{profile?.full_name}</p>
                    <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full mt-1 inline-block">
                      {profile?.company_name || 'Müşteri'}
                    </span>
                  </div>
                  <button onClick={() => { setActiveTab('ayarlar'); setShowProfileMenu(false) }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    ⚙️ Hesap Ayarları
                  </button>
                  <button onClick={() => { setActiveTab('meta-baglanti'); setShowProfileMenu(false) }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    📣 Meta Bağlantısı
                  </button>
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                      🚪 Çıkış Yap
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          <p className="text-xs text-gray-400 mb-5">DataPilot › <span className="text-gray-700 font-medium">{getPageTitle()}</span></p>

          {/* DASHBOARD */}
          {activeTab === 'dashboard' && (
            <>
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Toplam Lead', value: leads.length, icon: '📋', color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Toplam Satış', value: totalSales, icon: '✅', color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'Dönüşüm Oranı', value: `%${conversionRate}`, icon: '📈', color: 'text-purple-600', bg: 'bg-purple-50' },
                  { label: 'Toplam Ciro', value: `₺${totalRevenue.toLocaleString()}`, icon: '💰', color: 'text-amber-600', bg: 'bg-amber-50' },
                ].map(card => (
                  <div key={card.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center text-xl mb-3`}>{card.icon}</div>
                    <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{card.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 text-sm">Son Leadlar</h3>
                    <button onClick={() => setActiveTab('leadler-liste')} className="text-xs text-blue-600 hover:underline">Tümü →</button>
                  </div>
                  {leads.length === 0 && <p className="p-6 text-xs text-gray-400 text-center">Henüz lead yok.</p>}
                  {leads.slice(0, 6).map(lead => (
                    <div key={lead.id} className="px-4 py-3 flex items-center justify-between border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 text-sm">{lead.full_name || 'İsimsiz'}</p>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${SOURCE_LABELS[lead.source]?.color || 'bg-gray-100 text-gray-500'}`}>
                            {SOURCE_LABELS[lead.source]?.label || lead.source}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{lead.phone} • {new Date(lead.created_at).toLocaleDateString('tr-TR')}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_LABELS[lead.status]?.color}`}>
                        {STATUS_LABELS[lead.status]?.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <h3 className="font-bold text-gray-900 text-sm mb-3">Ekip Özeti</h3>
                    {teamMembers.length === 0 && <p className="text-xs text-gray-400">Henüz satışçı yok.</p>}
                    {teamMembers.slice(0, 5).map(m => {
                      const mLeads = leads.filter(l => l.assigned_to === m.user_id)
                      const mSales = mLeads.filter(l => l.status === 'procedure_done').length
                      return (
                        <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-purple-600 text-xs font-bold">{m.profiles?.full_name?.charAt(0)}</span>
                            </div>
                            <span className="text-xs font-medium text-gray-900 truncate">{m.profiles?.full_name}</span>
                          </div>
                          <div className="flex gap-1">
                            <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{mLeads.length}L</span>
                            <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded">{mSales}S</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <h3 className="font-bold text-gray-900 text-sm mb-3">Şubeler</h3>
                    {branches.length === 0 && <p className="text-xs text-gray-400">Henüz şube yok.</p>}
                    {branches.slice(0, 4).map(b => (
                      <div key={b.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <span className="text-xs font-medium text-gray-900">{b.branch_name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${b.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {b.is_active ? 'Aktif' : 'Pasif'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* LEAD LİSTESİ */}
          {activeTab === 'leadler-liste' && (
            <>
              <div className="grid grid-cols-4 gap-4 mb-5">
                {[
                  { label: 'Toplam', value: leads.length, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Randevu', value: leads.filter(l => l.status === 'appointment_scheduled').length, color: 'text-purple-600', bg: 'bg-purple-50' },
                  { label: 'Satış', value: totalSales, color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'İptal', value: leads.filter(l => l.status === 'cancelled').length, color: 'text-red-600', bg: 'bg-red-50' },
                ].map(s => (
                  <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center border border-gray-100`}>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">{filteredLeads.length} / {leads.length} lead</p>
                <button onClick={() => setShowAddLead(!showAddLead)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                  + Manuel Lead Ekle
                </button>
              </div>

              {/* Arama */}
              <div className="relative mb-3">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="İsim, telefon, lead kodu ara..."
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">✕</button>
                )}
              </div>

              {/* Durum filtreleri */}
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Durum</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {[{ key: 'all', label: 'Tümü' }, ...Object.entries(STATUS_LABELS).map(([k, v]: any) => ({ key: k, label: v.label }))].map(f => (
                    <button key={f.key} onClick={() => setFilterStatus(f.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                        filterStatus === f.key ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                      }`}>
                      {f.label} ({f.key === 'all' ? leads.length : leads.filter(l => l.status === f.key).length})
                    </button>
                  ))}
                </div>
              </div>

              {/* Randevu tarihi filtreleri */}
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Randevu Tarihi</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {[
                    { key: 'all', label: 'Tümü' },
                    { key: 'today', label: '🔴 Bugün', count: leads.filter(l => { if (!l.appointment_at) return false; const d = new Date(l.appointment_at); d.setHours(0,0,0,0); return d.getTime() === today.getTime() }).length },
                    { key: 'this_week', label: '🟡 Bu Hafta', count: leads.filter(l => { if (!l.appointment_at) return false; const d = new Date(l.appointment_at); d.setHours(0,0,0,0); return d >= today && d <= weekEnd }).length },
                    { key: 'overdue', label: '⚠️ Geçmiş', count: leads.filter(l => { if (!l.appointment_at) return false; const d = new Date(l.appointment_at); d.setHours(0,0,0,0); return d < today }).length },
                  ].map(f => (
                    <button key={f.key} onClick={() => setFilterDate(f.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                        filterDate === f.key ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                      }`}>
                      {f.label}{f.count !== undefined ? ` (${f.count})` : ''}
                    </button>
                  ))}
                </div>
              </div>

              {showAddLead && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Yeni Lead Ekle</h3>
                    <button onClick={() => setShowAddLead(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                  </div>
                  <form onSubmit={handleAddLead} className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Ad Soyad *</label>
                      <input value={leadName} onChange={e => setLeadName(e.target.value)} required
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ad Soyad" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Telefon *</label>
                      <input value={leadPhone} onChange={e => setLeadPhone(e.target.value)} required
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="05xx xxx xx xx" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">E-posta</label>
                      <input type="email" value={leadEmail} onChange={e => setLeadEmail(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="ornek@email.com" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Şube *</label>
                      <select value={leadBranch} onChange={e => setLeadBranch(e.target.value)} required
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Şube seçin...</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Kaynak</label>
                      <select value={leadSource} onChange={e => setLeadSource(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="manual">Manuel Giriş</option>
                        <option value="meta_form">Meta Form</option>
                        <option value="instagram_dm">Instagram DM</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="website">Web Sitesi</option>
                        <option value="referral">Referans</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Satışçıya Ata</label>
                      <select value={leadAssignTo} onChange={e => setLeadAssignTo(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Atama yapma</option>
                        {teamMembers.filter(m => m.role === 'agent').map(m => (
                          <option key={m.user_id} value={m.user_id}>{m.profiles?.full_name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Not</label>
                      <textarea value={leadNote} onChange={e => setLeadNote(e.target.value)} rows={2}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ek not..." />
                    </div>
                    <div className="col-span-2 flex gap-3">
                      <button type="submit" disabled={saving} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium">
                        {saving ? 'Ekleniyor...' : 'Lead Ekle'}
                      </button>
                      <button type="button" onClick={() => setShowAddLead(false)} className="border border-gray-200 text-gray-600 px-5 py-2.5 rounded-lg text-sm">İptal</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                {filteredLeads.length === 0 ? (
                  <div className="p-12 text-center"><span className="text-4xl mb-3 block">📭</span><p className="text-gray-500 text-sm">Henüz lead yok.</p></div>
                ) : filteredLeads.map(lead => (
                  <div key={lead.id} onClick={() => openDetailModal(lead)} className="px-5 py-3.5 flex items-center justify-between border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 text-sm">{lead.full_name || 'İsimsiz'}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${SOURCE_LABELS[lead.source]?.color || 'bg-gray-100 text-gray-500'}`}>
                          {SOURCE_LABELS[lead.source]?.label || lead.source}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{lead.phone} {lead.email && `• ${lead.email}`}</p>
                      <p className="text-xs text-gray-400">{lead.lead_code} • {new Date(lead.created_at).toLocaleDateString('tr-TR')}</p>
                      {lead.appointment_at && (
                        <p className="text-xs text-purple-600 mt-0.5 font-medium">
                          📅 {new Date(lead.appointment_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_LABELS[lead.status]?.color}`}>
                        {STATUS_LABELS[lead.status]?.label}
                      </span>
                      {lead.procedure_amount > 0 && (
                        <span className="text-xs font-bold text-green-600">₺{lead.procedure_amount.toLocaleString()}</span>
                      )}
                      <button onClick={e => { e.stopPropagation(); setSelectedLead(lead); setNewStatus(lead.status) }}
                        className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700">
                        Güncelle
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* LEAD DAĞITIMI */}
          {activeTab === 'leadler-dagitim' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 text-sm">Lead Dağıtımı</h3>
                <p className="text-xs text-gray-500 mt-1">Atanmamış leadları satışçılara atayın</p>
              </div>
              {leads.filter(l => !l.assigned_to).length === 0 ? (
                <div className="p-12 text-center"><span className="text-4xl mb-3 block">✅</span><p className="text-gray-500 text-sm">Tüm leadlar atanmış.</p></div>
              ) : leads.filter(l => !l.assigned_to).map(lead => (
                <div key={lead.id} className="px-5 py-4 flex items-center justify-between border-b border-gray-50 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{lead.full_name || 'İsimsiz'}</p>
                    <p className="text-xs text-gray-500">{lead.phone} • {new Date(lead.created_at).toLocaleDateString('tr-TR')}</p>
                  </div>
                  <select onChange={e => { if (e.target.value) handleAssignLead(lead.id, e.target.value) }}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Satışçı seç...</option>
                    {teamMembers.filter(m => m.role === 'agent').map(m => (
                      <option key={m.user_id} value={m.user_id}>{m.profiles?.full_name}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* ŞUBELER */}
          {activeTab === 'ekip-sube' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">{branches.length} şube</p>
                <button onClick={() => { setShowAddBranch(!showAddBranch); setBranchInviteLink('') }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">+ Şube Ekle</button>
              </div>
              {showAddBranch && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
                  {branchInviteLink ? (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <p className="text-green-700 font-medium text-sm mb-2">✅ Şube eklendi!</p>
                      <div className="flex gap-2">
                        <input readOnly value={branchInviteLink} className="flex-1 bg-white border border-green-300 rounded-lg px-3 py-2 text-xs" />
                        <button onClick={() => { navigator.clipboard.writeText(branchInviteLink); alert('Kopyalandı!') }}
                          className="bg-green-600 text-white px-3 py-2 rounded-lg text-xs">Kopyala</button>
                      </div>
                      <button onClick={() => { setBranchInviteLink(''); setShowAddBranch(false) }} className="mt-3 text-xs text-green-600 hover:underline">Kapat</button>
                    </div>
                  ) : (
                    <form onSubmit={handleAddBranch} className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Şube Adı *</label>
                        <input value={branchName} onChange={e => setBranchName(e.target.value)} required
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Şube adı" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">İletişim Kişisi</label>
                        <input value={branchContact} onChange={e => setBranchContact(e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ad Soyad" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">E-posta</label>
                        <input type="email" value={branchEmail} onChange={e => setBranchEmail(e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="sube@email.com" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Komisyon Modeli</label>
                        <select value={commissionModel} onChange={e => setCommissionModel(e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="fixed_rate">Sabit Oran (%)</option>
                          <option value="fixed_amount">Sabit Tutar (₺)</option>
                          <option value="tiered">Kademeli</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{commissionModel === 'fixed_amount' ? 'Tutar (₺)' : 'Oran (%)'}</label>
                        <input type="number" value={commissionValue} onChange={e => setCommissionValue(e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={commissionModel === 'fixed_amount' ? '500' : '10'} />
                      </div>
                      <div className="col-span-2 flex gap-3">
                        <button type="submit" disabled={saving} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium">
                          {saving ? 'Ekleniyor...' : 'Şube Ekle'}
                        </button>
                        <button type="button" onClick={() => setShowAddBranch(false)} className="border border-gray-200 text-gray-600 px-5 py-2.5 rounded-lg text-sm">İptal</button>
                      </div>
                    </form>
                  )}
                </div>
              )}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                {branches.length === 0 ? (
                  <div className="p-10 text-center"><span className="text-3xl mb-2 block">🏢</span><p className="text-gray-500 text-sm">Henüz şube yok.</p></div>
                ) : branches.map(b => (
                  <div key={b.id} className="px-5 py-4 flex items-center justify-between border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{b.branch_name}</p>
                      <p className="text-xs text-gray-500">{b.contact_name} {b.contact_email && `• ${b.contact_email}`}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                          {b.commission_model === 'fixed_rate' ? `%${b.commission_value} komisyon` : `₺${b.commission_value} komisyon`}
                        </span>
                        <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">{leads.filter(l => l.branch_id === b.id).length} lead</span>
                        <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">{teamMembers.filter(m => m.branch_id === b.id).length} satışçı</span>
                      </div>
                    </div>
                    <button onClick={() => handleToggleBranch(b)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${b.is_active ? 'bg-green-500' : 'bg-gray-300'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${b.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* SATIŞÇILAR */}
          {activeTab === 'ekip-liste' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">{teamMembers.length} ekip üyesi</p>
                <button onClick={() => setShowAddMember(!showAddMember)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                  + Satışçı / Yönetici Ekle
                </button>
              </div>
              {showAddMember && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Ekip Üyesi Ekle</h3>
                    <button onClick={() => setShowAddMember(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                  </div>
                  <form onSubmit={handleAddMember} className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-2">Rol *</label>
                      <div className="flex gap-3">
                        <button type="button" onClick={() => setMemberRole('agent')}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${memberRole === 'agent' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-500'}`}>
                          👤 Satışçı
                        </button>
                        <button type="button" onClick={() => setMemberRole('manager')}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${memberRole === 'manager' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500'}`}>
                          👔 Yönetici
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Ad Soyad *</label>
                      <input value={memberName} onChange={e => setMemberName(e.target.value)} required
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ad Soyad" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Şube *</label>
                      <select value={memberBranch} onChange={e => setMemberBranch(e.target.value)} required
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Şube seçin...</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">E-posta *</label>
                      <input type="email" value={memberEmail} onChange={e => setMemberEmail(e.target.value)} required
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="satis@email.com" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Şifre *</label>
                      <input type="password" value={memberPassword} onChange={e => setMemberPassword(e.target.value)} required
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="En az 6 karakter" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Prim Oranı (%)</label>
                      <input type="number" value={memberCommission} onChange={e => setMemberCommission(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="5" />
                    </div>
                    <div className="col-span-2 flex gap-3">
                      <button type="submit" disabled={saving} className="bg-purple-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium">
                        {saving ? 'Ekleniyor...' : 'Ekle'}
                      </button>
                      <button type="button" onClick={() => setShowAddMember(false)} className="border border-gray-200 text-gray-600 px-5 py-2.5 rounded-lg text-sm">İptal</button>
                    </div>
                  </form>
                </div>
              )}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                {teamMembers.length === 0 ? (
                  <div className="p-10 text-center"><span className="text-3xl mb-2 block">👥</span><p className="text-gray-500 text-sm">Henüz ekip üyesi yok.</p></div>
                ) : teamMembers.map(m => {
                  const mLeads = leads.filter(l => l.assigned_to === m.user_id)
                  const mSales = mLeads.filter(l => l.status === 'procedure_done')
                  const mRevenue = mSales.reduce((sum, l) => sum + (l.procedure_amount || 0), 0)
                  const commission = mRevenue * ((m.commission_rate || 0) / 100)
                  return (
                    <div key={m.id} className="px-5 py-4 flex items-center justify-between border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer"
                      onClick={() => { setMemberTab('leads'); setSelectedMember({ ...m, mLeads, mSales, mRevenue, commission }) }}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-purple-600 font-bold text-sm">{m.profiles?.full_name?.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{m.profiles?.full_name}</p>
                          <p className="text-xs text-gray-500">{m.branches?.branch_name} • %{m.commission_rate} prim</p>
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{mLeads.length} lead</span>
                            <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">{mSales.length} satış</span>
                            <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">₺{commission.toLocaleString()} prim</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <span className={`text-xs px-2 py-1 rounded-full ${m.role === 'manager' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                          {m.role === 'manager' ? 'Yönetici' : 'Satışçı'}
                        </span>
                        <button onClick={() => handleToggleMember(m)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${m.is_active !== false ? 'bg-green-500' : 'bg-gray-300'}`}>
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${m.is_active !== false ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* HAKEDİŞ - removed, now in member detail modal */}

          {/* META BAĞLANTISI */}
          {activeTab === 'meta-baglanti' && <MetaConnect ownerId={profile?.id} />}

          {/* AYARLAR */}
          {activeTab === 'ayarlar' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <span className="text-5xl mb-4 block">⚙️</span>
              <h3 className="font-bold text-gray-900 mb-2">Hesap Ayarları</h3>
              <p className="text-gray-500 text-sm">Profil bilgileri, firma logosu ve şifre değiştirme yakında eklenecek.</p>
            </div>
          )}

          {/* VERİ YÜKLE */}
          {activeTab === 'veri-yukle' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <span className="text-5xl mb-4 block">📂</span>
              <h3 className="font-bold text-gray-900 mb-2">Veri Merkezi</h3>
              <p className="text-gray-500 text-sm mb-6">Excel dosyanızı yükleyerek leadlerinizi sisteme aktarın</p>
              <button onClick={() => router.push('/customer/upload')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium">
                📥 Veri Yükleme Sayfasına Git
              </button>
            </div>
          )}

          {/* SATIŞÇI LOGLARI - removed, now in member detail modal */}

          {/* PLACEHOLDER */}
          {!['dashboard', 'leadler-liste', 'leadler-dagitim', 'ekip-sube', 'ekip-liste', 'meta-baglanti', 'ayarlar', 'veri-yukle'].includes(activeTab) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <span className="text-5xl mb-4 block">🚧</span>
              <h3 className="font-bold text-gray-900 mb-2">{getPageTitle()}</h3>
              <p className="text-gray-500 text-sm">Bu modül yakında eklenecek.</p>
            </div>
          )}
        </div>
      </div>

      {/* SATIŞÇI DETAY MODAL */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <span className="text-purple-600 font-bold text-lg">{selectedMember.profiles?.full_name?.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{selectedMember.profiles?.full_name}</h3>
                  <p className="text-xs text-gray-500">{selectedMember.profiles?.email} • {selectedMember.branches?.branch_name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${selectedMember.role === 'manager' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'}`}>
                    {selectedMember.role === 'manager' ? 'Yönetici' : 'Satışçı'}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedMember(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            {/* Stats */}
            <div className="p-5 border-b border-gray-100 flex-shrink-0">
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Toplam Lead', value: selectedMember.mLeads.length, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Satış', value: selectedMember.mSales.length, color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'Dönüşüm', value: selectedMember.mLeads.length > 0 ? `%${((selectedMember.mSales.length / selectedMember.mLeads.length) * 100).toFixed(0)}` : '%0', color: 'text-purple-600', bg: 'bg-purple-50' },
                  { label: 'Prim', value: `₺${selectedMember.commission.toLocaleString()}`, color: 'text-amber-600', bg: 'bg-amber-50' },
                ].map(s => (
                  <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-3">
                <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-gray-800">₺{selectedMember.mRevenue.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Toplam Ciro</p>
                </div>
                <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-gray-800">%{selectedMember.commission_rate}</p>
                  <p className="text-xs text-gray-500">Prim Oranı</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex border-b border-gray-100 px-5 flex-shrink-0">
                {[
                  { key: 'leads', label: 'Lead Geçmişi' },
                  { key: 'hakedis', label: 'Hakediş' },
                  { key: 'loglar', label: 'Aktivite Logları' },
                ].map(t => (
                  <button key={t.key} onClick={() => setMemberTab(t.key as any)}
                    className={`px-4 py-3 text-xs font-medium border-b-2 transition-colors ${memberTab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto">
                {memberTab === 'leads' && (
                  <>
                    {selectedMember.mLeads.length === 0 ? (
                      <div className="p-10 text-center"><span className="text-3xl mb-2 block">📭</span><p className="text-gray-400 text-sm">Henüz atanmış lead yok.</p></div>
                    ) : selectedMember.mLeads.map((lead: any) => (
                      <div key={lead.id} className="px-5 py-3 flex items-center justify-between border-b border-gray-50 last:border-0 hover:bg-gray-50">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{lead.full_name || 'İsimsiz'}</p>
                          <p className="text-xs text-gray-500">{lead.phone} • {new Date(lead.created_at).toLocaleDateString('tr-TR')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {lead.procedure_amount > 0 && (
                            <span className="text-xs font-bold text-green-600">₺{lead.procedure_amount.toLocaleString()}</span>
                          )}
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_LABELS[lead.status]?.color}`}>
                            {STATUS_LABELS[lead.status]?.label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                {memberTab === 'hakedis' && (
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Satış Adedi', value: selectedMember.mSales.length, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Toplam Ciro', value: `₺${selectedMember.mRevenue.toLocaleString()}`, color: 'text-green-600', bg: 'bg-green-50' },
                        { label: 'Kazanılan Prim', value: `₺${selectedMember.commission.toLocaleString()}`, color: 'text-amber-600', bg: 'bg-amber-50' },
                      ].map(item => (
                        <div key={item.label} className={`${item.bg} rounded-xl p-4 text-center`}>
                          <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                          <p className="text-xs text-gray-500 mt-1">{item.label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h5 className="font-semibold text-gray-800 text-sm mb-3">Satılan İşlemler</h5>
                      {selectedMember.mSales.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4">Henüz satış yok.</p>
                      ) : selectedMember.mSales.map((lead: any) => (
                        <div key={lead.id} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{lead.full_name}</p>
                            <p className="text-xs text-gray-500">{lead.procedure_type || '-'} • {lead.procedure_date ? new Date(lead.procedure_date).toLocaleDateString('tr-TR') : '-'}</p>
                          </div>
                          <span className="text-sm font-bold text-green-600">₺{(lead.procedure_amount || 0).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {memberTab === 'loglar' && (
                  <div className="p-10 text-center">
                    <span className="text-4xl mb-3 block">📊</span>
                    <p className="font-semibold text-gray-700 mb-1">Aktivite Logları</p>
                    <p className="text-gray-400 text-sm">Giriş/çıkış saatleri ve aktiviteler yakında eklenecek.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* DURUM GÜNCELLEME MODAL */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900">Durum Güncelle</h3>
                <p className="text-gray-500 text-sm">{selectedLead.full_name}</p>
              </div>
              <button onClick={() => setSelectedLead(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Yeni Durum</label>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)} required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Seçin...</option>
                  <option value="called">Arandı</option>
                  <option value="appointment_scheduled">Randevu Alındı</option>
                  <option value="procedure_done">Satış Yapıldı</option>
                  <option value="cancelled">İptal</option>
                </select>
              </div>
              {newStatus === 'appointment_scheduled' && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Randevu Tarihi</label>
                  <input type="datetime-local" value={appointmentDate} onChange={e => setAppointmentDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              )}
              {newStatus === 'procedure_done' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">İşlem / Ürün</label>
                    <input value={procedureType} onChange={e => setProcedureType(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ürün veya hizmet adı" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tutar (₺)</label>
                    <input type="number" value={procedureAmount} onChange={e => setProcedureAmount(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
                  </div>
                </>
              )}
              {newStatus === 'cancelled' && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">İptal Nedeni</label>
                  <input value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="İptal nedeni..." />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Not</label>
                <textarea value={statusNote} onChange={e => setStatusNote(e.target.value)} rows={2}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ek not..." />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setSelectedLead(null)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm">İptal</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium">
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LEAD DETAY MODAL */}
      {showDetailModal && detailLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowDetailModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-start justify-between sticky top-0 bg-white rounded-t-2xl">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{detailLead.full_name || 'İsimsiz'}</h3>
                <p className="text-sm text-gray-500">{detailLead.lead_code}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_LABELS[detailLead.status]?.color}`}>
                  {STATUS_LABELS[detailLead.status]?.label}
                </span>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">✕</button>
              </div>
            </div>

            <div className="p-5 space-y-4">

              {/* İletişim Bilgileri */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">İletişim Bilgileri</p>
                <div className="flex items-center gap-3">
                  <span className="text-base">📞</span>
                  <div>
                    <p className="text-xs text-gray-400">Telefon</p>
                    <p className="text-sm font-medium text-gray-900">{detailLead.phone}</p>
                  </div>
                </div>
                {detailLead.email && (
                  <div className="flex items-center gap-3">
                    <span className="text-base">✉️</span>
                    <div>
                      <p className="text-xs text-gray-400">E-posta</p>
                      <p className="text-sm font-medium text-gray-900">{detailLead.email}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Lead Bilgileri */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Kaynak</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SOURCE_LABELS[detailLead.source]?.color || 'bg-gray-100 text-gray-600'}`}>
                    {SOURCE_LABELS[detailLead.source]?.label || detailLead.source}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Eklenme Tarihi</p>
                  <p className="text-xs font-medium text-gray-900">{new Date(detailLead.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                {detailLead.procedure_amount > 0 && (
                  <div className="bg-green-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">İşlem Tutarı</p>
                    <p className="text-sm font-bold text-green-600">₺{detailLead.procedure_amount.toLocaleString()}</p>
                  </div>
                )}
                {detailLead.appointment_at && (
                  <div className="bg-purple-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">Randevu</p>
                    <p className="text-xs font-medium text-purple-700">
                      📅 {new Date(detailLead.appointment_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                )}
              </div>

              {/* Not */}
              {detailLead.note && (
                <div className="bg-yellow-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Not</p>
                  <p className="text-sm text-gray-700">{detailLead.note}</p>
                </div>
              )}

              {/* Geçmiş */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">İşlem Geçmişi</p>
                {leadHistory.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">Henüz işlem yapılmamış.</p>
                ) : (
                  <div className="space-y-2">
                    {leadHistory.map((h, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                        <div className="flex-1 bg-gray-50 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-xs px-1.5 py-0.5 rounded-full ${STATUS_LABELS[h.old_status]?.color}`}>{STATUS_LABELS[h.old_status]?.label}</span>
                              <span className="text-xs text-gray-400">→</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full ${STATUS_LABELS[h.new_status]?.color}`}>{STATUS_LABELS[h.new_status]?.label}</span>
                            </div>
                            <p className="text-xs text-gray-400">{new Date(h.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                          {h.note && <p className="text-xs text-gray-600 mt-1">💬 {h.note}</p>}
                          {h.profiles?.full_name && <p className="text-xs text-gray-400 mt-1">👤 {h.profiles.full_name}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Güncelle butonu */}
              <button
                onClick={() => { setShowDetailModal(false); setSelectedLead(detailLead); setNewStatus(detailLead.status) }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-medium">
                Durumu Güncelle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}