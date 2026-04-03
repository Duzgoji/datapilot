'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useAdvertiser } from '../context'

const Modal = ({ open, onClose, title, children, size = 'lg' }: any) => {
  if (!open) return null
  const sizes: any = { md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} z-10 max-h-[90vh] flex flex-col`}>
        <div className="flex items-start justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 ml-4">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1 1l11 11M12 1L1 12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  )
}

const Input = ({ label, ...props }: any) => (
  <div>
    {label && <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>}
    <input {...props} className={`w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 ${props.className || ''}`} />
  </div>
)

export default function CustomersPage() {
  const { customers, advertiserClients, reload } = useAdvertiser()
  const [leads, setLeads] = useState<any[]>([])
  const [metaConnections, setMetaConnections] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'card' | 'table'>('card')

  // Form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [sector, setSector] = useState('')
  const [commModel, setCommModel] = useState<'fixed' | 'percent' | 'both'>('fixed')
  const [monthlyFee, setMonthlyFee] = useState('')
  const [commRate, setCommRate] = useState('')
  const [adding, setAdding] = useState(false)
  const [addSuccess, setAddSuccess] = useState('')
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('new') === '1') {
      setShowAdd(true)
      window.history.replaceState({}, '', '/advertiser/customers')
    }
  }, [])

  useEffect(() => {
    if (customers.length === 0) return
    const ids = customers.map(c => c.id)
    supabase.from('leads').select('id, customer_id, status, procedure_amount').in('customer_id', ids)
      .then(({ data }) => setLeads(data || []))
    supabase.from('meta_connections').select('*')
      .in('owner_id', customers.map(c => c.owner_id).filter(Boolean))
      .then(({ data }) => setMetaConnections(data || []))
  }, [customers])

  const getHakedis = (c: any) => {
    const client = advertiserClients.find(ac => ac.customer_id === c.id)
    if (!client) return 0
    const cSales = leads.filter(l => l.customer_id === c.id && l.status === 'procedure_done')
    const cRev = cSales.reduce((s: number, l: any) => s + (l.procedure_amount || 0), 0)
    if (client.commission_model === 'fixed') return client.monthly_fee || 0
    if (client.commission_model === 'percent') return (cRev * (client.commission_rate || 0)) / 100
    return (client.monthly_fee || 0) + (cRev * (client.commission_rate || 0)) / 100
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setAdding(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const session = await supabase.auth.getSession()
const token = session.data.session?.access_token
const res = await fetch('/api/create-user', {
  method: 'POST', headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
        body: JSON.stringify({
          email, password, full_name: name, company_name: name,
          phone, sector, role: 'customer',
          advertiser_id: user.id, created_by: user.id,
          plan: 'trial', monthly_fee: 0, per_branch_fee: 0,
          commission_model: commModel,
          commission_monthly_fee: parseFloat(monthlyFee) || 0,
          commission_rate: parseFloat(commRate) || 0,
        })
      })
      const result = await res.json()
      if (result.error) { alert(result.error); setAdding(false); return }
      setAddSuccess(name)
      setName(''); setEmail(''); setPassword(''); setPhone(''); setSector('')
      setCommModel('fixed'); setMonthlyFee(''); setCommRate('')
      setShowAdd(false)
      await reload()
    } catch (err: any) { alert(err.message) }
    setAdding(false)
  }

  const filtered = customers.filter(c =>
  c.name?.toLowerCase().includes(search.toLowerCase()) ||
  c.owner?.email?.toLowerCase().includes(search.toLowerCase()) ||
  String(c.customer_number).includes(search)

  )

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Müşteri Portföyüm</h2>
          <p className="text-xs text-gray-400 mt-0.5">{customers.length} müşteri · {leads.length} toplam lead</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-xl p-1">
            {(['card', 'table'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                {v === 'card' ? '⊞ Kart' : '≡ Liste'}
              </button>
            ))}
          </div>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm shadow-amber-200">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" /></svg>
            Müşteri Ekle
          </button>
        </div>
      </div>

      {addSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1.5 7l3.5 3.5 7.5-7" stroke="#059669" strokeWidth="1.75" strokeLinecap="round" /></svg>
          <p className="text-xs font-medium text-emerald-800">{addSuccess} eklendi!</p>
          <button onClick={() => setAddSuccess('')} className="ml-auto text-emerald-400">×</button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5" /><path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Müşteri ara..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">◈</div>
          <p className="text-gray-500 text-sm font-medium">Henüz müşteri yok</p>
          <button onClick={() => setShowAdd(true)} className="mt-3 text-xs text-amber-600 font-medium hover:underline">İlk müşteriyi ekle →</button>
        </div>
      ) : view === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => {
            const cLeads = leads.filter(l => l.customer_id === c.id)
            const cSales = cLeads.filter(l => l.status === 'procedure_done')
            const cRevenue = cSales.reduce((s, l) => s + (l.procedure_amount || 0), 0)
            const cConv = cLeads.length > 0 ? ((cSales.length / cLeads.length) * 100) : 0
            const metaConn = metaConnections.find(m => m.owner_id === c.owner_id)
            const client = advertiserClients.find(ac => ac.customer_id === c.id)
            const earned = getHakedis(c)
            console.log('Customer ID:', c.id, 'Number:', c.customer_number)
            return (
              <Link key={c.id} href={`/advertiser/customers/${c.id}`}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-amber-200 transition-all group">
                <div className="px-5 py-4 flex items-center gap-3 border-b border-gray-50">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-50 flex items-center justify-center font-bold text-amber-700 text-lg flex-shrink-0">{c.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                      {metaConn?.is_active && <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">Meta</span>}
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${c.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {c.status === 'active' ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{c.owner?.email}</p>
                    <p className="text-xs text-gray-300 font-mono">#{String(c.customer_number).padStart(4, '0')}</p>
                  </div>
                  <svg className="text-gray-300 group-hover:text-amber-400 transition-colors flex-shrink-0" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <div className="px-5 py-3 grid grid-cols-4 gap-2 border-b border-gray-50">
                  {[
                    { label: 'Potansiyel Müşteri', value: cLeads.length, color: 'text-indigo-600' },
                    { label: 'Satış', value: cSales.length, color: 'text-emerald-600' },
                    { label: 'Dönüşüm', value: `%${cConv.toFixed(0)}`, color: 'text-violet-600' },
                    { label: 'Ciro', value: `₺${(cRevenue / 1000).toFixed(1)}K`, color: 'text-amber-600' },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-gray-400">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="px-5 py-3 flex items-center justify-between">
                  <div className="text-xs text-gray-400">
                    {!client?.commission_model ? 'Komisyon tanımsız' :
                      client.commission_model === 'fixed' ? `₺${client.monthly_fee}/ay sabit` :
                        client.commission_model === 'percent' ? `%${client.commission_rate} satış` :
                          `₺${client.monthly_fee} + %${client.commission_rate}`}
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-600">₺{earned.toLocaleString()}</span>
                    <span className="text-xs text-gray-400 ml-1">hakediş</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <div className="grid grid-cols-8 gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <div className="col-span-2">Müşteri</div>
              <div className="text-center">Potansiyel Müşteri</div>
              <div className="text-center">Satış</div>
              <div className="text-center">Dönüşüm</div>
              <div className="text-center">Ciro</div>
              <div className="text-center">Hakediş</div>
              <div className="text-center">Durum</div>
            </div>
          </div>
          {filtered.map((c, i) => {
            const cLeads = leads.filter(l => l.customer_id === c.id)
            const cSales = cLeads.filter(l => l.status === 'procedure_done')
            const cRevenue = cSales.reduce((s, l) => s + (l.procedure_amount || 0), 0)
            const cConv = cLeads.length > 0 ? ((cSales.length / cLeads.length) * 100).toFixed(1) : '0'
            const earned = getHakedis(c)
            return (
              <Link key={c.id} href={`/advertiser/customers/${c.id}`}
                className={`px-5 py-3.5 grid grid-cols-8 gap-2 items-center hover:bg-amber-50/20 transition-colors ${i < filtered.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <div className="col-span-2 flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center font-bold text-amber-600 text-xs flex-shrink-0">{c.name.charAt(0)}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                    <p className="text-xs text-gray-400 truncate">{c.owner?.email}</p>
                  </div>
                </div>
                <div className="text-center"><p className="text-sm font-semibold text-indigo-600">{cLeads.length}</p></div>
                <div className="text-center"><p className="text-sm font-semibold text-emerald-600">{cSales.length}</p></div>
                <div className="text-center"><p className="text-sm font-semibold text-violet-600">%{cConv}</p></div>
                <div className="text-center"><p className="text-sm font-semibold text-gray-700">₺{(cRevenue / 1000).toFixed(1)}K</p></div>
                <div className="text-center"><p className="text-sm font-bold text-emerald-600">₺{earned.toLocaleString()}</p></div>
                <div className="text-center">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {c.status === 'active' ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Müşteri Ekle Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Yeni Müşteri Ekle" size="xl">
        <form onSubmit={handleAdd} className="p-6 space-y-5">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Hesap Bilgileri</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><Input label="Müşteri / Firma Adı *" value={name} onChange={(e: any) => setName(e.target.value)} required placeholder="Firma Adı" /></div>
              <Input label="E-posta *" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} required placeholder="musteri@email.com" />
              <Input label="Şifre *" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} required placeholder="min. 6 karakter" />
              <Input label="Telefon" value={phone} onChange={(e: any) => setPhone(e.target.value)} placeholder="05XX XXX XXXX" />
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Sektör</label>
                <div className="relative">
                  <select value={sector} onChange={e => setSector(e.target.value)}
                    className="w-full appearance-none px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 pr-9">
                    <option value="">Seçiniz</option>
                    {['Estetik Klinik', 'Diş Kliniği', 'Saç Ekim', 'Güzellik Merkezi', 'Medikal Estetik', 'Emlak', 'Eğitim', 'Diğer'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Komisyon Modeli</p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { key: 'fixed', label: 'Sabit Aylık', desc: 'Sabit tutar', icon: '₺' },
                { key: 'percent', label: 'Satış Yüzdesi', desc: 'Satışın %X\'i', icon: '%' },
                { key: 'both', label: 'Sabit + Yüzde', desc: 'İkisi birden', icon: '⊕' },
              ].map(m => (
                <button key={m.key} type="button" onClick={() => setCommModel(m.key as any)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${commModel === m.key ? 'border-amber-500 bg-amber-50' : 'border-gray-200 bg-white hover:border-amber-300'}`}>
                  <span className={`text-lg font-bold block mb-1 ${commModel === m.key ? 'text-amber-600' : 'text-gray-400'}`}>{m.icon}</span>
                  <p className={`text-sm font-semibold ${commModel === m.key ? 'text-amber-700' : 'text-gray-700'}`}>{m.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{m.desc}</p>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {(commModel === 'fixed' || commModel === 'both') && (
                <Input label="Aylık Sabit (₺)" type="number" value={monthlyFee} onChange={(e: any) => setMonthlyFee(e.target.value)} placeholder="0" />
              )}
              {(commModel === 'percent' || commModel === 'both') && (
                <Input label="Komisyon Oranı (%)" type="number" value={commRate} onChange={(e: any) => setCommRate(e.target.value)} placeholder="0" />
              )}
            </div>
            {(monthlyFee || commRate) && (
              <div className="mt-3 bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center justify-between">
                <span className="text-xs text-emerald-700">Örnek (10 satış × ₺5.000):</span>
                <span className="text-sm font-bold text-emerald-700">
                  ₺{(
                    (commModel === 'fixed' ? parseFloat(monthlyFee) || 0 : 0) +
                    (commModel === 'percent' ? (50000 * (parseFloat(commRate) || 0)) / 100 : 0) +
                    (commModel === 'both' ? (parseFloat(monthlyFee) || 0) + (50000 * (parseFloat(commRate) || 0)) / 100 : 0)
                  ).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowAdd(false)}
              className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 py-2.5 rounded-xl text-sm font-medium transition-colors">
              İptal
            </button>
            <button type="submit" disabled={adding}
              className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
              {adding ? 'Oluşturuluyor...' : 'Müşteri Oluştur'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}