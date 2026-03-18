'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const faqs = [
  {
    q: 'DataPilot hangi platformlarla entegre çalışır?',
    a: 'Facebook, Instagram (Meta) reklamları ile tam entegrasyon sağlar. Ayrıca Excel dosyası yükleme ve manuel veri girişi de desteklenir.'
  },
  {
    q: 'Lead verilerim güvende mi?',
    a: 'Tüm verileriniz SSL şifreli bağlantı üzerinden iletilir ve güvenli sunucularda saklanır. Verilerinize yalnızca siz ve yetkilendirdiğiniz kişiler erişebilir.'
  },
  {
    q: 'Kaç kullanıcı ekleyebilirim?',
    a: 'Seçtiğiniz pakete göre değişir. Starter pakette 3, Pro pakette 15, Enterprise pakette sınırsız kullanıcı ekleyebilirsiniz.'
  },
  {
    q: 'Deneme süresi var mı?',
    a: 'Evet! Tüm paketlerde 14 günlük ücretsiz deneme sunuyoruz. Kredi kartı gerekmez.'
  },
  {
    q: 'İstediğim zaman iptal edebilir miyim?',
    a: 'Evet, istediğiniz zaman iptal edebilirsiniz. Taahhüt yoktur, aylık ödeme yaparsınız.'
  },
]

const plans = [
  {
    name: 'Starter',
    price: '₺990',
    period: '/ay',
    desc: 'Küçük ekipler için ideal başlangıç paketi',
    highlight: false,
    features: ['3 kullanıcı', '1 şube', '500 lead/ay', 'Meta entegrasyonu', 'Excel yükleme', 'Temel raporlar']
  },
  {
    name: 'Pro',
    price: '₺2.490',
    period: '/ay',
    desc: 'Büyüyen işletmeler için güçlü özellikler',
    highlight: true,
    features: ['15 kullanıcı', '5 şube', 'Sınırsız lead', 'Meta entegrasyonu', 'Excel yükleme', 'AI analitik & raporlar', 'Öncelikli destek']
  },
  {
    name: 'Enterprise',
    price: 'Özel Fiyat',
    period: '',
    desc: 'Büyük kurumlar için özelleştirilebilir çözüm',
    highlight: false,
    features: ['Sınırsız kullanıcı', 'Sınırsız şube', 'Sınırsız lead', 'Tüm entegrasyonlar', 'Özel AI modeli', 'Dedicated destek', 'SLA garantisi']
  },
]

const features = [
  { icon: '📣', title: 'Meta Entegrasyonu', desc: 'Facebook ve Instagram reklamlarından gelen leadleri anında ve otomatik olarak sisteme çekin.' },
  { icon: '🤖', title: 'AI Analitik', desc: 'Yapay zeka destekli raporlarla satış performansınızı anlayın, eksiklerinizi görün.' },
  { icon: '👥', title: 'Ekip Yönetimi', desc: 'Şubelerinizi ve satışçılarınızı tek panelden yönetin, leadleri otomatik dağıtın.' },
  { icon: '📂', title: 'Veri Merkezi', desc: 'Excel dosyalarınızı yükleyin, otomatik olarak leadlere dönüştürün.' },
  { icon: '📊', title: 'Gelişmiş Raporlar', desc: 'Günlük, haftalık ve aylık raporlarla işinizin nabzını tutun.' },
  { icon: '🔒', title: 'Güvenli & Hızlı', desc: 'SSL şifreli bağlantı, güvenli veri saklama ve yüksek performanslı altyapı.' },
]

