'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAdvertiser } from '../../../context'

const STATUS_LABELS: any = { new: 'Yeni', called: 'Arandı', appointment_scheduled: 'Randevu', procedure_done: 'Satış', cancelled: 'İptal' }
const STATUS_COLORS: any = { new: 'bg-blue-100 text-blue-700', called: 'bg-amber-100 text-amber-700', appointment_scheduled: 'bg-violet-100 text-violet-700', procedure_done: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-600' }
const SOURCE_LABELS: any = { meta_form: '🎯 Meta', whatsapp: '💬 WhatsApp', instagram_dm: '📸 Instagram', referral: '🤝 Referans', manual: '✏️ Manuel' }

export default function CustomerLeadsPage() {
  const { customerId } = useParams<{ customerId: string }>()
  const { customers } = useAdvertiser()
  const customer = customers.find(c => c.id === customerId)

  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  useEffect(() => {
    supabase.from('leads').select('*').eq('customer_id', customerId).order('created_at', { ascending: false })
      .then(({ data }) => { setLeads(data || []); setLoading(false) })
  }, [customerId])

  const getPeriodStart = () => {
    if (period === 'all') return new Date(0)
    const d = new Date()
    if (period === '7d') d.setDate(d.getDate() - 7)
    else if (period === '30d') d.setDate(d.getDate() - 30)
    else d.setDate(d.getDate() - 90)
    return d
  }

  const filtered = leads.filter(l => {
    const matchesPeriod = new Date(l.created_at) >= getPeriodStart()
    const matchesStatus = filterStatus === 'all' || l.status === filterStatus
    const matchesSearch = !search || l.full_name?.toLowerCase().includes(search.toLowerCase()) || l.phone?.includes(search)
    return matchesPeriod && matchesStatus && matchesSearch
  })

  const totalSales = filtered.filter(l => l.status === 'procedure_done').length
  const totalRevenue = filtered.filter(l => l.status === 'procedure_done').reduce((s, l) => s + (l.procedure_amount || 0), 0)
  const convRate = filtered.length > 0 ? ((totalSales / filtered.length) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{customer?.name} · Potansiyel Müşteriler</h2>
          <p className="text-xs text-gray-400 mt-0.5">{filtered.length} potansiyel müşteri gösteriliyor</p>
        </div>
      </div>

      {/* KPI bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Potansiyel Müşteri', value: filtered.length, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Satış', value: totalSales, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Dönüşüm', value: `%${convRate}`, color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Ciro', value: `₺${totalRevenue.toLocaleString()}`, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(k => (
          <div key={k.label} className={`${k.bg} rounded-xl p-4`}>
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filtreler */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5" /><path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="İsim veya telefon ara..."
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex gap-1">
            {([['all', 'Tümü'], ['7d', '7G'], ['30d', '30G'], ['90d', '90G'], ['all_time', 'Tümü']] as const).map(([p, l]) => {
              const key = p === 'all_time' ? 'all' : p
              return (
                <button key={p} onClick={() => setPeriod(key as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${period === key ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                  {l}
                </button>
              )
            })}
          </div>
          <div className="flex gap-1 flex-wrap">
            {[['all', 'Tüm Durum'], ...Object.entries(STATUS_LABELS)].map(([key, label]) => (
              <button key={key} onClick={() => setFilterStatus(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterStatus === key ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {label as string}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lead listesi */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-sm">Sonuç bulunamadı.</p>
            {(search || filterStatus !== 'all') && (
              <button onClick={() => { setSearch(''); setFilterStatus('all') }} className="mt-2 text-xs text-amber-600 hover:underline">Filtreleri temizle</button>
            )}
          </div>
        ) : filtered.map((lead, i) => (
          <div key={lead.id} className={`px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50/50 transition-colors ${i < filtered.length - 1 ? 'border-b border-gray-50' : ''}`}>
            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-sm font-bold text-gray-500 flex-shrink-0">{(lead.full_name || 'L').charAt(0)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{lead.full_name || 'İsimsiz'}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-400">{lead.phone}</span>
                {lead.source && <span className="text-xs text-gray-400">{SOURCE_LABELS[lead.source] || lead.source}</span>}
                <span className="text-xs text-gray-300">{new Date(lead.created_at).toLocaleDateString('tr-TR')}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {lead.procedure_amount > 0 && <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">₺{lead.procedure_amount.toLocaleString()}</span>}
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[lead.status] || 'bg-gray-100 text-gray-500'}`}>
                {STATUS_LABELS[lead.status] || lead.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}