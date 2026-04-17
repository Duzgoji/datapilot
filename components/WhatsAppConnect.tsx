'use client'

import { useEffect, useState } from 'react'
import { logClientAuditEvent } from '@/lib/audit/client'
import { supabase } from '@/lib/supabase/client'
import { fetchTenantContext, logTenantWriteUsage } from '@/lib/tenant/client'

type WhatsAppConnection = {
  owner_id: string
  is_active?: boolean
  connected_at?: string
  phone_number_id?: string
}

export default function WhatsAppConnect({ ownerId }: { ownerId: string }) {
  const [connection, setConnection] = useState<WhatsAppConnection | null>(null)
  const [loading, setLoading] = useState(true)
  const [phoneNumberId, setPhoneNumberId] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  async function loadConnection() {
    const tenant = await fetchTenantContext(ownerId)
    const { data } = await supabase.from('whatsapp_connections').select('*').in('owner_id', tenant.readOwnerIds)
    const rows = (data || []) as WhatsAppConnection[]
    const resolvedConnection =
      rows.find((row) => row.owner_id === tenant.tenantId) ||
      rows.find((row) => row.owner_id === tenant.profileId) ||
      rows[0] ||
      null
    setConnection(resolvedConnection)
    setLoading(false)
  }

  useEffect(() => {
    if (!ownerId) {
      return
    }

    let isMounted = true

    void (async () => {
      const tenant = await fetchTenantContext(ownerId)
      const { data } = await supabase.from('whatsapp_connections').select('*').in('owner_id', tenant.readOwnerIds)

      if (!isMounted) {
        return
      }

      const rows = (data || []) as WhatsAppConnection[]
      const resolvedConnection =
        rows.find((row) => row.owner_id === tenant.tenantId) ||
        rows.find((row) => row.owner_id === tenant.profileId) ||
        rows[0] ||
        null

      setConnection(resolvedConnection)
      setLoading(false)
    })()

    return () => {
      isMounted = false
    }
  }, [ownerId])

  async function handleSave() {
    if (!phoneNumberId || !accessToken) return
    setSaving(true)
    const tenant = await fetchTenantContext(ownerId)
    logTenantWriteUsage(tenant, 'whatsapp_connect', 'whatsapp_connection')
    const { error } = await supabase.from('whatsapp_connections').upsert(
      {
        owner_id: tenant.tenantId,
        phone_number_id: phoneNumberId,
        access_token: accessToken,
        is_active: true,
        connected_at: new Date().toISOString(),
      },
      { onConflict: 'owner_id' }
    )

    if (!error) {
      await logClientAuditEvent({
        action: 'integration_connected',
        entityType: 'integration',
        entityId: tenant.tenantId,
        tenantId: tenant.tenantId,
        metadata: {
          provider: 'whatsapp',
          source: 'whatsapp_connect',
        },
      })
      setShowForm(false)
      await loadConnection()
    }
    setSaving(false)
  }

  async function handleDisconnect() {
    if (!confirm('WhatsApp ba?lant?s?n? kesmek istedi?inize emin misiniz?')) return
    const tenant = await fetchTenantContext(ownerId)
    logTenantWriteUsage(tenant, 'whatsapp_connect', 'whatsapp_connection')
    const { error } = await supabase
      .from('whatsapp_connections')
      .update({ is_active: false })
      .eq('owner_id', tenant.tenantId)

    if (!error) {
      await logClientAuditEvent({
        action: 'integration_disconnected',
        entityType: 'integration',
        entityId: tenant.tenantId,
        tenantId: tenant.tenantId,
        metadata: {
          provider: 'whatsapp',
          source: 'whatsapp_connect',
        },
      })
    }

    await loadConnection()
  }

  if (loading) return <div className="p-8 text-center text-gray-400 text-sm">Yukleniyor...</div>

  return (
    <div className="max-w-2xl space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-900">WhatsApp Business Ba?lant?s?</h3>
            <p className="text-xs text-gray-500">WhatsApp mesajlar?n? otomatik lead olarak kaydedin</p>
          </div>
          {connection?.is_active && (
            <span className="ml-auto bg-green-100 text-green-700 text-xs font-medium px-3 py-1.5 rounded-full">
              Bağlı
            </span>
          )}
        </div>

        {!connection?.is_active ? (
          <div className="space-y-4">
            {!showForm ? (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm mb-4">
                  WhatsApp Business hesab?n?z? ba?layarak gelen mesajlar? otomatik lead olarak kaydedebilirsiniz.
                </p>
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-4 text-left">
                  <p className="text-amber-700 text-xs font-semibold mb-2">Gereksinimler</p>
                  <ul className="text-amber-600 text-xs space-y-1">
                    <li>• Meta Business hesab?</li>
                    <li>• WhatsApp Business API eri?imi</li>
                    <li>• Phone Number ID ve Access Token</li>
                  </ul>
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 mx-auto transition-colors"
                >
                  WhatsApp Ba?la
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Phone Number ID</label>
                  <input
                    value={phoneNumberId}
                    onChange={(e) => setPhoneNumberId(e.target.value)}
                    placeholder="Meta'dan al?nan Phone Number ID"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Access Token</label>
                  <input
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    type="password"
                    placeholder="WhatsApp Access Token"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-blue-700 text-xs font-semibold mb-1">Webhook URL</p>
                  <p className="text-blue-600 text-xs font-mono bg-blue-100 px-2 py-1 rounded mt-1 break-all">
                    {typeof window !== 'undefined' ? window.location.origin : ''}/api/whatsapp/webhook
                  </p>
                  <p className="text-blue-500 text-xs mt-1">Bu URL?yi WhatsApp Business API ayarlar?na ekleyin.</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex-1 bg-white border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    ?ptal
                  </button>
                  <button
                    onClick={() => void handleSave()}
                    disabled={saving || !phoneNumberId || !accessToken}
                    className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  >
                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <p className="text-green-700 text-sm font-medium">WhatsApp Business ba?l?</p>
              <p className="text-green-600 text-xs mt-1">
                Ba?lant? tarihi: {new Date(connection.connected_at || '').toLocaleDateString('tr-TR')}
              </p>
              <p className="text-green-600 text-xs mt-1 font-mono">Phone ID: {connection.phone_number_id}</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-blue-700 text-xs font-semibold mb-1">Webhook URL</p>
              <p className="text-blue-600 text-xs font-mono bg-blue-100 px-2 py-1 rounded mt-1 break-all">
                {typeof window !== 'undefined' ? window.location.origin : ''}/api/whatsapp/webhook
              </p>
              <p className="text-blue-500 text-xs mt-1">Bu URL aktif kaldığı sürece gelen mesajlar otomatik işlenir.</p>
            </div>
            <div className="pt-2 border-t border-gray-100">
              <button onClick={() => void handleDisconnect()} className="text-red-500 hover:text-red-700 text-xs font-medium">
                Ba?lant?y? Kes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
