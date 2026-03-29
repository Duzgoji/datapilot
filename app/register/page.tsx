'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [sector, setSector] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role: 'customer' } }
    })

    if (signUpError) { setError(signUpError.message); setSaving(false); return }

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email,
        full_name: fullName,
        company_name: companyName,
        sector,
        role: 'customer',
        is_active: true,
      })

      await supabase.from('subscriptions').insert({
        owner_id: data.user.id,
        plan: 'trial',
        status: 'active',
        monthly_fee: 0,
        per_branch_fee: 0,
      })

      router.push('/customer')
    }

    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <img src="/logo.png" alt="DataPilot" className="h-10 w-auto mx-auto mb-4" />
          <h2 className="font-bold text-gray-900 text-xl">Hesap Oluşturun</h2>
          <p className="text-gray-500 text-sm mt-1">14 gün ücretsiz deneyin</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ad Soyad *</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} required
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ad Soyad" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Firma Adı</label>
            <input value={companyName} onChange={e => setCompanyName(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Firma adı" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Sektör</label>
            <select value={sector} onChange={e => setSector(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Seçin...</option>
              <option value="saglik">Sağlık</option>
              <option value="estetik">Estetik & Güzellik</option>
              <option value="turizm">Turizm</option>
              <option value="restoran">Restoran & Gıda</option>
              <option value="egitim">Eğitim</option>
              <option value="gayrimenkul">Gayrimenkul</option>
              <option value="diger">Diğer</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">E-posta *</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="email@example.com" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Şifre *</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="En az 6 karakter" />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
              <p className="text-red-600 text-xs">{error}</p>
            </div>
          )}

          <button type="submit" disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl font-medium text-sm transition-colors">
            {saving ? 'Hesap Oluşturuluyor...' : 'Ücretsiz Başla →'}
          </button>

          <p className="text-center text-xs text-gray-500">
            Zaten hesabınız var mı?{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">Giriş Yapın</Link>
          </p>
        </form>
      </div>
    </div>
  )
}