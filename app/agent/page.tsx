'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const menuStructure = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  {
    key: 'leadler', label: 'Leadlarım', icon: '📋', children: [
      { key: 'leadler-liste', label: 'Lead Listesi' },
      { key: 'leadler-bugun', label: 'Bugünkü Leadlar' },
    ]
  },
  {
    key: 'hakedis', label: 'Hakediş', icon: '💰', children: [
      { key: 'hakedis-ozet', label: 'Özet' },
      { key: 'hakedis-detay', label: 'Satış Detayı' },
    ]
  },
  { key: 'ayarlar', label: 'Ayarlar', icon: '⚙️' },
]

const STATUS_LABELS: any = {
  new: { label: 'Yeni', color: 'bg-blue-100 text-blue-700' },
  called: { label: 'Arındı', color: 'bg-yellow-100 text-yellow-700' },
  appointment_scheduled: { label: 'Randevu', color: 'bg-purple-100 text-purple-700' },
  procedure_done: { label: 'Satış', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'İptal', color: 'bg-red-100 text-red-700' },
}

export default function AgentPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [branch, setBranch] = useState<any>(null)
  const [teamMember, setTeamMember] = useState<any>(null)
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['leadler'])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [newStatus, setNewStatus] = useState('')
  const [note, setNote] = useState('')
  const [procedureType, setProcedureType] = useState('')
  const [procedureAmount, setProcedureAmount] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [appointmentDate, setAppointmentDate] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(profileData)

    const { data: tmData } = await supabase
      .from('team_members').select('*, branches(*)')
      .eq('user_id', user.id).single()

    if (tmData) {
      setTeamMember(tmData)
      setBranch(tmData.branches)

      const { data: leadsData } = await supabase
        .from('leads').select('*')
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false })
      setLeads(leadsData || [])
    }

    setLoading(false)
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
      lead_id: selectedLead.id,
      changed_by: profile.id,
      old_status: selectedLead.status,
      new_status: newStatus,
      note,
    })

    setSelectedLead(null)
    setNote(''); setProcedureType(''); setProcedureAmount(''); setCancelReason(''); setAppointmentDate('')
    loadData()
    setSaving(false)
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
        if (child) return `${item.label} › ${child.label}`
      }
    }
    return 'Dashboard'
  }

  const today = new Date().toDateString()
  const todayLeads = leads.filter(l => new Date(l.created_at).toDateString() === today)
  const totalSales = leads.filter(l => l.status === 'procedure_done')
  const totalRevenue = totalSales.reduce((sum, l) => sum + (l.procedure_amount || 0), 0)
  const commission = totalRevenue * ((teamMember?.commission_rate || 0) / 100)
  const conversionRate = leads.length > 0 ? ((totalSales.length / leads.length) * 100).toFixed(1) : '0'

  if (loading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 bg-violet-600 rounded-xl flex items-center justify-center mx-auto mb-3">
          <span className="text-white font-bold text-xl">D</span>
        </div>
        <p className="text-gray-500 text-sm">Yükleniyor...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100 flex">

      {/* SIDEBAR */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} min-h-screen bg-violet-950 flex flex-col fixed left-0 top-0 shadow-xl transition-all duration-300 z-20`}>
        <div className="p-4 border-b border-violet-900 flex items-center justify-between">
          {!sidebarCollapsed ? (
            <>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-violet-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">D</span>
                </div>
                <span className="text-white font-bold">DataPilot</span>
              </div>
              <button onClick={() => setSidebarCollapsed(true)} className="text-violet-400 hover:text-white text-xs">◀</button>
            </>
          ) : (
            <button onClick={() => setSidebarCollapsed(false)} className="w-8 h-8 bg-violet-500 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-sm">D</span>
            </button>
          )}
        </div>

        {!sidebarCollapsed && (
          <div className="px-4 py-3 border-b border-violet-900">
            <p className="text-violet-400 text-xs uppercase tracking-wide mb-1">Şube</p>
            <p className="text-white font-semibold text-sm truncate">{branch?.branch_name || 'Yükleniyor...'}</p>
            <span className="text-xs bg-violet-900 text-violet-300 px-2 py-0.5 rounded-full mt-1 inline-block">Satışçı</span>
          </div>
        )}

        <nav className="flex-1 p-2 overflow-y-auto space-y-0.5">
          {menuStructure.map(item => (
            <div key={item.key}>
              <button
                onClick={() => item.children ? toggleMenu(item.key) : setActiveTab(item.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${activeTab === item.key ? 'bg-violet-600 text-white' : 'text-violet-300 hover:bg-violet-900 hover:text-white'}`}>
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
                <div className="ml-3 mt-0.5 border-l border-violet-900 pl-3 space-y-0.5">
                  {item.children.map(child => (
                    <button key={child.key} onClick={() => setActiveTab(child.key)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${activeTab === child.key ? 'bg-violet-600 text-white font-medium' : 'text-violet-400 hover:bg-violet-900 hover:text-white'}`}>
                      {child.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {!sidebarCollapsed && (
          <div className="p-3 border-t border-violet-900">
            <div className="flex items-center gap-2.5 px-2 mb-2">
              <div className="w-7 h-7 bg-violet-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">{profile?.full_name?.charAt(0)}</span>
              </div>
              <div className="overflow-hidden">
                <p className="text-white text-xs font-semibold truncate">{profile?.full_name}</p>
                <p className="text-violet-400 text-xs truncate">{profile?.email}</p>
              </div>
            </div>
            <button onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-violet-400 hover:bg-violet-900 hover:text-white">
              🚪 Çıkış Yap
            </button>
          </div>
        )}
      </div>

      {/* MAIN */}
      <div className={`${sidebarCollapsed ? 'ml-16' : 'ml-64'} flex-1 transition-all duration-300`}>

        {/* TOP BAR */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
          <h1 className="font-bold text-gray-900">{getPageTitle()}</h1>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-gray-500">Bugün {todayLeads.length} yeni lead</span>
            <span className="bg-violet-100 text-violet-700 text-xs font-medium px-3 py-1.5 rounded-full">Satışçı</span>
          </div>
        </div>

        <div className="p-6">
          <p className="text-xs text-gray-400 mb-5">DataPilot › <span className="text-gray-700 font-medium">{getPageTitle()}</span></p>

          {/* DASHBOARD */}
          {activeTab === 'dashboard' && (
            <>
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Toplam Leadım', value: leads.length, icon: '📋', color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Satışlarım', value: totalSales.length, icon: '✅', color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'Dönüşüm', value: `%${conversionRate}`, icon: '📈', color: 'text-purple-600', bg: 'bg-purple-50' },
                  { label: 'Kazanılan Prim', value: `₺${commission.toLocaleString()}`, icon: '💰', color: 'text-amber-600', bg: 'bg-amber-50' },
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
                    <h3 className="font-bold text-gray-900 text-sm">Son Leadlarım</h3>
                    <button onClick={() => setActiveTab('leadler-liste')} className="text-xs text-violet-600 hover:underline">Tümü →</button>
                  </div>
                  {leads.slice(0, 6).map(lead => (
                    <div key={lead.id} className="px-4 py-3 flex items-center justify-between border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer"
                      onClick={() => { setSelectedLead(lead); setNewStatus(lead.status) }}>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{lead.full_name || 'İsimsiz'}</p>
                        <p className="text-xs text-gray-500">{lead.phone} • {new Date(lead.created_at).toLocaleDateString('tr-TR')}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_LABELS[lead.status]?.color}`}>
                        {STATUS_LABELS[lead.status]?.label}
                      </span>
                    </div>
                  ))}
                  {leads.length === 0 && <p className="p-6 text-xs text-gray-400 text-center">Henüz lead atanmadı.</p>}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900 text-sm">Bu Ayki Özet</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {[
                      { label: 'Toplam Ciro', value: `₺${totalRevenue.toLocaleString()}`, color: 'text-green-600', bg: 'bg-green-50' },
                      { label: 'Prim Oranı', value: `%${teamMember?.commission_rate || 0}`, color: 'text-blue-600', bg: 'bg-blue-50' },
                      { label: 'Kazanılan Prim', value: `₺${commission.toLocaleString()}`, color: 'text-amber-600', bg: 'bg-amber-50' },
                      { label: 'Bugün Gelen', value: todayLeads.length, color: 'text-purple-600', bg: 'bg-purple-50' },
                    ].map(item => (
                      <div key={item.label} className={`${item.bg} rounded-lg px-3 py-2.5 flex justify-between items-center`}>
                        <span className="text-xs text-gray-600">{item.label}</span>
                        <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* LEAD LİSTESİ */}
          {activeTab === 'leadler-liste' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 text-sm">{leads.length} Lead</h3>
              </div>
              {leads.length === 0 ? (
                <div className="p-12 text-center">
                  <span className="text-4xl mb-3 block">📭</span>
                  <p className="text-gray-500 text-sm">Henüz lead atanmadı.</p>
                </div>
              ) : leads.map(lead => (
                <div key={lead.id} className="px-5 py-4 flex items-center justify-between border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{lead.full_name || 'İsimsiz'}</p>
                    <p className="text-xs text-gray-500">{lead.phone} {lead.email && `• ${lead.email}`}</p>
                    <p className="text-xs text-gray-400">{new Date(lead.created_at).toLocaleDateString('tr-TR')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_LABELS[lead.status]?.color}`}>
                      {STATUS_LABELS[lead.status]?.label}
                    </span>
                    <button onClick={() => { setSelectedLead(lead); setNewStatus(lead.status) }}
                      className="bg-violet-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-violet-700">
                      Güncelle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* BUGÜNKÜ LEADLAR */}
          {activeTab === 'leadler-bugun' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 text-sm">Bugünkü Leadlar ({todayLeads.length})</h3>
              </div>
              {todayLeads.length === 0 ? (
                <div className="p-12 text-center">
                  <span className="text-4xl mb-3 block">📭</span>
                  <p className="text-gray-500 text-sm">Bugün henüz lead gelmedi.</p>
                </div>
              ) : todayLeads.map(lead => (
                <div key={lead.id} className="px-5 py-4 flex items-center justify-between border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{lead.full_name || 'İsimsiz'}</p>
                    <p className="text-xs text-gray-500">{lead.phone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_LABELS[lead.status]?.color}`}>
                      {STATUS_LABELS[lead.status]?.label}
                    </span>
                    <button onClick={() => { setSelectedLead(lead); setNewStatus(lead.status) }}
                      className="bg-violet-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-violet-700">
                      Güncelle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* HAKEDİŞ ÖZET */}
          {activeTab === 'hakedis-ozet' && (
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Toplam Satış', value: totalSales.length, icon: '✅', color: 'text-green-600', bg: 'bg-green-50' },
                { label: 'Toplam Ciro', value: `₺${totalRevenue.toLocaleString()}`, icon: '📊', color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Prim Oranı', value: `%${teamMember?.commission_rate || 0}`, icon: '📈', color: 'text-purple-600', bg: 'bg-purple-50' },
                { label: 'Kazanılan Prim', value: `₺${commission.toLocaleString()}`, icon: '💰', color: 'text-amber-600', bg: 'bg-amber-50' },
              ].map(card => (
                <div key={card.label} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center text-2xl mb-4`}>{card.icon}</div>
                  <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{card.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* HAKEDİŞ DETAY */}
          {activeTab === 'hakedis-detay' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 text-sm">Satış Detayları</h3>
              </div>
              {totalSales.length === 0 ? (
                <div className="p-12 text-center">
                  <span className="text-4xl mb-3 block">📊</span>
                  <p className="text-gray-500 text-sm">Henüz satış yok.</p>
                </div>
              ) : totalSales.map(lead => {
                const saleCommission = (lead.procedure_amount || 0) * ((teamMember?.commission_rate || 0) / 100)
                return (
                  <div key={lead.id} className="px-5 py-4 flex items-center justify-between border-b border-gray-50 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{lead.full_name || 'İsimsiz'}</p>
                      <p className="text-xs text-gray-500">{lead.procedure_type || '-'} • {lead.procedure_date ? new Date(lead.procedure_date).toLocaleDateString('tr-TR') : '-'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">₺{(lead.procedure_amount || 0).toLocaleString()}</p>
                      <p className="text-xs text-amber-600">Prim: ₺{saleCommission.toLocaleString()}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* PLACEHOLDER */}
          {!['dashboard', 'leadler-liste', 'leadler-bugun', 'hakedis-ozet', 'hakedis-detay'].includes(activeTab) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <span className="text-5xl mb-4 block">🚧</span>
              <h3 className="font-bold text-gray-900 mb-2">{getPageTitle()}</h3>
              <p className="text-gray-500 text-sm">Bu modül yakında eklenecek.</p>
            </div>
          )}
        </div>
      </div>

      {/* DURUM GÜNCELLEME MODAL */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900">Durum Güncelle</h3>
                <p className="text-gray-500 text-sm">{selectedLead.full_name}</p>
              </div>
              <button onClick={() => setSelectedLead(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Yeni Durum</label>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)} required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                  <option value="">Seçin...</option>
                  <option value="called">Arındı</option>
                  <option value="appointment_scheduled">Randevu Alındı</option>
                  <option value="procedure_done">Satış Yapıldı</option>
                  <option value="cancelled">İptal</option>
                </select>
              </div>
              {newStatus === 'appointment_scheduled' && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Randevu Tarihi</label>
                  <input type="datetime-local" value={appointmentDate} onChange={e => setAppointmentDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
              )}
              {newStatus === 'procedure_done' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">İşlem / Ürün</label>
                    <input value={procedureType} onChange={e => setProcedureType(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="Ürün veya hizmet adı" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tutar (₺)</label>
                    <input type="number" value={procedureAmount} onChange={e => setProcedureAmount(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="0" />
                  </div>
                </>
              )}
              {newStatus === 'cancelled' && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">İptal Nedeni</label>
                  <input value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="İptal nedeni..." />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Not</label>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="Ek not..." />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setSelectedLead(null)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm">İptal</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-violet-600 text-white py-2.5 rounded-xl text-sm font-medium">
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
