'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const menuStructure = [
  {
    key: 'dashboard', label: 'Dashboard', icon: '📊',
  },
  {
    key: 'firmalar', label: 'Firmalar', icon: '🏢', children: [
      { key: 'firma-listesi', label: 'Firma Listesi' },
      { key: 'firma-onboarding', label: 'Onboarding' },
    ]
  },
  {
    key: 'kullanicilar', label: 'Kullanıcılar', icon: '👥', children: [
      { key: 'kullanici-listesi', label: 'Tüm Kullanıcılar' },
      { key: 'kullanici-roller', label: 'Roller & İzinler' },
      { key: 'kullanici-oturumlar', label: 'Oturumlar' },
    ]
  },
  {
    key: 'faturalama', label: 'Faturalama', icon: '💳', children: [
      { key: 'fatura-planlar', label: 'Planlar' },
      { key: 'fatura-abonelikler', label: 'Abonelikler' },
      { key: 'fatura-faturalar', label: 'Faturalar' },
      { key: 'fatura-kullanim', label: 'Kullanım' },
    ]
  },
  {
    key: 'guvenlik', label: 'Güvenlik', icon: '🔒', children: [
      { key: 'guvenlik-loglar', label: 'Denetim Logları' },
      { key: 'guvenlik-politikalar', label: 'Politikalar' },
      { key: 'guvenlik-anahtarlar', label: 'Anahtarlar & Sırlar' },
    ]
  },
  {
    key: 'sistem', label: 'Sistem', icon: '⚙️', children: [
      { key: 'sistem-durum', label: 'Sistem Durumu' },
      { key: 'sistem-loglar', label: 'Loglar' },
      { key: 'sistem-uyarilar', label: 'Uyarılar' },
    ]
  },
  {
    key: 'destek', label: 'Destek', icon: '🎧', children: [
      { key: 'destek-talepler', label: 'Talepler' },
      { key: 'destek-impersonation', label: 'Kimlik Taklidi' },
    ]
  },
  {
    key: 'ayarlar', label: 'Platform Ayarları', icon: '🛠️',
  },
]

