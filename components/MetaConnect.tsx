'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function MetaConnect({ ownerId, autoSelect = false }: { ownerId: string, autoSelect?: boolean }) {
  const [connection, setConnection] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedAccount, setSelectedAccount] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (ownerId) loadConnection()
  }, [ownerId])

 const loadConnection = async () => {
    const { data } = await supabase
      .from('meta_connections')
      .select('*')
      .eq('owner_id', ownerId)
      .maybeSingle()
    setConnection(data)
    if (data?.selected_ad_account_id) {
      setSelectedAccount(data.selected_ad_account_id)
    } else if (data?.ad_accounts?.length > 0 && autoSelect) {
      // Otomatik ilk hesabı seç
      const firstAccount = data.ad_accounts[0]
      setSelectedAccount(firstAccount.id)
      await supabase.from('meta_connections').update({
        selected_ad_account_id: firstAccount.id,
        selected_ad_account_name: firstAccount.name,
      }).eq('owner_id', ownerId)
    }
    setLoading(false)
  }

 const handleConnect = () => {
  const currentPath = window.location.pathname
  const stateData = JSON.stringify({ ownerId, returnPath: currentPath })
  const encoded = btoa(unescape(encodeURIComponent(stateData)))
  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_META_APP_ID!,
    redirect_uri: process.env.NEXT_PUBLIC_META_REDIRECT_URI!,
    scope: 'ads_read,leads_retrieval,pages_read_engagement',
    response_type: 'code',
    state: encoded,
  })
  window.location.href = `https://www.facebook.com/v18.0/dialog/oauth?${params}`
}

  const handleDisconnect = async () => {
    if (!confirm('Meta bağlantısını kesmek istediğinize emin misiniz?')) return
    await supabase.from('meta_connections').update({ is_active: false }).eq('owner_id', ownerId)
    loadConnection()
  }

  const handleSaveAccount = async () => {
    setSaving(true)
    const account = connection?.ad_accounts?.find((a: any) => a.id === selectedAccount)
    await supabase.from('meta_connections').update({
      selected_ad_account_id: selectedAccount,
      selected_ad_account_name: account?.name,
    }).eq('owner_id', ownerId)
    loadConnection()
    setSaving(false)
    alert('Reklam hesabı kaydedildi!')
  }

  if (loading) return <div className="p-8 text-center text-gray-400 text-sm">Yükleniyor...</div>

  return (
    <div className="max-w-2xl space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">f</span>
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Meta Reklam Bağlantısı</h3>
            <p className="text-xs text-gray-500">Facebook & Instagram reklam hesabınızı bağlayın</p>
          </div>
          {connection?.is_active && (
            <span className="ml-auto bg-green-100 text-green-700 text-xs font-medium px-3 py-1.5 rounded-full">
              ✅ Bağlı
            </span>
          )}
        </div>

        {!connection?.is_active ? (
          <div className="text-center py-6">
            <p className="text-gray-500 text-sm mb-6">
              Meta reklam hesabınızı bağlayarak lead formlarından gelen verileri otomatik çekebilirsiniz.
            </p>
            <button onClick={handleConnect}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 mx-auto">
              <span className="text-lg">f</span>
              Meta ile Bağlan
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-green-700 text-sm font-medium">✅ Meta hesabınız bağlı</p>
              <p className="text-green-600 text-xs mt-1">
                Bağlantı tarihi: {new Date(connection.connected_at).toLocaleDateString('tr-TR')}
              </p>
            </div>

            {connection.ad_accounts && connection.ad_accounts.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Reklam Hesabı Seçin ({connection.ad_accounts.length} hesap bulundu)
                </label>
                <div className="flex gap-2">
                  <select value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)}
                    className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Hesap seçin...</option>
                    {connection.ad_accounts.map((account: any) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({account.account_id})
                      </option>
                    ))}
                  </select>
                  <button onClick={handleSaveAccount} disabled={saving || !selectedAccount}
                    className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium disabled:bg-blue-300">
                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
                {connection.selected_ad_account_name && (
                  <p className="text-xs text-gray-500 mt-2">
                    Aktif hesap: <span className="font-medium text-blue-600">{connection.selected_ad_account_name}</span>
                  </p>
                )}
              </div>
            )}

            <div className="pt-2 border-t border-gray-100">
              <button onClick={handleDisconnect}
                className="text-red-500 hover:text-red-700 text-xs font-medium">
                Bağlantıyı Kes
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <p className="text-blue-700 text-xs font-medium mb-1">ℹ️ Nasıl çalışır?</p>
        <p className="text-blue-600 text-xs">
          Meta hesabınızı bağladıktan sonra reklam hesabınızı seçin.
          Lead formlarından gelen veriler otomatik olarak sisteme aktarılır.
        </p>
      </div>
    </div>
  )
}