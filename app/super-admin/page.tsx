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
      { key: 'firma-mali', label: 'Mali Yönetim' },
    ]
  },
  {
    key: 'reklamcilar', label: 'Reklamcılar', icon: '◇', children: [
      { key: 'reklamci-listesi', label: 'Reklamcı Listesi' },
      { key: 'reklamci-ekle', label: 'Reklamcı Ekle' },
      { key: 'reklamci-mali', label: 'Mali Yönetim' },
    ]
  },
  {
    key: 'faturalama', label: 'Faturalama', icon: '◎', children: [
      { key: 'fatura-planlar', label: 'Planlar' },
      { key: 'fatura-abonelikler', label: 'Abonelikler' },
    ]
  },
  { key: 'guvenlik-loglar', label: 'Denetim Logları', icon: '◐' },
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
  /** Firma listesinde platform müşterileri vs reklamcı üzerinden eklenenler */
  const [firmaSourceFilter, setFirmaSourceFilter] = useState<'all' | 'platform' | 'advertiser'>('all')
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
  const [expandedAdvertiser, setExpandedAdvertiser] = useState<string | null>(null)
  const [advInvoiceAmount, setAdvInvoiceAmount] = useState('')
  const [advInvoiceNote, setAdvInvoiceNote] = useState('')
  const [advInvoiceDue, setAdvInvoiceDue] = useState('')
  const [advInvoiceSaving, setAdvInvoiceSaving] = useState(false)
  const [advSearchQuery, setAdvSearchQuery] = useState('')
  const [advSubs, setAdvSubs] = useState<any[]>([])
  const [custDetailTab, setCustDetailTab] = useState('genel')
  const [custInvoiceAmount, setCustInvoiceAmount] = useState('')
  const [custInvoiceNote, setCustInvoiceNote] = useState('')
  const [custInvoiceDue, setCustInvoiceDue] = useState('')
  const [custInvoiceSaving, setCustInvoiceSaving] = useState(false)

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
    console.log('profile role:', profileData?.role, 'user id:', user.id)
    setProfile(profileData)
   const { data: customersData } = await supabase
  .from('profiles')
  .select('*')
  .eq('role', 'customer')
  .order('created_at', { ascending: false })
const { data: subsData } = await supabase
  .from('subscriptions')
  .select('*')

const customersWithSubs = (customersData || []).map(c => ({
  ...c,
  subscriptions: (subsData || []).filter(s => s.owner_id === c.id)
}))
setCustomers(customersWithSubs)
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
    const { data: { session } } = await supabase.auth.getSession()
