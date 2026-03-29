'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function InvitePage() {
  const router = useRouter()
  const [invitation, setInvitation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [token, setToken] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('token')
    if (t) { setToken(t); loadInvitation(t) }
    else { setLoading(false) }
  }, [])

  const loadInvitation = async (t: string) => {
    const { data } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', t)
      .is('used_at', null)
      .single()

    if (!data || new Date(data.expires_at) < new Date()) {
      setError('Bu davet linki geçersiz veya süresi dolmuş.')
    } else {
      setInvitation(data)
    }
    setLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: invitation.email,
      password,
      options: { data: { full_name: fullName, role: invitation.role } }
    })

    if (signUpError) { setError(signUpError.message); setSaving(false); return }

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: invitation.email,
        full_name: fullName,
        company_name: companyName,
        role: invitation.role,
        is_active: true,
      })

      await supabase.from('invitations').update({ used_at: new Date().toISOString() }).eq('token', token)

      if (invitation.role === 'customer') router.push('/customer')
      else if (invitation.role === 'advertiser') router.push('/advertiser')
      else router.push('/login')
    }
    setSaving(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500 text-sm">Yükleniyor...</p>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <span className="text-5xl mb-4 block">❌</span>
        <h2 className="font-bold text-gray-900 mb-2">Geçersiz Davet</h2>
        <p className="text-gray-500 text-sm">{error}</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <img src="/logo.png" alt="DataPilot" className="h-10 w-auto mx-auto mb-4" />
          <h2 className="font-bold text-gray-900 text-xl">Hesabınızı Oluşturun</h2>
          <p className="text-gray-500 text-sm mt-1">{invitation?.email}</p>
          <span className={`inline-block mt-2 text-xs px-3 py-1 rounded-full font-medium ${
            invitation?.role === 'customer' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
          }`}>
            {invitation?.role === 'customer' ? '🏢 Müşteri Hesabı' : '📣 Reklamcı Hesabı'}
          </span>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ad Soyad *</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} required
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ad Soyad" />
          </div>
          {invitation?.role === 'customer' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Firma Adı</label>
              <input value={companyName} onChange={e => setCompanyName(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Firma adı" />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Şifre *</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="En az 6 karakter" />
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button type="submit" disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium text-sm">
            {saving ? 'Hesap Oluşturuluyor...' : 'Hesabı Oluştur →'}
          </button>
        </form>
      </div>
    </div>
  )
}