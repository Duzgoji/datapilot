export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-6 py-16">

        <div className="flex items-center gap-3 mb-8">
          <a href="#turkish" className="text-sm font-medium text-blue-600 hover:underline">Türkçe</a>
          <span className="text-gray-300">|</span>
          <a href="#english" className="text-sm font-medium text-blue-600 hover:underline">English</a>
        </div>

        {/* TÜRKÇE */}
        <div id="turkish" className="mb-20">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gizlilik Politikası</h1>
          <p className="text-sm text-gray-400 mb-10">Son güncelleme: Mayıs 2026</p>
          <div className="space-y-8 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Giriş</h2>
              <p>DataPilot ("biz", "uygulama"), Veysel Kartalkuş tarafından işletilen bir satış yönetim platformudur. Bu gizlilik politikası, uygulamamızı kullananların verilerini nasıl topladığımızı, kullandığımızı ve koruduğumuzu açıklamaktadır.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Toplanan Veriler</h2>
              <p className="mb-3">DataPilot aşağıdaki verileri toplayabilir:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Ad, soyad, telefon numarası ve e-posta adresi gibi iletişim bilgileri</li>
                <li>Meta (Facebook/Instagram) reklam hesabı verileri</li>
                <li>Instagram Direct Message gönderen kullanıcıların Instagram kullanıcı kimlikleri</li>
                <li>WhatsApp mesaj içerikleri ve gönderen telefon numaraları</li>
                <li>Meta reklam kampanyalarına ait harcama, gösterim ve tıklama verileri</li>
              </ul>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Verilerin Kullanım Amacı</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Müşteri adaylarının satış ekiplerine atanması ve takibi</li>
                <li>Satış süreçlerinin yönetimi ve raporlanması</li>
                <li>Reklam kampanya performansının analizi</li>
                <li>Uygulama işlevselliğinin sağlanması</li>
              </ul>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Meta Platform Verileri</h2>
              <p>DataPilot, Meta'nın API'lerini kullanarak Instagram Direct Message verilerine, Facebook Sayfası mesajlarına ve reklam hesabı verilerine erişir. Bu veriler yalnızca ilgili işletmenin satış süreçlerini yönetmek amacıyla kullanılır ve üçüncü taraflarla paylaşılmaz. Kullanıcılar istedikleri zaman bu erişimi iptal edebilir.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Veri Güvenliği</h2>
              <p>Tüm veriler Supabase altyapısı üzerinde güvenli bir şekilde saklanır. Veriler şifrelenerek iletilir ve yetkisiz erişime karşı korunur. Verilerinizi üçüncü taraflarla satmayız veya paylaşmayız.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Veri Saklama Süresi</h2>
              <p>Veriler, işletme hesabı aktif olduğu sürece saklanır. Hesap silindiğinde tüm veriler 30 gün içinde kalıcı olarak silinir.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Kullanıcı Hakları</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Verilerine erişim talep etme</li>
                <li>Verilerinin düzeltilmesini isteme</li>
                <li>Verilerinin silinmesini talep etme</li>
                <li>Meta platform entegrasyonunu istedikleri zaman iptal etme</li>
              </ul>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Çerezler</h2>
              <p>DataPilot, oturum yönetimi için zorunlu çerezler kullanır. Üçüncü taraf reklam veya takip çerezleri kullanılmaz.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">9. İletişim</h2>
              <p>Gizlilik politikamız hakkında sorularınız için bizimle iletişime geçebilirsiniz:</p>
              <div className="mt-3 bg-gray-50 rounded-xl p-4">
                <p className="font-medium text-gray-900">Veysel Kartalkuş</p>
                <p className="text-gray-600 mt-1">veyselkartalkus@gmail.com</p>
              </div>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Politika Değişiklikleri</h2>
              <p>Bu politika zaman zaman güncellenebilir. Önemli değişiklikler olması durumunda kullanıcılar e-posta yoluyla bilgilendirilir.</p>
            </section>
          </div>
        </div>

        <div className="border-t-2 border-gray-100 mb-20" />

        {/* ENGLISH */}
        <div id="english">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-400 mb-10">Last updated: May 2026</p>
          <div className="space-y-8 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Introduction</h2>
              <p>DataPilot ("we", "app") is a sales management platform operated by Veysel Kartalkuş. This privacy policy explains how we collect, use, and protect the data of our users.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Data We Collect</h2>
              <p className="mb-3">DataPilot may collect the following data:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Contact information such as name, surname, phone number, and email address</li>
                <li>Meta (Facebook/Instagram) advertising account data</li>
                <li>Instagram user IDs of users who send Instagram Direct Messages</li>
                <li>WhatsApp message content and sender phone numbers</li>
                <li>Meta ad campaign spend, impression, and click data</li>
              </ul>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Purpose of Data Use</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Assigning and tracking leads to sales teams</li>
                <li>Managing and reporting sales processes</li>
                <li>Analyzing advertising campaign performance</li>
                <li>Providing application functionality</li>
              </ul>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Meta Platform Data</h2>
              <p>DataPilot accesses Instagram Direct Message data, Facebook Page messages, and advertising account data using Meta's APIs. This data is used solely to manage the sales processes of the relevant business and is not shared with third parties. Users may revoke this access at any time.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Data Security</h2>
              <p>All data is securely stored on Supabase infrastructure. Data is transmitted encrypted and protected against unauthorized access. We do not sell or share your data with third parties.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Data Retention</h2>
              <p>Data is retained as long as the business account is active. Upon account deletion, all data is permanently deleted within 30 days.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">7. User Rights</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Request access to their data</li>
                <li>Request correction of their data</li>
                <li>Request deletion of their data</li>
                <li>Revoke Meta platform integration at any time</li>
              </ul>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Cookies</h2>
              <p>DataPilot uses essential cookies for session management only. No third-party advertising or tracking cookies are used.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Contact</h2>
              <p>If you have any questions about our privacy policy, please contact us:</p>
              <div className="mt-3 bg-gray-50 rounded-xl p-4">
                <p className="font-medium text-gray-900">Veysel Kartalkuş</p>
                <p className="text-gray-600 mt-1">veyselkartalkus@gmail.com</p>
              </div>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Policy Changes</h2>
              <p>This policy may be updated from time to time. In case of significant changes, users will be notified via email.</p>
            </section>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-100">
          <p className="text-sm text-gray-400 text-center">
            DataPilot © 2026 · Veysel Kartalkuş · veyselkartalkus@gmail.com
          </p>
        </div>

      </div>
    </div>
  )
}