'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const faqs = [
  {
    q: 'DataPilot hangi platformlarla entegre Ã§alÄ±ÅŸÄ±r?',
    a: 'Meta, Instagram, WhatsApp ve Google Ads entegrasyonlarÄ± bulunmaktadÄ±r. AyrÄ±ca Excel dosyasÄ± yÃ¼kleme ve manuel veri giriÅŸi de desteklenir. Yeni entegrasyonlar roadmap doÄŸrultusunda eklenmektedir.'
  },
  {
    q: 'Potansiyel mÃ¼ÅŸteri verilerim gÃ¼vende mi?',
    a: 'TÃ¼m verileriniz SSL ÅŸifreli baÄŸlantÄ± Ã¼zerinden iletilir ve gÃ¼venli sunucularda saklanÄ±r. Verilerinize yalnÄ±zca siz ve yetkilendirdiÄŸiniz kiÅŸiler eriÅŸebilir. Verileriniz Ã¼Ã§Ã¼ncÃ¼ taraflarla paylaÅŸÄ±lmaz.'
  },
  {
    q: 'KaÃ§ kullanÄ±cÄ± ekleyebilirim?',
    a: 'Kullanim kapsami isletmenizin ihtiyacina gore planlanir. Demo ve teklif surecinde ekibiniz icin en uygun kurulum birlikte netlestirilir.'
  },
  {
    q: 'Deneme sÃ¼resi var mÄ±?',
    a: 'Evet. Uygun mÃ¼ÅŸteriler iÃ§in demo ve deneme sÃ¼reci sunuyoruz. Detaylar iÃ§in bizimle iletiÅŸime geÃ§ebilirsiniz.'
  },
  {
    q: 'Ä°stediÄŸim zaman iptal edebilir miyim?',
    a: 'Evet, sÃ¶zleÅŸme ve kullanÄ±m koÅŸullarÄ±nÄ±za baÄŸlÄ± olarak iptal veya paket deÄŸiÅŸikliÄŸi yapÄ±labilir. Detaylar iÃ§in destek ekibimizle iletiÅŸime geÃ§ebilirsiniz.'
  },
  {
    q: 'Teknik destek alabilir miyim?',
    a: 'Evet. Kurulum, onboarding ve kullanim surecinde destek ekibimizle birlikte ilerleyebilirsiniz. Ihtiyaciniza gore destek kapsami teklif surecinde netlestirilir.'
  },
]

const plans = [
  {
    name: 'Starter',
    price: 'â‚º2.000',
    period: '/ay',
    desc: 'KÃ¼Ã§Ã¼k ekipler iÃ§in ideal baÅŸlangÄ±Ã§ paketi',
    highlight: false,
    features: ['2 kullanÄ±cÄ±', '1 ÅŸube', '400 potansiyel mÃ¼ÅŸteri/ay', 'Meta entegrasyonu', 'Excel yÃ¼kleme', 'Temel raporlar']
  },
  {
    name: 'Pro',
    price: 'â‚º5.500',
    period: '/ay',
    desc: 'BÃ¼yÃ¼yen iÅŸletmeler iÃ§in gÃ¼Ã§lÃ¼ Ã¶zellikler',
    highlight: true,
    features: ['10 kullanÄ±cÄ±', '3 ÅŸube', '2000 potansiyel mÃ¼ÅŸteri/ay', 'Meta entegrasyonu', 'Excel yÃ¼kleme', 'GeliÅŸmiÅŸ raporlar', 'Ã–ncelikli destek']
  },
  {
    name: 'Enterprise',
    price: 'â‚º15.000+',
    period: '/ay',
    desc: 'BÃ¼yÃ¼k kurumlar iÃ§in Ã¶zelleÅŸtirilebilir Ã§Ã¶zÃ¼m',
    highlight: false,
    features: ['SÄ±nÄ±rsÄ±z kullanÄ±cÄ±', 'SÄ±nÄ±rsÄ±z ÅŸube', 'SÄ±nÄ±rsÄ±z potansiyel mÃ¼ÅŸteri', 'TÃ¼m entegrasyonlar', 'Ã–zel AI modeli', 'Dedicated destek', 'SLA garantisi']
  },
]

