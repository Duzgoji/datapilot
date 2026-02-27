'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const menuStructure = [
  {
    key: 'dashboard', label: 'Dashboard', icon: '📊',
  },
  {
    key: 'tenants', label: 'Firmalar', icon: '🏢', children: [
      { key: 'tenants-list', label: 'Firma Listesi' },
      { key: 'tenants-onboarding', label: 'Onboarding' },
    ]
  },
  {
    key: 'workspaces', label: 'Çalışma Alanları', icon: '🗂️',
  },
  {
    key: 'users', label: 'Kullanıcılar & Erişim', icon: '👥', children: [
      { key: 'users-list', label: 'Kullanıcılar' },
      { key: 'users-roles', label: 'Roller & İzinler' },
      { key: 'users-invites', label: 'Davetler' },
      { key: 'users-sessions', label: 'Oturumlar' },
    ]
  },
  {
    key: 'data', label: 'Veri', icon: '🗄️', children: [
      { key: 'data-sources', label: 'Kaynaklar' },
      { key: 'data-ingestion', label: 'Veri Akışları' },
      { key: 'data-schemas', label: 'Şemalar & Eşleştirme' },
      { key: 'data-quality', label: 'Veri Kalitesi' },
      { key: 'data-storage', label: 'Depolama & Saklama' },
    ]
  },
  {
    key: 'analytics', label: 'Analitik', icon: '📈', children: [
      { key: 'analytics-metrics', label: 'Metrik Oluşturucu' },
      { key: 'analytics-insights', label: 'İçgörü Modelleri' },
      { key: 'analytics-experiments', label: 'Deneyler' },
    ]
  },
  {
    key: 'reports', label: 'Raporlar', icon: '📋', children: [
      { key: 'reports-dashboards', label: 'Dashboard\'lar' },
      { key: 'reports-list', label: 'Raporlar' },
      { key: 'reports-scheduling', label: 'Zamanlama' },
      { key: 'reports-exports', label: 'Dışa Aktarma' },
    ]
  },
  {
    key: 'integrations', label: 'Entegrasyonlar', icon: '🔌', children: [
      { key: 'integrations-catalog', label: 'Katalog' },
      { key: 'integrations-connections', label: 'Bağlantılar' },
      { key: 'integrations-webhooks', label: 'Webhook & API' },
      { key: 'integrations-health', label: 'Sağlık Durumu' },
    ]
  },
  {
    key: 'billing', label: 'Faturalama', icon: '💳', children: [
      { key: 'billing-plans', label: 'Planlar' },
      { key: 'billing-subscriptions', label: 'Abonelikler' },
      { key: 'billing-invoices', label: 'Faturalar' },
      { key: 'billing-usage', label: 'Kullanım' },
    ]
  },
  {
    key: 'security', label: 'Güvenlik', icon: '🔒', children: [
      { key: 'security-audit', label: 'Denetim Logları' },
      { key: 'security-policies', label: 'Politikalar' },
      { key: 'security-keys', label: 'Anahtarlar & Sırlar' },
      { key: 'security-privacy', label: 'Gizlilik Talepleri' },
    ]
  },
  {
    key: 'operations', label: 'Operasyonlar', icon: '⚙️', children: [
      { key: 'operations-status', label: 'Sistem Durumu' },
      { key: 'operations-logs', label: 'Loglar' },
      { key: 'operations-alerts', label: 'Uyarılar' },
      { key: 'operations-flags', label: 'Özellik Bayrakları' },
    ]
  },
  {
    key: 'support', label: 'Destek', icon: '🎧', children: [
      { key: 'support-tickets', label: 'Talepler' },
      { key: 'support-impersonation', label: 'Kimlik Taklidi' },
      { key: 'support-kb', label: 'Bilgi Bankası' },
    ]
  },
  {
    key: 'settings', label: 'Platform Ayarları', icon: '🛠️',
  },
]

