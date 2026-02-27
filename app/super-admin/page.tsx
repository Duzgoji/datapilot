'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const menuItems = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'customers', label: 'Musteriler', icon: '👥' },
  { key: 'branches', label: 'Subeler', icon: '🏢' },
  { key: 'invoices', label: 'Faturalar', icon: '🧾' },
  { key: 'settings', label: 'Ayarlar', icon: '⚙️' },
]

export default function SuperAdminPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [customers, setCustomers] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')

  // Müşteri ekleme
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newCompany, setNewCompany] = useState('')
  const [newSector, setNewSector] = useState('')
  const [newPerBranchFee, setNewPerBranchFee] = useState('')
  const [newMonthlyFee, setNewMonthlyFee] = useState('')
  const [saving, setSaving] = useState(false)

  // Cari modal
  const [showCariModal, setShowCariModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [cariPlan, setCariPlan] = useState('trial')
  const [cariPaidUntil, setCariPaidUntil] = useState('')
  const [cariNotes, setCariNotes] = useState('')

  // Fatura
  const [generatingInvoices, setGeneratingInvoices] = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (profileData?.role !== 'super_admin') { router.push('/login'); return }
    setProfile(profileData)

    const { data: customersData } = await supabase
      .from('profiles')
      .select('*, subscriptions(*)')
      .eq('role', 'customer')
      .order('created_at', { ascending: false })
    setCustomers(customersData || [])

    const { data: branchesData } = await supabase
      .from('branches')
      .select('*, profiles(full_name, company_name)')
      .order('created_at', { ascending: false })
    setBranches(branchesData || [])

    const { data: leadsData } = await supabase
      .from('leads')
      .select('id, status, procedure_amount, created_at')
    setLeads(leadsData || [])

    const { data: invoicesData } = await supabase
      .from('invoices')
      .select('*, profiles(full_name, company_name)')
      .order('created_at', { ascending: false })
    setInvoices(invoicesData || [])

    setLoading(false)
  }

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const { data, error } = await supabase.auth.signUp({
      email: newEmail,
      password: newPassword,
      options: { data: { full_name: newName, role: 'customer' } }
    })

    if (error) { alert(error.message); setSaving(false); return }

    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email: newEmail,
        full_name: newName,
        role: 'customer',
        company_name: newCompany,
        sector: newSector,
        is_active: true,
      })
      await supabase.from('subscriptions').insert({
        owner_id: data.user.id,
        plan: 'trial',
        status: 'active',
        monthly_fee: parseFloat(newMonthlyFee) || 0,
        per_branch_fee: parseFloat(newPerBranchFee) || 0,
      })
      setNewName(''); setNewEmail(''); setNewPassword('')
      setNewCompany(''); setNewSector(''); setNewPerBranchFee(''); setNewMonthlyFee('')
      setShowAddCustomer(false)
      loadData()
    }
    setSaving(false)
  }

  const handleToggleActive = async (customer: any) => {
    await supabase.from('profiles').update({ is_active: !customer.is_active }).eq('id', customer.id)
    loadData()
  }

  const handleSaveCari = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer) return
    setSaving(true)
    await supabase.from('subscriptions')
      .update({ plan: cariPlan, paid_until: cariPaidUntil || null, notes: cariNotes })
      .eq('owner_id', selectedCustomer.id)
    setShowCariModal(false)
    loadData()
    setSaving(false)
  }

  const handleGenerateInvoices = async () => {
    setGeneratingInvoices(true)
    const dueDate = new Date()
    dueDate.setDate(15)

    for (const customer of customers) {
      const customerBranches = branches.filter(b => b.owner_id === customer.id)
      const branchCount = customerBranches.length
      const perBranchFee = customer.subscriptions?.[0]?.per_branch_fee || 0
      const totalAmount = branchCount * perBranchFee

      if (totalAmount > 0) {
        await supabase.from('invoices').insert({
          owner_id: customer.id,
          branch_count: branchCount,
          per_branch_fee: perBranchFee,
          total_amount: totalAmount,
          status: 'pending',
          due_date: dueDate.toISOString().split('T')[0],
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

  const totalRevenue = leads.filter(l => l.status === 'procedure_done').reduce((sum, l) => sum + (l.procedure_amount || 0), 0)
  const pendingInvoicesTotal = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + (i.total_amount || 0), 0)
  const paidInvoicesTotal = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total_amount || 0), 0)

  if (loading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <p className="text-gray-500">Yükleniyor...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100 flex">

      {/* SIDEBAR */}
      <div className="w-64 min-h-screen bg-slate-900 flex flex-col fixed left-0 top-0 shadow-xl">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow">
              <span className="text-white font-bold text-xl">D</span>
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-tight">DataPilot</p>
              <p className="text-slate-400 text-xs">Super Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map(item => (
            <button key={item.key} onClick={() => setActiveTab(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${activeTab === item.key
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="px-4 mb-3">
            <p className="text-white text-sm font-semibold">{profile?.full_name}</p>
            <p className="text-slate-400 text-xs truncate">{profile?.email}</p>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
            <span>🚪</span> Çıkış Yap
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div className="ml-64 flex-1">

        {/* TOP BAR */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {menuItems.find(m => m.key === activeTab)?.label}
            </h1>
            <p className="text-sm text-gray-500">DataPilot Yönetim Paneli</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">Super Admin</span>
          </div>
        </div>

        <div className="p-8">

          {/* DASHBOARD */}
          {activeTab === 'dashboard' && (
            <>
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                {[
                  { label: 'Toplam Müşteri', value: customers.length, icon: '👥', color: 'bg-blue-600', light: 'bg-blue-50 text-blue-600' },
                  { label: 'Toplam Şube', value: branches.length, icon: '🏢', color: 'bg-purple-600', light: 'bg-purple-50 text-purple-600' },
                  { label: 'Toplam Lead', value: leads.length, icon: '📋', color: 'bg-green-600', light: 'bg-green-50 text-green-600' },
                  { label: 'Bekleyen Tahsilat', value: `₺${pendingInvoicesTotal.toLocaleString()}`, icon: '💰', color: 'bg-amber-500', light: 'bg-amber-50 text-amber-600' },
                ].map(card => (
                  <div key={card.label} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className={`w-12 h-12 ${card.light} rounded-xl flex items-center justify-center text-2xl mb-4`}>
                      {card.icon}
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                    <p className="text-sm text-gray-500 mt-1">{card.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                  <div className="p-6 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">Son Müşteriler</h3>
                  </div>
                  {customers.slice(0, 5).map(c => (
                    <div key={c.id} className="px-6 py-4 flex items-center justify-between border-b border-gray-50 last:border-0">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{c.full_name}</p>
                        <p className="text-xs text-gray-500">{c.company_name} • {c.sector}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {c.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                  ))}
                  {customers.length === 0 && <p className="p-6 text-gray-400 text-sm">Henüz müşteri yok.</p>}
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                  <div className="p-6 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">Gelir Özeti</h3>
                  </div>
                  <div className="p-6 space-y-4">
                    {[
                      { label: 'Tahsil Edilen', value: `₺${paidInvoicesTotal.toLocaleString()}`, color: 'text-green-600', bg: 'bg-green-50' },
                      { label: 'Bekleyen', value: `₺${pendingInvoicesTotal.toLocaleString()}`, color: 'text-amber-600', bg: 'bg-amber-50' },
                      { label: 'Toplam Lead Cirosu', value: `₺${totalRevenue.toLocaleString()}`, color: 'text-blue-600', bg: 'bg-blue-50' },
                    ].map(item => (
                      <div key={item.label} className={`${item.bg} rounded-xl p-4 flex items-center justify-between`}>
                        <p className="text-sm text-gray-600">{item.label}</p>
                        <p className={`font-bold ${item.color}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* MÜŞTERİLER */}
          {activeTab === 'customers' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-gray-500 text-sm">{customers.length} kayıtlı müşteri</p>
                </div>
                <button onClick={() => setShowAddCustomer(!showAddCustomer)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow">
                  + Müşteri Ekle
                </button>
              </div>

              {showAddCustomer && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                  <h3 className="font-bold text-gray-900 mb-5">Yeni Müşteri</h3>
                  <form onSubmit={handleAddCustomer} className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Ad Soyad *</label>
                      <input value={newName} onChange={e => setNewName(e.target.value)} required
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ad Soyad" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Şirket Adı</label>
                      <input value={newCompany} onChange={e => setNewCompany(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Şirket adı" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Sektör</label>
                      <select value={newSector} onChange={e => setNewSector(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
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
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">E-posta *</label>
                      <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="musteri@email.com" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Şifre *</label>
                      <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="En az 6 karakter" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Şube Başı Ücret (₺)</label>
                      <input type="number" value={newPerBranchFee} onChange={e => setNewPerBranchFee(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="2500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Aylık Sabit Ücret (₺)</label>
                      <input type="number" value={newMonthlyFee} onChange={e => setNewMonthlyFee(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0" />
                    </div>
                    <div className="col-span-2 flex gap-3 pt-2">
                      <button type="submit" disabled={saving}
                        className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium">
                        {saving ? 'Ekleniyor...' : 'Müşteri Ekle'}
                      </button>
                      <button type="button" onClick={() => setShowAddCustomer(false)}
                        className="border border-gray-200 text-gray-600 px-6 py-2.5 rounded-xl text-sm">
                        İptal
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                {customers.length === 0 ? (
                  <div className="p-16 text-center">
                    <span className="text-5xl mb-4 block">👥</span>
                    <p className="text-gray-500">Henüz müşteri yok.</p>
                  </div>
                ) : customers.map(c => (
                  <div key={c.id} className="px-6 py-4 flex items-center justify-between border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-sm">{c.full_name?.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{c.full_name}</p>
                        <p className="text-xs text-gray-500">{c.email} {c.company_name && `• ${c.company_name}`}</p>
                        <div className="flex gap-2 mt-1">
                          {c.sector && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{c.sector}</span>}
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                            ₺{c.subscriptions?.[0]?.per_branch_fee || 0}/şube
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleToggleActive(c)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${c.is_active ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${c.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                      <button onClick={() => {
                        setSelectedCustomer(c)
                        setCariPlan(c.subscriptions?.[0]?.plan || 'trial')
                        setCariPaidUntil(c.subscriptions?.[0]?.paid_until?.split('T')[0] || '')
                        setCariNotes(c.subscriptions?.[0]?.notes || '')
                        setShowCariModal(true)
                      }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium">
                        Cari
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ŞUBELER */}
          {activeTab === 'branches' && (
            <>
              <div className="mb-6">
                <p className="text-gray-500 text-sm">{branches.length} kayıtlı şube</p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                {branches.length === 0 ? (
                  <div className="p-16 text-center">
                    <span className="text-5xl mb-4 block">🏢</span>
                    <p className="text-gray-500">Henüz şube yok.</p>
                  </div>
                ) : branches.map(b => (
                  <div key={b.id} className="px-6 py-4 flex items-center justify-between border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{b.branch_name}</p>
                      <p className="text-xs text-gray-500">{b.profiles?.company_name} • {b.contact_email}</p>
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full mt-1 inline-block">
                        {b.commission_model === 'fixed_rate' ? `%${b.commission_value}` :
                         b.commission_model === 'fixed_amount' ? `₺${b.commission_value}` : 'Özel'}
                      </span>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${b.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {b.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* FATURALAR */}
          {activeTab === 'invoices' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <p className="text-gray-500 text-sm">{invoices.length} fatura</p>
                <button onClick={handleGenerateInvoices} disabled={generatingInvoices}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow">
                  {generatingInvoices ? 'Oluşturuluyor...' : '🧾 Bu Ay Fatura Oluştur'}
                </button>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                {invoices.length === 0 ? (
                  <div className="p-16 text-center">
                    <span className="text-5xl mb-4 block">🧾</span>
                    <p className="text-gray-500">Henüz fatura yok.</p>
                  </div>
                ) : invoices.map(inv => (
                  <div key={inv.id} className="px-6 py-4 flex items-center justify-between border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{inv.profiles?.full_name}</p>
                      <p className="text-xs text-gray-500">{inv.branch_count} şube × ₺{inv.per_branch_fee} • Son ödeme: {inv.due_date ? new Date(inv.due_date).toLocaleDateString('tr-TR') : '-'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-bold text-gray-900">₺{inv.total_amount?.toLocaleString()}</p>
                      {inv.status === 'pending' ? (
                        <button onClick={() => handleMarkPaid(inv.id)}
                          className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700">
                          Ödendi
                        </button>
                      ) : (
                        <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">✅ Ödendi</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* AYARLAR */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h3 className="font-bold text-gray-900 mb-2">Sistem Ayarları</h3>
              <p className="text-gray-500 text-sm">Yakında eklenecek...</p>
            </div>
          )}

        </div>
      </div>

      {/* CARİ MODAL */}
      {showCariModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-bold text-gray-900 text-lg mb-1">Cari Düzenle</h3>
            <p className="text-gray-500 text-sm mb-4">{selectedCustomer.full_name}</p>
            <form onSubmit={handleSaveCari} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Plan</label>
                <select value={cariPlan} onChange={e => setCariPlan(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="trial">Trial</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ödendi (tarihe kadar)</label>
                <input type="date" value={cariPaidUntil} onChange={e => setCariPaidUntil(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Not</label>
                <textarea value={cariNotes} onChange={e => setCariNotes(e.target.value)} rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ödeme notu..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCariModal(false)}
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
    </div>
  )
}
