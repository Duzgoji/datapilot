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
    console.log('teamMembers count:', teamMembers.length, 'userId:', userId, 'branchIds:', branchIds)
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
                <Btn size="sm" onClick={() => setShowAddCustomer(true)}>
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
                  const cBranches = branches.filter(b => b.owner_id === c.id).length
                  const cLeads = leads.filter(() => false).length
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
                          <span className="text-xs text-indigo-600 font-medium">{cBranches} şube</span>
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

    </div>
  )
}