const features = [
  { icon: 'ğŸ”—', title: 'Ã‡oklu Kanal Entegrasyonu', desc: 'Meta, Instagram, WhatsApp ve Google Ads dahil tÃ¼m kanallardan gelen mÃ¼ÅŸteri taleplerini otomatik olarak tek panelde toplayÄ±n.' },
  { icon: 'ğŸ¤–', title: 'AI Analitik', desc: 'SatÄ±ÅŸ performansÄ±nÄ±zÄ± analiz edin, hangi kanallarÄ±n ve ekiplerin daha iyi sonuÃ§ verdiÄŸini kolayca gÃ¶rÃ¼n.' },
  { icon: 'ğŸ‘¥', title: 'Ekip YÃ¶netimi', desc: 'Ekibinizi, satÄ±ÅŸ sÃ¼reÃ§lerinizi ve mÃ¼ÅŸteri daÄŸÄ±tÄ±mÄ±nÄ± tek panelden kolayca yÃ¶netin.' },
  { icon: 'ğŸ“‚', title: 'Veri Merkezi', desc: 'Excel ve diÄŸer veri kaynaklarÄ±nÄ±zÄ± iÃ§e aktarÄ±n, tÃ¼m mÃ¼ÅŸteri verinizi tek yerde yÃ¶netin.' },
  { icon: 'ğŸ“Š', title: 'GeliÅŸmiÅŸ Raporlar', desc: 'GÃ¼nlÃ¼k, haftalÄ±k ve aylÄ±k raporlarla iÅŸinizin performansÄ±nÄ± net bir ÅŸekilde takip edin.' },
  { icon: 'ğŸ”’', title: 'GÃ¼venli & HÄ±zlÄ±', desc: 'GÃ¼venli altyapÄ± ve hÄ±zlÄ± performans ile verileriniz her zaman koruma altÄ±nda.' },
]

