'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAdvertiser } from '../../../context'

export default function CustomerSettingsPage() {
  const { customerId } = useParams<{ customerId: string }>()
  const router = useRouter()
  const { customers, advertiserClients, reload } = useAdvertiser()
  const customer = customers.find(c => c.id === customerId)
  const client = advertiserClients.find(ac => ac.customer_id === customerId)

  const [commModel, setCommModel] = useState(client?.commission_model || 'fixed')
  const [monthlyFee, setMonthlyFee] = useState(client?.monthly_fee?.toString() || '')
  const [commRate, setCommRate] = useState(client?.commission_rate?.toString() || '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    if (client) {
      setCommModel(client.commission_model || 'fixed')
      setMonthlyFee(client.monthly_fee?.toString() || '')
      setCommRate(client.commission_rate?.toString() || '')
    }
  }, [client])

  const handleSave = async () => {
    if (!client) return
    setSaving(true)
    const { error } = await supabase.from('advertiser_clients').update({
      commission_model: commModel,
      monthly_fee: parseFloat(monthlyFee) || 0,
      commission_rate: parseFloat(commRate) || 0,
    }).eq('id', client.id)
    if (error) setMsg({ type: 'error', text: 'Kaydedilemedi.' })
    else { setMsg({ type: 'success', text: 'Komisyon modeli güncellendi!' }); await reload() }
    setSaving(false)
    setTimeout(() => setMsg(null), 3000)
  }

  const handleToggleStatus = async () => {
    if (!customer) return
    const newStatus = customer.status === 'active' ? 'inactive' : 'active'
    await supabase.from('customers').update({ status: newStatus }).eq('id', customerId)
    await reload()
  }

  if (!customer) return (
    <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
      <p className="text-gray-400 text-sm">Müşteri bulunamadı.</p>
    </div>
  )

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className="text-base font-semibold text-gray-900">{customer.name} · Ayarlar</h2>
        <p className="text-xs text-gray-400 mt-0.5">Müşteri workspace ayarları</p>
      </div>

      {/* Müşteri bilgileri */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-900 text-sm mb-4">Müşteri Bilgileri</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Firma Adı', value: customer.name },
            { label: 'E-posta', value: customer.owner?.email },
            { label: 'Telefon', value: customer.owner?.phone || '-' },
            { label: 'Sektör', value: customer.owner?.sector || '-' },
            { label: 'Kayıt Tarihi', value: new Date(customer.created_at).toLocaleDateString('tr-TR') },
            { label: 'Durum', value: customer.status === 'active' ? 'Aktif' : 'Pasif' },
          ].map(item => (
            <div key={item.label} className="bg-gray-50 rounded-xl p-3.5">
              <p className="text-xs text-gray-400 mb-1">{item.label}</p>
              <p className="text-sm font-medium text-gray-900">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Komisyon modeli düzenleme */}
      {client && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">Komisyon Modelini Güncelle</h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { key: 'fixed', label: 'Sabit Aylık', icon: '₺' },
              { key: 'percent', label: 'Satış Yüzdesi', icon: '%' },
              { key: 'both', label: 'Sabit + Yüzde', icon: '⊕' },
            ].map(m => (
              <button key={m.key} type="button" onClick={() => setCommModel(m.key)}
                className={`p-3.5 rounded-xl border-2 text-left transition-all ${commModel === m.key ? 'border-amber-500 bg-amber-50' : 'border-gray-200 bg-white hover:border-amber-300'}`}>
                <span className={`text-base font-bold block mb-1 ${commModel === m.key ? 'text-amber-600' : 'text-gray-400'}`}>{m.icon}</span>
                <p className={`text-xs font-semibold ${commModel === m.key ? 'text-amber-700' : 'text-gray-600'}`}>{m.label}</p>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {(commModel === 'fixed' || commModel === 'both') && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Aylık Sabit (₺)</label>
                <input type="number" value={monthlyFee} onChange={e => setMonthlyFee(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
            )}
            {(commModel === 'percent' || commModel === 'both') && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Komisyon Oranı (%)</label>
                <input type="number" value={commRate} onChange={e => setCommRate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
            )}
          </div>
          {msg && (
            <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
              {msg.text}
            </div>
          )}
          <button onClick={handleSave} disabled={saving}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
            {saving ? 'Kaydediliyor...' : 'Komisyon Modelini Güncelle'}
          </button>
        </div>
      )}

      {/* Tehlikeli bölge */}
      <div className="bg-white rounded-2xl border border-red-100 p-5">
        <h3 className="font-semibold text-gray-900 text-sm mb-1">Müşteri Durumu</h3>
        <p className="text-xs text-gray-400 mb-4">Müşteriyi pasife alırsanız panele erişimi kısıtlanır.</p>
        <button onClick={handleToggleStatus}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${customer.status === 'active'
            ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200'
            }`}>
          {customer.status === 'active' ? 'Pasife Al' : 'Aktife Al'}
        </button>
      </div>
    </div>
  )
}