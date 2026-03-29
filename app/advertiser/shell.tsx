'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useAdvertiser } from './context'

// ── Icons ──────────────────────────────────────────────────────────────────
const Icon = {
  dashboard: () => <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1" y="1" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.25"/><rect x="8.5" y="1" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.25"/><rect x="1" y="8.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.25"/><rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.25"/></svg>,
  customers: () => <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.25"/><path d="M2 13c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></svg>,
  hakedis: () => <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2 11l3.5-4 2.5 3 2.5-5 2.5 2.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/><rect x="1" y="1" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.25"/></svg>,
  faturalar: () => <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="2" y="1" width="11" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.25"/><path d="M5 5h5M5 8h5M5 11h3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></svg>,
  ayarlar: () => <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.25"/><path d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M3.05 3.05l1.06 1.06M10.89 10.89l1.06 1.06M3.05 11.95l1.06-1.06M10.89 4.11l1.06-1.06" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></svg>,
  leads: () => <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M1 11V4a1 1 0 011-1h11a1 1 0 011 1v7a1 1 0 01-1 1H2a1 1 0 01-1-1z" stroke="currentColor" strokeWidth="1.25"/><path d="M4 7h7M4 9.5h4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></svg>,
  finance: () => <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.25"/><path d="M7.5 4v1.5M7.5 9.5V11M5.5 6.5c0-1 1-1.5 2-1.5s2 .5 2 1.5-1 1.5-2 1.5-2 .5-2 1.5 1 1.5 2 1.5 2-.5 2-1.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></svg>,
  meta: () => <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M1.5 9.5c0-2 1.5-3.5 3-3.5 1 0 1.5.5 3 3 1.5-2.5 2-3 3-3 1.5 0 3 1.5 3 3.5S13 13 11.5 13c-1 0-1.5-.5-3-3-1.5 2.5-2 3-3 3C4 13 1.5 11.5 1.5 9.5z" stroke="currentColor" strokeWidth="1.25"/><path d="M7.5 3V1.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></svg>,
  overview: () => <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.25"/><path d="M7.5 4.5v3l2 2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  back: () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  search: () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.25"/><path d="M8 8l2.5 2.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></svg>,
  plus: () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  chevronRight: () => <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  logout: () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M5 11H2.5A1.5 1.5 0 011 9.5v-6A1.5 1.5 0 012.5 2H5M9 9.5l3-3-3-3M12 6.5H5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  dot: (color: string) => <span className={`w-1.5 h-1.5 rounded-full ${color} flex-shrink-0`} />,
}

