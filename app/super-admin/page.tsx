'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
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
    key: 'kullanicilar', label: 'Kullanıcılar', icon: '◉', children: [
      { key: 'kullanici-listesi', label: 'Tüm Kullanıcılar' },
      { key: 'kullanici-roller', label: 'Roller & İzinler' },
      { key: 'kullanici-oturumlar', label: 'Oturumlar' },
    ]
  },
  {
    key: 'faturalama', label: 'Faturalama', icon: '◎', children: [
      { key: 'fatura-planlar', label: 'Planlar' },
      { key: 'fatura-abonelikler', label: 'Abonelikler' },
      { key: 'fatura-faturalar', label: 'Faturalar' },
      { key: 'fatura-kullanim', label: 'Kullanım' },
    ]
  },
  {
    key: 'guvenlik', label: 'Güvenlik', icon: '◐', children: [
      { key: 'guvenlik-loglar', label: 'Denetim Logları' },
      { key: 'guvenlik-politikalar', label: 'Politikalar' },
    ]
  },
  {
    key: 'sistem', label: 'Sistem', icon: '◫', children: [
      { key: 'sistem-durum', label: 'Sistem Durumu' },
      { key: 'sistem-loglar', label: 'Loglar' },
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
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['firmalar'])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const [customers, setCustomers] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])

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

  // Onboarding sihirbazı
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
  const [obCreatedUserId, setObCreatedUserId] = useState('')

  const resetOnboarding = () => {
    setOnboardingStep(1); setObName(''); setObEmail(''); setObPassword(''); setObCompany('')
    setObSector(''); setObPhone(''); setObPlan('starter'); setObMonthlyFee('990')
    setObPerBranchFee('0'); setObBranchName(''); setObBranchCity('')
    setObCommissionModel('fixed_rate'); setObInviteLink(''); setObCreatedUserId('')
  }

  const handleOnboardingStep1 = () => {
    if (!obName || !obEmail || !obPassword || !obCompany) { alert('Lütfen zorunlu alanları doldurun.'); return }
    setOnboardingStep(2)
  }

  const handleOnboardingStep2 = () => setOnboardingStep(3)

  const handleOnboardingStep3 = async () => {
    setObSaving(true)
    try {
      // 1. Kullanıcı oluştur
      const { data, error } = await supabase.auth.signUp({
        email: obEmail, password: obPassword,
        options: { data: { full_name: obName, role: 'customer' } }
      })
      if (error) { alert(error.message); setObSaving(false); return }
      const userId = data.user?.id
      if (!userId) { alert('Kullanıcı oluşturulamadı.'); setObSaving(false); return }
      setObCreatedUserId(userId)

      // 2. Profile upsert
      await supabase.from('profiles').upsert({
        id: userId, email: obEmail, full_name: obName, role: 'customer',
        company_name: obCompany, sector: obSector, phone: obPhone, is_active: true
      })

      // 3. Subscription
      await supabase.from('subscriptions').insert({
        owner_id: userId, plan: obPlan, status: 'active',
        monthly_fee: parseFloat(obMonthlyFee) || 0,
        per_branch_fee: parseFloat(obPerBranchFee) || 0,
      })

      // 4. İlk şube
      if (obBranchName) {
        await supabase.from('branches').insert({
          owner_id: userId, branch_name: obBranchName, city: obBranchCity || null,
          commission_model: obCommissionModel, is_active: true
        })
      }

      // 5. Davet linki
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
    setLoading(false)
  }

  const teamMembersBelongTo = (userId: string, branchIds: string[]) => {
    return teamMembers.some(tm => tm.user_id === userId && branchIds.includes(tm.branch_id))
  }

  const toggleMenu = (key: string) => setExpandedMenus(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])

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

  const handleToggleActive = async (customer: any) => {
    await supabase.from('profiles').update({ is_active: !customer.is_active }).eq('id', customer.id); loadData()
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
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-60'} bg-white border-r border-gray-100 flex flex-col fixed top-0 left-0 h-full z-20 transition-all duration-300 shadow-sm`}>
        <div className={`flex items-center h-14 border-b border-gray-100 px-4 ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">D</span>
          </div>
          {!sidebarCollapsed && <span className="font-semibold text-gray-900 text-sm tracking-tight">DataPilot</span>}
          {!sidebarCollapsed ? (
            <button onClick={() => setSidebarCollapsed(true)} className="ml-auto text-gray-300 hover:text-gray-500">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          ) : (
            <button onClick={() => setSidebarCollapsed(false)} className="text-gray-300 hover:text-gray-500">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          )}
        </div>

        {!sidebarCollapsed && (
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs text-gray-400 mb-0.5">Rol</p>
            <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">Super Admin</span>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {menuStructure.map(item => (
            <div key={item.key}>
              <button
                onClick={() => { if (item.children) toggleMenu(item.key); else setActiveTab(item.key) }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all mb-0.5 ${
                  activeTab === item.key && !item.children ? 'bg-indigo-600 text-white font-medium shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}>
                <span className="text-base flex-shrink-0">{item.icon}</span>
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.children && (
                      <svg className={`w-3.5 h-3.5 transition-transform text-gray-400 ${expandedMenus.includes(item.key) ? 'rotate-180' : ''}`} viewBox="0 0 14 14" fill="none"><path d="M4 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    )}
                  </>
                )}
              </button>
              {item.children && expandedMenus.includes(item.key) && !sidebarCollapsed && (
                <div className="ml-3 pl-3 border-l border-gray-100 mb-1">
                  {item.children.map(child => (
                    <button key={child.key} onClick={() => setActiveTab(child.key)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all mb-0.5 ${
                        activeTab === child.key ? 'text-indigo-600 font-medium bg-indigo-50' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                      }`}>
                      {child.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {!sidebarCollapsed && (
          <div className="p-3 border-t border-gray-100">
            <div className="flex items-center gap-2.5 px-2 py-1.5">
              <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
                <span className="text-rose-600 text-xs font-bold">{profile?.full_name?.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-800 truncate">{profile?.full_name}</p>
                <p className="text-xs text-gray-400 truncate">{profile?.email}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* ── MAIN ── */}
      <div className={`${sidebarCollapsed ? 'ml-16' : 'ml-60'} flex-1 transition-all duration-300 min-w-0`}>

        {/* Top bar */}
        <header className="h-14 bg-white border-b border-gray-100 flex items-center px-6 sticky top-0 z-10">
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

        <main className="p-6">

          {/* ── DASHBOARD ── */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-indigo-200 text-sm">Hoş geldin,</p>
                    <h1 className="text-2xl font-bold mt-0.5">{profile?.full_name}</h1>
                    <p className="text-indigo-300 text-sm mt-1">Platform genel durumu</p>
                  </div>
                  <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">Super Admin</span>
                </div>
                <div className="flex gap-8 mt-5 pt-5 border-t border-indigo-500/40">
                  <div><p className="text-3xl font-bold">{customers.length}</p><p className="text-indigo-300 text-xs mt-0.5">Firma</p></div>
                  <div><p className="text-3xl font-bold">{branches.length}</p><p className="text-indigo-300 text-xs mt-0.5">Şube</p></div>
                  <div><p className="text-3xl font-bold">{leads.length}</p><p className="text-indigo-300 text-xs mt-0.5">Lead</p></div>
                  <div><p className="text-3xl font-bold">{allUsers.length}</p><p className="text-indigo-300 text-xs mt-0.5">Kullanıcı</p></div>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Aktif Firma', value: customers.filter(c => c.is_active !== false).length, sub: `${customers.filter(c => c.is_active === false).length} pasif`, color: 'text-indigo-600', bg: 'bg-indigo-50', icon: '◈' },
                  { label: 'Toplam Lead', value: leads.length, sub: `${leads.filter(l => l.status === 'procedure_done').length} satış`, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: '◎' },
                  { label: 'Bekleyen Fatura', value: `₺${pendingInvoicesTotal.toLocaleString()}`, sub: `${invoices.filter(i => i.status === 'pending').length} fatura`, color: 'text-amber-600', bg: 'bg-amber-50', icon: '◐' },
                  { label: 'Tahsil Edilen', value: `₺${paidInvoicesTotal.toLocaleString()}`, sub: 'Bu ay', color: 'text-rose-600', bg: 'bg-rose-50', icon: '◉' },
                ].map(card => (
                  <div key={card.label} className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                    <div className={`w-9 h-9 ${card.bg} rounded-xl flex items-center justify-center text-lg mb-3`}>{card.icon}</div>
                    <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                    <p className="text-xs font-medium text-gray-700 mt-1">{card.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
                  </div>
                ))}
              </div>

              {/* Son firmalar */}
              <div className="bg-white rounded-2xl border border-gray-100">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 text-sm">Son Firmalar</h3>
                  <button onClick={() => setActiveTab('firma-listesi')} className="text-xs text-indigo-600 font-medium">Tümünü gör →</button>
                </div>
                {customers.slice(0, 5).map((c, i) => {
                  const cBranches = branches.filter(b => b.owner_id === c.id).length
                  return (
                    <div key={c.id} className={`px-5 py-3.5 flex items-center gap-3 ${i < Math.min(customers.length, 5) - 1 ? 'border-b border-gray-50' : ''}`}>
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-600 font-semibold text-sm">{(c.company_name || c.full_name || 'F').charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{c.company_name || c.full_name}</p>
                        <p className="text-xs text-gray-400">{c.email} · {cBranches} şube</p>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${c.is_active !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {c.is_active !== false ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                  )
                })}
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
                  const cLeads = leads.filter(l => cBranches.map((b:any) => b.id).includes(l.branch_id)).length
                  const sub = c.subscriptions?.[0]
                  return (
                    <div key={c.id} className={`px-5 py-4 flex items-center gap-4 ${i < filteredCustomers.length - 1 ? 'border-b border-gray-50' : ''}`}>
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-600 font-bold">{(c.company_name || c.full_name || 'F').charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-gray-900 truncate">{c.company_name || c.full_name}</p>
                          {c.sector && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex-shrink-0">{c.sector}</span>}
                        </div>
                        <p className="text-xs text-gray-400">{c.email}</p>
                        <div className="flex gap-3 mt-1.5">
                          <span className="text-xs text-indigo-600 font-medium">{cBranches.length} şube</span>
                          {sub && <span className="text-xs text-gray-400">₺{sub.per_branch_fee}/şube · Plan: {sub.plan}</span>}
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

          {/* ── ONBOARDING SİHİRBAZI SEKME ── */}
          {activeTab === 'firma-onboarding' && (
            <OnboardingWizard
              step={onboardingStep} setStep={setOnboardingStep}
              obName={obName} setObName={setObName}
              obEmail={obEmail} setObEmail={setObEmail}
              obPassword={obPassword} setObPassword={setObPassword}
              obCompany={obCompany} setObCompany={setObCompany}
              obSector={obSector} setObSector={setObSector}
              obPhone={obPhone} setObPhone={setObPhone}
              obPlan={obPlan} setObPlan={setObPlan}
              obMonthlyFee={obMonthlyFee} setObMonthlyFee={setObMonthlyFee}
              obPerBranchFee={obPerBranchFee} setObPerBranchFee={setObPerBranchFee}
              obBranchName={obBranchName} setObBranchName={setObBranchName}
              obBranchCity={obBranchCity} setObBranchCity={setObBranchCity}
              obCommissionModel={obCommissionModel} setObCommissionModel={setObCommissionModel}
              obInviteLink={obInviteLink} obSaving={obSaving}
              onStep1={handleOnboardingStep1}
              onStep2={handleOnboardingStep2}
              onStep3={handleOnboardingStep3}
              onReset={() => { resetOnboarding(); }}
              isModal={false}
            />
          )}

          {/* ── FATURALAR ── */}
          {activeTab === 'fatura-faturalar' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Bekleyen', value: `₺${pendingInvoicesTotal.toLocaleString()}`, count: invoices.filter(i => i.status === 'pending').length, color: 'text-amber-600', bg: 'bg-amber-50' },
                  { label: 'Ödendi', value: `₺${paidInvoicesTotal.toLocaleString()}`, count: invoices.filter(i => i.status === 'paid').length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'Toplam', value: `₺${(pendingInvoicesTotal + paidInvoicesTotal).toLocaleString()}`, count: invoices.length, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                ].map(card => (
                  <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-5">
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

          {/* ── KULLANICILAR HİYERARŞİ ── */}
          {activeTab === 'kullanici-listesi' && !selectedFirmaUser && (
            <div className="space-y-3">
              {/* Özet bar */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Toplam Firma', value: customers.length, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { label: 'Satışçı', value: allUsers.filter(u => ['team','agent'].includes(u.role)).length, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Aktif', value: allUsers.filter(u => u.is_active !== false).length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'Pasif', value: allUsers.filter(u => u.is_active === false).length, color: 'text-gray-500', bg: 'bg-gray-100' },
                ].map(c => (
                  <div key={c.label} className="bg-white rounded-xl border border-gray-100 px-4 py-3">
                    <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{c.label}</p>
                  </div>
                ))}
              </div>

              {/* Admin kullanıcılar */}
              {allUsers.filter(u => u.role === 'super_admin').length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="px-5 py-3 bg-rose-50 border-b border-rose-100 flex items-center gap-2">
                    <span className="w-2 h-2 bg-rose-400 rounded-full" />
                    <p className="text-xs font-semibold text-rose-700">Platform Adminleri</p>
                  </div>
                  {allUsers.filter(u => u.role === 'super_admin').map((u, i, arr) => (
                    <div key={u.id} className={`px-5 py-3.5 flex items-center gap-3 ${i < arr.length - 1 ? 'border-b border-gray-50' : ''}`}>
                      <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-rose-600 text-xs font-bold">{(u.full_name || u.email || 'A').charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{u.full_name || '-'}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                      <span className="text-xs bg-rose-50 text-rose-600 font-medium px-2 py-0.5 rounded-full">Super Admin</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Firmalar + bağlı kullanıcılar */}
              <div className="space-y-2">
                {customers.map(customer => {
                  const cBranches = branches.filter(b => b.owner_id === customer.id)
                  const branchIds = cBranches.map(b => b.id)
                  const cMembers = allUsers.filter(u =>
                    ['team', 'agent'].includes(u.role) && teamMembersBelongTo(u.id, branchIds)
                  )
                  const cLeads = leads.filter(l => branchIds.includes(l.branch_id))
                  const cSales = cLeads.filter(l => l.status === 'procedure_done')
                  const cRevenue = cSales.reduce((s: number, l: any) => s + (l.procedure_amount || 0), 0)

                  return (
                    <div key={customer.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                      {/* Firma header — tıklanabilir */}
                      <button
                        onClick={() => setSelectedFirmaUser(customer)}
                        className="w-full px-5 py-4 flex items-center gap-4 hover:bg-gray-50/70 transition-colors text-left">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center flex-shrink-0">
                          <span className="text-indigo-600 font-bold">{(customer.company_name || customer.full_name || 'F').charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-semibold text-gray-900">{customer.company_name || customer.full_name}</p>
                            {customer.sector && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{customer.sector}</span>}
                          </div>
                          <p className="text-xs text-gray-400">{customer.email}</p>
                          <div className="flex gap-3 mt-1.5">
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

                      {/* Satışçılar — firma altında özet */}
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

          {/* ── FİRMA DETAY — KULLANICI HİYERARŞİ ── */}
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
                {/* Geri butonu */}
                <button onClick={() => { setSelectedFirmaUser(null); setFirmaUserFilter('all') }}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Tüm Firmalar
                </button>

                {/* Firma başlık */}
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-5 text-white relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xl font-bold">{(customer.company_name || customer.full_name || 'F').charAt(0)}</span>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">{customer.company_name || customer.full_name}</h2>
                      <p className="text-indigo-200 text-xs">{customer.email}{customer.sector && ` · ${customer.sector}`}</p>
                    </div>
                    <div className="ml-auto">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={customer.is_active !== false} onChange={() => handleToggleActive(customer)} className="sr-only peer" />
                        <div className="w-10 h-6 bg-white/30 rounded-full peer peer-checked:bg-white transition-colors after:content-[''] after:absolute after:top-1 after:left-1 after:bg-indigo-600 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-6 mt-4 pt-4 border-t border-indigo-500/40">
                    <div><p className="text-2xl font-bold">{cBranches.length}</p><p className="text-indigo-300 text-xs mt-0.5">Şube</p></div>
                    <div><p className="text-2xl font-bold">{cMembers.length}</p><p className="text-indigo-300 text-xs mt-0.5">Satışçı</p></div>
                    <div><p className="text-2xl font-bold">{cLeads.length}</p><p className="text-indigo-300 text-xs mt-0.5">Lead</p></div>
                    <div><p className="text-2xl font-bold">{cSales.length}</p><p className="text-indigo-300 text-xs mt-0.5">Satış</p></div>
                    <div><p className="text-2xl font-bold">₺{(cRevenue/1000).toFixed(0)}K</p><p className="text-indigo-300 text-xs mt-0.5">Ciro</p></div>
                  </div>
                </div>

                {/* Şubeler */}
                <div className="bg-white rounded-2xl border border-gray-100">
                  <div className="px-5 py-3.5 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">Şubeler ({cBranches.length})</p>
                  </div>
                  {cBranches.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-8">Şube yok.</p>
                  ) : cBranches.map((branch: any, i: number) => {
                    const bLeads = cLeads.filter((l: any) => l.branch_id === branch.id)
                    const bSales = bLeads.filter((l: any) => l.status === 'procedure_done').length
                    return (
                      <div key={branch.id} className={`px-5 py-3.5 flex items-center gap-3 ${i < cBranches.length - 1 ? 'border-b border-gray-50' : ''}`}>
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                          <span className="text-indigo-600 text-xs font-bold">{branch.branch_name?.charAt(0)}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{branch.branch_name}</p>
                          <div className="flex gap-3 mt-0.5">
                            <span className="text-xs text-gray-400">{bLeads.length} lead</span>
                            <span className="text-xs text-emerald-600">{bSales} satış</span>
                            <span className="text-xs text-gray-400">%{branch.commission_value} komisyon</span>
                          </div>
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${branch.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                          {branch.is_active ? 'Aktif' : 'Pasif'}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Satışçılar */}
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
                    const mRevenue = mSales.reduce((s: number, l: any) => s + (l.procedure_amount || 0), 0)
                    const conversion = mLeads.length > 0 ? ((mSales.length / mLeads.length) * 100).toFixed(0) : '0'
                    return (
                      <div key={member.id} className={`px-5 py-4 flex items-center gap-4 ${i < filteredMembers.length - 1 ? 'border-b border-gray-50' : ''}`}>
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 font-semibold text-sm">{(member.full_name || 'U').charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{member.full_name || '-'}</p>
                          <p className="text-xs text-gray-400">{member.email}</p>
                          <div className="flex gap-3 mt-1.5">
                            <span className="text-xs text-blue-600 font-medium">{mLeads.length} lead</span>
                            <span className="text-xs text-emerald-600 font-medium">{mSales.length} satış</span>
                            <span className="text-xs text-gray-400">%{conversion} dönüşüm</span>
                            {mRevenue > 0 && <span className="text-xs text-gray-500">₺{mRevenue.toLocaleString()}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${member.is_active !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                            {member.is_active !== false ? 'Aktif' : 'Pasif'}
                          </span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={member.is_active !== false}
                              onChange={async () => { await supabase.from('profiles').update({ is_active: !member.is_active }).eq('id', member.id); loadData() }}
                              className="sr-only peer" />
                            <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-indigo-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                          </label>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Abonelik */}
                {customer.subscriptions?.[0] && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <p className="text-sm font-semibold text-gray-900 mb-3">Abonelik</p>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Plan', value: customer.subscriptions[0].plan, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        { label: 'Aylık Ücret', value: `₺${customer.subscriptions[0].monthly_fee}`, color: 'text-gray-800', bg: 'bg-gray-50' },
                        { label: 'Şube Başı', value: `₺${customer.subscriptions[0].per_branch_fee}`, color: 'text-gray-800', bg: 'bg-gray-50' },
                      ].map(item => (
                        <div key={item.label} className={`${item.bg} rounded-xl p-3.5`}>
                          <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                          <p className={`text-sm font-semibold ${item.color}`}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })()}

          {/* ── KİMLİK TAKLİDİ ── */}
          {activeTab === 'destek-impersonation' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                <div className="text-amber-500 flex-shrink-0 mt-0.5">⚠️</div>
                <div>
                  <p className="text-sm font-semibold text-amber-800">Dikkat</p>
                  <p className="text-xs text-amber-700 mt-0.5">Kimlik taklidi yetkisi yalnızca destek amaçlıdır. Tüm işlemler loglanır.</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100">
                {customers.map((c, i) => (
                  <div key={c.id} className={`px-5 py-3.5 flex items-center justify-between ${i < customers.length - 1 ? 'border-b border-gray-50' : ''}`}>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c.company_name || c.full_name}</p>
                      <p className="text-xs text-gray-400">{c.email}</p>
                    </div>
                    <Btn variant="secondary" size="sm">Giriş Yap</Btn>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── BOŞLAR ── */}
          {!['dashboard', 'firma-listesi', 'fatura-faturalar', 'kullanici-listesi', 'destek-impersonation'].includes(activeTab) && (
            <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl">◌</div>
              <p className="text-gray-500 text-sm font-medium">{getPageTitle()}</p>
              <p className="text-gray-400 text-xs mt-1">Bu sayfa yakında gelecek.</p>
            </div>
          )}

        </main>
      </div>

      {/* ── FİRMA EKLE MODAL ── */}
      <Modal open={showAddCustomer} onClose={resetForm} title="Yeni Firma Ekle" subtitle="Müşteri hesabı oluşturun" size="lg">
        {inviteLink ? (
          <div className="p-6 space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-emerald-800 mb-1">✓ Firma oluşturuldu!</p>
              <p className="text-xs text-emerald-700">Davet linki:</p>
              <p className="text-xs font-mono bg-white border border-emerald-200 rounded-lg px-3 py-2 mt-2 break-all">{inviteLink}</p>
            </div>
            <div className="flex gap-3">
              <Btn variant="secondary" className="flex-1" onClick={() => navigator.clipboard.writeText(inviteLink)}>Kopyala</Btn>
              <Btn className="flex-1" onClick={resetForm}>Tamam</Btn>
            </div>
          </div>
        ) : (
          <form onSubmit={handleAddCustomer} className="p-6 space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Kullanıcı Tipi</p>
              <div className="grid grid-cols-2 gap-2">
                {[{ key: 'customer', label: '🏢 Müşteri Firma' }, { key: 'advertiser', label: '📣 Reklamcı' }].map(t => (
                  <button key={t.key} type="button" onClick={() => setNewUserType(t.key)}
                    className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${newUserType === t.key ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Ad Soyad *" value={newName} onChange={(e: any) => setNewName(e.target.value)} required placeholder="Ad Soyad" />
              <Input label="E-posta *" type="email" value={newEmail} onChange={(e: any) => setNewEmail(e.target.value)} required placeholder="firma@email.com" />
              <Input label="Şifre *" type="password" value={newPassword} onChange={(e: any) => setNewPassword(e.target.value)} required placeholder="En az 6 karakter" />
              <Input label="Firma Adı" value={newCompany} onChange={(e: any) => setNewCompany(e.target.value)} placeholder="Firma Adı A.Ş." />
              <Input label="Sektör" value={newSector} onChange={(e: any) => setNewSector(e.target.value)} placeholder="Estetik, Emlak..." />
              <Input label="Aylık Sabit Ücret (₺)" type="number" value={newMonthlyFee} onChange={(e: any) => setNewMonthlyFee(e.target.value)} placeholder="0" />
              <Input label="Şube Başı Ücret (₺)" type="number" value={newPerBranchFee} onChange={(e: any) => setNewPerBranchFee(e.target.value)} placeholder="0" />
            </div>
            <div className="flex gap-3 pt-2">
              <Btn type="button" variant="secondary" className="flex-1" onClick={resetForm}>İptal</Btn>
              <Btn type="submit" className="flex-1" disabled={saving}>{saving ? 'Oluşturuluyor...' : 'Firma Oluştur'}</Btn>
            </div>
          </form>
        )}
      </Modal>

      {/* ── FİRMA DETAY MODAL ── */}
      <Modal open={showCustomerDetail} onClose={() => setShowCustomerDetail(false)} title={selectedCustomer?.company_name || selectedCustomer?.full_name || 'Firma Detayı'} subtitle={selectedCustomer?.email} size="lg">
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
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Şubeler ({branches.filter(b => b.owner_id === selectedCustomer.id).length})</p>
              {branches.filter(b => b.owner_id === selectedCustomer.id).length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Şube yok.</p>
              ) : branches.filter(b => b.owner_id === selectedCustomer.id).map(branch => (
                <div key={branch.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 mb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{branch.branch_name}</p>
                    <p className="text-xs text-gray-400">{branch.contact_name}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${branch.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                    {branch.is_active ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
              ))}
            </div>
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
                obName={obName} setObName={setObName}
                obEmail={obEmail} setObEmail={setObEmail}
                obPassword={obPassword} setObPassword={setObPassword}
                obCompany={obCompany} setObCompany={setObCompany}
                obSector={obSector} setObSector={setObSector}
                obPhone={obPhone} setObPhone={setObPhone}
                obPlan={obPlan} setObPlan={setObPlan}
                obMonthlyFee={obMonthlyFee} setObMonthlyFee={setObMonthlyFee}
                obPerBranchFee={obPerBranchFee} setObPerBranchFee={setObPerBranchFee}
                obBranchName={obBranchName} setObBranchName={setObBranchName}
                obBranchCity={obBranchCity} setObBranchCity={setObBranchCity}
                obCommissionModel={obCommissionModel} setObCommissionModel={setObCommissionModel}
                obInviteLink={obInviteLink} obSaving={obSaving}
                onStep1={handleOnboardingStep1}
                onStep2={handleOnboardingStep2}
                onStep3={handleOnboardingStep3}
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

// ─── ONBOARDING WIZARD COMPONENT ──────────────────────────────────────────────

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
      {/* Progress steps */}
      <div className={isModal ? 'px-6 pt-4' : 'mb-6'}>
        <div className="flex items-center gap-0">
          {stepLabels.map((label, i) => {
            const idx = i + 1
            const done = step > idx
            const active = step === idx
            return (
              <div key={idx} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                    ${done ? 'bg-emerald-500 text-white' : active ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {done ? '✓' : idx}
                  </div>
                  <p className={`text-xs mt-1 whitespace-nowrap ${active ? 'text-indigo-600 font-medium' : done ? 'text-emerald-600' : 'text-gray-400'}`}>{label}</p>
                </div>
                {i < stepLabels.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 mb-4 ${done ? 'bg-emerald-400' : 'bg-gray-100'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Adım 1: Firma & Kullanıcı */}
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
          <button onClick={onStep1}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
            Devam Et
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      )}

      {/* Adım 2: Plan */}
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
            <button onClick={() => setStep(1)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
              ← Geri
            </button>
            <button onClick={onStep2} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-sm font-semibold transition-colors">
              Devam Et →
            </button>
          </div>
        </div>
      )}

      {/* Adım 3: İlk Şube */}
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
            <button onClick={() => setStep(2)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
              ← Geri
            </button>
            <button onClick={onStep3} disabled={obSaving}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-semibold transition-colors">
              {obSaving ? 'Oluşturuluyor...' : '✓ Firmayı Oluştur'}
            </button>
          </div>
        </div>
      )}

      {/* Adım 4: Tamamlandı */}
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
                <button onClick={() => { navigator.clipboard.writeText(obInviteLink) }}
                  className="px-3 py-2 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap font-medium">
                  Kopyala
                </button>
              </div>
              <p className="text-xs text-indigo-400 mt-2">Firmaya bu linki gönderin, şifrelerini bu linkten ayarlayabilirler.</p>
            </div>
          )}

          <button onClick={onReset}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-sm font-semibold transition-colors">
            {isModal ? 'Kapat' : 'Yeni Firma Ekle'}
          </button>
        </div>
      )}
    </div>
  )
}