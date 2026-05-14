'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isLocked, setIsLocked] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setIsLocked(false)

    try {
      const lockKey = `lockout_${email.trim().toLowerCase()}`
      const lockData = localStorage.getItem(lockKey)
      if (lockData) {
        const { until } = JSON.parse(lockData)
        if (Date.now() < until) {
          const remaining = Math.ceil((until - Date.now()) / 60000)
          setError(`Çok fazla hatalı giriş. ${remaining} dakika sonra tekrar deneyin.`)
          setIsLocked(true)
          setLoading(false)
          return
        } else {
          localStorage.removeItem(lockKey)
        }
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (signInError) {
        const attemptsKey = `attempts_${email.trim().toLowerCase()}`
        const attempts = parseInt(localStorage.getItem(attemptsKey) || '0') + 1
        if (attempts >= 5) {
          const until = Date.now() + 30 * 60 * 1000
          localStorage.setItem(lockKey, JSON.stringify({ until }))
          localStorage.removeItem(attemptsKey)
          setError('5 hatalı giriş. Hesabınız 30 dakika kilitlendi.')
          setIsLocked(true)
        } else {
          localStorage.setItem(attemptsKey, attempts.toString())
          setError(`E-posta veya şifre hatalı. ${5 - attempts} deneme hakkınız kaldı.`)
        }
        return
      }

      localStorage.removeItem(`attempts_${email.trim().toLowerCase()}`)
      localStorage.removeItem(`lockout_${email.trim().toLowerCase()}`)

      const user = data.user || data.session?.user
      if (!user) { setError('Oturum başlatılamadı. Sayfayı yenileyip tekrar deneyin.'); return }

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      const role = (profile?.role || user.user_metadata?.role) as string | undefined
      if (!role) { setError('Hesap rolü bulunamadı.'); return }

      let path = '/customer'
      if (role === 'super_admin') path = '/super-admin'
      else if (role === 'customer') path = '/customer'
      else if (role === 'agent' || role === 'team') path = '/agent'
      else if (role === 'manager') path = '/manager'
      else if (role === 'advertiser') path = '/advertiser'
      else { setError('Bu hesap için panel tanımı bulunamadı.'); return }

      const deadline = Date.now() + 3000
      let sessionReady = false
      while (Date.now() < deadline) {
        const { data: s } = await supabase.auth.getSession()
        if (s.session?.access_token) { sessionReady = true; break }
        await new Promise((r) => setTimeout(r, 50))
      }
      if (!sessionReady) { setError('Oturum kaydedilemedi. Çerezleri temizleyip tekrar deneyin.'); return }
    await supabase.from('session_logs').insert({
      user_id: user.id,
      event: 'login',
      user_agent: navigator.userAgent,
    })
      window.location.assign(path)
    } catch {
      setError('Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="DataPilot" className="h-12 w-auto mx-auto mb-4" />
          <h1 className="text-white text-2xl font-bold">Hoş Geldiniz</h1>
          <p className="text-slate-400 text-sm mt-1">Hesabınıza giriş yapın</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">E-posta</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="email@example.com" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Şifre</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••" />
            </div>

            {error && (
              <div className={`border rounded-xl px-3 py-2.5 ${isLocked ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200'}`}>
                <p className={`text-xs font-medium ${isLocked ? 'text-orange-700' : 'text-red-600'}`}>{error}</p>
                {isLocked && (
                  <div className="flex gap-2 mt-3">
                    <a href={`https://wa.me/905453467778?text=Merhaba%2C%20DataPilot%20hesabım%20kilitlendi.%20E-posta%3A%20${encodeURIComponent(email)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium py-2 rounded-lg transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      WhatsApp
                    </a>
                    <a href={`mailto:destek@datapilottr.online?subject=Hesap%20Kilidi%20A%C3%A7ma&body=Merhaba%2C%20hesabım%20kilitlendi.%20E-posta%3A%20${encodeURIComponent(email)}`}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium py-2 rounded-lg transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      E-posta
                    </a>
                  </div>
                )}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl font-medium text-sm transition-colors">
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap →'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Hesabınız yok mu?{' '}
              <Link href="/register" className="text-blue-600 hover:underline font-semibold">
                Ücretsiz Başlayın
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          © 2024 DataPilot. Tüm hakları saklıdır.
        </p>
      </div>
    </div>
  )
}