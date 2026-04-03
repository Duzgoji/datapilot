'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const STATUS_CONFIG: any = {
  new:                   { label: 'Yeni',    dot: 'bg-blue-500',    badge: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' },
  called:                { label: 'Arandı',  dot: 'bg-amber-500',   badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  appointment_scheduled: { label: 'Randevu', dot: 'bg-violet-500',  badge: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200' },
  procedure_done:        { label: 'Satış',   dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  cancelled:             { label: 'İptal',   dot: 'bg-red-400',     badge: 'bg-red-50 text-red-600 ring-1 ring-red-200' },
}

const SOURCE_CONFIG: any = {
  manual:       { label: 'Manuel',    badge: 'bg-slate-100 text-slate-600' },
  meta_form:    { label: 'Meta Form', badge: 'bg-blue-100 text-blue-700' },
  instagram_dm: { label: 'Instagram', badge: 'bg-pink-100 text-pink-700' },
  whatsapp:     { label: 'WhatsApp',  badge: 'bg-green-100 text-green-700' },
  website:      { label: 'Web',       badge: 'bg-purple-100 text-purple-700' },
  referral:     { label: 'Referans',  badge: 'bg-orange-100 text-orange-700' },
}

const Badge = ({ status }: { status: string }) => (
  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_CONFIG[status]?.badge || 'bg-gray-100 text-gray-500'}`}>
    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_CONFIG[status]?.dot || 'bg-gray-400'}`} />
    {STATUS_CONFIG[status]?.label || status}
  </span>
)

export default function AgentPage() {
  const router = useRouter()
  const profileMenuRef = useRef<HTMLDivElement>(null)

  const [profile, setProfile] = useState<any>(null)
  const [teamMember, setTeamMember] = useState<any>(null)
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [newNote, setNewNote] = useState('')
  const [procedureAmount, setProcedureAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [appointmentDate, setAppointmentDate] = useState('')
  const [appointmentTime, setAppointmentTime] = useState('')

  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDate, setFilterDate] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

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
    if (!profileData || !['agent', 'team'].includes(profileData.role)) { router.push('/login'); return }
    setProfile(profileData)
    const { data: memberData } = await supabase.from('team_members').select('*, branches(branch_name, owner_id)').eq('user_id', user.id).single()
    setTeamMember(memberData)
    const { data: leadsData } = await supabase.from('leads').select('*').eq('assigned_to', user.id).order('created_at', { ascending: false })
    setLeads(leadsData || [])
    setLoading(false)
  }

  const handleUpdateLead = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      // Satışçı 'procedure_done' yapamaz — sadece müşteri paneli
      if (newStatus === 'procedure_done') return
      const updateData: any = { status: newStatus }
      if (newNote) updateData.note = newNote
      if (newStatus === 'appointment_scheduled' && appointmentDate) {
        updateData.appointment_at = appointmentTime ? `${appointmentDate}T${appointmentTime}` : appointmentDate
      } else if (newStatus !== 'appointment_scheduled') {
        updateData.appointment_at = null
      }
      const { error } = await supabase.from('leads').update(updateData).eq('id', selectedLead.id)
      if (error) throw error
      await supabase.from('lead_history').insert({
        lead_id: selectedLead.id, changed_by: profile.id,
        old_status: selectedLead.status, new_status: newStatus, note: newNote || null,
      })
    } catch (err) { console.error(err) }
    setShowUpdateModal(false)
    setSelectedLead(null); setNewStatus(''); setNewNote(''); setProcedureAmount(''); setAppointmentDate(''); setAppointmentTime('')
    setSaving(false)
    loadData()
  }

  const openUpdateModal = (lead: any) => {
    setSelectedLead(lead)
    // procedure_done agent tarafından seçilemez, varsayılan olarak 'called' göster
    setNewStatus(lead.status === 'procedure_done' ? 'called' : lead.status)
    setNewNote(lead.note || '')
    setProcedureAmount(lead.procedure_amount?.toString() || '')
    setShowUpdateModal(true)
  }

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login') }

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const weekEnd = new Date(today); weekEnd.setDate(today.getDate() + 7)

  const filteredLeads = leads.filter(lead => {
    const matchesStatus = filterStatus === 'all' || lead.status === filterStatus
    const q = searchQuery.toLowerCase()
    const matchesSearch = !q || lead.full_name?.toLowerCase().includes(q) || lead.phone?.includes(q) || lead.lead_code?.toLowerCase().includes(q) || lead.email?.toLowerCase().includes(q)
    let matchesDate = true
    if (filterDate !== 'all' && lead.appointment_at) {
      const d = new Date(lead.appointment_at); d.setHours(0, 0, 0, 0)
      if (filterDate === 'today') matchesDate = d.getTime() === today.getTime()
      else if (filterDate === 'this_week') matchesDate = d >= today && d <= weekEnd
      else if (filterDate === 'overdue') matchesDate = d < today
    } else if (filterDate !== 'all') { matchesDate = false }
    return matchesStatus && matchesSearch && matchesDate
  })

  const totalSales = leads.filter(l => l.status === 'procedure_done').length
  const totalRevenue = leads.filter(l => l.status === 'procedure_done').reduce((s, l) => s + (l.procedure_amount || 0), 0)
  const commission = totalRevenue * ((teamMember?.commission_rate || 0) / 100)
  const conversionRate = leads.length > 0 ? ((totalSales / leads.length) * 100).toFixed(1) : '0'
  const newLeadsCount = leads.filter(l => l.status === 'new').length

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
    <div className="min-h-screen bg-gray-50 pb-20" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* TOP BAR */}
      <header className="bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">D</span>
          </div>
          <div className="h-4 w-px bg-gray-200" />
          <span className="text-sm font-medium text-gray-700 truncate max-w-[140px]">{teamMember?.branches?.branch_name || 'Şube'}</span>
        </div>
        <div className="relative" ref={profileMenuRef}>
          <button onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 hover:bg-gray-50 border border-transparent hover:border-gray-200 rounded-xl px-3 py-1.5 transition-all">
            <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-indigo-600 text-xs font-bold">{profile?.full_name?.charAt(0)}</span>
            </div>
            <span className="text-sm font-medium text-gray-700 hidden sm:block truncate max-w-[100px]">{profile?.full_name}</span>
            <svg className="text-gray-400" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50">
              <div className="px-4 py-2.5 border-b border-gray-100 mb-1">
                <p className="text-sm font-semibold text-gray-900">{profile?.full_name}</p>
                <p className="text-xs text-gray-400 truncate">{profile?.email}</p>
                <span className="text-xs bg-indigo-50 text-indigo-600 font-medium px-2 py-0.5 rounded-full mt-1 inline-block">Satışçı</span>
              </div>
              <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M5 11H2.5A1.5 1.5 0 011 9.5v-6A1.5 1.5 0 012.5 2H5M9 9.5l3-3-3-3M12 6.5H5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Çıkış Yap
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="p-4 max-w-2xl mx-auto">

        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 rounded-2xl p-5 text-white relative overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              <div className="absolute -right-4 -top-4 w-28 h-28 bg-white/5 rounded-full" />
              <div className="relative">
                <p className="text-indigo-200 text-sm">Merhaba,</p>
                <h2 className="text-xl font-bold mt-0.5">{profile?.full_name} 👋</h2>
                <p className="text-indigo-300 text-xs mt-1">{teamMember?.branches?.branch_name} · %{teamMember?.commission_rate || 0} prim</p>
                <div className="flex gap-5 mt-4 pt-4 border-t border-white/10">
                  <div><p className="text-2xl font-bold">{leads.length}</p><p className="text-indigo-300 text-xs mt-0.5">Lead</p></div>
                  <div><p className="text-2xl font-bold">{totalSales}</p><p className="text-indigo-300 text-xs mt-0.5">Satış</p></div>
                  <div><p className="text-2xl font-bold">%{conversionRate}</p><p className="text-indigo-300 text-xs mt-0.5">Dönüşüm</p></div>
                  <div><p className="text-2xl font-bold">₺{(commission/1000).toFixed(1)}K</p><p className="text-indigo-300 text-xs mt-0.5">Prim</p></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Toplam Lead', value: leads.length, sub: `${newLeadsCount} yeni`, color: 'text-blue-600', border: 'border-blue-100', gradient: 'from-blue-50 to-white', iconBg: 'bg-blue-100', icon: '◎' },
                { label: 'Satış', value: totalSales, sub: `%${conversionRate} dönüşüm`, color: 'text-emerald-600', border: 'border-emerald-100', gradient: 'from-emerald-50 to-white', iconBg: 'bg-emerald-100', icon: '◉' },
                { label: 'Toplam Ciro', value: `₺${totalRevenue.toLocaleString()}`, sub: 'İşlem tutarı', color: 'text-violet-600', border: 'border-violet-100', gradient: 'from-violet-50 to-white', iconBg: 'bg-violet-100', icon: '◈' },
                { label: 'Hak. Prim', value: `₺${commission.toLocaleString()}`, sub: `%${teamMember?.commission_rate || 0} oran`, color: 'text-amber-600', border: 'border-amber-100', gradient: 'from-amber-50 to-white', iconBg: 'bg-amber-100', icon: '◐' },
              ].map(card => (
                <div key={card.label} className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-4 border ${card.border} hover:shadow-sm transition-all`}>
                  <div className={`w-8 h-8 ${card.iconBg} rounded-xl flex items-center justify-center text-base mb-3`}>{card.icon}</div>
                  <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
                  <p className="text-xs font-medium text-gray-700 mt-0.5">{card.label}</p>
                  <p className="text-xs text-gray-400">{card.sub}</p>
                </div>
              ))}
            </div>

            {/* Prim bar görseli */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Prim Özeti</h3>
                <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-2.5 py-1 rounded-lg">₺{commission.toLocaleString()} hakediş</span>
              </div>
              {totalRevenue > 0 ? (
                <>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all"
                      style={{ width: `${Math.min((commission / totalRevenue) * 100, 100)}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>₺{commission.toLocaleString()} prim</span>
                    <span>₺{totalRevenue.toLocaleString()} ciro</span>
                  </div>
                </>
              ) : (
                <p className="text-xs text-gray-400 text-center py-2">Henüz satış yok</p>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Son Leadler</h3>
                <button onClick={() => setActiveTab('leadler')} className="text-xs text-indigo-600 font-medium">Tümü →</button>
              </div>
              {leads.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-gray-400 text-sm">Henüz potansiyel müşteri atanmadı.</p>
                </div>
              ) : leads.slice(0, 5).map((lead, i) => {
                const avatarColors = ['from-blue-100 to-indigo-100 text-indigo-600','from-violet-100 to-purple-100 text-violet-600','from-emerald-100 to-teal-100 text-emerald-600','from-orange-100 to-amber-100 text-orange-600','from-pink-100 to-rose-100 text-rose-600']
                const ac = avatarColors[i % avatarColors.length]
                return (
                  <div key={lead.id} onClick={() => openUpdateModal(lead)}
                    className={`px-5 py-3.5 flex items-center gap-3 cursor-pointer hover:bg-indigo-50/30 transition-colors ${i < Math.min(leads.length, 5) - 1 ? 'border-b border-gray-50' : ''}`}>
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${ac} flex items-center justify-center flex-shrink-0`}>
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

        {/* LEADLER */}
        {activeTab === 'leadler' && (
          <div className="space-y-3">
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Isim, telefon veya potansiyel müşteri kodu ara..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
              )}
            </div>

            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Durum</p>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {[{ key: 'all', label: 'Tümü' }, ...Object.entries(STATUS_CONFIG).filter(([k]) => k !== 'procedure_done').map(([k, v]: any) => ({ key: k, label: v.label }))].map(f => (
                  <button key={f.key} onClick={() => setFilterStatus(f.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${filterStatus === f.key ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'}`}>
                    {f.label} ({f.key === 'all' ? leads.length : leads.filter(l => l.status === f.key).length})
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Randevu Tarihi</p>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {[
                  { key: 'all', label: 'Tümü' },
                  { key: 'today', label: 'Bugün', count: leads.filter(l => { if (!l.appointment_at) return false; const d = new Date(l.appointment_at); d.setHours(0,0,0,0); return d.getTime() === today.getTime() }).length },
                  { key: 'this_week', label: 'Bu Hafta', count: leads.filter(l => { if (!l.appointment_at) return false; const d = new Date(l.appointment_at); d.setHours(0,0,0,0); return d >= today && d <= weekEnd }).length },
                  { key: 'overdue', label: 'Geçmiş', count: leads.filter(l => { if (!l.appointment_at) return false; const d = new Date(l.appointment_at); d.setHours(0,0,0,0); return d < today }).length },
                ].map(f => (
                  <button key={f.key} onClick={() => setFilterDate(f.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${filterDate === f.key ? 'bg-violet-600 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'}`}>
                    {f.label}{f.count !== undefined ? ` (${f.count})` : ''}
                  </button>
                ))}
              </div>
            </div>

            {(searchQuery || filterStatus !== 'all' || filterDate !== 'all') && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">{filteredLeads.length} sonuç</p>
                <button onClick={() => { setSearchQuery(''); setFilterStatus('all'); setFilterDate('all') }} className="text-xs text-indigo-600 hover:underline">Temizle</button>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {filteredLeads.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-gray-400 text-sm">Sonuç bulunamadı.</p>
                </div>
              // ─── BUNU BUL ────────────────────────────────────────────────────────────────
// leadler sekmesinde şu satırı bul:
//   ) : filteredLeads.map((lead, i) => {
//     const avatarColors = [...]
//     return (
//     <div key={lead.id} onClick={() => openUpdateModal(lead)}
//       className={`px-4 py-4 flex items-center gap-3 ...`}>
//
// O bloktan kapanış parantezine kadar sil, yerine aşağıdakini yapıştır:
// ─────────────────────────────────────────────────────────────────────────────

              ) : filteredLeads.map((lead, i) => {
                const daysSinceCreated = Math.floor((Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24))
                const isStale = daysSinceCreated >= 3 && (lead.status === 'new' || lead.status === 'called')
                const hasAppointmentSoon = lead.appointment_at && (() => {
                  const d = new Date(lead.appointment_at); d.setHours(0,0,0,0)
                  const diff = Math.floor((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                  return diff >= 0 && diff <= 1
                })()
                const isAppointmentOverdue = lead.appointment_at && new Date(lead.appointment_at) < new Date() && lead.status === 'appointment_scheduled'
                const avatarColors = ['from-blue-100 to-indigo-100 text-indigo-600','from-violet-100 to-purple-100 text-violet-600','from-emerald-100 to-teal-100 text-emerald-600','from-orange-100 to-amber-100 text-orange-600','from-pink-100 to-rose-100 text-rose-600']
                const ac = avatarColors[i % avatarColors.length]

                return (
                  <div key={lead.id}
                    className={`px-4 py-3.5 flex items-start gap-3 cursor-pointer transition-colors group ${i < filteredLeads.length - 1 ? 'border-b border-gray-50' : ''} ${isStale ? 'bg-amber-50/30' : 'hover:bg-indigo-50/30'}`}
                    onClick={() => openUpdateModal(lead)}>

                    {/* Avatar */}
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${ac} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <span className="text-sm font-semibold">{(lead.full_name || 'İ').charAt(0)}</span>
                    </div>

                    {/* Bilgi */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <p className="text-sm font-medium text-gray-900 truncate">{lead.full_name || 'İsimsiz'}</p>
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md flex-shrink-0 ${SOURCE_CONFIG[lead.source]?.badge || 'bg-gray-100 text-gray-500'}`}>
                          {SOURCE_CONFIG[lead.source]?.label || lead.source}
                        </span>
                        {isStale && (
                          <span className="text-xs text-amber-600 font-medium bg-amber-100 px-1.5 py-0.5 rounded-md flex-shrink-0">
                            ⏳ {daysSinceCreated}g
                          </span>
                        )}
                        {hasAppointmentSoon && (
                          <span className="text-xs text-violet-600 font-medium bg-violet-100 px-1.5 py-0.5 rounded-md flex-shrink-0">
                            📅 Yakın
                          </span>
                        )}
                        {isAppointmentOverdue && (
                          <span className="text-xs text-red-500 font-medium bg-red-50 px-1.5 py-0.5 rounded-md flex-shrink-0">
                            ⚠ Geçti
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-400">{lead.phone}{lead.email && ` · ${lead.email}`}</p>
                      <p className="text-xs text-gray-300 mt-0.5">{lead.lead_code} · {new Date(lead.created_at).toLocaleDateString('tr-TR')}</p>

                      {lead.appointment_at && (
                        <p className={`text-xs mt-1 font-medium ${isAppointmentOverdue ? 'text-red-500' : 'text-violet-600'}`}>
                          📅 {new Date(lead.appointment_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                      {lead.note && <p className="text-xs text-gray-500 mt-1 bg-gray-50 rounded-lg px-2 py-1 truncate">💬 {lead.note}</p>}
                    </div>

                    {/* Sağ: badge + quick actions */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <Badge status={lead.status} />
                        {lead.procedure_amount > 0 && (
                          <span className="text-xs font-bold text-emerald-600">₺{lead.procedure_amount.toLocaleString()}</span>
                        )}
                      </div>

                      {/* Quick Actions — hover'da görünür */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Ara */}
                        <a href={`tel:${lead.phone}`}
                          className="p-1.5 hover:bg-green-50 rounded-lg text-gray-300 hover:text-green-500 transition-colors"
                          title="Ara">
                          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M11.5 9.5L9.5 11.5C6.2 10.1 2.9 6.8 1.5 3.5L3.5 1.5l2.5 2.5L4.5 5.5C5.3 6.7 6.3 7.7 7.5 8.5L9 7l2.5 2.5z" fill="currentColor"/></svg>
                        </a>
                        {/* WhatsApp */}
                        <a href={`https://wa.me/90${lead.phone?.replace(/\D/g, '').replace(/^0/, '')}`}
                          target="_blank" rel="noopener noreferrer"
                          className="p-1.5 hover:bg-green-50 rounded-lg text-gray-300 hover:text-green-600 transition-colors"
                          title="WhatsApp">
                          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1C3.46 1 1 3.46 1 6.5c0 .97.25 1.88.69 2.67L1 12l2.9-.67A5.48 5.48 0 006.5 12C9.54 12 12 9.54 12 6.5S9.54 1 6.5 1zm2.7 7.5c-.11.3-.63.58-.87.61-.21.03-.48.04-.77-.05-.18-.05-.41-.13-.7-.26C5.47 8.32 4.5 7.1 4.42 7s-.6-.8-.6-1.52c0-.72.37-1.07.5-1.22.13-.15.28-.18.38-.18h.27c.09 0 .21-.03.33.25l.43 1.05c.04.09.07.19.01.3L5.5 5.9c-.07.1-.1.13-.05.23.25.45.54.86.9 1.2.42.4.87.67 1.4.85.1.03.2 0 .26-.07l.35-.42c.07-.1.16-.11.26-.07l1 .47c.1.04.17.1.2.19.03.1 0 .31-.1.57z" fill="currentColor"/></svg>
                        </a>
                        {/* Durum güncelle */}
                        <button onClick={() => openUpdateModal(lead)}
                          className="p-1.5 hover:bg-indigo-50 rounded-lg text-gray-300 hover:text-indigo-600 transition-colors"
                          title="Durum güncelle">
                          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1 7l3 3L12 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* PERFORMANS */}
        {activeTab === 'performans' && (() => {
          const now = new Date()
          const thisMonthLeads = leads.filter(l => {
            const d = new Date(l.created_at)
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
          })
          const thisMonthSales = thisMonthLeads.filter(l => l.status === 'procedure_done')
          const thisMonthRevenue = thisMonthSales.reduce((s, l) => s + (l.procedure_amount || 0), 0)
          const thisMonthCommission = thisMonthRevenue * ((teamMember?.commission_rate || 0) / 100)

          const months = Array.from({ length: 6 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
            const mLeads = leads.filter(l => { const ld = new Date(l.created_at); return ld.getMonth() === d.getMonth() && ld.getFullYear() === d.getFullYear() })
            const mSales = mLeads.filter(l => l.status === 'procedure_done')
            return {
              label: d.toLocaleDateString('tr-TR', { month: 'short' }),
              leads: mLeads.length,
              sales: mSales.length,
              revenue: mSales.reduce((s, l) => s + (l.procedure_amount || 0), 0),
            }
          })
          const maxLeads = Math.max(...months.map(m => m.leads), 1)

          const statusDist = Object.entries(STATUS_CONFIG).filter(([key]) => key !== 'procedure_done').map(([key, val]: any) => ({
            key, label: val.label, count: leads.filter(l => l.status === key).length,
            dot: val.dot,
          })).filter(s => s.count > 0)

          return (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-5 text-white relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-28 h-28 bg-white/5 rounded-full" />
                <div className="relative">
                  <p className="text-emerald-200 text-xs mb-1">Bu Ay · {now.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</p>
                  <div className="flex gap-6 mt-2">
                    <div><p className="text-2xl font-bold">{thisMonthLeads.length}</p><p className="text-emerald-200 text-xs mt-0.5">Lead</p></div>
                    <div><p className="text-2xl font-bold">{thisMonthSales.length}</p><p className="text-emerald-200 text-xs mt-0.5">Satış</p></div>
                    <div><p className="text-2xl font-bold">₺{(thisMonthRevenue/1000).toFixed(1)}K</p><p className="text-emerald-200 text-xs mt-0.5">Ciro</p></div>
                    <div><p className="text-2xl font-bold">₺{thisMonthCommission.toLocaleString()}</p><p className="text-emerald-200 text-xs mt-0.5">Prim</p></div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Son 6 Ay Trendi</h3>
                <div className="flex items-end gap-2 h-28">
                  {months.map((m, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex flex-col items-center gap-0.5" style={{ height: '88px', justifyContent: 'flex-end' }}>
                        <div className="w-full bg-emerald-400 rounded-t-md transition-all"
                          style={{ height: `${m.leads > 0 ? Math.max((m.leads / maxLeads) * 72, 4) : 2}px` }} />
                        <div className="w-full bg-indigo-500 rounded-t-md transition-all"
                          style={{ height: `${m.sales > 0 ? Math.max((m.sales / maxLeads) * 72, 4) : 0}px`, marginTop: '2px' }} />
                      </div>
                      <p className="text-xs text-gray-400">{m.label}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 mt-3 pt-3 border-t border-gray-50">
                  <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-2.5 h-2.5 bg-emerald-400 rounded-sm" /> Lead</span>
                  <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-2.5 h-2.5 bg-indigo-500 rounded-sm" /> Satış</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Durum Dağılımı</h3>
                <div className="space-y-3">
                  {statusDist.map(s => (
                    <div key={s.key}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                          <span className="text-xs text-gray-600">{s.label}</span>
                        </div>
                        <span className="text-xs font-semibold text-gray-700">{s.count} · %{leads.length > 0 ? ((s.count / leads.length) * 100).toFixed(0) : 0}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${s.dot.replace('bg-', 'bg-')}`}
                          style={{ width: `${leads.length > 0 ? (s.count / leads.length) * 100 : 0}%` }} />
                      </div>
                    </div>
                  ))}
                  {statusDist.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Henüz potansiyel müşteri yok</p>}
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-white rounded-2xl border border-amber-100 p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Toplam Hakediş</h3>
                <div className="flex items-end gap-2 mb-3">
                  <p className="text-3xl font-bold text-amber-600">₺{commission.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mb-1">tüm zamanlar</p>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                    style={{ width: totalRevenue > 0 ? `${(commission / totalRevenue) * 100}%` : '0%' }} />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                  <span>%{teamMember?.commission_rate || 0} prim oranı</span>
                  <span>₺{totalRevenue.toLocaleString()} toplam ciro</span>
                </div>
              </div>
            </div>
          )
        })()}
      </div>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-10 shadow-lg">
        <div className="flex max-w-2xl mx-auto">
          {[
            { key: 'dashboard', label: 'Anasayfa', icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="11" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="1" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="11" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/></svg> },
            { key: 'leadler', label: 'Leadlerim', icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.5"/><path d="M2 16c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
            { key: 'performans', label: 'Performans', icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 14l4-4 3 3 4-5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors relative ${activeTab === tab.key ? 'text-indigo-600' : 'text-gray-400'}`}>
              {tab.icon}
              <span className="text-xs font-medium">{tab.label}</span>
              {activeTab === tab.key && <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-indigo-600 rounded-full" />}
              {tab.key === 'leadler' && newLeadsCount > 0 && (
                <span className="absolute top-1 right-1/4 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{newLeadsCount}</span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* GUNCELLEME MODAL */}
      {showUpdateModal && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowUpdateModal(false)} />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md z-10 max-h-[92vh] flex flex-col">
            <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="text-base font-semibold text-gray-900">{selectedLead.full_name || 'Lead'}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{selectedLead.phone} · {selectedLead.lead_code}</p>
              </div>
              <button onClick={() => setShowUpdateModal(false)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 ml-3">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1 1l11 11M12 1L1 12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              <form onSubmit={handleUpdateLead} className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Mevcut:</span>
                  <Badge status={selectedLead.status} />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Yeni Durum</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(STATUS_CONFIG).filter(([key]) => key !== 'procedure_done').map(([key, val]: any) => (
                      <button key={key} type="button" onClick={() => setNewStatus(key)}
                        className={`py-2.5 px-3 rounded-xl text-sm font-medium border-2 transition-all flex items-center gap-2 ${newStatus === key ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${val.dot}`} />{val.label}
                      </button>
                    ))}
                  </div>
                </div>

                {newStatus === 'appointment_scheduled' && (
                  <div className="bg-violet-50 rounded-xl p-4 border border-violet-100">
                    <p className="text-xs font-semibold text-violet-700 mb-3">📅 Randevu Tarihi</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Tarih</label>
                        <input type="date" value={appointmentDate} onChange={e => setAppointmentDate(e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-violet-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Saat</label>
                        <input type="time" value={appointmentTime} onChange={e => setAppointmentTime(e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-violet-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                      </div>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Not</label>
                  <textarea value={newNote} onChange={e => setNewNote(e.target.value)} rows={3} placeholder="Görüşme notu..."
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowUpdateModal(false)}
                    className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                    İptal
                  </button>
                  <button type="submit" disabled={saving || !newStatus}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-semibold transition-colors">
                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}