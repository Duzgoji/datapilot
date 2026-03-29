'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAdvertiser } from '../context'

const PERIOD_OPTIONS = [
  { key: '30d', label: 'Son 30 Gün' },
  { key: '90d', label: 'Son 90 Gün' },
  { key: 'all', label: 'Tüm Zamanlar' },
]

export default function HakedisPage() {
  const { customers, advertiserClients } = useAdvertiser()
  const [leads, setLeads] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [period, setPeriod] = useState<'30d' | '90d' | 'all'>('30d')
  const [openCustomer, setOpenCustomer] = useState<string | null>(null)

  useEffect(() => {
    if (customers.length === 0) return
    const ids = customers.map(c => c.id)
    Promise.all([
      supabase.from('leads').select('*').in('customer_id', ids),
      supabase.from('invoices').select('*').in('customer_id', ids).order('created_at', { ascending: false }),
    ]).then(([leadsRes, invoicesRes]) => {
      setLeads(leadsRes.data || [])
      setInvoices(invoicesRes.data || [])
    })
  }, [customers])

  const getPeriodStart = () => {
    if (period === 'all') return new Date(0)
    const d = new Date()
    if (period === '30d') d.setDate(d.getDate() - 30)
    else d.setDate(d.getDate() - 90)
    return d
  }

  const getCustomerHakedis = (customer: any) => {
    const client = advertiserClients.find(ac => ac.customer_id === customer.id)
    if (!client) return { total: 0, fixed: 0, percent: 0, revenue: 0, salesCount: 0 }
    const periodStart = getPeriodStart()
    const cSales = leads.filter(l =>
      l.customer_id === customer.id &&
      l.status === 'procedure_done' &&
      new Date(l.created_at) >= periodStart
    )
    const cRevenue = cSales.reduce((s: number, l: any) => s + (l.procedure_amount || 0), 0)
    const fixed = (client.commission_model === 'fixed' || client.commission_model === 'both') ? (client.monthly_fee || 0) : 0
    const pct = (client.commission_model === 'percent' || client.commission_model === 'both') ? (cRevenue * (client.commission_rate || 0)) / 100 : 0
    return { total: fixed + pct, fixed, percent: pct, revenue: cRevenue, salesCount: cSales.length }
  }

  const customerHakedisler = customers.map(c => ({ ...c, hakedis: getCustomerHakedis(c) }))
    .sort((a, b) => b.hakedis.total - a.hakedis.total)

  const totalHakedis = customerHakedisler.reduce((s, c) => s + c.hakedis.total, 0)
  const totalRevenue = customerHakedisler.reduce((s, c) => s + c.hakedis.revenue, 0)
  const totalSales = customerHakedisler.reduce((s, c) => s + c.hakedis.salesCount, 0)

  const pendingInvoices = invoices.filter(i => i.status === 'pending')
  const paidInvoices = invoices.filter(i => i.status === 'paid')
  const pendingTotal = pendingInvoices.reduce((s, i) => s + (i.total_amount || 0), 0)
  const paidTotal = paidInvoices.reduce((s, i) => s + (i.total_amount || 0), 0)

  const maxHakedis = Math.max(...customerHakedisler.map(c => c.hakedis.total), 1)

  const commModelLabel = (model: string) => {
    if (model === 'fixed') return 'Sabit'
    if (model === 'percent') return 'Yüzde'
    if (model === 'both') return 'Sabit+%'
    return '-'
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Hakediş Özeti</h2>
          <p className="text-xs text-gray-400 mt-0.5">Tüm müşterilerin komisyon ve fatura durumu</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {PERIOD_OPTIONS.map(opt => (
            <button key={opt.key} onClick={() => setPeriod(opt.key as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${period === opt.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full" />
          <div className="relative">
            <p className="text-emerald-100 text-xs mb-1">Toplam Hakediş</p>
            <p className="text-2xl font-bold">₺{totalHakedis.toLocaleString()}</p>
            <p className="text-emerald-200 text-xs mt-1">{customers.length} müşteriden</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs text-gray-400 mb-1">Toplam Ciro</p>
          <p className="text-2xl font-bold text-gray-900">₺{totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">{totalSales} satış</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs text-gray-400 mb-1">Bekleyen Fatura</p>
          <p className="text-2xl font-bold text-amber-600">₺{pendingTotal.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">{pendingInvoices.length} fatura</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs text-gray-400 mb-1">Tahsil Edilen</p>
          <p className="text-2xl font-bold text-emerald-600">₺{paidTotal.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">{paidInvoices.length} fatura</p>
        </div>
      </div>

      {/* Müşteri bazlı hakediş tablosu */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 text-sm">Müşteri Bazlı Hakediş</h3>
          <span className="text-xs text-gray-400">Toplam: ₺{totalHakedis.toLocaleString()}</span>
        </div>

        {customers.length === 0 ? (
          <div className="p-12 text-center"><p className="text-gray-400 text-sm">Henüz müşteri yok.</p></div>
        ) : (
          <div className="divide-y divide-gray-50">
            {customerHakedisler.map((c, idx) => {
  const client = advertiserClients.find(ac => ac.customer_id === c.id)
  const cInvoices = invoices.filter(i => i.customer_id === c.id)
  const cPending = cInvoices.filter(i => i.status === 'pending')
  const cPaid = cInvoices.filter(i => i.status === 'paid')
  const cPendingTotal = cPending.reduce((s, i) => s + (i.total_amount || 0), 0)
  const cPaidTotal = cPaid.reduce((s, i) => s + (i.total_amount || 0), 0)
  const rankColor = idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-orange-400' : 'text-gray-300'
  const isOpen = openCustomer === c.id

  return (
    <div key={c.id} className={`border-b border-gray-50 last:border-0 ${isOpen ? 'bg-gray-50/50' : ''}`}>
      {/* Tıklanabilir başlık satırı */}
      <button
        onClick={() => setOpenCustomer(isOpen ? null : c.id)}
        className="w-full px-5 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors text-left"
      >
        <span className={`text-xs font-bold w-5 text-center flex-shrink-0 ${rankColor}`}>#{idx + 1}</span>
        <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center font-bold text-amber-600 text-sm flex-shrink-0">
          {c.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-semibold text-gray-900">{c.name}</p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-gray-400">{c.hakedis.salesCount} satış</span>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-400">₺{c.hakedis.revenue.toLocaleString()} ciro</span>
            {cPendingTotal > 0 && (
              <>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs text-rose-500 font-medium">₺{cPendingTotal.toLocaleString()} bekliyor</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <p className="text-base font-bold text-emerald-600">₺{c.hakedis.total.toLocaleString()}</p>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            viewBox="0 0 16 16" fill="none"
          >
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </button>

      {/* Açılır detay */}
      {isOpen && (
        <div className="px-5 pb-4 ml-9 space-y-3">
          {/* Detay kartları */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-white rounded-xl p-3 border border-gray-100">
              <p className="text-xs text-gray-400 mb-0.5">Komisyon Modeli</p>
              <p className="text-xs font-semibold text-gray-700">{commModelLabel(client?.commission_model)}</p>
            </div>
            {(client?.commission_model === 'fixed' || client?.commission_model === 'both') && (
              <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                <p className="text-xs text-gray-400 mb-0.5">Aylık Sabit</p>
                <p className="text-xs font-bold text-indigo-700">₺{client.monthly_fee}</p>
              </div>
            )}
            {(client?.commission_model === 'percent' || client?.commission_model === 'both') && (
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                <p className="text-xs text-gray-400 mb-0.5">Satış Komisyonu</p>
                <p className="text-xs font-bold text-amber-700">%{client?.commission_rate} · ₺{c.hakedis.percent.toLocaleString()}</p>
              </div>
            )}
            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
              <p className="text-xs text-gray-400 mb-0.5">Tahsil Edilen</p>
              <p className="text-xs font-bold text-emerald-700">₺{cPaidTotal.toLocaleString()}</p>
            </div>
            {cPendingTotal > 0 && (
              <div className="bg-rose-50 rounded-xl p-3 border border-rose-100">
                <p className="text-xs text-gray-400 mb-0.5">Bekleyen Fatura</p>
                <p className="text-xs font-bold text-rose-600">₺{cPendingTotal.toLocaleString()}</p>
              </div>
            )}
          </div>

          {/* Progress */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-gray-400">Toplam payı</span>
              <span className="text-xs font-medium text-gray-600">%{totalHakedis > 0 ? ((c.hakedis.total / totalHakedis) * 100).toFixed(0) : 0}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
                style={{ width: `${(c.hakedis.total / maxHakedis) * 100}%` }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
})}
          </div>
        )}

        {/* Toplam satırı */}
        {customers.length > 0 && (
          <div className="px-5 py-4 bg-gray-950 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-300">Genel Toplam</p>
            <p className="text-xl font-bold text-amber-400">₺{totalHakedis.toLocaleString()}</p>
          </div>
        )}
      </div>

      {/* Son faturalar */}
      {invoices.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">Son Faturalar</h3>
          </div>
          {invoices.slice(0, 8).map((inv, i) => {
            const invCustomer = customers.find(c => c.id === inv.customer_id)
            const statusMap: any = {
              pending: { label: 'Bekliyor', color: 'bg-amber-50 text-amber-700 border-amber-200' },
              paid: { label: 'Ödendi', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              overdue: { label: 'Gecikmiş', color: 'bg-red-50 text-red-700 border-red-200' },
            }
            const st = statusMap[inv.status] || statusMap.pending
            return (
              <div key={inv.id} className={`px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50/50 transition-colors ${i < Math.min(invoices.length, 8) - 1 ? 'border-b border-gray-50' : ''}`}>
                <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center font-bold text-amber-600 text-xs flex-shrink-0">
                  {invCustomer?.name?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">₺{inv.total_amount?.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">{invCustomer?.name} · {new Date(inv.created_at).toLocaleDateString('tr-TR')}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0 ${st.color}`}>{st.label}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}