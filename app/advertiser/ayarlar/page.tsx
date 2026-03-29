'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAdvertiser } from '../context'

const Input = ({ label, ...props }: any) => (
  <div>
    {label && <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>}
    <input {...props} className={`w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 ${props.className || ''}`} />
  </div>
)

export default function AyarlarPage() {
  const { profile, customers, subscription, reload } = useAdvertiser()

  const [fullName, setFullName] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setCompany(profile.company_name || '')
      setPhone(profile.phone || '')
    }
  }, [profile])

  const handleSave = async () => {
    setSaving(true); setMsg(null)
    const { error } = await supabase.from('profiles').update({
      full_name: fullName,
      company_name: company,
      phone,
    }).eq('id', profile.id)
    if (error) setMsg({ type: 'error', text: 'Kaydedilemedi.' })
    else { setMsg({ type: 'success', text: 'Profil güncellendi!' }); reload() }
    setSaving(false)
    setTimeout(() => setMsg(null), 3000)
  }

  const activeCustomers = customers.filter(c => c.status === 'active').length

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Ayarlar</h2>
        <p className="text-xs text-gray-400 mt-0.5">Hesap ve profil bilgilerinizi yönetin</p>
      </div>

      {/* Profil kartı */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl font-bold text-amber-700 flex-shrink-0">
            {(profile?.company_name || profile?.full_name || 'R').charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{profile?.company_name || profile?.full_name}</p>
            <p className="text-xs text-gray-400">{profile?.email}</p>
            <span className="text-xs bg-amber-50 text-amber-600 font-medium px-2 py-0.5 rounded-full mt-1 inline-block border border-amber-200">
              Reklamcı · Partner
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <Input label="Ad Soyad" value={fullName} onChange={(e: any) => setFullName(e.target.value)} placeholder="Ad Soyad" />
          <Input label="Firma / Ajans Adı" value={company} onChange={(e: any) => setCompany(e.target.value)} placeholder="Ajans Adı" />
          <Input label="Telefon" value={phone} onChange={(e: any) => setPhone(e.target.value)} placeholder="05XX XXX XXXX" />
          <div className="bg-gray-50 rounded-xl px-3.5 py-2.5">
            <p className="text-xs text-gray-400">E-posta (değiştirilemez)</p>
            <p className="text-sm text-gray-600 mt-0.5">{profile?.email}</p>
          </div>
        </div>

        {msg && (
          <div className={`mt-4 px-4 py-3 rounded-xl text-sm font-medium ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
            {msg.text}
          </div>
        )}

        <div className="flex justify-end mt-5">
          <button onClick={handleSave} disabled={saving}
            className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>

      {/* Özet istatistikler */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 text-sm mb-4">Hesap Özeti</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Toplam Müşteri', value: customers.length, color: 'text-amber-600' },
            { label: 'Aktif Müşteri', value: activeCustomers, color: 'text-emerald-600' },
            { label: 'Pasif Müşteri', value: customers.length - activeCustomers, color: 'text-gray-500' },
          ].map(item => (
            <div key={item.label} className="bg-gray-50 rounded-xl p-3.5 text-center">
              <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Abonelik */}
      {subscription && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 text-sm">Platform Aboneliği</h3>
            <span className="flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-600 font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              Aktif
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-3.5">
              <p className="text-xs text-gray-400 mb-1">Aylık Sabit</p>
              <p className="text-base font-bold text-gray-900">₺{subscription.monthly_fee || 0}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3.5">
              <p className="text-xs text-gray-400 mb-1">Müşteri Başı</p>
              <p className="text-base font-bold text-gray-900">₺{subscription.per_client_fee || 0}</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3.5 border border-amber-100">
              <p className="text-xs text-gray-400 mb-1">Bu Ay Toplam</p>
              <p className="text-base font-bold text-amber-700">
                ₺{((subscription.monthly_fee || 0) + customers.length * (subscription.per_client_fee || 0)).toLocaleString()}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">Plan değişikliği için platform yöneticisiyle iletişime geçin.</p>
        </div>
      )}
    </div>
  )
}