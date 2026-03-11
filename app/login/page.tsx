'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError('E-posta veya şifre hatalı.')
      setLoading(false)
      return
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      const role = profile?.role
      if (role === 'super_admin') router.push('/super-admin')
      else if (role === 'customer') router.push('/customer')
      else if (role === 'agent') router.push('/agent')
      else if (role === 'manager') router.push('/customer')
      else router.push('/customer')
    }

    setLoading(false)
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
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Şifre</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                <p className="text-red-600 text-xs">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl font-medium text-sm transition-colors"
            >
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