function DashboardMockup() {
  return (
    <div className="relative w-full max-w-3xl mx-auto mt-16">
      <div className="absolute inset-0 bg-blue-500 opacity-10 blur-3xl rounded-3xl scale-95 translate-y-4" />
      <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
        <div className="bg-[#1a1f2e] px-4 py-3 flex items-center gap-3 border-b border-white/5">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>
          <div className="flex-1 bg-[#252b3b] rounded-md px-3 py-1 flex items-center gap-2 mx-4">
            <div className="w-3 h-3 rounded-full bg-blue-400/40 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400/60" />
            </div>
            <span className="text-white/30 text-xs font-mono">datapilot.com.tr/dashboard</span>
          </div>
        </div>
        <div className="bg-[#0f1422] flex">
          <div className="w-14 bg-[#0a0e1a] flex flex-col items-center py-4 gap-4 border-r border-white/5 flex-shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mb-2">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            {['â–£', 'â—ˆ', 'â—‰', 'âŠ', 'â—'].map((icon, i) => (
              <div key={i} className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs cursor-pointer transition-all ${i === 0 ? 'bg-blue-600/20 text-blue-400' : 'text-white/20 hover:text-white/40'}`}>
                {icon}
              </div>
            ))}
          </div>
          <div className="flex-1 p-5 min-w-0">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-white/40 text-xs mb-0.5">HoÅŸ geldiniz,</p>
                <h3 className="text-white font-semibold text-sm">GÃ¼naydÄ±n, Ahmet Bey ğŸ‘‹</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-1.5 text-blue-400 text-xs font-medium">
                  + Yeni Potansiyel MÃ¼ÅŸteri
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3 mb-5">
              {[
                { label: 'Toplam Potansiyel MÃ¼ÅŸteri', value: '1.284', change: '+12%', up: true },
                { label: 'Bu Ay', value: '247', change: '+8%', up: true },
                { label: 'DÃ¶nÃ¼ÅŸÃ¼m', value: '%34', change: '+3%', up: true },
                { label: 'Bekleyen', value: '58', change: '-5', up: false },
              ].map((stat, i) => (
                <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                  <p className="text-white/40 text-[10px] mb-1">{stat.label}</p>
                  <p className="text-white font-semibold text-base">{stat.value}</p>
                  <p className={`text-[10px] mt-0.5 ${stat.up ? 'text-green-400' : 'text-red-400'}`}>{stat.change} bu ay</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-5 gap-3">
              <div className="col-span-3 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-white/60 text-[11px] font-medium">HaftalÄ±k Lead Trendi</p>
                  <span className="text-blue-400 text-[10px]">Son 7 gÃ¼n</span>
                </div>
                <div className="flex items-end gap-1.5 h-16">
                  {[40, 65, 45, 80, 55, 90, 72].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end gap-0.5">
                      <div className={`rounded-sm w-full transition-all ${i === 5 ? 'bg-blue-500' : 'bg-white/10'}`} style={{ height: `${h}%` }} />
                      <p className="text-white/20 text-[8px] text-center">{['Pzt', 'Sal', 'Ã‡ar', 'Per', 'Cum', 'Cmt', 'Paz'][i]}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="col-span-2 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                <p className="text-white/60 text-[11px] font-medium mb-2">Son Potansiyel mÃ¼ÅŸteriler</p>
                <div className="space-y-2">
                  {[
                    { name: 'Mehmet Y.', status: 'Yeni', color: 'blue' },
                    { name: 'AyÅŸe K.', status: 'Takipte', color: 'yellow' },
                    { name: 'Ali R.', status: 'SatÄ±ldÄ±', color: 'green' },
                    { name: 'Fatma S.', status: 'Yeni', color: 'blue' },
                  ].map((lead, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[8px] text-white/50">{lead.name[0]}</div>
                        <span className="text-white/60 text-[10px]">{lead.name}</span>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${lead.color === 'blue' ? 'bg-blue-500/20 text-blue-400' : lead.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
                        {lead.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-4 -right-4 bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-green-900/50 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
        CanlÄ± Veri
      </div>
    </div>
  )
}

export default function LandingPage() {
  const router = useRouter()
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<{ role: string, text: string }[]>([
    { role: 'ai', text: 'Merhaba! DataPilot hakkÄ±nda merak ettiÄŸiniz her ÅŸeyi sorabilirsiniz ğŸ˜Š' }
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactMessage, setContactMessage] = useState('')
  const [contactSent, setContactSent] = useState(false)
  const [demoName, setDemoName] = useState('')
  const [demoPhone, setDemoPhone] = useState('')
  const [demoBusiness, setDemoBusiness] = useState('')

  const sendChat = async () => {
    if (!chatInput.trim()) return
    const userMsg = chatInput
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setChatLoading(true)
    try {
      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      })
      const data = await res.json()
      setChatMessages(prev => [...prev, { role: 'ai', text: data.reply }])
    } catch {
      setChatMessages(prev => [...prev, { role: 'ai', text: 'Bir hata oluÅŸtu, lÃ¼tfen tekrar deneyin.' }])
    }
    setChatLoading(false)
  }

  const scrollToDemo = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    document.getElementById('demo-form')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-white">

      {/* â”€â”€â”€ NAVBAR â”€â”€â”€ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100/80">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center cursor-pointer" onClick={() => router.push('/')}>
            <img src="/logo.png" alt="DataPilot" className="h-9 w-auto" />
          </div>
          <div className="hidden md:flex items-center gap-8">
            {[['#ozellikler', 'Ozellikler'], ['#demo-form', 'Demo'], ['#sss', 'SSS'], ['#iletisim', 'Iletisim']].map(([href, label]) => (
              <a key={href} href={href} className="text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors">{label}</a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push('/login')}
              className="text-gray-600 hover:text-gray-900 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
              GiriÅŸ Yap
            </button>
            <button onClick={() => router.push('/register')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-all shadow-md shadow-blue-200 hover:shadow-blue-300">
              Ãœye Ol â†’
            </button>
          </div>
        </div>
      </nav>

      {/* â”€â”€â”€ HERO â”€â”€â”€ */}
      <section className="relative pt-28 pb-0 overflow-hidden bg-gradient-to-b from-[#060c1f] via-[#0a1435] to-[#0d1a45]">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600 opacity-10 blur-[120px] rounded-full" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-purple-600 opacity-5 blur-3xl rounded-full" />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm rounded-full px-4 py-1.5 mb-7">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span className="text-blue-300 text-xs font-medium tracking-wide">Meta, Instagram, WhatsApp ve Google Ads entegrasyonlarÄ±</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-5 leading-[1.1] tracking-tight">
            SatÄ±ÅŸ sÃ¼recinizi{' '}
            <span className="relative">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">tek panelden</span>
            </span>
            {' '}yÃ¶netin
          </h1>

          <p className="text-slate-400 text-lg md:text-xl mb-4 max-w-2xl mx-auto leading-relaxed">
            Potansiyel mÃ¼ÅŸterileri toplayÄ±n, ekibinize daÄŸÄ±tÄ±n ve performansÄ± takip edin.
          </p>
          <p className="text-slate-500 text-sm mb-8 max-w-xl mx-auto">
            TÃ¼m satÄ±ÅŸ ekipleri ve iÅŸletmeler iÃ§in tek, gÃ¼Ã§lÃ¼ ve merkezi Ã§Ã¶zÃ¼m.
          </p>

          {/* CTA buttons */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <a
              href="https://wa.me/905453467778?text=Merhaba%2C%20DataPilot%20hakk%C4%B1nda%20demo%20almak%20istiyorum."
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-xl shadow-blue-900/50 text-sm hover:-translate-y-0.5 inline-flex items-center">
              Demo Al ?
            </a>
            <button onClick={() => router.push('/login')}
              className="border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-medium px-8 py-3.5 rounded-xl transition-all text-sm backdrop-blur-sm">
              GiriÅŸ Yap
            </button>
          </div>

          <p className="text-slate-600 text-xs mt-4 text-center">
            500+ iÅŸletme tarafÄ±ndan kullanÄ±lÄ±yor
          </p>

          <div className="mt-3 text-center">
            <a
              href="#demo-form"
              onClick={scrollToDemo}
              className="text-slate-500 text-xs hover:text-slate-300 underline underline-offset-2 transition-colors cursor-pointer">
              veya formu doldur
            </a>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-10 mt-12 flex-wrap">
            {[
              { value: '10K+', label: 'Potansiyel MÃ¼ÅŸteri YÃ¶netildi' },
              { value: '%34', label: 'DÃ¶nÃ¼ÅŸÃ¼m ArtÄ±ÅŸÄ±' },
              { value: '500+', label: 'BaÅŸarÄ±lÄ± Firma' },
              { value: '14 GÃ¼n', label: 'Ãœcretsiz Deneme' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-white font-bold text-2xl">{s.value}</p>
                <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Dashboard Mockup */}
          <DashboardMockup />
        </div>

        {/* Bottom fade to white */}
        <div className="h-32 bg-gradient-to-b from-transparent to-gray-50 mt-16" />
      </section>

      {/* â”€â”€â”€ Ã–ZELLÄ°KLER â”€â”€â”€ */}
      <section id="ozellikler" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-3">Platform</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Her ÅŸey tek platformda</h2>
            <p className="text-gray-500 max-w-xl mx-auto text-lg">Potansiyel mÃ¼ÅŸteri yÃ¶netiminden analitiÄŸe kadar ihtiyacÄ±nÄ±z olan her ÅŸey</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title} className="group bg-white rounded-2xl p-7 border border-gray-100 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-50 transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 bg-blue-50 group-hover:bg-blue-100 rounded-xl flex items-center justify-center text-2xl mb-5 transition-colors">{f.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2 text-base">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€â”€ HOW IT WORKS â”€â”€â”€ */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-3">NasÄ±l Ã‡alÄ±ÅŸÄ±r?</p>
            <h2 className="text-4xl font-bold text-gray-900 tracking-tight">3 adÄ±mda baÅŸlayÄ±n</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px bg-gradient-to-r from-blue-100 via-blue-200 to-blue-100" />
            {[
              { num: '01', title: 'TÃ¼m talepleri tek yerde toplayÄ±n', desc: 'Formlar, reklamlar, WhatsApp ve diÄŸer tÃ¼m kanallardan gelen mÃ¼ÅŸteri talepleri tek panelde toplanÄ±r.' },
              { num: '02', title: 'Ekibinize otomatik olarak daÄŸÄ±tÄ±n', desc: 'Gelen mÃ¼ÅŸteriler doÄŸru kiÅŸilere atanÄ±r, hiÃ§bir talep cevapsÄ±z kalmaz.' },
              { num: '03', title: 'SatÄ±ÅŸ sÃ¼recini baÅŸtan sona yÃ¶netin', desc: 'TÃ¼m gÃ¶rÃ¼ÅŸmeleri, durumlarÄ± ve ilerlemeyi tek ekrandan takip edin.' },
            ].map(step => (
              <div key={step.num} className="text-center">
                <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-200 relative z-10">
                  <span className="text-white font-bold text-2xl">{step.num}</span>
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* â”€â”€â”€ SSS â”€â”€â”€ */}
      <section id="sss" className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-3">Sorular</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">SÄ±kÃ§a Sorulan Sorular</h2>
            <p className="text-gray-500 text-lg">AklÄ±nÄ±zdaki sorularÄ±n cevaplarÄ± burada</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className={`rounded-2xl border transition-all overflow-hidden ${openFaq === i ? 'border-blue-100 shadow-md shadow-blue-50' : 'border-gray-100'}`}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50/50 transition-colors">
                  <span className="font-medium text-gray-900 text-sm pr-4">{faq.q}</span>
                  <span className={`text-gray-400 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}>â–¼</span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 border-t border-gray-50">
                    <p className="text-gray-500 text-sm leading-relaxed pt-4">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€â”€ DEMO FORM â”€â”€â”€ */}
      <section id="demo-form" className="py-20 bg-gray-50">
        <div className="max-w-lg mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-3">Demo</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">Demo Talebi</h2>
            <p className="text-gray-500 text-base">Formu doldurun, sizi arayalim veya isletmenize ozel teklif hazirlayalim.</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ad Soyad</label>
              <input
                value={demoName}
                onChange={e => setDemoName(e.target.value)}
                placeholder="AdÄ±nÄ±z SoyadÄ±nÄ±z"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Telefon</label>
              <input
                value={demoPhone}
                onChange={e => setDemoPhone(e.target.value)}
                placeholder="05XX XXX XX XX"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ä°ÅŸletme AdÄ±</label>
              <input
                value={demoBusiness}
                onChange={e => setDemoBusiness(e.target.value)}
                placeholder="Åirket / Ä°ÅŸletme AdÄ±"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all"
              />
            </div>
            <button
              onClick={() => {
                console.log('Demo talebi:', { demoName, demoPhone, demoBusiness })
                alert('Talebiniz alÄ±ndÄ±, en kÄ±sa sÃ¼rede sizinle iletiÅŸime geÃ§eceÄŸiz.')
                setDemoName('')
                setDemoPhone('')
                setDemoBusiness('')
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-100 hover:shadow-blue-200">
              GÃ¶nder â†’
            </button>
            <p className="text-center text-xs text-gray-400 mt-2">
              Ya da direkt WhatsApp&apos;tan ulaÅŸÄ±n:{' '}
              <a
                href="https://wa.me/905XXXXXXXXX?text=Merhaba%2C%20DataPilot%20hakk%C4%B1nda%20demo%20almak%20istiyorum."
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline font-medium">
                WhatsApp ile iletiÅŸime geÃ§ â†’
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* â”€â”€â”€ CTA BANNER â”€â”€â”€ */}
      {/* â”€â”€â”€ Ä°LETÄ°ÅÄ°M â”€â”€â”€ */}
      <section id="iletisim" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-3">Ä°letiÅŸim</p>
            <h2 className="text-4xl font-bold text-gray-900 tracking-tight">Bize UlaÅŸÄ±n</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-gray-500 mb-8 text-lg leading-relaxed">SorularÄ±nÄ±z iÃ§in bize yazÄ±n, en kÄ±sa sÃ¼rede dÃ¶nÃ¼ÅŸ yapalÄ±m.</p>
              <div className="space-y-5">
                {[
                  { icon: 'ğŸ“§', label: 'E-posta', value: 'destek@datapilot.com.tr' },
                  { icon: 'ğŸ“', label: 'Telefon', value: '+90 (212) 000 00 00' },
                  { icon: 'ğŸ“', label: 'Adres', value: 'Ä°stanbul, TÃ¼rkiye' },
                ].map(c => (
                  <div key={c.label} className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0">{c.icon}</div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">{c.label}</p>
                      <p className="text-sm font-semibold text-gray-900">{c.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-7 border border-gray-100">
              {contactSent ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">âœ…</div>
                  <h3 className="font-bold text-gray-900 mb-2 text-lg">MesajÄ±nÄ±z alÄ±ndÄ±!</h3>
                  <p className="text-gray-500 text-sm">En kÄ±sa sÃ¼rede size dÃ¶nÃ¼ÅŸ yapacaÄŸÄ±z.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">AdÄ±nÄ±z</label>
                    <input value={contactName} onChange={e => setContactName(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all"
                      placeholder="Ad Soyad" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">E-posta</label>
                    <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all"
                      placeholder="ornek@email.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">MesajÄ±nÄ±z</label>
                    <textarea value={contactMessage} onChange={e => setContactMessage(e.target.value)} rows={4}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all resize-none"
                      placeholder="NasÄ±l yardÄ±mcÄ± olabiliriz?" />
                  </div>
                  <button onClick={() => setContactSent(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-100 hover:shadow-blue-200">
                    GÃ¶nder â†’
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€â”€ FOOTER â”€â”€â”€ */}
      <footer className="bg-[#070d20] text-slate-500 py-14">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <img src="/logo2.png" alt="DataPilot" className="h-8 w-auto" />
              </div>
              <p className="text-sm leading-relaxed">AkÄ±llÄ± potansiyel mÃ¼ÅŸteri yÃ¶netim platformu.<br />Ä°ÅŸinizi bÃ¼yÃ¼tÃ¼n.</p>
            </div>
            <div>
              <h4 className="text-slate-300 font-semibold text-sm mb-4">ÃœrÃ¼n</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#ozellikler" className="hover:text-white transition-colors">Ã–zellikler</a></li>
                <li><a href="#demo-form" className="hover:text-white transition-colors">Demo</a></li>
                <li><a href="#sss" className="hover:text-white transition-colors">SSS</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-slate-300 font-semibold text-sm mb-4">Åirket</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#iletisim" className="hover:text-white transition-colors">Ä°letiÅŸim</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Gizlilik PolitikasÄ±</a></li>
                <li><a href="#" className="hover:text-white transition-colors">KullanÄ±m KoÅŸullarÄ±</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-slate-300 font-semibold text-sm mb-4">Hesap</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="/login" className="hover:text-white transition-colors">GiriÅŸ Yap</a></li>
                <li><a href="#demo-form" className="hover:text-white transition-colors">Demo Al</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 flex items-center justify-between flex-wrap gap-4">
            <p className="text-sm">DataPilot Â© 2026 â€” TÃ¼m haklarÄ± saklÄ±dÄ±r.</p>
            <p className="text-sm">Ä°stanbul, TÃ¼rkiye</p>
          </div>
        </div>
      </footer>

      {/* â”€â”€â”€ AI DESTEK CHAT (geÃ§ici olarak gizlendi) â”€â”€â”€ */}
      {false && (
        <div className="fixed bottom-6 right-6 z-50">
          {chatOpen && (
            <div className="mb-4 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-sm">ğŸ¤–</div>
                  <div>
                    <p className="text-white font-semibold text-sm">DataPilot Destek</p>
                    <p className="text-blue-200 text-xs">AI Destekli</p>
                  </div>
                </div>
                <button onClick={() => setChatOpen(false)} className="text-white/70 hover:text-white transition-colors">âœ•</button>
              </div>
              <div className="h-64 overflow-y-auto p-4 space-y-3">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-3 py-2 rounded-xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 px-4 py-2 rounded-xl text-sm text-gray-400">YazÄ±yor...</div>
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-gray-100 flex gap-2">
                <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChat()}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="MesajÄ±nÄ±zÄ± yazÄ±n..." />
                <button onClick={sendChat}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl text-sm transition-colors">â†’</button>
              </div>
            </div>
          )}
          <button onClick={() => setChatOpen(!chatOpen)}
            className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl shadow-blue-200 flex items-center justify-center text-2xl transition-all hover:scale-110">
            {chatOpen ? 'âœ•' : 'ğŸ’¬'}
          </button>
        </div>
      )}

    </div>
  )
}