export default function SuperAdminPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['firmalar'])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])

  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [showCustomerDetail, setShowCustomerDetail] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newCompany, setNewCompany] = useState('')
  const [newSector, setNewSector] = useState('')
  const [newPerBranchFee, setNewPerBranchFee] = useState('')
  const [newMonthlyFee, setNewMonthlyFee] = useState('')
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [generatingInvoices, setGeneratingInvoices] = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (profileData?.role !== 'super_admin') { router.push('/login'); return }
    setProfile(profileData)

    const { data: customersData } = await supabase
      .from('profiles').select('*, subscriptions(*)')
      .eq('role', 'customer').order('created_at', { ascending: false })
    setCustomers(customersData || [])

    const { data: branchesData } = await supabase.from('branches').select('*')
    setBranches(branchesData || [])

    const { data: leadsData } = await supabase.from('leads').select('id, status, procedure_amount, created_at')
    setLeads(leadsData || [])

    const { data: invoicesData } = await supabase.from('invoices').select('*, profiles(full_name, company_name)').order('created_at', { ascending: false })
    setInvoices(invoicesData || [])

    const { data: usersData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setAllUsers(usersData || [])

    setLoading(false)
  }

  const toggleMenu = (key: string) => {
    setExpandedMenus(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { data, error } = await supabase.auth.signUp({
      email: newEmail, password: newPassword,
      options: { data: { full_name: newName, role: 'customer' } }
    })
    if (error) { alert(error.message); setSaving(false); return }
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id, email: newEmail, full_name: newName,
        role: 'customer', company_name: newCompany, sector: newSector, is_active: true,
      })
      await supabase.from('subscriptions').insert({
        owner_id: data.user.id, plan: 'trial', status: 'active',
        monthly_fee: parseFloat(newMonthlyFee) || 0,
        per_branch_fee: parseFloat(newPerBranchFee) || 0,
      })
      setShowAddCustomer(false)
      setNewName(''); setNewEmail(''); setNewPassword('')
      setNewCompany(''); setNewSector(''); setNewPerBranchFee(''); setNewMonthlyFee('')
      loadData()
    }
    setSaving(false)
  }

  const handleToggleActive = async (customer: any) => {
    await supabase.from('profiles').update({ is_active: !customer.is_active }).eq('id', customer.id)
    loadData()
  }

  const handleGenerateInvoices = async () => {
    setGeneratingInvoices(true)
    const dueDate = new Date()
    dueDate.setDate(15)
    for (const customer of customers) {
      const branchCount = branches.filter(b => b.owner_id === customer.id).length
      const perBranchFee = customer.subscriptions?.[0]?.per_branch_fee || 0
      const totalAmount = branchCount * perBranchFee
      if (totalAmount > 0) {
        await supabase.from('invoices').insert({
          owner_id: customer.id, branch_count: branchCount,
          per_branch_fee: perBranchFee, total_amount: totalAmount,
          status: 'pending', due_date: dueDate.toISOString().split('T')[0],
        })
      }
    }
    setGeneratingInvoices(false)
    loadData()
    alert('Faturalar oluşturuldu!')
  }

  const handleMarkPaid = async (invoiceId: string) => {
    await supabase.from('invoices').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', invoiceId)
    loadData()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
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
      if (item.children) {
        const child = item.children.find(c => c.key === activeTab)
        if (child) return `${item.label} › ${child.label}`
      }
    }
    return 'Dashboard'
  }

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
               <img src="/logo.png" alt="DataPilot" className="h-7 w-auto" />
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
              🚪 Çıkış Yap
            </button>
          </div>
        )}
      </div>

      {/* MAIN */}
      <div className={`${sidebarCollapsed ? 'ml-16' : 'ml-64'} flex-1 transition-all duration-300`}>

        {/* TOP BAR */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
          <div className="relative flex-1 max-w-sm">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Firma, kullanıcı ara..."
              className="w-full pl-8 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => { setActiveTab('firma-listesi'); setShowAddCustomer(true) }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded-lg font-medium">
              + Firma Ekle
            </button>
            <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
              🔔
              <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
            </button>
            <span className="bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full">Super Admin</span>
          </div>
        </div>

        <div className="p-6">
          {/* Breadcrumb */}
          <p className="text-xs text-gray-400 mb-5">DataPilot › <span className="text-gray-700 font-medium">{getPageTitle()}</span></p>

          {/* DASHBOARD */}
          {activeTab === 'dashboard' && (
            <>
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Toplam Firma', value: customers.length, icon: '🏢', color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Toplam Şube', value: branches.length, icon: '📍', color: 'text-purple-600', bg: 'bg-purple-50' },
                  { label: 'Toplam Lead', value: leads.length, icon: '📋', color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'Bekleyen Tahsilat', value: `₺${pendingInvoicesTotal.toLocaleString()}`, icon: '💰', color: 'text-amber-600', bg: 'bg-amber-50' },
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
                    <h3 className="font-bold text-gray-900 text-sm">Son Firmalar</h3>
                    <button onClick={() => setActiveTab('firma-listesi')} className="text-xs text-blue-600 hover:underline">Tümü →</button>
                  </div>
                  {customers.length === 0 && <p className="p-6 text-xs text-gray-400 text-center">Henüz firma yok.</p>}
                  {customers.slice(0, 6).map(c => (
                    <div key={c.id} onClick={() => { setSelectedCustomer(c); setShowCustomerDetail(true) }}
                      className="px-4 py-3 flex items-center justify-between border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 font-bold text-xs">{c.full_name?.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{c.full_name}</p>
                          <p className="text-xs text-gray-500">{c.company_name || c.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                          {branches.filter(b => b.owner_id === c.id).length} şube
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {c.is_active ? 'Aktif' : 'Pasif'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <h3 className="font-bold text-gray-900 text-sm mb-3">Gelir Özeti</h3>
                    <div className="space-y-2">
                      {[
                        { label: 'Tahsil Edilen', value: `₺${paidInvoicesTotal.toLocaleString()}`, color: 'text-green-600', bg: 'bg-green-50' },
                        { label: 'Bekleyen', value: `₺${pendingInvoicesTotal.toLocaleString()}`, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'Aktif Firma', value: customers.filter(c => c.is_active).length, color: 'text-blue-600', bg: 'bg-blue-50' },
                      ].map(item => (
                        <div key={item.label} className={`${item.bg} rounded-lg px-3 py-2.5 flex justify-between items-center`}>
                          <span className="text-xs text-gray-600">{item.label}</span>
                          <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <h3 className="font-bold text-gray-900 text-sm mb-3">Hızlı İşlemler</h3>
                    <div className="space-y-2">
                      <button onClick={() => { setActiveTab('firma-listesi'); setShowAddCustomer(true) }}
                        className="w-full text-left text-xs px-3 py-2.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium">
                        + Yeni Firma Ekle
                      </button>
                      <button onClick={() => setActiveTab('fatura-faturalar')}
                        className="w-full text-left text-xs px-3 py-2.5 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 font-medium">
                        🧾 Fatura Oluştur
                      </button>
                      <button onClick={() => setActiveTab('guvenlik-loglar')}
                        className="w-full text-left text-xs px-3 py-2.5 bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 font-medium">
                        🔒 Denetim Logları
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* FİRMA LİSTESİ */}
          {activeTab === 'firma-listesi' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">{filteredCustomers.length} firma kayıtlı</p>
                <button onClick={() => setShowAddCustomer(!showAddCustomer)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                  + Firma Ekle
                </button>
              </div>

              {showAddCustomer && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Yeni Firma Ekle</h3>
                    <button onClick={() => setShowAddCustomer(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                  </div>
                  <form onSubmit={handleAddCustomer} className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Ad Soyad *', value: newName, set: setNewName, placeholder: 'Ad Soyad', type: 'text', required: true },
                      { label: 'Şirket Adı', value: newCompany, set: setNewCompany, placeholder: 'Şirket adı', type: 'text', required: false },
                      { label: 'E-posta *', value: newEmail, set: setNewEmail, placeholder: 'email@example.com', type: 'email', required: true },
                      { label: 'Şifre *', value: newPassword, set: setNewPassword, placeholder: 'En az 6 karakter', type: 'password', required: true },
                      { label: 'Şube Başı Ücret (₺)', value: newPerBranchFee, set: setNewPerBranchFee, placeholder: '2500', type: 'number', required: false },
                      { label: 'Aylık Sabit Ücret (₺)', value: newMonthlyFee, set: setNewMonthlyFee, placeholder: '0', type: 'number', required: false },
                    ].map(field => (
                      <div key={field.label}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
                        <input type={field.type} value={field.value} onChange={e => field.set(e.target.value)}
                          required={field.required} placeholder={field.placeholder}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Sektör</label>
                      <select value={newSector} onChange={e => setNewSector(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Seçin...</option>
                        <option value="saglik">Sağlık</option>
                        <option value="estetik">Estetik & Güzellik</option>
                        <option value="turizm">Turizm</option>
                        <option value="restoran">Restoran & Gıda</option>
                        <option value="egitim">Eğitim</option>
                        <option value="gayrimenkul">Gayrimenkul</option>
                        <option value="diger">Diğer</option>
                      </select>
                    </div>
                    <div className="col-span-2 flex gap-3 pt-1">
                      <button type="submit" disabled={saving}
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium">
                        {saving ? 'Ekleniyor...' : 'Firma Ekle'}
                      </button>
                      <button type="button" onClick={() => setShowAddCustomer(false)}
                        className="border border-gray-200 text-gray-600 px-5 py-2.5 rounded-lg text-sm">
                        İptal
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                {filteredCustomers.length === 0 ? (
                  <div className="p-16 text-center">
                    <span className="text-4xl mb-3 block">🏢</span>
                    <p className="text-gray-500 text-sm">Henüz firma yok.</p>
                  </div>
                ) : filteredCustomers.map(c => (
                  <div key={c.id} className="px-5 py-4 flex items-center justify-between border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <div className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => { setSelectedCustomer(c); setShowCustomerDetail(true) }}>
                      <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 font-bold text-sm">{c.full_name?.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{c.full_name}</p>
                        <p className="text-xs text-gray-500">{c.email} {c.company_name && `• ${c.company_name}`}</p>
                        <div className="flex gap-1.5 mt-1">
                          {c.sector && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{c.sector}</span>}
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{c.subscriptions?.[0]?.plan || 'trial'}</span>
                          <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">{branches.filter(b => b.owner_id === c.id).length} şube</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleToggleActive(c)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${c.is_active ? 'bg-green-500' : 'bg-gray-300'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${c.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* FATURALAR */}
          {activeTab === 'fatura-faturalar' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">{invoices.length} fatura</p>
                <button onClick={handleGenerateInvoices} disabled={generatingInvoices}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium">
                  {generatingInvoices ? 'Oluşturuluyor...' : '🧾 Bu Ay Fatura Oluştur'}
                </button>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                {invoices.length === 0 ? (
                  <div className="p-16 text-center">
                    <span className="text-4xl mb-3 block">🧾</span>
                    <p className="text-gray-500 text-sm">Henüz fatura yok.</p>
                  </div>
                ) : invoices.map(inv => (
                  <div key={inv.id} className="px-5 py-4 flex items-center justify-between border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{inv.profiles?.full_name}</p>
                      <p className="text-xs text-gray-500">{inv.branch_count} şube × ₺{inv.per_branch_fee} • {inv.due_date ? new Date(inv.due_date).toLocaleDateString('tr-TR') : '-'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-bold text-gray-900">₺{inv.total_amount?.toLocaleString()}</p>
                      {inv.status === 'pending' ? (
                        <button onClick={() => handleMarkPaid(inv.id)}
                          className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700">Ödendi</button>
                      ) : (
                        <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full">✅ Ödendi</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* TÜM KULLANICILAR */}
          {activeTab === 'kullanici-listesi' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 text-sm">{allUsers.length} Kullanıcı</h3>
              </div>
              {allUsers.map(u => (
                <div key={u.id} className="px-5 py-3.5 flex items-center justify-between border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                      <span className="text-slate-600 font-bold text-xs">{u.full_name?.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{u.full_name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      u.role === 'super_admin' ? 'bg-red-100 text-red-700' :
                      u.role === 'customer' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{u.role}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* DENETİM LOGLARI */}
          {activeTab === 'guvenlik-loglar' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <span className="text-4xl mb-3 block">🔒</span>
              <h3 className="font-bold text-gray-900 mb-2">Denetim Logları</h3>
              <p className="text-gray-500 text-sm">Tüm sistem hareketleri burada görünecek. Yakında aktif olacak.</p>
            </div>
          )}

          {/* DEStek - KİMLİK TAKLİDİ */}
          {activeTab === 'destek-impersonation' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-2">Kimlik Taklidi (Impersonation)</h3>
              <p className="text-gray-500 text-sm mb-5">Firma tarafından onaylanan destek taleplerine 24 saatlik geçici erişim.</p>
              <div className="space-y-3">
                {customers.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{c.full_name}</p>
                      <p className="text-xs text-gray-500">{c.company_name}</p>
                    </div>
                    <button className="bg-amber-100 text-amber-700 text-xs px-3 py-2 rounded-lg font-medium hover:bg-amber-200">
                      24 Saat Erişim İste
                    </button>
                  </div>
                ))}
                {customers.length === 0 && <p className="text-gray-400 text-sm text-center">Firma yok.</p>}
              </div>
            </div>
          )}

          {/* PLACEHOLDER - diğer sayfalar */}
          {!['dashboard', 'firma-listesi', 'fatura-faturalar', 'kullanici-listesi', 'guvenlik-loglar', 'destek-impersonation'].includes(activeTab) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <span className="text-5xl mb-4 block">🚧</span>
              <h3 className="font-bold text-gray-900 mb-2">{getPageTitle()}</h3>
              <p className="text-gray-500 text-sm">Bu modül yakında eklenecek.</p>
            </div>
          )}
        </div>
      </div>

      {/* FİRMA DETAY DRAWER */}
      {showCustomerDetail && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black bg-opacity-40" onClick={() => setShowCustomerDetail(false)} />
          <div className="w-[480px] bg-white h-full overflow-y-auto shadow-2xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-blue-600 font-bold">{selectedCustomer.full_name?.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{selectedCustomer.full_name}</h3>
                  <p className="text-xs text-gray-500">{selectedCustomer.company_name}</p>
                </div>
              </div>
              <button onClick={() => setShowCustomerDetail(false)} className="text-gray-400 hover:text-gray-600 text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">✕</button>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Genel Bilgiler</p>
                <div className="space-y-2">
                  {[
                    { label: 'E-posta', value: selectedCustomer.email },
                    { label: 'Sektör', value: selectedCustomer.sector || '-' },
                    { label: 'Şirket', value: selectedCustomer.company_name || '-' },
                    { label: 'Kayıt', value: new Date(selectedCustomer.created_at).toLocaleDateString('tr-TR') },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between py-2 border-b border-gray-50">
                      <span className="text-xs text-gray-500">{item.label}</span>
                      <span className="text-xs font-medium text-gray-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Plan & Fiyatlandırma</p>
                <div className="bg-blue-50 rounded-xl p-4 space-y-2">
                  {[
                    { label: 'Plan', value: selectedCustomer.subscriptions?.[0]?.plan || 'Trial' },
                    { label: 'Şube Başı', value: `₺${selectedCustomer.subscriptions?.[0]?.per_branch_fee || 0}` },
                    { label: 'Aylık Sabit', value: `₺${selectedCustomer.subscriptions?.[0]?.monthly_fee || 0}` },
                    { label: 'Ödeme Bitiş', value: selectedCustomer.subscriptions?.[0]?.paid_until ? new Date(selectedCustomer.subscriptions[0].paid_until).toLocaleDateString('tr-TR') : '-' },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between">
                      <span className="text-xs text-blue-600">{item.label}</span>
                      <span className="text-xs font-bold text-blue-800">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
                  Şubeler ({branches.filter(b => b.owner_id === selectedCustomer.id).length})
                </p>
                {branches.filter(b => b.owner_id === selectedCustomer.id).length === 0 ? (
                  <p className="text-xs text-gray-400">Henüz şube yok.</p>
                ) : branches.filter(b => b.owner_id === selectedCustomer.id).map(b => (
                  <div key={b.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="text-xs font-medium text-gray-900">{b.branch_name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${b.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {b.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Hesap Durumu</p>
                <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
                  <span className="text-sm text-gray-700">{selectedCustomer.is_active ? 'Hesap Aktif' : 'Hesap Pasif'}</span>
                  <button onClick={() => { handleToggleActive(selectedCustomer); setSelectedCustomer({ ...selectedCustomer, is_active: !selectedCustomer.is_active }) }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${selectedCustomer.is_active ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${selectedCustomer.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
