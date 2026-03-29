'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAdvertiser } from '../../../context'

const STATUS_INVOICE: any = {
  pending: { label: 'Bekliyor', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  awaiting_approval: { label: 'Ödeme Yapıldı ✓', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  paid: { label: 'Ödendi', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  overdue: { label: 'Gecikmiş', color: 'bg-red-50 text-red-700 border-red-200' },
}

export default function CustomerFinancePage() {
  const { customerId } = useParams<{ customerId: string }>()
  const { customers, advertiserClients } = useAdvertiser()
  const customer = customers.find(c => c.id === customerId)
  const client = advertiserClients.find(ac => ac.customer_id === customerId)

  const [leads, setLeads] = useState<any[]>([])
  const [finance, setFinance] = useState<any>(null)
  const [invoices, setInvoices] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'ozet' | 'faturalar'>('ozet')
  const [showAddInvoice, setShowAddInvoice] = useState(false)
  const [invDueDate, setInvDueDate] = useState('')
  const [savingInv, setSavingInv] = useState(false)

  useEffect(() => { loadAll() }, [customerId])

  const loadAll = async () => {
    const [leadsRes, financeRes, invoicesRes] = await Promise.all([
      supabase.from('leads').select('*').eq('customer_id', customerId).order('created_at', { ascending: false }),
      supabase.from('customer_finance').select('*').eq('customer_id', customerId).maybeSingle(),
      supabase.from('invoices').select('*').eq('customer_id', customerId).order('created_at', { ascending: false }),
    ])
    setLeads(leadsRes.data || [])
    setFinance(financeRes.data || null)
    setInvoices(invoicesRes.data || [])
  }

  const sales = leads.filter(l => l.status === 'procedure_done')
  const totalRevenue = sales.reduce((s, l) => s + (l.procedure_amount || 0), 0)
  const avgSale = sales.length > 0 ? totalRevenue / sales.length : 0

  const getHakedis = () => {
    if (!client) return { total: 0, fixed: 0, percent: 0 }
    const fixed = (client.commission_model === 'fixed' || client.commission_model === 'both') ? (client.monthly_fee || 0) : 0
    const pct = (client.commission_model === 'percent' || client.commission_model === 'both') ? (totalRevenue * (client.commission_rate || 0)) / 100 : 0
    return { total: fixed + pct, fixed, percent: pct }
  }
  const hakedis = getHakedis()
  const faturalanmisTotal = invoices
    .filter(i => i.status !== 'overdue')
    .reduce((s, i) => s + (i.total_amount || 0), 0)
  const kesilebilir = Math.max(0, hakedis.total - faturalanmisTotal)
  const pendingInvoices = invoices.filter(i => i.status === 'pending')
  const paidInvoices = invoices.filter(i => i.status === 'paid')
  const overdueInvoices = invoices.filter(i => i.status === 'overdue')
  const pendingTotal = pendingInvoices.reduce((s, i) => s + (i.total_amount || 0), 0)
  const paidTotal = paidInvoices.reduce((s, i) => s + (i.total_amount || 0), 0)

  const monthlyBreakdown = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i))
    const y = d.getFullYear(); const m = d.getMonth()
    const mLeads = leads.filter(l => { const ld = new Date(l.created_at); return ld.getFullYear() === y && ld.getMonth() === m })
    const mSales = mLeads.filter(l => l.status === 'procedure_done')
    const mRev = mSales.reduce((s, l) => s + (l.procedure_amount || 0), 0)
    let mEarned = 0
    if (client) {
      if (client.commission_model === 'fixed') mEarned = client.monthly_fee || 0
      else if (client.commission_model === 'percent') mEarned = (mRev * (client.commission_rate || 0)) / 100
      else mEarned = (client.monthly_fee || 0) + (mRev * (client.commission_rate || 0)) / 100
    }
    return { label: d.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' }), leads: mLeads.length, sales: mSales.length, revenue: mRev, earned: mEarned }
  })
  const maxRevenue = Math.max(...monthlyBreakdown.map(m => m.revenue), 1)

  const handleAddInvoice = async () => {
    setSavingInv(true)
    await supabase.from('invoices').insert({
      customer_id: customerId,
      total_amount: kesilebilir,
      due_date: invDueDate || null,
      status: 'pending',
    })
    setInvDueDate('')
    setShowAddInvoice(false)
    await loadAll()
    setSavingInv(false)
  }

  const updateInvoiceStatus = async (id: string, status: string) => {
    await supabase.from('invoices').update({ status }).eq('id', id)
    await loadAll()
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h2 className="text-base font-semibold text-gray-900">{customer?.name} · Finans & Hakediş</h2>
        <p className="text-xs text-gray-400 mt-0.5">Komisyon hesabı ve fatura yönetimi</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full" />
          <div className="relative">
            <p className="text-emerald-100 text-xs mb-1">Toplam Hakediş</p>
            <p className="text-2xl font-bold">₺{hakedis.total.toLocaleString()}</p>
            <p className="text-emerald-200 text-xs mt-1">
              {hakedis.fixed > 0 && `₺${hakedis.fixed} sabit`}
              {hakedis.fixed > 0 && hakedis.percent > 0 && ' + '}
              {hakedis.percent > 0 && `₺${hakedis.percent.toLocaleString()} komisyon`}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs text-gray-400 mb-1">Müşteri Cirosu</p>
          <p className="text-2xl font-bold text-gray-900">₺{totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">{sales.length} satış · ort. ₺{Math.round(avgSale).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs text-gray-400 mb-1">Bekleyen Fatura</p>
          <p className="text-2xl font-bold text-amber-600">₺{pendingTotal.toLocaleString()}</p>
          <div className="flex items-center gap-2 mt-1">
            {overdueInvoices.length > 0 && <span className="text-xs text-red-500 font-medium">{overdueInvoices.length} gecikmiş</span>}
            <span className="text-xs text-gray-400">{pendingInvoices.length} fatura</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs text-gray-400 mb-1">Tahsil Edilen</p>
          <p className="text-2xl font-bold text-emerald-600">₺{paidTotal.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">{paidInvoices.length} fatura ödendi</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {([['ozet', 'Özet'], ['faturalar', 'Faturalar']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
            {key === 'faturalar' && pendingInvoices.length > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingInvoices.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── ÖZET ── */}
      {activeTab === 'ozet' && (
        <div className="space-y-4">
          {client && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-4">Komisyon Hesabı</h3>
              <div className="space-y-2.5">
                {(client.commission_model === 'fixed' || client.commission_model === 'both') && (
                  <div className="flex items-center justify-between bg-indigo-50 rounded-xl px-4 py-3 border border-indigo-100">
                    <div>
                      <p className="text-sm font-medium text-indigo-900">Aylık Sabit Ücret</p>
                      <p className="text-xs text-indigo-500">Her ay düzenli tahakkuk</p>
                    </div>
                    <p className="text-lg font-bold text-indigo-700">₺{(client.monthly_fee || 0).toLocaleString()}</p>
                  </div>
                )}
                {(client.commission_model === 'percent' || client.commission_model === 'both') && (
                  <div className="flex items-center justify-between bg-amber-50 rounded-xl px-4 py-3 border border-amber-100">
                    <div>
                      <p className="text-sm font-medium text-amber-900">Satış Komisyonu</p>
                      <p className="text-xs text-amber-500">%{client.commission_rate} × ₺{totalRevenue.toLocaleString()} ciro</p>
                    </div>
                    <p className="text-lg font-bold text-amber-700">₺{hakedis.percent.toLocaleString()}</p>
                  </div>
                )}
                <div className="flex items-center justify-between bg-emerald-50 rounded-xl px-4 py-3 border border-emerald-100">
                  <p className="text-sm font-bold text-emerald-900">Toplam Hakediş</p>
                  <p className="text-xl font-bold text-emerald-700">₺{hakedis.total.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-4">Aylık Performans</h3>
            <div className="space-y-3">
              {monthlyBreakdown.map((m, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-gray-500 w-12 flex-shrink-0">{m.label}</span>
                      <span className="text-xs text-gray-400">{m.leads} lead · {m.sales} satış</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-semibold text-gray-700">₺{m.revenue.toLocaleString()}</span>
                      <span className="text-xs font-bold text-emerald-600 w-20 text-right">₺{m.earned.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-400 to-violet-300 rounded-full transition-all"
                      style={{ width: `${(m.revenue / maxRevenue) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-4 pt-3 border-t border-gray-100">
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="w-2.5 h-2.5 bg-violet-300 rounded-sm inline-block" /> Ciro (bar)
              </span>
              <span className="text-xs text-emerald-600 font-medium">Yeşil rakam = hakediş</span>
            </div>
          </div>

          {finance && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-4">Finansal Konfigürasyon</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-xl p-3.5">
                  <p className="text-xs text-gray-400 mb-1">Servis Ücreti</p>
                  <p className="text-base font-bold text-gray-900">₺{(finance.service_fee || 0).toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3.5">
                  <p className="text-xs text-gray-400 mb-1">Reklam Bütçesi</p>
                  <p className="text-base font-bold text-gray-900">₺{(finance.ad_budget || 0).toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3.5">
                  <p className="text-xs text-gray-400 mb-1">Komisyon Oranı</p>
                  <p className="text-base font-bold text-gray-900">%{finance.commission_rate || 0}</p>
                </div>
              </div>
              {finance.notes && (
                <div className="mt-3 bg-gray-50 rounded-xl p-3.5">
                  <p className="text-xs text-gray-400 mb-1">Notlar</p>
                  <p className="text-sm text-gray-700">{finance.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── FATURALAR ── */}
      {activeTab === 'faturalar' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">{invoices.length} fatura</p>
           <button onClick={handleAddInvoice} disabled={savingInv || kesilebilir <= 0}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-xl text-xs font-medium transition-colors">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              Fatura Kes
            </button>
          </div>

          {showAddInvoice && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <h4 className="text-sm font-semibold text-amber-900 mb-3">Fatura Kes</h4>
              <div className="bg-white rounded-xl p-3 mb-3 flex items-center justify-between border border-amber-100">
                <div>
                  <span className="text-xs text-gray-500">Kesilebilir tutar</span>
                  <p className="text-xs text-gray-400 mt-0.5">₺{hakedis.total.toLocaleString()} − ₺{faturalanmisTotal.toLocaleString()} faturalandırıldı</p>
                </div>
                <span className={`text-base font-bold ${kesilebilir > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                  ₺{kesilebilir.toLocaleString()}
                </span>
              </div>

              {kesilebilir <= 0 && (
                <div className="mb-3 bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-500 text-center">
                  Tüm hakediş faturalandırılmış. Yeni satış eklenince tekrar kesebilirsiniz.
                </div>
              )}
              <div className="mb-3">
                <label className="block text-xs text-gray-500 mb-1">Son Ödeme Tarihi</label>
                <input type="date" value={invDueDate} onChange={e => setInvDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowAddInvoice(false)}
                  className="flex-1 bg-white border border-gray-200 text-gray-600 py-2 rounded-xl text-xs font-medium hover:bg-gray-50 transition-colors">
                  İptal
                </button>
                <button onClick={handleAddInvoice} disabled={savingInv}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white py-2 rounded-xl text-xs font-semibold transition-colors">
                 {savingInv ? 'Kaydediliyor...' : `₺${kesilebilir.toLocaleString()} Fatura Kes`}
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {invoices.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-400 text-sm">Henüz fatura yok.</p>
                <button onClick={() => setShowAddInvoice(true)} className="mt-2 text-xs text-amber-600 hover:underline">
                  Fatura Kes →
                </button>
              </div>
            ) : invoices.map((inv, i) => {
              const st = STATUS_INVOICE[inv.status] || STATUS_INVOICE.pending
              const isOverdue = inv.due_date && new Date(inv.due_date) < new Date() && inv.status === 'pending'
              return (
                <div key={inv.id} className={`px-5 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors ${i < invoices.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${inv.status === 'paid' ? 'bg-emerald-100' : isOverdue ? 'bg-red-100' : 'bg-amber-100'}`}>
                    {inv.status === 'paid'
                      ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1.5 7l3.5 3.5 7.5-7" stroke="#059669" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      : <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 4v4M7 10v.5" stroke={isOverdue ? '#dc2626' : '#d97706'} strokeWidth="1.5" strokeLinecap="round"/></svg>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">₺{inv.total_amount?.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {inv.due_date
                        ? `Son ödeme: ${new Date(inv.due_date).toLocaleDateString('tr-TR')}`
                        : `Oluşturuldu: ${new Date(inv.created_at).toLocaleDateString('tr-TR')}`}
                      {isOverdue && <span className="ml-2 text-red-500 font-medium">Vadesi geçti!</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${st.color}`}>{st.label}</span>
                    {inv.status === 'awaiting_approval' && (
  <button onClick={() => updateInvoiceStatus(inv.id, 'paid')}
    className="text-xs text-emerald-600 font-semibold px-2.5 py-1 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-300 bg-emerald-50/50">
    Onayla ✓
  </button>
)}
{inv.status === 'pending' && (
  <button onClick={() => updateInvoiceStatus(inv.id, 'paid')}
    className="text-xs text-gray-500 font-medium px-2.5 py-1 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200">
    Ödendi
  </button>
)}
                    {inv.status === 'pending' && isOverdue && (
                      <button onClick={() => updateInvoiceStatus(inv.id, 'overdue')}
                        className="text-xs text-red-500 font-medium px-2.5 py-1 hover:bg-red-50 rounded-lg transition-colors border border-red-200">
                        Gecikmiş
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}