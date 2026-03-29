'use client'

import { useParams } from 'next/navigation'
import { useAdvertiser } from '../../../context'
import MetaConnect from '@/components/MetaConnect'

export default function CustomerMetaPage() {
  const { customerId } = useParams<{ customerId: string }>()
  const { customers } = useAdvertiser()
  const customer = customers.find(c => c.id === customerId)

  if (!customer) return (
    <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
      <p className="text-gray-400 text-sm">Müşteri bulunamadı.</p>
    </div>
  )

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h2 className="text-base font-semibold text-gray-900">{customer.name} · Meta Bağlantı</h2>
        <p className="text-xs text-gray-400 mt-0.5">Bu müşteri için Meta reklam hesabını bağlayın</p>
      </div>

      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white relative overflow-hidden">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full" />
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-bold flex-shrink-0">f</div>
          <div>
            <p className="font-semibold">Meta Reklam Entegrasyonu</p>
            <p className="text-blue-200 text-xs mt-0.5">{customer.name} için ayrı Meta hesabı bağlanacak</p>
          </div>
        </div>
      </div>

      <MetaConnect ownerId={customer.owner_id} autoSelect={true} />
    </div>
  )
}