// Dashboard Mockup SVG Component
function DashboardMockup() {
  return (
    <div className="relative w-full max-w-3xl mx-auto mt-16">
      {/* Glow effect behind mockup */}
      <div className="absolute inset-0 bg-blue-500 opacity-10 blur-3xl rounded-3xl scale-95 translate-y-4" />
      
      {/* Browser chrome */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
        {/* Browser top bar */}
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

        {/* Dashboard UI */}
        <div className="bg-[#0f1422] flex">
          {/* Sidebar */}
          <div className="w-14 bg-[#0a0e1a] flex flex-col items-center py-4 gap-4 border-r border-white/5 flex-shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mb-2">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            {['▣', '◈', '◉', '⊞', '◎'].map((icon, i) => (
              <div key={i} className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs cursor-pointer transition-all
                ${i === 0 ? 'bg-blue-600/20 text-blue-400' : 'text-white/20 hover:text-white/40'}`}>
                {icon}
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 p-5 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-white/40 text-xs mb-0.5">Hoş geldiniz,</p>
                <h3 className="text-white font-semibold text-sm">Günaydın, Ahmet Bey 👋</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-1.5 text-blue-400 text-xs font-medium">
                  + Yeni Lead
                </div>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-4 gap-3 mb-5">
              {[
                { label: 'Toplam Lead', value: '1.284', change: '+12%', up: true, color: 'blue' },
                { label: 'Bu Ay', value: '247', change: '+8%', up: true, color: 'green' },
                { label: 'Dönüşüm', value: '%34', change: '+3%', up: true, color: 'purple' },
                { label: 'Bekleyen', value: '58', change: '-5', up: false, color: 'orange' },
              ].map((stat, i) => (
                <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                  <p className="text-white/40 text-[10px] mb-1">{stat.label}</p>
                  <p className="text-white font-semibold text-base">{stat.value}</p>
                  <p className={`text-[10px] mt-0.5 ${stat.up ? 'text-green-400' : 'text-red-400'}`}>{stat.change} bu ay</p>
                </div>
              ))}
            </div>

            {/* Chart + Lead list */}
            <div className="grid grid-cols-5 gap-3">
              {/* Mini bar chart */}
              <div className="col-span-3 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-white/60 text-[11px] font-medium">Haftalık Lead Trendi</p>
                  <span className="text-blue-400 text-[10px]">Son 7 gün</span>
                </div>
                <div className="flex items-end gap-1.5 h-16">
                  {[40, 65, 45, 80, 55, 90, 72].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end gap-0.5">
                      <div
                        className={`rounded-sm w-full transition-all ${i === 5 ? 'bg-blue-500' : 'bg-white/10'}`}
                        style={{ height: `${h}%` }}
                      />
                      <p className="text-white/20 text-[8px] text-center">
                        {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'][i]}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lead list */}
              <div className="col-span-2 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                <p className="text-white/60 text-[11px] font-medium mb-2">Son Leadler</p>
                <div className="space-y-2">
                  {[
                    { name: 'Mehmet Y.', status: 'Yeni', color: 'blue' },
                    { name: 'Ayşe K.', status: 'Takipte', color: 'yellow' },
                    { name: 'Ali R.', status: 'Satıldı', color: 'green' },
                    { name: 'Fatma S.', status: 'Yeni', color: 'blue' },
                  ].map((lead, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[8px] text-white/50">
                          {lead.name[0]}
                        </div>
                        <span className="text-white/60 text-[10px]">{lead.name}</span>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full 
                        ${lead.color === 'blue' ? 'bg-blue-500/20 text-blue-400' : 
                          lead.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' : 
                          'bg-green-500/20 text-green-400'}`}>
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

      {/* Floating badge */}
      <div className="absolute -bottom-4 -right-4 bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-green-900/50 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
        Canlı Veri
      </div>
    </div>
  )
}

export default function LandingPage() {
  const router = useRouter()
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<{ role: string, text: string }[]>([
    { role: 'ai', text: 'Merhaba! DataPilot hakkında merak ettiğiniz her şeyi sorabilirsiniz 😊' }
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactMessage, setContactMessage] = useState('')
  const [contactSent, setContactSent] = useState(false)

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
      setChatMessages(prev => [...prev, { role: 'ai', text: 'Bir hata oluştu, lütfen tekrar deneyin.' }])
    }
    setChatLoading(false)
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ─── NAVBAR ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100/80">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/logo.png" alt="DataPilot" className="h-9 w-auto" />
          </div>
          <div className="hidden md:flex items-center gap-8">
            {[['#ozellikler', 'Özellikler'], ['#paketler', 'Fiyatlar'], ['#sss', 'SSS'], ['#iletisim', 'İletişim']].map(([href, label]) => (
              <a key={href} href={href} className="text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors">{label}</a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push('/login')}
              className="text-gray-600 hover:text-gray-900 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
              Giriş Yap
            </button>
            <button onClick={() => router.push('/register')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-all shadow-md shadow-blue-200 hover:shadow-blue-300">
              Üye Ol →
            </button>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative pt-28 pb-0 overflow-hidden bg-gradient-to-b from-[#060c1f] via-[#0a1435] to-[#0d1a45]">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
        {/* Radial glow center */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600 opacity-10 blur-[120px] rounded-full" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-purple-600 opacity-5 blur-3xl rounded-full" />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm rounded-full px-4 py-1.5 mb-7">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span className="text-blue-300 text-xs font-medium tracking-wide">Meta & Instagram Entegrasyonu Aktif</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-5 leading-[1.1] tracking-tight">
            Leadlerinizi{' '}
            <span className="relative">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">akıllıca</span>
            </span>
            {' '}yönetin
          </h1>
          <p className="text-slate-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            Meta reklamlarından gelen leadleri otomatik toplayın, ekibinize dağıtın ve satışa dönüştürün.
          </p>

          {/* CTA buttons */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button onClick={() => router.push('/register')}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-xl shadow-blue-900/50 text-sm hover:-translate-y-0.5">
              Ücretsiz Başlayın →
            </button>
            <button onClick={() => router.push('/login')}
              className="border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-medium px-8 py-3.5 rounded-xl transition-all text-sm backdrop-blur-sm">
              Giriş Yap
            </button>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-10 mt-12 flex-wrap">
            {[
              { value: '10K+', label: 'Lead Yönetildi' },
              { value: '%34', label: 'Dönüşüm Artışı' },
              { value: '500+', label: 'Başarılı Firma' },
              { value: '14 Gün', label: 'Ücretsiz Deneme' },
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

      {/* ─── ÖZELLİKLER ─── */}
      <section id="ozellikler" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-3">Platform</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Her şey tek platformda</h2>
            <p className="text-gray-500 max-w-xl mx-auto text-lg">Lead yönetiminden analitiğe kadar ihtiyacınız olan her şey</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div key={f.title} className="group bg-white rounded-2xl p-7 border border-gray-100 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-50 transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 bg-blue-50 group-hover:bg-blue-100 rounded-xl flex items-center justify-center text-2xl mb-5 transition-colors">{f.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2 text-base">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-3">Nasıl Çalışır?</p>
            <h2 className="text-4xl font-bold text-gray-900 tracking-tight">3 adımda başlayın</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px bg-gradient-to-r from-blue-100 via-blue-200 to-blue-100" />
            {[
              { num: '01', title: 'Bağlanın', desc: 'Meta reklamlarınızı birkaç tıkla DataPilot\'a bağlayın.' },
              { num: '02', title: 'Otomatize Edin', desc: 'Leadler anında sisteme düşer, ekibinize otomatik dağıtılır.' },
              { num: '03', title: 'Büyüyün', desc: 'AI destekli analizlerle satışlarınızı optimize edin.' },
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

      {/* ─── PAKETLER ─── */}
      <section id="paketler" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-3">Fiyatlandırma</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Şeffaf fiyatlandırma</h2>
            <p className="text-gray-500 text-lg">14 gün ücretsiz deneyin, kredi kartı gerekmez</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(plan => (
              <div key={plan.name} className={`rounded-2xl p-8 relative transition-all ${
                plan.highlight
                  ? 'bg-blue-600 shadow-2xl shadow-blue-200 scale-[1.02]'
                  : 'bg-white border border-gray-100 shadow-sm hover:shadow-md'
              }`}>
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">En Popüler</span>
                  </div>
                )}
                <h3 className={`font-bold text-xl mb-1 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                <p className={`text-sm mb-5 ${plan.highlight ? 'text-blue-200' : 'text-gray-400'}`}>{plan.desc}</p>
                <div className="flex items-end gap-1 mb-7">
                  <span className={`text-4xl font-bold tracking-tight ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.price}</span>
                  <span className={`text-sm mb-1 ${plan.highlight ? 'text-blue-200' : 'text-gray-400'}`}>{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className={`flex items-center gap-2.5 text-sm ${plan.highlight ? 'text-blue-100' : 'text-gray-600'}`}>
                      <span className={`font-bold text-base flex-shrink-0 ${plan.highlight ? 'text-white' : 'text-blue-500'}`}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => router.push('/register')}
                  className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all ${
                    plan.highlight
                      ? 'bg-white text-blue-600 hover:bg-blue-50 shadow-lg'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-100'
                  }`}>
                  {plan.name === 'Enterprise' ? 'Teklif Alın' : '14 Gün Ücretsiz Dene'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SSS ─── */}
      <section id="sss" className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-3">Sorular</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Sıkça Sorulan Sorular</h2>
            <p className="text-gray-500 text-lg">Aklınızdaki soruların cevapları burada</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className={`rounded-2xl border transition-all overflow-hidden ${openFaq === i ? 'border-blue-100 shadow-md shadow-blue-50' : 'border-gray-100'}`}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50/50 transition-colors">
                  <span className="font-medium text-gray-900 text-sm pr-4">{faq.q}</span>
                  <span className={`text-gray-400 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}>▼</span>
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

      {/* ─── CTA BANNER ─── */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-300 opacity-10 rounded-full blur-3xl" />
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">Hemen başlayın, 14 gün ücretsiz</h2>
          <p className="text-blue-200 text-lg mb-8">Kredi kartı gerekmez. İstediğiniz zaman iptal edin.</p>
          <button onClick={() => router.push('/register')}
            className="bg-white hover:bg-blue-50 text-blue-700 font-bold px-10 py-4 rounded-xl transition-all shadow-xl text-base hover:-translate-y-0.5">
            Ücretsiz Hesap Oluştur →
          </button>
        </div>
      </section>

      {/* ─── İLETİŞİM ─── */}
      <section id="iletisim" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-3">İletişim</p>
            <h2 className="text-4xl font-bold text-gray-900 tracking-tight">Bize Ulaşın</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-gray-500 mb-8 text-lg leading-relaxed">Sorularınız için bize yazın, en kısa sürede dönüş yapalım.</p>
              <div className="space-y-5">
                {[
                  { icon: '📧', label: 'E-posta', value: 'destek@datapilot.com.tr' },
                  { icon: '📞', label: 'Telefon', value: '+90 (212) 000 00 00' },
                  { icon: '📍', label: 'Adres', value: 'İstanbul, Türkiye' },
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
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">✅</div>
                  <h3 className="font-bold text-gray-900 mb-2 text-lg">Mesajınız alındı!</h3>
                  <p className="text-gray-500 text-sm">En kısa sürede size dönüş yapacağız.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Adınız</label>
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
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mesajınız</label>
                    <textarea value={contactMessage} onChange={e => setContactMessage(e.target.value)} rows={4}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all resize-none"
                      placeholder="Nasıl yardımcı olabiliriz?" />
                  </div>
                  <button onClick={() => setContactSent(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-100 hover:shadow-blue-200">
                    Gönder →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-[#070d20] text-slate-500 py-14">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo2.png" alt="DataPilot" className="h-8 w-auto" />
              </div>
              <p className="text-sm leading-relaxed">Akıllı lead yönetim platformu.<br />İşinizi büyütün.</p>
            </div>
            <div>
              <h4 className="text-slate-300 font-semibold text-sm mb-4">Ürün</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#ozellikler" className="hover:text-white transition-colors">Özellikler</a></li>
                <li><a href="#paketler" className="hover:text-white transition-colors">Fiyatlar</a></li>
                <li><a href="#sss" className="hover:text-white transition-colors">SSS</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-slate-300 font-semibold text-sm mb-4">Şirket</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#iletisim" className="hover:text-white transition-colors">İletişim</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Gizlilik Politikası</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Kullanım Koşulları</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-slate-300 font-semibold text-sm mb-4">Hesap</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="/login" className="hover:text-white transition-colors">Giriş Yap</a></li>
                <li><a href="/register" className="hover:text-white transition-colors">Üye Ol</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 flex items-center justify-between flex-wrap gap-4">
            <p className="text-sm">DataPilot © 2026 — Tüm hakları saklıdır.</p>
            <p className="text-sm">İstanbul, Türkiye</p>
          </div>
        </div>
      </footer>

      {/* ─── AI DESTEK CHAT ─── */}
      <div className="fixed bottom-6 right-6 z-50">
        {chatOpen && (
          <div className="mb-4 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-sm">🤖</div>
                <div>
                  <p className="text-white font-semibold text-sm">DataPilot Destek</p>
                  <p className="text-blue-200 text-xs">AI Destekli</p>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-white/70 hover:text-white transition-colors">✕</button>
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
                  <div className="bg-gray-100 px-4 py-2 rounded-xl text-sm text-gray-400">Yazıyor...</div>
                </div>
              )}
            </div>
            <div className="p-3 border-t border-gray-100 flex gap-2">
              <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChat()}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mesajınızı yazın..." />
              <button onClick={sendChat}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl text-sm transition-colors">→</button>
            </div>
          </div>
        )}
        <button onClick={() => setChatOpen(!chatOpen)}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl shadow-blue-200 flex items-center justify-center text-2xl transition-all hover:scale-110">
          {chatOpen ? '✕' : '💬'}
        </button>
      </div>

    </div>
  )
}