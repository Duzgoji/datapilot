'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function UploadPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null)

  const handleUpload = async () => {
    if (!file) return

    setLoading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('owner_id', 'test-owner') // Supabase açılınca gerçek kullanıcı ID'si gelecek

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Bir hata oluştu' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg">
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Veri Merkezi</h1>
        <p className="text-gray-500 mb-6">Excel dosyanızı yükleyerek leadlerinizi sisteme aktarın</p>

        {/* Dosya Seçme Alanı */}
        <div
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
          onClick={() => document.getElementById('fileInput')?.click()}
        >
          {file ? (
            <div>
              <p className="text-2xl mb-2">📊</p>
              <p className="font-medium text-gray-700">{file.name}</p>
              <p className="text-sm text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div>
              <p className="text-4xl mb-3">📂</p>
              <p className="text-gray-600 font-medium">Excel dosyası seçmek için tıklayın</p>
              <p className="text-sm text-gray-400 mt-1">.xlsx veya .xls formatı</p>
            </div>
          )}
        </div>

        <input
          id="fileInput"
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        {/* Örnek Format Bilgisi */}
        <div className="mt-4 p-4 bg-blue-50 rounded-xl">
          <p className="text-sm font-medium text-blue-700 mb-1">📋 Excel kolon isimleri:</p>
          <p className="text-sm text-blue-600">Ad, Soyad, Telefon, Email, Notlar</p>
        </div>

        {/* Yükle Butonu */}
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="w-full mt-6 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? '⏳ Yükleniyor...' : '🚀 Yükle'}
        </button>

        {/* Sonuç */}
        {result && (
          <div className={`mt-4 p-4 rounded-xl ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {result.success ? '✅ ' : '❌ '}
            {result.message || result.error}
          </div>
        )}

        {/* Geri Dön */}
        <button
          onClick={() => router.back()}
          className="w-full mt-3 text-gray-500 py-2 hover:text-gray-700 transition-all"
        >
          ← Geri dön
        </button>

      </div>
    </div>
  )
}