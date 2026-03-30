'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const menuStructure = [
  { key: 'dashboard', label: 'Dashboard', icon: '⬡' },
  {
    key: 'firmalar', label: 'Firmalar', icon: '◈', children: [
      { key: 'firma-listesi', label: 'Firma Listesi' },
      { key: 'firma-onboarding', label: 'Onboarding' },
    ]
  },
  {
    key: 'reklamcilar', label: 'Reklamcılar', icon: '◇', children: [
      { key: 'reklamci-listesi', label: 'Reklamcı Listesi' },
      { key: 'reklamci-ekle', label: 'Reklamcı Ekle' },
    ]
  },
  {
    key: 'kullanicilar', label: 'Kullanıcılar', icon: '◉', children: [
      { key: 'kullanici-listesi', label: 'Tüm Kullanıcılar' },
      { key: 'kullanici-roller', label: 'Roller & İzinler' },
    ]
  },
  {
    key: 'faturalama', label: 'Faturalama', icon: '◎', children: [
      { key: 'fatura-planlar', label: 'Planlar' },
      { key: 'fatura-abonelikler', label: 'Abonelikler' },
      { key: 'fatura-faturalar', label: 'Faturalar' },
    ]
  },
  {
    key: 'guvenlik', label: 'Güvenlik', icon: '◐', children: [
      { key: 'guvenlik-loglar', label: 'Denetim Logları' },
    ]
  },
  {
    key: 'destek', label: 'Destek', icon: '◌', children: [
      { key: 'destek-talepler', label: 'Talepler' },
      { key: 'destek-impersonation', label: 'Kimlik Taklidi' },
    ]
  },
  { key: 'ayarlar', label: 'Platform Ayarları', icon: '◍' },
]

// ─── SHARED ───────────────────────────────────────────────────────────────────

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
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 ml-4">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1 1l11 11M12 1L1 12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/></svg>
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
      <select {...props} className="w-full appearance-none px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-9">
        {children}
      </select>
      <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </div>
  </div>
)

