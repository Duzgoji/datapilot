'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { fetchTenantContext, logTenantWriteUsage } from '@/lib/tenant/client'

type MetaAccount = {
  id: string
  name?: string
  account_id?: string
}

type MetaConnection = {
  owner_id: string
  is_active?: boolean
  connected_at?: string
  selected_ad_account_id?: string
  selected_ad_account_name?: string
  ad_accounts?: MetaAccount[]
}

export default function MetaConnect({ ownerId, autoSelect = false }: { ownerId: string; autoSelect?: boolean }) {
  const [connection, setConnection] = useState<MetaConnection | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedAccount, setSelectedAccount] = useState('')
  const [saving, setSaving] = useState(false)

  async function loadConnection() {
    const tenant = await fetchTenantContext(ownerId)
    const { data } = await supabase.from('meta_connections').select('*').in('owner_id', tenant.readOwnerIds)
    const rows = (data || []) as MetaConnection[]

    const resolvedConnection =
      rows.find((row) => row.owner_id === tenant.tenantId) ||
      rows.find((row) => row.owner_id === tenant.profileId) ||
      rows[0] ||
      null

    setConnection(resolvedConnection)

    if (resolvedConnection?.selected_ad_account_id) {
      setSelectedAccount(resolvedConnection.selected_ad_account_id)
    } else if (resolvedConnection?.ad_accounts && resolvedConnection.ad_accounts.length > 0 && autoSelect) {
      const firstAccount = resolvedConnection.ad_accounts[0]
      setSelectedAccount(firstAccount.id)
      logTenantWriteUsage(tenant, 'meta_connect', 'meta_connection')
      await supabase
        .from('meta_connections')
        .update({
          selected_ad_account_id: firstAccount.id,
          selected_ad_account_name: firstAccount.name,
        })
        .eq('owner_id', tenant.tenantId)
    }

    setLoading(false)
  }

  useEffect(() => {
    if (!ownerId) {
      return
    }

    let isMounted = true

    void (async () => {
      const tenant = await fetchTenantContext(ownerId)
      const { data } = await supabase.from('meta_connections').select('*').in('owner_id', tenant.readOwnerIds)

      if (!isMounted) {
        return
      }

      const rows = (data || []) as MetaConnection[]
      const resolvedConnection =
        rows.find((row) => row.owner_id === tenant.tenantId) ||
        rows.find((row) => row.owner_id === tenant.profileId) ||
        rows[0] ||
        null

      setConnection(resolvedConnection)

      if (resolvedConnection?.selected_ad_account_id) {
        setSelectedAccount(resolvedConnection.selected_ad_account_id)
      } else if (resolvedConnection?.ad_accounts && resolvedConnection.ad_accounts.length > 0 && autoSelect) {
        const firstAccount = resolvedConnection.ad_accounts[0]
        setSelectedAccount(firstAccount.id)
        logTenantWriteUsage(tenant, 'meta_connect', 'meta_connection')
        await supabase
          .from('meta_connections')
          .update({
            selected_ad_account_id: firstAccount.id,
            selected_ad_account_name: firstAccount.name,
          })
          .eq('owner_id', tenant.tenantId)
      }

      if (isMounted) {
        setLoading(false)
      }
    })()

    return () => {
      isMounted = false
    }
  }, [autoSelect, ownerId])

  async function handleConnect() {
    const tenant = await fetchTenantContext(ownerId)
    const currentPath = window.location.pathname
    logTenantWriteUsage(tenant, 'meta_connect', 'meta_connection')
    const stateParam = `${tenant.tenantId}|${currentPath}`
    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_META_APP_ID!,
      redirect_uri: process.env.NEXT_PUBLIC_META_REDIRECT_URI!,
      scope: 'ads_read,leads_retrieval,pages_read_engagement',
      response_type: 'code',
      state: stateParam,
    })
    window.location.href = `https://www.facebook.com/v18.0/dialog/oauth?${params}`
  }

  async function handleDisconnect() {
    if (!confirm('Meta baglantisini kesmek istediginize emin misiniz?')) return
    const tenant = await fetchTenantContext(ownerId)
    logTenantWriteUsage(tenant, 'meta_connect', 'meta_connection')
    await supabase.from('meta_connections').update({ is_active: false }).eq('owner_id', tenant.tenantId)
    await loadConnection()
  }

  async function handleSaveAccount() {
    setSaving(true)
    const tenant = await fetchTenantContext(ownerId)
    const account = connection?.ad_accounts?.find((item) => item.id === selectedAccount)
    logTenantWriteUsage(tenant, 'meta_connect', 'meta_connection')
    await supabase
      .from('meta_connections')
      .update({
        selected_ad_account_id: selectedAccount,
        selected_ad_account_name: account?.name,
      })
      .eq('owner_id', tenant.tenantId)
    await loadConnection()
    setSaving(false)
    alert('Reklam hesabi kaydedildi!')
  }

  if (loading) return <div className="p-8 text-center text-gray-400 text-sm">Yukleniyor...</div>

  return (
    <div className="max-w-2xl space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">f</span>
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Meta Reklam Baglantisi</h3>
            <p className="text-xs text-gray-500">Facebook ve Instagram reklam hesabinizi baglayin</p>
          </div>
          {connection?.is_active && (
            <span className="ml-auto bg-green-100 text-green-700 text-xs font-medium px-3 py-1.5 rounded-full">
              Bagli
            </span>
          )}
        </div>

        {!connection?.is_active ? (
          <div className="text-center py-6">
            <p className="text-gray-500 text-sm mb-6">
              Meta reklam hesabinizi baglayarak lead formlarindan gelen verileri otomatik cekebilirsiniz.
            </p>
            <button
              onClick={() => void handleConnect()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 mx-auto"
            >
              <span className="text-lg">f</span>
              Meta ile Baglan
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-green-700 text-sm font-medium">Meta hesabi bagli</p>
              <p className="text-green-600 text-xs mt-1">
                Baglanti tarihi: {new Date(connection.connected_at || '').toLocaleDateString('tr-TR')}
              </p>
            </div>

            {connection.ad_accounts && connection.ad_accounts.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Reklam Hesabi Secin ({connection.ad_accounts.length} hesap bulundu)
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Hesap secin...</option>
                    {connection.ad_accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({account.account_id})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => void handleSaveAccount()}
                    disabled={saving || !selectedAccount}
                    className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium disabled:bg-blue-300"
                  >
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
              <button onClick={() => void handleDisconnect()} className="text-red-500 hover:text-red-700 text-xs font-medium">
                Baglantiyi Kes
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <p className="text-blue-700 text-xs font-medium mb-1">Nasil calisir?</p>
        <p className="text-blue-600 text-xs">
          Meta hesabinizi bagladiktan sonra reklam hesabinizi secin. Lead formlarindan gelen veriler otomatik olarak sisteme aktarilir.
        </p>
      </div>
    </div>
  )
}
