'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const {
  LineChart, Line, BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} = require('recharts')

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function AnalyticsPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<any[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [report, setReport] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (profileData?.role !== 'customer') { router.push('/login'); return }

    const { data: branchesData } = await supabase.from('branches').select('*').eq('owner_id', user.id)

    if (branchesData && branchesData.length > 0) {
      const branchIds = branchesData.map((b: any) => b.id)

      const { data: leadsData } = await supabase.from('leads').select('*').in('branch_id', branchIds).order('created_at', { ascending: true })
      setLeads(leadsData || [])

      const { data: membersData } = await supabase.from('team_members').select('*, profiles(full_name)').in('branch_id', branchIds)
      setTeamMembers(membersData || [])
    }

    setLoading(false)
  }

  // Aylık lead verisi
  const monthlyData = () => {
    const months: Record<string, { ay: string, leadler: number, satislar: number }> = {}
    leads.forEach(lead => {
      const date = new Date(lead.created_at)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = date.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' })
      if (!months[key]) months[key] = { ay: label, leadler: 0, satislar: 0 }
      months[key].leadler++
      if (lead.status === 'procedure_done') months[key].satislar++
    })
    return Object.values(months).slice(-6)
  }

  // Kaynak dağılımı
  const sourceData = () => {
    const sources: Record<string, number> = {}
    leads.forEach(lead => {
      const s = lead.source || 'manual'
      sources[s] = (sources[s] || 0) + 1
    })
    const labels: Record<string, string> = {
      manual: 'Manuel', meta_form: 'Meta Form', excel: 'Excel',
      instagram_dm: 'Instagram', whatsapp: 'WhatsApp', website: 'Web', referral: 'Referans'
    }
    return Object.entries(sources).map(([key, value]) => ({ name: labels[key] || key, value }))
  }

  // Satışçı performansı
  const memberData = () => {
    return teamMembers.map(m => {
      const memberLeads = leads.filter(l => l.assigned_to === m.user_id)
      const sales = memberLeads.filter(l => l.status === 'procedure_done').length
      const revenue = memberLeads.filter(l => l.status === 'procedure_done').reduce((sum, l) => sum + (l.procedure_amount || 0), 0)
      return {
        name: m.profiles?.full_name?.split(' ')[0] || 'Satışçı',
        leadler: memberLeads.length,
        satislar: sales,
        ciro: revenue,
      }
    })
  }

  // Durum dağılımı
  const statusData = () => {
    const statuses: Record<string, number> = {}
    leads.forEach(lead => { statuses[lead.status] = (statuses[lead.status] || 0) + 1 })
    const labels: Record<string, string> = {
      new: 'Yeni', called: 'Arındı', appointment_scheduled: 'Randevu',
      procedure_done: 'Satış', cancelled: 'İptal'
    }
    return Object.entries(statuses).map(([key, value]) => ({ name: labels[key] || key, value }))
  }

  const totalSales = leads.filter(l => l.status === 'procedure_done').length
  const totalRevenue = leads.filter(l => l.status === 'procedure_done').reduce((sum, l) => sum + (l.procedure_amount || 0), 0)
  const conversionRate = leads.length > 0 ? ((totalSales / leads.length) * 100).toFixed(1) : '0'

  // AI Rapor Oluştur
  const generateReport = async () => {
    setGeneratingReport(true)
    setReport('')

    const summary = {
      toplamLead: leads.length,
      toplamSatis: totalSales,
      donusumOrani: `%${conversionRate}`,
      toplamCiro: `₺${totalRevenue.toLocaleString()}`,
      aylikVeri: monthlyData(),
      kaynakDagilimi: sourceData(),
      satisciPerformansi: memberData(),
      durumDagilimi: statusData(),
    }

    try {
      const res = await fetch('/api/analytics/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary }),
      })
      const data = await res.json()
      setReport(data.report)
    } catch (error) {
      setReport('Rapor oluşturulurken hata oluştu.')
    }

    setGeneratingReport(false)
  }

  // PDF İndir
  const downloadPDF = async () => {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()

    doc.setFont('helvetica')
    doc.setFontSize(18)
    doc.text('DataPilot - Analitik Raporu', 20, 20)

    doc.setFontSize(11)
    doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 20, 32)

    doc.setFontSize(13)
    doc.text('Özet', 20, 45)

    doc.setFontSize(10)
    doc.text(`Toplam Lead: ${leads.length}`, 20, 55)
    doc.text(`Toplam Satış: ${totalSales}`, 20, 63)
    doc.text(`Dönüşüm Oranı: %${conversionRate}`, 20, 71)
    doc.text(`Toplam Ciro: ₺${totalRevenue.toLocaleString()}`, 20, 79)

    if (report) {
      doc.setFontSize(13)
      doc.text('AI Analiz Raporu', 20, 95)
      doc.setFontSize(9)
      const lines = doc.splitTextToSize(report, 170)
      doc.text(lines, 20, 105)
    }

    doc.save(`datapilot-rapor-${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <p className="text-gray-500">Yükleniyor...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">

        {/* Başlık */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analitik & Raporlar</h1>
            <p className="text-gray-500 text-sm mt-1">Tüm verilerinizin özeti</p>
          </div>
          <div className="flex gap-3">
            <button onClick={generateReport} disabled={generatingReport}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50">
              {generatingReport ? '⏳ Rapor Hazırlanıyor...' : '🤖 AI Rapor Oluştur'}
            </button>
            {report && (
              <button onClick={downloadPDF}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium">
                📥 PDF İndir
              </button>
            )}
            <button onClick={() => router.back()}
              className="border border-gray-300 text-gray-600 px-4 py-2 rounded-xl text-sm">
              ← Geri
            </button>
          </div>
        </div>

        {/* Özet Kartlar */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Toplam Lead', value: leads.length, icon: '📋', color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Toplam Satış', value: totalSales, icon: '✅', color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Dönüşüm', value: `%${conversionRate}`, icon: '📈', color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Toplam Ciro', value: `₺${totalRevenue.toLocaleString()}`, icon: '💰', color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center text-xl mb-3`}>{card.icon}</div>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              <p className="text-xs text-gray-500 mt-1">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Grafikler */}
        <div className="grid grid-cols-2 gap-6 mb-6">

          {/* Aylık Lead & Satış */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Aylık Lead & Satış</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="ay" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="leadler" stroke="#3b82f6" strokeWidth={2} name="Lead" />
                <Line type="monotone" dataKey="satislar" stroke="#10b981" strokeWidth={2} name="Satış" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Kaynak Dağılımı */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Kaynak Dağılımı</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={sourceData()} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }: { name: string, percent: number }) => `${name} %${(percent * 100).toFixed(0)}`}>
                  {sourceData().map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Satışçı Performansı */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Satışçı Performansı</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={memberData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="leadler" fill="#3b82f6" name="Lead" radius={[4, 4, 0, 0]} />
                <Bar dataKey="satislar" fill="#10b981" name="Satış" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Durum Dağılımı */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Lead Durum Dağılımı</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statusData()} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={70} />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" name="Adet" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Rapor */}
        {report && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">🤖 AI Analiz Raporu</h3>
              <button onClick={downloadPDF}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium">
                📥 PDF İndir
              </button>
            </div>
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line">
              {report}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}