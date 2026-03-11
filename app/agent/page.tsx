'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

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

export default function AgentPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [teamMember, setTeamMember] = useState<any>(null)
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [newNote, setNewNote] = useState('')
  const [procedureAmount, setProcedureAmount] = useState('')
  const [saving, setSaving] = useState(false)

  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
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
    if (!profileData || !['agent', 'team'].includes(profileData.role)) {
      router.push('/login'); return
    }
    setProfile(profileData)

    // team_members kaydını bul
    const { data: memberData } = await supabase
      .from('team_members')
      .select('*, branches(branch_name, owner_id)')
      .eq('user_id', user.id)
      .single()
    setTeamMember(memberData)

    // Bu agent'a atanmış leadler
    const { data: leadsData } = await supabase
      .from('leads')
      .select('*')
      .eq('assigned_to', user.id)
      .order('created_at', { ascending: false })
    setLeads(leadsData || [])

    setLoading(false)
  }

  const handleUpdateLead = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const updateData: any = { status: newStatus }
    if (newNote) updateData.note = newNote
    if (newStatus === 'procedure_done' && procedureAmount) {
      updateData.procedure_amount = parseFloat(procedureAmount)
    }

    await supabase.from('leads').update(updateData).eq('id', selectedLead.id)

    // lead_history kaydı ekle
    await supabase.from('lead_history').insert({
      lead_id: selectedLead.id,
      changed_by: profile.id,
      old_status: selectedLead.status,
      new_status: newStatus,
      note: newNote || null,
    })

    setShowUpdateModal(false)
    setSelectedLead(null)
    setNewStatus('')
    setNewNote('')
    setProcedureAmount('')
    setSaving(false)
    loadData()
  }

  const openUpdateModal = (lead: any) => {
    setSelectedLead(lead)
    setNewStatus(lead.status)
    setNewNote(lead.note || '')
    setProcedureAmount(lead.procedure_amount?.toString() || '')
    setShowUpdateModal(true)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const filteredLeads = filterStatus === 'all' ? leads : leads.filter(l => l.status === filterStatus)

  const totalSales = leads.filter(l => l.status === 'procedure_done').length
  const totalRevenue = leads.filter(l => l.status === 'procedure_done').reduce((sum, l) => sum + (l.procedure_amount || 0), 0)
  const commission = totalRevenue * ((teamMember?.commission_rate || 0) / 100)
  const conversionRate = leads.length > 0 ? ((totalSales / leads.length) * 100).toFixed(1) : '0'

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
    <div className="min-h-screen bg-gray-100">

      {/* TOP BAR */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="DataPilot" className="h-7 w-auto" />
          <div className="h-5 w-px bg-gray-200" />
          <span className="text-sm font-medium text-gray-700">
            {teamMember?.branches?.branch_name || 'Şube'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl px-3 py-1.5 transition-colors"
            >
              <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">{profile?.full_name?.charAt(0)}</span>
              </div>
              <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">{profile?.full_name}</span>
              <span className="text-gray-400 text-xs">{showProfileMenu ? '▲' : '▼'}</span>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="font-semibold text-gray-900 text-sm">{profile?.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full mt-1 inline-block">
                    Satışçı
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  🚪 Çıkış Yap
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SEKMELER */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-1">
          {[
            { key: 'dashboard', label: '📊 Dashboard' },
            { key: 'leadler', label: '📋 Leadlerim' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto">

        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <>
            {/* Hoşgeldin */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 mb-6 text-white">
              <p className="text-blue-200 text-sm mb-1">Merhaba,</p>
              <h2 className="text-2xl font-bold mb-1">{profile?.full_name} 👋</h2>
              <p className="text-blue-200 text-sm">
                {teamMember?.branches?.branch_name} • %{teamMember?.commission_rate || 0} prim oranı
              </p>
            </div>

            {/* İstatistik kartları */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Toplam Lead', value: leads.length, icon: '📋', color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Satış', value: totalSales, icon: '✅', color: 'text-green-600', bg: 'bg-green-50' },
                { label: 'Dönüşüm', value: `%${conversionRate}`, icon: '📈', color: 'text-purple-600', bg: 'bg-purple-50' },
                { label: 'Toplam Prim', value: `₺${commission.toLocaleString()}`, icon: '💰', color: 'text-amber-600', bg: 'bg-amber-50' },
              ].map(card => (
                <div key={card.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center text-xl mb-3`}>{card.icon}</div>
                  <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{card.label}</p>
                </div>
              ))}
            </div>

            {/* Durum dağılımı */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 text-sm mb-4">Lead Durumları</h3>
                <div className="space-y-2">
                  {Object.entries(STATUS_LABELS).map(([key, val]: any) => {
                    const count = leads.filter(l => l.status === key).length
                    const pct = leads.length > 0 ? Math.round((count / leads.length) * 100) : 0
                    return (
                      <div key={key}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600">{val.label}</span>
                          <span className="font-medium text-gray-900">{count}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 text-sm mb-4">Prim Özeti</h3>
                <div className="space-y-3">
                  <div className="bg-green-50 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-xs text-gray-600">Toplam Ciro</span>
                    <span className="text-sm font-bold text-green-600">₺{totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-xs text-gray-600">Prim Oranı</span>
                    <span className="text-sm font-bold text-amber-600">%{teamMember?.commission_rate || 0}</span>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-xs text-gray-600">Toplam Prim</span>
                    <span className="text-sm font-bold text-blue-600">₺{commission.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Son leadler */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-sm">Son Leadler</h3>
                <button onClick={() => setActiveTab('leadler')} className="text-xs text-blue-600 hover:underline">Tümü →</button>
              </div>
              {leads.length === 0 ? (
                <div className="p-10 text-center">
                  <span className="text-3xl mb-2 block">📭</span>
                  <p className="text-gray-500 text-sm">Henüz lead atanmadı.</p>
                </div>
              ) : leads.slice(0, 5).map(lead => (
                <div key={lead.id}
                  onClick={() => openUpdateModal(lead)}
                  className="px-5 py-3.5 flex items-center justify-between border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer"
                >
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
          </>
        )}

        {/* LEADLER */}
        {activeTab === 'leadler' && (
          <>
            {/* Filtre */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {[{ key: 'all', label: 'Tümü' }, ...Object.entries(STATUS_LABELS).map(([k, v]: any) => ({ key: k, label: v.label }))].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilterStatus(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filterStatus === f.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {f.label} {f.key === 'all' ? `(${leads.length})` : `(${leads.filter(l => l.status === f.key).length})`}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              {filteredLeads.length === 0 ? (
                <div className="p-12 text-center">
                  <span className="text-4xl mb-3 block">📭</span>
                  <p className="text-gray-500 text-sm">Bu filtrede lead yok.</p>
                </div>
              ) : filteredLeads.map(lead => (
                <div
                  key={lead.id}
                  onClick={() => openUpdateModal(lead)}
                  className="px-5 py-4 flex items-center justify-between border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900 text-sm">{lead.full_name || 'İsimsiz'}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${SOURCE_LABELS[lead.source]?.color || 'bg-gray-100 text-gray-500'}`}>
                        {SOURCE_LABELS[lead.source]?.label || lead.source}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{lead.phone}{lead.email && ` • ${lead.email}`}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{lead.lead_code} • {new Date(lead.created_at).toLocaleDateString('tr-TR')}</p>
                    {lead.note && (
                      <p className="text-xs text-gray-500 mt-1 bg-gray-50 rounded px-2 py-1 inline-block">
                        💬 {lead.note.length > 60 ? lead.note.slice(0, 60) + '...' : lead.note}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_LABELS[lead.status]?.color}`}>
                      {STATUS_LABELS[lead.status]?.label}
                    </span>
                    {lead.procedure_amount > 0 && (
                      <span className="text-xs font-bold text-green-600">₺{lead.procedure_amount.toLocaleString()}</span>
                    )}
                    <span className="text-xs text-blue-500">Güncelle →</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* DURUM GÜNCELLEME MODAL */}
      {showUpdateModal && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowUpdateModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">{selectedLead.full_name || 'İsimsiz'}</h3>
                <p className="text-xs text-gray-500">{selectedLead.phone} • {selectedLead.lead_code}</p>
              </div>
              <button onClick={() => setShowUpdateModal(false)} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">✕</button>
            </div>

            <form onSubmit={handleUpdateLead} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Durum</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(STATUS_LABELS).map(([key, val]: any) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setNewStatus(key)}
                      className={`py-2 rounded-xl text-xs font-medium border-2 transition-all ${
                        newStatus === key
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {val.label}
                    </button>
                  ))}
                </div>
              </div>

              {newStatus === 'procedure_done' && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">İşlem Tutarı (₺)</label>
                  <input
                    type="number"
                    value={procedureAmount}
                    onChange={e => setProcedureAmount(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Not</label>
                <textarea
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Görüşme notu, hatırlatma..."
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving || !newStatus}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium"
                >
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}