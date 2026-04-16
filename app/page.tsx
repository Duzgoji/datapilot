'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const problems = [
  'Yeni gelen talepler farklı yerlerde kalır, takip kopuyor.',
  'Kimin kimi arayacağı karışır, fırsatlar belirsizleşir.',
  'Hızlı dönüş yapılamadığı için satış fırsatları kaçar.',
  'Satış ekibi dağınık çalışır, koordinasyon zorlaşır.',
  'Yönetici net tabloyu göremez, karar vermek güçleşir.',
  'WhatsApp mesajları karışır, notlar ve takip adımları eksik kalır.',
]

const solutions = [
  'Tüm potansiyel müşteriler tek yerde toplanır.',
  'Doğru kişilerle hızlı şekilde eşleşir.',
  'Süreç adım adım görünür olur.',
  'Ekip aynı düzen içinde çalışır.',
]

const features = [
  {
    icon: '🎯',
    title: 'Hiçbir potansiyel müşteri gözden kaçmaz',
    desc: 'Yeni gelen her talep otomatik olarak sisteme düşer. Hiçbiri arada kaybolmaz, hepsi kayıt altında kalır.',
  },
  {
    icon: '⚡',
    title: 'Satış ekibi daha hızlı çalışır',
    desc: 'Kimin arayacağı ve sıradaki adım net olduğu için zaman kaybı azalır, ekip direkt müşteriyle ilgilenir.',
  },
  {
    icon: '📍',
    title: 'Süreç kontrol altında kalır',
    desc: 'Her potansiyel müşterinin hangi aşamada olduğu kolayca görülür. Nerede takıldığını anında fark edersiniz.',
  },
  {
    icon: '👥',
    title: 'Yönetici tabloyu net görür',
    desc: 'Ekibin yükü, ilerlemesi ve bekleyen işler tek yerde görünür. Karar vermek kolaylaşır.',
  },
  {
    icon: '💬',
    title: 'WhatsApp ile uyumlu çalışır',
    desc: 'Ekibiniz zaten WhatsApp kullanıyor. DataPilot bu alışkanlığı bozmadan, üstüne düzen getirir.',
  },
  {
    icon: '📈',
    title: 'Reklam paranızın karşılığını görürsünüz',
    desc: 'Meta reklamlarından gelen her talebi takip edin. Hangi kampanya satışa dönüşüyor, hangisi para yakıyor — net görürsünüz.',
  },
]

const faqs = [
  {
    q: 'Bu sistem bizim için uygun mu?',
    a: 'Eğer potansiyel müşterileriniz farklı yerlerden geliyor, ekip içinde paylaşım karışıyor ve takipte dağınıklık yaşıyorsanız sizin için uygundur.',
  },
  {
    q: 'Ekibim kullanmakta zorlanır mı?',
    a: 'Hayır. Karmaşık sistemler gibi uzun eğitim gerektirmez. Ekip günlük iş akışına hızlı şekilde uyum sağlar. Çoğu ekip ilk günden itibaren kullanmaya başlar.',
  },
  {
    q: 'Satış ekibine gerçekten hız kazandırır mı?',
    a: 'Evet. Kimin kimi arayacağı, hangi potansiyel müşterinin hangi aşamada olduğu ve sıradaki işlerin ne olduğu net görünür.',
  },
  {
    q: 'Kurulum süreci nasıl ilerliyor?',
    a: 'Önce mevcut satış akışınızı dinliyoruz. Ardından işletmenize uygun düzen belirleniyor ve ekip kullanmaya başlıyor. Genellikle aynı gün kullanıma hazır hale gelir.',
  },
  {
    q: 'Fiyatlandırma nasıl?',
    a: 'İşletmenizin büyüklüğüne ve ihtiyaçlarına göre size özel bir yapı belirliyoruz. Demo alın, birlikte konuşalım.',
  },
]

