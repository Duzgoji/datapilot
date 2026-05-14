'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
            <span className="font-mono text-xs text-white/30">datapilottr.online/dashboard</span>
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
                <h3 className="text-sm font-semibold text-white">Günaydın, Dr. Ahmet Bey 👋</h3>
              </div>
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400">
                + Yeni Potansiyel Müşteri
              </div>
            </div>
            <div className="mb-5 grid grid-cols-4 gap-3">
              {[
                { label: 'Toplam Potansiyel', value: '1.284', change: '+12%' },
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
                    { name: 'Mehmet Y.', status: 'Yeni', color: 'bg-blue-500/20 text-blue-400' },
                    { name: 'Ayşe K.', status: 'Randevu', color: 'bg-violet-500/20 text-violet-400' },
                    { name: 'Ali R.', status: 'Satış', color: 'bg-emerald-500/20 text-emerald-400' },
                    { name: 'Fatma S.', status: 'Yeni', color: 'bg-blue-500/20 text-blue-400' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[8px] text-white/50">{item.name[0]}</div>
                        <span className="text-[10px] text-white/60">{item.name}</span>
                      </div>
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${item.color}`}>{item.status}</span>
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
        Canlı Takip
      </div>
    </div>
  )
}

export default function LandingPage() {
  const router = useRouter()
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [demoName, setDemoName] = useState('')
  const [demoPhone, setDemoPhone] = useState('')
  const [demoBusiness, setDemoBusiness] = useState('')
  const [demoSector, setDemoSector] = useState('')

  const scrollToDemo = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    document.getElementById('demo-form')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleDemoSubmit = () => {
    if (!demoName || !demoPhone) { alert('Lütfen ad soyad ve telefon numaranızı girin.'); return }
    const message = `Merhaba, DataPilot demo talebi:%0AAd Soyad: ${encodeURIComponent(demoName)}%0ATelefon: ${encodeURIComponent(demoPhone)}%0AİşletMe: ${encodeURIComponent(demoBusiness)}%0ASektör: ${encodeURIComponent(demoSector)}`
    window.open(`https://wa.me/905453467778?text=${message}`, '_blank')
    setDemoName(''); setDemoPhone(''); setDemoBusiness(''); setDemoSector('')
  }

  const problems = [
    { icon: '😰', text: 'Meta reklamından ya da Instagram\'dan potansiyel müşteri geliyor — ama kim takip edecek belli değil.' },
    { icon: '📱', text: 'WhatsApp mesajları birikiyor, satışçılar kendi telefonlarından takip ediyor, hiçbir şey kayıt altında değil.' },
    { icon: '🤷', text: 'Kliniğinize randevu almak isteyen biri arandı mı, ne zaman arandı, sonuç ne oldu — kimse bilmiyor.' },
    { icon: '📊', text: 'Reklama para harcıyorsunuz ama kaçı gerçek hastaya dönüştü, hiç göremiyorsunuz.' },
    { icon: '⏰', text: 'Satışçı hangi potansiyel müşteriyi arayacak, sırada ne var — her gün sıfırdan başlıyor.' },
    { icon: '💸', text: 'Fırsatlar gözden kaçıyor, takipsiz kalan potansiyel müşteriler rakibe gidiyor.' },
  ]

  const features = [
    {
      icon: '🎯',
      title: 'Her kanaldan gelen talepler tek yerde toplanır',
      desc: 'Meta reklamı, Instagram DM, WhatsApp mesajı, web sitesi formu — nereden gelirse gelsin, hepsi otomatik olarak sisteme düşer. Hiçbir potansiyel müşteri gözden kaçmaz.',
    },
    {
      icon: '⚡',
      title: 'Doğru satışçıya otomatik atanır',
      desc: 'Gelen potansiyel müşteri saniyeler içinde uygun satışçıya atanır. Satışçı bildirim alır, hemen harekete geçer. Bekleme süresi sıfıra iner.',
    },
    {
      icon: '📍',
      title: 'Süreç adım adım takip edilir',
      desc: 'Yeni geldi, arandı, randevu alındı, satışa dönüştü — her adım kayıt altında. Hangi potansiyel müşteri nerede takılı kaldı, anında görürsünüz.',
    },
    {
      icon: '👥',
      title: 'Yönetici her şeyi tek ekrandan görür',
      desc: 'Kim kaç arama yaptı, kaç randevu aldı, kaç satış kapattı. Şube bazında performans. Günlük, haftalık, aylık raporlar. Tahmin yok, netlik var.',
    },
    {
      icon: '💬',
      title: 'Meta & WhatsApp entegrasyonu',
      desc: 'Meta reklam formlarından gelen potansiyel müşteriler anında sisteme düşer. WhatsApp\'tan yazanlar da. Siz sadece takip edin.',
    },
    {
      icon: '📈',
      title: 'Reklam paranızın karşılığını görün',
      desc: 'Hangi kampanyadan kaç potansiyel müşteri geldi, kaçı randevuya dönüştü, kaçı satışa kapandı. CPL, ROI, dönüşüm oranı — hepsi tek ekranda.',
    },
  ]

  const sectors = [
    { icon: '💉', name: 'Medikal Estetik' },
    { icon: '🦷', name: 'Diş Kliniği' },
    { icon: '💇', name: 'Saç Ekim' },
    { icon: '👁️', name: 'Göz Kliniği' },
    { icon: '✨', name: 'Güzellik Merkezi' },
    { icon: '🏥', name: 'Özel Klinik' },
  ]

  const faqs = [
    {
      q: 'Kliniğimizde kaç kişi kullanabilir?',
      a: 'Sınırsız. Sınırsız şube, sınırsız satışçı, sınırsız potansiyel müşteri. Büyüdükçe sistem sizinle büyür.',
    },
    {
      q: 'Meta reklamlarımızla entegre çalışır mı?',
      a: 'Evet. Meta reklam formlarınızdan gelen potansiyel müşteriler anında sisteme düşer. Webhook entegrasyonu ile gerçek zamanlı çalışır.',
    },
    {
      q: 'Ekibimiz alışmakta zorlanır mı?',
      a: 'Hayır. Arayüz Türkçe, sade ve mobil uyumlu. Çoğu ekip ilk günden kullanmaya başlar. Uzun eğitim gerekmez.',
    },
    {
      q: 'Kurulum ne kadar sürer?',
      a: 'Aynı gün kurulur. Bir görüşme yapıyoruz, sistemin kurulumunu biz yapıyoruz, ekibiniz aynı gün kullanmaya başlıyor.',
    },
    {
      q: 'Fiyatlandırma nasıl?',
      a: 'İşletmenizin büyüklüğüne ve ihtiyaçlarına göre size özel fiyat belirliyoruz. Demo alın, birlikte konuşalım.',
    },
    {
      q: 'Verilerimiz güvende mi?',
      a: 'Evet. Tüm veriler Türkiye\'de saklanır. SSL şifreleme, RLS güvenlik katmanı ve düzenli yedekleme ile korunur.',
    },
  ]

  return (
    <div className="min-h-screen bg-white">

      {/* NAV */}
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-gray-100/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex cursor-pointer items-center" onClick={() => router.push('/')}>
            <img src="/logo.png" alt="DataPilot" className="h-9 w-auto" />
          </div>
          <div className="hidden items-center gap-8 md:flex">
            {[
              ['#sorun', 'Sorun'],
              ['#ozellikler', 'Özellikler'],
              ['#demo-form', 'Demo Al'],
              ['#sss', 'SSS'],
            ].map(([href, label]) => (
              <a key={href} href={href} className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-900">
                {label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push('/login')}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100">
              Giriş Yap
            </button>
            <a href="#demo-form" onClick={scrollToDemo}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-blue-200 transition-all hover:bg-blue-700">
              Demo Al
            </a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#060c1f] via-[#0a1435] to-[#0d1a45] pb-0 pt-28">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="absolute left-1/2 top-0 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-blue-600 opacity-10 blur-[120px]" />

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
            <span className="text-xs font-medium text-blue-300">
              Klinikler için potansiyel müşteri yönetim platformu
            </span>
          </div>

          <h1 className="mb-5 text-5xl font-bold leading-[1.1] tracking-tight text-white md:text-6xl">
            Reklamdan gelen her potansiyel müşteriyi<br />
            <span className="text-blue-400">satışa çevirin</span>
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-slate-300">
            Meta reklamı, Instagram DM, WhatsApp — nereden gelirse gelsin, her talep otomatik toplanır, doğru satışçıya atanır, süreç takip edilir.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href="#demo-form" onClick={scrollToDemo}
              className="inline-flex rounded-xl bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white shadow-xl shadow-blue-900/50 transition-all hover:-translate-y-0.5 hover:bg-blue-500">
              Ücretsiz Demo Al
            </a>
            <a href="https://wa.me/905453467778?text=Merhaba%2C%20DataPilot%20hakkında%20bilgi%20almak%20istiyorum."
              target="_blank" rel="noopener noreferrer"
              className="rounded-xl border border-white/10 bg-white/5 px-8 py-3.5 text-sm font-medium text-white/80 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white">
              WhatsApp ile Ulaşın
            </a>
          </div>

          <p className="mt-4 text-center text-xs text-slate-500">
            14 gün ücretsiz · Aynı gün kurulum · Kredi kartı gerekmez
          </p>

          <DashboardMockup />
        </div>

        <div className="mt-16 h-32 bg-gradient-to-b from-transparent to-gray-50" />
      </section>

      {/* SEKTÖRLER */}
      <section className="bg-gray-50 py-12">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="mb-8 text-sm font-medium text-gray-400">Hangi sektörler kullanıyor?</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {sectors.map((s, i) => (
              <div key={i} className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-sm">
                <span>{s.icon}</span>
                <span className="text-sm font-medium text-gray-700">{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SORUN */}
      <section id="sorun" className="bg-white py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-red-500">Tanıdık geliyor mu?</p>
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-gray-900">
              Kliniğinizde bunlar oluyor mu?
            </h2>
            <p className="text-lg text-gray-500">
              Reklama para harcıyorsunuz ama potansiyel müşteriler kayboluyor.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {problems.map((p, i) => (
              <div key={i} className="flex gap-4 rounded-2xl border border-red-50 bg-red-50/50 p-5">
                <span className="text-2xl flex-shrink-0">{p.icon}</span>
                <p className="text-sm leading-relaxed text-gray-700">{p.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-6 py-3">
              <span className="text-sm font-semibold text-white">DataPilot bunu çözer.</span>
              <span className="text-blue-400">→</span>
            </div>
          </div>
        </div>
      </section>

      {/* ÖZELLİKLER */}
      <section id="ozellikler" className="bg-gray-50 py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">Özellikler</p>
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-gray-900">
              Klinik yönetimini kolaylaştıran her şey
            </h2>
            <p className="text-lg text-gray-500">
              Tek platform, tüm kanallar, sıfır potansiyel müşteri kaybı.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-4 text-3xl">{f.icon}</div>
                <h3 className="mb-2 text-base font-bold text-gray-900">{f.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NASIL ÇALIŞIR */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">Nasıl Çalışır?</p>
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-gray-900">3 adımda başlayın</h2>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              { step: '01', title: 'Kurulum yapın', desc: 'Aynı gün kurulur. Meta reklamlarınızı ve WhatsApp\'ınızı bağlayın. 1 saat içinde hazır.' },
              { step: '02', title: 'Ekibinizi ekleyin', desc: 'Satışçılarınızı sisteme ekleyin. Roller ve yetkiler tanımlayın. Herkes kendi ekranını görür.' },
              { step: '03', title: 'Takip edin', desc: 'Talepler otomatik gelir, satışçılara atanır. Siz sadece sonuçları izleyin.' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold text-white">
                  {s.step}
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-900">{s.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEMO FORM */}
      <section id="demo-form" className="bg-gradient-to-br from-blue-600 to-blue-700 py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            <div className="text-white">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-200">14 Gün Ücretsiz</p>
              <h2 className="mb-4 text-4xl font-bold tracking-tight">
                Kliniğiniz için ücretsiz demo alın
              </h2>
              <p className="mb-8 text-lg leading-relaxed text-blue-100">
                Formu doldurun, sizi arayalım. Kliniğinize özel kurulum yapıp aynı gün kullanmaya başlayın.
              </p>
              <div className="space-y-4">
                {[
                  '✓ Kurulum bizden, ekibinize eğitim veriyoruz',
                  '✓ Meta reklam entegrasyonunu biz yapıyoruz',
                  '✓ 14 gün boyunca ücretsiz kullanın',
                  '✓ Beğenmezseniz hiçbir ücret ödemezsiniz',
                ].map((item, i) => (
                  <p key={i} className="text-sm font-medium text-blue-100">{item}</p>
                ))}
              </div>
            </div>
            <div id="demo-form-card" className="rounded-2xl bg-white p-8 shadow-2xl">
              <h3 className="mb-6 text-lg font-bold text-gray-900">Demo Talebi</h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">Ad Soyad *</label>
                  <input value={demoName} onChange={e => setDemoName(e.target.value)}
                    placeholder="Adınız Soyadınız"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">Telefon *</label>
                  <input value={demoPhone} onChange={e => setDemoPhone(e.target.value)}
                    placeholder="05XX XXX XX XX"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">Klinik / İşletme Adı</label>
                  <input value={demoBusiness} onChange={e => setDemoBusiness(e.target.value)}
                    placeholder="Klinik adı"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">Sektör</label>
                  <select value={demoSector} onChange={e => setDemoSector(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Seçin...</option>
                    <option value="Medikal Estetik">Medikal Estetik</option>
                    <option value="Diş Kliniği">Diş Kliniği</option>
                    <option value="Saç Ekim">Saç Ekim</option>
                    <option value="Güzellik Merkezi">Güzellik Merkezi</option>
                    <option value="Göz Kliniği">Göz Kliniği</option>
                    <option value="Diğer">Diğer</option>
                  </select>
                </div>
                <button onClick={handleDemoSubmit}
                  className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-700">
                  WhatsApp ile Demo Talep Et →
                </button>
                <p className="text-center text-xs text-gray-400">
                  Formu göndermek yerine direkt aramak ister misiniz?{' '}
                  <a href="tel:+905453467778" className="text-blue-600 hover:underline">+90 545 346 77 78</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SSS */}
      <section id="sss" className="bg-white py-24">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">SSS</p>
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-gray-900">Sık sorulan sorular</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className={`overflow-hidden rounded-2xl border transition-all ${openFaq === i ? 'border-blue-100 shadow-md shadow-blue-50' : 'border-gray-100'}`}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-gray-50/50">
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

      {/* SON CTA */}
      <section className="bg-gray-900 py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="mb-4 text-4xl font-bold text-white">Başlamaya hazır mısınız?</h2>
          <p className="mb-8 text-lg text-gray-400">14 gün ücretsiz deneyin. Beğenmezseniz hiçbir ücret ödemezsiniz.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="#demo-form" onClick={scrollToDemo}
              className="rounded-xl bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white shadow-xl shadow-blue-900/50 transition-all hover:bg-blue-500">
              Ücretsiz Demo Al
            </a>
            <a href="https://wa.me/905453467778?text=Merhaba%2C%20DataPilot%20hakkında%20bilgi%20almak%20istiyorum."
              target="_blank" rel="noopener noreferrer"
              className="rounded-xl border border-white/20 px-8 py-3.5 text-sm font-medium text-white transition-all hover:bg-white/10">
              WhatsApp ile Ulaşın
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#070d20] py-14 text-slate-500">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-10 grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="col-span-2 md:col-span-1">
              <div className="mb-4 flex cursor-pointer items-center gap-2" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <img src="/logo2.png" alt="DataPilot" className="h-8 w-auto" />
              </div>
              <p className="text-sm leading-relaxed">
                Klinikler için potansiyel müşteri yönetim platformu.
              </p>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold text-slate-300">Ürün</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#sorun" className="transition-colors hover:text-white">Sorun</a></li>
                <li><a href="#ozellikler" className="transition-colors hover:text-white">Özellikler</a></li>
                <li><a href="#demo-form" className="transition-colors hover:text-white">Demo Al</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold text-slate-300">Şirket</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#sss" className="transition-colors hover:text-white">SSS</a></li>
                <li><a href="/privacy" className="transition-colors hover:text-white">Gizlilik Politikası</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold text-slate-300">İletişim</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="https://wa.me/905453467778" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">WhatsApp</a></li>
                <li><a href="mailto:destek@datapilottr.online" className="transition-colors hover:text-white">destek@datapilottr.online</a></li>
                <li><a href="/login" className="transition-colors hover:text-white">Giriş Yap</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 pt-6">
            <p className="text-sm">DataPilot © 2026 — Tüm hakları saklıdır.</p>
            <div className="flex items-center gap-4 text-sm">
              <p>İstanbul, Türkiye</p>
              <a href="/privacy" className="transition-colors hover:text-white">Gizlilik Politikası</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}