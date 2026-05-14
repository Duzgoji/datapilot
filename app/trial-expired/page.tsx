'use client'

export default function TrialExpiredPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="13" stroke="#e11d48" strokeWidth="2"/><path d="M16 8v9" stroke="#e11d48" strokeWidth="2.5" strokeLinecap="round"/><circle cx="16" cy="21" r="1.5" fill="#e11d48"/></svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Deneme Süreniz Doldu</h1>
        <p className="text-sm text-gray-500 mb-2">14 günlük ücretsiz deneme süreniz sona erdi.</p>
        <p className="text-sm text-gray-500 mb-6">Kullanmaya devam etmek için bizimle iletişime geçin, size özel fiyatlandırma seçeneklerini konuşalım.</p>
        <a href="https://wa.me/905453467778?text=Merhaba%2C%20DataPilot%20aboneliği%20hakkında%20bilgi%20almak%20istiyorum."
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm w-full justify-center mb-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          WhatsApp ile İletişime Geç
        </a>
        <button onClick={() => window.location.href = '/login'}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
          Farklı hesapla giriş yap
        </button>
        <p className="text-xs text-gray-400 mt-4">DataPilot — datapilottr.online</p>
      </div>
    </div>
  )
}