'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import MetaConnect from '@/components/MetaConnect'

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const menuStructure = [
  { key: 'dashboard', label: 'Dashboard', icon: '⬡' },
  {
    key: 'meta', label: 'Meta Reklam', icon: '◈', children: [
      { key: 'meta-kampanyalar', label: 'Kampanyalar' },
      { key: 'meta-leadformlar', label: 'Lead Formları' },
      { key: 'meta-baglanti', label: 'Bağlantı' },
    ]
  },
  {
    key: 'leadler', label: 'Leadler', icon: '◎', children: [
      { key: 'leadler-liste', label: 'Lead Listesi' },
      { key: 'leadler-dagitim', label: 'Dağıtım' },
    ]
  },
  {
    key: 'ekip', label: 'Ekip', icon: '◉', children: [
      { key: 'ekip-sube', label: 'Şubeler' },
      { key: 'ekip-liste', label: 'Satışçılar' },
    ]
  },
  {
    key: 'performans', label: 'Performans', icon: '◐', children: [
      { key: 'performans-genel', label: 'Genel' },
      { key: 'performans-karsilastirma', label: 'Karşılaştırma' },
      { key: 'performans-kar', label: 'Kâr Analizi' },
    ]
  },
  {
    key: 'veri', label: 'Veri Merkezi', icon: '◫', children: [
      { key: 'veri-yukle', label: 'Veri Yükle' },
      { key: 'veri-setlerim', label: 'Veri Setlerim' },
    ]
  },
  { key: 'ayarlar', label: 'Ayarlar', icon: '◌' },
]

