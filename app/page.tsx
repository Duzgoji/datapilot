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
    color: 'border-gray-200',
    badge: '',
    features: ['3 kullanıcı', '1 şube', '500 lead/ay', 'Meta entegrasyonu', 'Excel yükleme', 'Temel raporlar']
  },
  {
    name: 'Pro',
    price: '₺2.490',
    period: '/ay',
    desc: 'Büyüyen işletmeler için güçlü özellikler',
    color: 'border-blue-500',
    badge: 'En Popüler',
    features: ['15 kullanıcı', '5 şube', 'Sınırsız lead', 'Meta entegrasyonu', 'Excel yükleme', 'AI analitik & raporlar', 'Öncelikli destek']
  },
  {
    name: 'Enterprise',
    price: 'Özel Fiyat',
    period: '',
    desc: 'Büyük kurumlar için özelleştirilebilir çözüm',
    color: 'border-purple-500',
    badge: '',
    features: ['Sınırsız kullanıcı', 'Sınırsız şube', 'Sınırsız lead', 'Tüm entegrasyonlar', 'Özel AI modeli', 'Dedicated destek', 'SLA garantisi']
  },
]

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

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <img src="/logo.png" alt="DataPilot" className="h-10 w-auto" />
          <div className="hidden md:flex items-center gap-8">
            <a href="#ozellikler" className="text-gray-500 hover:text-gray-900 text-sm transition-colors">Özellikler</a>
            <a href="#paketler" className="text-gray-500 hover:text-gray-900 text-sm transition-colors">Fiyatlar</a>
            <a href="#sss" className="text-gray-500 hover:text-gray-900 text-sm transition-colors">SSS</a>
            <a href="#iletisim" className="text-gray-500 hover:text-gray-900 text-sm transition-colors">İletişim</a>
          </div>
          <button onClick={() => router.push('/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            Giriş Yap →
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-96 h-96 bg-blue-600 rounded-full opacity-5 blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-600 rounded-full opacity-5 blur-3xl"></div>
        </div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-900 bg-opacity-50 border border-blue-800 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-blue-300 text-xs font-medium">Meta & Instagram Entegrasyonu Aktif</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Leadlerinizi <span className="text-blue-400">akıllıca</span><br />yönetin
          </h1>
          <p className="text-slate-400 text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            Meta reklamlarından gelen leadleri otomatik toplayın, ekibinize dağıtın ve satışa dönüştürün.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button onClick={() => router.push('/login')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl transition-all shadow-lg shadow-blue-900 text-sm">
              Ücretsiz Deneyin →
            </button>
            <a href="#ozellikler"
              className="border border-slate-700 text-slate-300 hover:text-white font-medium px-8 py-4 rounded-xl transition-all text-sm">
              Daha Fazla Bilgi
            </a>
          </div>
          <div className="flex items-center justify-center gap-8 mt-12">
            {[
              { value: '10K+', label: 'Lead Yönetildi' },
              { value: '%34', label: 'Dönüşüm Artışı' },
              { value: '500+', label: 'Başarılı Firma' },
              { value: '14 Gün', label: 'Ücretsiz Deneme' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-blue-400 font-bold text-2xl">{s.value}</p>
                <p className="text-slate-500 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ÖZELLİKLER */}
      <section id="ozellikler" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Her şey tek platformda</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Lead yönetiminden analitiğe, ekip yönetiminden raporlamaya kadar ihtiyacınız olan her şey</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '📣', title: 'Meta Entegrasyonu', desc: 'Facebook ve Instagram reklamlarından gelen leadleri anında ve otomatik olarak sisteme çekin.' },
              { icon: '🤖', title: 'AI Analitik', desc: 'Yapay zeka destekli raporlarla satış performansınızı anlayın, eksiklerinizi görün.' },
              { icon: '👥', title: 'Ekip Yönetimi', desc: 'Şubelerinizi ve satışçılarınızı tek panelden yönetin, leadleri otomatik dağıtın.' },
              { icon: '📂', title: 'Veri Merkezi', desc: 'Excel dosyalarınızı yükleyin, otomatik olarak leadlere dönüştürün.' },
              { icon: '📊', title: 'Gelişmiş Raporlar', desc: 'Günlük, haftalık ve aylık raporlarla işinizin nabzını tutun. PDF olarak indirin.' },
              { icon: '🔒', title: 'Güvenli & Hızlı', desc: 'SSL şifreli bağlantı, güvenli veri saklama ve yüksek performanslı altyapı.' },
            ].map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PAKETLER */}
      <section id="paketler" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Şeffaf fiyatlandırma</h2>
            <p className="text-gray-500">14 gün ücretsiz deneyin, kredi kartı gerekmez</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map(plan => (
              <div key={plan.name} className={`rounded-2xl border-2 ${plan.color} p-8 relative ${plan.badge ? 'shadow-xl' : 'shadow-sm'}`}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">{plan.badge}</span>
                  </div>
                )}
                <h3 className="font-bold text-gray-900 text-xl mb-1">{plan.name}</h3>
                <p className="text-gray-500 text-sm mb-4">{plan.desc}</p>
                <div className="flex items-end gap-1 mb-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-400 text-sm mb-1">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-green-500 font-bold">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => router.push('/login')}
                  className={`w-full py-3 rounded-xl font-medium text-sm transition-all ${plan.badge ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200' : 'border border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
                  {plan.name === 'Enterprise' ? 'Teklif Alın' : '14 Gün Ücretsiz Dene'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SSS */}
      <section id="sss" className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Sıkça Sorulan Sorular</h2>
            <p className="text-gray-500">Aklınızdaki soruların cevapları burada</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors">
                  <span className="font-medium text-gray-900 text-sm">{faq.q}</span>
                  <span className="text-gray-400 flex-shrink-0 ml-4">{openFaq === i ? '▲' : '▼'}</span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-500 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* İLETİŞİM */}
      <section id="iletisim" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Bize Ulaşın</h2>
              <p className="text-gray-500 mb-8">Sorularınız için bize yazın, en kısa sürede dönüş yapalım.</p>
              <div className="space-y-4">
                {[
                  { icon: '📧', label: 'E-posta', value: 'destek@datapilot.com.tr' },
                  { icon: '📞', label: 'Telefon', value: '+90 (212) 000 00 00' },
                  { icon: '📍', label: 'Adres', value: 'İstanbul, Türkiye' },
                ].map(c => (
                  <div key={c.label} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-lg flex-shrink-0">{c.icon}</div>
                    <div>
                      <p className="text-xs text-gray-400">{c.label}</p>
                      <p className="text-sm font-medium text-gray-900">{c.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              {contactSent ? (
                <div className="text-center py-8">
                  <span className="text-5xl mb-4 block">✅</span>
                  <h3 className="font-bold text-gray-900 mb-2">Mesajınız alındı!</h3>
                  <p className="text-gray-500 text-sm">En kısa sürede size dönüş yapacağız.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Adınız</label>
                    <input value={contactName} onChange={e => setContactName(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder="Ad Soyad" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">E-posta</label>
                    <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder="ornek@email.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Mesajınız</label>
                    <textarea value={contactMessage} onChange={e => setContactMessage(e.target.value)} rows={4}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder="Nasıl yardımcı olabiliriz?" />
                  </div>
                  <button onClick={() => setContactSent(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-medium transition-all">
                    Gönder →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <img src="/logo2.png" alt="DataPilot" className="h-10 w-auto mb-4" />
              <p className="text-sm leading-relaxed">Akıllı lead yönetim platformu. İşinizi büyütün.</p>
            </div>
            <div>
              <h4 className="text-white font-medium text-sm mb-3">Ürün</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#ozellikler" className="hover:text-white transition-colors">Özellikler</a></li>
                <li><a href="#paketler" className="hover:text-white transition-colors">Fiyatlar</a></li>
                <li><a href="#sss" className="hover:text-white transition-colors">SSS</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium text-sm mb-3">Şirket</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#iletisim" className="hover:text-white transition-colors">İletişim</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Gizlilik Politikası</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Kullanım Koşulları</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium text-sm mb-3">Destek</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Yardım Merkezi</a></li>
                <li><a href="#iletisim" className="hover:text-white transition-colors">Bize Ulaşın</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 flex items-center justify-between">
            <p className="text-sm">DataPilot © 2026 — Tüm hakları saklıdır.</p>
            <p className="text-sm">İstanbul, Türkiye</p>
          </div>
        </div>
      </footer>

      {/* AI DESTEK CHAT */}
      <div className="fixed bottom-6 right-6 z-50">
        {chatOpen && (
          <div className="mb-4 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="bg-blue-600 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">🤖</span>
                </div>
                <div>
                  <p className="text-white font-medium text-sm">DataPilot Destek</p>
                  <p className="text-blue-200 text-xs">AI Destekli</p>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-white opacity-70 hover:opacity-100">✕</button>
            </div>
            <div className="h-64 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-3 py-2 rounded-xl text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-3 py-2 rounded-xl text-sm text-gray-500">Yazıyor...</div>
                </div>
              )}
            </div>
            <div className="p-3 border-t border-gray-100 flex gap-2">
              <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChat()}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mesajınızı yazın..." />
              <button onClick={sendChat}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm">→</button>
            </div>
          </div>
        )}
        <button onClick={() => setChatOpen(!chatOpen)}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center text-2xl transition-all">
          {chatOpen ? '✕' : '💬'}
        </button>
      </div>

    </div>
  )
}