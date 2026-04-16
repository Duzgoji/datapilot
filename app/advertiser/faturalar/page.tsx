'use client'

import { useEffect, useState } from 'react'
import { logClientAuditEvent } from '@/lib/audit/client'
import { supabase } from '@/lib/supabase/client'
import { useAdvertiser } from '../context'
import {
  findAdvertiserCustomerByInvoice,
  getAdvertiserCustomerOwnerIds,
  resolveAdvertiserCustomerTenantMap,
} from '@/lib/tenant/advertiserCustomer'

const STATUS_COLORS: any = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  awaiting_approval: 'bg-blue-50 text-blue-700 border-blue-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  overdue: 'bg-red-50 text-red-700 border-red-200',
}
const STATUS_LABELS: any = {
  pending: 'Bekliyor',
  awaiting_approval: 'Onay Bekliyor',
  paid: 'Ã–dendi',
  overdue: 'GecikmiÅŸ',
}

export default function FaturalarPage() {
  const { customers } = useAdvertiser()
  const [invoices, setInvoices] = useState<any[]>([])
  const [paymentLogs, setPaymentLogs] = useState<any[]>([])
  const [myInvoices, setMyInvoices] = useState<any[]>([])
  const [tenantMap, setTenantMap] = useState<Record<string, any>>({})
  const [activeTab, setActiveTab] = useState<'faturalar' | 'log'>('faturalar')
  const [mainTab, setMainTab] = useState<'musteri' | 'bana-gelen'>('musteri')
  const [filterCustomer, setFilterCustomer] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPeriod, setFilterPeriod] = useState<'30d' | '90d' | 'all' | 'custom'>('all')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [search, setSearch] = useState('')

  const loadAll = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const ids = customers.map(c => c.id)
    const resolvedTenantMap = await resolveAdvertiserCustomerTenantMap(customers)
    const ownerIds = getAdvertiserCustomerOwnerIds(resolvedTenantMap)
    setTenantMap(resolvedTenantMap)

    const [invoicesRes, logsRes, myInvoicesRes] = await Promise.all([
      ids.length > 0
        ? supabase
            .from('invoices')
            .select('*')
            .or(`customer_id.in.(${ids.join(',')}),owner_id.in.(${ownerIds.join(',')})`)
            .order('created_at', { ascending: false })
        : Promise.resolve({ data: [] }),
      ids.length > 0
        ? supabase.from('payment_logs').select('*').in('customer_id', ids).order('created_at', { ascending: false })
        : Promise.resolve({ data: [] }),
      supabase.from('invoices').select('*').eq('owner_id', user?.id).order('created_at', { ascending: false }),
    ])

    console.info('[Advertiser Billing] Profile-rooted advertiser invoice read', {
      source: 'advertiser_faturalar',
      reason: 'advertiser_invoice_owner_id',
      advertiser_id: user?.id || null,
    })

    const compatibleInvoices = ((invoicesRes as any).data || []).filter((invoice: any) =>
      Boolean(findAdvertiserCustomerByInvoice(customers, resolvedTenantMap, invoice))
    )

    setInvoices(compatibleInvoices)
    setPaymentLogs((logsRes as any).data || [])
    setMyInvoices(myInvoicesRes.data || [])
  }

  useEffect(() => {
    void loadAll()
  }, [customers])

  const getPeriodStart = () => {
    if (filterPeriod === 'custom' && customStart) return new Date(customStart)
    if (filterPeriod === 'all') return new Date(0)
    const d = new Date()
    if (filterPeriod === '30d') d.setDate(d.getDate() - 30)
    else if (filterPeriod === '90d') d.setDate(d.getDate() - 90)
    return d
  }

  const getPeriodEnd = () => {
    if (filterPeriod === 'custom' && customEnd) {
      const d = new Date(customEnd); d.setHours(23, 59, 59); return d
    }
    return new Date()
  }

  const getCustomerForRecord = (record: { customer_id?: string | null; owner_id?: string | null }) =>
    findAdvertiserCustomerByInvoice(customers, tenantMap, record)

  const getCustomerName = (customerId?: string, ownerId?: string) =>
    getCustomerForRecord({ customer_id: customerId, owner_id: ownerId })?.name || '-'

  const filteredInvoices = invoices.filter(inv => {
    const matchedCustomer = getCustomerForRecord(inv)
    const matchCustomer = filterCustomer === 'all' || matchedCustomer?.id === filterCustomer
    const matchStatus = filterStatus === 'all' || inv.status === filterStatus
    const matchPeriod = new Date(inv.created_at) >= getPeriodStart() && new Date(inv.created_at) <= getPeriodEnd()
    const matchSearch = !search || getCustomerName(inv.customer_id, inv.owner_id).toLowerCase().includes(search.toLowerCase())
    return matchCustomer && matchStatus && matchPeriod && matchSearch
  })

  const filteredLogs = paymentLogs.filter(log => {
    const matchedCustomer = getCustomerForRecord(log)
    const matchCustomer = filterCustomer === 'all' || matchedCustomer?.id === filterCustomer
    const matchPeriod = new Date(log.created_at) >= getPeriodStart() && new Date(log.created_at) <= getPeriodEnd()
    const matchSearch = !search || getCustomerName(log.customer_id, log.owner_id).toLowerCase().includes(search.toLowerCase())
    return matchCustomer && matchPeriod && matchSearch
  })

  const totalPending = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + (i.total_amount || 0), 0)
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total_amount || 0), 0)
  const totalOverdue = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + (i.total_amount || 0), 0)

  const markAsPaid = async (inv: any) => {
    const matchedCustomer = getCustomerForRecord(inv)
    await supabase.from('invoices').update({ status: 'paid' }).eq('id', inv.id)
    await supabase.from('payment_logs').insert({
      customer_id: matchedCustomer?.id || inv.customer_id || null,
      invoice_id: inv.id,
      amount: inv.total_amount,
      type: 'payment',
      note: 'Fatura Ã¶dendi',
    })
    await logClientAuditEvent({
      action: 'payment_recorded',
      entityType: 'payment',
      entityId: inv.id,
      tenantId: matchedCustomer?.id || inv.customer_id || null,
      metadata: {
        source: 'advertiser_invoice_payment',
        amount: inv.total_amount,
        invoice_id: inv.id,
      },
    })
    await loadAll()
  }

  const markAsOverdue = async (inv: any) => {
    await supabase.from('invoices').update({ status: 'overdue' }).eq('id', inv.id)
    await loadAll()
  }

  const exportCSV = (type: 'invoices' | 'logs') => {
    const rows = type === 'invoices'
      ? [['MÃ¼ÅŸteri', 'Tutar', 'Durum', 'Son Ã–deme', 'OluÅŸturulma'],
         ...filteredInvoices.map(inv => [getCustomerName(inv.customer_id, inv.owner_id), inv.total_amount, STATUS_LABELS[inv.status] || inv.status, inv.due_date ? new Date(inv.due_date).toLocaleDateString('tr-TR') : '-', new Date(inv.created_at).toLocaleDateString('tr-TR')])]
      : [['MÃ¼ÅŸteri', 'Tutar', 'TÃ¼r', 'Not', 'Tarih'],
         ...filteredLogs.map(log => [getCustomerName(log.customer_id), log.amount, log.type === 'payment' ? 'Ã–deme' : log.type === 'refund' ? 'Ä°ade' : 'DÃ¼zeltme', log.note || '-', new Date(log.created_at).toLocaleDateString('tr-TR')])]
    const content = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = type === 'invoices' ? 'faturalar.csv' : 'odeme-gecmisi.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-5xl space-y-5">

      {/* UyarÄ± banner */}
      {myInvoices.filter(i => i.status === 'pending').length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse flex-shrink-0" />
          <p className="text-xs font-semibold text-amber-700">
            {myInvoices.filter(i => i.status === 'pending').length} bekleyen faturanÄ±z var
          </p>
          <button onClick={() => setMainTab('bana-gelen')} className="ml-auto text-xs text-amber-700 font-medium hover:underline">GÃ¶rÃ¼ntÃ¼le â†’</button>
        </div>
      )}

      {/* Ana Tab */}
      <div className="flex w-full flex-wrap gap-1 rounded-xl bg-gray-100 p-1 sm:w-fit">
        {([['musteri', 'MÃ¼ÅŸteri FaturalarÄ±'], ['bana-gelen', 'Bana Gelen Faturalar']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setMainTab(key)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${mainTab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
            {key === 'bana-gelen' && myInvoices.filter(i => i.status === 'pending').length > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {myInvoices.filter(i => i.status === 'pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* â”€â”€ MÃœÅTERÄ° FATURALARI â”€â”€ */}
      {mainTab === 'musteri' && (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Faturalar & Ã–deme GeÃ§miÅŸi</h2>
              <p className="text-xs text-gray-400 mt-0.5">TÃ¼m mÃ¼ÅŸterilerin fatura ve Ã¶deme loglarÄ±</p>
            </div>
            <button onClick={() => exportCSV(activeTab === 'faturalar' ? 'invoices' : 'logs')}
              className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-xs font-medium transition-colors">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v8M3.5 6l3 3 3-3M1.5 10.5h10" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/></svg>
              CSV Ä°ndir
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Toplam Fatura', value: invoices.length, sub: 'adet', color: 'text-gray-900' },
              { label: 'Bekleyen', value: `â‚º${totalPending.toLocaleString()}`, sub: `${invoices.filter(i => i.status === 'pending').length} fatura`, color: 'text-amber-600' },
              { label: 'Tahsil Edilen', value: `â‚º${totalPaid.toLocaleString()}`, sub: `${invoices.filter(i => i.status === 'paid').length} fatura`, color: 'text-emerald-600' },
              { label: 'GecikmiÅŸ', value: `â‚º${totalOverdue.toLocaleString()}`, sub: `${invoices.filter(i => i.status === 'overdue').length} fatura`, color: 'text-red-500' },
            ].map(k => (
              <div key={k.label} className="bg-white rounded-2xl border border-gray-100 p-5">
                <p className="text-xs text-gray-400 mb-1">{k.label}</p>
                <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
                <p className="text-xs text-gray-400 mt-1">{k.sub}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-4 sm:px-5">
            <div className="relative flex-1 min-w-[160px]">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.25"/><path d="M9 9l2.5 2.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="MÃ¼ÅŸteri ara..."
                className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div className="relative">
              <select value={filterCustomer} onChange={e => setFilterCustomer(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500">
                <option value="all">TÃ¼m MÃ¼ÅŸteriler</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            {activeTab === 'faturalar' && (
              <div className="relative">
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500">
                  <option value="all">TÃ¼m Durumlar</option>
                  <option value="pending">Bekleyen</option>
                  <option value="awaiting_approval">Onay Bekliyor</option>
                  <option value="paid">Ã–dendi</option>
                  <option value="overdue">GecikmiÅŸ</option>
                </select>
                <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            )}
            <div className="relative">
              <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value as any)}
                className="appearance-none pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500">
                <option value="all">TÃ¼m Zamanlar</option>
                <option value="30d">Son 30 GÃ¼n</option>
                <option value="90d">Son 90 GÃ¼n</option>
                <option value="custom">Ã–zel Tarih</option>
              </select>
              <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            {filterPeriod === 'custom' && (
              <div className="flex items-center gap-2">
                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500" />
                <span className="text-xs text-gray-400">â€”</span>
                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
            )}
          </div>

          <div className="flex w-full flex-wrap gap-1 rounded-xl bg-gray-100 p-1 sm:w-fit">
            {([['faturalar', 'Faturalar'], ['log', 'Ã–deme GeÃ§miÅŸi']] as const).map(([key, label]) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {label}
                {key === 'faturalar' && invoices.filter(i => i.status === 'pending' || i.status === 'awaiting_approval').length > 0 && (
                  <span className="ml-1.5 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {invoices.filter(i => i.status === 'pending' || i.status === 'awaiting_approval').length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {activeTab === 'faturalar' && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="hidden md:block">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <div className="grid grid-cols-6 gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <div className="col-span-2">MÃ¼ÅŸteri</div>
                    <div className="text-right">Tutar</div>
                    <div className="text-center">Durum</div>
                    <div className="text-center">Son Ã–deme</div>
                    <div className="text-right">Ä°ÅŸlem</div>
                  </div>
                </div>
                {filteredInvoices.length === 0 ? (
                  <div className="p-12 text-center"><p className="text-gray-400 text-sm">Fatura bulunamadÄ±.</p></div>
                ) : filteredInvoices.map((inv, i) => {
                  const isOverdue = inv.due_date && new Date(inv.due_date) < new Date() && inv.status === 'pending'
                  const st = STATUS_COLORS[inv.status] || STATUS_COLORS.pending
                  return (
                    <div key={inv.id} className={`px-5 py-3.5 grid grid-cols-6 gap-2 items-center hover:bg-gray-50/50 transition-colors ${i < filteredInvoices.length - 1 ? 'border-b border-gray-50' : ''}`}>
                      <div className="col-span-2 flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center font-bold text-amber-600 text-xs flex-shrink-0">
                          {getCustomerName(inv.customer_id, inv.owner_id).charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{getCustomerName(inv.customer_id, inv.owner_id)}</p>
                          <p className="text-xs text-gray-400">{new Date(inv.created_at).toLocaleDateString('tr-TR')}</p>
                        </div>
                      </div>
                      <div className="text-right"><p className="text-sm font-bold text-gray-900">â‚º{inv.total_amount?.toLocaleString()}</p></div>
                      <div className="text-center"><span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${st}`}>{STATUS_LABELS[inv.status]}</span></div>
                      <div className="text-center">
                        <p className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                          {inv.due_date ? new Date(inv.due_date).toLocaleDateString('tr-TR') : '-'}{isOverdue && ' âš '}
                        </p>
                      </div>
                      <div className="text-right flex items-center justify-end gap-1.5">
                        {(inv.status === 'pending' || inv.status === 'awaiting_approval') && (
                          <button onClick={() => markAsPaid(inv)} className="text-xs text-emerald-600 font-medium px-2.5 py-1 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200">Ã–dendi</button>
                        )}
                        {inv.status === 'pending' && isOverdue && (
                          <button onClick={() => markAsOverdue(inv)} className="text-xs text-red-500 font-medium px-2.5 py-1 hover:bg-red-50 rounded-lg transition-colors border border-red-200">GecikmiÅŸ</button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="divide-y divide-gray-100 md:hidden">
                {filteredInvoices.length === 0 ? (
                  <div className="p-12 text-center"><p className="text-gray-400 text-sm">Fatura bulunamadÄ±.</p></div>
                ) : filteredInvoices.map((inv) => {
                  const isOverdue = inv.due_date && new Date(inv.due_date) < new Date() && inv.status === 'pending'
                  const st = STATUS_COLORS[inv.status] || STATUS_COLORS.pending
                  return (
                    <div key={inv.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{getCustomerName(inv.customer_id, inv.owner_id)}</p>
                          <p className="text-xs text-gray-400 mt-1">{new Date(inv.created_at).toLocaleDateString('tr-TR')}</p>
                        </div>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${st}`}>{STATUS_LABELS[inv.status]}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-bold text-gray-900">â‚º{inv.total_amount?.toLocaleString()}</p>
                        <p className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                          {inv.due_date ? new Date(inv.due_date).toLocaleDateString('tr-TR') : '-'}{isOverdue && ' âš '}
                        </p>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        {(inv.status === 'pending' || inv.status === 'awaiting_approval') && (
                          <button onClick={() => markAsPaid(inv)} className="text-xs text-emerald-600 font-medium px-2.5 py-1 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200">Ã–dendi</button>
                        )}
                        {inv.status === 'pending' && isOverdue && (
                          <button onClick={() => markAsOverdue(inv)} className="text-xs text-red-500 font-medium px-2.5 py-1 hover:bg-red-50 rounded-lg transition-colors border border-red-200">GecikmiÅŸ</button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === 'log' && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="hidden md:block">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <div className="grid grid-cols-5 gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <div className="col-span-2">MÃ¼ÅŸteri</div>
                    <div className="text-right">Tutar</div>
                    <div className="text-center">TÃ¼r</div>
                    <div className="text-right">Tarih</div>
                  </div>
                </div>
                {filteredLogs.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-gray-400 text-sm">Ã–deme kaydÄ± yok.</p>
                    <p className="text-xs text-gray-300 mt-1">Faturalar "Ã–dendi" iÅŸaretlenince burada gÃ¶rÃ¼nÃ¼r.</p>
                  </div>
                ) : filteredLogs.map((log, i) => {
                  const typeLabel = log.type === 'payment' ? 'Ã–deme' : log.type === 'refund' ? 'Ä°ade' : 'DÃ¼zeltme'
                  const typeColor = log.type === 'payment' ? 'bg-emerald-50 text-emerald-700' : log.type === 'refund' ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'
                  return (
                    <div key={log.id} className={`px-5 py-3.5 grid grid-cols-5 gap-2 items-center hover:bg-gray-50/50 transition-colors ${i < filteredLogs.length - 1 ? 'border-b border-gray-50' : ''}`}>
                      <div className="col-span-2 flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1.5 6l3 3 6-5" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{getCustomerName(log.customer_id, log.owner_id)}</p>
                          {log.note && <p className="text-xs text-gray-400 truncate">{log.note}</p>}
                        </div>
                      </div>
                      <div className="text-right"><p className="text-sm font-bold text-emerald-600">â‚º{log.amount?.toLocaleString()}</p></div>
                      <div className="text-center"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${typeColor}`}>{typeLabel}</span></div>
                      <div className="text-right"><p className="text-xs text-gray-400">{new Date(log.created_at).toLocaleDateString('tr-TR')}</p></div>
                    </div>
                  )
                })}
              </div>
              <div className="divide-y divide-gray-100 md:hidden">
                {filteredLogs.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-gray-400 text-sm">Ã–deme kaydÄ± yok.</p>
                    <p className="text-xs text-gray-300 mt-1">Faturalar "Ã–dendi" iÅŸaretlenince burada gÃ¶rÃ¼nÃ¼r.</p>
                  </div>
                ) : filteredLogs.map((log) => {
                  const typeLabel = log.type === 'payment' ? 'Ã–deme' : log.type === 'refund' ? 'Ä°ade' : 'DÃ¼zeltme'
                  const typeColor = log.type === 'payment' ? 'bg-emerald-50 text-emerald-700' : log.type === 'refund' ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'
                  return (
                    <div key={log.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{getCustomerName(log.customer_id, log.owner_id)}</p>
                          {log.note && <p className="text-xs text-gray-400 mt-1 truncate">{log.note}</p>}
                        </div>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${typeColor}`}>{typeLabel}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-bold text-emerald-600">â‚º{log.amount?.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">{new Date(log.created_at).toLocaleDateString('tr-TR')}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* â”€â”€ BANA GELEN FATURALAR â”€â”€ */}
      {mainTab === 'bana-gelen' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Bana Gelen Faturalar</h2>
            <p className="text-xs text-gray-400 mt-0.5">DataPilot tarafÄ±ndan kesilen faturalar</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { label: 'Bekleyen', value: `â‚º${myInvoices.filter(i => i.status === 'pending').reduce((s, i) => s + (i.total_amount || 0), 0).toLocaleString()}`, count: myInvoices.filter(i => i.status === 'pending').length, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Onay Bekliyor', value: `â‚º${myInvoices.filter(i => i.status === 'awaiting_approval').reduce((s, i) => s + (i.total_amount || 0), 0).toLocaleString()}`, count: myInvoices.filter(i => i.status === 'awaiting_approval').length, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Ã–dendi', value: `â‚º${myInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total_amount || 0), 0).toLocaleString()}`, count: myInvoices.filter(i => i.status === 'paid').length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            ].map(k => (
              <div key={k.label} className={`${k.bg} rounded-xl px-4 py-3`}>
                <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{k.label} Â· {k.count} fatura</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="hidden md:block">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                <div className="grid grid-cols-5 gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <div className="col-span-2">AÃ§Ä±klama</div>
                  <div className="text-right">Tutar</div>
                  <div className="text-center">Durum</div>
                  <div className="text-right">Ä°ÅŸlem</div>
                </div>
              </div>
              {myInvoices.length === 0 ? (
                <div className="p-12 text-center"><p className="text-gray-400 text-sm">Fatura yok.</p></div>
              ) : myInvoices.map((inv, i) => (
                <div key={inv.id} className={`px-5 py-3.5 grid grid-cols-5 gap-2 items-center ${i < myInvoices.length - 1 ? 'border-b border-gray-50' : ''} hover:bg-gray-50/50 transition-colors`}>
                  <div className="col-span-2 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{inv.note || 'AylÄ±k hizmet bedeli'}</p>
                    <p className="text-xs text-gray-400">
                      {inv.due_date ? `Vade: ${new Date(inv.due_date).toLocaleDateString('tr-TR')}` : new Date(inv.created_at).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  <div className="text-right"><p className="text-sm font-bold text-gray-900">â‚º{inv.total_amount?.toLocaleString()}</p></div>
                  <div className="text-center">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_COLORS[inv.status] || STATUS_COLORS.pending}`}>
                      {STATUS_LABELS[inv.status] || inv.status}
                    </span>
                  </div>
                  <div className="text-right">
                    {inv.status === 'pending' && (
                      <button onClick={async () => {
                        await supabase.from('invoices').update({ status: 'awaiting_approval' }).eq('id', inv.id)
                        await loadAll()
                      }} className="text-xs text-blue-600 font-medium px-3 py-1.5 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200">
                        Ã–deme YaptÄ±m
                      </button>
                    )}
                    {inv.status === 'awaiting_approval' && (
                      <span className="text-xs text-blue-500 font-medium">Onay bekleniyor</span>
                    )}
                    {inv.status === 'paid' && (
                      <span className="text-xs text-emerald-600 font-medium">âœ“ Ã–dendi</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="divide-y divide-gray-100 md:hidden">
              {myInvoices.length === 0 ? (
                <div className="p-12 text-center"><p className="text-gray-400 text-sm">Fatura yok.</p></div>
              ) : myInvoices.map((inv) => (
                <div key={inv.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">{inv.note || 'AylÄ±k hizmet bedeli'}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {inv.due_date ? `Vade: ${new Date(inv.due_date).toLocaleDateString('tr-TR')}` : new Date(inv.created_at).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_COLORS[inv.status] || STATUS_COLORS.pending}`}>
                      {STATUS_LABELS[inv.status] || inv.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-gray-900">â‚º{inv.total_amount?.toLocaleString()}</p>
                    <div className="text-right">
                      {inv.status === 'pending' && (
                        <button onClick={async () => {
                          await supabase.from('invoices').update({ status: 'awaiting_approval' }).eq('id', inv.id)
                          await loadAll()
                        }} className="text-xs text-blue-600 font-medium px-3 py-1.5 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200">
                          Ã–deme YaptÄ±m
                        </button>
                      )}
                      {inv.status === 'awaiting_approval' && (
                        <span className="text-xs text-blue-500 font-medium">Onay bekleniyor</span>
                      )}
                      {inv.status === 'paid' && (
                        <span className="text-xs text-emerald-600 font-medium">âœ“ Ã–dendi</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