const Btn = ({ variant = 'primary', size = 'md', children, className = '', ...props }: any) => {
  const v: any = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm',
    secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200',
    danger: 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    ghost: 'hover:bg-gray-100 text-gray-600',
  }
  const s: any = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2.5 text-sm', lg: 'px-5 py-3 text-sm' }
  return (
    <button {...props} className={`inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all disabled:opacity-50 ${v[variant]} ${s[size]} ${className}`}>
      {children}
    </button>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function SuperAdminPage() {
  const router = useRouter()
  const profileMenuRef = useRef<HTMLDivElement>(null)

  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['firmalar', 'reklamcilar'])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const [customers, setCustomers] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [advertisers, setAdvertisers] = useState<any[]>([])

  // Firma modals
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [showCustomerDetail, setShowCustomerDetail] = useState(false)
  const [selectedFirmaUser, setSelectedFirmaUser] = useState<any>(null)
  const [firmaUserFilter, setFirmaUserFilter] = useState('all')
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newCompany, setNewCompany] = useState('')
  const [newSector, setNewSector] = useState('')
  const [newPerBranchFee, setNewPerBranchFee] = useState('')
  const [newMonthlyFee, setNewMonthlyFee] = useState('')
  const [newUserType, setNewUserType] = useState('customer')
  const [inviteLink, setInviteLink] = useState('')
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [generatingInvoices, setGeneratingInvoices] = useState(false)

  // Reklamcı state
  const [advName, setAdvName] = useState('')
  const [advEmail, setAdvEmail] = useState('')
  const [advPassword, setAdvPassword] = useState('')
  const [advCompany, setAdvCompany] = useState('')
  const [advPhone, setAdvPhone] = useState('')
  const [advMonthlyFee, setAdvMonthlyFee] = useState('990')
  const [advPerClientFee, setAdvPerClientFee] = useState('0')
  const [advSaving, setAdvSaving] = useState(false)
  const [advSuccess, setAdvSuccess] = useState('')
  const [selectedAdvertiser, setSelectedAdvertiser] = useState<any>(null)
  const [advDetailTab, setAdvDetailTab] = useState('genel')
  const [advInvoiceAmount, setAdvInvoiceAmount] = useState('')
  const [advInvoiceNote, setAdvInvoiceNote] = useState('')
  const [advInvoiceDue, setAdvInvoiceDue] = useState('')
  const [advInvoiceSaving, setAdvInvoiceSaving] = useState(false)
  const [advSearchQuery, setAdvSearchQuery] = useState('')

  // Onboarding
  const [showOnboardingModal, setShowOnboardingModal] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(1)
  const [obName, setObName] = useState('')
  const [obEmail, setObEmail] = useState('')
  const [obPassword, setObPassword] = useState('')
  const [obCompany, setObCompany] = useState('')
  const [obSector, setObSector] = useState('')
  const [obPhone, setObPhone] = useState('')
  const [obPlan, setObPlan] = useState('starter')
  const [obMonthlyFee, setObMonthlyFee] = useState('990')
  const [obPerBranchFee, setObPerBranchFee] = useState('0')
  const [obBranchName, setObBranchName] = useState('')
  const [obBranchCity, setObBranchCity] = useState('')
  const [obCommissionModel, setObCommissionModel] = useState('fixed_rate')
  const [obInviteLink, setObInviteLink] = useState('')
  const [obSaving, setObSaving] = useState(false)

  const resetOnboarding = () => {
    setOnboardingStep(1); setObName(''); setObEmail(''); setObPassword(''); setObCompany('')
    setObSector(''); setObPhone(''); setObPlan('starter'); setObMonthlyFee('990')
    setObPerBranchFee('0'); setObBranchName(''); setObBranchCity('')
    setObCommissionModel('fixed_rate'); setObInviteLink('')
  }

  const handleOnboardingStep1 = () => {
    if (!obName || !obEmail || !obPassword || !obCompany) { alert('Lütfen zorunlu alanları doldurun.'); return }
    setOnboardingStep(2)
  }
  const handleOnboardingStep2 = () => setOnboardingStep(3)
  const handleOnboardingStep3 = async () => {
    setObSaving(true)
    try {
      const res = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: obEmail, password: obPassword, full_name: obName,
          company_name: obCompany, sector: obSector, phone: obPhone,
          plan: obPlan, monthly_fee: obMonthlyFee, per_branch_fee: obPerBranchFee,
          branch_name: obBranchName, branch_city: obBranchCity,
          commission_model: obCommissionModel
        })
      })
      const result = await res.json()
      if (result.error) { alert(result.error); setObSaving(false); return }
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36)
      const { data: { user: curUser } } = await supabase.auth.getUser()
      await supabase.from('invitations').insert({ email: obEmail, role: 'customer', token, invited_by: curUser?.id })
      setObInviteLink(`${window.location.origin}/invite?token=${token}`)
      await loadData()
      setOnboardingStep(4)
    } catch (err: any) { alert(err.message) }
    setObSaving(false)
  }

  useEffect(() => {
    loadData()
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) setShowProfileMenu(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (profileData?.role !== 'super_admin') { router.push('/login'); return }
    setProfile(profileData)
    const { data: customersData } = await supabase.from('profiles').select('*, subscriptions(*)').eq('role', 'customer').order('created_at', { ascending: false })
    setCustomers(customersData || [])
    const { data: branchesData } = await supabase.from('branches').select('*')
    setBranches(branchesData || [])
    const { data: leadsData } = await supabase.from('leads').select('id, status, procedure_amount, created_at, branch_id, assigned_to')
    setLeads(leadsData || [])
    const { data: invoicesData } = await supabase.from('invoices').select('*, profiles(full_name, company_name)').order('created_at', { ascending: false })
    setInvoices(invoicesData || [])
    const { data: usersData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setAllUsers(usersData || [])
    const { data: teamMembersData } = await supabase.from('team_members').select('user_id, branch_id')
    setTeamMembers(teamMembersData || [])
    const { data: advertisersData } = await supabase.from('profiles').select('*, advertiser_clients(*), advertiser_subscriptions(*)').eq('role', 'advertiser').order('created_at', { ascending: false })
    setAdvertisers(advertisersData || [])
    setLoading(false)
  }

  const teamMembersBelongTo = (userId: string, branchIds: string[]) =>
    teamMembers.some(tm => tm.user_id === userId && branchIds.includes(tm.branch_id))

  const toggleMenu = (key: string) => setExpandedMenus(prev =>
    prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('invitations').insert({ email: newEmail, role: newUserType, token, invited_by: user?.id })
    if (newUserType === 'customer') {
      const { data, error } = await supabase.auth.signUp({ email: newEmail, password: newPassword, options: { data: { full_name: newName, role: 'customer' } } })
      if (error) { alert(error.message); setSaving(false); return }
      if (data.user) {
        await supabase.from('profiles').upsert({ id: data.user.id, email: newEmail, full_name: newName, role: 'customer', company_name: newCompany, sector: newSector, is_active: true })
        await supabase.from('subscriptions').insert({ owner_id: data.user.id, plan: 'trial', status: 'active', monthly_fee: parseFloat(newMonthlyFee) || 0, per_branch_fee: parseFloat(newPerBranchFee) || 0 })
      }
    }
    setInviteLink(`${window.location.origin}/invite?token=${token}`)
    setSaving(false); loadData()
  }

  const handleToggleActive = async (user: any) => {
    await supabase.from('profiles').update({ is_active: !user.is_active }).eq('id', user.id); loadData()
  }

  const handleGenerateInvoices = async () => {
    setGeneratingInvoices(true)
    const dueDate = new Date(); dueDate.setDate(15)
    for (const customer of customers) {
      const branchCount = branches.filter(b => b.owner_id === customer.id).length
      const perBranchFee = customer.subscriptions?.[0]?.per_branch_fee || 0
      const totalAmount = branchCount * perBranchFee
      if (totalAmount > 0) await supabase.from('invoices').insert({ owner_id: customer.id, branch_count: branchCount, per_branch_fee: perBranchFee, total_amount: totalAmount, status: 'pending', due_date: dueDate.toISOString().split('T')[0] })
    }
    setGeneratingInvoices(false); loadData(); alert('Faturalar oluşturuldu!')
  }

  const handleMarkPaid = async (invoiceId: string) => {
    await supabase.from('invoices').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', invoiceId); loadData()
  }

  const handleAddAdvertiser = async (e: React.FormEvent) => {
    e.preventDefault(); setAdvSaving(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: advEmail, password: advPassword,
        options: { data: { full_name: advName, role: 'advertiser' } }
      })
      if (error) { alert(error.message); setAdvSaving(false); return }
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id, email: advEmail, full_name: advName,
          role: 'advertiser', company_name: advCompany, phone: advPhone, is_active: true
        })
        await supabase.from('advertiser_subscriptions').insert({
          advertiser_id: data.user.id,
          monthly_fee: parseFloat(advMonthlyFee) || 0,
          per_client_fee: parseFloat(advPerClientFee) || 0,
          status: 'active'
        })
        setAdvSuccess(advEmail)
        setAdvName(''); setAdvEmail(''); setAdvPassword(''); setAdvCompany(''); setAdvPhone('')
        setAdvMonthlyFee('990'); setAdvPerClientFee('0')
        loadData()
      }
    } catch (err: any) { alert(err.message) }
    setAdvSaving(false)
  }

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login') }

  const resetForm = () => {
    setInviteLink(''); setShowAddCustomer(false); setNewName(''); setNewEmail('')
    setNewPassword(''); setNewCompany(''); setNewSector(''); setNewPerBranchFee(''); setNewMonthlyFee(''); setNewUserType('customer')
  }

  const filteredCustomers = customers.filter(c =>
    c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredAdvertisers = advertisers.filter(a =>
    a.full_name?.toLowerCase().includes(advSearchQuery.toLowerCase()) ||
    a.company_name?.toLowerCase().includes(advSearchQuery.toLowerCase()) ||
    a.email?.toLowerCase().includes(advSearchQuery.toLowerCase())
  )

  const pendingInvoicesTotal = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + (i.total_amount || 0), 0)
  const paidInvoicesTotal = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total_amount || 0), 0)

  const getPageTitle = () => {
    for (const item of menuStructure) {
      if (item.key === activeTab) return item.label
      if (item.children) { const child = item.children.find(c => c.key === activeTab); if (child) return `${item.label} › ${child.label}` }
    }
    return 'Dashboard'
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center mx-auto mb-3">
          <span className="text-white font-bold text-sm">D</span>
        </div>
        <div className="flex gap-1 justify-center">
          {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── SIDEBAR ── */}
      <aside
        onMouseEnter={() => setSidebarCollapsed(false)}
        onMouseLeave={() => setSidebarCollapsed(true)}
        className={`${sidebarCollapsed ? 'w-16' : 'w-60'} bg-gray-950 border-r border-gray-800 flex flex-col fixed top-0 left-0 h-full z-20 transition-all duration-200 shadow-xl`}>

        {/* Logo */}
        <div className={`flex items-center h-14 border-b border-gray-800 px-4 ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
          <img src="/logo2.png" alt="DataPilot" className="h-7 w-auto flex-shrink-0 object-contain" />
          {!sidebarCollapsed && <span className="font-semibold text-white text-sm tracking-tight truncate">DataPilot</span>}
        </div>

        {/* Rol badge */}
        {!sidebarCollapsed && (
          <div className="px-4 py-3 border-b border-gray-800">
            <span className="text-xs font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
              Super Admin
            </span>
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
                    : item.key === 'reklamcilar'
                    ? 'text-amber-400 hover:bg-amber-500/10 hover:text-amber-300'
                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                }`}>
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
                <div className={`ml-3 pl-3 mb-1 border-l ${item.key === 'reklamcilar' ? 'border-amber-800' : 'border-gray-700'}`}>
                  {item.children.map(child => (
                    <button key={child.key} onClick={() => setActiveTab(child.key)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all mb-0.5 ${
                        activeTab === child.key
                          ? item.key === 'reklamcilar' ? 'text-amber-400 font-medium bg-amber-500/10' : 'text-indigo-400 font-medium bg-indigo-500/10'
                          : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
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
              <div className="w-7 h-7 rounded-lg bg-rose-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-rose-400 text-xs font-bold">{profile?.full_name?.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-300 truncate">{profile?.full_name}</p>
                <p className="text-xs text-gray-600 truncate">{profile?.email}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 border-t border-gray-800">
            <div className="w-7 h-7 rounded-lg bg-rose-500/20 flex items-center justify-center mx-auto">
              <span className="text-rose-400 text-xs font-bold">{profile?.full_name?.charAt(0)}</span>
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
          <div className="ml-auto" ref={profileMenuRef}>
            <div className="relative">
              <button onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 hover:bg-gray-50 rounded-xl px-3 py-1.5 border border-transparent hover:border-gray-200 transition-all">
                <div className="w-6 h-6 rounded-lg bg-rose-100 flex items-center justify-center">
                  <span className="text-rose-600 text-xs font-bold">{profile?.full_name?.charAt(0)}</span>
                </div>
                <span className="text-sm font-medium text-gray-700 hidden md:block">{profile?.full_name}</span>
                <span className="text-xs bg-rose-50 text-rose-600 font-medium px-2 py-0.5 rounded-full hidden md:block">Super Admin</span>
                <svg className="text-gray-400" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50">
                  <div className="px-4 py-2.5 border-b border-gray-100 mb-1">
                    <p className="text-sm font-semibold text-gray-900">{profile?.full_name}</p>
                    <p className="text-xs text-gray-400 truncate">{profile?.email}</p>
                  </div>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M5 11H2.5A1.5 1.5 0 011 9.5v-6A1.5 1.5 0 012.5 2H5M9 9.5l3-3-3-3M12 6.5H5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Çıkış Yap
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f8f7ff 0%, #f0f4ff 50%, #f5f3ff 100%)' }}>
      <main className="p-6 max-w-6xl mx-auto">

          {/* ── DASHBOARD ── */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950 rounded-2xl p-6 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                <div className="absolute -right-8 -top-8 w-40 h-40 bg-indigo-500/10 rounded-full" />
                <div className="flex items-start justify-between relative">
                  <div>
                    <p className="text-gray-400 text-sm">Hoş geldin,</p>
                    <h1 className="text-2xl font-bold mt-0.5">{profile?.full_name}</h1>
                    <p className="text-gray-500 text-sm mt-1">Platform genel durumu · {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</p>
                  </div>
                  <span className="bg-rose-500/20 text-rose-400 text-xs font-semibold px-3 py-1.5 rounded-full border border-rose-500/20">Super Admin</span>
                </div>
                <div className="flex gap-8 mt-5 pt-5 border-t border-white/10 relative">
                  <div><p className="text-3xl font-bold">{customers.length}</p><p className="text-gray-500 text-xs mt-0.5">Firma</p></div>
                  <div><p className="text-3xl font-bold">{advertisers.length}</p><p className="text-amber-400 text-xs mt-0.5">Reklamcı</p></div>
                  <div><p className="text-3xl font-bold">{branches.length}</p><p className="text-gray-500 text-xs mt-0.5">Şube</p></div>
                  <div><p className="text-3xl font-bold">{leads.length}</p><p className="text-gray-500 text-xs mt-0.5">Lead</p></div>
                  <div><p className="text-3xl font-bold">{allUsers.length}</p><p className="text-gray-500 text-xs mt-0.5">Kullanıcı</p></div>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Aktif Firma', value: customers.filter(c => c.is_active !== false).length, sub: `${customers.filter(c => c.is_active === false).length} pasif`, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', icon: '◈' },
                  { label: 'Reklamcı', value: advertisers.length, sub: `${advertisers.filter(a => a.is_active !== false).length} aktif`, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', icon: '◇' },
                  { label: 'Bekleyen Fatura', value: `₺${pendingInvoicesTotal.toLocaleString()}`, sub: `${invoices.filter(i => i.status === 'pending').length} fatura`, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', icon: '◐' },
                  { label: 'Tahsil Edilen', value: `₺${paidInvoicesTotal.toLocaleString()}`, sub: 'Tüm zamanlar', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: '◉' },
                ].map(card => (
                  <div key={card.label} className={`bg-gradient-to-br from-white to-${card.bg.replace('bg-','')} rounded-2xl p-5 border ${card.border} hover:shadow-sm transition-all`}>
                    <div className={`w-9 h-9 ${card.bg} rounded-xl flex items-center justify-center text-lg mb-3`}>{card.icon}</div>
                    <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                    <p className="text-xs font-medium text-gray-700 mt-1">{card.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-5">
                {/* Son firmalar */}
                <div className="bg-white rounded-2xl border border-gray-100">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 text-sm">Son Firmalar</h3>
                    <button onClick={() => setActiveTab('firma-listesi')} className="text-xs text-indigo-600 font-medium">Tümü →</button>
                  </div>
                  {customers.slice(0, 5).map((c, i) => (
                    <div key={c.id} className={`px-5 py-3.5 flex items-center gap-3 ${i < Math.min(customers.length, 5) - 1 ? 'border-b border-gray-50' : ''}`}>
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-600 font-semibold text-xs">{(c.company_name || c.full_name || 'F').charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{c.company_name || c.full_name}</p>
                        <p className="text-xs text-gray-400 truncate">{c.email}</p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${c.is_active !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {c.is_active !== false ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Son reklamcılar */}
                <div className="bg-white rounded-2xl border border-amber-100">
                  <div className="px-5 py-4 border-b border-amber-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                      <span className="w-2 h-2 bg-amber-400 rounded-full" />
                      Reklamcılar
                    </h3>
                    <button onClick={() => setActiveTab('reklamci-listesi')} className="text-xs text-amber-600 font-medium">Tümü →</button>
                  </div>
                  {advertisers.length === 0 ? (
                    <div className="p-10 text-center">
                      <p className="text-gray-400 text-sm">Henüz reklamcı yok.</p>
                      <button onClick={() => setActiveTab('reklamci-ekle')} className="mt-2 text-xs text-amber-600 font-medium hover:underline">Reklamcı Ekle →</button>
                    </div>
                  ) : advertisers.slice(0, 5).map((a, i) => {
                    const clientCount = a.advertiser_clients?.length || 0
                    return (
                      <div key={a.id} className={`px-5 py-3.5 flex items-center gap-3 ${i < Math.min(advertisers.length, 5) - 1 ? 'border-b border-gray-50' : ''}`}>
                        <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                          <span className="text-amber-600 font-semibold text-xs">{(a.company_name || a.full_name || 'R').charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{a.company_name || a.full_name}</p>
                          <p className="text-xs text-gray-400">{clientCount} müşteri</p>
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${a.is_active !== false ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                          {a.is_active !== false ? 'Aktif' : 'Pasif'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── FİRMA LİSTESİ ── */}
          {activeTab === 'firma-listesi' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{filteredCustomers.length} firma</p>
                <Btn size="sm" onClick={() => { resetOnboarding(); setShowOnboardingModal(true) }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/></svg>
                  Firma Ekle
                </Btn>
              </div>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Firma adı veya e-posta ara..."
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {filteredCustomers.length === 0 ? (
                  <div className="p-16 text-center"><p className="text-gray-400 text-sm">Firma bulunamadı.</p></div>
                ) : filteredCustomers.map((c, i) => {
                  const cBranches = branches.filter(b => b.owner_id === c.id)
                  const sub = c.subscriptions?.[0]
                  return (
                    <div key={c.id} className={`px-5 py-4 flex items-center gap-4 hover:bg-gray-50/70 transition-colors ${i < filteredCustomers.length - 1 ? 'border-b border-gray-50' : ''}`}>
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-600 font-bold">{(c.company_name || c.full_name || 'F').charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-gray-900 truncate">{c.company_name || c.full_name}</p>
                          {c.sector && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex-shrink-0">{c.sector}</span>}
                        </div>
                        <p className="text-xs text-gray-400">{c.email}</p>
                        <div className="flex gap-3 mt-1">
                          <span className="text-xs text-indigo-600 font-medium">{cBranches.length} şube</span>
                          {sub && <span className="text-xs text-gray-400">₺{sub.monthly_fee}/ay · Plan: {sub.plan}</span>}
                          <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString('tr-TR')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => { setSelectedCustomer(c); setShowCustomerDetail(true) }}
                          className="text-xs text-indigo-600 font-medium hover:text-indigo-700 px-3 py-1.5 hover:bg-indigo-50 rounded-lg transition-colors">
                          Detay
                        </button>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={c.is_active !== false} onChange={() => handleToggleActive(c)} className="sr-only peer" />
                          <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-indigo-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                        </label>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── ONBOARDING SEKME ── */}
          {activeTab === 'firma-onboarding' && (
            <OnboardingWizard
              step={onboardingStep} setStep={setOnboardingStep}
              obName={obName} setObName={setObName} obEmail={obEmail} setObEmail={setObEmail}
              obPassword={obPassword} setObPassword={setObPassword} obCompany={obCompany} setObCompany={setObCompany}
              obSector={obSector} setObSector={setObSector} obPhone={obPhone} setObPhone={setObPhone}
              obPlan={obPlan} setObPlan={setObPlan} obMonthlyFee={obMonthlyFee} setObMonthlyFee={setObMonthlyFee}
              obPerBranchFee={obPerBranchFee} setObPerBranchFee={setObPerBranchFee}
              obBranchName={obBranchName} setObBranchName={setObBranchName}
              obBranchCity={obBranchCity} setObBranchCity={setObBranchCity}
              obCommissionModel={obCommissionModel} setObCommissionModel={setObCommissionModel}
              obInviteLink={obInviteLink} obSaving={obSaving}
              onStep1={handleOnboardingStep1} onStep2={handleOnboardingStep2} onStep3={handleOnboardingStep3}
              onReset={() => resetOnboarding()} isModal={false}
            />
          )}

       {/* ── REKLAMCI LİSTESİ ── */}
          {activeTab === 'reklamci-listesi' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{filteredAdvertisers.length} reklamcı</p>
                <Btn size="sm" onClick={() => setActiveTab('reklamci-ekle')} className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/></svg>
                  Reklamcı Ekle
                </Btn>
              </div>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                <input value={advSearchQuery} onChange={e => setAdvSearchQuery(e.target.value)} placeholder="Reklamcı ara..."
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>

              {/* Platform Özet */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Toplam Reklamcı', value: advertisers.length, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
                  { label: 'Aktif', value: advertisers.filter(a => a.is_active !== false).length, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                  { label: 'Toplam Müşteri', value: advertisers.reduce((s, a) => s + (a.advertiser_clients?.length || 0), 0), color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
                  { label: 'Aylık Gelir', value: `₺${advertisers.reduce((s, a) => { const sub = (a as any).advertiser_subscriptions?.[0]; return s + (sub?.monthly_fee || 0) + ((a.advertiser_clients?.length || 0) * (sub?.per_client_fee || 0)) }, 0).toLocaleString()}`, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
                ].map(card => (
                  <div key={card.label} className={`${card.bg} border ${card.border} rounded-2xl p-4`}>
                    <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{card.label}</p>
                  </div>
                ))}
              </div>

              {filteredAdvertisers.length === 0 ? (
                <div className="bg-white rounded-2xl border border-amber-100 p-16 text-center">
                  <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">◇</div>
                  <p className="text-gray-500 text-sm font-medium">Henüz reklamcı yok</p>
                  <button onClick={() => setActiveTab('reklamci-ekle')} className="mt-4 text-xs text-amber-600 font-medium hover:underline">Reklamcı Ekle →</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAdvertisers.map((a) => {
                    const clientCount = a.advertiser_clients?.length || 0
                    const sub = (a as any).advertiser_subscriptions?.[0]
                    const monthlyIncome = (sub?.monthly_fee || 0) + clientCount * (sub?.per_client_fee || 0)
                    const advInvoices = (invoices as any[]).filter(inv => inv.owner_id === a.id)
                    const pendingAdv = advInvoices.filter(inv => inv.status === 'pending').reduce((s: number, inv: any) => s + (inv.total_amount || 0), 0)
                    const paidAdv = advInvoices.filter(inv => inv.status === 'paid').reduce((s: number, inv: any) => s + (inv.total_amount || 0), 0)

                    return (
                      <div key={a.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-sm transition-all">
                        {/* Üst satır */}
                        <div className="px-5 py-4 flex items-center gap-4 border-b border-gray-50">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center flex-shrink-0">
                            <span className="text-amber-600 font-bold">{(a.company_name || a.full_name || 'R').charAt(0)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-sm font-semibold text-gray-900 truncate">{a.company_name || a.full_name}</p>
                              <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full flex-shrink-0 font-medium border border-amber-200">Reklamcı</span>
                            </div>
                            <p className="text-xs text-gray-400">{a.email} · {a.phone || '-'}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button onClick={() => setSelectedAdvertiser(a)}
                              className="text-xs text-amber-600 font-medium hover:text-amber-700 px-3 py-1.5 hover:bg-amber-50 rounded-lg transition-colors border border-amber-200">
                              Detay & Fatura
                            </button>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" checked={a.is_active !== false} onChange={() => handleToggleActive(a)} className="sr-only peer" />
                              <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-amber-500 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                            </label>
                          </div>
                        </div>

                        {/* Mali özet */}
                        <div className="px-5 py-3 grid grid-cols-4 gap-3">
                          <div className="text-center">
                            <p className="text-base font-bold text-amber-600">{clientCount}</p>
                            <p className="text-xs text-gray-400">Müşteri</p>
                          </div>
                          <div className="text-center">
                            <p className="text-base font-bold text-indigo-600">₺{(monthlyIncome).toLocaleString()}</p>
                            <p className="text-xs text-gray-400">Aylık Gelir</p>
                          </div>
                          <div className="text-center">
                            <p className="text-base font-bold text-rose-500">₺{pendingAdv.toLocaleString()}</p>
                            <p className="text-xs text-gray-400">Bekleyen</p>
                          </div>
                          <div className="text-center">
                            <p className="text-base font-bold text-emerald-600">₺{paidAdv.toLocaleString()}</p>
                            <p className="text-xs text-gray-400">Tahsil</p>
                          </div>
                        </div>

                        {/* Fiyat bilgisi */}
                        {sub && (
                          <div className="px-5 pb-3 flex items-center gap-3">
                            <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg">₺{sub.monthly_fee}/ay sabit</span>
                            <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg">₺{sub.per_client_fee}/müşteri</span>
                            <span className="text-xs text-gray-400">kayıt: {new Date(a.created_at).toLocaleDateString('tr-TR')}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── REKLAMCI EKLE ── */}
          {activeTab === 'reklamci-ekle' && (
            <div className="max-w-lg mx-auto space-y-5">
              <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-28 h-28 bg-white/10 rounded-full" />
                <div className="relative">
                  <p className="text-amber-100 text-xs mb-1">Reklamcı Paneli</p>
                  <h2 className="text-lg font-bold">Yeni Reklamcı Ekle</h2>
                  <p className="text-amber-100 text-sm mt-1">Reklamcı hesabı oluşturun ve fiyatlandırmasını belirleyin.</p>
                </div>
              </div>

              {advSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1.5 7l3.5 3.5 7.5-7" stroke="#059669" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-emerald-800">Reklamcı oluşturuldu!</p>
                    <p className="text-xs text-emerald-600">{advSuccess} hesabı aktif.</p>
                  </div>
                  <button onClick={() => setAdvSuccess('')} className="text-emerald-400 hover:text-emerald-600">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </button>
                </div>
              )}

              <form onSubmit={handleAddAdvertiser} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Hesap Bilgileri</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Input label="Ad Soyad *" value={advName} onChange={(e: any) => setAdvName(e.target.value)} required placeholder="Ahmet Yılmaz" />
                    </div>
                    <Input label="E-posta *" type="email" value={advEmail} onChange={(e: any) => setAdvEmail(e.target.value)} required placeholder="reklamci@email.com" />
                    <Input label="Şifre *" type="password" value={advPassword} onChange={(e: any) => setAdvPassword(e.target.value)} required placeholder="min. 6 karakter" />
                    <Input label="Firma/Ajans Adı" value={advCompany} onChange={(e: any) => setAdvCompany(e.target.value)} placeholder="Ajans Adı" />
                    <Input label="Telefon" value={advPhone} onChange={(e: any) => setAdvPhone(e.target.value)} placeholder="05XX XXX XXXX" />
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Fiyatlandırma</p>
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-4">
                    <p className="text-xs text-amber-700 font-medium">💡 Reklamcı gelir modeli</p>
                    <p className="text-xs text-amber-600 mt-1">Sabit aylık ücret + sisteme eklediği her müşteri başına ayrı ücret alınır.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Aylık Sabit Ücret (₺)</label>
                      <input type="number" value={advMonthlyFee} onChange={e => setAdvMonthlyFee(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Müşteri Başı Ücret (₺)</label>
                      <input type="number" value={advPerClientFee} onChange={e => setAdvPerClientFee(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                    </div>
                  </div>
                  <div className="mt-3 bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                    <p className="text-xs text-gray-500">Örnek hesap (5 müşteri ile):</p>
                    <p className="text-sm font-bold text-gray-900">
                      ₺{((parseFloat(advMonthlyFee) || 0) + (parseFloat(advPerClientFee) || 0) * 5).toLocaleString()}/ay
                    </p>
                  </div>
                </div>

                <button type="submit" disabled={advSaving}
                  className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                  {advSaving ? 'Oluşturuluyor...' : '✓ Reklamcı Hesabı Oluştur'}
                </button>
              </form>
            </div>
          )}

          {/* ── FATURALAR ── */}
          {activeTab === 'fatura-faturalar' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Bekleyen', value: `₺${pendingInvoicesTotal.toLocaleString()}`, count: invoices.filter(i => i.status === 'pending').length, color: 'text-amber-600', bg: 'from-amber-50 to-white', border: 'border-amber-100' },
                  { label: 'Ödendi', value: `₺${paidInvoicesTotal.toLocaleString()}`, count: invoices.filter(i => i.status === 'paid').length, color: 'text-emerald-600', bg: 'from-emerald-50 to-white', border: 'border-emerald-100' },
                  { label: 'Toplam', value: `₺${(pendingInvoicesTotal + paidInvoicesTotal).toLocaleString()}`, count: invoices.length, color: 'text-indigo-600', bg: 'from-indigo-50 to-white', border: 'border-indigo-100' },
                ].map(card => (
                  <div key={card.label} className={`bg-gradient-to-br ${card.bg} rounded-2xl border ${card.border} p-5`}>
                    <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
                    <p className="text-xs font-medium text-gray-700 mt-1">{card.label}</p>
                    <p className="text-xs text-gray-400">{card.count} fatura</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <Btn variant="success" size="sm" onClick={handleGenerateInvoices} disabled={generatingInvoices}>
                  {generatingInvoices ? 'Oluşturuluyor...' : '+ Fatura Oluştur'}
                </Btn>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {invoices.length === 0 ? (
                  <div className="p-16 text-center"><p className="text-gray-400 text-sm">Henüz fatura yok.</p></div>
                ) : invoices.map((inv, i) => (
                  <div key={inv.id} className={`px-5 py-4 flex items-center gap-4 ${i < invoices.length - 1 ? 'border-b border-gray-50' : ''}`}>
                    <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="#94a3b8" strokeWidth="1.25"/><path d="M5 6h6M5 9h4" stroke="#94a3b8" strokeWidth="1.25" strokeLinecap="round"/></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{inv.profiles?.company_name || inv.profiles?.full_name}</p>
                      <p className="text-xs text-gray-400">{inv.branch_count} şube · ₺{inv.per_branch_fee}/şube · Vade: {inv.due_date ? new Date(inv.due_date).toLocaleDateString('tr-TR') : '-'}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <p className="text-sm font-semibold text-gray-900">₺{inv.total_amount?.toLocaleString()}</p>
                      {inv.status === 'pending' ? (
                        <button onClick={() => handleMarkPaid(inv.id)} className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium px-3 py-1.5 rounded-lg transition-colors">Ödendi</button>
                      ) : (
                        <span className="text-xs bg-emerald-50 text-emerald-600 font-medium px-2.5 py-1 rounded-full">✓ Ödendi</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── KULLANICILAR ── */}
          {activeTab === 'kullanici-listesi' && !selectedFirmaUser && (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Toplam Firma', value: customers.length, color: 'text-indigo-600' },
                  { label: 'Reklamcı', value: advertisers.length, color: 'text-amber-600' },
                  { label: 'Satışçı', value: allUsers.filter(u => ['team','agent'].includes(u.role)).length, color: 'text-blue-600' },
                  { label: 'Aktif', value: allUsers.filter(u => u.is_active !== false).length, color: 'text-emerald-600' },
                ].map(c => (
                  <div key={c.label} className="bg-white rounded-xl border border-gray-100 px-4 py-3">
                    <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{c.label}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                {customers.map(customer => {
                  const cBranches = branches.filter(b => b.owner_id === customer.id)
                  const branchIds = cBranches.map(b => b.id)
                  const cMembers = allUsers.filter(u => ['team', 'agent'].includes(u.role) && teamMembersBelongTo(u.id, branchIds))
                  const cLeads = leads.filter(l => branchIds.includes(l.branch_id))
                  const cRevenue = cLeads.filter(l => l.status === 'procedure_done').reduce((s: number, l: any) => s + (l.procedure_amount || 0), 0)

                  return (
                    <div key={customer.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                      <button onClick={() => setSelectedFirmaUser(customer)}
                        className="w-full px-5 py-4 flex items-center gap-4 hover:bg-gray-50/70 transition-colors text-left">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center flex-shrink-0">
                          <span className="text-indigo-600 font-bold">{(customer.company_name || customer.full_name || 'F').charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{customer.company_name || customer.full_name}</p>
                          <div className="flex gap-3 mt-1">
                            <span className="text-xs text-indigo-600 font-medium">{cBranches.length} şube</span>
                            <span className="text-xs text-blue-600 font-medium">{cMembers.length} satışçı</span>
                            <span className="text-xs text-gray-400">{cLeads.length} lead</span>
                            {cRevenue > 0 && <span className="text-xs text-emerald-600 font-medium">₺{cRevenue.toLocaleString()}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${customer.is_active !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                            {customer.is_active !== false ? 'Aktif' : 'Pasif'}
                          </span>
                          <svg className="text-gray-300" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                      </button>
                      {cMembers.length > 0 && (
                        <div className="border-t border-gray-50 px-5 py-2 bg-gray-50/50 flex gap-2 flex-wrap">
                          {cMembers.slice(0, 4).map(m => (
                            <span key={m.id} className="inline-flex items-center gap-1 text-xs text-gray-500 bg-white border border-gray-200 rounded-lg px-2 py-1">
                              <span className="w-4 h-4 bg-blue-100 text-blue-600 rounded font-bold text-xs flex items-center justify-center">{(m.full_name || 'U').charAt(0)}</span>
                              {m.full_name || m.email}
                            </span>
                          ))}
                          {cMembers.length > 4 && <span className="text-xs text-gray-400 self-center">+{cMembers.length - 4} daha</span>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── FİRMA DETAY ── */}
          {activeTab === 'kullanici-listesi' && selectedFirmaUser && (() => {
            const customer = selectedFirmaUser
            const cBranches = branches.filter(b => b.owner_id === customer.id)
            const branchIds = cBranches.map((b: any) => b.id)
            const cLeads = leads.filter((l: any) => branchIds.includes(l.branch_id))
            const cSales = cLeads.filter((l: any) => l.status === 'procedure_done')
            const cRevenue = cSales.reduce((s: number, l: any) => s + (l.procedure_amount || 0), 0)
            const cMembers = allUsers.filter(u => ['team', 'agent'].includes(u.role) && teamMembersBelongTo(u.id, branchIds))
            const filteredMembers = firmaUserFilter === 'all' ? cMembers
              : firmaUserFilter === 'active' ? cMembers.filter(m => m.is_active !== false)
              : cMembers.filter(m => m.is_active === false)

            return (
              <div className="space-y-4">
                <button onClick={() => { setSelectedFirmaUser(null); setFirmaUserFilter('all') }}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Tüm Kullanıcılar
                </button>
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-5 text-white relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                  <div className="flex items-center gap-4 relative">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xl font-bold">{(customer.company_name || customer.full_name || 'F').charAt(0)}</span>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">{customer.company_name || customer.full_name}</h2>
                      <p className="text-indigo-200 text-xs">{customer.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-6 mt-4 pt-4 border-t border-indigo-500/40 relative">
                    <div><p className="text-2xl font-bold">{cBranches.length}</p><p className="text-indigo-300 text-xs mt-0.5">Şube</p></div>
                    <div><p className="text-2xl font-bold">{cMembers.length}</p><p className="text-indigo-300 text-xs mt-0.5">Satışçı</p></div>
                    <div><p className="text-2xl font-bold">{cLeads.length}</p><p className="text-indigo-300 text-xs mt-0.5">Lead</p></div>
                    <div><p className="text-2xl font-bold">{cSales.length}</p><p className="text-indigo-300 text-xs mt-0.5">Satış</p></div>
                    <div><p className="text-2xl font-bold">₺{(cRevenue/1000).toFixed(0)}K</p><p className="text-indigo-300 text-xs mt-0.5">Ciro</p></div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100">
                  <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">Satışçılar ({cMembers.length})</p>
                    <div className="flex gap-1">
                      {[{ key: 'all', label: 'Tümü' }, { key: 'active', label: 'Aktif' }, { key: 'passive', label: 'Pasif' }].map(f => (
                        <button key={f.key} onClick={() => setFirmaUserFilter(f.key)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${firmaUserFilter === f.key ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-100'}`}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {filteredMembers.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-8">Satışçı yok.</p>
                  ) : filteredMembers.map((member: any, i: number) => {
                    const mLeads = cLeads.filter((l: any) => l.assigned_to === member.id)
                    const mSales = mLeads.filter((l: any) => l.status === 'procedure_done')
                    return (
                      <div key={member.id} className={`px-5 py-3.5 flex items-center gap-4 ${i < filteredMembers.length - 1 ? 'border-b border-gray-50' : ''}`}>
                        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 font-semibold text-sm">{(member.full_name || 'U').charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{member.full_name || '-'}</p>
                          <p className="text-xs text-gray-400">{member.email}</p>
                          <div className="flex gap-3 mt-1">
                            <span className="text-xs text-blue-600 font-medium">{mLeads.length} lead</span>
                            <span className="text-xs text-emerald-600 font-medium">{mSales.length} satış</span>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                          <input type="checkbox" checked={member.is_active !== false}
                            onChange={async () => { await supabase.from('profiles').update({ is_active: !member.is_active }).eq('id', member.id); loadData() }}
                            className="sr-only peer" />
                          <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-indigo-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                        </label>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}

          {/* ── KİMLİK TAKLİDİ ── */}
          {/* ── FATURA PLANLAR ── */}
          {activeTab === 'fatura-planlar' && (
            <div className="space-y-4 max-w-3xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Abonelik Planları</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Platform'da sunulan paketler</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'trial', label: 'Deneme', price: '₺0', period: '14 gün', color: 'border-gray-200', badge: 'bg-gray-100 text-gray-600', features: ['Tüm özellikler açık', '1 şube', '3 kullanıcı', '500 lead/ay', 'Destek yok'] },
                  { key: 'starter', label: 'Starter', price: '₺990', period: '/ay', color: 'border-indigo-200', badge: 'bg-indigo-50 text-indigo-700', features: ['1 şube', '3 kullanıcı', '500 lead/ay', 'Email destek', 'Meta entegrasyon'] },
                  { key: 'pro', label: 'Pro', price: '₺2.490', period: '/ay', color: 'border-violet-200', badge: 'bg-violet-50 text-violet-700', features: ['5 şube', '15 kullanıcı', 'Sınırsız lead', 'Öncelikli destek', 'Tüm entegrasyonlar'] },
                  { key: 'enterprise', label: 'Enterprise', price: '₺4.990+', period: '/ay', color: 'border-amber-200', badge: 'bg-amber-50 text-amber-700', features: ['Sınırsız şube', 'Sınırsız kullanıcı', 'Sınırsız lead', '7/24 destek', 'AI rapor dahil', 'Özel entegrasyon'] },
                ].map(plan => (
                  <div key={plan.key} className={`bg-white rounded-2xl border-2 ${plan.color} p-5`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${plan.badge}`}>{plan.label}</span>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900">{plan.price}</p>
                        <p className="text-xs text-gray-400">{plan.period}</p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {plan.features.map(f => (
                        <div key={f} className="flex items-center gap-2">
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1.5 6l3 3 6-6" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          <span className="text-xs text-gray-600">{f}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs text-gray-400">{customers.filter(c => c.subscriptions?.[0]?.plan === plan.key).length} firma</span>
                      <span className="text-xs font-semibold text-gray-500">aktif</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* ── FATURA ABONELİKLER ── */}
          {activeTab === 'fatura-abonelikler' && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Toplam Abonelik', value: customers.length, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { label: 'Trial', value: customers.filter(c => c.subscriptions?.[0]?.plan === 'trial').length, color: 'text-gray-600', bg: 'bg-gray-100' },
                  { label: 'Starter', value: customers.filter(c => c.subscriptions?.[0]?.plan === 'starter').length, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { label: 'Pro+', value: customers.filter(c => ['pro','enterprise'].includes(c.subscriptions?.[0]?.plan)).length, color: 'text-violet-600', bg: 'bg-violet-50' },
                ].map(c => (
                  <div key={c.label} className="bg-white rounded-xl border border-gray-100 px-4 py-3">
                    <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{c.label}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <div className="grid grid-cols-6 gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <div className="col-span-2">Firma</div>
                    <div>Plan</div>
                    <div className="text-right">Aylık (₺)</div>
                    <div className="text-right">Şube</div>
                    <div className="text-right">Durum</div>
                  </div>
                </div>
                {customers.map((c, i) => {
                  const sub = c.subscriptions?.[0]
                  const cBranchCount = branches.filter((b: any) => b.owner_id === c.id).length
                  return (
                    <div key={c.id} className={`px-5 py-3.5 grid grid-cols-6 gap-2 items-center ${i < customers.length - 1 ? 'border-b border-gray-50' : ''} hover:bg-gray-50/50 transition-colors`}>
                      <div className="col-span-2 flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                          <span className="text-indigo-600 text-xs font-bold">{(c.company_name || c.full_name || 'F').charAt(0)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{c.company_name || c.full_name}</p>
                          <p className="text-xs text-gray-400 truncate">{c.email}</p>
                        </div>
                      </div>
                      <div>
                        <select
                          value={sub?.plan || 'trial'}
                          onChange={async (e) => {
                            if (sub?.id) {
                              await supabase.from('subscriptions').update({ plan: e.target.value }).eq('id', sub.id)
                            } else {
                              await supabase.from('subscriptions').insert({ owner_id: c.id, plan: e.target.value, status: 'active', monthly_fee: 0, per_branch_fee: 0 })
                            }
                            loadData()
                          }}
                          className={`text-xs font-semibold px-2 py-1 rounded-lg border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                            sub?.plan === 'enterprise' ? 'bg-amber-50 text-amber-700' :
                            sub?.plan === 'pro' ? 'bg-violet-50 text-violet-700' :
                            sub?.plan === 'starter' ? 'bg-indigo-50 text-indigo-700' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                          <option value="trial">trial</option>
                          <option value="starter">starter</option>
                          <option value="pro">pro</option>
                          <option value="enterprise">enterprise</option>
                        </select>
                      </div>
                      <div className="text-right">
                        <input
                          type="number"
                          defaultValue={sub?.monthly_fee || 0}
                          onBlur={async (e) => {
                            if (sub?.id) {
                              await supabase.from('subscriptions').update({ monthly_fee: parseFloat(e.target.value) || 0 }).eq('id', sub.id)
                              loadData()
                            }
                          }}
                          className="w-20 text-right text-sm font-semibold text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-indigo-500 focus:outline-none transition-colors"
                        />
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-gray-500">{cBranchCount}</span>
                      </div>
                      <div className="text-right">
                        <button
                          onClick={() => handleToggleActive(c)}
                          className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                            c.is_active !== false
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}>
                          {c.is_active !== false ? 'Aktif' : 'Pasif'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── KİMLİK TAKLİDİ ── */}
          {activeTab === 'destek-impersonation' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                <span className="text-amber-500 flex-shrink-0 mt-0.5">⚠️</span>
                <div>
                  <p className="text-sm font-semibold text-amber-800">Dikkat</p>
                  <p className="text-xs text-amber-700 mt-0.5">Kimlik taklidi yetkisi yalnızca destek amaçlıdır. Tüm işlemler loglanır.</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100">
                {customers.map((c, i) => (
                  <div key={c.id} className={`px-5 py-3.5 flex items-center justify-between ${i < customers.length - 1 ? 'border-b border-gray-50' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-600 text-xs font-bold">{(c.company_name || c.full_name || 'F').charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{c.company_name || c.full_name}</p>
                        <p className="text-xs text-gray-400">{c.email}</p>
                      </div>
                    </div>
                    <Btn variant="secondary" size="sm">Giriş Yap</Btn>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── DESTEK TALEPLERİ ── */}
          {activeTab === 'destek-talepler' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Açık Talepler', value: 0, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
                  { label: 'İşlemde', value: 0, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
                  { label: 'Çözüldü', value: 0, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                ].map(c => (
                  <div key={c.label} className={`${c.bg} border ${c.border} rounded-2xl p-4 text-center`}>
                    <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{c.label}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-xl">◌</div>
                <p className="text-gray-500 text-sm font-medium">Destek talep sistemi</p>
                <p className="text-gray-400 text-xs mt-1">Müşterilerden gelen talepler burada görünecek.</p>
              </div>
            </div>
          )}

          {/* ── GÜVENLİK LOGLAR ── */}
          {activeTab === 'guvenlik-loglar' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Denetim Logları</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Son 30 günlük işlem geçmişi</p>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full font-medium">
                    {allUsers.length} kullanıcı
                  </span>
                </div>
                {/* Son kayıt olan kullanıcıları log gibi göster */}
                {allUsers.slice(0, 10).map((u, i) => (
                  <div key={u.id} className={`px-5 py-3.5 flex items-center gap-3 ${i < Math.min(allUsers.length, 10) - 1 ? 'border-b border-gray-50' : ''}`}>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${u.role === 'super_admin' ? 'bg-rose-400' : u.role === 'customer' ? 'bg-indigo-400' : u.role === 'advertiser' ? 'bg-amber-400' : 'bg-blue-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{u.full_name || u.email}</p>
                      <p className="text-xs text-gray-400">{u.email} · {u.role}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.is_active !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                        {u.is_active !== false ? 'Aktif' : 'Pasif'}
                      </span>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(u.created_at).toLocaleDateString('tr-TR')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* ── BOŞLAR ── */}
         {!['dashboard','firma-listesi','firma-onboarding','reklamci-listesi','reklamci-ekle','fatura-faturalar','fatura-planlar','fatura-abonelikler','kullanici-listesi','destek-impersonation','destek-talepler','guvenlik-loglar'].includes(activeTab) && (
            <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl">◌</div>
              <p className="text-gray-500 text-sm font-medium">{getPageTitle()}</p>
              <p className="text-gray-400 text-xs mt-1">Bu sayfa yakında gelecek.</p>
            </div>
          )}

        </main>
        </div>
      </div>

    {/* ── REKLAMCI DETAY MODAL ── */}
      <Modal open={!!selectedAdvertiser} onClose={() => { setSelectedAdvertiser(null); setAdvDetailTab('genel') }}
        title={selectedAdvertiser?.company_name || selectedAdvertiser?.full_name || 'Reklamcı'}
        subtitle={selectedAdvertiser?.email} size="xl">
        {selectedAdvertiser && (() => {

          const sub = (selectedAdvertiser as any).advertiser_subscriptions?.[0]
          const clientCount = selectedAdvertiser.advertiser_clients?.length || 0
          const monthlyIncome = (sub?.monthly_fee || 0) + clientCount * (sub?.per_client_fee || 0)
          const advInvoices = (invoices as any[]).filter(inv => inv.owner_id === selectedAdvertiser.id)
          const pendingTotal = advInvoices.filter(inv => inv.status === 'pending').reduce((s: number, inv: any) => s + (inv.total_amount || 0), 0)
          const paidTotal = advInvoices.filter(inv => inv.status === 'paid').reduce((s: number, inv: any) => s + (inv.total_amount || 0), 0)
        
          return (
            <div className="p-6 space-y-5">
              {/* Tab bar */}
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                {[
                  { key: 'genel', label: 'Genel Bilgi' },
                  { key: 'mali', label: 'Mali Durum' },
                  { key: 'fatura', label: 'Fatura Kes' },
                  { key: 'gecmis', label: 'Geçmiş' },
                ].map(tab => (
                  <button key={tab.key} onClick={() => setAdvDetailTab(tab.key)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${advDetailTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* GENEL BİLGİ */}
              {advDetailTab === 'genel' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Ad Soyad', value: selectedAdvertiser.full_name },
                      { label: 'E-posta', value: selectedAdvertiser.email },
                      { label: 'Telefon', value: selectedAdvertiser.phone || '-' },
                      { label: 'Firma', value: selectedAdvertiser.company_name || '-' },
                      { label: 'Kayıt Tarihi', value: new Date(selectedAdvertiser.created_at).toLocaleDateString('tr-TR') },
                      { label: 'Durum', value: selectedAdvertiser.is_active !== false ? 'Aktif' : 'Pasif' },
                    ].map(item => (
                      <div key={item.label} className="bg-gray-50 rounded-xl p-3.5">
                        <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                        <p className="text-sm font-medium text-gray-900">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  {sub && (
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                      <p className="text-xs font-semibold text-amber-700 mb-3">Abonelik Planı</p>
                      <div className="grid grid-cols-3 gap-3">
                        <div><p className="text-xs text-amber-500">Aylık Sabit</p><p className="text-sm font-bold text-amber-800">₺{sub.monthly_fee}</p></div>
                        <div><p className="text-xs text-amber-500">Müşteri Başı</p><p className="text-sm font-bold text-amber-800">₺{sub.per_client_fee}</p></div>
                        <div><p className="text-xs text-amber-500">Aktif Müşteri</p><p className="text-sm font-bold text-amber-800">{clientCount}</p></div>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Btn variant="danger" className="flex-1" onClick={() => handleToggleActive(selectedAdvertiser)}>
                      {selectedAdvertiser.is_active !== false ? 'Pasife Al' : 'Aktife Al'}
                    </Btn>
                    <Btn variant="secondary" className="flex-1" onClick={() => { setSelectedAdvertiser(null); setAdvDetailTab('genel') }}>Kapat</Btn>
                  </div>
                </div>
              )}

              {/* MALİ DURUM */}
              {advDetailTab === 'mali' && (
                <div className="space-y-4">
                  {/* Özet kartlar */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                      <p className="text-xs text-gray-400 mb-1">Aylık Gelir (Tahmin)</p>
                      <p className="text-2xl font-bold text-indigo-600">₺{monthlyIncome.toLocaleString()}</p>
                      <p className="text-xs text-gray-400 mt-1">₺{sub?.monthly_fee || 0} sabit + {clientCount} müşteri × ₺{sub?.per_client_fee || 0}</p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                      <p className="text-xs text-gray-400 mb-1">Yıllık Gelir (Tahmin)</p>
                      <p className="text-2xl font-bold text-emerald-600">₺{(monthlyIncome * 12).toLocaleString()}</p>
                      <p className="text-xs text-gray-400 mt-1">Mevcut plan üzerinden</p>
                    </div>
                    <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
                      <p className="text-xs text-gray-400 mb-1">Bekleyen Fatura</p>
                      <p className="text-2xl font-bold text-rose-500">₺{pendingTotal.toLocaleString()}</p>
                      <p className="text-xs text-gray-400 mt-1">{advInvoices.filter(i => i.status === 'pending').length} fatura</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                      <p className="text-xs text-gray-400 mb-1">Toplam Tahsil</p>
                      <p className="text-2xl font-bold text-gray-700">₺{paidTotal.toLocaleString()}</p>
                      <p className="text-xs text-gray-400 mt-1">{advInvoices.filter(i => i.status === 'paid').length} fatura</p>
                    </div>
                  </div>

                  {/* Gelir dağılımı çubuğu */}
                  {(pendingTotal + paidTotal) > 0 && (
                    <div className="bg-white border border-gray-100 rounded-xl p-4">
                      <p className="text-xs font-semibold text-gray-500 mb-3">Tahsilat Durumu</p>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
                        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${((paidTotal / (paidTotal + pendingTotal)) * 100)}%` }} />
                        <div className="h-full bg-rose-400 transition-all" style={{ width: `${((pendingTotal / (paidTotal + pendingTotal)) * 100)}%` }} />
                      </div>
                      <div className="flex gap-4 mt-2">
                        <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" />Tahsil %{(paidTotal + pendingTotal) > 0 ? ((paidTotal / (paidTotal + pendingTotal)) * 100).toFixed(0) : 0}</span>
                        <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-2.5 h-2.5 bg-rose-400 rounded-sm" />Bekleyen %{(paidTotal + pendingTotal) > 0 ? ((pendingTotal / (paidTotal + pendingTotal)) * 100).toFixed(0) : 0}</span>
                      </div>
                    </div>
                  )}

                  <Btn className="w-full" onClick={() => setAdvDetailTab('fatura')}>
                    + Yeni Fatura Kes
                  </Btn>
                </div>
              )}

              {/* FATURA KES */}
              {advDetailTab === 'fatura' && (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                    <p className="text-xs font-semibold text-amber-700 mb-1">Fatura Bilgisi</p>
                    <p className="text-xs text-amber-600">Aylık plan: <strong>₺{sub?.monthly_fee || 0}</strong> sabit + <strong>{clientCount}</strong> müşteri × <strong>₺{sub?.per_client_fee || 0}</strong> = <strong>₺{monthlyIncome.toLocaleString()}</strong></p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Fatura Tutarı (₺) *</label>
                      <input type="number" value={advInvoiceAmount} onChange={e => setAdvInvoiceAmount(e.target.value)}
                        placeholder={monthlyIncome.toString()}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                      <button onClick={() => setAdvInvoiceAmount(monthlyIncome.toString())}
                        className="mt-1 text-xs text-amber-600 hover:underline">Aylık tutarı otomatik doldur (₺{monthlyIncome.toLocaleString()})</button>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Vade Tarihi</label>
                      <input type="date" value={advInvoiceDue} onChange={e => setAdvInvoiceDue(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Not (opsiyonel)</label>
                      <textarea value={advInvoiceNote} onChange={e => setAdvInvoiceNote(e.target.value)} rows={2}
                        placeholder="Örn: Mart 2025 aylık hizmet bedeli"
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none" />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Btn variant="secondary" className="flex-1" onClick={() => setAdvDetailTab('mali')}>İptal</Btn>
                    <button onClick={async () => {
                      if (!advInvoiceAmount) return
                      setAdvInvoiceSaving(true)
                      await supabase.from('invoices').insert({
                        owner_id: selectedAdvertiser.id,
                        total_amount: parseFloat(advInvoiceAmount),
                        status: 'pending',
                        due_date: advInvoiceDue || null,
                        note: advInvoiceNote || null,
                        branch_count: clientCount,
                        per_branch_fee: sub?.per_client_fee || 0,
                      })
                      setAdvInvoiceAmount(''); setAdvInvoiceNote(''); setAdvInvoiceDue('')
                      setAdvInvoiceSaving(false)
                      await loadData()
                      setAdvDetailTab('gecmis')
                    }} disabled={advInvoiceSaving || !advInvoiceAmount}
                      className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
                      {advInvoiceSaving ? 'Kaydediliyor...' : '✓ Fatura Kes'}
                    </button>
                  </div>
                </div>
              )}

              {/* GEÇMİŞ */}
              {advDetailTab === 'gecmis' && (
                <div className="space-y-3">
                  {advInvoices.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-gray-400 text-sm">Henüz fatura yok.</p>
                      <button onClick={() => setAdvDetailTab('fatura')} className="mt-2 text-xs text-amber-600 hover:underline font-medium">Fatura Kes →</button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {advInvoices.map((inv: any) => (
                        <div key={inv.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${inv.status === 'paid' ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                            {inv.status === 'paid'
                              ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1.5 7l3.5 3.5 7.5-7" stroke="#059669" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              : <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 4v4M7 10v.5" stroke="#e11d48" strokeWidth="1.5" strokeLinecap="round"/></svg>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">₺{inv.total_amount?.toLocaleString()}</p>
                            {inv.note && <p className="text-xs text-gray-500 truncate">{inv.note}</p>}
                            <p className="text-xs text-gray-400">
                              {inv.due_date ? `Vade: ${new Date(inv.due_date).toLocaleDateString('tr-TR')}` : new Date(inv.created_at).toLocaleDateString('tr-TR')}
                            </p>
                          </div>
                          {inv.status === 'pending' ? (
                            <button onClick={async () => { await handleMarkPaid(inv.id); await loadData() }}
                              className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium px-3 py-1.5 rounded-lg transition-colors border border-emerald-200">
                              Ödendi
                            </button>
                          ) : (
                            <span className="text-xs bg-emerald-50 text-emerald-600 font-medium px-2.5 py-1 rounded-full">✓ Ödendi</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })()}
      </Modal>

      {/* ── FİRMA DETAY MODAL ── */}
      <Modal open={showCustomerDetail} onClose={() => setShowCustomerDetail(false)}
        title={selectedCustomer?.company_name || selectedCustomer?.full_name || 'Firma Detayı'}
        subtitle={selectedCustomer?.email} size="lg">
        {selectedCustomer && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Ad Soyad', value: selectedCustomer.full_name },
                { label: 'E-posta', value: selectedCustomer.email },
                { label: 'Sektör', value: selectedCustomer.sector || '-' },
                { label: 'Kayıt Tarihi', value: new Date(selectedCustomer.created_at).toLocaleDateString('tr-TR') },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 rounded-xl p-3.5">
                  <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                  <p className="text-sm font-medium text-gray-900">{item.value}</p>
                </div>
              ))}
            </div>
            {selectedCustomer.subscriptions?.[0] && (
              <div className="bg-indigo-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-indigo-700 mb-3">Abonelik</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Plan', value: selectedCustomer.subscriptions[0].plan },
                    { label: 'Aylık Ücret', value: `₺${selectedCustomer.subscriptions[0].monthly_fee}` },
                    { label: 'Şube/Ücret', value: `₺${selectedCustomer.subscriptions[0].per_branch_fee}` },
                  ].map(item => (
                    <div key={item.label}>
                      <p className="text-xs text-indigo-400">{item.label}</p>
                      <p className="text-sm font-semibold text-indigo-800">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <Btn variant="danger" className="flex-1" onClick={() => { handleToggleActive(selectedCustomer); setShowCustomerDetail(false) }}>
                {selectedCustomer.is_active !== false ? 'Pasife Al' : 'Aktife Al'}
              </Btn>
              <Btn className="flex-1" onClick={() => setShowCustomerDetail(false)}>Kapat</Btn>
            </div>
          </div>
        )}
      </Modal>

      {/* ── ONBOARDING MODAL ── */}
      {showOnboardingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { if (onboardingStep === 4) { setShowOnboardingModal(false); resetOnboarding() } }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between p-6 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Yeni Firma Onboarding</h2>
                <p className="text-xs text-gray-400 mt-0.5">Adım {Math.min(onboardingStep, 4)} / 4</p>
              </div>
              <button onClick={() => { setShowOnboardingModal(false); resetOnboarding() }}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1 1l11 11M12 1L1 12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              <OnboardingWizard
                step={onboardingStep} setStep={setOnboardingStep}
                obName={obName} setObName={setObName} obEmail={obEmail} setObEmail={setObEmail}
                obPassword={obPassword} setObPassword={setObPassword} obCompany={obCompany} setObCompany={setObCompany}
                obSector={obSector} setObSector={setObSector} obPhone={obPhone} setObPhone={setObPhone}
                obPlan={obPlan} setObPlan={setObPlan} obMonthlyFee={obMonthlyFee} setObMonthlyFee={setObMonthlyFee}
                obPerBranchFee={obPerBranchFee} setObPerBranchFee={setObPerBranchFee}
                obBranchName={obBranchName} setObBranchName={setObBranchName}
                obBranchCity={obBranchCity} setObBranchCity={setObBranchCity}
                obCommissionModel={obCommissionModel} setObCommissionModel={setObCommissionModel}
                obInviteLink={obInviteLink} obSaving={obSaving}
                onStep1={handleOnboardingStep1} onStep2={handleOnboardingStep2} onStep3={handleOnboardingStep3}
                onReset={() => { resetOnboarding(); setShowOnboardingModal(false) }}
                isModal={true}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

// ─── ONBOARDING WIZARD ────────────────────────────────────────────────────────

function OnboardingWizard({ step, setStep, obName, setObName, obEmail, setObEmail, obPassword, setObPassword, obCompany, setObCompany, obSector, setObSector, obPhone, setObPhone, obPlan, setObPlan, obMonthlyFee, setObMonthlyFee, obPerBranchFee, setObPerBranchFee, obBranchName, setObBranchName, obBranchCity, setObBranchCity, obCommissionModel, setObCommissionModel, obInviteLink, obSaving, onStep1, onStep2, onStep3, onReset, isModal }: any) {

  const PLANS = [
    { key: 'starter', label: 'Starter', price: '₺990', desc: '3 kullanıcı · 1 şube · 500 lead/ay', color: 'border-indigo-500 bg-indigo-50' },
    { key: 'pro', label: 'Pro', price: '₺2.490', desc: '15 kullanıcı · 5 şube · sınırsız lead', color: 'border-violet-500 bg-violet-50' },
    { key: 'enterprise', label: 'Enterprise', price: '₺4.990+', desc: 'Sınırsız her şey · AI rapor dahil', color: 'border-amber-500 bg-amber-50' },
    { key: 'trial', label: 'Deneme', price: 'Ücretsiz', desc: '14 gün · tüm özellikler', color: 'border-gray-300 bg-gray-50' },
  ]

  const SECTORS = ['Estetik Klinik', 'Diş Kliniği', 'Saç Ekim', 'Güzellik Merkezi', 'Medikal Estetik', 'Dermatoloji', 'Ortopedi', 'Göz Hastalıkları', 'Diğer']
  const stepLabels = ['Firma Bilgileri', 'Plan & Fiyat', 'İlk Şube', 'Tamamlandı']
  const wrapClass = isModal ? 'p-6 space-y-5' : 'space-y-5'

  return (
    <div className={isModal ? '' : 'max-w-lg'}>
      <div className={isModal ? 'px-6 pt-4' : 'mb-6'}>
        <div className="flex items-center gap-0">
          {stepLabels.map((label, i) => {
            const idx = i + 1; const done = step > idx; const active = step === idx
            return (
              <div key={idx} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${done ? 'bg-emerald-500 text-white' : active ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {done ? '✓' : idx}
                  </div>
                  <p className={`text-xs mt-1 whitespace-nowrap ${active ? 'text-indigo-600 font-medium' : done ? 'text-emerald-600' : 'text-gray-400'}`}>{label}</p>
                </div>
                {i < stepLabels.length - 1 && <div className={`flex-1 h-0.5 mx-1 mb-4 ${done ? 'bg-emerald-400' : 'bg-gray-100'}`} />}
              </div>
            )
          })}
        </div>
      </div>

      {step === 1 && (
        <div className={wrapClass}>
          <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
            <p className="text-xs font-semibold text-indigo-700 mb-0.5">👤 Hesap Sahibi Bilgileri</p>
            <p className="text-xs text-indigo-400">Firmanın giriş yapacağı kullanıcı hesabı</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Ad Soyad *</label>
              <input value={obName} onChange={e => setObName(e.target.value)} placeholder="Ahmet Yılmaz"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">E-posta *</label>
              <input type="email" value={obEmail} onChange={e => setObEmail(e.target.value)} placeholder="firma@email.com"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Telefon</label>
              <input value={obPhone} onChange={e => setObPhone(e.target.value)} placeholder="05XX XXX XX XX"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Şifre *</label>
              <input type="password" value={obPassword} onChange={e => setObPassword(e.target.value)} placeholder="min. 6 karakter"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Şirket Adı *</label>
              <input value={obCompany} onChange={e => setObCompany(e.target.value)} placeholder="Klinik Adı"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Sektör</label>
              <div className="relative">
                <select value={obSector} onChange={e => setObSector(e.target.value)}
                  className="w-full appearance-none px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-9">
                  <option value="">Seçiniz</option>
                  {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
          </div>
          <button onClick={onStep1} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
            Devam Et <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      )}

      {step === 2 && (
        <div className={wrapClass}>
          <div className="bg-violet-50 rounded-xl p-4 border border-violet-100">
            <p className="text-xs font-semibold text-violet-700 mb-0.5">💳 Plan & Fiyatlandırma</p>
            <p className="text-xs text-violet-400">{obCompany} için abonelik planı seçin</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {PLANS.map(plan => (
              <button key={plan.key} onClick={() => {
                setObPlan(plan.key)
                if (plan.key === 'starter') setObMonthlyFee('990')
                else if (plan.key === 'pro') setObMonthlyFee('2490')
                else if (plan.key === 'enterprise') setObMonthlyFee('4990')
                else setObMonthlyFee('0')
              }}
                className={`p-4 rounded-xl border-2 text-left transition-all ${obPlan === plan.key ? plan.color + ' border-2' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                <p className="text-sm font-bold text-gray-900">{plan.label}</p>
                <p className="text-base font-bold text-indigo-600 mt-1">{plan.price}<span className="text-xs font-normal text-gray-400">/ay</span></p>
                <p className="text-xs text-gray-400 mt-1">{plan.desc}</p>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Aylık Ücret (₺)</label>
              <input type="number" value={obMonthlyFee} onChange={e => setObMonthlyFee(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Şube Başı Ücret (₺)</label>
              <input type="number" value={obPerBranchFee} onChange={e => setObPerBranchFee(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">← Geri</button>
            <button onClick={onStep2} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-sm font-semibold transition-colors">Devam Et →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className={wrapClass}>
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
            <p className="text-xs font-semibold text-emerald-700 mb-0.5">🏢 İlk Şube Kurulumu</p>
            <p className="text-xs text-emerald-400">İsteğe bağlı — sonradan da eklenebilir</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Şube Adı</label>
              <input value={obBranchName} onChange={e => setObBranchName(e.target.value)} placeholder="örn. Merkez Şube"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Şehir</label>
              <input value={obBranchCity} onChange={e => setObBranchCity(e.target.value)} placeholder="İstanbul"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Komisyon Modeli</label>
              <div className="relative">
                <select value={obCommissionModel} onChange={e => setObCommissionModel(e.target.value)}
                  className="w-full appearance-none px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-9">
                  <option value="fixed_rate">Sabit Oran (%)</option>
                  <option value="per_lead">Lead Başı (₺)</option>
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">← Geri</button>
            <button onClick={onStep3} disabled={obSaving}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-semibold transition-colors">
              {obSaving ? 'Oluşturuluyor...' : '✓ Firmayı Oluştur'}
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className={isModal ? 'p-6 space-y-5' : 'space-y-5'}>
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M6 16l7 7L26 9" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">Firma Oluşturuldu! 🎉</h3>
            <p className="text-sm text-gray-400 mt-1">{obCompany} başarıyla platforma eklendi.</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            {[
              { label: 'Firma', value: obCompany },
              { label: 'E-posta', value: obEmail },
              { label: 'Plan', value: obPlan },
              obBranchName ? { label: 'İlk Şube', value: obBranchName } : null,
            ].filter(Boolean).map((item: any) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{item.label}</span>
                <span className="text-xs font-semibold text-gray-700">{item.value}</span>
              </div>
            ))}
          </div>
          {obInviteLink && (
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
              <p className="text-xs font-semibold text-indigo-700 mb-2">🔗 Davet Linki</p>
              <div className="flex items-center gap-2">
                <input readOnly value={obInviteLink}
                  className="flex-1 text-xs bg-white border border-indigo-200 rounded-lg px-3 py-2 text-gray-600 truncate focus:outline-none" />
                <button onClick={() => navigator.clipboard.writeText(obInviteLink)}
                  className="px-3 py-2 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                  Kopyala
                </button>
              </div>
            </div>
          )}
          <button onClick={onReset} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-sm font-semibold transition-colors">
            {isModal ? 'Kapat' : 'Yeni Firma Ekle'}
          </button>
        </div>
      )}
    </div>
  )
}