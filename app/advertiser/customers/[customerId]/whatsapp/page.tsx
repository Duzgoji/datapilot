'use client'

import { useParams } from 'next/navigation'
import { useAdvertiser } from '../../../context'
import WhatsAppConnect from '@/components/WhatsAppConnect'

export default function CustomerWhatsAppPage() {
  const { customerId } = useParams<{ customerId: string }>()
  const { customers } = useAdvertiser()
  const customer = customers.find(c => c.id === customerId)

  if (!customer) return (
    <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
      <p className="text-gray-400 text-sm">Müşteri bulunamadı.</p>
    </div>
  )

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h2 className="text-base font-semibold text-gray-900">{customer.name} · WhatsApp Bağlantısı</h2>
        <p className="text-xs text-gray-400 mt-0.5">WhatsApp Business hesabını bağlayın</p>
      </div>
      <WhatsAppConnect ownerId={customer.owner_id} />
    </div>
  )
}