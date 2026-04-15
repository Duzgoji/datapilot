'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface AdvertiserContextType {
  profile: any
  customers: any[]
  subscription: any
  invoices: any[]
  advertiserClients: any[]
  loading: boolean
  reload: () => Promise<void>
}

const AdvertiserContext = createContext<AdvertiserContextType | null>(null)

export function AdvertiserProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [customers, setCustomers] = useState<any[]>([])
  const [subscription, setSubscription] = useState<any>(null)
  const [invoices, setInvoices] = useState<any[]>([])
  const [advertiserClients, setAdvertiserClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: profileData } = await supabase
      .from('profiles').select('*').eq('id', user.id).single()
    if (profileData?.role !== 'advertiser') { router.push('/login'); return }
    setProfile(profileData)

    const { data: customersData } = await supabase
      .from('customers')
      .select('*, owner:profiles!customers_owner_id_fkey(full_name, email, company_name, phone, sector, is_active)')
      .eq('advertiser_id', user.id)
      .order('created_at', { ascending: false })
    setCustomers(customersData || [])

    const { data: clientsData } = await supabase
      .from('advertiser_clients').select('*').eq('advertiser_id', user.id)
    setAdvertiserClients(clientsData || [])

    const { data: subData } = await supabase
      .from('advertiser_subscriptions').select('*').eq('advertiser_id', user.id).single()
    setSubscription(subData || null)

    console.info('[Advertiser Billing] Profile-rooted advertiser invoice read', {
      source: 'advertiser_context',
      reason: 'advertiser_invoice_owner_id',
      advertiser_id: user.id,
    })

    const { data: invoicesData } = await supabase
      .from('invoices').select('*').eq('owner_id', user.id).order('created_at', { ascending: false })
    setInvoices(invoicesData || [])

    setLoading(false)
  }

  useEffect(() => { load() }, [])

  return (
    <AdvertiserContext.Provider value={{ profile, customers, subscription, invoices, advertiserClients, loading, reload: load }}>
      {children}
    </AdvertiserContext.Provider>
  )
}

export function useAdvertiser() {
  const ctx = useContext(AdvertiserContext)
  if (!ctx) throw new Error('useAdvertiser must be used within AdvertiserProvider')
  return ctx
}
