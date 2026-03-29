import { AdvertiserProvider } from './context'
import { AdvertiserShell } from './shell'

export default function AdvertiserLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdvertiserProvider>
      <AdvertiserShell>{children}</AdvertiserShell>
    </AdvertiserProvider>
  )
}