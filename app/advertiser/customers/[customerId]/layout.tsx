import { requireAdvertiserWorkspaceAccess } from '@/lib/server/auth'

/**
 * Server-side workspace guard for all routes under /advertiser/customers/[customerId]/...
 * Middleware still enforces edge protection; this adds defense in depth for RSC / server actions.
 */
export default async function AdvertiserCustomerWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ customerId: string }>
}) {
  const { customerId } = await params
  await requireAdvertiserWorkspaceAccess(customerId)
  return <>{children}</>
}
