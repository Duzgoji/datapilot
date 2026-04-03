'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useAdvertiser } from '../../context'

const STATUS_LABELS: any = {
  new: 'Yeni', called: 'Arandı', appointment_scheduled: 'Randevu',
  procedure_done: 'Satış', cancelled: 'İptal'
}
const STATUS_COLORS: any = {
  new: 'bg-blue-100 text-blue-700', called: 'bg-amber-100 text-amber-700',
  appointment_scheduled: 'bg-violet-100 text-violet-700',
  procedure_done: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-600'
}

export default function CustomerWorkspacePage() {
  const { customerId } = useParams<{ customerId: string }>()
  const { customers, advertiserClients } = useAdvertiser()
  const customer = customers.find(c => c.id === customerId)

  const [leads, setLeads] = useState<any[]>([])
  const [metaConn, setMetaConn] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('30d')

  useEffect(() => {
    if (!customer) return
    Promise.all([
      supabase.from('leads').select('*').eq('customer_id', customerId).order('created_at', { ascending: false }),
      supabase.from('meta_connections').select('*').eq('owner_id', customer.owner_id).single(),
    ]).then(([leadsRes, metaRes]) => {
      setLeads(leadsRes.data || [])
      setMetaConn(metaRes.data || null)
      setLoading(false)
    })
  }, [customerId, customer])

  if (!customer) return (
    <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
      <p className="text-gray-400 text-sm">Müşteri bulunamadı.</p>
      <Link href="/advertiser/customers" className="mt-2 inline-block text-xs text-amber-600 hover:underline">← Geri Dön</Link>
    </div>
  )

  const getPeriodStart = () => {
    if (period === 'all') return new Date(0)
    const d = new Date()
    if (period === '7d') d.setDate(d.getDate() - 7)
    else d.setDate(d.getDate() - 30)
    return d
  }

  const periodLeads = leads.filter(l => new Date(l.created_at) >= getPeriodStart())
  const totalLeads = periodLeads.length
  const totalSales = periodLeads.filter(l => l.status === 'procedure_done').length
  const totalRevenue = periodLeads.filter(l => l.status === 'procedure_done').reduce((s, l) => s + (l.procedure_amount || 0), 0)
  const convRate = totalLeads > 0 ? ((totalSales / totalLeads) * 100).toFixed(1) : '0'

  const client = advertiserClients.find(ac => ac.customer_id === customerId)
  const getHakedis = () => {
    if (!client) return 0
    const allSales = leads.filter(l => l.status === 'procedure_done')
    const allRev = allSales.reduce((s, l) => s + (l.procedure_amount || 0), 0)
    if (client.commission_model === 'fixed') return client.monthly_fee || 0
    if (client.commission_model === 'percent') return (allRev * (client.commission_rate || 0)) / 100
    return (client.monthly_fee || 0) + (allRev * (client.commission_rate || 0)) / 100
  }

  const statusDist = Object.entries(STATUS_LABELS).map(([key]) => ({
    key, count: leads.filter(l => l.status === key).length
  }))

 const quickLinks = [
  { href: `/advertiser/customers/${customerId}/leads`, label: 'Potansiyel Müşteri Listesi', icon: '◈', color: 'indigo', count: leads.length },
  { href: `/advertiser/customers/${customerId}/finance`, label: 'Finans & Hakediş', icon: '◉', color: 'emerald', count: null },
  { href: `/advertiser/customers/${customerId}/meta`, label: 'Meta Bağlantı', icon: '◇', color: 'blue', count: null },
  { href: `/advertiser/customers/${customerId}/whatsapp`, label: 'WhatsApp', icon: '◎', color: 'green', count: null },
  { href: `/advertiser/customers/${customerId}/settings`, label: 'Ayarlar', icon: '◌', color: 'gray', count: null },
]

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Müşteri hero */}
      <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white relative overflow-hidden">
        <div className="absolute -right-4 -top-4 w-28 h-28 bg-white/10 rounded-full" />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center font-bold text-2xl flex-shrink-0">{customer.name.charAt(0)}</div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{customer.name}</h2>
            <p className="text-amber-100 text-sm">{customer.owner?.email}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${customer.status === 'active' ? 'bg-white/20 text-white' : 'bg-black/20 text-white/70'}`}>
                {customer.status === 'active' ? '● Aktif' : '○ Pasif'}
              </span>
              {metaConn?.is_active && <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">Meta ✓</span>}
              {customer.owner?.sector && <span className="text-xs text-amber-100">{customer.owner.sector}</span>}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-bold">₺{getHakedis().toLocaleString()}</p>
            <p className="text-amber-100 text-xs">Toplam Hakediş</p>
          </div>
        </div>

        {/* KPI satırı */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/20">
          <div className="flex gap-6">
            <div><p className="text-xl font-bold">{leads.length}</p><p className="text-amber-200 text-xs">Toplam Potansiyel Müşteri</p></div>
            <div><p className="text-xl font-bold">{leads.filter(l => l.status === 'procedure_done').length}</p><p className="text-amber-200 text-xs">Satış</p></div>
            <div><p className="text-xl font-bold">%{leads.length > 0 ? ((leads.filter(l => l.status === 'procedure_done').length / leads.length) * 100).toFixed(1) : 0}</p><p className="text-amber-200 text-xs">Dönüşüm</p></div>
            <div><p className="text-xl font-bold">₺{leads.filter(l => l.status === 'procedure_done').reduce((s, l) => s + (l.procedure_amount || 0), 0).toLocaleString()}</p><p className="text-amber-200 text-xs">Toplam Ciro</p></div>
          </div>
          <div className="relative">
            <select value={period} onChange={e => setPeriod(e.target.value as any)}
              className="appearance-none bg-white/20 border border-white/20 text-white text-xs font-medium pl-3 pr-8 py-2 rounded-xl focus:outline-none">
              <option value="7d" className="text-gray-900">Son 7 Gün</option>
              <option value="30d" className="text-gray-900">Son 30 Gün</option>
              <option value="all" className="text-gray-900">Tüm Zamanlar</option>
            </select>
            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none" width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </div>
      </div>

      {/* Hızlı linkler */}
      <div className="grid grid-cols-5 gap-3">
        {quickLinks.map(link => (
          <Link key={link.href} href={link.href}
            className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md hover:border-amber-200 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xl">{link.icon}</span>
              {link.count !== null && <span className="text-xs font-bold text-gray-500">{link.count}</span>}
            </div>
            <p className="text-sm font-semibold text-gray-900">{link.label}</p>
            <p className="text-xs text-gray-400 mt-0.5 group-hover:text-amber-500 transition-colors">Görüntüle →</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Dönem KPI */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">
            {period === '7d' ? 'Son 7 Gün' : period === '30d' ? 'Son 30 Gün' : 'Tüm Zamanlar'}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Potansiyel Müşteri', value: totalLeads, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { label: 'Satış', value: totalSales, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Dönüşüm', value: `%${convRate}`, color: 'text-violet-600', bg: 'bg-violet-50' },
              { label: 'Ciro', value: `₺${totalRevenue.toLocaleString()}`, color: 'text-amber-600', bg: 'bg-amber-50' },
            ].map(k => (
              <div key={k.label} className={`${k.bg} rounded-xl p-3`}>
                <p className={`text-lg font-bold ${k.color}`}>{k.value}</p>
                <p className="text-xs text-gray-500">{k.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Durum dağılımı */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">Durum Dağılımı</h3>
          <div className="space-y-2.5">
            {statusDist.filter(s => s.count > 0).map(s => (
              <div key={s.key} className="flex items-center gap-3">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-20 text-center flex-shrink-0 ${STATUS_COLORS[s.key] || 'bg-gray-100 text-gray-500'}`}>
                  {STATUS_LABELS[s.key]}
                </span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${leads.length > 0 ? (s.count / leads.length) * 100 : 0}%` }} />
                </div>
                <span className="text-xs text-gray-500 w-6 text-right">{s.count}</span>
              </div>
            ))}
            {statusDist.every(s => s.count === 0) && <p className="text-xs text-gray-400 text-center py-4">Henüz potansiyel müşteri yok.</p>}
          </div>
        </div>
      </div>

      {/* Komisyon bilgisi */}
      {client && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">Komisyon Modeli</h3>
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-xl p-3.5">
              <p className="text-xs text-gray-400 mb-1">Model</p>
              <p className="text-sm font-semibold text-gray-900">
                {client.commission_model === 'fixed' ? 'Sabit Aylık' : client.commission_model === 'percent' ? 'Satış Yüzdesi' : 'Sabit + Yüzde'}
              </p>
            </div>
            {(client.commission_model === 'fixed' || client.commission_model === 'both') && (
              <div className="bg-indigo-50 rounded-xl p-3.5 border border-indigo-100">
                <p className="text-xs text-gray-400 mb-1">Aylık Sabit</p>
                <p className="text-sm font-bold text-indigo-700">₺{client.monthly_fee}</p>
              </div>
            )}
            {(client.commission_model === 'percent' || client.commission_model === 'both') && (
              <div className="bg-amber-50 rounded-xl p-3.5 border border-amber-100">
                <p className="text-xs text-gray-400 mb-1">Komisyon Oranı</p>
                <p className="text-sm font-bold text-amber-700">%{client.commission_rate}</p>
              </div>
            )}
            <div className="bg-emerald-50 rounded-xl p-3.5 border border-emerald-100">
              <p className="text-xs text-gray-400 mb-1">Toplam Hakediş</p>
              <p className="text-sm font-bold text-emerald-700">₺{getHakedis().toLocaleString()}</p>
            </div>
          </div>
          <Link href={`/advertiser/customers/${customerId}/finance`} className="mt-3 block text-xs text-emerald-600 font-medium hover:underline">
            Detaylı finans görünümü →
          </Link>
        </div>
      )}

      {/* Son leadler */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 text-sm">Son Potansiyel Müşteriler</h3>
          <Link href={`/advertiser/customers/${customerId}/leads`} className="text-xs text-amber-600 font-medium hover:text-amber-700">Tümünü Gör →</Link>
        </div>
        {leads.length === 0 ? (
          <div className="p-10 text-center"><p className="text-gray-400 text-sm">Henüz potansiyel müşteri yok.</p></div>
        ) : leads.slice(0, 8).map((lead, i) => (
          <div key={lead.id} className={`px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50/50 transition-colors ${i < Math.min(leads.length, 8) - 1 ? 'border-b border-gray-50' : ''}`}>
            <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">{(lead.full_name || 'L').charAt(0)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{lead.full_name || 'İsimsiz'}</p>
              <p className="text-xs text-gray-400">{lead.phone} · {new Date(lead.created_at).toLocaleDateString('tr-TR')}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {lead.procedure_amount > 0 && <span className="text-xs font-semibold text-emerald-600">₺{lead.procedure_amount.toLocaleString()}</span>}
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