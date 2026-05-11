'use client'

import { useEffect, useState } from 'react'
import { logClientAuditEvent } from '@/lib/audit/client'
import { supabase } from '@/lib/supabase/client'
import { fetchTenantContext, logTenantWriteUsage } from '@/lib/tenant/client'

type MetaAccount = {
  id: string
  name?: string
  account_id?: string
}

type MetaPage = {
  id: string
  name?: string
}

type MetaConnection = {
  owner_id: string
  is_active?: boolean
  connected_at?: string
  page_id?: string
  ad_account_id?: string
  selected_ad_account_id?: string
  selected_ad_account_name?: string
  ad_accounts?: MetaAccount[]
}

export default function MetaConnect({ ownerId, autoSelect = false }: { ownerId: string; autoSelect?: boolean }) {
  const [connection, setConnection] = useState<MetaConnection | null>(null)
  const [pages, setPages] = useState<MetaPage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAccount, setSelectedAccount] = useState('')
  const [selectedPage, setSelectedPage] = useState('')
  const [saving, setSaving] = useState(false)

  async function loadPages() {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const res = await fetch(`/api/meta/pages?owner_id=${encodeURIComponent(ownerId)}`, {
      headers: {
        Authorization: `Bearer ${session?.access_token ?? ''}`,
      },
    })

    const json = (await res.json()) as {
      data?: {
        pages?: MetaPage[]
      }
      error?: string
    }

    if (!res.ok) {
      console.warn('[MetaConnect] Page fetch failed', {
        source: 'meta_connect',
        owner_id: ownerId,
        message: json.error || 'unknown_error',
      })
      setPages([])
      return
    }

    setPages(Array.isArray(json.data?.pages) ? json.data.pages : [])
  }

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
    setSelectedAccount(resolvedConnection?.selected_ad_account_id || resolvedConnection?.ad_account_id || '')
    setSelectedPage(resolvedConnection?.page_id || '')

    if (resolvedConnection?.ad_accounts && resolvedConnection.ad_accounts.length > 0 && autoSelect && !resolvedConnection.selected_ad_account_id) {
      const firstAccount = resolvedConnection.ad_accounts[0]
      logTenantWriteUsage(tenant, 'meta_connect', 'meta_connection')
      await supabase
        .from('meta_connections')
        .update({
          selected_ad_account_id: firstAccount.id,
          selected_ad_account_name: firstAccount.name,
          ad_account_id: firstAccount.id,
        })
        .eq('owner_id', tenant.tenantId)

      setSelectedAccount(firstAccount.id)
    }

    if (resolvedConnection?.is_active) {
      await loadPages()
    } else {
      setPages([])
    }

    setLoading(false)
  }

  useEffect(() => {
    if (!ownerId) {
      return
    }

    void loadConnection()
  }, [autoSelect, ownerId])

  async function handleConnect() {
    const tenant = await fetchTenantContext(ownerId)
    const currentPath = window.location.pathname
    logTenantWriteUsage(tenant, 'meta_connect', 'meta_connection')
    const stateParam = `${tenant.tenantId}|${currentPath}`
    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_META_APP_ID!,
      redirect_uri: process.env.NEXT_PUBLIC_META_REDIRECT_URI!,
      scope: 'ads_read,leads_retrieval,pages_read_engagement,pages_show_list,business_management',
      response_type: 'code',
      state: stateParam,
    })
    window.location.href = `https://www.facebook.com/v18.0/dialog/oauth?${params}`
  }

  async function handleDisconnect() {
    if (!confirm('Meta bağlantısını kesmek istediğinize emin misiniz?')) return
    const tenant = await fetchTenantContext(ownerId)
    logTenantWriteUsage(tenant, 'meta_connect', 'meta_connection')
    const { error } = await supabase
      .from('meta_connections')
      .update({ is_active: false })
      .eq('owner_id', tenant.tenantId)

    if (!error) {
      await logClientAuditEvent({
        action: 'integration_disconnected',
        entityType: 'integration',
        entityId: tenant.tenantId,
        tenantId: tenant.tenantId,
        metadata: {
          provider: 'meta',
          source: 'meta_connect',
        },
      })
    }

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
        selected_ad_account_id: selectedAccount || null,
        selected_ad_account_name: account?.name || null,
        ad_account_id: selectedAccount || null,
        page_id: selectedPage || null,
      })
      .eq('owner_id', tenant.tenantId)
    await loadConnection()
    setSaving(false)
    alert('Meta bağlantı ayarları kaydedildi!')
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
            <p className="text-xs text-gray-500">Facebook ve Instagram reklam hesabınızı bağlayın</p>
          </div>
          {connection?.is_active && (
            <span className="ml-auto bg-green-100 text-green-700 text-xs font-medium px-3 py-1.5 rounded-full">
              Bağlı
            </span>
          )}
        </div>

        {!connection?.is_active ? (
          <div className="text-center py-6">
            <p className="text-gray-500 text-sm mb-6">
              Meta reklam hesabınızı bağlayarak lead formlarından gelen verileri otomatik çekebilirsiniz.
            </p>
            <button
              onClick={() => void handleConnect()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 mx-auto"
            >
              <span className="text-lg">f</span>
              Meta ile Bağlan
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-green-700 text-sm font-medium">Meta hesabı bağlı</p>
              <p className="text-green-600 text-xs mt-1">
                Bağlantı tarihi: {new Date(connection.connected_at || '').toLocaleDateString('tr-TR')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  label: 'Bağlantı',
                  value: connection?.is_active ? 'Aktif' : 'Eksik',
                  tone: connection?.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100',
                },
                {
                  label: 'Ad Account',
                  value: selectedAccount ? 'Seçili' : 'Eksik',
                  tone: selectedAccount ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100',
                },
                {
                  label: 'Webhook Sayfası',
                  value: selectedPage ? 'Seçili' : 'Eksik',
                  tone: selectedPage ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100',
                },
              ].map((item) => (
                <div key={item.label} className={`rounded-xl border p-3 ${item.tone}`}>
                  <p className="text-[11px] uppercase tracking-wide opacity-70">{item.label}</p>
                  <p className="text-sm font-semibold mt-1">{item.value}</p>
                </div>
              ))}
            </div>

            {connection.ad_accounts && connection.ad_accounts.length > 0 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Reklam Hesabı Seçin ({connection.ad_accounts.length} hesap bulundu)
                  </label>
                  <select
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Hesap seçin...</option>
                    {connection.ad_accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({account.account_id})
                      </option>
                    ))}
                  </select>
                  {connection.selected_ad_account_name && (
                    <p className="text-xs text-gray-500 mt-2">
                      Aktif hesap: <span className="font-medium text-blue-600">{connection.selected_ad_account_name}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Webhook Sayfası Seçin {pages.length > 0 ? `(${pages.length} sayfa bulundu)` : ''}
                  </label>
                  <select
                    value={selectedPage}
                    onChange={(e) => setSelectedPage(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sayfa seçin...</option>
                    {pages.map((page) => (
                      <option key={page.id} value={page.id}>
                        {page.name || page.id}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    Meta webhook eşleşmesi için bir sayfa seçili olmalı.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => void handleSaveAccount()}
                    disabled={saving || !selectedAccount}
                    className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium disabled:bg-blue-300"
                  >
                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-gray-100">
              <button onClick={() => void handleDisconnect()} className="text-red-500 hover:text-red-700 text-xs font-medium">
                Bağlantıyı Kes
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <p className="text-blue-700 text-xs font-medium mb-1">Nasıl çalışır?</p>
        <p className="text-blue-600 text-xs">
          Meta hesabınızı bağladıktan sonra reklam hesabını ve webhook sayfasını seçin. Lead formlarından gelen veriler otomatik olarak sisteme aktarılır.
        </p>
      </div>
    </div>
  )
}
