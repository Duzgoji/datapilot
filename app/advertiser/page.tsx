'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useAdvertiser } from './context'

const Sparkline = ({ data, color = '#f59e0b' }: { data: number[], color?: string }) => {
  if (!data.length || data.every(d => d === 0)) return <div style={{ width: 80, height: 32 }} />
  const max = Math.max(...data, 1)
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 80},${32 - (v / max) * 32}`).join(' ')
  return (
    <svg width={80} height={32} viewBox="0 0 80 32" fill="none" className="opacity-80">
      <polyline points={points} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

export default function AdvertiserDashboard() {
  const { profile, customers, subscription, invoices, advertiserClients } = useAdvertiser()
  const [leads, setLeads] = useState<any[]>([])
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    if (customers.length === 0) return
    const ids = customers.map(c => c.id)
    supabase.from('leads').select('*').in('customer_id', ids).then(({ data }) => setLeads(data || []))
  }, [customers])

  const getPeriodStart = () => {
    const d = new Date()
    if (period === '7d') d.setDate(d.getDate() - 7)
    else if (period === '30d') d.setDate(d.getDate() - 30)
    else d.setDate(d.getDate() - 90)
    return d
  }

  const periodLeads = leads.filter(l => new Date(l.created_at) >= getPeriodStart())
  const totalLeads = periodLeads.length
  const totalSales = periodLeads.filter(l => l.status === 'procedure_done').length
  const totalRevenue = periodLeads.filter(l => l.status === 'procedure_done').reduce((s, l) => s + (l.procedure_amount || 0), 0)
  const convRate = totalLeads > 0 ? ((totalSales / totalLeads) * 100).toFixed(1) : '0'

  const getHakedis = (c: any) => {
    const client = advertiserClients.find(ac => ac.customer_id === c.id)
    if (!client) return 0
    const cSales = leads.filter(l => l.customer_id === c.id && l.status === 'procedure_done')
    const cRev = cSales.reduce((s, l) => s + (l.procedure_amount || 0), 0)
    if (client.commission_model === 'fixed') return client.monthly_fee || 0
    if (client.commission_model === 'percent') return (cRev * (client.commission_rate || 0)) / 100
    return (client.monthly_fee || 0) + (cRev * (client.commission_rate || 0)) / 100
  }

  const totalHakedis = customers.reduce((s, c) => s + getHakedis(c), 0)
  const monthlyIncome = (subscription?.monthly_fee || 0) + customers.length * (subscription?.per_client_fee || 0)
  const pendingTotal = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + (i.total_amount || 0), 0)

  const sparklineData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i)); d.setHours(0, 0, 0, 0)
    const next = new Date(d); next.setDate(next.getDate() + 1)
    return leads.filter(l => { const ld = new Date(l.created_at); return ld >= d && ld < next }).length
  })

  const bestCustomer = customers.map(c => ({
    ...c,
    saleCount: leads.filter(l => l.customer_id === c.id && l.status === 'procedure_done').length,
    leadCount: leads.filter(l => l.customer_id === c.id).length,
  })).sort((a, b) => b.saleCount - a.saleCount)[0]

  return (
    <div className="max-w-6xl space-y-5">

      {/* Hero */}
      <div className="bg-gray-950 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #f59e0b 0%, transparent 50%), radial-gradient(circle at 80% 20%, #6366f1 0%, transparent 50%)' }} />
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full">Genel BakÄ±ÅŸ</span>
            </div>
            <h1 className="text-2xl font-bold">Merhaba, {profile?.full_name?.split(' ')[0]}</h1>
            <p className="text-gray-400 text-sm mt-1">{customers.length} mÃ¼ÅŸteri Â· {leads.length} toplam lead</p>
          </div>
          <div className="relative">
            <select value={period} onChange={e => setPeriod(e.target.value as any)}
              className="appearance-none bg-white/10 border border-white/20 text-white text-xs font-medium pl-3 pr-8 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500">
              <option value="7d" className="text-gray-900">Son 7 GÃ¼n</option>
              <option value="30d" className="text-gray-900">Son 30 GÃ¼n</option>
              <option value="90d" className="text-gray-900">Son 90 GÃ¼n</option>
            </select>
            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none" width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-6 xl:grid-cols-4">
          {[
            { label: 'Potansiyel MÃ¼ÅŸteri', value: totalLeads, color: 'text-white', spark: true },
            { label: 'SatÄ±ÅŸ', value: totalSales, color: 'text-emerald-400', spark: false },
            { label: 'DÃ¶nÃ¼ÅŸÃ¼m', value: `%${convRate}`, color: 'text-violet-400', spark: false },
            { label: 'HakediÅŸ', value: `â‚º${totalHakedis.toLocaleString()}`, color: 'text-amber-400', spark: false },
          ].map((kpi, i) => (
            <div key={kpi.label} className="flex items-start justify-between">
              <div>
                <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
              </div>
              {kpi.spark && <Sparkline data={sparklineData} />}
            </div>
          ))}
        </div>
      </div>

      {/* Alt kartlar */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {bestCustomer && (
          <div className="bg-white rounded-2xl border border-amber-100 p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-50 rounded-bl-full" />
            <div className="relative">
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">â­ En Ä°yi MÃ¼ÅŸteri</span>
              <Link href={`/advertiser/customers/${bestCustomer.id}`} className="flex items-center gap-3 mt-3 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center font-bold text-amber-700">{bestCustomer.name.charAt(0)}</div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{bestCustomer.name}</p>
                  <p className="text-xs text-gray-400">{bestCustomer.saleCount} satÄ±ÅŸ Â· {bestCustomer.leadCount} lead</p>
                </div>
              </Link>
              <div className="mt-3">
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-gray-400">DÃ¶nÃ¼ÅŸÃ¼m</span>
                  <span className="text-xs font-semibold text-amber-600">%{bestCustomer.leadCount > 0 ? ((bestCustomer.saleCount / bestCustomer.leadCount) * 100).toFixed(0) : 0}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${bestCustomer.leadCount > 0 ? (bestCustomer.saleCount / bestCustomer.leadCount) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs font-medium text-gray-400 mb-2">Platform Gelirim</p>
          <p className="text-3xl font-bold text-gray-900">â‚º{monthlyIncome.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">â‚º{subscription?.monthly_fee || 0} + {customers.length} Ã— â‚º{subscription?.per_client_fee || 0}</p>
          {pendingTotal > 0 && (
            <div className="mt-3 flex items-center gap-2 bg-rose-50 rounded-lg px-2.5 py-2">
              <span className="w-1.5 h-1.5 bg-rose-400 rounded-full" />
              <span className="text-xs text-rose-600">â‚º{pendingTotal.toLocaleString()} bekleyen fatura</span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs font-medium text-gray-400 mb-2">Toplam HakediÅŸ</p>
          <p className="text-3xl font-bold text-emerald-600">â‚º{totalHakedis.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">{customers.length} mÃ¼ÅŸteriden</p>
          <Link href="/advertiser/hakedis" className="mt-3 block text-xs text-emerald-600 font-medium hover:underline">DetaylÄ± gÃ¶rÃ¼ntÃ¼le â†’</Link>
        </div>
      </div>

      {/* MÃ¼ÅŸteri portfÃ¶yÃ¼ */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="flex flex-col gap-2 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-semibold text-gray-900 text-sm">MÃ¼ÅŸteri PortfÃ¶yÃ¼</h3>
          <Link href="/advertiser/customers" className="text-xs text-amber-600 font-medium hover:text-amber-700">TÃ¼mÃ¼nÃ¼ YÃ¶net â†’</Link>
        </div>
        {customers.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-sm">HenÃ¼z mÃ¼ÅŸteri yok.</p>
            <Link href="/advertiser/customers" className="mt-2 inline-block text-xs text-amber-600 font-medium hover:underline">MÃ¼ÅŸteri Ekle â†’</Link>
          </div>
        ) : customers.map((c, i) => {
          const cLeads = leads.filter(l => l.customer_id === c.id)
          const cSales = cLeads.filter(l => l.status === 'procedure_done').length
          const cConv = cLeads.length > 0 ? ((cSales / cLeads.length) * 100).toFixed(0) : '0'
          const earned = getHakedis(c)
          return (
            <Link key={c.id} href={`/advertiser/customers/${c.id}`}
              className={`px-5 py-3.5 flex items-center gap-4 hover:bg-amber-50/30 transition-colors group ${i < customers.length - 1 ? 'border-b border-gray-50' : ''}`}>
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center font-bold text-amber-600 flex-shrink-0">{c.name.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-gray-400">{cLeads.length} potansiyel mÃ¼ÅŸteri</span>
                  <span className="text-xs text-emerald-600 font-medium">{cSales} satÄ±ÅŸ</span>
                  <span className="text-xs text-gray-400">%{cConv}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <p className="text-xs font-bold text-emerald-600">â‚º{earned.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">hakediÅŸ</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  {c.status === 'active' ? 'Aktif' : 'Pasif'}
                </span>
                <svg className="text-gray-300 group-hover:text-amber-400 transition-colors" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