const advRes = await fetch('/api/get-advertisers', {
  headers: { 'Authorization': `Bearer ${session?.access_token}` }
})
    const advJson = await advRes.json()
    setAdvertisers(advJson.data || [])
    setLoading(false)
    const { data: advSubsData } = await supabase.from('advertiser_subscriptions').select('*')
    setAdvSubs(advSubsData || [])
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
      const res = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
},
        body: JSON.stringify({
          email: advEmail, password: advPassword, full_name: advName,
          company_name: advCompany, phone: advPhone,
          role: 'advertiser',
          adv_monthly_fee: advMonthlyFee,
          adv_per_client_fee: advPerClientFee,
        })
      })
      const result = await res.json()
      if (result.error) { alert(result.error); setAdvSaving(false); return }
      setAdvSuccess(advEmail)
      setAdvName(''); setAdvEmail(''); setAdvPassword(''); setAdvCompany(''); setAdvPhone('')
      setAdvMonthlyFee('990'); setAdvPerClientFee('0')
      loadData()
    } catch (err: any) { alert(err.message) }
    setAdvSaving(false)
  }

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login') }

  const resetForm = () => {
    setInviteLink(''); setShowAddCustomer(false); setNewName(''); setNewEmail('')
    setNewPassword(''); setNewCompany(''); setNewSector(''); setNewPerBranchFee(''); setNewMonthlyFee(''); setNewUserType('customer')
  }

 const filteredCustomers = customers.filter(c => {
  if (!searchQuery) return true
  const q = searchQuery.toLowerCase()
  return (
    c.full_name?.toLowerCase().includes(q) ||
    c.company_name?.toLowerCase().includes(q) ||
    c.email?.toLowerCase().includes(q)
  )
})

  const advertiserLinkedProfileIds = new Set<string>()
  advertisers.forEach((a: any) => {
    (a.advertiser_clients || []).forEach((ac: any) => {
      if (ac.client_id) advertiserLinkedProfileIds.add(ac.client_id)
    })
  })

  const getAdvertiserForCustomerProfile = (profileId: string) => {
    for (const a of advertisers) {
      const found = (a.advertiser_clients || []).find((ac: any) => ac.client_id === profileId)
      if (found) return a.company_name || a.full_name || a.email
    }
    return null
  }

  const directCustomers = filteredCustomers.filter(c => !advertiserLinkedProfileIds.has(c.id))
  const viaAdvertiserCustomers = filteredCustomers.filter(c => advertiserLinkedProfileIds.has(c.id))

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
              {activeTab === 'dashboard' && (() => {
  const directCustomerRevenue = directCustomers.reduce((sum, c) => {
    return sum + (c.subscriptions?.[0]?.monthly_fee || 0)
  }, 0)

  const advertiserRevenue = advertisers.reduce((sum, a) => {
    const sub = advSubs.find(s => s.advertiser_id === a.id)
    const clientCount = a.advertiser_clients?.length || 0
    return sum + (sub?.monthly_fee || 0) + (clientCount * (sub?.per_client_fee || 0))
  }, 0)

  const totalMRR = directCustomerRevenue + advertiserRevenue
  const pendingTotal = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + (i.total_amount || 0), 0)
  const paidTotal = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total_amount || 0), 0)
  const today = new Date()
  const overdueInvoices = invoices.filter(i => i.status === 'pending' && i.due_date && new Date(i.due_date) < today)
  const pendingInvoices = invoices.filter(i => i.status === 'pending' && (!i.due_date || new Date(i.due_date) >= today))

  return (
    <div className="space-y-6">

      {/* Karşılama */}
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
          <div><p className="text-3xl font-bold">{leads.length}</p><p className="text-gray-500 text-xs mt-0.5">Potansiyel Müşteri</p></div>
          <div><p className="text-3xl font-bold">{allUsers.length}</p><p className="text-gray-500 text-xs mt-0.5">Kullanıcı</p></div>
        </div>
      </div>

      {/* Finansal Özet */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Finansal Özet</h2>
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'Toplam Aylık Tekrarlayan Gelir', value: `₺${totalMRR.toLocaleString()}`, sub: 'Tüm kaynaklar', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
            { label: 'Firma Geliri', value: `₺${directCustomerRevenue.toLocaleString()}`, sub: `${directCustomers.length} direkt firma`, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
            { label: 'Reklamcı Geliri', value: `₺${advertiserRevenue.toLocaleString()}`, sub: `${advertisers.length} reklamcı`, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
            { label: 'Bekleyen Tahsilat', value: `₺${pendingTotal.toLocaleString()}`, sub: `${invoices.filter(i => i.status === 'pending').length} fatura`, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
            { label: 'Tahsil Edilen', value: `₺${paidTotal.toLocaleString()}`, sub: 'Tüm zamanlar', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          ].map(card => (
            <div key={card.label} className={`${card.bg} border ${card.border} rounded-2xl p-4`}>
              <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
              <p className="text-xs font-medium text-gray-700 mt-1">{card.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Firmalar Mali Tablosu */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Firmalar Mali Durumu</h2>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <div className="grid grid-cols-5 gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <div className="col-span-2">Firma</div>
              <div>Plan</div>
              <div className="text-right">Aylık Ücret</div>
              <div className="text-right">Son Fatura</div>
            </div>
          </div>
          {directCustomers.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">Direkt firma yok.</div>
          ) : directCustomers.map((c, i) => {
            const sub = c.subscriptions?.[0]
            const lastInvoice = invoices
              .filter(inv => inv.owner_id === c.id)
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
            const planCfg: any = {
              trial: 'bg-gray-100 text-gray-500',
              starter: 'bg-indigo-50 text-indigo-700',
              pro: 'bg-violet-50 text-violet-700',
              enterprise: 'bg-amber-50 text-amber-700',
            }
            return (
              <div key={c.id} className={`px-5 py-3.5 grid grid-cols-5 gap-2 items-center ${i < directCustomers.length - 1 ? 'border-b border-gray-50' : ''} hover:bg-gray-50/50 transition-colors`}>
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
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${planCfg[sub?.plan || 'trial']}`}>
                    {sub?.plan || 'trial'}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">₺{(sub?.monthly_fee || 0).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  {!lastInvoice ? (
                    <span className="text-xs text-gray-300">Fatura yok</span>
                  ) : lastInvoice.status === 'paid' ? (
                    <span className="text-xs bg-emerald-50 text-emerald-600 font-medium px-2 py-0.5 rounded-full">✓ Ödendi</span>
                  ) : (
                    <span className="text-xs bg-amber-50 text-amber-600 font-medium px-2 py-0.5 rounded-full">Bekliyor</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Reklamcılar Mali Tablosu */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Reklamcılar Mali Durumu</h2>
        <div className="bg-white rounded-2xl border border-amber-100 overflow-hidden">
          <div className="px-5 py-3 bg-amber-50/50 border-b border-amber-100">
            <div className="grid grid-cols-6 gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <div className="col-span-2">Reklamcı</div>
              <div className="text-right">Sabit Ücret</div>
              <div className="text-right">Müşteri</div>
              <div className="text-right">Müşteri Başı</div>
              <div className="text-right">Toplam Aylık</div>
            </div>
          </div>
          {advertisers.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">Reklamcı yok.</div>
          ) : advertisers.map((a, i) => {
            const sub = advSubs.find(s => s.advertiser_id === a.id)
            const clientCount = a.advertiser_clients?.length || 0
            const monthlyTotal = (sub?.monthly_fee || 0) + clientCount * (sub?.per_client_fee || 0)
            const lastInvoice = invoices
              .filter(inv => inv.owner_id === a.id)
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
            return (
              <div key={a.id} className={`px-5 py-3.5 grid grid-cols-6 gap-2 items-center ${i < advertisers.length - 1 ? 'border-b border-gray-50' : ''} hover:bg-amber-50/20 transition-colors`}>
                <div className="col-span-2 flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-amber-600 text-xs font-bold">{(a.company_name || a.full_name || 'R').charAt(0)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{a.company_name || a.full_name}</p>
                    <p className="text-xs text-gray-400 truncate">{a.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-700">₺{(sub?.monthly_fee || 0).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-700">{clientCount}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-700">₺{(sub?.per_client_fee || 0).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-amber-600">₺{monthlyTotal.toLocaleString()}</p>
                  {lastInvoice && (
                    <span className={`text-xs font-medium ${lastInvoice.status === 'paid' ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {lastInvoice.status === 'paid' ? '✓ Ödendi' : 'Bekliyor'}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
          <div className="px-5 py-3 bg-amber-50 border-t border-amber-100 grid grid-cols-6 gap-2">
            <div className="col-span-5 text-right text-xs font-semibold text-gray-500">Toplam Aylık Reklamcı Geliri</div>
            <div className="text-right text-sm font-bold text-amber-700">₺{advertiserRevenue.toLocaleString()}</div>
          </div>
        </div>
      </div>
{/* Onay Bekleyenler */}
{(() => {
  const awaitingApproval = invoices.filter(i => i.status === 'awaiting_approval')
  if (awaitingApproval.length === 0) return null
  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
        Ödeme Onayı Bekleyenler
        <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{awaitingApproval.length}</span>
      </h2>
      <div className="bg-white rounded-2xl border border-indigo-200 overflow-hidden">
        <div className="px-5 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center gap-2">
          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
          <p className="text-xs font-semibold text-indigo-700">Müşteri ödeme yaptığını bildirdi — onay bekleniyor</p>
        </div>
        {awaitingApproval.map((inv, i) => {
          const owner = allUsers.find(u => u.id === inv.owner_id)
          return (
            <div key={inv.id} className={`px-5 py-4 flex items-center gap-4 ${i < awaitingApproval.length - 1 ? 'border-b border-gray-50' : ''} hover:bg-indigo-50/20 transition-colors`}>
              <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <span className="text-indigo-600 font-bold text-sm">{(owner?.company_name || owner?.full_name || '?').charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{owner?.company_name || owner?.full_name || owner?.email || 'Bilinmiyor'}</p>
                <p className="text-xs text-gray-400">{owner?.email}</p>
                {inv.note && <p className="text-xs text-gray-500 mt-0.5">Not: {inv.note}</p>}
                {inv.due_date && <p className="text-xs text-gray-400">Vade: {new Date(inv.due_date).toLocaleDateString('tr-TR')}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-base font-bold text-gray-900 mb-2">₺{inv.total_amount?.toLocaleString()}</p>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      await supabase.from('invoices').update({ status: 'pending' }).eq('id', inv.id)
                      await loadData()
                    }}
                    className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-500 font-medium px-3 py-1.5 rounded-lg border border-gray-200 transition-colors">
                    Reddet
                  </button>
                  <button
                    onClick={async () => {
                      await supabase.from('invoices').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', inv.id)
                      await loadData()
                    }}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors">
                    ✓ Onayla
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})()}
      {/* Bekleyen & Gecikmiş */}
      {(overdueInvoices.length > 0 || pendingInvoices.length > 0) && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Bekleyen & Gecikmiş Faturalar</h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {overdueInvoices.length > 0 && (
              <div className="px-5 py-3 bg-red-50 border-b border-red-100 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-400 rounded-full" />
                <p className="text-xs font-semibold text-red-600">{overdueInvoices.length} gecikmiş fatura</p>
              </div>
            )}
            {[...overdueInvoices, ...pendingInvoices].map((inv, i) => {
              const isOverdue = inv.due_date && new Date(inv.due_date) < today
              const daysLate = isOverdue ? Math.floor((today.getTime() - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24)) : 0
              const owner = allUsers.find(u => u.id === inv.owner_id)
              return (
                <div key={inv.id} className={`px-5 py-3.5 flex items-center gap-4 ${i < overdueInvoices.length + pendingInvoices.length - 1 ? 'border-b border-gray-50' : ''} ${isOverdue ? 'bg-red-50/30' : ''}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isOverdue ? 'bg-red-100' : 'bg-amber-50'}`}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 4v4M7 10v.5" stroke={isOverdue ? '#e11d48' : '#d97706'} strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{owner?.company_name || owner?.full_name || owner?.email || 'Bilinmiyor'}</p>
                    {inv.due_date && <p className="text-xs text-gray-400">Vade: {new Date(inv.due_date).toLocaleDateString('tr-TR')}</p>}
                    {isOverdue && <p className="text-xs text-red-500 font-medium">{daysLate} gün gecikmiş</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">₺{inv.total_amount?.toLocaleString()}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isOverdue ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                      {isOverdue ? 'Gecikmiş' : 'Bekliyor'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
})()}
          {/* ── FİRMA LİSTESİ ── */}
          {activeTab === 'firma-listesi' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-500">
                    Toplam <span className="font-semibold text-gray-800">{filteredCustomers.length}</span> firma
                    <span className="text-gray-400 mx-1.5">·</span>
                    <span className="text-indigo-600 font-medium">{directCustomers.length}</span> platform
                    <span className="text-gray-400 mx-1.5">·</span>
                    <span className="text-amber-600 font-medium">{viaAdvertiserCustomers.length}</span> reklamcı
                  </p>
                </div>
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
              <div className="flex flex-wrap gap-2">
                {([
                  { key: 'all', label: 'Tümü' },
                  { key: 'platform', label: 'Platform (doğrudan)' },
                  { key: 'advertiser', label: 'Reklamcı müşterisi' },
                ] as const).map(({ key, label }) => (
                  <button key={key} type="button" onClick={() => setFirmaSourceFilter(key)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${firmaSourceFilter === key ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                    {label}
                  </button>
                ))}
              </div>
              {filteredCustomers.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                  <p className="text-gray-400 text-sm">Firma bulunamadı.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {(firmaSourceFilter === 'all' || firmaSourceFilter === 'platform') && (
                    <div>
                      <div className="flex items-center gap-2 mb-2 px-0.5">
                        <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Platform</span>
                        <span className="text-xs text-gray-400">DataPilot üzerinden doğrudan kayıtlı müşteriler</span>
                        <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{directCustomers.length}</span>
                      </div>
                      <div className="bg-white rounded-2xl border border-indigo-100 overflow-hidden">
                        {directCustomers.length === 0 ? (
                          <div className="p-8 text-center text-sm text-gray-400">Bu kategoride firma yok.</div>
                        ) : directCustomers.map((c, i) => {
                          const cBranches = branches.filter(b => b.owner_id === c.id)
                          const sub = c.subscriptions?.[0]
                          const planCfg: any = { trial: 'bg-gray-100 text-gray-500', starter: 'bg-indigo-50 text-indigo-700 border border-indigo-200', pro: 'bg-violet-50 text-violet-700 border border-violet-200', enterprise: 'bg-amber-50 text-amber-700 border border-amber-200' }
                          return (
                            <div key={c.id} className={`px-5 py-4 flex items-center gap-4 hover:bg-gray-50/70 transition-colors ${i < directCustomers.length - 1 ? 'border-b border-gray-50' : ''}`}>
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center flex-shrink-0">
                                <span className="text-indigo-600 font-bold">{(c.company_name || c.full_name || 'F').charAt(0)}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                  <p className="text-sm font-semibold text-gray-900 truncate">{c.company_name || c.full_name}</p>
                                  <span className="text-[10px] font-semibold uppercase tracking-wide bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">Platform</span>
                                  {sub?.plan && <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${planCfg[sub.plan] || 'bg-gray-100 text-gray-500'}`}>{sub.plan}</span>}
                                  {c.sector && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex-shrink-0">{c.sector}</span>}
                                </div>
                                <p className="text-xs text-gray-400">{c.email}</p>
                                <div className="flex gap-3 mt-1 flex-wrap">
                                  <span className="text-xs text-indigo-600 font-medium">{cBranches.length} şube</span>
                                  {sub && <span className="text-xs text-gray-400">₺{sub.monthly_fee}/ay</span>}
                                  <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString('tr-TR')}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button onClick={() => { setSelectedCustomer(c); setShowCustomerDetail(true) }} className="text-xs text-indigo-600 font-medium hover:text-indigo-700 px-3 py-1.5 hover:bg-indigo-50 rounded-lg transition-colors">Detay</button>
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
                  {(firmaSourceFilter === 'all' || firmaSourceFilter === 'advertiser') && (
                    <div>
                      <div className="flex items-center gap-2 mb-2 px-0.5 flex-wrap">
                        <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Reklamcı</span>
                        <span className="text-xs text-gray-400">Bir reklamcı hesabı üzerinden eklenen müşteri hesapları</span>
                        <span className="text-xs bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full font-medium">{viaAdvertiserCustomers.length}</span>
                      </div>
                      <div className="bg-white rounded-2xl border border-amber-100 overflow-hidden">
                        {viaAdvertiserCustomers.length === 0 ? (
                          <div className="p-8 text-center text-sm text-gray-400">Bu kategoride firma yok.</div>
                        ) : viaAdvertiserCustomers.map((c, i) => {
                          const cBranches = branches.filter(b => b.owner_id === c.id)
                          const sub = c.subscriptions?.[0]
                          const advName = getAdvertiserForCustomerProfile(c.id)
                          const planCfg: any = { trial: 'bg-gray-100 text-gray-500', starter: 'bg-indigo-50 text-indigo-700 border border-indigo-200', pro: 'bg-violet-50 text-violet-700 border border-violet-200', enterprise: 'bg-amber-50 text-amber-700 border border-amber-200' }
                          return (
                            <div key={c.id} className={`px-5 py-4 flex items-center gap-4 hover:bg-amber-50/40 transition-colors ${i < viaAdvertiserCustomers.length - 1 ? 'border-b border-gray-50' : ''}`}>
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center flex-shrink-0">
                                <span className="text-amber-700 font-bold">{(c.company_name || c.full_name || 'F').charAt(0)}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                  <p className="text-sm font-semibold text-gray-900 truncate">{c.company_name || c.full_name}</p>
                                  <span className="text-[10px] font-semibold uppercase tracking-wide bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">Reklamcı</span>
                                  {sub?.plan && <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${planCfg[sub.plan] || 'bg-gray-100 text-gray-500'}`}>{sub.plan}</span>}
                                </div>
                                {advName && <p className="text-xs text-amber-700 font-medium mt-0.5">Reklamcı: {advName}</p>}
                                <p className="text-xs text-gray-400">{c.email}</p>
                                <div className="flex gap-3 mt-1 flex-wrap">
                                  <span className="text-xs text-indigo-600 font-medium">{cBranches.length} şube</span>
                                  {sub && <span className="text-xs text-gray-400">₺{sub.monthly_fee}/ay</span>}
                                  <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString('tr-TR')}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button onClick={() => { setSelectedCustomer(c); setShowCustomerDetail(true) }} className="text-xs text-indigo-600 font-medium hover:text-indigo-700 px-3 py-1.5 hover:bg-indigo-50 rounded-lg transition-colors">Detay</button>
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
                </div>
              )}
            </div>
          )}

          {/* ── ONBOARDING ── */}
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
                <div className="flex gap-2">
                  <Btn size="sm" variant="secondary" onClick={async () => {
                    if (!confirm('Auth\'daki tüm reklamcılar profiles tablosuna senkronize edilecek. Devam?')) return
                    const session = await supabase.auth.getSession()
                    const token = session.data.session?.access_token
                    const res = await fetch('/api/sync-advertisers', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } })
                    const result = await res.json()
                    if (result.error) { alert('Hata: ' + result.error); return }
                    alert(`${result.synced} reklamcı senkronize edildi.`)
                    loadData()
                  }}>Senkronize Et</Btn>
                  <Btn size="sm" onClick={() => setActiveTab('reklamci-ekle')} className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/></svg>
                    Reklamcı Ekle
                  </Btn>
                </div>
              </div>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                <input value={advSearchQuery} onChange={e => setAdvSearchQuery(e.target.value)} placeholder="Reklamcı ara..."
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Toplam Reklamcı', value: advertisers.length, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
                  { label: 'Aktif', value: advertisers.filter(a => a.is_active !== false).length, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                  { label: 'Toplam Müşteri', value: advertisers.reduce((s, a) => s + (a.advertiser_clients?.length || 0), 0), color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
                  { label: 'Aylık Gelir', value: `₺${advertisers.reduce((s, a) => { const sub = advSubs.find(s => s.advertiser_id === a.id); return s + (sub?.monthly_fee || 0) + ((a.advertiser_clients?.length || 0) * (sub?.per_client_fee || 0)) }, 0).toLocaleString()}`, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
                ].map(card => (
                  <div key={card.label} className={`${card.bg} border ${card.border} rounded-2xl p-4`}>
                    <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{card.label}</p>
                  </div>
                ))}
              </div>
              {filteredAdvertisers.length === 0 ? (
                <div className="bg-white rounded-2xl border border-amber-100 p-16 text-center">
                  <p className="text-gray-500 text-sm font-medium">Henüz reklamcı yok</p>
                  <button onClick={() => setActiveTab('reklamci-ekle')} className="mt-4 text-xs text-amber-600 font-medium hover:underline">Reklamcı Ekle →</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAdvertisers.map((a) => {
                    const clientCount = a.advertiser_clients?.length || 0
                    const sub = advSubs.find(s => s.advertiser_id === a.id)
                    const monthlyIncome = (sub?.monthly_fee || 0) + clientCount * (sub?.per_client_fee || 0)
                    const advInvoices = invoices.filter(inv => inv.owner_id === a.id)
                    const pendingAdv = advInvoices.filter(inv => inv.status === 'pending').reduce((s, inv) => s + (inv.total_amount || 0), 0)
                    const paidAdv = advInvoices.filter(inv => inv.status === 'paid').reduce((s, inv) => s + (inv.total_amount || 0), 0)
                    return (
                      <div key={a.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-sm transition-all">
                        <div className="px-5 py-4 flex items-center gap-4 cursor-pointer" onClick={() => setExpandedAdvertiser(expandedAdvertiser === a.id ? null : a.id)}>
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center flex-shrink-0">
                            <span className="text-amber-600 font-bold">{(a.company_name || a.full_name || 'R').charAt(0)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-sm font-semibold text-gray-900 truncate">{a.company_name || a.full_name}</p>
                              <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-medium border border-amber-200">Reklamcı</span>
                            </div>
                            <p className="text-xs text-gray-400">{a.email} · {a.phone || '-'}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setSelectedAdvertiser(a)} className="text-xs text-amber-600 font-medium hover:text-amber-700 px-3 py-1.5 hover:bg-amber-50 rounded-lg transition-colors border border-amber-200">Detay & Fatura</button>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" checked={a.is_active !== false} onChange={() => handleToggleActive(a)} className="sr-only peer" />
                              <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-amber-500 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                            </label>
                            <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedAdvertiser === a.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </div>
                        </div>
                        {expandedAdvertiser === a.id && (
                          <div className="border-t border-gray-50">
                            <div className="px-5 py-3 grid grid-cols-4 gap-3">
                              <div className="text-center"><p className="text-base font-bold text-amber-600">{clientCount}</p><p className="text-xs text-gray-400">Müşteri</p></div>
                              <div className="text-center"><p className="text-base font-bold text-indigo-600">₺{monthlyIncome.toLocaleString()}</p><p className="text-xs text-gray-400">Aylık Gelir</p></div>
                              <div className="text-center"><p className="text-base font-bold text-rose-500">₺{pendingAdv.toLocaleString()}</p><p className="text-xs text-gray-400">Bekleyen</p></div>
                              <div className="text-center"><p className="text-base font-bold text-emerald-600">₺{paidAdv.toLocaleString()}</p><p className="text-xs text-gray-400">Tahsil</p></div>
                            </div>
                            {sub && (
                              <div className="px-5 pb-3 flex items-center gap-3">
                                <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg">₺{sub.monthly_fee}/ay sabit</span>
                                <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg">₺{sub.per_client_fee}/müşteri</span>
                              </div>
                            )}
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
                </div>
              </div>
              {advSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                  <div className="flex-1"><p className="text-sm font-semibold text-emerald-800">Reklamcı oluşturuldu!</p><p className="text-xs text-emerald-600">{advSuccess}</p></div>
                  <button onClick={() => setAdvSuccess('')} className="text-emerald-400"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></button>
                </div>
              )}
              <form onSubmit={handleAddAdvertiser} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2"><Input label="Ad Soyad *" value={advName} onChange={(e: any) => setAdvName(e.target.value)} required placeholder="Ahmet Yılmaz" /></div>
                  <Input label="E-posta *" type="email" value={advEmail} onChange={(e: any) => setAdvEmail(e.target.value)} required placeholder="reklamci@email.com" />
                  <Input label="Şifre *" type="password" value={advPassword} onChange={(e: any) => setAdvPassword(e.target.value)} required placeholder="min. 6 karakter" />
                  <Input label="Firma/Ajans Adı" value={advCompany} onChange={(e: any) => setAdvCompany(e.target.value)} placeholder="Ajans Adı" />
                  <Input label="Telefon" value={advPhone} onChange={(e: any) => setAdvPhone(e.target.value)} placeholder="05XX XXX XXXX" />
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Fiyatlandırma</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Aylık Sabit Ücret (₺)</label>
                      <input type="number" value={advMonthlyFee} onChange={e => setAdvMonthlyFee(e.target.value)} className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Müşteri Başı Ücret (₺)</label>
                      <input type="number" value={advPerClientFee} onChange={e => setAdvPerClientFee(e.target.value)} className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                    </div>
                  </div>
                </div>
                <button type="submit" disabled={advSaving} className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-semibold transition-colors">
                  {advSaving ? 'Oluşturuluyor...' : '✓ Reklamcı Hesabı Oluştur'}
                </button>
              </form>
            </div>
          )}

          {/* ── FATURA PLANLAR ── */}
          {activeTab === 'fatura-planlar' && (
            <div className="space-y-4 max-w-3xl">
              <h2 className="text-base font-semibold text-gray-900">Abonelik Planları</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'trial', label: 'Deneme', price: '₺0', period: '14 gün', color: 'border-gray-200', badge: 'bg-gray-100 text-gray-600', features: ['Tüm özellikler açık', '1 şube', '3 kullanıcı', '500 lead/ay'] },
                  { key: 'starter', label: 'Starter', price: '₺2.000', period: '/ay', color: 'border-indigo-200', badge: 'bg-indigo-50 text-indigo-700', features: ['1 şube', '2 kullanıcı', '400 lead/ay', 'Email destek'] },
                  { key: 'pro', label: 'Pro', price: '₺5.500', period: '/ay', color: 'border-violet-200', badge: 'bg-violet-50 text-violet-700', features: ['3 şube', '10 kullanıcı', '2000 lead/ay', 'Öncelikli destek'] },
                  { key: 'enterprise', label: 'Enterprise', price: '₺15.000+', period: '/ay', color: 'border-amber-200', badge: 'bg-amber-50 text-amber-700', features: ['Sınırsız şube', 'Sınırsız kullanıcı', 'Sınırsız lead', '7/24 destek'] },
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
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-400">{customers.filter(c => c.subscriptions?.[0]?.plan === plan.key).length} firma bu planda</span>
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
                        <select value={sub?.plan || 'trial'}
                          onChange={async (e) => {
                            if (sub?.id) { await supabase.from('subscriptions').update({ plan: e.target.value }).eq('id', sub.id) }
                            else { await supabase.from('subscriptions').insert({ owner_id: c.id, plan: e.target.value, status: 'active', monthly_fee: 0, per_branch_fee: 0 }) }
                            loadData()
                          }}
                          className={`text-xs font-semibold px-2 py-1 rounded-lg border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${sub?.plan === 'enterprise' ? 'bg-amber-50 text-amber-700' : sub?.plan === 'pro' ? 'bg-violet-50 text-violet-700' : sub?.plan === 'starter' ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
                          <option value="trial">trial</option>
                          <option value="starter">starter</option>
                          <option value="pro">pro</option>
                          <option value="enterprise">enterprise</option>
                        </select>
                      </div>
                      <div className="text-right">
                        <input type="number" defaultValue={sub?.monthly_fee || 0}
                          onBlur={async (e) => { if (sub?.id) { await supabase.from('subscriptions').update({ monthly_fee: parseFloat(e.target.value) || 0 }).eq('id', sub.id); loadData() } }}
                          className="w-20 text-right text-sm font-semibold text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-indigo-500 focus:outline-none transition-colors" />
                      </div>
                      <div className="text-right"><span className="text-sm text-gray-500">{cBranchCount}</span></div>
                      <div className="text-right">
                        <button onClick={() => handleToggleActive(c)}
                          className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${c.is_active !== false ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                          {c.is_active !== false ? 'Aktif' : 'Pasif'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── GÜVENLİK LOGLAR ── */}
          {activeTab === 'guvenlik-loglar' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Denetim Logları</h2>
                <p className="text-xs text-gray-400 mt-0.5">Platforma kayıtlı tüm kullanıcılar</p>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Toplam Kullanıcı', value: allUsers.length, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { label: 'Firma', value: customers.length, color: 'text-violet-600', bg: 'bg-violet-50' },
                  { label: 'Reklamcı', value: advertisers.length, color: 'text-amber-600', bg: 'bg-amber-50' },
                  { label: 'Satışçı', value: allUsers.filter(u => ['team','agent'].includes(u.role)).length, color: 'text-blue-600', bg: 'bg-blue-50' },
                ].map(c => (
                  <div key={c.label} className={`${c.bg} rounded-xl px-4 py-3`}>
                    <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <div className="col-span-2">Kullanıcı</div>
                    <div>Rol</div>
                    <div className="text-right">Durum</div>
                  </div>
                </div>
                {allUsers.map((u, i) => (
                  <div key={u.id} className={`px-5 py-3 grid grid-cols-4 gap-2 items-center ${i < allUsers.length - 1 ? 'border-b border-gray-50' : ''} hover:bg-gray-50/50 transition-colors`}>
                    <div className="col-span-2 flex items-center gap-2 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${u.role === 'super_admin' ? 'bg-rose-100 text-rose-600' : u.role === 'customer' ? 'bg-indigo-100 text-indigo-600' : u.role === 'advertiser' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                        {(u.full_name || u.email || 'U').charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{u.full_name || '-'}</p>
                        <p className="text-xs text-gray-400 truncate">{u.email}</p>
                      </div>
                    </div>
                    <div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.role === 'super_admin' ? 'bg-rose-50 text-rose-600' : u.role === 'customer' ? 'bg-indigo-50 text-indigo-600' : u.role === 'advertiser' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                        {u.role === 'super_admin' ? 'Admin' : u.role === 'customer' ? 'Firma' : u.role === 'advertiser' ? 'Reklamcı' : 'Satışçı'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.is_active !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                        {u.is_active !== false ? 'Aktif' : 'Pasif'}
                      </span>
                      <p className="text-xs text-gray-300 mt-0.5">{new Date(u.created_at).toLocaleDateString('tr-TR')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* ── FİRMA MALİ YÖNETİM ── */}
{activeTab === 'firma-mali' && (
  <div className="space-y-5">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Firma Mali Yönetim</h2>
        <p className="text-xs text-gray-400 mt-0.5">Tüm firmaların fatura ve ödeme geçmişi</p>
      </div>
      <button
        onClick={async () => {
          const now = new Date()
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
          let created = 0
          for (const c of directCustomers) {
            const sub = c.subscriptions?.[0]
            if (!sub?.monthly_fee || sub.monthly_fee <= 0) continue
            const { data: existing } = await supabase
              .from('invoices')
              .select('id')
              .eq('owner_id', c.id)
              .gte('created_at', monthStart)
              .limit(1)
            if (existing && existing.length > 0) continue
            await supabase.from('invoices').insert({
              owner_id: c.id,
              total_amount: sub.monthly_fee,
              status: 'pending',
              due_date: new Date(now.getFullYear(), now.getMonth(), 15).toISOString().split('T')[0],
              branch_count: 0,
              per_branch_fee: 0,
              note: `${now.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })} aylık hizmet bedeli`,
            })
            created++
          }
          alert(`${created} firma için fatura oluşturuldu.`)
          loadData()
        }}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        Bu Ay Faturaları Oluştur
      </button>
    </div>

    {/* Özet */}
    <div className="grid grid-cols-4 gap-3">
      {[
        { label: 'Toplam Fatura', value: invoices.filter(i => directCustomers.some(c => c.id === i.owner_id)).length, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Bekleyen', value: invoices.filter(i => i.status === 'pending' && directCustomers.some(c => c.id === i.owner_id)).length, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Onay Bekliyor', value: invoices.filter(i => i.status === 'awaiting_approval' && directCustomers.some(c => c.id === i.owner_id)).length, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Ödendi', value: invoices.filter(i => i.status === 'paid' && directCustomers.some(c => c.id === i.owner_id)).length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      ].map(c => (
        <div key={c.label} className={`${c.bg} rounded-xl px-4 py-3`}>
          <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
        </div>
      ))}
    </div>

    {/* Fatura listesi */}
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
        <div className="grid grid-cols-5 gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          <div className="col-span-2">Firma</div>
          <div className="text-right">Tutar</div>
          <div className="text-center">Durum</div>
          <div className="text-right">İşlem</div>
        </div>
      </div>
      {invoices.filter(i => directCustomers.some(c => c.id === i.owner_id)).length === 0 ? (
        <div className="p-12 text-center"><p className="text-gray-400 text-sm">Henüz fatura yok.</p></div>
      ) : invoices.filter(i => directCustomers.some(c => c.id === i.owner_id)).map((inv, i, arr) => {
        const owner = directCustomers.find(c => c.id === inv.owner_id)
        const statusCfg: any = {
          pending: { label: 'Bekliyor', color: 'bg-amber-50 text-amber-700' },
          awaiting_approval: { label: 'Onay Bekliyor', color: 'bg-blue-50 text-blue-700' },
          paid: { label: 'Ödendi', color: 'bg-emerald-50 text-emerald-700' },
        }
        const st = statusCfg[inv.status] || statusCfg.pending
        return (
          <div key={inv.id} className={`px-5 py-3.5 grid grid-cols-5 gap-2 items-center ${i < arr.length - 1 ? 'border-b border-gray-50' : ''} hover:bg-gray-50/50 transition-colors`}>
            <div className="col-span-2 flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <span className="text-indigo-600 text-xs font-bold">{(owner?.company_name || owner?.full_name || '?').charAt(0)}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{owner?.company_name || owner?.full_name}</p>
                <p className="text-xs text-gray-400">{inv.note || new Date(inv.created_at).toLocaleDateString('tr-TR')}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">₺{inv.total_amount?.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${st.color}`}>{st.label}</span>
            </div>
            <div className="text-right">
              {inv.status === 'awaiting_approval' && (
                <div className="flex gap-1 justify-end">
                  <button onClick={async () => { await supabase.from('invoices').update({ status: 'pending' }).eq('id', inv.id); loadData() }}
                    className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-500 font-medium px-2 py-1 rounded-lg border border-gray-200 transition-colors">Reddet</button>
                  <button onClick={async () => { await supabase.from('invoices').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', inv.id); loadData() }}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-2 py-1 rounded-lg transition-colors">Onayla</button>
                </div>
              )}
              {inv.status === 'pending' && (
                <span className="text-xs text-gray-400">Ödeme bekleniyor</span>
              )}
              {inv.status === 'paid' && (
                <span className="text-xs text-emerald-600 font-medium">✓ Tamamlandı</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  </div>
)}

{/* ── REKLAMCI MALİ YÖNETİM ── */}
{activeTab === 'reklamci-mali' && (
  <div className="space-y-5">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Reklamcı Mali Yönetim</h2>
        <p className="text-xs text-gray-400 mt-0.5">Tüm reklamcıların fatura ve ödeme geçmişi</p>
      </div>
      <button
        onClick={async () => {
          const now = new Date()
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
          let created = 0
          for (const a of advertisers) {
            const sub = advSubs.find(s => s.advertiser_id === a.id)
            const clientCount = a.advertiser_clients?.length || 0
            const monthlyTotal = (sub?.monthly_fee || 0) + clientCount * (sub?.per_client_fee || 0)
            if (monthlyTotal <= 0) continue
            const { data: existing } = await supabase
              .from('invoices')
              .select('id')
              .eq('owner_id', a.id)
              .gte('created_at', monthStart)
              .limit(1)
            if (existing && existing.length > 0) continue
            await supabase.from('invoices').insert({
              owner_id: a.id,
              total_amount: monthlyTotal,
              status: 'pending',
              due_date: new Date(now.getFullYear(), now.getMonth(), 15).toISOString().split('T')[0],
              branch_count: clientCount,
              per_branch_fee: sub?.per_client_fee || 0,
              note: `${now.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })} aylık hizmet bedeli`,
            })
            created++
          }
          alert(`${created} reklamcı için fatura oluşturuldu.`)
          loadData()
        }}
        className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl transition-colors">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        Bu Ay Faturaları Oluştur
      </button>
    </div>

    {/* Özet */}
    <div className="grid grid-cols-4 gap-3">
      {[
        { label: 'Toplam Fatura', value: invoices.filter(i => advertisers.some(a => a.id === i.owner_id)).length, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Bekleyen', value: invoices.filter(i => i.status === 'pending' && advertisers.some(a => a.id === i.owner_id)).length, color: 'text-rose-600', bg: 'bg-rose-50' },
        { label: 'Onay Bekliyor', value: invoices.filter(i => i.status === 'awaiting_approval' && advertisers.some(a => a.id === i.owner_id)).length, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Ödendi', value: invoices.filter(i => i.status === 'paid' && advertisers.some(a => a.id === i.owner_id)).length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      ].map(c => (
        <div key={c.label} className={`${c.bg} rounded-xl px-4 py-3`}>
          <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
        </div>
      ))}
    </div>

    {/* Fatura listesi */}
    <div className="bg-white rounded-2xl border border-amber-100 overflow-hidden">
      <div className="px-5 py-3 bg-amber-50/50 border-b border-amber-100">
        <div className="grid grid-cols-5 gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          <div className="col-span-2">Reklamcı</div>
          <div className="text-right">Tutar</div>
          <div className="text-center">Durum</div>
          <div className="text-right">İşlem</div>
        </div>
      </div>
      {invoices.filter(i => advertisers.some(a => a.id === i.owner_id)).length === 0 ? (
        <div className="p-12 text-center"><p className="text-gray-400 text-sm">Henüz fatura yok.</p></div>
      ) : invoices.filter(i => advertisers.some(a => a.id === i.owner_id)).map((inv, i, arr) => {
        const owner = advertisers.find(a => a.id === inv.owner_id)
        const statusCfg: any = {
          pending: { label: 'Bekliyor', color: 'bg-amber-50 text-amber-700' },
          awaiting_approval: { label: 'Onay Bekliyor', color: 'bg-blue-50 text-blue-700' },
          paid: { label: 'Ödendi', color: 'bg-emerald-50 text-emerald-700' },
        }
        const st = statusCfg[inv.status] || statusCfg.pending
        return (
          <div key={inv.id} className={`px-5 py-3.5 grid grid-cols-5 gap-2 items-center ${i < arr.length - 1 ? 'border-b border-gray-50' : ''} hover:bg-amber-50/20 transition-colors`}>
            <div className="col-span-2 flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                <span className="text-amber-600 text-xs font-bold">{(owner?.company_name || owner?.full_name || '?').charAt(0)}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{owner?.company_name || owner?.full_name}</p>
                <p className="text-xs text-gray-400">{inv.note || new Date(inv.created_at).toLocaleDateString('tr-TR')}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">₺{inv.total_amount?.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${st.color}`}>{st.label}</span>
            </div>
            <div className="text-right">
              {inv.status === 'awaiting_approval' && (
                <div className="flex gap-1 justify-end">
                  <button onClick={async () => { await supabase.from('invoices').update({ status: 'pending' }).eq('id', inv.id); loadData() }}
                    className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-500 font-medium px-2 py-1 rounded-lg border border-gray-200 transition-colors">Reddet</button>
                  <button onClick={async () => { await supabase.from('invoices').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', inv.id); loadData() }}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-2 py-1 rounded-lg transition-colors">Onayla</button>
                </div>
              )}
              {inv.status === 'pending' && (
                <span className="text-xs text-gray-400">Ödeme bekleniyor</span>
              )}
              {inv.status === 'paid' && (
                <span className="text-xs text-emerald-600 font-medium">✓ Tamamlandı</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  </div>
)}
          {/* ── BOŞLAR ── */}
        {!['dashboard','firma-listesi','firma-onboarding','reklamci-listesi','reklamci-ekle','fatura-planlar','fatura-abonelikler','guvenlik-loglar'].includes(activeTab) && (
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

          const sub = advSubs.find(s => s.advertiser_id === selectedAdvertiser.id)
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
                        owner_id: selectedCustomer.id,
                        total_amount: parseFloat(custInvoiceAmount),
                        status: 'pending',
                        due_date: custInvoiceDue || null,
                        note: custInvoiceNote || null,
                        branch_count: 0,
                        per_branch_fee: 0,
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
<Modal open={showCustomerDetail}
  onClose={() => { setShowCustomerDetail(false); setCustDetailTab('genel'); setCustInvoiceAmount(''); setCustInvoiceNote(''); setCustInvoiceDue('') }}
  title={selectedCustomer?.company_name || selectedCustomer?.full_name || 'Firma Detayı'}
  subtitle={selectedCustomer?.email} size="xl">
  {selectedCustomer && (() => {
    const sub = selectedCustomer.subscriptions?.[0]
    const customerInvoices = invoices.filter(inv => inv.owner_id === selectedCustomer.id)
    const pendingTotal = customerInvoices.filter(i => i.status === 'pending').reduce((s, i) => s + (i.total_amount || 0), 0)
    const paidTotal = customerInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total_amount || 0), 0)

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
            <button key={tab.key} onClick={() => setCustDetailTab(tab.key)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${custDetailTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* GENEL */}
        {custDetailTab === 'genel' && (
          <div className="space-y-4">
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
            {sub && (
              <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                <p className="text-xs font-semibold text-indigo-700 mb-3">Abonelik Planı</p>
                <div className="grid grid-cols-3 gap-3">
                  <div><p className="text-xs text-indigo-400">Plan</p><p className="text-sm font-bold text-indigo-800 capitalize">{sub.plan}</p></div>
                  <div><p className="text-xs text-indigo-400">Aylık Ücret</p><p className="text-sm font-bold text-indigo-800">₺{sub.monthly_fee}</p></div>
                  <div><p className="text-xs text-indigo-400">Şube Başı</p><p className="text-sm font-bold text-indigo-800">₺{sub.per_branch_fee}</p></div>
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

        {/* MALİ DURUM */}
        {custDetailTab === 'mali' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">Aylık Gelir</p>
                <p className="text-2xl font-bold text-indigo-600">₺{(sub?.monthly_fee || 0).toLocaleString()}</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">Yıllık Gelir (Tahmin)</p>
                <p className="text-2xl font-bold text-emerald-600">₺{((sub?.monthly_fee || 0) * 12).toLocaleString()}</p>
              </div>
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">Bekleyen Fatura</p>
                <p className="text-2xl font-bold text-rose-500">₺{pendingTotal.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">{customerInvoices.filter(i => i.status === 'pending').length} fatura</p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">Toplam Tahsil</p>
                <p className="text-2xl font-bold text-gray-700">₺{paidTotal.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">{customerInvoices.filter(i => i.status === 'paid').length} fatura</p>
              </div>
            </div>
            <Btn className="w-full" onClick={() => setCustDetailTab('fatura')}>+ Yeni Fatura Kes</Btn>
          </div>
        )}

        {/* FATURA KES */}
        {custDetailTab === 'fatura' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Fatura Tutarı (₺) *</label>
              <input type="number" value={custInvoiceAmount} onChange={e => setCustInvoiceAmount(e.target.value)}
                placeholder={sub?.monthly_fee?.toString() || '0'}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              {sub?.monthly_fee > 0 && (
                <button onClick={() => setCustInvoiceAmount(sub.monthly_fee.toString())} className="mt-1 text-xs text-indigo-600 hover:underline">
                  Aylık tutarı doldur (₺{sub.monthly_fee.toLocaleString()})
                </button>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Vade Tarihi</label>
              <input type="date" value={custInvoiceDue} onChange={e => setCustInvoiceDue(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Not (opsiyonel)</label>
              <textarea value={custInvoiceNote} onChange={e => setCustInvoiceNote(e.target.value)} rows={2}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            </div>
            <div className="flex gap-3">
              <Btn variant="secondary" className="flex-1" onClick={() => setCustDetailTab('mali')}>İptal</Btn>
              <button onClick={async () => {
                if (!custInvoiceAmount) return
                setCustInvoiceSaving(true)
                await supabase.from('invoices').insert({
                  owner_id: selectedCustomer.id,
                  total_amount: parseFloat(custInvoiceAmount),
                  status: 'pending',
                  due_date: custInvoiceDue || null,
                  note: custInvoiceNote || null,
                })
                setCustInvoiceAmount(''); setCustInvoiceNote(''); setCustInvoiceDue('')
                setCustInvoiceSaving(false)
                await loadData()
                setCustDetailTab('gecmis')
              }} disabled={custInvoiceSaving || !custInvoiceAmount}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
                {custInvoiceSaving ? 'Kaydediliyor...' : '✓ Fatura Kes'}
              </button>
            </div>
          </div>
        )}

        {/* GEÇMİŞ */}
        {custDetailTab === 'gecmis' && (
          <div className="space-y-2">
            {customerInvoices.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-400 text-sm">Henüz fatura yok.</p>
                <button onClick={() => setCustDetailTab('fatura')} className="mt-2 text-xs text-indigo-600 hover:underline font-medium">Fatura Kes →</button>
              </div>
            ) : customerInvoices.map((inv: any) => (
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
                  <p className="text-xs text-gray-400">{inv.due_date ? `Vade: ${new Date(inv.due_date).toLocaleDateString('tr-TR')}` : new Date(inv.created_at).toLocaleDateString('tr-TR')}</p>
                </div>
                {inv.status === 'pending' ? (
                  <button onClick={async () => { await handleMarkPaid(inv.id); await loadData() }}
                    className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors">
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
    )
  })()}
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