// ── CustomerSwitcher ───────────────────────────────────────────────────────
function CustomerSwitcher({
  customers, activeCustomerId, onAddNew
}: {
  customers: any[]
  activeCustomerId: string | null
  onAddNew: () => void
}) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const activeCustomer = customers.find(c => c.id === activeCustomerId)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const filtered = customers.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="relative px-3 py-2 border-b border-gray-800" ref={ref}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-xl transition-colors group"
      >
        {activeCustomer ? (
          <>
            <div className="w-6 h-6 rounded-lg bg-amber-500/30 flex items-center justify-center font-bold text-amber-400 text-xs flex-shrink-0">
              {activeCustomer.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-semibold text-gray-200 truncate">{activeCustomer.name}</p>
              <p className="text-xs text-gray-600">Aktif Firma</p>
            </div>
          </>
        ) : (
          <>
            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-indigo-400 text-xs">◈</span>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-semibold text-gray-300">Tüm Müşteriler</p>
              <p className="text-xs text-gray-600">{customers.length} Firma </p>
            </div>
          </>
        )}
        <svg className={`w-3 h-3 text-gray-600 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-3 right-3 top-full mt-1 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-800">
            <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-2.5 py-1.5">
              <Icon.search />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Müşteri ara..."
                className="flex-1 bg-transparent text-xs text-gray-300 placeholder-gray-600 focus:outline-none"
              />
            </div>
          </div>

          {/* All customers option */}
          <Link
            href="/advertiser"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-800 transition-colors border-b border-gray-800"
          >
            <div className="w-5 h-5 rounded-md bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-indigo-400 text-xs">◈</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-300">Tüm Müşteriler</p>
              <p className="text-xs text-gray-600">{customers.length} Firma </p>
            </div>
            {!activeCustomerId && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />}
          </Link>

          {/* Customer list */}
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-xs text-gray-600 text-center">Sonuç bulunamadı</p>
            ) : filtered.map(c => (
              <Link
                key={c.id}
                href={`/advertiser/customers/${c.id}`}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-800 transition-colors ${activeCustomerId === c.id ? 'bg-amber-500/10' : ''}`}
              >
                <div className="w-5 h-5 rounded-md bg-amber-500/20 flex items-center justify-center font-bold text-amber-400 text-xs flex-shrink-0">
                  {c.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate ${activeCustomerId === c.id ? 'text-amber-300' : 'text-gray-300'}`}>{c.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.status === 'active' ? 'bg-emerald-500' : 'bg-gray-600'}`} />
                    <span className="text-xs text-gray-600 truncate">{c.owner?.email}</span>
                  </div>
                </div>
                {activeCustomerId === c.id && (
                  <svg className="w-3 h-3 text-amber-400 flex-shrink-0" viewBox="0 0 12 12" fill="none">
                    <path d="M1.5 6l3 3 6-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </Link>
            ))}
          </div>

          {/* Add new */}
          <div className="p-2 border-t border-gray-800">
            <button
              onClick={() => { setOpen(false); onAddNew() }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors"
            >
              <Icon.plus />
              <span className="text-xs font-medium">Yeni Müşteri</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sidebar ────────────────────────────────────────────────────────────────
function Sidebar({ onAddNew }: { onAddNew: () => void }) {
  const { profile, customers } = useAdvertiser()
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(true)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  const customerIdMatch = pathname.match(/\/advertiser\/customers\/([^/]+)/)
  const activeCustomerId = customerIdMatch?.[1] ?? null
  const activeCustomer = customers.find(c => c.id === activeCustomerId)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfileMenu(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const mainNav = [
    { href: '/advertiser', label: 'Dashboard', IconComp: Icon.dashboard, exact: true },
    { href: '/advertiser/customers', label: 'Müşterilerim', IconComp: Icon.customers },
    { href: '/advertiser/hakedis', label: 'Hakediş', IconComp: Icon.hakedis, accent: 'emerald' },
    { href: '/advertiser/faturalar', label: 'Faturalar', IconComp: Icon.faturalar },
    { href: '/advertiser/ayarlar', label: 'Ayarlar', IconComp: Icon.ayarlar },
  ]

  const customerNav = activeCustomer ? [
    { href: `/advertiser/customers/${activeCustomerId}`, label: 'Genel Bakış', IconComp: Icon.overview, exact: true },
    { href: `/advertiser/customers/${activeCustomerId}/leads`, label: 'Leadler', IconComp: Icon.leads },
    { href: `/advertiser/customers/${activeCustomerId}/finance`, label: 'Finans & Hakediş', IconComp: Icon.finance },
    { href: `/advertiser/customers/${activeCustomerId}/meta`, label: 'Meta Bağlantı', IconComp: Icon.meta },
    { href: `/advertiser/customers/${activeCustomerId}/settings`, label: 'Ayarlar', IconComp: Icon.ayarlar },
  ] : []

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <aside
      onMouseEnter={() => setCollapsed(false)}
      onMouseLeave={() => setCollapsed(true)}
      className={`${collapsed ? 'w-[60px]' : 'w-64'} bg-gray-950 border-r border-gray-800/60 flex flex-col fixed top-0 left-0 h-full z-20 transition-all duration-200 ease-in-out`}
    >
      {/* Logo */}
      <div className={`flex items-center h-14 border-b border-gray-800/60 px-4 flex-shrink-0 ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <img src="/logo2.png" alt="DataPilot" className="h-7 w-auto flex-shrink-0 object-contain" />
        {!collapsed && <span className="font-semibold text-white text-sm tracking-tight truncate">DataPilot</span>}
      </div>

      {/* Reklamcı profil satırı */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-gray-800/60 flex items-center gap-2.5 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-amber-400 text-xs font-bold">{(profile?.company_name || profile?.full_name || 'R').charAt(0)}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-gray-200 truncate">{profile?.company_name || profile?.full_name}</p>
            <span className="text-xs text-amber-400/80 font-medium">Reklamcı · Partner</span>
          </div>
        </div>
      )}

      {/* Workspace switcher — sadece expanded */}
      {!collapsed && (
        <CustomerSwitcher
          customers={customers}
          activeCustomerId={activeCustomerId}
          onAddNew={onAddNew}
        />
      )}

      {/* Aktif müşteri workspace nav */}
      {activeCustomer && !collapsed && (
        <div className="flex-shrink-0 border-b border-gray-800/60">
          {/* Workspace başlığı */}
          <div className="px-3 pt-3 pb-1 flex items-center justify-between">
            <span className="text-xs text-gray-600 uppercase tracking-wider font-medium">Firma</span>
            <Link href="/advertiser/customers" className="text-gray-600 hover:text-gray-400 transition-colors p-1 rounded hover:bg-white/5">
              <Icon.back />
            </Link>
          </div>
          {/* Müşteri kimlik kartı */}
          <div className="mx-3 mb-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-amber-500/30 flex items-center justify-center font-bold text-amber-400 text-xs flex-shrink-0">
                {activeCustomer.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-amber-300 truncate">{activeCustomer.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span className="text-xs text-gray-500 truncate">{activeCustomer.owner?.email}</span>
                </div>
              </div>
            </div>
          </div>
          {/* Workspace nav items */}
          <div className="px-2 pb-2 space-y-0.5">
            {customerNav.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all ${
                  isActive(item.href, item.exact)
                    ? 'bg-amber-500/15 text-amber-300 font-medium'
                    : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                <span className="flex-shrink-0"><item.IconComp /></span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Ana navigasyon */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {collapsed && customers.slice(0, 5).map(c => (
          <Link key={c.id} href={`/advertiser/customers/${c.id}`} title={c.name}
            className={`flex items-center justify-center w-10 h-10 mx-auto rounded-xl transition-all mb-1 ${activeCustomerId === c.id ? 'bg-amber-500/20 text-amber-400' : 'text-gray-600 hover:bg-white/10 hover:text-gray-300'}`}>
            <span className="text-xs font-bold">{c.name.charAt(0)}</span>
          </Link>
        ))}
        {collapsed && customers.length > 0 && <div className="h-px bg-gray-800 mx-2 my-2" />}

        {!activeCustomer && mainNav.map(item => {
          const active = isActive(item.href, item.exact)
          return (
            <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${active ? 'bg-amber-500 text-white font-medium shadow-lg shadow-amber-900/20' : item.accent === 'emerald' ? 'text-emerald-400/80 hover:bg-emerald-500/10 hover:text-emerald-300' : 'text-gray-500 hover:bg-white/8 hover:text-gray-200'} ${collapsed ? 'justify-center' : ''}`}>
              <span className="flex-shrink-0"><item.IconComp /></span>
              {!collapsed && <span className="flex-1 text-left text-xs font-medium">{item.label}</span>}
            </Link>
          )
        })}

        {activeCustomer && !collapsed && (
          <Link href="/advertiser" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-all">
            <Icon.back />
            <span>Ana Panele Dön</span>
          </Link>
        )}
      </nav>
      {/* Alt profil alanı */}
      <div className="flex-shrink-0 border-t border-gray-800/60 p-2" ref={profileRef}>
        {!collapsed ? (
          <>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 hover:bg-white/5 rounded-xl transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center flex-shrink-0">
                <span className="text-gray-300 text-xs font-bold">{profile?.full_name?.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-medium text-gray-300 truncate">{profile?.full_name}</p>
                <p className="text-xs text-gray-600 truncate">{profile?.email}</p>
              </div>
            </button>
            {showProfileMenu && (
              <div className="mt-1 bg-gray-900 border border-gray-700/80 rounded-xl overflow-hidden shadow-xl">
                <Link
                  href="/advertiser/ayarlar"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-xs text-gray-400 hover:bg-white/5 transition-colors"
                >
                  <Icon.ayarlar />
                  Ayarlar
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-red-400 hover:bg-red-500/8 transition-colors border-t border-gray-800"
                >
                  <Icon.logout />
                  Çıkış Yap
                </button>
              </div>
            )}
          </>
        ) : (
          <button
            onClick={handleLogout}
            title="Çıkış Yap"
            className="w-10 h-10 mx-auto flex items-center justify-center rounded-xl text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Icon.logout />
          </button>
        )}
      </div>
    </aside>
  )
}