export default function SuperAdminPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['tenants'])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])

  // Firma ekleme
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
  const [notifications] = useState(3)

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
      setNewName(''); setNewEmail(''); setNewPassword(''); setNewCompany(''); setNewSector(''); setNewPerBranchFee(''); setNewMonthlyFee('')
      loadData()
    }
    setSaving(false)
  }

  const handleToggleActive = async (customer: any) => {
    await supabase.from('profiles').update({ is_active: !customer.is_active }).eq('id', customer.id)
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
        if (child) return child.label
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

        {/* Logo */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">D</span>
              </div>
              <span className="text-white font-bold text-lg">DataPilot</span>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white font-bold">D</span>
            </div>
          )}
          {!sidebarCollapsed && (
            <button onClick={() => setSidebarCollapsed(true)} className="text-slate-400 hover:text-white">
              ◀
            </button>
          )}
        </div>

        {sidebarCollapsed && (
          <button onClick={() => setSidebarCollapsed(false)} className="text-slate-400 hover:text-white p-4 text-center">
            ▶
          </button>
        )}

        {/* Nav */}
        <nav className="flex-1 p-3 overflow-y-auto space-y-0.5">
          {menuStructure.map(item => (
            <div key={item.key}>
              <button
                onClick={() => {
                  if (item.children) {
                    toggleMenu(item.key)
                  } else {
                    setActiveTab(item.key)
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${activeTab === item.key ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                <span className="text-base flex-shrink-0">{item.icon}</span>
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.children && (
                      <span className="text-xs">{expandedMenus.includes(item.key) ? '▼' : '▶'}</span>
                    )}
                  </>
                )}
              </button>

              {/* Alt menüler */}
              {item.children && expandedMenus.includes(item.key) && !sidebarCollapsed && (
                <div className="ml-4 mt-0.5 space-y-0.5 border-l border-slate-700 pl-3">
                  {item.children.map(child => (
                    <button key={child.key}
                      onClick={() => setActiveTab(child.key)}
                      className={`w-full flex items-center px-3 py-2 rounded-lg text-xs transition-all text-left ${activeTab === child.key ? 'bg-blue-600 text-white font-medium' : 'text-slate-500 hover:bg-slate-800 hover:text-white'}`}>
                      {child.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* User */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">{profile?.full_name?.charAt(0)}</span>
              </div>
              <div className="overflow-hidden">
                <p className="text-white text-xs font-semibold truncate">{profile?.full_name}</p>
                <p className="text-slate-400 text-xs truncate">{profile?.email}</p>
              </div>
            </div>
            <button onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
              🚪 Çıkış Yap
            </button>
          </div>
        )}
      </div>

      {/* MAIN */}
      <div className={`${sidebarCollapsed ? 'ml-16' : 'ml-64'} flex-1 transition-all duration-300`}>

        {/* TOP BAR */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4 flex-1">
            {/* Global Search */}
            <div className="relative flex-1 max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Firma, kullanıcı, lead ara..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Actions */}
            <button onClick={() => { setActiveTab('tenants-list'); setShowAddCustomer(true) }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded-lg font-medium">
              + Firma Ekle
            </button>

            {/* Notifications */}
            <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
              🔔
              {notifications > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>

            {/* Admin badge */}
            <span className="bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full">
              Super Admin
            </span>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div className="p-6">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
            <span>DataPilot</span>
            <span>›</span>
            <span className="text-gray-900 font-medium">{getPageTitle()}</span>
          </div>

          {/* DASHBOARD */}
          {activeTab === 'dashboard' && (
            <>
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
                {[
                  { label: 'Toplam Firma', value: customers.length, icon: '🏢', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
                  { label: 'Toplam Şube', value: branches.length, icon: '📍', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
                  { label: 'Toplam Lead', value: leads.length, icon: '📋', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
                  { label: 'Bekleyen Tahsilat', value: `₺${pendingInvoicesTotal.toLocaleString()}`, icon: '💰', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
                ].map(card => (
                  <div key={card.label} className={`bg-white rounded-xl p-5 shadow-sm border ${card.border}`}>
                    <div className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center text-xl mb-3`}>
                      {card.icon}
                    </div>
                    <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{card.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-5">
                <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 text-sm">Son Firmalar</h3>
                    <button onClick={() => setActiveTab('tenants-list')} className="text-xs text-blue-600 hover:underline">Tümünü gör</button>
                  </div>
                  {customers.slice(0, 5).map(c => (
                    <div key={c.id} className="px-5 py-3.5 flex items-center justify-between border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer"
                      onClick={() => { setSelectedCustomer(c); setShowCustomerDetail(true) }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-xs">{c.full_name?.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{c.full_name}</p>
                          <p className="text-xs text-gray-500">{c.company_name} • {c.sector}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {c.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                  ))}
                  {customers.length === 0 && <p className="p-5 text-xs text-gray-400">Henüz firma yok.</p>}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="p-5 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900 text-sm">Gelir Özeti</h3>
                  </div>
                  <div className="p-5 space-y-3">
                    {[
                      { label: 'Tahsil Edilen', value: `₺${paidInvoicesTotal.toLocaleString()}`, color: 'text-green-600', bg: 'bg-green-50' },
                      { label: 'Bekleyen', value: `₺${pendingInvoicesTotal.toLocaleString()}`, color: 'text-amber-600', bg: 'bg-amber-50' },
                      { label: 'Aktif Firma', value: customers.filter(c => c.is_active).length, color: 'text-blue-600', bg: 'bg-blue-50' },
                    ].map(item => (
                      <div key={item.label} className={`${item.bg} rounded-lg p-3.5 flex items-center justify-between`}>
                        <p className="text-xs text-gray-600">{item.label}</p>
                        <p className={`font-bold text-sm ${item.color}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* FİRMA LİSTESİ */}
          {activeTab === 'tenants-list' && (
            <>
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm text-gray-500">{filteredCustomers.length} firma</p>
                <button onClick={() => setShowAddCustomer(!showAddCustomer)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                  + Firma Ekle
                </button>
              </div>

              {showAddCustomer && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-5">
                  <div className="flex items-center justify-between mb-5">
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
                    <div className="col-span-2 flex gap-3 pt-2">
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
                  <div key={c.id} className="px-5 py-4 flex items-center justify-between border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4 cursor-pointer flex-1"
                      onClick={() => { setSelectedCustomer(c); setShowCustomerDetail(true) }}>
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 font-bold text-sm">{c.full_name?.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{c.full_name}</p>
                        <p className="text-xs text-gray-500">{c.email} {c.company_name && `• ${c.company_name}`}</p>
                        <div className="flex gap-2 mt-1">
                          {c.sector && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{c.sector}</span>}
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                            {c.subscriptions?.[0]?.plan || 'trial'}
                          </span>
                          <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                            {branches.filter(b => b.owner_id === c.id).length} şube
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleActive(c)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${c.is_active ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${c.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ONBOARDING */}
          {activeTab === 'tenants-onboarding' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <span className="text-4xl mb-3 block">🚀</span>
              <h3 className="font-bold text-gray-900 mb-2">Onboarding Yönetimi</h3>
              <p className="text-gray-500 text-sm">Yakında eklenecek...</p>
            </div>
          )}

          {/* FATURALAR */}
          {activeTab === 'billing-invoices' && (
            <>
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm text-gray-500">{invoices.length} fatura</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                {invoices.length === 0 ? (
                  <div className="p-16 text-center">
                    <span className="text-4xl mb-3 block">🧾</span>
                    <p className="text-gray-500 text-sm">Henüz fatura yok.</p>
                  </div>
                ) : invoices.map(inv => (
                  <div key={inv.id} className="px-5 py-4 flex items-center justify-between border-b border-gray-50 last:border-0">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{inv.profiles?.full_name}</p>
                      <p className="text-xs text-gray-500">{inv.branch_count} şube × ₺{inv.per_branch_fee}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-bold text-gray-900">₺{inv.total_amount?.toLocaleString()}</p>
                      {inv.status === 'pending' ? (
                        <span className="bg-amber-100 text-amber-700 text-xs px-3 py-1 rounded-full">Bekliyor</span>
                      ) : (
                        <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full">✅ Ödendi</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* DİĞER SAYFALAR - PLACEHOLDER */}
          {!['dashboard', 'tenants-list', 'tenants-onboarding', 'billing-invoices'].includes(activeTab) && (
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
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-blue-600 font-bold">{selectedCustomer.full_name?.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{selectedCustomer.full_name}</h3>
                  <p className="text-xs text-gray-500">{selectedCustomer.company_name}</p>
                </div>
              </div>
              <button onClick={() => setShowCustomerDetail(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Genel Bilgiler */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Genel Bilgiler</h4>
                <div className="space-y-2">
                  {[
                    { label: 'E-posta', value: selectedCustomer.email },
                    { label: 'Sektör', value: selectedCustomer.sector || '-' },
                    { label: 'Kayıt Tarihi', value: new Date(selectedCustomer.created_at).toLocaleDateString('tr-TR') },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between py-2 border-b border-gray-50">
                      <span className="text-xs text-gray-500">{item.label}</span>
                      <span className="text-xs font-medium text-gray-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Plan & Abonelik */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Plan & Abonelik</h4>
                <div className="bg-blue-50 rounded-xl p-4 space-y-2">
                  {[
                    { label: 'Plan', value: selectedCustomer.subscriptions?.[0]?.plan || 'Trial' },
                    { label: 'Şube Başı Ücret', value: `₺${selectedCustomer.subscriptions?.[0]?.per_branch_fee || 0}` },
                    { label: 'Aylık Sabit', value: `₺${selectedCustomer.subscriptions?.[0]?.monthly_fee || 0}` },
                    { label: 'Ödeme Tarihi', value: selectedCustomer.subscriptions?.[0]?.paid_until ? new Date(selectedCustomer.subscriptions[0].paid_until).toLocaleDateString('tr-TR') : '-' },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between">
                      <span className="text-xs text-blue-600">{item.label}</span>
                      <span className="text-xs font-bold text-blue-800">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Şubeler */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
                  Şubeler ({branches.filter(b => b.owner_id === selectedCustomer.id).length})
                </h4>
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

              {/* Durum */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Durum</h4>
                <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
                  <span className="text-sm text-gray-700">Hesap Durumu</span>
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
