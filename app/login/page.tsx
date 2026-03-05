'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('E-posta veya şifre hatalı!')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profile?.role === 'super_admin') {
      router.push('/super-admin')
    } else if (profile?.role === 'customer') {
      router.push('/customer')
    } else if (profile?.role === 'team') {
      const { data: tm } = await supabase
        .from('team_members')
        .select('role')
        .eq('user_id', data.user.id)
        .single()
      if (tm?.role === 'manager') {
        router.push('/manager')
      } else {
        router.push('/agent')
      }
    } else {
      setError('Hesabınız tanımlanmamış!')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* SOL PANEL */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex-col justify-between p-12 relative overflow-hidden">
        
        {/* Arka plan dekorasyon */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-600 rounded-full opacity-5 blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-600 rounded-full opacity-5 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-400 rounded-full opacity-5 blur-3xl"></div>
        </div>

        {/* Logo */}
      <img src="/logo2.png" alt="DataPilot" className="h-4 w-auto" />
        {/* Orta içerik */}
        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            Leadlerinizi<br />
            <span className="text-blue-400">akıllıca</span> yönetin
          </h2>
          <p className="text-slate-400 text-lg mb-10">
            Meta reklamlarından gelen leadleri otomatik toplayın, ekibinize dağıtın, satışa dönüştürün.
          </p>

          {/* Özellikler */}
          <div className="space-y-4">
            {[
              { icon: '📣', title: 'Meta Entegrasyonu', desc: 'Facebook & Instagram leadleri otomatik çekin' },
              { icon: '📊', title: 'AI Analitik', desc: 'Yapay zeka destekli satış raporları' },
              { icon: '👥', title: 'Ekip Yönetimi', desc: 'Şube ve satışçılarınızı tek panelden yönetin' },
              { icon: '📂', title: 'Veri Merkezi', desc: 'Excel yükleyin, leadlere dönüştürün' },
            ].map(f => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0 text-lg border border-slate-700">
                  {f.icon}
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{f.title}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alt istatistikler */}
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { value: '10K+', label: 'Lead Yönetildi' },
            { value: '%34', label: 'Dönüşüm Artışı' },
            { value: '500+', label: 'Başarılı Firma' },
          ].map(s => (
            <div key={s.label} className="bg-slate-800 bg-opacity-50 rounded-xl p-3 border border-slate-700">
              <p className="text-blue-400 font-bold text-lg">{s.value}</p>
              <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SAĞ PANEL - Login Formu */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">

          {/* Mobil logo */}
          <img src="/logo.png" alt="DataPilot" className="h-10 w-auto" />
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Hoş geldiniz 👋</h2>
              <p className="text-gray-500 text-sm mt-1">Hesabınıza giriş yapın</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">E-posta</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-sm transition-all"
                  placeholder="ornek@email.com"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700">Şifre</label>
                  <span className="text-xs text-blue-600 cursor-pointer hover:underline">Şifremi unuttum</span>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-sm transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                  <span>⚠️</span> {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-200 mt-2 text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Giriş yapılıyor...
                  </span>
                ) : 'Giriş Yap →'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                <span>🔒 SSL Güvenli</span>
                <span>•</span>
                <span>🛡️ Verileriniz güvende</span>
              </div>
            </div>
          </div>

          <p className="text-center text-gray-400 text-xs mt-6">
            DataPilot © 2026 — Tüm hakları saklıdır.
          </p>
        </div>
      </div>

    </div>
  )
}