// ── TopBar ─────────────────────────────────────────────────────────────────
function TopBar() {
  const { profile, customers } = useAdvertiser()
  const pathname = usePathname()

  const customerIdMatch = pathname.match(/\/advertiser\/customers\/([^/]+)/)
  const activeCustomerId = customerIdMatch?.[1]
  const activeCustomer = customers.find(c => c.id === activeCustomerId)

  const sectionMap: Record<string, string> = {
    leads: 'Leadler',
    finance: 'Finans & Hakediş',
    meta: 'Meta Bağlantı',
    settings: 'Ayarlar',
  }
  const parts = pathname.split('/')
  const section = parts[4] ? sectionMap[parts[4]] : null

  return (
    <header className="h-14 bg-white/90 backdrop-blur-md border-b border-gray-100 flex items-center px-6 sticky top-0 z-10">
      <nav className="flex items-center gap-1.5 text-sm text-gray-400 min-w-0">
        <Link href="/advertiser" className="hover:text-gray-600 transition-colors flex-shrink-0 font-medium text-gray-500">
          DataPilot
        </Link>
        {activeCustomer ? (
          <>
            <Icon.chevronRight />
            <Link href="/advertiser/customers" className="hover:text-gray-600 transition-colors flex-shrink-0">Müşteriler</Link>
            <Icon.chevronRight />
            <Link href={`/advertiser/customers/${activeCustomerId}`}
              className={`flex-shrink-0 truncate max-w-[140px] ${!section ? 'text-gray-800 font-medium' : 'hover:text-gray-600 transition-colors'}`}>
              {activeCustomer.name}
            </Link>
            {section && (<><Icon.chevronRight /><span className="text-gray-800 font-medium flex-shrink-0">{section}</span></>)}
          </>
        ) : (
          <>
            <Icon.chevronRight />
            <span className="text-gray-800 font-medium">
              {pathname === '/advertiser' ? 'Dashboard'
                : pathname === '/advertiser/customers' ? 'Müşterilerim'
                : pathname === '/advertiser/hakedis' ? 'Hakediş'
                : pathname === '/advertiser/faturalar' ? 'Faturalar'
                : pathname === '/advertiser/ayarlar' ? 'Ayarlar' : ''}
            </span>
          </>
        )}
      </nav>

      <div className="ml-auto flex items-center gap-3 flex-shrink-0">
        {activeCustomer && (
          <div className="hidden md:flex items-center gap-2 bg-amber-50 border border-amber-200/60 rounded-xl px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-xs font-medium text-amber-700 max-w-[100px] truncate">{activeCustomer.name}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
            <span className="text-amber-600 text-xs font-bold">{profile?.full_name?.charAt(0)}</span>
          </div>
          <span className="text-sm font-medium text-gray-700 hidden lg:block">{profile?.full_name}</span>
          <span className="text-xs bg-amber-50 text-amber-600 font-medium px-2 py-0.5 rounded-full hidden md:block border border-amber-200/60">Reklamcı</span>
        </div>
        <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login' }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-gray-500 hover:text-red-500 hover:bg-red-50 border border-gray-200 hover:border-red-200 transition-colors">
          <Icon.logout />
          <span className="hidden md:block">Çıkış</span>
        </button>
      </div>
    </header>
  )
}

// ── Loading ────────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-sm">D</span>
        </div>
        <div className="flex gap-1.5 justify-center">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-1.5 h-1.5 bg-amber-500/60 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.12}s` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Shell (exported) ───────────────────────────────────────────────────────
export function AdvertiserShell({ children }: { children: React.ReactNode }) {
  const { loading } = useAdvertiser()
  const [showAddCustomer, setShowAddCustomer] = useState(false)

  if (loading) return <LoadingScreen />

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: '#fafafa' }}>
      <Sidebar onAddNew={() => setShowAddCustomer(true)} />

      <div className="ml-[60px] flex-1 min-w-0">
        <TopBar />
       <div
  className="min-h-[calc(100vh-56px)]"
  style={{ background: 'linear-gradient(160deg, #f9f9fb 0%, #f4f2fd 50%, #fdf8ed 100%)' }}
>
  <main className="p-6 max-w-6xl mx-auto">
    {children}
  </main>
</div> 
    
  
      </div>

      {/* Add customer modal trigger — customers/page.tsx içindeki modal ile koordineli çalışır */}
      {/* Sidebar'dan tetiklenen "Yeni Müşteri" için global sinyal */}
      {showAddCustomer && (
        <AddCustomerSignal onHandled={() => setShowAddCustomer(false)} />
      )}
    </div>
  )
}

// Sidebar'dan "Yeni Müşteri" tıklandığında customers page'ini bilgilendirmek için
// basit bir URL trick kullanıyoruz — daha gelişmiş state yönetimi gerektirmez
function AddCustomerSignal({ onHandled }: { onHandled: () => void }) {
  const router = useRouter()
  useEffect(() => {
    router.push('/advertiser/customers?new=1')
    onHandled()
  }, [])
  return null
}