const STATUS_CONFIG: any = {
  new:                   { label: 'Yeni',     dot: 'bg-blue-500',   badge: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' },
  called:                { label: 'Arandı',   dot: 'bg-amber-500',  badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  appointment_scheduled: { label: 'Randevu',  dot: 'bg-violet-500', badge: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200' },
  procedure_done:        { label: 'Satış',    dot: 'bg-emerald-500',badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  cancelled:             { label: 'İptal',    dot: 'bg-red-400',    badge: 'bg-red-50 text-red-600 ring-1 ring-red-200' },
}

const SOURCE_CONFIG: any = {
  manual:       { label: 'Manuel',       badge: 'bg-slate-100 text-slate-600' },
  meta_form:    { label: 'Meta Form',    badge: 'bg-blue-100 text-blue-700' },
  instagram_dm: { label: 'Instagram',    badge: 'bg-pink-100 text-pink-700' },
  whatsapp:     { label: 'WhatsApp',     badge: 'bg-green-100 text-green-700' },
  website:      { label: 'Web',          badge: 'bg-purple-100 text-purple-700' },
  referral:     { label: 'Referans',     badge: 'bg-orange-100 text-orange-700' },
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────

const Badge = ({ status }: { status: string }) => (
  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_CONFIG[status]?.badge || 'bg-gray-100 text-gray-600'}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[status]?.dot || 'bg-gray-400'}`} />
    {STATUS_CONFIG[status]?.label || status}
  </span>
)

const SourceBadge = ({ source }: { source: string }) => (
  <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${SOURCE_CONFIG[source]?.badge || 'bg-gray-100 text-gray-500'}`}>
    {SOURCE_CONFIG[source]?.label || source}
  </span>
)

const Modal = ({ open, onClose, title, subtitle, children, size = 'md' }: any) => {
  if (!open) return null
  const sizes: any = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} z-10 max-h-[90vh] flex flex-col`}>
        <div className="flex items-start justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors ml-4 flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  )
}

const Input = ({ label, ...props }: any) => (
  <div>
    {label && <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>}
    <input {...props} className={`w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${props.className || ''}`} />
  </div>
)

const Select = ({ label, children, ...props }: any) => (
  <div>
    {label && <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>}
    <div className="relative">
      <select {...props} className={`w-full appearance-none px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all pr-9 ${props.className || ''}`}>
        {children}
      </select>
      <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </div>
  </div>
)

const Btn = ({ variant = 'primary', size = 'md', children, className = '', ...props }: any) => {
  const variants: any = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200',
    secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200',
    danger: 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200',
    ghost: 'hover:bg-gray-100 text-gray-600',
  }
  const sizes: any = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3 text-sm',
  }
  return (
    <button {...props} className={`inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </button>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function CustomerPage() {
  const router = useRouter()
  const profileMenuRef = useRef<HTMLDivElement>(null)

  // Core state
  const [profile, setProfile] = useState<any>(null)
  const [branches, setBranches] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['leadler', 'ekip'])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDate, setFilterDate] = useState('all')

  // Branch
  const [showAddBranch, setShowAddBranch] = useState(false)
  const [branchInviteLink, setBranchInviteLink] = useState('')
  const [branchName, setBranchName] = useState('')
  const [branchContact, setBranchContact] = useState('')
  const [branchEmail, setBranchEmail] = useState('')
  const [commissionModel, setCommissionModel] = useState('fixed_rate')
  const [commissionValue, setCommissionValue] = useState('')

  // Member
  const [showAddMember, setShowAddMember] = useState(false)
  const [memberName, setMemberName] = useState('')
  const [memberEmail, setMemberEmail] = useState('')
  const [memberPassword, setMemberPassword] = useState('')
  const [memberCommission, setMemberCommission] = useState('')
  const [memberBranch, setMemberBranch] = useState('')
  const [memberRole, setMemberRole] = useState('agent')
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [memberTab, setMemberTab] = useState<'leads' | 'hakedis' | 'loglar'>('leads')

  // Lead
  const [showAddLead, setShowAddLead] = useState(false)
  const [leadName, setLeadName] = useState('')
  const [leadPhone, setLeadPhone] = useState('')
  const [leadEmail, setLeadEmail] = useState('')
  const [leadBranch, setLeadBranch] = useState('')
  const [leadSource, setLeadSource] = useState('manual')
  const [leadAssignTo, setLeadAssignTo] = useState('')
  const [leadNote, setLeadNote] = useState('')

  // Lead detail/update
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

  const [perfPeriod, setPerfPeriod] = useState('6month')
  const [perfStartDate, setPerfStartDate] = useState('')
  const [perfEndDate, setPerfEndDate] = useState('')
  const [compPeriodA, setCompPeriodA] = useState('1month')
  const [compPeriodB, setCompPeriodB] = useState('last_month')
  const [compStartA, setCompStartA] = useState('')
  const [compEndA, setCompEndA] = useState('')
  const [compStartB, setCompStartB] = useState('')
  const [compEndB, setCompEndB] = useState('')

  // Report
  // Settings
  const [settingsName, setSettingsName] = useState('')
  const [settingsCompany, setSettingsCompany] = useState('')
  const [settingsPhone, setSettingsPhone] = useState('')
  const [settingsSector, setSettingsSector] = useState('')
  const [settingsOldPassword, setSettingsOldPassword] = useState('')
  const [settingsNewPassword, setSettingsNewPassword] = useState('')
  const [settingsNewPassword2, setSettingsNewPassword2] = useState('')
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsMsg, setSettingsMsg] = useState<{type:'success'|'error', text:string}|null>(null)
  const [passwordMsg, setPasswordMsg] = useState<{type:'success'|'error', text:string}|null>(null)
  const [logoUploading, setLogoUploading] = useState(false)

  const [metaConn, setMetaConn] = useState<any>(null)

  const [showReportPanel, setShowReportPanel] = useState(false)
  const [reportPeriod, setReportPeriod] = useState('this_month')
  const [reportFormat, setReportFormat] = useState('excel')
  const [reportStatus, setReportStatus] = useState('all')
  const [reportStartDate, setReportStartDate] = useState('')
  const [reportEndDate, setReportEndDate] = useState('')
  const [reportLoading, setReportLoading] = useState(false)

  // ─── EFFECTS ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('meta') === 'connected') setActiveTab('meta-baglanti')
    loadData()
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) setShowProfileMenu(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ─── DATA ─────────────────────────────────────────────────────────────────

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (profileData?.role !== 'customer') { router.push('/login'); return }
    setProfile(profileData)
    setSettingsName(profileData?.full_name || '')
    setSettingsCompany(profileData?.company_name || '')
    setSettingsPhone(profileData?.phone || '')
    setSettingsSector(profileData?.sector || '')
    const { data: branchesData } = await supabase.from('branches').select('*').eq('owner_id', user.id).order('created_at', { ascending: false })
    setBranches(branchesData || [])
    if (branchesData && branchesData.length > 0) {
      const branchIds = branchesData.map((b: any) => b.id)
      const { data: leadsData } = await supabase.from('leads').select('*').in('branch_id', branchIds).order('created_at', { ascending: false })
      setLeads(leadsData || [])
      const { data: membersData } = await supabase.from('team_members').select('*, profiles(full_name, email), branches(branch_name)').in('branch_id', branchIds)
      setTeamMembers(membersData || [])
    }
    const { data: metaConnData } = await supabase.from('meta_connections').select('*').eq('owner_id', user.id).single()
    setMetaConn(metaConnData || null)
    setLoading(false)
  }

  // ─── SETTINGS HANDLERS ────────────────────────────────────────────────────

  const handleSaveProfile = async () => {
    setSettingsSaving(true); setSettingsMsg(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('profiles').update({
      full_name: settingsName, company_name: settingsCompany,
      phone: settingsPhone, sector: settingsSector,
    }).eq('id', user.id)
    if (error) setSettingsMsg({ type: 'error', text: 'Kaydedilemedi: ' + error.message })
    else { setSettingsMsg({ type: 'success', text: 'Profil güncellendi!' }); loadData() }
    setSettingsSaving(false)
    setTimeout(() => setSettingsMsg(null), 3000)
  }

  const handleChangePassword = async () => {
    setPasswordMsg(null)
    if (!settingsOldPassword) { setPasswordMsg({ type: 'error', text: 'Mevcut şifrenizi girin.' }); return }
    if (settingsNewPassword !== settingsNewPassword2) { setPasswordMsg({ type: 'error', text: 'Yeni şifreler eşleşmiyor.' }); return }
    if (settingsNewPassword.length < 6) { setPasswordMsg({ type: 'error', text: 'Yeni şifre en az 6 karakter olmalı.' }); return }
    // Eski şifreyi doğrula
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email, password: settingsOldPassword })
    if (signInError) { setPasswordMsg({ type: 'error', text: 'Mevcut şifre yanlış.' }); return }
    // Yeni şifreyi kaydet
    const { error } = await supabase.auth.updateUser({ password: settingsNewPassword })
    if (error) setPasswordMsg({ type: 'error', text: 'Hata: ' + error.message })
    else { setPasswordMsg({ type: 'success', text: 'Şifre güncellendi!' }); setSettingsOldPassword(''); setSettingsNewPassword(''); setSettingsNewPassword2('') }
    setTimeout(() => setPasswordMsg(null), 3000)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setLogoUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const ext = file.name.split('.').pop()
    const path = `logos/${user.id}.${ext}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      await supabase.from('profiles').update({ logo_url: urlData.publicUrl }).eq('id', user.id)
      loadData()
    }
    setLogoUploading(false)
  }

  // ─── HANDLERS ─────────────────────────────────────────────────────────────

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
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
      setBranchName(''); setBranchContact(''); setBranchEmail(''); setCommissionModel('fixed_rate'); setCommissionValue('')
      loadData()
    }
    setSaving(false)
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    const { data, error } = await supabase.auth.signUp({ email: memberEmail, password: memberPassword, options: { data: { full_name: memberName, role: 'team' } } })
    if (error) { alert(error.message); setSaving(false); return }
    if (data.user) {
      await supabase.from('profiles').insert({ id: data.user.id, email: memberEmail, full_name: memberName, role: 'team', is_active: true })
      await supabase.from('team_members').insert({ branch_id: memberBranch, user_id: data.user.id, role: memberRole, commission_rate: parseFloat(memberCommission) || 0 })
      setMemberName(''); setMemberEmail(''); setMemberPassword(''); setMemberCommission(''); setMemberBranch(''); setMemberRole('agent')
      setShowAddMember(false); loadData()
    }
    setSaving(false)
  }

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const leadCode = 'DP-' + Date.now().toString().slice(-6)
    const { error } = await supabase.from('leads').insert({
      lead_code: leadCode, branch_id: leadBranch, owner_id: user.id,
      assigned_to: leadAssignTo || null, full_name: leadName, phone: leadPhone,
      email: leadEmail || null, source: leadSource, note: leadNote || null, status: 'new',
    })
    if (!error) {
      setLeadName(''); setLeadPhone(''); setLeadEmail(''); setLeadBranch(''); setLeadSource('manual'); setLeadAssignTo(''); setLeadNote('')
      setShowAddLead(false); await loadData()
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
    if (newStatus === 'procedure_done') { updates.procedure_type = procedureType; updates.procedure_amount = parseFloat(procedureAmount) || 0; updates.procedure_date = new Date().toISOString() }
    if (newStatus === 'cancelled') updates.cancel_reason = cancelReason
    await supabase.from('leads').update(updates).eq('id', selectedLead.id)
    await supabase.from('lead_history').insert({ lead_id: selectedLead.id, changed_by: profile.id, old_status: selectedLead.status, new_status: newStatus, note: statusNote })
    setSelectedLead(null); setStatusNote(''); setProcedureType(''); setProcedureAmount(''); setCancelReason(''); setAppointmentDate('')
    loadData(); setSaving(false)
  }

  const handleToggleBranch = async (branch: any) => { await supabase.from('branches').update({ is_active: !branch.is_active }).eq('id', branch.id); loadData() }
  const handleToggleMember = async (member: any) => { await supabase.from('team_members').update({ is_active: !member.is_active }).eq('id', member.id); loadData() }
  const handleAssignLead = async (leadId: string, userId: string) => { await supabase.from('leads').update({ assigned_to: userId }).eq('id', leadId); loadData() }

  const openDetailModal = async (lead: any) => {
    setDetailLead(lead); setShowDetailModal(true)
    const { data } = await supabase.from('lead_history').select('*, profiles(full_name)').eq('lead_id', lead.id).order('created_at', { ascending: false })
    setLeadHistory(data || [])
  }

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login') }
  const toggleMenu = (key: string) => setExpandedMenus(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])

  // ─── COMPUTED ─────────────────────────────────────────────────────────────

  const getPageTitle = () => {
    for (const item of menuStructure) {
      if (item.key === activeTab) return item.label
      if (item.children) { const child = item.children.find(c => c.key === activeTab); if (child) return `${item.label} › ${child.label}` }
    }
    return 'Dashboard'
  }

  const totalSales = leads.filter(l => l.status === 'procedure_done').length
  const totalRevenue = leads.filter(l => l.status === 'procedure_done').reduce((sum, l) => sum + (l.procedure_amount || 0), 0)
  const conversionRate = leads.length > 0 ? ((totalSales / leads.length) * 100).toFixed(1) : '0'

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const weekEnd = new Date(today); weekEnd.setDate(today.getDate() + 7)

  const filteredLeads = leads.filter(l => {
    const matchesSearch = !searchQuery || l.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || l.phone?.includes(searchQuery) || l.lead_code?.toLowerCase().includes(searchQuery.toLowerCase()) || l.email?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || l.status === filterStatus
    let matchesDate = true
    if (filterDate !== 'all' && l.appointment_at) {
      const d = new Date(l.appointment_at); d.setHours(0, 0, 0, 0)
      if (filterDate === 'today') matchesDate = d.getTime() === today.getTime()
      else if (filterDate === 'this_week') matchesDate = d >= today && d <= weekEnd
      else if (filterDate === 'overdue') matchesDate = d < today
    } else if (filterDate !== 'all') { matchesDate = false }
    return matchesSearch && matchesStatus && matchesDate
  })

  // ─── REPORT ───────────────────────────────────────────────────────────────

  const getReportLeads = () => {
    const now = new Date()
    let start: Date, end: Date = new Date(now); end.setHours(23, 59, 59, 999)
    if (reportPeriod === 'today') { start = new Date(now); start.setHours(0, 0, 0, 0) }
    else if (reportPeriod === 'this_week') { start = new Date(now); start.setDate(now.getDate() - now.getDay() + 1); start.setHours(0, 0, 0, 0) }
    else if (reportPeriod === 'this_month') { start = new Date(now.getFullYear(), now.getMonth(), 1) }
    else if (reportPeriod === 'last_month') { start = new Date(now.getFullYear(), now.getMonth() - 1, 1); end = new Date(now.getFullYear(), now.getMonth(), 0); end.setHours(23, 59, 59, 999) }
    else { start = reportStartDate ? new Date(reportStartDate) : new Date(0); end = reportEndDate ? new Date(reportEndDate + 'T23:59:59') : new Date() }
    return leads.filter(l => { const d = new Date(l.created_at); return d >= start && d <= end && (reportStatus === 'all' || l.status === reportStatus) })
  }

  const downloadExcel = async () => {
    setReportLoading(true)
    const data = getReportLeads()
    const XLSX = await import('xlsx')
    const rows = data.map(l => ({ 'Lead Kodu': l.lead_code, 'Ad Soyad': l.full_name || '', 'Telefon': l.phone || '', 'E-posta': l.email || '', 'Durum': STATUS_CONFIG[l.status]?.label || l.status, 'Kaynak': SOURCE_CONFIG[l.source]?.label || l.source, 'İşlem Tutarı': l.procedure_amount || 0, 'Randevu': l.appointment_at ? new Date(l.appointment_at).toLocaleDateString('tr-TR') : '', 'Not': l.note || '', 'Eklenme Tarihi': new Date(l.created_at).toLocaleDateString('tr-TR') }))
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [12, 20, 14, 24, 12, 14, 14, 14, 30, 14].map(w => ({ wch: w }))
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Leadler')
    const pLabel: any = { today: 'Bugün', this_week: 'Bu_Hafta', this_month: 'Bu_Ay', last_month: 'Geçen_Ay', custom: 'Özel' }
    XLSX.writeFile(wb, `DataPilot_${pLabel[reportPeriod]}.xlsx`)
    setReportLoading(false); setShowReportPanel(false)
  }

  const downloadPDF = async () => {
    setReportLoading(true)
    const data = getReportLeads()
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')
    const doc = new jsPDF({ orientation: 'landscape' })
    doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.text('DataPilot — Lead Raporu', 14, 18)
    doc.setFontSize(9); doc.setFont('helvetica', 'normal')
    const pLabel: any = { today: 'Bugün', this_week: 'Bu Hafta', this_month: 'Bu Ay', last_month: 'Geçen Ay', custom: 'Özel' }
    const sales = data.filter(l => l.status === 'procedure_done').length
    const revenue = data.filter(l => l.status === 'procedure_done').reduce((s, l) => s + (l.procedure_amount || 0), 0)
    doc.text(`Dönem: ${pLabel[reportPeriod]}  |  Toplam: ${data.length} lead  |  Satış: ${sales}  |  Ciro: ₺${revenue.toLocaleString()}  |  Dönüşüm: %${data.length > 0 ? ((sales / data.length) * 100).toFixed(1) : 0}`, 14, 26)
    autoTable(doc, { startY: 32, head: [['Lead Kodu', 'Ad Soyad', 'Telefon', 'Durum', 'Kaynak', 'Tutar', 'Tarih']], body: data.map(l => [l.lead_code, l.full_name || '', l.phone || '', STATUS_CONFIG[l.status]?.label || l.status, SOURCE_CONFIG[l.source]?.label || l.source, l.procedure_amount ? `₺${l.procedure_amount.toLocaleString()}` : '-', new Date(l.created_at).toLocaleDateString('tr-TR')]), styles: { fontSize: 8, cellPadding: 3 }, headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' }, alternateRowStyles: { fillColor: [249, 250, 251] } })
    const pLabelFile: any = { today: 'Bugün', this_week: 'Bu_Hafta', this_month: 'Bu_Ay', last_month: 'Geçen_Ay', custom: 'Özel' }
    doc.save(`DataPilot_${pLabelFile[reportPeriod]}.pdf`)
    setReportLoading(false); setShowReportPanel(false)
  }

  // ─── LOADING ──────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center mx-auto mb-3">
          <span className="text-white font-bold">D</span>
        </div>
        <div className="flex gap-1 justify-center">
          {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
        </div>
      </div>
    </div>
  )

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 flex" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── SIDEBAR ── */}
      <aside
        onMouseEnter={() => setSidebarCollapsed(false)}
        onMouseLeave={() => setSidebarCollapsed(true)}
        className={`${sidebarCollapsed ? 'w-16' : 'w-60'} bg-gray-950 border-r border-gray-800 flex flex-col fixed top-0 left-0 h-full z-20 transition-all duration-200 shadow-xl`}>

        {/* DataPilot Logo */}
        <div className={`flex items-center h-14 border-b border-gray-800 px-4 ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
          <img src="/logo.png" alt="DataPilot" className="h-7 w-auto flex-shrink-0 object-contain" />
          {!sidebarCollapsed && <span className="font-semibold text-white text-sm tracking-tight truncate">DataPilot</span>}
        </div>

        {/* Firma */}
        {!sidebarCollapsed && (
          <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2.5">
            {profile?.logo_url ? (
              <img src={profile.logo_url} alt="Firma" className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-gray-700" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-indigo-400 text-xs font-bold">{(profile?.company_name || profile?.full_name || 'F').charAt(0)}</span>
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-200 truncate">{profile?.company_name || profile?.full_name}</p>
              <span className="text-xs text-indigo-400 font-medium">Müşteri</span>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {menuStructure.map(item => (
            <div key={item.key}>
              <button
                onClick={() => { if (item.children) toggleMenu(item.key); else setActiveTab(item.key) }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all mb-0.5 ${
                  activeTab === item.key && !item.children
                    ? 'bg-indigo-600 text-white font-medium shadow-lg shadow-indigo-900/50'
                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="text-base flex-shrink-0">{item.icon}</span>
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.children && (
                      <svg className={`w-3.5 h-3.5 transition-transform text-gray-600 ${expandedMenus.includes(item.key) ? 'rotate-90' : ''}`} viewBox="0 0 14 14" fill="none"><path d="M4 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    )}
                  </>
                )}
              </button>
              {item.children && expandedMenus.includes(item.key) && !sidebarCollapsed && (
                <div className="ml-3 pl-3 border-l border-gray-700 mb-1">
                  {item.children.map(child => (
                    <button key={child.key} onClick={() => setActiveTab(child.key)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all mb-0.5 ${
                        activeTab === child.key ? 'text-indigo-400 font-medium bg-indigo-500/10' : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
                      }`}>
                      {child.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Bottom */}
        {!sidebarCollapsed ? (
          <div className="p-3 border-t border-gray-800">
            <div className="flex items-center gap-2.5 px-2 py-1.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-indigo-400 text-xs font-bold">{profile?.full_name?.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-300 truncate">{profile?.full_name}</p>
                <p className="text-xs text-gray-600 truncate">{profile?.email}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 border-t border-gray-800">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center mx-auto">
              <span className="text-indigo-400 text-xs font-bold">{profile?.full_name?.charAt(0)}</span>
            </div>
          </div>
        )}
      </aside>

      {/* ── MAIN ── */}
      <div className="ml-16 flex-1 transition-all duration-200 min-w-0">

        {/* Top bar */}
        <header className="h-14 bg-white/80 backdrop-blur-sm border-b border-gray-100 flex items-center px-6 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-1.5 text-sm text-gray-400">
            <span>DataPilot</span>
            {getPageTitle().split(' › ').map((part, i, arr) => (
              <span key={i} className="flex items-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span className={i === arr.length - 1 ? 'text-gray-800 font-medium' : ''}>{part}</span>
              </span>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2" ref={profileMenuRef}>
            <div className="relative">
              <button onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 hover:bg-gray-50 rounded-xl px-3 py-1.5 transition-colors border border-transparent hover:border-gray-200">
                <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <span className="text-indigo-600 text-xs font-bold">{profile?.full_name?.charAt(0)}</span>
                </div>
                <span className="text-sm font-medium text-gray-700 hidden md:block">{profile?.full_name}</span>
                <svg className="text-gray-400" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50">
                  <div className="px-4 py-2.5 border-b border-gray-100 mb-1">
                    <p className="text-sm font-semibold text-gray-900">{profile?.full_name}</p>
                    <p className="text-xs text-gray-400 truncate">{profile?.email}</p>
                  </div>
                  <button onClick={() => { setActiveTab('ayarlar'); setShowProfileMenu(false) }} className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.25"/><path d="M7 1v1m0 10v1M1 7h1m10 0h1m-2.05-3.95-.7.7M4.75 9.25l-.7.7m0-6.65.7.7m4.5 4.5.7.7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></svg>
                    Ayarlar
                  </button>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 12H2.5A1.5 1.5 0 011 10.5v-7A1.5 1.5 0 012.5 2H5M9 10l3-3-3-3M12 7H5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Çıkış Yap
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6 min-h-screen" style={{ background: 'linear-gradient(135deg, #f8f7ff 0%, #f0f4ff 50%, #f5f3ff 100%)' }}>

          {/* ── DASHBOARD ── */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Welcome */}
              <div className="bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 rounded-2xl p-6 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/5 rounded-full" />
                <div className="absolute -right-2 bottom-0 w-24 h-24 bg-violet-500/20 rounded-full" />
                <div className="relative">
                  <p className="text-indigo-200 text-sm mb-1">Hoş geldin,</p>
                  <h1 className="text-2xl font-bold mb-1">{profile?.full_name}</h1>
                  <p className="text-indigo-300 text-sm">{new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                  <div className="flex gap-8 mt-5 pt-5 border-t border-white/10">
                    <div><p className="text-3xl font-bold">{leads.length}</p><p className="text-indigo-300 text-xs mt-0.5">Toplam Lead</p></div>
                    <div><p className="text-3xl font-bold">{totalSales}</p><p className="text-indigo-300 text-xs mt-0.5">Satış</p></div>
                    <div><p className="text-3xl font-bold">%{conversionRate}</p><p className="text-indigo-300 text-xs mt-0.5">Dönüşüm</p></div>
                    <div><p className="text-3xl font-bold">₺{(totalRevenue / 1000).toFixed(0)}K</p><p className="text-indigo-300 text-xs mt-0.5">Ciro</p></div>
                  </div>
                </div>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Aktif Lead', value: leads.filter(l => l.status === 'new' || l.status === 'called').length, sub: 'Yeni + Arandı', color: 'text-blue-600', border: 'border-blue-100', gradient: 'from-blue-50 to-white', iconBg: 'bg-blue-100', icon: '◎' },
                  { label: 'Randevu', value: leads.filter(l => l.status === 'appointment_scheduled').length, sub: 'Bekleyen randevu', color: 'text-violet-600', border: 'border-violet-100', gradient: 'from-violet-50 to-white', iconBg: 'bg-violet-100', icon: '◐' },
                  { label: 'Toplam Satış', value: totalSales, sub: `₺${totalRevenue.toLocaleString()}`, color: 'text-emerald-600', border: 'border-emerald-100', gradient: 'from-emerald-50 to-white', iconBg: 'bg-emerald-100', icon: '◉' },
                  { label: 'Şubeler', value: branches.length, sub: `${teamMembers.length} ekip üyesi`, color: 'text-orange-600', border: 'border-orange-100', gradient: 'from-orange-50 to-white', iconBg: 'bg-orange-100', icon: '◈' },
                ].map(card => (
                  <div key={card.label} className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-5 border ${card.border} hover:shadow-md transition-all`}>
                    <div className={`w-9 h-9 ${card.iconBg} rounded-xl flex items-center justify-center text-lg mb-3`}>{card.icon}</div>
                    <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                    <p className="text-xs font-medium text-gray-700 mt-1">{card.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
                  </div>
                ))}
              </div>

              {/* Recent leads */}
              <div className="bg-white rounded-2xl border border-gray-100">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 text-sm">Son Leadler</h3>
                  <button onClick={() => setActiveTab('leadler-liste')} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Tümünü gör →</button>
                </div>
                {leads.length === 0 ? (
                  <div className="p-12 text-center"><p className="text-gray-400 text-sm">Henüz lead yok.</p></div>
                ) : leads.slice(0, 6).map((lead, idx) => {
                  const avatarColors = ['from-blue-100 to-indigo-100 text-indigo-600','from-violet-100 to-purple-100 text-violet-600','from-emerald-100 to-teal-100 text-emerald-600','from-orange-100 to-amber-100 text-orange-600','from-pink-100 to-rose-100 text-rose-600','from-cyan-100 to-blue-100 text-blue-600']
                  const ac = avatarColors[idx % avatarColors.length]
                  return (
                  <div key={lead.id} onClick={() => openDetailModal(lead)} className="px-5 py-3.5 flex items-center gap-3 border-b border-gray-50 last:border-0 hover:bg-indigo-50/30 cursor-pointer transition-colors group">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${ac} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-xs font-semibold">{(lead.full_name || 'İ').charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{lead.full_name || 'İsimsiz'}</p>
                      <p className="text-xs text-gray-400">{lead.phone}</p>
                    </div>
                    <Badge status={lead.status} />
                  </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── LEAD LİSTESİ ── */}
          {activeTab === 'leadler-liste' && (
            <div className="space-y-4">
              {/* Actions bar */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{filteredLeads.length} / {leads.length} lead</p>
                <div className="flex gap-2">
                  <Btn variant="secondary" size="sm" onClick={() => setShowReportPanel(true)}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 10h10M2 7h6M2 4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    Rapor İndir
                  </Btn>
                  <Btn size="sm" onClick={() => setShowAddLead(true)}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/></svg>
                    Lead Ekle
                  </Btn>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="İsim, telefon veya lead kodu ara..."
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></button>}
              </div>

              {/* Filters */}
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Durum</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {[{ key: 'all', label: 'Tümü' }, ...Object.entries(STATUS_CONFIG).map(([k, v]: any) => ({ key: k, label: v.label }))].map(f => (
                      <button key={f.key} onClick={() => setFilterStatus(f.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterStatus === f.key ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'}`}>
                        {f.label} ({f.key === 'all' ? leads.length : leads.filter(l => l.status === f.key).length})
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Randevu Tarihi</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {[
                      { key: 'all', label: 'Tümü' },
                      { key: 'today', label: '● Bugün', count: leads.filter(l => { if (!l.appointment_at) return false; const d = new Date(l.appointment_at); d.setHours(0,0,0,0); return d.getTime() === today.getTime() }).length },
                      { key: 'this_week', label: '● Bu Hafta', count: leads.filter(l => { if (!l.appointment_at) return false; const d = new Date(l.appointment_at); d.setHours(0,0,0,0); return d >= today && d <= weekEnd }).length },
                      { key: 'overdue', label: '● Geçmiş', count: leads.filter(l => { if (!l.appointment_at) return false; const d = new Date(l.appointment_at); d.setHours(0,0,0,0); return d < today }).length },
                    ].map(f => (
                      <button key={f.key} onClick={() => setFilterDate(f.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterDate === f.key ? 'bg-violet-600 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'}`}>
                        {f.label}{f.count !== undefined ? ` (${f.count})` : ''}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Lead table */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {filteredLeads.length === 0 ? (
                  <div className="p-16 text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl">◎</div>
                    <p className="text-gray-500 text-sm font-medium">Sonuç bulunamadı</p>
                    {(searchQuery || filterStatus !== 'all' || filterDate !== 'all') && <button onClick={() => { setSearchQuery(''); setFilterStatus('all'); setFilterDate('all') }} className="mt-2 text-xs text-indigo-600 hover:underline">Filtreleri temizle</button>}
                  </div>
                ) : filteredLeads.map((lead, i) => (
                  <div key={lead.id} onClick={() => openDetailModal(lead)}
                    className={`px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50/70 transition-colors ${i < filteredLeads.length - 1 ? 'border-b border-gray-50' : ''}`}>
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-indigo-600 text-sm font-semibold">{(lead.full_name || 'İ').charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium text-gray-900 truncate">{lead.full_name || 'İsimsiz'}</p>
                        <SourceBadge source={lead.source} />
                      </div>
                      <p className="text-xs text-gray-400">{lead.phone}{lead.email && ` · ${lead.email}`}</p>
                      {lead.appointment_at && <p className="text-xs text-violet-600 mt-0.5 font-medium">📅 {new Date(lead.appointment_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        {lead.procedure_amount > 0 && <p className="text-sm font-semibold text-emerald-600">₺{lead.procedure_amount.toLocaleString()}</p>}
                        <p className="text-xs text-gray-400">{new Date(lead.created_at).toLocaleDateString('tr-TR')}</p>
                      </div>
                      <Badge status={lead.status} />
                      <button onClick={e => { e.stopPropagation(); setSelectedLead(lead); setNewStatus(lead.status) }}
                        className="p-2 hover:bg-indigo-50 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9.5 1.5l3 3-8 8H1.5v-3l8-8z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── LEAD DAĞITIMI ── */}
          {activeTab === 'leadler-dagitim' && (
            <div className="bg-white rounded-2xl border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 text-sm">Lead Dağıtımı</h3>
                <p className="text-xs text-gray-400 mt-0.5">Atanmamış leadları satışçılara atayın</p>
              </div>
              {leads.filter(l => !l.assigned_to).length === 0 ? (
                <div className="p-16 text-center"><div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3 text-lg">✓</div><p className="text-gray-500 text-sm">Tüm leadlar atanmış.</p></div>
              ) : leads.filter(l => !l.assigned_to).map((lead, i, arr) => (
                <div key={lead.id} className={`px-5 py-4 flex items-center justify-between ${i < arr.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center"><span className="text-sm font-semibold text-orange-600">{(lead.full_name || 'İ').charAt(0)}</span></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{lead.full_name || 'İsimsiz'}</p>
                      <p className="text-xs text-gray-400">{lead.phone} · {new Date(lead.created_at).toLocaleDateString('tr-TR')}</p>
                    </div>
                  </div>
                  <Select value="" onChange={(e: any) => { if (e.target.value) handleAssignLead(lead.id, e.target.value) }} className="w-44">
                    <option value="">Satışçı seç...</option>
                    {teamMembers.filter(m => m.role === 'agent').map(m => <option key={m.user_id} value={m.user_id}>{m.profiles?.full_name}</option>)}
                  </Select>
                </div>
              ))}
            </div>
          )}

          {/* ── ŞUBELER ── */}
          {activeTab === 'ekip-sube' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Btn size="sm" onClick={() => setShowAddBranch(true)}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/></svg>
                  Şube Ekle
                </Btn>
              </div>
              {branchInviteLink && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0 text-sm">✓</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-emerald-800">Şube oluşturuldu!</p>
                    <p className="text-xs text-emerald-600 truncate mt-0.5">{branchInviteLink}</p>
                  </div>
                  <button onClick={() => navigator.clipboard.writeText(branchInviteLink)} className="text-xs text-emerald-700 font-medium hover:text-emerald-900 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0">Kopyala</button>
                </div>
              )}
              <div className="bg-white rounded-2xl border border-gray-100">
                {branches.length === 0 ? (
                  <div className="p-16 text-center"><p className="text-gray-400 text-sm">Henüz şube yok.</p></div>
                ) : branches.map((branch, i) => {
                  const branchColors = ['bg-indigo-100 text-indigo-600','bg-violet-100 text-violet-600','bg-emerald-100 text-emerald-600','bg-orange-100 text-orange-600']
                  const bc = branchColors[i % branchColors.length]
                  return (
                  <div key={branch.id} className={`px-5 py-4 flex items-center gap-4 ${i < branches.length - 1 ? 'border-b border-gray-50' : ''} hover:bg-gray-50/50 transition-colors`}>
                    <div className={`w-9 h-9 rounded-xl ${bc} flex items-center justify-center flex-shrink-0`}><span className="font-semibold text-sm">{branch.branch_name?.charAt(0)}</span></div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{branch.branch_name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{branch.contact_name} · {branch.contact_email}</p>
                      <p className="text-xs text-gray-400">Komisyon: %{branch.commission_value}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={branch.is_active} onChange={() => handleToggleBranch(branch)} className="sr-only peer" />
                      <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-indigo-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                    </label>
                  </div>
                )})}
              </div>
            </div>
          )}

          {/* ── SATIŞÇILAR ── */}
          {activeTab === 'ekip-liste' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{teamMembers.length} ekip üyesi</p>
                <Btn size="sm" onClick={() => setShowAddMember(true)}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/></svg>
                  Üye Ekle
                </Btn>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100">
                {teamMembers.length === 0 ? (
                  <div className="p-16 text-center"><p className="text-gray-400 text-sm">Henüz ekip üyesi yok.</p></div>
                ) : teamMembers.map((member, i) => {
                  const memberLeads = leads.filter(l => l.assigned_to === member.user_id)
                  const memberSales = memberLeads.filter(l => l.status === 'procedure_done').length
                  const memberRevenue = memberLeads.filter(l => l.status === 'procedure_done').reduce((s, l) => s + (l.procedure_amount || 0), 0)
                  const avatarPairs = ['from-violet-200 to-indigo-200 text-indigo-700','from-emerald-200 to-teal-200 text-emerald-700','from-orange-200 to-amber-200 text-orange-700','from-pink-200 to-rose-200 text-rose-700','from-blue-200 to-cyan-200 text-blue-700']
                  const ap = avatarPairs[i % avatarPairs.length]
                  return (
                    <div key={member.id} className={`px-5 py-4 flex items-center gap-4 ${i < teamMembers.length - 1 ? 'border-b border-gray-50' : ''} hover:bg-gray-50/50 transition-colors`}>
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${ap} flex items-center justify-center flex-shrink-0`}>
                        <span className="font-semibold text-sm">{member.profiles?.full_name?.charAt(0)}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">{member.profiles?.full_name}</p>
                          <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">{member.role === 'agent' ? 'Satışçı' : 'Yönetici'}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{member.branches?.branch_name} · %{member.commission_rate} prim</p>
                        <div className="flex gap-2 mt-1.5">
                          <span className="text-xs bg-blue-50 text-blue-600 font-medium px-2 py-0.5 rounded-md">{memberLeads.length} lead</span>
                          <span className="text-xs bg-emerald-50 text-emerald-600 font-medium px-2 py-0.5 rounded-md">{memberSales} satış</span>
                          {memberRevenue > 0 && <span className="text-xs bg-gray-50 text-gray-600 font-medium px-2 py-0.5 rounded-md">₺{memberRevenue.toLocaleString()}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setSelectedMember(member)} className="text-xs text-indigo-600 font-medium hover:text-indigo-700 px-3 py-1.5 hover:bg-indigo-50 rounded-lg transition-colors">Detay</button>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={member.is_active !== false} onChange={() => handleToggleMember(member)} className="sr-only peer" />
                          <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-indigo-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                        </label>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── META ── */}
          {activeTab === 'meta-baglanti' && profile?.id && <MetaConnect ownerId={profile.id} />}
          {activeTab === 'meta-kampanyalar' && <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center"><p className="text-gray-400 text-sm">Kampanyalar yakında gelecek.</p></div>}
          {activeTab === 'meta-leadformlar' && (() => {
            const notConnected = !metaConn?.access_token
            const metaLeads = leads.filter(l => l.source === 'meta')
            const metaLeadsThisMonth = metaLeads.filter(l => {
              const d = new Date(l.created_at)
              const now = new Date()
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
            })
            const metaSales = metaLeads.filter(l => l.status === 'procedure_done')

            if (notConnected) return (
              <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">𝑓</div>
                <p className="text-gray-700 font-semibold mb-1">Meta Bağlantısı Gerekli</p>
                <p className="text-sm text-gray-400 mb-4">Önce Meta hesabını bağlamalısın.</p>
                <button onClick={() => setActiveTab('meta-baglanti')} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-xl font-medium hover:bg-indigo-700 transition-colors">Meta Bağlantısına Git →</button>
              </div>
            )

            return (
              <div className="space-y-5">

                {/* Webhook durum kartı */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white relative overflow-hidden">
                  <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/5 rounded-full" />
                  <div className="relative flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl font-bold">𝑓</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-white">Meta Webhook Aktif</p>
                        <span className="flex items-center gap-1 bg-emerald-400/20 text-emerald-300 text-xs px-2 py-0.5 rounded-full font-medium">
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                          Canlı
                        </span>
                      </div>
                      <p className="text-blue-200 text-sm">Lead formunu dolduranlar otomatik olarak sisteme düşüyor</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-bold">{metaLeads.length}</p>
                      <p className="text-blue-300 text-xs">toplam Meta lead</p>
                    </div>
                  </div>
                </div>

                {/* Özet kartlar */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-2xl border border-blue-100 p-5 bg-gradient-to-br from-blue-50 to-white">
                    <p className="text-xs text-gray-400 mb-1">Bu Ay Gelen</p>
                    <p className="text-2xl font-bold text-blue-600">{metaLeadsThisMonth.length}</p>
                    <p className="text-xs text-gray-400 mt-1">Meta lead formu</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-emerald-100 p-5 bg-gradient-to-br from-emerald-50 to-white">
                    <p className="text-xs text-gray-400 mb-1">Satışa Dönen</p>
                    <p className="text-2xl font-bold text-emerald-600">{metaSales.length}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {metaLeads.length > 0 ? `%${((metaSales.length / metaLeads.length) * 100).toFixed(1)} dönüşüm` : 'Henüz lead yok'}
                    </p>
                  </div>
                  <div className="bg-white rounded-2xl border border-violet-100 p-5 bg-gradient-to-br from-violet-50 to-white">
                    <p className="text-xs text-gray-400 mb-1">Meta Cirosu</p>
                    <p className="text-2xl font-bold text-violet-600">
                      ₺{metaSales.reduce((s: number, l: any) => s + (l.procedure_amount || 0), 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">toplam satış tutarı</p>
                  </div>
                </div>

                {/* Meta lead listesi */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">Meta'dan Gelen Leadler</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Webhook ile otomatik kaydedildi</p>
                    </div>
                    <button onClick={() => setActiveTab('leadler-liste')}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                      Tümünü Gör →
                    </button>
                  </div>
                  {metaLeads.length === 0 ? (
                    <div className="p-16 text-center">
                      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-xl">𝑓</div>
                      <p className="text-gray-500 text-sm font-medium">Henüz Meta'dan lead gelmedi</p>
                      <p className="text-xs text-gray-400 mt-1">Reklam formunu dolduran biri olduğunda otomatik buraya düşecek</p>
                    </div>
                  ) : metaLeads.slice(0, 10).map((lead: any, idx: number) => {
                    const avatarColors = ['bg-blue-100 text-blue-600','bg-violet-100 text-violet-600','bg-emerald-100 text-emerald-600','bg-orange-100 text-orange-600','bg-pink-100 text-pink-600']
                    const ac = avatarColors[idx % avatarColors.length]
                    return (
                      <div key={lead.id} onClick={() => openDetailModal(lead)}
                        className="px-5 py-3.5 flex items-center gap-3 border-b border-gray-50 last:border-0 hover:bg-blue-50/30 cursor-pointer transition-colors">
                        <div className={`w-8 h-8 rounded-lg ${ac} flex items-center justify-center flex-shrink-0`}>
                          <span className="text-xs font-bold">{(lead.full_name || 'İ').charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{lead.full_name || 'İsimsiz'}</p>
                          <p className="text-xs text-gray-400">{lead.phone}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-gray-400">{new Date(lead.created_at).toLocaleDateString('tr-TR')}</span>
                          <Badge status={lead.status} />
                        </div>
                      </div>
                    )
                  })}
                </div>

              </div>
            )
          })()}

          {/* ── PERFORMANS ── */}
{activeTab === 'performans-genel' && (() => {
            const now = new Date()

            // ── Filtre aralığı ──
            const getPeriodRange = () => {
              const end = new Date(); end.setHours(23,59,59,999)
              if (perfPeriod === 'today') { const s = new Date(); s.setHours(0,0,0,0); return { start: s, end } }
              if (perfPeriod === '7day') { const s = new Date(); s.setDate(s.getDate()-6); s.setHours(0,0,0,0); return { start: s, end } }
              if (perfPeriod === '1month') { const s = new Date(now.getFullYear(), now.getMonth(), 1); return { start: s, end } }
              if (perfPeriod === '3month') { const s = new Date(now.getFullYear(), now.getMonth()-2, 1); return { start: s, end } }
              if (perfPeriod === '6month') { const s = new Date(now.getFullYear(), now.getMonth()-5, 1); return { start: s, end } }
              if (perfPeriod === '1year') { const s = new Date(now.getFullYear(), 0, 1); return { start: s, end } }
              if (perfPeriod === 'custom' && perfStartDate && perfEndDate) {
                const s = new Date(perfStartDate); s.setHours(0,0,0,0)
                const e = new Date(perfEndDate); e.setHours(23,59,59,999)
                return { start: s, end: e }
              }
              return { start: new Date(now.getFullYear(), now.getMonth()-5, 1), end }
            }
            const { start: rangeStart, end: rangeEnd } = getPeriodRange()
            const filteredLeads = leads.filter(l => { const d = new Date(l.created_at); return d >= rangeStart && d <= rangeEnd })

            // ── Grafik için aylar ──
            const monthCount = perfPeriod === 'today' || perfPeriod === '7day' ? 1 : perfPeriod === '1month' ? 1 : perfPeriod === '3month' ? 3 : perfPeriod === '1year' ? 12 : 6
            const months = Array.from({ length: monthCount }, (_, i) => {
              const d = new Date(now.getFullYear(), now.getMonth() - (monthCount - 1 - i), 1)
              return { label: d.toLocaleDateString('tr-TR', { month: 'short' }), year: d.getFullYear(), month: d.getMonth() }
            })
            const monthlyData = months.map(m => {
              const mLeads = filteredLeads.filter(l => { const d = new Date(l.created_at); return d.getFullYear() === m.year && d.getMonth() === m.month })
              const mSales = mLeads.filter(l => l.status === 'procedure_done')
              const mRevenue = mSales.reduce((s: number, l: any) => s + (l.procedure_amount || 0), 0)
              return { ...m, leads: mLeads.length, sales: mSales.length, revenue: mRevenue }
            })
            const totalLeads = filteredLeads.length
            const totalSales = filteredLeads.filter(l => l.status === 'procedure_done').length
            const totalRevenue = filteredLeads.filter(l => l.status === 'procedure_done').reduce((s: number, l: any) => s + (l.procedure_amount || 0), 0)
            const convRate = totalLeads > 0 ? ((totalSales / totalLeads) * 100).toFixed(1) : '0'
            const statusDist = [
              { key: 'new', label: 'Yeni', color: '#6366f1' },
              { key: 'called', label: 'Arandı', color: '#f59e0b' },
              { key: 'appointment_scheduled', label: 'Randevu', color: '#8b5cf6' },
              { key: 'procedure_done', label: 'Satış', color: '#10b981' },
              { key: 'cancelled', label: 'İptal', color: '#f87171' },
            ].map(s => ({ ...s, count: filteredLeads.filter(l => l.status === s.key).length }))
            const branchPerf = branches.map(b => {
              const bLeads = filteredLeads.filter(l => l.branch_id === b.id)
              const bSales = bLeads.filter(l => l.status === 'procedure_done')
              const bRevenue = bSales.reduce((s: number, l: any) => s + (l.procedure_amount || 0), 0)
              return { name: b.branch_name, leads: bLeads.length, sales: bSales.length, revenue: bRevenue, rate: bLeads.length > 0 ? ((bSales.length / bLeads.length) * 100).toFixed(0) : '0' }
            })
            const maxLeads = Math.max(...monthlyData.map(m => m.leads), 1)
            const maxRevenue = Math.max(...monthlyData.map(m => m.revenue), 1)
            const barW = monthCount <= 3 ? 64 : monthCount <= 6 ? 48 : 32
            const chartW = 520; const chartH = 140; const gap = (chartW - barW * monthCount) / (monthCount + 1)
            return (
              <div className="space-y-5">

                {/* ── Filtre Bar ── */}
                <div className="bg-white rounded-2xl border border-gray-100 px-5 py-3.5 flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-medium text-gray-500 flex-shrink-0">Dönem:</span>
                  <div className="flex gap-1 flex-wrap">
                    {[
                      { key: 'today', label: 'Bugün' },
                      { key: '7day', label: 'Son 7 Gün' },
                      { key: '1month', label: 'Bu Ay' },
                      { key: '3month', label: 'Son 3 Ay' },
                      { key: '6month', label: 'Son 6 Ay' },
                      { key: '1year', label: 'Bu Yıl' },
                      { key: 'custom', label: 'Özel' },
                    ].map(p => (
                      <button key={p.key} onClick={() => setPerfPeriod(p.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${perfPeriod === p.key ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                  {perfPeriod === 'custom' && (
                    <div className="flex items-center gap-2 ml-auto">
                      <input type="date" value={perfStartDate} onChange={e => setPerfStartDate(e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      <span className="text-xs text-gray-400">—</span>
                      <input type="date" value={perfEndDate} onChange={e => setPerfEndDate(e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: 'Toplam Lead', value: totalLeads, sub: 'Seçili dönem', color: 'text-indigo-600', bg: 'from-indigo-50 to-white', icon: '◈' },
                    { label: 'Toplam Satış', value: totalSales, sub: convRate + '% dönüşüm', color: 'text-emerald-600', bg: 'from-emerald-50 to-white', icon: '◉' },
                    { label: 'Toplam Ciro', value: '₺' + totalRevenue.toLocaleString(), sub: 'Onaylı satışlar', color: 'text-violet-600', bg: 'from-violet-50 to-white', icon: '◎' },
                    { label: 'Ort. Satış', value: totalSales > 0 ? '₺' + Math.round(totalRevenue / totalSales).toLocaleString() : '—', sub: 'Satış başına', color: 'text-amber-600', bg: 'from-amber-50 to-white', icon: '◐' },
                  ].map(k => (
                    <div key={k.label} className={'bg-gradient-to-br ' + k.bg + ' rounded-2xl border border-gray-100 p-5'}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-400 text-lg">{k.icon}</span>
                        <span className="text-xs text-gray-400">{k.sub}</span>
                      </div>
                      <p className={'text-2xl font-bold ' + k.color}>{k.value}</p>
                      <p className="text-xs text-gray-500 mt-1">{k.label}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-semibold text-gray-900">Lead ve Satış Trendi</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Son 6 ay</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-indigo-300 inline-block" /> Lead</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block" /> Satış</span>
                    </div>
                  </div>
                  <svg width={chartW} height={chartH + 30} viewBox={'0 0 ' + chartW + ' ' + (chartH + 30)}>
                    {[0, 0.25, 0.5, 0.75, 1].map(r => (
                      <line key={r} x1={0} y1={chartH * (1 - r)} x2={chartW} y2={chartH * (1 - r)} stroke="#f3f4f6" strokeWidth="1" />
                    ))}
                    {monthlyData.map((m, i) => {
                      const x = gap + i * (barW + gap)
                      const lH = (m.leads / maxLeads) * chartH
                      const sH = (m.sales / maxLeads) * chartH
                      return (
                        <g key={i}>
                          <rect x={x} y={chartH - lH} width={barW} height={lH} rx={6} fill="#a5b4fc" />
                          <rect x={x + 4} y={chartH - sH} width={barW - 8} height={sH} rx={4} fill="#34d399" />
                          <text x={x + barW / 2} y={chartH + 18} textAnchor="middle" fontSize="11" fill="#9ca3af">{m.label}</text>
                          {m.leads > 0 && <text x={x + barW / 2} y={chartH - lH - 5} textAnchor="middle" fontSize="10" fill="#6366f1" fontWeight="600">{m.leads}</text>}
                        </g>
                      )
                    })}
                  </svg>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Durum Dağılımı</h3>
                    {totalLeads === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-6">Henüz lead yok.</p>
                    ) : (
                      <div className="space-y-3">
                        {statusDist.map(s => (
                          <div key={s.key}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-gray-600">{s.label}</span>
                              <span className="text-xs text-gray-400">{s.count} · %{totalLeads > 0 ? ((s.count / totalLeads) * 100).toFixed(0) : 0}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: (totalLeads > 0 ? (s.count / totalLeads) * 100 : 0) + '%', backgroundColor: s.color }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Aylık Ciro</h3>
                    <div className="space-y-2">
                      {monthlyData.map((m, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 w-8 flex-shrink-0">{m.label}</span>
                          <div className="flex-1 h-6 bg-gray-50 rounded-lg overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-violet-400 to-violet-500 rounded-lg flex items-center px-2"
                              style={{ width: (maxRevenue > 0 ? (m.revenue / maxRevenue) * 100 : 0) + '%', minWidth: m.revenue > 0 ? '2rem' : '0' }}>
                              {m.revenue > 0 && <span className="text-white text-xs font-medium whitespace-nowrap">{'₺' + (m.revenue / 1000).toFixed(0) + 'K'}</span>}
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-gray-700 w-16 text-right flex-shrink-0">
                            {m.revenue > 0 ? '₺' + m.revenue.toLocaleString() : '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {branches.length > 1 && (
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900">Şube Karşılaştırması</h3>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {branchPerf.sort((a, b) => b.sales - a.sales).map((b, i) => (
                        <div key={i} className="px-6 py-4 flex items-center gap-4">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                            <span className="text-indigo-600 text-xs font-bold">{b.name.charAt(0)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{b.name}</p>
                            <div className="flex gap-3 mt-0.5">
                              <span className="text-xs text-indigo-600">{b.leads} lead</span>
                              <span className="text-xs text-emerald-600">{b.sales} satış</span>
                              <span className="text-xs text-gray-400">%{b.rate} dönüşüm</span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-semibold text-gray-900">{b.revenue > 0 ? '₺' + b.revenue.toLocaleString() : '—'}</p>
                            <p className="text-xs text-gray-400">ciro</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })()}

          {/* ── PERFORMANS KARŞILAŞTIRMA ── */}
          {activeTab === 'performans-karsilastirma' && (() => {
            const now = new Date()

            // ── Dönem A/B aralığı hesapla ──
            const getPRange = (period: string, sDate: string, eDate: string) => {
              const end = new Date(); end.setHours(23,59,59,999)
              if (period === 'today') { const s = new Date(); s.setHours(0,0,0,0); return { start: s, end, label: 'Bugün' } }
              if (period === '7day') { const s = new Date(); s.setDate(s.getDate()-6); s.setHours(0,0,0,0); return { start: s, end, label: 'Son 7 Gün' } }
              if (period === '1month') { const s = new Date(now.getFullYear(), now.getMonth(), 1); return { start: s, end, label: now.toLocaleDateString('tr-TR', { month: 'long' }) } }
              if (period === 'last_month') { const lm = now.getMonth()===0?11:now.getMonth()-1; const ly = now.getMonth()===0?now.getFullYear()-1:now.getFullYear(); const s = new Date(ly,lm,1); const e = new Date(ly,lm+1,0); e.setHours(23,59,59,999); return { start: s, end: e, label: new Date(ly,lm).toLocaleDateString('tr-TR',{month:'long'}) } }
              if (period === '3month') { const s = new Date(now.getFullYear(), now.getMonth()-2, 1); return { start: s, end, label: 'Son 3 Ay' } }
              if (period === '6month') { const s = new Date(now.getFullYear(), now.getMonth()-5, 1); return { start: s, end, label: 'Son 6 Ay' } }
              if (period === '1year') { const s = new Date(now.getFullYear(), 0, 1); return { start: s, end, label: 'Bu Yıl' } }
              if (period === 'custom' && sDate && eDate) { const s = new Date(sDate); s.setHours(0,0,0,0); const e = new Date(eDate); e.setHours(23,59,59,999); return { start: s, end: e, label: sDate + ' – ' + eDate } }
              return { start: new Date(now.getFullYear(), now.getMonth(), 1), end, label: 'Bu Ay' }
            }

            const rangeA = getPRange(compPeriodA, compStartA, compEndA)
            const rangeB = getPRange(compPeriodB, compStartB, compEndB)
            const leadsA = leads.filter(l => { const d = new Date(l.created_at); return d >= rangeA.start && d <= rangeA.end })
            const leadsB = leads.filter(l => { const d = new Date(l.created_at); return d >= rangeB.start && d <= rangeB.end })
            const salesA = leadsA.filter(l => l.status === 'procedure_done')
            const salesB = leadsB.filter(l => l.status === 'procedure_done')
            const revenueA = salesA.reduce((s: number, l: any) => s + (l.procedure_amount || 0), 0)
            const revenueB = salesB.reduce((s: number, l: any) => s + (l.procedure_amount || 0), 0)
            const convA = leadsA.length > 0 ? ((salesA.length / leadsA.length) * 100).toFixed(1) : '0'
            const convB = leadsB.length > 0 ? ((salesB.length / leadsB.length) * 100).toFixed(1) : '0'
            const diff = (a: number, b: number) => b === 0 ? null : (((a - b) / b) * 100).toFixed(0)

            const PERIODS = [
              { key: 'today', label: 'Bugün' }, { key: '7day', label: 'Son 7 Gün' },
              { key: '1month', label: 'Bu Ay' }, { key: 'last_month', label: 'Geçen Ay' },
              { key: '3month', label: 'Son 3 Ay' }, { key: '6month', label: 'Son 6 Ay' },
              { key: '1year', label: 'Bu Yıl' }, { key: 'custom', label: 'Özel' },
            ]

            // Satışçı karşılaştırması (dönem A baz alır)
            const memberPerf = teamMembers.map((tm: any) => {
              const mAll = leads.filter(l => l.assigned_to === tm.user_id)
              const mA = leadsA.filter(l => l.assigned_to === tm.user_id)
              const mB = leadsB.filter(l => l.assigned_to === tm.user_id)
              const mSalesA = mA.filter(l => l.status === 'procedure_done')
              const mSalesB = mB.filter(l => l.status === 'procedure_done')
              return {
                name: tm.profiles?.full_name || tm.profiles?.email || '—',
                branch: tm.branches?.branch_name || '—',
                leadsA: mA.length, leadsB: mB.length,
                salesA: mSalesA.length, salesB: mSalesB.length,
                convA: mA.length > 0 ? ((mSalesA.length / mA.length) * 100).toFixed(0) : '0',
                convB: mB.length > 0 ? ((mSalesB.length / mB.length) * 100).toFixed(0) : '0',
              }
            }).sort((a: any, b: any) => b.salesA - a.salesA)

            const metrics = [
              { label: 'Lead', a: leadsA.length, b: leadsB.length, color: 'text-indigo-600', bgA: 'bg-indigo-50', format: (v: number) => v.toString() },
              { label: 'Satış', a: salesA.length, b: salesB.length, color: 'text-emerald-600', bgA: 'bg-emerald-50', format: (v: number) => v.toString() },
              { label: 'Ciro', a: revenueA, b: revenueB, color: 'text-violet-600', bgA: 'bg-violet-50', format: (v: number) => '₺' + v.toLocaleString() },
              { label: 'Dönüşüm', a: parseFloat(convA), b: parseFloat(convB), color: 'text-amber-600', bgA: 'bg-amber-50', format: (v: number) => '%' + v.toFixed(1) },
            ]

            const PeriodSelect = ({ value, onChange, startDate, endDate, onStartDate, onEndDate }: any) => (
              <div className="flex flex-col gap-1">
                {PERIODS.map(p => (
                  <button key={p.key} onClick={() => onChange(p.key)}
                    className={'w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all ' + (value === p.key ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-500 hover:bg-gray-50')}>
                    <span>{p.label}</span>
                    {value === p.key && <span className="w-2 h-2 bg-indigo-600 rounded-full flex-shrink-0" />}
                  </button>
                ))}
                {value === 'custom' && (
                  <div className="flex items-center gap-2 mt-1 px-1">
                    <input type="date" value={startDate} onChange={e => onStartDate(e.target.value)}
                      className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <span className="text-xs text-gray-400">—</span>
                    <input type="date" value={endDate} onChange={e => onEndDate(e.target.value)}
                      className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                )}
              </div>
            )

            return (
              <div className="space-y-5">

                {/* Dönem Seçici */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl border-2 border-indigo-200 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 bg-indigo-50 border-b border-indigo-100">
                      <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full flex-shrink-0" />
                      <p className="text-sm font-semibold text-indigo-700">1. Dönem</p>
                      <span className="ml-auto text-xs text-indigo-500 font-medium">{rangeA.label}</span>
                    </div>
                    <div className="p-3">
                      <PeriodSelect value={compPeriodA} onChange={setCompPeriodA} startDate={compStartA} endDate={compEndA} onStartDate={setCompStartA} onEndDate={setCompEndA} />
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                      <span className="w-2.5 h-2.5 bg-gray-400 rounded-full flex-shrink-0" />
                      <p className="text-sm font-semibold text-gray-600">2. Dönem</p>
                      <span className="ml-auto text-xs text-gray-400 font-medium">{rangeB.label}</span>
                    </div>
                    <div className="p-3">
                      <PeriodSelect value={compPeriodB} onChange={setCompPeriodB} startDate={compStartB} endDate={compEndB} onStartDate={setCompStartB} onEndDate={setCompEndB} />
                    </div>
                  </div>
                </div>

                {/* Karşılaştırma Metrikler */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <h3 className="font-semibold text-gray-900">Dönem Analizi</h3>
                    <div className="flex items-center gap-2 ml-auto text-xs">
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-indigo-600 rounded-full inline-block" /> {rangeA.label}</span>
                      <span className="text-gray-300">vs</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-gray-300 rounded-full inline-block" /> {rangeB.label}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    {metrics.map(m => {
                      const d = diff(m.a, m.b)
                      const up = d !== null && parseFloat(d) > 0
                      const down = d !== null && parseFloat(d) < 0
                      return (
                        <div key={m.label} className={m.bgA + ' rounded-2xl p-4'}>
                          <p className="text-xs text-gray-500 mb-2">{m.label}</p>
                          <p className={`text-2xl font-bold ${m.color}`}>{m.format(m.a)}</p>
                          <p className="text-xs text-gray-400 mt-1">{m.format(m.b)} dönem B</p>
                          {d !== null && (
                            <div className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${up ? 'bg-emerald-100 text-emerald-700' : down ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                              {up ? '↑' : down ? '↓' : '='} {Math.abs(parseFloat(d))}%
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Satışçı Karşılaştırması */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Satışçı Analizi</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{rangeA.label} vs {rangeB.label} · 1. dönem baz alınır</p>
                  </div>
                  {memberPerf.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-10">Henüz satışçı yok.</p>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {memberPerf.map((m: any, i: number) => {
                        const maxSales = Math.max(...memberPerf.map((x: any) => x.salesA), 1)
                        const salesDiff = m.salesB === 0 ? null : (((m.salesA - m.salesB) / m.salesB) * 100).toFixed(0)
                        const up = salesDiff !== null && parseFloat(salesDiff) > 0
                        const down = salesDiff !== null && parseFloat(salesDiff) < 0
                        return (
                          <div key={i} className="px-6 py-4 flex items-center gap-4">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-600' : i === 1 ? 'bg-gray-100 text-gray-500' : i === 2 ? 'bg-orange-50 text-orange-500' : 'bg-gray-50 text-gray-400'}`}>
                              {i + 1}
                            </div>
                            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                              <span className="text-blue-600 text-xs font-bold">{m.name.charAt(0)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <p className="text-sm font-medium text-gray-900">{m.name}</p>
                                <span className="text-xs text-gray-400">{m.branch}</span>
                                {salesDiff !== null && (
                                  <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${up ? 'bg-emerald-100 text-emerald-700' : down ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                                    {up ? '↑' : down ? '↓' : '='} {Math.abs(parseFloat(salesDiff))}%
                                  </span>
                                )}
                              </div>
                              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden w-full">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(m.salesA / maxSales) * 100}%` }} />
                              </div>
                            </div>
                            <div className="flex gap-3 flex-shrink-0">
                              <div className="text-center">
                                <p className="text-xs text-indigo-500 font-semibold">{m.leadsA} <span className="text-gray-300">/ {m.leadsB}</span></p>
                                <p className="text-xs text-gray-400">lead</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-emerald-600 font-semibold">{m.salesA} <span className="text-gray-300">/ {m.salesB}</span></p>
                                <p className="text-xs text-gray-400">satış</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-amber-600 font-semibold">%{m.convA} <span className="text-gray-300">/ %{m.convB}</span></p>
                                <p className="text-xs text-gray-400">dönüşüm</p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          })()}

          {/* ── KÂR ANALİZİ ── */}
          {activeTab === 'performans-kar' && (() => {
            const now = new Date()

            // Dönem filtresi — genel ile aynı state paylaşır
            const getPeriodRange = () => {
              const end = new Date(); end.setHours(23,59,59,999)
              if (perfPeriod === 'today') { const s = new Date(); s.setHours(0,0,0,0); return { start: s, end } }
              if (perfPeriod === '7day') { const s = new Date(); s.setDate(s.getDate()-6); s.setHours(0,0,0,0); return { start: s, end } }
              if (perfPeriod === '1month') { const s = new Date(now.getFullYear(), now.getMonth(), 1); return { start: s, end } }
              if (perfPeriod === '3month') { const s = new Date(now.getFullYear(), now.getMonth()-2, 1); return { start: s, end } }
              if (perfPeriod === '6month') { const s = new Date(now.getFullYear(), now.getMonth()-5, 1); return { start: s, end } }
              if (perfPeriod === '1year') { const s = new Date(now.getFullYear(), 0, 1); return { start: s, end } }
              if (perfPeriod === 'custom' && perfStartDate && perfEndDate) {
                const s = new Date(perfStartDate); s.setHours(0,0,0,0)
                const e = new Date(perfEndDate); e.setHours(23,59,59,999)
                return { start: s, end: e }
              }
              return { start: new Date(now.getFullYear(), now.getMonth()-5, 1), end }
            }
            const { start: rangeStart, end: rangeEnd } = getPeriodRange()
            const filteredLeads = leads.filter(l => { const d = new Date(l.created_at); return d >= rangeStart && d <= rangeEnd })
            const soldLeads = filteredLeads.filter(l => l.status === 'procedure_done')

            // Toplam ciro
            const totalRevenue = soldLeads.reduce((s: number, l: any) => s + (l.procedure_amount || 0), 0)

            // Satışçı prim hesabı
            const memberEarnings = teamMembers.map((tm: any) => {
              const branch = branches.find((b: any) => b.id === tm.branch_id)
              const commModel = branch?.commission_model || 'fixed_rate'
              const commValue = tm.commission_value ?? branch?.commission_value ?? 0
              const mSales = soldLeads.filter(l => l.assigned_to === tm.user_id)
              const mRevenue = mSales.reduce((s: number, l: any) => s + (l.procedure_amount || 0), 0)
              const mLeads = filteredLeads.filter(l => l.assigned_to === tm.user_id)

              let prim = 0
              if (commModel === 'fixed_rate') prim = (mRevenue * commValue) / 100
              else if (commModel === 'per_lead') prim = mLeads.length * commValue

              return {
                name: tm.profiles?.full_name || tm.profiles?.email || '—',
                branch: branch?.branch_name || '—',
                leads: mLeads.length,
                sales: mSales.length,
                revenue: mRevenue,
                commModel,
                commValue,
                prim,
              }
            }).sort((a: any, b: any) => b.prim - a.prim)

            const totalPrim = memberEarnings.reduce((s: number, m: any) => s + m.prim, 0)
            const netProfit = totalRevenue - totalPrim

            const periodLabels: any = {
              today: 'Bugün', '7day': 'Son 7 Gün', '1month': 'Bu Ay',
              '3month': 'Son 3 Ay', '6month': 'Son 6 Ay', '1year': 'Bu Yıl', custom: 'Özel Dönem'
            }

            return (
              <div className="space-y-5">

                {/* Dönem Filtresi */}
                <div className="bg-white rounded-2xl border border-gray-100 px-5 py-3.5 flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-medium text-gray-500 flex-shrink-0">Dönem:</span>
                  <div className="flex gap-1 flex-wrap">
                    {[
                      { key: 'today', label: 'Bugün' }, { key: '7day', label: 'Son 7 Gün' },
                      { key: '1month', label: 'Bu Ay' }, { key: '3month', label: 'Son 3 Ay' },
                      { key: '6month', label: 'Son 6 Ay' }, { key: '1year', label: 'Bu Yıl' },
                      { key: 'custom', label: 'Özel' },
                    ].map(p => (
                      <button key={p.key} onClick={() => setPerfPeriod(p.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${perfPeriod === p.key ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                  {perfPeriod === 'custom' && (
                    <div className="flex items-center gap-2 ml-auto">
                      <input type="date" value={perfStartDate} onChange={e => setPerfStartDate(e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      <span className="text-xs text-gray-400">—</span>
                      <input type="date" value={perfEndDate} onChange={e => setPerfEndDate(e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  )}
                </div>

                {/* Ana Özet Kartlar */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl border border-emerald-100 p-5">
                    <p className="text-xs text-gray-400 mb-1">Toplam Ciro</p>
                    <p className="text-3xl font-bold text-emerald-600">₺{totalRevenue.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-1">{soldLeads.length} satış · {periodLabels[perfPeriod]}</p>
                  </div>
                  <div className="bg-gradient-to-br from-rose-50 to-white rounded-2xl border border-rose-100 p-5">
                    <p className="text-xs text-gray-400 mb-1">Toplam Prim</p>
                    <p className="text-3xl font-bold text-rose-500">₺{totalPrim.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-1">{memberEarnings.length} satışçı · komisyon toplamı</p>
                  </div>
                  <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl border border-indigo-100 p-5 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, #4f46e5 1px, transparent 1px)', backgroundSize: '12px 12px' }} />
                    <p className="text-xs text-gray-400 mb-1">Sana Kalan</p>
                    <p className={`text-3xl font-bold ${netProfit >= 0 ? 'text-indigo-600' : 'text-red-500'}`}>₺{netProfit.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {totalRevenue > 0 ? `%${((netProfit / totalRevenue) * 100).toFixed(1)} net oran` : 'Henüz satış yok'}
                    </p>
                  </div>
                </div>

                {/* Görsel Dağılım */}
                {totalRevenue > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <p className="text-sm font-semibold text-gray-900 mb-4">Gelir Dağılımı</p>
                    <div className="h-4 rounded-full overflow-hidden flex">
                      <div className="h-full bg-indigo-500 transition-all" style={{ width: `${(netProfit / totalRevenue) * 100}%` }} title={`Sana kalan: ₺${netProfit.toLocaleString()}`} />
                      <div className="h-full bg-rose-400 transition-all" style={{ width: `${(totalPrim / totalRevenue) * 100}%` }} title={`Primler: ₺${totalPrim.toLocaleString()}`} />
                    </div>
                    <div className="flex gap-6 mt-3">
                      <span className="flex items-center gap-2 text-xs text-gray-500"><span className="w-3 h-3 bg-indigo-500 rounded-sm inline-block" /> Sana kalan %{totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}</span>
                      <span className="flex items-center gap-2 text-xs text-gray-500"><span className="w-3 h-3 bg-rose-400 rounded-sm inline-block" /> Satışçı primleri %{totalRevenue > 0 ? ((totalPrim / totalRevenue) * 100).toFixed(1) : 0}</span>
                    </div>
                  </div>
                )}

                {/* Satışçı Prim Dökümü */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">Satışçı Prim Dökümü</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{periodLabels[perfPeriod]} · komisyon oranlarına göre</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-rose-500">₺{totalPrim.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">toplam prim</p>
                    </div>
                  </div>
                  {memberEarnings.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-10">Henüz satışçı yok.</p>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {memberEarnings.map((m: any, i: number) => {
                        const maxPrim = Math.max(...memberEarnings.map((x: any) => x.prim), 1)
                        return (
                          <div key={i} className="px-6 py-4">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                                <span className="text-blue-600 text-xs font-bold">{m.name.charAt(0)}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">{m.name}</p>
                                <p className="text-xs text-gray-400">{m.branch} · {m.commModel === 'fixed_rate' ? `%${m.commValue} oran` : `₺${m.commValue}/lead`}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-sm font-bold text-rose-500">₺{m.prim.toLocaleString()}</p>
                                <p className="text-xs text-gray-400">prim</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-rose-400 rounded-full" style={{ width: `${(m.prim / maxPrim) * 100}%` }} />
                              </div>
                              <div className="flex gap-3 text-xs text-gray-400 flex-shrink-0">
                                <span>{m.leads} lead</span>
                                <span className="text-emerald-600 font-medium">{m.sales} satış</span>
                                <span>₺{m.revenue.toLocaleString()} ciro</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

              </div>
            )
          })()}

          {/* ── VERİ MERKEZİ ── */}
          {(activeTab === 'veri-yukle' || activeTab === 'veri-setlerim') && (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center"><p className="text-gray-400 text-sm">Veri merkezi yakında gelecek.</p></div>
          )}

          {/* ── AYARLAR ── */}
          {activeTab === 'ayarlar' && (
            <div className="max-w-2xl space-y-5">

              {/* Logo & Profil Başlık */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-5">Firma Profili</h3>
                <div className="flex items-center gap-5 mb-6">
                  <div className="relative flex-shrink-0">
                    {profile?.logo_url ? (
                      <img src={profile.logo_url} alt="Logo" className="w-20 h-20 rounded-2xl object-cover border border-gray-200" />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center border border-indigo-100">
                        <span className="text-indigo-600 text-2xl font-bold">{(profile?.company_name || profile?.full_name || 'F').charAt(0)}</span>
                      </div>
                    )}
                    <label className={`absolute -bottom-2 -right-2 w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center cursor-pointer hover:bg-indigo-700 transition-colors shadow-sm ${logoUploading ? 'opacity-60 pointer-events-none' : ''}`}>
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                      {logoUploading ? (
                        <svg className="animate-spin text-white" width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70"/></svg>
                      ) : (
                        <svg className="text-white" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                      )}
                    </label>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{profile?.company_name || profile?.full_name}</p>
                    <p className="text-sm text-gray-400 mt-0.5">{profile?.email}</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG · Max 2MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input label="Ad Soyad *" value={settingsName} onChange={(e: any) => setSettingsName(e.target.value)} placeholder="Ad Soyad" />
                  <Input label="E-posta" value={profile?.email || ''} readOnly className="opacity-60" />
                  <Input label="Firma Adı" value={settingsCompany} onChange={(e: any) => setSettingsCompany(e.target.value)} placeholder="Firma A.Ş." />
                  <Input label="Telefon" value={settingsPhone} onChange={(e: any) => setSettingsPhone(e.target.value)} placeholder="+90 555 000 0000" />
                  <div className="col-span-2">
                    <Input label="Sektör" value={settingsSector} onChange={(e: any) => setSettingsSector(e.target.value)} placeholder="Estetik, Diş, Emlak..." />
                  </div>
                </div>

                {settingsMsg && (
                  <div className={`mt-4 px-4 py-3 rounded-xl text-sm font-medium ${settingsMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                    {settingsMsg.text}
                  </div>
                )}

                <div className="flex justify-end mt-5">
                  <Btn onClick={handleSaveProfile} disabled={settingsSaving}>
                    {settingsSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                  </Btn>
                </div>
              </div>

              {/* Şifre Değiştir */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-5">Şifre Değiştir</h3>
                <div className="space-y-4">
                  <Input label="Mevcut Şifre" type="password" value={settingsOldPassword} onChange={(e: any) => setSettingsOldPassword(e.target.value)} placeholder="Mevcut şifreniz" />
                  <Input label="Yeni Şifre" type="password" value={settingsNewPassword} onChange={(e: any) => setSettingsNewPassword(e.target.value)} placeholder="En az 6 karakter" />
                  <Input label="Yeni Şifre (Tekrar)" type="password" value={settingsNewPassword2} onChange={(e: any) => setSettingsNewPassword2(e.target.value)} placeholder="Şifreyi tekrar girin" />
                </div>

                {passwordMsg && (
                  <div className={`mt-4 px-4 py-3 rounded-xl text-sm font-medium ${passwordMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                    {passwordMsg.text}
                  </div>
                )}

                <div className="flex justify-end mt-5">
                  <Btn onClick={handleChangePassword} disabled={!settingsOldPassword || !settingsNewPassword || !settingsNewPassword2}>
                    Şifreyi Güncelle
                  </Btn>
                </div>
              </div>

              {/* Plan Bilgisi */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">Abonelik</h3>
                  <span className="text-xs bg-indigo-50 text-indigo-600 font-semibold px-3 py-1 rounded-full">Starter</span>
                </div>
                <p className="text-sm text-gray-400">Plan yükseltme ve fatura detayları için destek ekibiyle iletişime geçin.</p>
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {[
                    { label: 'Şube', value: `${branches.length}`, max: '1', color: 'text-indigo-600' },
                    { label: 'Satışçı', value: `${teamMembers.length}`, max: '3', color: 'text-blue-600' },
                    { label: 'Lead', value: `${leads.length}`, max: '500', color: 'text-emerald-600' },
                  ].map(item => (
                    <div key={item.label} className="bg-gray-50 rounded-xl p-3.5">
                      <div className="flex items-end gap-1 mb-1">
                        <span className={`text-lg font-bold ${item.color}`}>{item.value}</span>
                        <span className="text-xs text-gray-400 mb-0.5">/ {item.max}</span>
                      </div>
                      <p className="text-xs text-gray-400">{item.label}</p>
                      <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full bg-current ${item.color}`} style={{ width: `${Math.min(100, (parseInt(item.value) / parseInt(item.max)) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* ─────────────────── MODALS ─────────────────────── */}

      {/* ── ŞUBE EKLE ── */}
      <Modal open={showAddBranch} onClose={() => setShowAddBranch(false)} title="Yeni Şube" subtitle="Şube bilgilerini girin">
        <form onSubmit={handleAddBranch} className="p-6 space-y-4">
          <Input label="Şube Adı *" value={branchName} onChange={(e: any) => setBranchName(e.target.value)} required placeholder="İstanbul Şubesi" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="İletişim Kişisi" value={branchContact} onChange={(e: any) => setBranchContact(e.target.value)} placeholder="Ad Soyad" />
            <Input label="E-posta" type="email" value={branchEmail} onChange={(e: any) => setBranchEmail(e.target.value)} placeholder="sube@email.com" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Komisyon Modeli" value={commissionModel} onChange={(e: any) => setCommissionModel(e.target.value)}>
              <option value="fixed_rate">Sabit Oran</option>
              <option value="per_lead">Lead Başına</option>
            </Select>
            <Input label="Komisyon Değeri" type="number" value={commissionValue} onChange={(e: any) => setCommissionValue(e.target.value)} placeholder="10" />
          </div>
          <div className="flex gap-3 pt-2">
            <Btn type="button" variant="secondary" className="flex-1" onClick={() => setShowAddBranch(false)}>İptal</Btn>
            <Btn type="submit" className="flex-1" disabled={saving}>{saving ? 'Oluşturuluyor...' : 'Şube Oluştur'}</Btn>
          </div>
        </form>
      </Modal>

      {/* ── ÜYE EKLE ── */}
      <Modal open={showAddMember} onClose={() => setShowAddMember(false)} title="Ekip Üyesi Ekle" subtitle="Yeni satışçı veya yönetici ekleyin">
        <form onSubmit={handleAddMember} className="p-6 space-y-4">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Rol</p>
            <div className="grid grid-cols-2 gap-2">
              {[{ key: 'agent', label: '👤 Satışçı' }, { key: 'manager', label: '👔 Yönetici' }].map(r => (
                <button key={r.key} type="button" onClick={() => setMemberRole(r.key)}
                  className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${memberRole === r.key ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Ad Soyad *" value={memberName} onChange={(e: any) => setMemberName(e.target.value)} required placeholder="Ad Soyad" />
            <Select label="Şube *" value={memberBranch} onChange={(e: any) => setMemberBranch(e.target.value)} required>
              <option value="">Şube seçin...</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="E-posta *" type="email" value={memberEmail} onChange={(e: any) => setMemberEmail(e.target.value)} required placeholder="satis@email.com" />
            <Input label="Şifre *" type="password" value={memberPassword} onChange={(e: any) => setMemberPassword(e.target.value)} required placeholder="En az 6 karakter" />
          </div>
          <Input label="Prim Oranı (%)" type="number" value={memberCommission} onChange={(e: any) => setMemberCommission(e.target.value)} placeholder="10" />
          <div className="flex gap-3 pt-2">
            <Btn type="button" variant="secondary" className="flex-1" onClick={() => setShowAddMember(false)}>İptal</Btn>
            <Btn type="submit" className="flex-1" disabled={saving}>{saving ? 'Ekleniyor...' : 'Üye Ekle'}</Btn>
          </div>
        </form>
      </Modal>

      {/* ── LEAD EKLE ── */}
      <Modal open={showAddLead} onClose={() => setShowAddLead(false)} title="Yeni Lead" subtitle="Manuel lead ekleyin" size="lg">
        <form onSubmit={handleAddLead} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Ad Soyad *" value={leadName} onChange={(e: any) => setLeadName(e.target.value)} required placeholder="Ad Soyad" />
            <Input label="Telefon *" value={leadPhone} onChange={(e: any) => setLeadPhone(e.target.value)} required placeholder="05xx xxx xx xx" />
            <Input label="E-posta" type="email" value={leadEmail} onChange={(e: any) => setLeadEmail(e.target.value)} placeholder="ornek@email.com" />
            <Select label="Şube *" value={leadBranch} onChange={(e: any) => setLeadBranch(e.target.value)} required>
              <option value="">Şube seçin...</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
            </Select>
            <Select label="Kaynak" value={leadSource} onChange={(e: any) => setLeadSource(e.target.value)}>
              <option value="manual">Manuel Giriş</option>
              <option value="meta_form">Meta Form</option>
              <option value="instagram_dm">Instagram DM</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="website">Web Sitesi</option>
              <option value="referral">Referans</option>
            </Select>
            <Select label="Satışçıya Ata" value={leadAssignTo} onChange={(e: any) => setLeadAssignTo(e.target.value)}>
              <option value="">Atama yapma</option>
              {teamMembers.filter(m => m.role === 'agent').map(m => <option key={m.user_id} value={m.user_id}>{m.profiles?.full_name}</option>)}
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Not</label>
            <textarea value={leadNote} onChange={e => setLeadNote(e.target.value)} rows={2} placeholder="Ek not..."
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <Btn type="button" variant="secondary" className="flex-1" onClick={() => setShowAddLead(false)}>İptal</Btn>
            <Btn type="submit" className="flex-1" disabled={saving}>{saving ? 'Ekleniyor...' : 'Lead Ekle'}</Btn>
          </div>
        </form>
      </Modal>

      {/* ── DURUM GÜNCELLE ── */}
      <Modal open={!!selectedLead} onClose={() => setSelectedLead(null)} title={selectedLead?.full_name || 'Lead'} subtitle={`${selectedLead?.lead_code} · Durum güncelle`}>
        <form onSubmit={handleUpdateStatus} className="p-6 space-y-4">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Yeni Durum</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(STATUS_CONFIG).map(([key, val]: any) => (
                <button key={key} type="button" onClick={() => setNewStatus(key)}
                  className={`py-2.5 px-3 rounded-xl text-sm font-medium border-2 transition-all flex items-center gap-2 ${newStatus === key ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                  <span className={`w-2 h-2 rounded-full ${val.dot}`} />{val.label}
                </button>
              ))}
            </div>
          </div>
          {newStatus === 'procedure_done' && (
            <div className="bg-emerald-50 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-emerald-700">Satış Detayları</p>
              <Input label="İşlem Tipi" value={procedureType} onChange={(e: any) => setProcedureType(e.target.value)} placeholder="Örn: Yıllık üyelik" />
              <Input label="Tutar (₺)" type="number" value={procedureAmount} onChange={(e: any) => setProcedureAmount(e.target.value)} placeholder="0" />
            </div>
          )}
          {newStatus === 'appointment_scheduled' && (
            <div className="bg-violet-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-violet-700 mb-2">Randevu Tarihi</p>
              <Input type="datetime-local" value={appointmentDate} onChange={(e: any) => setAppointmentDate(e.target.value)} />
            </div>
          )}
          {newStatus === 'cancelled' && (
            <Input label="İptal Sebebi" value={cancelReason} onChange={(e: any) => setCancelReason(e.target.value)} placeholder="Sebebi yazın..." />
          )}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Not</label>
            <textarea value={statusNote} onChange={e => setStatusNote(e.target.value)} rows={2} placeholder="Görüşme notu..."
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <Btn type="button" variant="secondary" className="flex-1" onClick={() => setSelectedLead(null)}>İptal</Btn>
            <Btn type="submit" className="flex-1" disabled={saving || !newStatus}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Btn>
          </div>
        </form>
      </Modal>

      {/* ── LEAD DETAY ── */}
      <Modal open={showDetailModal} onClose={() => setShowDetailModal(false)} title={detailLead?.full_name || 'Lead Detayı'} subtitle={detailLead?.lead_code} size="lg">
        {detailLead && (
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-3">
              <Badge status={detailLead.status} />
              <SourceBadge source={detailLead.source} />
              {detailLead.procedure_amount > 0 && <span className="text-sm font-semibold text-emerald-600">₺{detailLead.procedure_amount.toLocaleString()}</span>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3.5">
                <p className="text-xs text-gray-400 mb-1">Telefon</p>
                <p className="text-sm font-medium text-gray-900">{detailLead.phone}</p>
              </div>
              {detailLead.email && (
                <div className="bg-gray-50 rounded-xl p-3.5">
                  <p className="text-xs text-gray-400 mb-1">E-posta</p>
                  <p className="text-sm font-medium text-gray-900 truncate">{detailLead.email}</p>
                </div>
              )}
              <div className="bg-gray-50 rounded-xl p-3.5">
                <p className="text-xs text-gray-400 mb-1">Eklenme</p>
                <p className="text-sm font-medium text-gray-900">{new Date(detailLead.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              {detailLead.appointment_at && (
                <div className="bg-violet-50 rounded-xl p-3.5">
                  <p className="text-xs text-violet-400 mb-1">Randevu</p>
                  <p className="text-sm font-medium text-violet-700">{new Date(detailLead.appointment_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              )}
            </div>
            {detailLead.note && (
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                <p className="text-xs font-medium text-amber-600 mb-1">Not</p>
                <p className="text-sm text-gray-700">{detailLead.note}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">İşlem Geçmişi</p>
              {leadHistory.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">Henüz işlem yapılmamış.</p>
              ) : (
                <div className="space-y-2">
                  {leadHistory.map((h, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 mt-2 flex-shrink-0" />
                      <div className="flex-1 bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <Badge status={h.old_status} />
                            <svg className="text-gray-300" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            <Badge status={h.new_status} />
                          </div>
                          <p className="text-xs text-gray-400">{new Date(h.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        {h.note && <p className="text-xs text-gray-600 mt-1">{h.note}</p>}
                        {h.profiles?.full_name && <p className="text-xs text-gray-400 mt-0.5">— {h.profiles.full_name}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Btn className="w-full" onClick={() => { setShowDetailModal(false); setSelectedLead(detailLead); setNewStatus(detailLead.status) }}>
              Durumu Güncelle
            </Btn>
          </div>
        )}
      </Modal>

      {/* ── ÜYE DETAY ── */}
      <Modal open={!!selectedMember} onClose={() => setSelectedMember(null)} title={selectedMember?.profiles?.full_name || 'Ekip Üyesi'} subtitle={selectedMember?.branches?.branch_name} size="lg">
        {selectedMember && (
          <div className="p-6">
            <div className="flex gap-2 mb-5 border-b border-gray-100 pb-4">
              {(['leads', 'hakedis', 'loglar'] as const).map(tab => (
                <button key={tab} onClick={() => setMemberTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${memberTab === tab ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                  {tab === 'leads' ? 'Leadler' : tab === 'hakedis' ? 'Hakediş' : 'Loglar'}
                </button>
              ))}
            </div>
            {memberTab === 'leads' && (
              <div className="space-y-2">
                {leads.filter(l => l.assigned_to === selectedMember.user_id).length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">Lead atanmamış.</p>
                ) : leads.filter(l => l.assigned_to === selectedMember.user_id).map(lead => (
                  <div key={lead.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{lead.full_name}</p>
                      <p className="text-xs text-gray-400">{lead.phone}</p>
                    </div>
                    <Badge status={lead.status} />
                  </div>
                ))}
              </div>
            )}
            {memberTab === 'hakedis' && (
              <div className="space-y-3">
                {(() => {
                  const mLeads = leads.filter(l => l.assigned_to === selectedMember.user_id)
                  const mSales = mLeads.filter(l => l.status === 'procedure_done')
                  const mRevenue = mSales.reduce((s, l) => s + (l.procedure_amount || 0), 0)
                  const commission = mRevenue * ((selectedMember.commission_rate || 0) / 100)
                  return (
                    <>
                      {[
                        { label: 'Toplam Lead', value: mLeads.length, color: 'text-blue-600' },
                        { label: 'Toplam Satış', value: mSales.length, color: 'text-emerald-600' },
                        { label: 'Toplam Ciro', value: `₺${mRevenue.toLocaleString()}`, color: 'text-gray-900' },
                        { label: 'Prim Oranı', value: `%${selectedMember.commission_rate || 0}`, color: 'text-gray-900' },
                        { label: 'Toplam Prim', value: `₺${commission.toLocaleString()}`, color: 'text-indigo-600', highlight: true },
                      ].map(item => (
                        <div key={item.label} className={`flex items-center justify-between px-4 py-3 rounded-xl ${item.highlight ? 'bg-indigo-50' : 'bg-gray-50'}`}>
                          <p className="text-sm text-gray-600">{item.label}</p>
                          <p className={`text-sm font-semibold ${item.color}`}>{item.value}</p>
                        </div>
                      ))}
                    </>
                  )
                })()}
              </div>
            )}
            {memberTab === 'loglar' && <p className="text-gray-400 text-sm text-center py-8">Loglar yakında eklenecek.</p>}
          </div>
        )}
      </Modal>

      {/* ── RAPOR ── */}
      <Modal open={showReportPanel} onClose={() => setShowReportPanel(false)} title="Rapor İndir" subtitle="Filtreleri ayarlayın ve indirin">
        <div className="p-6 space-y-5">
          <Select label="Dönem" value={reportPeriod} onChange={(e: any) => setReportPeriod(e.target.value)}>
            <option value="today">Bugün</option>
            <option value="this_week">Bu Hafta</option>
            <option value="this_month">Bu Ay</option>
            <option value="last_month">Geçen Ay</option>
            <option value="custom">Özel Tarih Aralığı</option>
          </Select>
          {reportPeriod === 'custom' && (
            <div className="grid grid-cols-2 gap-3 bg-indigo-50 rounded-xl p-4">
              <Input label="Başlangıç" type="date" value={reportStartDate} onChange={(e: any) => setReportStartDate(e.target.value)} />
              <Input label="Bitiş" type="date" value={reportEndDate} onChange={(e: any) => setReportEndDate(e.target.value)} />
            </div>
          )}
          <Select label="Durum Filtresi" value={reportStatus} onChange={(e: any) => setReportStatus(e.target.value)}>
            <option value="all">Tüm Durumlar</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]: any) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Format</p>
            <div className="grid grid-cols-2 gap-3">
              {[{ key: 'excel', label: 'Excel', icon: '📗', ext: '.xlsx' }, { key: 'pdf', label: 'PDF', icon: '📕', ext: '.pdf' }].map(f => (
                <button key={f.key} onClick={() => setReportFormat(f.key)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${reportFormat === f.key ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <span className="text-xl block mb-1">{f.icon}</span>
                  <p className={`text-sm font-semibold ${reportFormat === f.key ? 'text-indigo-700' : 'text-gray-700'}`}>{f.label}</p>
                  <p className="text-xs text-gray-400">{f.ext} dosyası</p>
                </button>
              ))}
            </div>
          </div>
          <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl p-4 flex items-center justify-between border border-indigo-100">
            <div>
              <p className="text-xs text-gray-500">Seçilen kriterlere göre</p>
              <p className="text-xl font-bold text-indigo-600 mt-0.5">{getReportLeads().length} <span className="text-sm font-normal text-gray-500">lead</span></p>
            </div>
            <span className="text-3xl">{reportFormat === 'excel' ? '📗' : '📕'}</span>
          </div>
          <div className="flex gap-3">
            <Btn variant="secondary" className="flex-1" onClick={() => setShowReportPanel(false)}>İptal</Btn>
            <Btn variant="success" className="flex-1" onClick={reportFormat === 'excel' ? downloadExcel : downloadPDF} disabled={reportLoading || getReportLeads().length === 0}>
              {reportLoading ? 'Hazırlanıyor...' : `${reportFormat === 'excel' ? '📗' : '📕'} İndir`}
            </Btn>
          </div>
        </div>
      </Modal>

    </div>
  )
}