function DashboardMockup() {
  return (
    <div className="relative mx-auto mt-16 w-full max-w-3xl">
      <div className="absolute inset-0 translate-y-4 scale-95 rounded-3xl bg-blue-500 opacity-10 blur-3xl" />
      <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/50">
        <div className="flex items-center gap-3 border-b border-white/5 bg-[#1a1f2e] px-4 py-3">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500/70" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
            <div className="h-3 w-3 rounded-full bg-green-500/70" />
          </div>
          <div className="mx-4 flex flex-1 items-center gap-2 rounded-md bg-[#252b3b] px-3 py-1">
            <div className="flex h-3 w-3 items-center justify-center rounded-full bg-blue-400/40">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-400/60" />
            </div>
            <span className="font-mono text-xs text-white/30">datapilot.com.tr/dashboard</span>
          </div>
        </div>
        <div className="flex bg-[#0f1422]">
          <div className="flex w-14 flex-shrink-0 flex-col items-center gap-4 border-r border-white/5 bg-[#0a0e1a] py-4">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <span className="text-sm font-bold text-white">D</span>
            </div>
            {['▣', '◈', '◉', '⊞', '◎'].map((icon, i) => (
              <div key={i} className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs ${i === 0 ? 'bg-blue-600/20 text-blue-400' : 'text-white/20'}`}>
                {icon}
              </div>
            ))}
          </div>
          <div className="min-w-0 flex-1 p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="mb-0.5 text-xs text-white/40">Hoş geldiniz,</p>
                <h3 className="text-sm font-semibold text-white">Günaydın, Ahmet Bey 👋</h3>
              </div>
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400">
                + Yeni Potansiyel Müşteri
              </div>
            </div>
            <div className="mb-5 grid grid-cols-4 gap-3">
              {[
                { label: 'Toplam Talep', value: '1.284', change: '+12%' },
                { label: 'Bu Ay', value: '247', change: '+8%' },
                { label: 'Dönüşüm', value: '%34', change: '+3%' },
                { label: 'Bekleyen', value: '58', change: '-5' },
              ].map((stat, i) => (
                <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                  <p className="mb-1 text-[10px] text-white/40">{stat.label}</p>
                  <p className="text-base font-semibold text-white">{stat.value}</p>
                  <p className="mt-0.5 text-[10px] text-green-400">{stat.change} bu ay</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-5 gap-3">
              <div className="col-span-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[11px] font-medium text-white/60">Haftalık Performans</p>
                  <span className="text-[10px] text-blue-400">Son 7 gün</span>
                </div>
                <div className="flex h-16 items-end gap-1.5">
                  {[40, 65, 45, 80, 55, 90, 72].map((h, i) => (
                    <div key={i} className="flex flex-1 flex-col justify-end gap-0.5">
                      <div className={`w-full rounded-sm ${i === 5 ? 'bg-blue-500' : 'bg-white/10'}`} style={{ height: `${h}%` }} />
                      <p className="text-center text-[8px] text-white/20">{['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'][i]}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                <p className="mb-2 text-[11px] font-medium text-white/60">Son Potansiyel Müşteriler</p>
                <div className="space-y-2">
                  {[
                    { name: 'Mehmet Y.', status: 'Yeni' },
                    { name: 'Ayşe K.', status: 'Takipte' },
                    { name: 'Ali R.', status: 'Kapandı' },
                    { name: 'Fatma S.', status: 'Yeni' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[8px] text-white/50">{item.name[0]}</div>
                        <span className="text-[10px] text-white/60">{item.name}</span>
                      </div>
                      <span className="rounded-full bg-blue-500/20 px-1.5 py-0.5 text-[9px] text-blue-400">{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-4 -right-4 flex items-center gap-1.5 rounded-full bg-green-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-green-900/50">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
        Canlı Veri
      </div>
    </div>
  )
}

export default function LandingPage() {
  const router = useRouter()
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactMessage, setContactMessage] = useState('')
  const [contactSent, setContactSent] = useState(false)
  const [demoName, setDemoName] = useState('')
  const [demoPhone, setDemoPhone] = useState('')
  const [demoBusiness, setDemoBusiness] = useState('')

  const scrollToDemo = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    document.getElementById('demo-form')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ── NAV ── */}
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-gray-100/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex cursor-pointer items-center" onClick={() => router.push('/')}>
            <img src="/logo.png" alt="DataPilot" className="h-9 w-auto" />
          </div>
          <div className="hidden items-center gap-8 md:flex">
            {[
              ['#problem', 'Sorun'],
              ['#solution', 'Çözüm'],
              ['#demo-form', 'Demo Al'],
              ['#iletisim', 'İletişim'],
            ].map(([href, label]) => (
              <a key={href} href={href} className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-900">
                {label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/login')}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              Giriş Yap
            </button>
            <a href="#demo-form" onClick={scrollToDemo} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-blue-300">
              Demo Al
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#060c1f] via-[#0a1435] to-[#0d1a45] pb-0 pt-28">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="absolute left-1/2 top-0 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-blue-600 opacity-10 blur-[120px]" />
        <div className="absolute right-10 top-20 h-72 w-72 rounded-full bg-cyan-500 opacity-5 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
            <span className="text-xs font-medium tracking-wide text-blue-300">Hiçbir potansiyel müşteri kaybolmaz. Her şey tek yerde yönetilir.</span>
          </div>

          <h1 className="mb-5 text-5xl font-bold leading-[1.1] tracking-tight text-white md:text-6xl">
            Reklamdan gelen potansiyel müşterileri<br />satışa çevirmenin en kolay yolu
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-slate-300 md:text-xl">
            Talepler otomatik toplanır. Ekibinize dağıtılır. Süreç takip edilir. Kimse gözden kaçmaz.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href="#demo-form" onClick={scrollToDemo} className="inline-flex rounded-xl bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white shadow-xl shadow-blue-900/50 transition-all hover:-translate-y-0.5 hover:bg-blue-500">
              Ücretsiz Demo Al
            </a>
            <a href="https://wa.me/905453467778?text=Merhaba%2C%20DataPilot%20için%20teklif%20almak%20istiyorum." target="_blank" rel="noopener noreferrer" className="rounded-xl border border-white/10 bg-white/5 px-8 py-3.5 text-sm font-medium text-white/80 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white">
              Teklif İste
            </a>
          </div>

          <p className="mt-4 text-center text-xs text-slate-500">Kurulum yok. Uzun eğitim gerekmez. İlk günden çalışır.</p>

          <DashboardMockup />
        </div>

        <div className="mt-16 h-32 bg-gradient-to-b from-transparent to-gray-50" />
      </section>

      {/* ── PROBLEM ── */}
      <section id="problem" className="bg-white py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">Sorun</p>
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-gray-900">"Müşteri nerede kaldı?" diye sormaktan bıktınız mı?</h2>
            <p className="text-lg leading-relaxed text-gray-500">Her gün onlarca talep geliyor. Ama çoğu takipsiz kalıyor. Ekip yoruluyor, sonuç azalıyor. Sorun araçların karmaşıklığında değil — düzenin olmayışında.</p>
          </div>
          <div className="rounded-3xl border border-gray-100 bg-gray-50 p-8">
            <ul className="space-y-4">
              {problems.map((problem) => (
                <li key={problem} className="flex items-start gap-3 text-base text-gray-700">
                  <span className="mt-1 text-red-400">✕</span>
                  <span>{problem}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── ÇÖZÜM ── */}
      <section id="solution" className="bg-gray-50 py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">Çözüm</p>
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-gray-900">DataPilot bu dağınıklığı tek düzene çevirir</h2>
            <p className="text-lg leading-relaxed text-gray-500">Her yeni talep görünür olur. Doğru kişiye yönlenir. Süreç adım adım ilerler. Yönetici de ekip de aynı tabloya bakar. Karmaşık bir CRM değil — gerçekten kullanılan bir satış aracı.</p>
          </div>
          <div className="space-y-4 rounded-3xl border border-blue-100 bg-white p-8 shadow-sm shadow-blue-50">
            {solutions.map((item, index) => (
              <div key={item} className="flex items-start gap-4 rounded-2xl border border-gray-100 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">0{index + 1}</div>
                <p className="pt-1 text-base text-gray-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAYDALAR ── */}
      <section id="ozellikler" className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">Neden Önemli?</p>
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-gray-900">Sonuç üreten faydalar</h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-500">Gösterişli ekranlar için değil — daha hızlı dönüş, daha düzenli takip ve daha kontrollü bir satış operasyonu için.</p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="group rounded-2xl border border-gray-100 bg-gray-50 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-blue-100 hover:bg-white hover:shadow-xl hover:shadow-blue-50">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl transition-colors group-hover:bg-blue-100">{feature.icon}</div>
                <h3 className="mb-2 text-base font-bold text-gray-900">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NASIL ÇALIŞIR ── */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">Nasıl Çalışır?</p>
            <h2 className="text-4xl font-bold tracking-tight text-gray-900">3 adımda başlarsınız</h2>
          </div>
          <div className="relative grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              { num: '01', title: 'Bağlayın', desc: 'Reklam hesabınızı, WhatsApp hattınızı veya web formunuzu bağlayın. Gelen talepler otomatik sisteme düşer.' },
              { num: '02', title: 'Dağıtın', desc: 'Her talep doğru satışçıya atanır. Şube bazında, ekip bazında — siz belirlersiniz.' },
              { num: '03', title: 'Takip Edin', desc: 'Kim ne yaptı, hangi müşteri kapanmak üzere, nerede takıldı — tek ekranda görürsünüz.' },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="relative z-10 mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-200">
                  <span className="text-2xl font-bold text-white">{step.num}</span>
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-900">{step.title}</h3>
                <p className="mx-auto max-w-xs text-sm leading-relaxed text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NEDEN DATAPILOT ── */}
      <section className="bg-gray-50 py-24">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">Neden DataPilot?</p>
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-gray-900">Büyük CRM araçları gibi değildir</h2>
          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-gray-500">Uzun eğitimler gerektiren ağır sistemler yerine, ekibinizin gerçekten kullanacağı sade bir yapı sunar. Türkiye'deki satış ekiplerinin çalışma şekline göre tasarlandı.</p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { icon: '🚀', title: 'Aynı gün kurulur', desc: 'Haftalarca süren kurulum yok. Aynı gün kullanıma hazır.' },
              { icon: '👥', title: 'Ekip hemen alışır', desc: 'Karmaşık eğitim gerekmez. Çoğu ekip ilk günden adapte olur.' },
              { icon: '🎯', title: 'Sadece işe yarayan özellikler', desc: 'Gereksiz karmaşıklık yok. Satışa odaklı, sade ve etkili.' },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-gray-100 bg-white p-6 text-left shadow-sm shadow-blue-50">
                <div className="mb-3 text-2xl">{item.icon}</div>
                <h3 className="mb-2 text-sm font-bold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GÜVEN ── */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">Güven</p>
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-gray-900">Kullanıcılarımız ne diyor?</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { quote: 'İlk günden mantıklı geldi. Ekibimiz hemen alıştı, artık hiç karışıklık yok.', name: 'Satış Müdürü', company: 'Sağlık Sektörü' },
              { quote: 'Artık "o müşteri ne oldu" diye sormuyorum — bakıyorum, her şey önümde.', name: 'İşletme Sahibi', company: 'Estetik Klinik' },
              { quote: 'Reklam bütçemizin nereye gittiğini ilk kez bu kadar net gördük.', name: 'Pazarlama Direktörü', company: 'Emlak Şirketi' },
            ].map((item, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                <p className="mb-4 text-sm leading-relaxed text-gray-700 italic">"{item.quote}"</p>
                <div>
                  <p className="text-sm font-bold text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BAND ── */}
      <section id="demo-form" className="bg-blue-600 py-20 text-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-100">Hemen Başlayın</p>
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">Satış ekibiniz daha hızlı çalışsın.<br />Hiçbir potansiyel müşteri kaybolmasın.</h2>
            <p className="text-sm leading-relaxed text-blue-50 md:text-base">Daha düzenli, daha kontrollü ve daha güçlü bir satış operasyonu kurmak için kısa bir görüşme ile başlayın.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="#demo-form-card" className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50">Ücretsiz Demo Al</a>
            <a href="https://wa.me/905453467778?text=Merhaba%2C%20DataPilot%20için%20teklif%20almak%20istiyorum." target="_blank" rel="noopener noreferrer" className="rounded-xl border border-white/25 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10">Teklif İste</a>
          </div>
        </div>
      </section>

      {/* ── DEMO FORM ── */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-lg px-6">
          <div className="mb-10 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">Demo</p>
            <h2 className="mb-3 text-3xl font-bold tracking-tight text-gray-900">Demo Talebi</h2>
            <p className="text-base text-gray-500">Formu doldurun, sizi arayalım ve işletmenize uygun akışı birlikte netleştirelim.</p>
          </div>
          <div id="demo-form-card" className="space-y-4 rounded-2xl border border-gray-100 bg-white p-8">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">Ad Soyad</label>
              <input value={demoName} onChange={(e) => setDemoName(e.target.value)} placeholder="Adınız Soyadınız" className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">Telefon</label>
              <input value={demoPhone} onChange={(e) => setDemoPhone(e.target.value)} placeholder="05XX XXX XX XX" className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">İşletme Adı</label>
              <input value={demoBusiness} onChange={(e) => setDemoBusiness(e.target.value)} placeholder="Şirket / İşletme Adı" className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button
              onClick={() => {
                alert('Talebiniz alındı, en kısa sürede sizinle iletişime geçeceğiz.')
                setDemoName('')
                setDemoPhone('')
                setDemoBusiness('')
              }}
              className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-700 hover:shadow-blue-200"
            >
              Demo Talebi Gönder
            </button>
            <p className="text-center text-xs text-gray-400">
              Fiyat görüşmesi yapmak ister misiniz?{' '}
              <a href="https://wa.me/905453467778?text=Merhaba%2C%20DataPilot%20için%20teklif%20almak%20istiyorum." target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Teklif İste →
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ── SSS ── */}
      <section id="sss" className="bg-white py-24">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">Sorular</p>
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-gray-900">Sıkça Sorulan Sorular</h2>
            <p className="text-lg text-gray-500">Aklınızdaki soruların cevapları burada</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className={`overflow-hidden rounded-2xl border transition-all ${openFaq === i ? 'border-blue-100 shadow-md shadow-blue-50' : 'border-gray-100'}`}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-gray-50/50">
                  <span className="pr-4 text-sm font-medium text-gray-900">{faq.q}</span>
                  <span className={`flex-shrink-0 text-gray-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}>▼</span>
                </button>
                {openFaq === i && (
                  <div className="border-t border-gray-50 px-6 pb-5">
                    <p className="pt-4 text-sm leading-relaxed text-gray-500">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── İLETİŞİM ── */}
      <section id="iletisim" className="bg-white py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">İletişim</p>
            <h2 className="text-4xl font-bold tracking-tight text-gray-900">Bize Ulaşın</h2>
          </div>
          <div className="grid grid-cols-1 items-start gap-12 md:grid-cols-2">
            <div>
              <p className="mb-8 text-lg leading-relaxed text-gray-500">Sorularınız için bize yazın, en kısa sürede dönüş yapalım.</p>
              <div className="space-y-5">
                {[
                  { icon: '📧', label: 'E-posta', value: 'destek@datapilot.com.tr' },
                  { icon: '📞', label: 'Telefon', value: '+90 (212) 000 00 00' },
                  { icon: '📍', label: 'Adres', value: 'İstanbul, Türkiye' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-4">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg">{item.icon}</div>
                    <div>
                      <p className="text-xs font-medium text-gray-400">{item.label}</p>
                      <p className="text-sm font-semibold text-gray-900">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-7">
              {contactSent ? (
                <div className="py-10 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-3xl">✅</div>
                  <h3 className="mb-2 text-lg font-bold text-gray-900">Mesajınız alındı</h3>
                  <p className="text-sm text-gray-500">En kısa sürede size dönüş yapacağız.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600">Adınız</label>
                    <input value={contactName} onChange={(e) => setContactName(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ad Soyad" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600">E-posta</label>
                    <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="ornek@email.com" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600">Mesajınız</label>
                    <textarea value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} rows={4} className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nasıl yardımcı olabiliriz?" />
                  </div>
                  <button onClick={() => setContactSent(true)} className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-700 hover:shadow-blue-200">
                    Gönder
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#070d20] py-14 text-slate-500">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-10 grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="col-span-2 md:col-span-1">
              <div className="mb-4 flex cursor-pointer items-center gap-2" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <img src="/logo2.png" alt="DataPilot" className="h-8 w-auto" />
              </div>
              <p className="text-sm leading-relaxed">Akıllı potansiyel müşteri yönetim platformu.<br />Satış operasyonunuzu sadeleştirin.</p>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold text-slate-300">Ürün</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#problem" className="transition-colors hover:text-white">Sorun</a></li>
                <li><a href="#solution" className="transition-colors hover:text-white">Çözüm</a></li>
                <li><a href="#demo-form" className="transition-colors hover:text-white">Demo Al</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold text-slate-300">Şirket</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#iletisim" className="transition-colors hover:text-white">İletişim</a></li>
                <li><a href="#sss" className="transition-colors hover:text-white">SSS</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold text-slate-300">Hesap</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="/login" className="transition-colors hover:text-white">Giriş Yap</a></li>
                <li><a href="#demo-form" className="transition-colors hover:text-white">Teklif İste</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 pt-6">
            <p className="text-sm">DataPilot © 2026 — Tüm hakları saklıdır.</p>
            <p className="text-sm">İstanbul, Türkiye</p>
          </div>
        </div>
      </footer>

    </div>
  )
}