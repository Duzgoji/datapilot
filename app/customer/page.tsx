'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import MetaConnect from '@/components/MetaConnect'
import WhatsAppConnect from '@/components/WhatsAppConnect'

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const menuStructure = [
  { key: 'dashboard', label: 'Dashboard', icon: '⬡' },
  {
  key: 'meta', label: 'Meta Reklam', icon: '◈', children: [
    { key: 'meta-kampanyalar', label: 'Kampanyalar' },
    { key: 'meta-leadformlar', label: 'Lead Formları' },
    { key: 'meta-baglanti', label: 'Bağlantı' },
  ]
},
{
  key: 'whatsapp', label: 'WhatsApp', icon: '◎', children: [
    { key: 'whatsapp-baglanti', label: 'Bağlantı' },
  ]
},
  {
    key: 'leadler', label: 'Leadler', icon: '◎', children: [
      { key: 'leadler-liste', label: 'Lead Listesi' },
      { key: 'leadler-dagitim', label: 'Dağıtım' },
    ]
  },
  {
    key: 'ekip', label: 'Ekip', icon: '◉', children: [
      { key: 'ekip-sube', label: 'Şubeler' },
      { key: 'ekip-liste', label: 'Satışçılar' },
    ]
  },
  {
    key: 'performans', label: 'Performans', icon: '◐', children: [
      { key: 'performans-genel', label: 'Genel' },
      { key: 'performans-karsilastirma', label: 'Karşılaştırma' },
      { key: 'performans-kar', label: 'Kâr Analizi' },
    ]
  },
  {
    key: 'veri', label: 'Veri Merkezi', icon: '◫', children: [
      { key: 'veri-yukle', label: 'Veri Yükle' },
      { key: 'veri-setlerim', label: 'Veri Setlerim' },
    ]
  },
  { key: 'faturalarim', label: 'Faturalarım', icon: '◧' },
  { key: 'ayarlar', label: 'Ayarlar', icon: '◌' },
]

const STATUS_CONFIG: any = {
  new:                   { label: 'Yeni',     dot: 'bg-blue-500',   badge: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' },
  called:                { label: 'Arandı',   dot: 'bg-amber-500',  badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  appointment_scheduled: { label: 'Randevu',  dot: 'bg-violet-500', badge: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200' },
  procedure_done:        { label: 'Satış',    dot: 'bg-emerald-500',badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  cancelled:             { label: 'İptal',    dot: 'bg-red-400',    badge: 'bg-red-50 text-red-600 ring-1 ring-red-200' },
}

const SOURCE_CONFIG: any = {
  manual:       { label: 'Manuel',       badge: 'bg-slate-100 text-slate-600' },
  meta_form:    { label: 'Meta Form',    badge: 'bg-blue-100 text-blue-700' },
  instagram_dm: { label: 'Instagram',    badge: 'bg-pink-100 text-pink-700' },
  whatsapp:     { label: 'WhatsApp',     badge: 'bg-green-100 text-green-700' },
  website:      { label: 'Web',          badge: 'bg-purple-100 text-purple-700' },
  referral:     { label: 'Referans',     badge: 'bg-orange-100 text-orange-700' },
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────

const MetaLogo = ({ size = 20, className = '' }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M4.5 26.45C4.5 30.96 7.15 34 11.05 34C13.7 34 15.7 32.73 18.36 29.31L20.48 26.58C21.95 24.67 23.08 23.31 24 22.5C24.92 23.31 26.05 24.67 27.52 26.58L29.64 29.31C32.3 32.73 34.3 34 36.95 34C40.85 34 43.5 30.96 43.5 26.45C43.5 22.86 41.87 19.73 39.13 17.79C36.54 15.96 33.1 15.37 29.86 16.35C28.29 16.83 26.83 17.73 25.48 19.06C24.96 18.61 24.49 18.24 24 17.96C23.51 18.24 23.04 18.61 22.52 19.06C21.17 17.73 19.71 16.83 18.14 16.35C14.9 15.37 11.46 15.96 8.87 17.79C6.13 19.73 4.5 22.86 4.5 26.45ZM28.97 27.88L26.83 25.13C25.71 23.69 24.82 22.6 24 21.84C23.18 22.6 22.29 23.69 21.17 25.13L19.03 27.88C16.59 31.03 14.96 32.5 12.82 32.5C9.37 32.5 7 29.95 7 26.45C7 23.6 8.27 21.16 10.44 19.67C12.52 18.25 15.27 17.78 17.77 18.54C19.04 18.93 20.22 19.68 21.35 20.82C20.73 21.46 20.14 22.14 19.55 22.87L17.46 25.56C15.01 28.64 13.3 29.97 11.05 29.97C10.26 29.97 9.65 29.68 9.25 29.15C8.9 28.69 8.75 28.07 8.83 27.42C8.96 26.35 9.73 25.16 10.99 24.16L11.95 25.27C10.94 26.07 10.41 26.97 10.33 27.62C10.28 28.01 10.36 28.35 10.54 28.59C10.74 28.85 11.06 29 11.05 29C12.68 29 14.08 27.92 16.27 25.16L18.36 22.46C19.08 21.54 19.73 20.84 20.38 20.26C19.26 19.22 18.1 18.56 16.9 18.2C14.85 17.59 12.63 17.98 10.94 19.11C9.15 20.31 8.1 22.26 8.1 26.45C8.1 29.38 9.95 31.44 12.82 31.44C14.54 31.44 15.93 30.27 18.12 27.52L20.25 24.79C21.69 22.97 22.8 21.79 24 21.05C25.2 21.79 26.31 22.97 27.75 24.79L29.88 27.52C32.07 30.27 33.46 31.44 35.18 31.44C38.05 31.44 39.9 29.38 39.9 26.45C39.9 22.26 38.85 20.31 37.06 19.11C35.37 17.98 33.15 17.59 31.1 18.2C29.9 18.56 28.74 19.22 27.62 20.26C28.27 20.84 28.92 21.54 29.64 22.46L31.73 25.16C33.92 27.92 35.32 29 36.95 29C36.94 29 37.26 28.85 37.46 28.59C37.64 28.35 37.72 28.01 37.67 27.62C37.59 26.97 37.06 26.07 36.05 25.27L37.01 24.16C38.27 25.16 39.04 26.35 39.17 27.42C39.25 28.07 39.1 28.69 38.75 29.15C38.35 29.68 37.74 29.97 36.95 29.97C34.7 29.97 32.99 28.64 30.54 25.56L28.45 22.87C27.86 22.14 27.27 21.46 26.65 20.82C27.78 19.68 28.96 18.93 30.23 18.54C32.73 17.78 35.48 18.25 37.56 19.67C39.73 21.16 41 23.6 41 26.45C41 29.95 38.63 32.5 35.18 32.5C33.04 32.5 31.41 31.03 28.97 27.88Z" fill="currentColor"/>
  </svg>
)

const Badge = ({ status }: { status: string }) => (
  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_CONFIG[status]?.badge || 'bg-gray-100 text-gray-600'}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[status]?.dot || 'bg-gray-400'}`} />
    {STATUS_CONFIG[status]?.label || status}
  </span>
)

const SourceBadge = ({ source }: { source: string }) => (
  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md ${SOURCE_CONFIG[source]?.badge || 'bg-gray-100 text-gray-500'}`}>
    {source === 'meta' && (
      <svg width="11" height="11" viewBox="0 0 48 48" fill="currentColor"><path d="M4.5 26.45C4.5 30.96 7.15 34 11.05 34C13.7 34 15.7 32.73 18.36 29.31L20.48 26.58C21.95 24.67 23.08 23.31 24 22.5C24.92 23.31 26.05 24.67 27.52 26.58L29.64 29.31C32.3 32.73 34.3 34 36.95 34C40.85 34 43.5 30.96 43.5 26.45C43.5 22.86 41.87 19.73 39.13 17.79C36.54 15.96 33.1 15.37 29.86 16.35C28.29 16.83 26.83 17.73 25.48 19.06C24.96 18.61 24.49 18.24 24 17.96C23.51 18.24 23.04 18.61 22.52 19.06C21.17 17.73 19.71 16.83 18.14 16.35C14.9 15.37 11.46 15.96 8.87 17.79C6.13 19.73 4.5 22.86 4.5 26.45ZM28.97 27.88L26.83 25.13C25.71 23.69 24.82 22.6 24 21.84C23.18 22.6 22.29 23.69 21.17 25.13L19.03 27.88C16.59 31.03 14.96 32.5 12.82 32.5C9.37 32.5 7 29.95 7 26.45C7 23.6 8.27 21.16 10.44 19.67C12.52 18.25 15.27 17.78 17.77 18.54C19.04 18.93 20.22 19.68 21.35 20.82C20.73 21.46 20.14 22.14 19.55 22.87L17.46 25.56C15.01 28.64 13.3 29.97 11.05 29.97C10.26 29.97 9.65 29.68 9.25 29.15C8.9 28.69 8.75 28.07 8.83 27.42C8.96 26.35 9.73 25.16 10.99 24.16L11.95 25.27C10.94 26.07 10.41 26.97 10.33 27.62C10.28 28.01 10.36 28.35 10.54 28.59C10.74 28.85 11.06 29 11.05 29C12.68 29 14.08 27.92 16.27 25.16L18.36 22.46C19.08 21.54 19.73 20.84 20.38 20.26C19.26 19.22 18.1 18.56 16.9 18.2C14.85 17.59 12.63 17.98 10.94 19.11C9.15 20.31 8.1 22.26 8.1 26.45C8.1 29.38 9.95 31.44 12.82 31.44C14.54 31.44 15.93 30.27 18.12 27.52L20.25 24.79C21.69 22.97 22.8 21.79 24 21.05C25.2 21.79 26.31 22.97 27.75 24.79L29.88 27.52C32.07 30.27 33.46 31.44 35.18 31.44C38.05 31.44 39.9 29.38 39.9 26.45C39.9 22.26 38.85 20.31 37.06 19.11C35.37 17.98 33.15 17.59 31.1 18.2C29.9 18.56 28.74 19.22 27.62 20.26C28.27 20.84 28.92 21.54 29.64 22.46L31.73 25.16C33.92 27.92 35.32 29 36.95 29C36.94 29 37.26 28.85 37.46 28.59C37.64 28.35 37.72 28.01 37.67 27.62C37.59 26.97 37.06 26.07 36.05 25.27L37.01 24.16C38.27 25.16 39.04 26.35 39.17 27.42C39.25 28.07 39.1 28.69 38.75 29.15C38.35 29.68 37.74 29.97 36.95 29.97C34.7 29.97 32.99 28.64 30.54 25.56L28.45 22.87C27.86 22.14 27.27 21.46 26.65 20.82C27.78 19.68 28.96 18.93 30.23 18.54C32.73 17.78 35.48 18.25 37.56 19.67C39.73 21.16 41 23.6 41 26.45C41 29.95 38.63 32.5 35.18 32.5C33.04 32.5 31.41 31.03 28.97 27.88Z"/></svg>
    )}
    {SOURCE_CONFIG[source]?.label || source}
  </span>
)

const Modal = ({ open, onClose, title, subtitle, children, size = 'md' }: any) => {
  if (!open) return null
  const sizes: any = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} z-10 max-h-[90vh] flex flex-col`}>
        <div className="flex items-start justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors ml-4 flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  )
}

const Input = ({ label, ...props }: any) => (
  <div>
    {label && <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>}
    <input {...props} className={`w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${props.className || ''}`} />
  </div>
)

const Select = ({ label, children, ...props }: any) => (
  <div>
    {label && <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>}
    <div className="relative">
      <select {...props} className={`w-full appearance-none px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all pr-9 ${props.className || ''}`}>
        {children}
      </select>
      <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </div>
  </div>
)

const Btn = ({ variant = 'primary', size = 'md', children, className = '', ...props }: any) => {
  const variants: any = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200',
    secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200',
    danger: 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200',
    ghost: 'hover:bg-gray-100 text-gray-600',
  }
  const sizes: any = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3 text-sm',
  }
  return (
    <button {...props} className={`inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </button>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function CustomerPage() {
  const router = useRouter()
  const profileMenuRef = useRef<HTMLDivElement>(null)

  // Core state
  const [profile, setProfile] = useState<any>(null)
  const [branches, setBranches] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['leadler', 'ekip'])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [commissionPayments, setCommissionPayments] = useState<any[]>([])
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentMember, setPaymentMember] = useState<any>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentNote, setPaymentNote] = useState('')
  const [paymentSaving, setPaymentSaving] = useState(false)
  const [showPaymentHistory, setShowPaymentHistory] = useState(false)
  const [showPaymentReport, setShowPaymentReport] = useState(false)
  const [paymentReportMember, setPaymentReportMember] = useState('all')
  const [paymentReportPeriod, setPaymentReportPeriod] = useState('this_month')
  const [paymentReportStart, setPaymentReportStart] = useState('')
  const [paymentReportEnd, setPaymentReportEnd] = useState('')
  const [paymentReportLoading, setPaymentReportLoading] = useState(false)
  const [historyMember, setHistoryMember] = useState<any>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDate, setFilterDate] = useState('all')
  const [filterSource, setFilterSource] = useState('all')

  // Branch
  const [showAddBranch, setShowAddBranch] = useState(false)
  const [branchInviteLink, setBranchInviteLink] = useState('')
  const [branchName, setBranchName] = useState('')
  const [branchContact, setBranchContact] = useState('')
  const [branchEmail, setBranchEmail] = useState('')
  const [commissionModel, setCommissionModel] = useState('fixed_rate')
  const [commissionValue, setCommissionValue] = useState('')

  // Member
  const [showAddMember, setShowAddMember] = useState(false)
  const [memberName, setMemberName] = useState('')
  const [memberEmail, setMemberEmail] = useState('')
  const [memberPassword, setMemberPassword] = useState('')
  const [memberCommission, setMemberCommission] = useState('')
  const [memberBranch, setMemberBranch] = useState('')
  const [memberRole, setMemberRole] = useState('agent')
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [memberTab, setMemberTab] = useState<'leads' | 'hakedis' | 'loglar'>('leads')

  // Lead
  const [showAddLead, setShowAddLead] = useState(false)
  const [leadName, setLeadName] = useState('')
  const [leadPhone, setLeadPhone] = useState('')
  const [leadEmail, setLeadEmail] = useState('')
  const [leadBranch, setLeadBranch] = useState('')
  const [leadSource, setLeadSource] = useState('manual')
  const [leadAssignTo, setLeadAssignTo] = useState('')
  const [leadNote, setLeadNote] = useState('')

  // Lead detail/update
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [newStatus, setNewStatus] = useState('')
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailLead, setDetailLead] = useState<any>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editLead, setEditLead] = useState<any>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [leadHistory, setLeadHistory] = useState<any[]>([])
  const [statusNote, setStatusNote] = useState('')
  const [procedureType, setProcedureType] = useState('')
  const [procedureAmount, setProcedureAmount] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [appointmentDate, setAppointmentDate] = useState('')

  const [perfPeriod, setPerfPeriod] = useState('6month')
  const [perfStartDate, setPerfStartDate] = useState('')
  const [perfEndDate, setPerfEndDate] = useState('')
  const [compPeriodA, setCompPeriodA] = useState('1month')
  const [compPeriodB, setCompPeriodB] = useState('last_month')
  const [compStartA, setCompStartA] = useState('')
  const [compEndA, setCompEndA] = useState('')
  const [compStartB, setCompStartB] = useState('')
  const [compEndB, setCompEndB] = useState('')

  // Report
  // Settings
  const [settingsName, setSettingsName] = useState('')
  const [settingsCompany, setSettingsCompany] = useState('')
  const [settingsPhone, setSettingsPhone] = useState('')
  const [settingsSector, setSettingsSector] = useState('')
  const [settingsOldPassword, setSettingsOldPassword] = useState('')
  const [settingsNewPassword, setSettingsNewPassword] = useState('')
  const [settingsNewPassword2, setSettingsNewPassword2] = useState('')
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsMsg, setSettingsMsg] = useState<{type:'success'|'error', text:string}|null>(null)
  const [passwordMsg, setPasswordMsg] = useState<{type:'success'|'error', text:string}|null>(null)
  const [logoUploading, setLogoUploading] = useState(false)

  const [metaConn, setMetaConn] = useState<any>(null)
  const [adSpend, setAdSpend] = useState<any[]>([])
  const [adSpendLoading, setAdSpendLoading] = useState(false)
  const [adSpendSyncing, setAdSpendSyncing] = useState(false)
  const [adSpendPeriod, setAdSpendPeriod] = useState<'7'|'30'|'90'>('30')
  
  // Veri Merkezi
  const EMPTY_ROW = () => ({ id: Date.now() + Math.random(), full_name: '', phone: '', email: '', source: 'manuel', branch_id: '', note: '' })
  const [importTab, setImportTab] = useState<'manuel'|'excel'>('manuel')
  const [bulkRows, setBulkRows] = useState<any[]>([EMPTY_ROW(), EMPTY_ROW(), EMPTY_ROW()])
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkResult, setBulkResult] = useState<{success: number, errors: string[]} | null>(null)
  const [xlsxFile, setXlsxFile] = useState<File | null>(null)
  const [xlsxDefaultAgent, setXlsxDefaultAgent] = useState<string>('')
  const [xlsxPreview, setXlsxPreview] = useState<any[]>([])
  const [xlsxLoading, setXlsxLoading] = useState(false)
  const [xlsxResult, setXlsxResult] = useState<{success: number, errors: string[]} | null>(null)

  const [showReportPanel, setShowReportPanel] = useState(false)
  const [customerInvoices, setCustomerInvoices] = useState<any[]>([])
  const [reportPeriod, setReportPeriod] = useState('this_month')
  const [reportFormat, setReportFormat] = useState('excel')
  const [reportStatus, setReportStatus] = useState('all')
  const [reportStartDate, setReportStartDate] = useState('')
  const [reportEndDate, setReportEndDate] = useState('')
  const [reportLoading, setReportLoading] = useState(false)

  // ─── EFFECTS ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('meta') === 'connected') setActiveTab('meta-baglanti')
    loadData()
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) setShowProfileMenu(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ─── DATA ─────────────────────────────────────────────────────────────────

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (profileData?.role !== 'customer') { router.push('/login'); return }
    setProfile(profileData)
    setSettingsName(profileData?.full_name || '')
    setSettingsCompany(profileData?.company_name || '')
    setSettingsPhone(profileData?.phone || '')
    setSettingsSector(profileData?.sector || '')
    const { data: branchesData } = await supabase.from('branches').select('*').eq('owner_id', user.id).order('created_at', { ascending: false })
    setBranches(branchesData || [])
    const branchIds = (branchesData || []).map((b: any) => b.id)
const { data: leadsData } = await supabase.from('leads').select('*').eq('owner_id', user.id).order('created_at', { ascending: false })
setLeads(leadsData || [])
if (branchIds.length > 0) {
  const { data: membersData } = await supabase.from('team_members').select('*, profiles(full_name, email), branches(branch_name)').in('branch_id', branchIds)
  setTeamMembers(membersData || [])
}
    const { data: metaConnData } = await supabase.from('meta_connections').select('*').eq('owner_id', user.id).single()
    setMetaConn(metaConnData || null)

    // Ad spend yükle
    const { data: adSpendData } = await supabase
      .from('ad_spend')
      .select('*')
      .eq('owner_id', user.id)
      .order('date', { ascending: false })
      .limit(500)
    setAdSpend(adSpendData || [])
    const { data: paymentsData } = await supabase
  .from('commission_payments').select('*')
  .eq('owner_id', user.id)
  .order('paid_at', { ascending: false })
   setCommissionPayments(paymentsData || [])
   const { data: customerData } = await supabase
  .from('customers')
  .select('id')
  .eq('owner_id', user.id)
  .maybeSingle()

const { data: invoicesData } = await supabase
  .from('invoices')
  .select('*')
  .eq('customer_id', customerData?.id || '')
  .order('created_at', { ascending: false })
setCustomerInvoices(invoicesData || [])
    setLoading(false)
  }

  // ─── SETTINGS HANDLERS ────────────────────────────────────────────────────

  const handleSaveProfile = async () => {
    setSettingsSaving(true); setSettingsMsg(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('profiles').update({
      full_name: settingsName, company_name: settingsCompany,
      phone: settingsPhone, sector: settingsSector,
    }).eq('id', user.id)
    if (error) setSettingsMsg({ type: 'error', text: 'Kaydedilemedi: ' + error.message })
    else { setSettingsMsg({ type: 'success', text: 'Profil güncellendi!' }); loadData() }
    setSettingsSaving(false)
    setTimeout(() => setSettingsMsg(null), 3000)
  }

  const handleChangePassword = async () => {
    setPasswordMsg(null)
    if (!settingsOldPassword) { setPasswordMsg({ type: 'error', text: 'Mevcut şifrenizi girin.' }); return }
    if (settingsNewPassword !== settingsNewPassword2) { setPasswordMsg({ type: 'error', text: 'Yeni şifreler eşleşmiyor.' }); return }
    if (settingsNewPassword.length < 6) { setPasswordMsg({ type: 'error', text: 'Yeni şifre en az 6 karakter olmalı.' }); return }
    // Eski şifreyi doğrula
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email, password: settingsOldPassword })
    if (signInError) { setPasswordMsg({ type: 'error', text: 'Mevcut şifre yanlış.' }); return }
    // Yeni şifreyi kaydet
    const { error } = await supabase.auth.updateUser({ password: settingsNewPassword })
    if (error) setPasswordMsg({ type: 'error', text: 'Hata: ' + error.message })
    else { setPasswordMsg({ type: 'success', text: 'Şifre güncellendi!' }); setSettingsOldPassword(''); setSettingsNewPassword(''); setSettingsNewPassword2('') }
    setTimeout(() => setPasswordMsg(null), 3000)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setLogoUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const ext = file.name.split('.').pop()
    const path = `logos/${user.id}.${ext}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      await supabase.from('profiles').update({ logo_url: urlData.publicUrl }).eq('id', user.id)
      loadData()
    }
    setLogoUploading(false)
  }

  // ─── HANDLERS ─────────────────────────────────────────────────────────────

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase()
    const { data, error } = await supabase.from('branches').insert({
      owner_id: user.id, branch_name: branchName, contact_name: branchContact,
      contact_email: branchEmail, commission_model: commissionModel,
      commission_value: parseFloat(commissionValue) || 0, invite_code: inviteCode, is_active: true,
    }).select().single()
    if (!error && data) {
      setBranchInviteLink(`${window.location.origin}/join/${inviteCode}`)
      setBranchName(''); setBranchContact(''); setBranchEmail(''); setCommissionModel('fixed_rate'); setCommissionValue('')
      loadData()
    }
    setSaving(false)
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    const { data, error } = await supabase.auth.signUp({ email: memberEmail, password: memberPassword, options: { data: { full_name: memberName, role: 'team' } } })
    if (error) { alert(error.message); setSaving(false); return }
    if (data.user) {
      await supabase.from('profiles').insert({ id: data.user.id, email: memberEmail, full_name: memberName, role: 'team', is_active: true })
      await supabase.from('team_members').insert({ branch_id: memberBranch, user_id: data.user.id, role: memberRole, commission_rate: parseFloat(memberCommission) || 0 })
      setMemberName(''); setMemberEmail(''); setMemberPassword(''); setMemberCommission(''); setMemberBranch(''); setMemberRole('agent')
      setShowAddMember(false); loadData()
    }
    setSaving(false)
  }

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const leadCode = 'DP-' + Date.now().toString().slice(-6)
    const { data: customerData } = await supabase
      .from('customers')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    const { error } = await supabase.from('leads').insert({
      lead_code: leadCode, branch_id: leadBranch !== '' ? leadBranch : null, owner_id: user.id,
      assigned_to: leadAssignTo || null, full_name: leadName, phone: leadPhone,
      email: leadEmail || null, source: leadSource, note: leadNote || null, status: 'new',
      customer_id: customerData?.id || null,
    })
    if (error) { alert(error.message); setSaving(false); return }
    if (!error) {
      setLeadName(''); setLeadPhone(''); setLeadEmail(''); setLeadBranch(''); setLeadSource('manual'); setLeadAssignTo(''); setLeadNote('')
      setShowAddLead(false); await loadData()
    }
    setSaving(false)
  }

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLead || !newStatus) return
    setSaving(true)
    const updates: any = { status: newStatus }
    if (newStatus === 'called') updates.called_at = new Date().toISOString()
    if (newStatus === 'appointment_scheduled') updates.appointment_date = appointmentDate
    if (newStatus === 'procedure_done') { updates.procedure_type = procedureType; updates.procedure_amount = parseFloat(procedureAmount) || 0; updates.procedure_date = new Date().toISOString() }
    if (newStatus === 'cancelled') updates.cancel_reason = cancelReason
    await supabase.from('leads').update(updates).eq('id', selectedLead.id)
    await supabase.from('lead_history').insert({ lead_id: selectedLead.id, changed_by: profile.id, old_status: selectedLead.status, new_status: newStatus, note: statusNote })
    setSelectedLead(null); setStatusNote(''); setProcedureType(''); setProcedureAmount(''); setCancelReason(''); setAppointmentDate('')
    loadData(); setSaving(false)
  }
const handlePayCommission = async () => {
  if (!paymentMember || !paymentAmount) return
  setPaymentSaving(true)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('commission_payments').insert({
    team_member_id: paymentMember.id,
    owner_id: user.id,
    amount: parseFloat(paymentAmount),
    note: paymentNote || null,
    created_by: user.id,
  })
  setPaymentAmount(''); setPaymentNote('')
  setShowPaymentModal(false); setPaymentMember(null)
  setPaymentSaving(false)
  await loadData()
}
  const handleToggleBranch = async (branch: any) => { await supabase.from('branches').update({ is_active: !branch.is_active }).eq('id', branch.id); loadData() }
  const handleToggleMember = async (member: any) => { await supabase.from('team_members').update({ is_active: !member.is_active }).eq('id', member.id); loadData() }
  const handleSyncAdSpend = async () => {
    if (!profile?.id) return
    setAdSpendSyncing(true)
    try {
      await fetch('/api/sync-ad-spend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner_id: profile.id }),
      })
      // Veriyi yeniden yükle
      const { data } = await supabase
        .from('ad_spend')
        .select('*')
        .eq('owner_id', profile.id)
        .order('date', { ascending: false })
        .limit(500)
      setAdSpend(data || [])
    } catch (e) {
      console.error('Sync error:', e)
    }
    setAdSpendSyncing(false)
  }

  const handleAssignLead = async (leadId: string, userId: string) => { await supabase.from('leads').update({ assigned_to: userId }).eq('id', leadId); loadData() }

  const handleEditLead = async () => {
    if (!editLead) return
    setEditLoading(true)
    await supabase.from('leads').update({
      procedure_type: editLead.procedure_type || null,
      procedure_amount: editLead.procedure_amount || 0,
      full_name: editLead.full_name,
      phone: editLead.phone,
      email: editLead.email || null,
      source: editLead.source,
      note: editLead.note || null,
      branch_id: editLead.branch_id || null,
      assigned_to: editLead.assigned_to || null,
    }).eq('id', editLead.id)
    setEditLoading(false)
    setShowEditModal(false)
    setEditLead(null)
    await loadData()
  }

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingLeadId, setDeletingLeadId] = useState<string | null>(null)

  const handleDeleteLead = async () => {
    if (!deletingLeadId) return
    await supabase.from('lead_history').delete().eq('lead_id', deletingLeadId)
    await supabase.from('leads').delete().eq('id', deletingLeadId)
    setShowDeleteConfirm(false)
    setDeletingLeadId(null)
    setShowDetailModal(false)
    setDetailLead(null)
    await loadData()
  }

  const openDetailModal = async (lead: any) => {
    setDetailLead(lead); setShowDetailModal(true)
    const { data } = await supabase.from('lead_history').select('*, profiles(full_name)').eq('lead_id', lead.id).order('created_at', { ascending: false })
    setLeadHistory(data || [])
  }

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login') }
  const toggleMenu = (key: string) => setExpandedMenus(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])

  // ─── VERİ MERKEZİ ─────────────────────────────────────────────────────────

  const handleBulkSave = async () => {
    const validRows = bulkRows.filter(r => r.full_name.trim() || r.phone.trim())
    if (validRows.length === 0) { alert('En az 1 satır doldurmanız gerekiyor.'); return }
    setBulkLoading(true)
    setBulkResult(null)
    let success = 0
    const errors: string[] = []
    const setName = `Manuel Giriş — ${new Date().toLocaleDateString('tr-TR')}`
    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i]
      const leadCode = 'LD' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 100)
      const { error } = await supabase.from('leads').insert({
        full_name: row.full_name.trim(), phone: row.phone.trim(),
        email: row.email.trim() || null, source: row.source || 'manuel',
        note: row.note.trim() || null,
        branch_id: row.branch_id || branches[0]?.id || null,
        assigned_to: null, status: 'new', lead_code: leadCode,
        owner_id: profile.id, import_set: setName,
      })
      if (error) { errors.push(`Satır ${i + 1}: ${error.message}`); continue }
      success++
    }
    setBulkResult({ success, errors })
    if (success > 0) {
      setBulkRows([EMPTY_ROW(), EMPTY_ROW(), EMPTY_ROW()])
      await loadData()
    }
    setBulkLoading(false)
  }


  const downloadTemplate = async () => {
    const XLSX = await import('xlsx')
    const agentNames = teamMembers.filter(m => m.role === 'agent' || m.role === 'team').map(m => m.profiles?.full_name || '').filter(Boolean)
    const ws = XLSX.utils.aoa_to_sheet([
      ['Ad Soyad', 'Telefon', 'E-posta', 'Kaynak', 'Not', 'Şube Adı', 'Satışçı'],
      ['Ahmet Yılmaz', '05321234567', 'ahmet@email.com', 'manuel', 'Instagram reklamından geldi', branches[0]?.branch_name || 'Merkez Şube', agentNames[0] || ''],
      ['Fatma Kaya', '05431234567', '', 'referral', 'Referans müşteri', branches[0]?.branch_name || 'Merkez Şube', ''],
      ['', '', '', '', '', '', ''],
      ['Geçerli Kaynak Değerleri:', 'manuel', 'referral', 'website', 'whatsapp', 'instagram_dm', ''],
      ['Satışçı Adları:', ...agentNames.slice(0, 5), ''],
    ])
    ws['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 14 }, { wch: 30 }, { wch: 20 }, { wch: 20 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Leadler')
    XLSX.writeFile(wb, 'DataPilot_Lead_Sablonu.xlsx')
  }

  const handleXlsxFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setXlsxFile(file)
    setXlsxResult(null)
    const XLSX = await import('xlsx')
    const buffer = await file.arrayBuffer()
    const wb = XLSX.read(buffer)
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' })
    setXlsxPreview(rows.slice(0, 3))
  }

  const handleXlsxSubmit = async () => {
    if (!xlsxFile) return
    setXlsxLoading(true)
    setXlsxResult(null)
    const XLSX = await import('xlsx')
    const buffer = await xlsxFile.arrayBuffer()
    const wb = XLSX.read(buffer)
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' })
    const branchMap: Record<string, string> = {}
    branches.forEach(b => { branchMap[b.branch_name?.toLowerCase().trim()] = b.id })
    // Satışçı adı → user_id haritası
    const agentMap: Record<string, string> = {}
    teamMembers.forEach(m => {
      const name = m.profiles?.full_name?.toLowerCase().trim()
      if (name) agentMap[name] = m.user_id
    })
    const setName = `${xlsxFile.name} — ${new Date().toLocaleDateString('tr-TR')}`
    let success = 0
    const errors: string[] = []
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const fullName = String(row['Ad Soyad'] || row['ad soyad'] || row['Ad'] || '').trim()
      const phone = String(row['Telefon'] || row['telefon'] || '').trim()
      if (!fullName && !phone) { errors.push(`Satır ${i + 2}: Ad ve telefon boş, atlandı`); continue }
      const branchRaw = String(row['Şube Adı'] || row['sube adi'] || '').toLowerCase().trim()
      const branchId = branchMap[branchRaw] || branches[0]?.id || null
      const source = String(row['Kaynak'] || row['kaynak'] || 'excel_import').trim()
      const note = String(row['Not'] || row['not'] || '').trim()
      const email = String(row['E-posta'] || row['eposta'] || row['email'] || '').trim()
      // Satışçı: önce Excel'deki isimden bul, yoksa varsayılan dropdown
      const agentRaw = String(row['Satışçı'] || row['satisci'] || row['Satışçı Adı'] || '').toLowerCase().trim()
      const assignedTo = (agentRaw && agentMap[agentRaw]) ? agentMap[agentRaw] : (xlsxDefaultAgent || null)
      const leadCode = 'LD' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 100)
      const { error } = await supabase.from('leads').insert({
        full_name: fullName, phone, email: email || null,
        source, note: note || null,
        branch_id: branchId, assigned_to: assignedTo,
        status: 'new', lead_code: leadCode,
        owner_id: profile.id, import_set: setName,
      })
      if (error) { errors.push(`Satır ${i + 2}: ${error.message}`); continue }
      success++
    }
    setXlsxResult({ success, errors })
    if (success > 0) { setXlsxFile(null); setXlsxPreview([]); await loadData() }
    setXlsxLoading(false)
  }

  // ─── COMPUTED ─────────────────────────────────────────────────────────────

  const getPageTitle = () => {
    for (const item of menuStructure) {
      if (item.key === activeTab) return item.label
      if (item.children) { const child = item.children.find(c => c.key === activeTab); if (child) return `${item.label} › ${child.label}` }
    }
    return 'Dashboard'
  }

  const totalSales = leads.filter(l => l.status === 'procedure_done').length
  const totalRevenue = leads.filter(l => l.status === 'procedure_done').reduce((sum, l) => sum + (l.procedure_amount || 0), 0)
  const conversionRate = leads.length > 0 ? ((totalSales / leads.length) * 100).toFixed(1) : '0'

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const weekEnd = new Date(today); weekEnd.setDate(today.getDate() + 7)

  const filteredLeads = leads.filter(l => {
    const matchesSearch = !searchQuery || l.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || l.phone?.includes(searchQuery) || l.lead_code?.toLowerCase().includes(searchQuery.toLowerCase()) || l.email?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || l.status === filterStatus
    const matchesSource = filterSource === 'all' || l.source === filterSource
    let matchesDate = true
    if (filterDate !== 'all' && l.appointment_at) {
      const d = new Date(l.appointment_at); d.setHours(0, 0, 0, 0)
      if (filterDate === 'today') matchesDate = d.getTime() === today.getTime()
      else if (filterDate === 'this_week') matchesDate = d >= today && d <= weekEnd
      else if (filterDate === 'overdue') matchesDate = d < today
    } else if (filterDate !== 'all') { matchesDate = false }
    return matchesSearch && matchesStatus && matchesSource && matchesDate
  })

  // ─── REPORT ───────────────────────────────────────────────────────────────

  const getReportLeads = () => {
    const now = new Date()
    let start: Date, end: Date = new Date(now); end.setHours(23, 59, 59, 999)
    if (reportPeriod === 'today') { start = new Date(now); start.setHours(0, 0, 0, 0) }
    else if (reportPeriod === 'this_week') { start = new Date(now); start.setDate(now.getDate() - now.getDay() + 1); start.setHours(0, 0, 0, 0) }
    else if (reportPeriod === 'this_month') { start = new Date(now.getFullYear(), now.getMonth(), 1) }
    else if (reportPeriod === 'last_month') { start = new Date(now.getFullYear(), now.getMonth() - 1, 1); end = new Date(now.getFullYear(), now.getMonth(), 0); end.setHours(23, 59, 59, 999) }
    else { start = reportStartDate ? new Date(reportStartDate) : new Date(0); end = reportEndDate ? new Date(reportEndDate + 'T23:59:59') : new Date() }
    return leads.filter(l => { const d = new Date(l.created_at); return d >= start && d <= end && (reportStatus === 'all' || l.status === reportStatus) })
  }

  const downloadExcel = async () => {
    setReportLoading(true)
    const data = getReportLeads()
    const XLSX = await import('xlsx')
    const rows = data.map(l => ({ 'Lead Kodu': l.lead_code, 'Ad Soyad': l.full_name || '', 'Telefon': l.phone || '', 'E-posta': l.email || '', 'Durum': STATUS_CONFIG[l.status]?.label || l.status, 'Kaynak': SOURCE_CONFIG[l.source]?.label || l.source, 'İşlem Tutarı': l.procedure_amount || 0, 'Randevu': l.appointment_at ? new Date(l.appointment_at).toLocaleDateString('tr-TR') : '', 'Not': l.note || '', 'Eklenme Tarihi': new Date(l.created_at).toLocaleDateString('tr-TR') }))
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [12, 20, 14, 24, 12, 14, 14, 14, 30, 14].map(w => ({ wch: w }))
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Leadler')
    const pLabel: any = { today: 'Bugün', this_week: 'Bu_Hafta', this_month: 'Bu_Ay', last_month: 'Geçen_Ay', custom: 'Özel' }
    XLSX.writeFile(wb, `DataPilot_${pLabel[reportPeriod]}.xlsx`)
    setReportLoading(false); setShowReportPanel(false)
  }

  const downloadPDF = async () => {
    setReportLoading(true)
    const data = getReportLeads()
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')
    const doc = new jsPDF({ orientation: 'landscape' })
    doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.text('DataPilot — Lead Raporu', 14, 18)
    doc.setFontSize(9); doc.setFont('helvetica', 'normal')
    const pLabel: any = { today: 'Bugün', this_week: 'Bu Hafta', this_month: 'Bu Ay', last_month: 'Geçen Ay', custom: 'Özel' }
    const sales = data.filter(l => l.status === 'procedure_done').length
    const revenue = data.filter(l => l.status === 'procedure_done').reduce((s, l) => s + (l.procedure_amount || 0), 0)
    doc.text(`Dönem: ${pLabel[reportPeriod]}  |  Toplam: ${data.length} lead  |  Satış: ${sales}  |  Ciro: ₺${revenue.toLocaleString()}  |  Dönüşüm: %${data.length > 0 ? ((sales / data.length) * 100).toFixed(1) : 0}`, 14, 26)
    autoTable(doc, { startY: 32, head: [['Lead Kodu', 'Ad Soyad', 'Telefon', 'Durum', 'Kaynak', 'Tutar', 'Tarih']], body: data.map(l => [l.lead_code, l.full_name || '', l.phone || '', STATUS_CONFIG[l.status]?.label || l.status, SOURCE_CONFIG[l.source]?.label || l.source, l.procedure_amount ? `₺${l.procedure_amount.toLocaleString()}` : '-', new Date(l.created_at).toLocaleDateString('tr-TR')]), styles: { fontSize: 8, cellPadding: 3 }, headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' }, alternateRowStyles: { fillColor: [249, 250, 251] } })
    const pLabelFile: any = { today: 'Bugün', this_week: 'Bu_Hafta', this_month: 'Bu_Ay', last_month: 'Geçen_Ay', custom: 'Özel' }
    doc.save(`DataPilot_${pLabelFile[reportPeriod]}.pdf`)
    setReportLoading(false); setShowReportPanel(false)
  }

  // ─── LOADING ──────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center mx-auto mb-3">
          <span className="text-white font-bold">D</span>
        </div>
        <div className="flex gap-1 justify-center">
          {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
        </div>
      </div>
    </div>
  )

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 flex" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── SIDEBAR ── */}
      <aside
        onMouseEnter={() => setSidebarCollapsed(false)}
        onMouseLeave={() => setSidebarCollapsed(true)}
        className={`${sidebarCollapsed ? 'w-16' : 'w-60'} bg-gray-950 border-r border-gray-800 flex flex-col fixed top-0 left-0 h-full z-20 transition-all duration-200 shadow-xl`}>

        {/* DataPilot Logo */}
        <div className={`flex items-center h-14 border-b border-gray-800 px-4 ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
          <img src="/logo2.png" alt="DataPilot" className="h-7 w-auto flex-shrink-0 object-contain" />
          {!sidebarCollapsed && <span className="font-semibold text-white text-sm tracking-tight truncate">DataPilot</span>}
        </div>

        {/* Firma */}
        {!sidebarCollapsed && (
          <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2.5">
            {profile?.logo_url ? (
              <img src={profile.logo_url} alt="Firma" className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-gray-700" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-indigo-400 text-xs font-bold">{(profile?.company_name || profile?.full_name || 'F').charAt(0)}</span>
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-200 truncate">{profile?.company_name || profile?.full_name}</p>
              <span className="text-xs text-indigo-400 font-medium">Müşteri</span>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {menuStructure.map(item => (
            <div key={item.key}>
              <button
                onClick={() => { if (item.children) toggleMenu(item.key); else setActiveTab(item.key) }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all mb-0.5 ${
                  activeTab === item.key && !item.children
                    ? 'bg-indigo-600 text-white font-medium shadow-lg shadow-indigo-900/50'
                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="text-base flex-shrink-0">{item.icon}</span>
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.children && (
                      <svg className={`w-3.5 h-3.5 transition-transform text-gray-600 ${expandedMenus.includes(item.key) ? 'rotate-90' : ''}`} viewBox="0 0 14 14" fill="none"><path d="M4 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    )}
                  </>
                )}
              </button>
              {item.children && expandedMenus.includes(item.key) && !sidebarCollapsed && (
                <div className="ml-3 pl-3 border-l border-gray-700 mb-1">
                  {item.children.map(child => (
                    <button key={child.key} onClick={() => setActiveTab(child.key)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all mb-0.5 ${
                        activeTab === child.key ? 'text-indigo-400 font-medium bg-indigo-500/10' : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
                      }`}>
                      {child.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Bottom */}
        {!sidebarCollapsed ? (
          <div className="p-3 border-t border-gray-800">
            <div className="flex items-center gap-2.5 px-2 py-1.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-indigo-400 text-xs font-bold">{profile?.full_name?.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-300 truncate">{profile?.full_name}</p>
                <p className="text-xs text-gray-600 truncate">{profile?.email}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 border-t border-gray-800">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center mx-auto">
              <span className="text-indigo-400 text-xs font-bold">{profile?.full_name?.charAt(0)}</span>
            </div>
          </div>
        )}
      </aside>

      {/* ── MAIN ── */}
      <div className="ml-16 flex-1 transition-all duration-200 min-w-0">

        {/* Top bar */}
        <header className="h-14 bg-white/80 backdrop-blur-sm border-b border-gray-100 flex items-center px-6 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-1.5 text-sm text-gray-400">
            <span>DataPilot</span>
            {getPageTitle().split(' › ').map((part, i, arr) => (
              <span key={i} className="flex items-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span className={i === arr.length - 1 ? 'text-gray-800 font-medium' : ''}>{part}</span>
              </span>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2" ref={profileMenuRef}>
            <div className="relative">
              <button onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 hover:bg-gray-50 rounded-xl px-3 py-1.5 transition-colors border border-transparent hover:border-gray-200">
                <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <span className="text-indigo-600 text-xs font-bold">{profile?.full_name?.charAt(0)}</span>
                </div>
                <span className="text-sm font-medium text-gray-700 hidden md:block">{profile?.full_name}</span>
                <svg className="text-gray-400" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50">
                  <div className="px-4 py-2.5 border-b border-gray-100 mb-1">
                    <p className="text-sm font-semibold text-gray-900">{profile?.full_name}</p>
                    <p className="text-xs text-gray-400 truncate">{profile?.email}</p>
                  </div>
                  <button onClick={() => { setActiveTab('ayarlar'); setShowProfileMenu(false) }} className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.25"/><path d="M7 1v1m0 10v1M1 7h1m10 0h1m-2.05-3.95-.7.7M4.75 9.25l-.7.7m0-6.65.7.7m4.5 4.5.7.7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></svg>
                    Ayarlar
                  </button>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 12H2.5A1.5 1.5 0 011 10.5v-7A1.5 1.5 0 012.5 2H5M9 10l3-3-3-3M12 7H5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Çıkış Yap
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6 min-h-screen" style={{ background: 'linear-gradient(135deg, #f8f7ff 0%, #f0f4ff 50%, #f5f3ff 100%)' }}>

          {/* ── DASHBOARD ── */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Welcome */}
              <div className="bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 rounded-2xl p-6 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/5 rounded-full" />
                <div className="absolute -right-2 bottom-0 w-24 h-24 bg-violet-500/20 rounded-full" />
                <div className="relative">
                  <p className="text-indigo-200 text-sm mb-1">Hoş geldin,</p>
                  <h1 className="text-2xl font-bold mb-1">{profile?.full_name}</h1>
                  <p className="text-indigo-300 text-sm">{new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                  <div className="flex gap-8 mt-5 pt-5 border-t border-white/10">
                    <div><p className="text-3xl font-bold">{leads.length}</p><p className="text-indigo-300 text-xs mt-0.5">Toplam Lead</p></div>
                    <div><p className="text-3xl font-bold">{totalSales}</p><p className="text-indigo-300 text-xs mt-0.5">Satış</p></div>
                    <div><p className="text-3xl font-bold">%{conversionRate}</p><p className="text-indigo-300 text-xs mt-0.5">Dönüşüm</p></div>
                    <div><p className="text-3xl font-bold">₺{(totalRevenue / 1000).toFixed(0)}K</p><p className="text-indigo-300 text-xs mt-0.5">Ciro</p></div>
                  </div>
                </div>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                 { label: 'Aktif Lead', value: leads.filter(l => l.status === 'new' || l.status === 'called').length, sub: 'Yeni + Arandı', color: 'text-blue-600', border: 'border-blue-100', gradient: 'from-blue-50 to-white', iconBg: 'bg-blue-100', icon: '◎', tab: 'leadler-liste' },
{ label: 'Randevu', value: leads.filter(l => l.status === 'appointment_scheduled').length, sub: 'Bekleyen randevu', color: 'text-violet-600', border: 'border-violet-100', gradient: 'from-violet-50 to-white', iconBg: 'bg-violet-100', icon: '◐', tab: 'leadler-liste' },
{ label: 'Toplam Satış', value: totalSales, sub: `₺${totalRevenue.toLocaleString()}`, color: 'text-emerald-600', border: 'border-emerald-100', gradient: 'from-emerald-50 to-white', iconBg: 'bg-emerald-100', icon: '◉', tab: 'leadler-liste' },
{ label: 'Şubeler', value: branches.length, sub: `${teamMembers.length} ekip üyesi`, color: 'text-orange-600', border: 'border-orange-100', gradient: 'from-orange-50 to-white', iconBg: 'bg-orange-100', icon: '◈', tab: 'ekip-sube' },
                ].map((card: any) => (
  <div key={card.label} onClick={() => setActiveTab(card.tab)} className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-5 border ${card.border} hover:shadow-md transition-all cursor-pointer`}>
                    <div className={`w-9 h-9 ${card.iconBg} rounded-xl flex items-center justify-center text-lg mb-3`}>{card.icon}</div>
                    <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                    <p className="text-xs font-medium text-gray-700 mt-1">{card.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
                  </div>
                ))}
              </div>

              {/* Recent leads */}
              <div className="bg-white rounded-2xl border border-gray-100">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 text-sm">Son Leadler</h3>
                  <button onClick={() => setActiveTab('leadler-liste')} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Tümünü gör →</button>
                </div>
                {leads.length === 0 ? (
                  <div className="p-12 text-center"><p className="text-gray-400 text-sm">Henüz lead yok.</p></div>
                ) : leads.slice(0, 6).map((lead, idx) => {
                  const avatarColors = ['from-blue-100 to-indigo-100 text-indigo-600','from-violet-100 to-purple-100 text-violet-600','from-emerald-100 to-teal-100 text-emerald-600','from-orange-100 to-amber-100 text-orange-600','from-pink-100 to-rose-100 text-rose-600','from-cyan-100 to-blue-100 text-blue-600']
                  const ac = avatarColors[idx % avatarColors.length]
                  return (
                  <div key={lead.id} onClick={() => openDetailModal(lead)} className="px-5 py-3.5 flex items-center gap-3 border-b border-gray-50 last:border-0 hover:bg-indigo-50/30 cursor-pointer transition-colors group">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${ac} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-xs font-semibold">{(lead.full_name || 'İ').charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{lead.full_name || 'İsimsiz'}</p>
                      <p className="text-xs text-gray-400">{lead.phone}</p>
                    </div>
                    <button onClick={e => { e.stopPropagation(); setSelectedLead(lead); setNewStatus(lead.status) }}>
                    <Badge status={lead.status} />
                    </button>
                  </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── LEAD LİSTESİ ── */}
          {activeTab === 'leadler-liste' && (
            <div className="space-y-4">
              {/* Actions bar */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{filteredLeads.length} / {leads.length} lead</p>
                <div className="flex gap-2">
                  <Btn variant="secondary" size="sm" onClick={() => setShowReportPanel(true)}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 10h10M2 7h6M2 4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    Rapor İndir
                  </Btn>
                  <Btn size="sm" onClick={() => setShowAddLead(true)}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/></svg>
                    Lead Ekle
                  </Btn>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="İsim, telefon veya lead kodu ara..."
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></button>}
              </div>

              {/* Filters */}
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Durum</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {[{ key: 'all', label: 'Tümü' }, ...Object.entries(STATUS_CONFIG).map(([k, v]: any) => ({ key: k, label: v.label }))].map(f => (
                      <button key={f.key} onClick={() => setFilterStatus(f.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterStatus === f.key ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'}`}>
                        {f.label} ({f.key === 'all' ? leads.length : leads.filter(l => l.status === f.key).length})
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Randevu Tarihi</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {[
                      { key: 'all', label: 'Tümü' },
                      { key: 'today', label: '● Bugün', count: leads.filter(l => { if (!l.appointment_at) return false; const d = new Date(l.appointment_at); d.setHours(0,0,0,0); return d.getTime() === today.getTime() }).length },
                      { key: 'this_week', label: '● Bu Hafta', count: leads.filter(l => { if (!l.appointment_at) return false; const d = new Date(l.appointment_at); d.setHours(0,0,0,0); return d >= today && d <= weekEnd }).length },
                      { key: 'overdue', label: '● Geçmiş', count: leads.filter(l => { if (!l.appointment_at) return false; const d = new Date(l.appointment_at); d.setHours(0,0,0,0); return d < today }).length },
                    ].map(f => (
                      <button key={f.key} onClick={() => setFilterDate(f.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterDate === f.key ? 'bg-violet-600 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'}`}>
                        {f.label}{f.count !== undefined ? ` (${f.count})` : ''}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Kaynak</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {[
                      { key: 'all', label: 'Tümü', color: filterSource === 'all' ? 'bg-gray-800 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300' },
                      { key: 'manuel', label: '✏️ Manuel', color: filterSource === 'manuel' ? 'bg-gray-700 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300' },
                      { key: 'meta_form', label: '🎯 Meta Form', color: filterSource === 'meta_form' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-blue-200' },
                      { key: 'whatsapp', label: '💬 WhatsApp', color: filterSource === 'whatsapp' ? 'bg-green-600 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-green-200' },
                      { key: 'instagram_dm', label: '📸 Instagram', color: filterSource === 'instagram_dm' ? 'bg-pink-600 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-pink-200' },
                      { key: 'referral', label: '🤝 Referans', color: filterSource === 'referral' ? 'bg-amber-500 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-amber-200' },
                      { key: 'website', label: '🌐 Web', color: filterSource === 'website' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-indigo-200' },
                    ].map(f => (
                      <button key={f.key} onClick={() => setFilterSource(f.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${f.color}`}>
                        {f.label} ({f.key === 'all' ? leads.length : leads.filter(l => l.source === f.key).length})
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Lead table */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {filteredLeads.length === 0 ? (
                  <div className="p-16 text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl">◎</div>
                    <p className="text-gray-500 text-sm font-medium">Sonuç bulunamadı</p>
                    {(searchQuery || filterStatus !== 'all' || filterDate !== 'all' || filterSource !== 'all') && <button onClick={() => { setSearchQuery(''); setFilterStatus('all'); setFilterDate('all'); setFilterSource('all') }} className="mt-2 text-xs text-indigo-600 hover:underline">Filtreleri temizle</button>}
                  </div>
                // ─── BUNU BUL VE DEĞİŞTİR ────────────────────────────────────────────────────
// leadler-liste sekmesinde şu satırı bul:
//   ) : filteredLeads.map((lead, i) => (
//     <div key={lead.id} onClick={() => openDetailModal(lead)}
//       className={`px-5 py-4 flex items-center gap-4 cursor-pointer ...`}>
//
// O bloktan kapanış parantezine kadar olan tüm kısmı sil,
// yerine aşağıdaki kodu yapıştır:
// ─────────────────────────────────────────────────────────────────────────────

                ) : filteredLeads.map((lead, i) => {
                  const assignedMember = teamMembers.find(m => m.user_id === lead.assigned_to)
                  const daysSinceCreated = Math.floor((Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24))
                  const isStale = daysSinceCreated >= 3 && (lead.status === 'new' || lead.status === 'called')
                  const hasAppointmentSoon = lead.appointment_at && (() => {
                    const d = new Date(lead.appointment_at); d.setHours(0,0,0,0)
                    const diff = Math.floor((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                    return diff >= 0 && diff <= 1
                  })()
                  const isAppointmentOverdue = lead.appointment_at && new Date(lead.appointment_at) < new Date() && lead.status === 'appointment_scheduled'

                  return (
                    <div key={lead.id}
                      className={`px-5 py-3.5 flex items-start gap-4 cursor-pointer transition-colors group ${i < filteredLeads.length - 1 ? 'border-b border-gray-50' : ''} ${isStale ? 'bg-amber-50/30 hover:bg-amber-50/50' : 'hover:bg-gray-50/70'}`}
                      onClick={() => openDetailModal(lead)}>

                      {/* Avatar + kaynak ikonu */}
                      <div className="relative flex-shrink-0 mt-0.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center">
                          <span className="text-indigo-600 text-sm font-semibold">{(lead.full_name || 'İ').charAt(0)}</span>
                        </div>
                        <span className="absolute -bottom-1 -right-1 text-xs leading-none">
                          {lead.source === 'meta_form' ? '🎯' : lead.source === 'whatsapp' ? '💬' : lead.source === 'instagram_dm' ? '📸' : lead.source === 'referral' ? '🤝' : lead.source === 'website' ? '🌐' : '✏️'}
                        </span>
                      </div>

                      {/* Ana bilgi */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-gray-900 truncate">{lead.full_name || 'İsimsiz'}</p>
                          <SourceBadge source={lead.source} />
                          {isStale && (
                            <span className="flex items-center gap-1 text-xs text-amber-600 font-medium bg-amber-100 px-1.5 py-0.5 rounded-md flex-shrink-0">
                              ⏳ {daysSinceCreated}g
                            </span>
                          )}
                          {hasAppointmentSoon && (
                            <span className="text-xs text-violet-600 font-medium bg-violet-100 px-1.5 py-0.5 rounded-md flex-shrink-0">
                              📅 Yakın
                            </span>
                          )}
                          {isAppointmentOverdue && (
                            <span className="text-xs text-red-500 font-medium bg-red-50 px-1.5 py-0.5 rounded-md flex-shrink-0">
                              ⚠ Geçti
                            </span>
                          )}
                        </div>

                        {/* İletişim bilgileri */}
                        <div className="flex items-center gap-3 mb-1">
                          <a href={`tel:${lead.phone}`} onClick={e => e.stopPropagation()}
                            className="text-xs text-gray-500 hover:text-indigo-600 transition-colors flex items-center gap-1">
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M9 7.5L7.5 9C3.91 7.59 1.41 5.09 0 1.5L1.5 0l2 2-1 1.5C3.07 4.43 4.57 5.93 5 6.5L6.5 5.5 9 7.5z" fill="currentColor"/></svg>
                            {lead.phone}
                          </a>
                          {lead.email && (
                            <a href={`mailto:${lead.email}`} onClick={e => e.stopPropagation()}
                              className="text-xs text-gray-400 hover:text-indigo-600 transition-colors truncate max-w-[160px]">
                              {lead.email}
                            </a>
                          )}
                        </div>

                        {/* Satışçı & tarih bilgisi */}
                        <div className="flex items-center gap-3">
                          {assignedMember ? (
                            <span className="text-xs text-indigo-500 font-medium flex items-center gap-1">
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="3.5" r="2" stroke="currentColor" strokeWidth="1.2"/><path d="M1 9c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                              {assignedMember.profiles?.full_name}
                            </span>
                          ) : (
                            <span className="text-xs text-amber-500 font-medium">⚠ Atanmamış</span>
                          )}
                          <span className="text-xs text-gray-300">·</span>
                          <span className="text-xs text-gray-400">{new Date(lead.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
                          {lead.appointment_at && (
                            <>
                              <span className="text-xs text-gray-300">·</span>
                              <span className={`text-xs font-medium ${isAppointmentOverdue ? 'text-red-500' : 'text-violet-600'}`}>
                                📅 {new Date(lead.appointment_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Not varsa */}
                        {lead.note && (
                          <p className="text-xs text-gray-400 mt-1 truncate max-w-sm">💬 {lead.note}</p>
                        )}
                      </div>

                      {/* Sağ: badge + tutar + aksiyonlar */}
                      <div className="flex flex-col items-end gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <Badge status={lead.status} />
                          {lead.procedure_amount > 0 && (
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                              ₺{lead.procedure_amount.toLocaleString()}
                            </span>
                          )}
                        </div>

                        {/* Quick Action Butonları — sadece hover'da görünür */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Ara */}
                          <a href={`tel:${lead.phone}`}
                            className="p-1.5 hover:bg-green-50 rounded-lg text-gray-300 hover:text-green-500 transition-colors"
                            title="Ara">
                            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M11.5 9.5L9.5 11.5C6.2 10.1 2.9 6.8 1.5 3.5L3.5 1.5l2.5 2.5L4.5 5.5C5.3 6.7 6.3 7.7 7.5 8.5L9 7l2.5 2.5z" fill="currentColor"/></svg>
                          </a>
                          {/* WhatsApp */}
                          <a href={`https://wa.me/90${lead.phone?.replace(/\D/g, '').replace(/^0/, '')}`}
                            target="_blank" rel="noopener noreferrer"
                            className="p-1.5 hover:bg-green-50 rounded-lg text-gray-300 hover:text-green-600 transition-colors"
                            title="WhatsApp">
                            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1C3.46 1 1 3.46 1 6.5c0 .97.25 1.88.69 2.67L1 12l2.9-.67A5.48 5.48 0 006.5 12C9.54 12 12 9.54 12 6.5S9.54 1 6.5 1zm2.7 7.5c-.11.3-.63.58-.87.61-.21.03-.48.04-.77-.05-.18-.05-.41-.13-.7-.26C5.47 8.32 4.5 7.1 4.42 7s-.6-.8-.6-1.52c0-.72.37-1.07.5-1.22.13-.15.28-.18.38-.18h.27c.09 0 .21-.03.33.25l.43 1.05c.04.09.07.19.01.3L5.5 5.9c-.07.1-.1.13-.05.23.25.45.54.86.9 1.2.42.4.87.67 1.4.85.1.03.2 0 .26-.07l.35-.42c.07-.1.16-.11.26-.07l1 .47c.1.04.17.1.2.19.03.1 0 .31-.1.57z" fill="currentColor"/></svg>
                          </a>
                          {/* Düzenle */}
                          <button onClick={() => { setEditLead({...lead}); setShowEditModal(true) }}
                            className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-300 hover:text-blue-500 transition-colors"
                            title="Düzenle">
                            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M8.5 1.5l3 3-7 7H1.5v-3l7-7z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                          {/* Durum güncelle */}
                          <button onClick={() => { setSelectedLead(lead); setNewStatus(lead.status) }}
                            className="p-1.5 hover:bg-indigo-50 rounded-lg text-gray-300 hover:text-indigo-600 transition-colors"
                            title="Durum güncelle">
                            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1 7l3 3L12 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── LEAD DAĞITIMI ── */}
          {activeTab === 'leadler-dagitim' && (
            <div className="bg-white rounded-2xl border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 text-sm">Lead Dağıtımı</h3>
                <p className="text-xs text-gray-400 mt-0.5">Atanmamış leadları satışçılara atayın</p>
              </div>
              {leads.filter(l => !l.assigned_to).length === 0 ? (
                <div className="p-16 text-center"><div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3 text-lg">✓</div><p className="text-gray-500 text-sm">Tüm leadlar atanmış.</p></div>
              ) : leads.filter(l => !l.assigned_to).map((lead, i, arr) => (
                <div key={lead.id} className={`px-5 py-4 flex items-center justify-between ${i < arr.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center"><span className="text-sm font-semibold text-orange-600">{(lead.full_name || 'İ').charAt(0)}</span></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{lead.full_name || 'İsimsiz'}</p>
                      <p className="text-xs text-gray-400">{lead.phone} · {new Date(lead.created_at).toLocaleDateString('tr-TR')}</p>
                    </div>
                  </div>
                  <Select value="" onChange={(e: any) => { if (e.target.value) handleAssignLead(lead.id, e.target.value) }} className="w-44">
                    <option value="">Satışçı seç...</option>
                    {teamMembers.filter(m => m.role === 'agent').map(m => <option key={m.user_id} value={m.user_id}>{m.profiles?.full_name}</option>)}
                  </Select>
                </div>
              ))}
            </div>
          )}

          {/* ── ŞUBELER ── */}
          {activeTab === 'ekip-sube' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Btn size="sm" onClick={() => setShowAddBranch(true)}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/></svg>
                  Şube Ekle
                </Btn>
              </div>
              {branchInviteLink && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0 text-sm">✓</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-emerald-800">Şube oluşturuldu!</p>
                    <p className="text-xs text-emerald-600 truncate mt-0.5">{branchInviteLink}</p>
                  </div>
                  <button onClick={() => navigator.clipboard.writeText(branchInviteLink)} className="text-xs text-emerald-700 font-medium hover:text-emerald-900 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0">Kopyala</button>
                </div>
              )}
              <div className="bg-white rounded-2xl border border-gray-100">
                {branches.length === 0 ? (
                  <div className="p-16 text-center"><p className="text-gray-400 text-sm">Henüz şube yok.</p></div>
                ) : branches.map((branch, i) => {
                  const branchColors = ['bg-indigo-100 text-indigo-600','bg-violet-100 text-violet-600','bg-emerald-100 text-emerald-600','bg-orange-100 text-orange-600']
                  const bc = branchColors[i % branchColors.length]
                  return (
                  <div key={branch.id} className={`px-5 py-4 flex items-center gap-4 ${i < branches.length - 1 ? 'border-b border-gray-50' : ''} hover:bg-gray-50/50 transition-colors`}>
                    <div className={`w-9 h-9 rounded-xl ${bc} flex items-center justify-center flex-shrink-0`}><span className="font-semibold text-sm">{branch.branch_name?.charAt(0)}</span></div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{branch.branch_name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{branch.contact_name} · {branch.contact_email}</p>
                      <p className="text-xs text-gray-400">Komisyon: %{branch.commission_value}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={branch.is_active} onChange={() => handleToggleBranch(branch)} className="sr-only peer" />
                      <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-indigo-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                    </label>
                  </div>
                )})}
              </div>
            </div>
          )}

          {/* ── SATIŞÇILAR ── */}
        {activeTab === 'ekip-liste' && (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-500">{teamMembers.length} ekip üyesi</p>
      <div className="flex gap-2">
  <Btn variant="secondary" size="sm" onClick={() => setShowPaymentReport(true)}>
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 10h10M2 7h6M2 4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
    Ödeme Raporu
  </Btn>
  <Btn size="sm" onClick={() => setShowAddMember(true)}>
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/></svg>
    Üye Ekle
  </Btn>
</div>
    </div>
 
    {teamMembers.length === 0 ? (
      <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
        <p className="text-gray-400 text-sm">Henüz ekip üyesi yok.</p>
      </div>
    ) : (
      <div className="space-y-4">
        {teamMembers.map((member, i) => {
          const memberLeads = leads.filter(l => l.assigned_to === member.user_id)
          const memberSales = memberLeads.filter(l => l.status === 'procedure_done')
          const memberRevenue = memberSales.reduce((s, l) => s + (l.procedure_amount || 0), 0)
          const totalEarned = memberRevenue * ((member.commission_rate || 0) / 100)
          const totalPaid = commissionPayments
            .filter(p => p.team_member_id === member.id)
            .reduce((s, p) => s + (p.amount || 0), 0)
          const remaining = totalEarned - totalPaid
          const avatarPairs = [
            'from-violet-200 to-indigo-200 text-indigo-700',
            'from-emerald-200 to-teal-200 text-emerald-700',
            'from-orange-200 to-amber-200 text-orange-700',
            'from-pink-200 to-rose-200 text-rose-700',
            'from-blue-200 to-cyan-200 text-blue-700',
          ]
          const ap = avatarPairs[i % avatarPairs.length]
 
          return (
            <div key={member.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-sm transition-all">
              {/* Üst: Satışçı Bilgisi */}
              <div className="px-5 py-4 flex items-center gap-4 border-b border-gray-50">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${ap} flex items-center justify-center flex-shrink-0`}>
                  <span className="font-bold text-sm">{member.profiles?.full_name?.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">{member.profiles?.full_name}</p>
                    <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                      {member.role === 'agent' ? 'Satışçı' : 'Yönetici'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {member.branches?.branch_name} · %{member.commission_rate} prim · {member.profiles?.email}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => { setHistoryMember(member); setShowPaymentHistory(true) }}
                    className="text-xs text-gray-500 font-medium hover:text-gray-700 px-3 py-1.5 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200">
                    Geçmiş
                  </button>
                  <button onClick={() => { setSelectedMember(member); setMemberTab('leads') }}
                    className="text-xs text-indigo-600 font-medium hover:text-indigo-700 px-3 py-1.5 hover:bg-indigo-50 rounded-lg transition-colors">
                    Detay
                  </button>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={member.is_active !== false} onChange={() => handleToggleMember(member)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-indigo-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                  </label>
                </div>
              </div>
 
              {/* Orta: Performans İstatistikleri */}
              <div className="px-5 py-3 grid grid-cols-4 gap-3 border-b border-gray-50">
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-600">{memberLeads.length}</p>
                  <p className="text-xs text-gray-400">Lead</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-emerald-600">{memberSales.length}</p>
                  <p className="text-xs text-gray-400">Satış</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-violet-600">₺{(memberRevenue/1000).toFixed(memberRevenue >= 10000 ? 0 : 1)}K</p>
                  <p className="text-xs text-gray-400">Ciro</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-700">
                    %{memberLeads.length > 0 ? ((memberSales.length / memberLeads.length) * 100).toFixed(0) : 0}
                  </p>
                  <p className="text-xs text-gray-400">Dönüşüm</p>
                </div>
              </div>
 
              {/* Alt: Hakediş Sistemi */}
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hakediş Durumu</p>
                  {remaining > 0 && (
                    <button
                      onClick={() => { setPaymentMember(member); setPaymentAmount(remaining.toFixed(0)); setShowPaymentModal(true) }}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm shadow-emerald-200">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M3 4l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Ödeme Yap
                    </button>
                  )}
                  {remaining <= 0 && totalEarned > 0 && (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full">
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1.5 5.5l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Tamamı Ödendi
                    </span>
                  )}
                </div>
 
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="bg-rose-50 rounded-xl p-3 border border-rose-100">
                    <p className="text-xs text-gray-400 mb-1">Toplam Hakediş</p>
                    <p className="text-base font-bold text-rose-600">₺{totalEarned.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                    <p className="text-xs text-gray-400 mb-1">Ödenen</p>
                    <p className="text-base font-bold text-emerald-600">₺{totalPaid.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className={`rounded-xl p-3 border ${remaining > 0 ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100'}`}>
                    <p className="text-xs text-gray-400 mb-1">Kalan Borç</p>
                    <p className={`text-base font-bold ${remaining > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                      ₺{Math.max(0, remaining).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
 
                {/* İlerleme Çubuğu */}
                {totalEarned > 0 && (
                  <div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (totalPaid / totalEarned) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <p className="text-xs text-gray-400">%{totalEarned > 0 ? ((totalPaid / totalEarned) * 100).toFixed(0) : 0} ödendi</p>
                      <p className="text-xs text-gray-400">%{member.commission_rate} prim oranı</p>
                    </div>
                  </div>
                )}
 
                {totalEarned === 0 && (
                  <p className="text-xs text-gray-300 text-center py-1">Henüz satış yok — hakediş hesaplanamıyor</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )}
  </div>
)}
  
<Modal open={showPaymentModal} onClose={() => { setShowPaymentModal(false); setPaymentMember(null); setPaymentAmount(''); setPaymentNote('') }}
  title="Ödeme Yap" subtitle={paymentMember?.profiles?.full_name}>
  {paymentMember && (
    <div className="p-6 space-y-4">
      {/* Özet */}
      {(() => {
        const mSales = leads.filter(l => l.assigned_to === paymentMember.user_id && l.status === 'procedure_done')
        const mRevenue = mSales.reduce((s: number, l: any) => s + (l.procedure_amount || 0), 0)
        const totalEarned = mRevenue * ((paymentMember.commission_rate || 0) / 100)
        const totalPaid = commissionPayments.filter(p => p.team_member_id === paymentMember.id).reduce((s: number, p: any) => s + (p.amount || 0), 0)
        const remaining = totalEarned - totalPaid
        return (
          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl p-4 border border-indigo-100">
            <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">{paymentMember.profiles?.full_name} · Hakediş Özeti</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-gray-400">Toplam Hakediş</p>
                <p className="text-sm font-bold text-gray-900">₺{totalEarned.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Ödenen</p>
                <p className="text-sm font-bold text-emerald-600">₺{totalPaid.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Kalan</p>
                <p className="text-sm font-bold text-amber-600">₺{Math.max(0, remaining).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
              </div>
            </div>
          </div>
        )
      })()}
 
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Ödeme Tutarı (₺) *</label>
        <input
          type="number"
          value={paymentAmount}
          onChange={e => setPaymentAmount(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-gray-900"
          placeholder="0"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Not (opsiyonel)</label>
        <textarea
          value={paymentNote}
          onChange={e => setPaymentNote(e.target.value)}
          rows={2}
          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          placeholder="Örn: Mart ayı prim ödemesi"
        />
      </div>
      <div className="flex gap-3 pt-1">
        <Btn variant="secondary" className="flex-1" onClick={() => { setShowPaymentModal(false); setPaymentMember(null) }}>İptal</Btn>
        <Btn variant="success" className="flex-1" onClick={handlePayCommission} disabled={paymentSaving || !paymentAmount || parseFloat(paymentAmount) <= 0}>
          {paymentSaving ? 'Kaydediliyor...' : '✓ Ödendi Olarak İşaretle'}
        </Btn>
      </div>
    </div>
  )}
</Modal>
 
<Modal open={showPaymentHistory} onClose={() => { setShowPaymentHistory(false); setHistoryMember(null) }}
  title="Ödeme Geçmişi" subtitle={historyMember?.profiles?.full_name} size="md">
  {historyMember && (
    <div className="p-6">
      {(() => {
        const payments = commissionPayments.filter(p => p.team_member_id === historyMember.id)
        const mSales = leads.filter(l => l.assigned_to === historyMember.user_id && l.status === 'procedure_done')
        const mRevenue = mSales.reduce((s: number, l: any) => s + (l.procedure_amount || 0), 0)
        const totalEarned = mRevenue * ((historyMember.commission_rate || 0) / 100)
        const totalPaid = payments.reduce((s: number, p: any) => s + (p.amount || 0), 0)
 
        return (
          <>
            {/* Özet */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-rose-50 rounded-xl p-3 text-center border border-rose-100">
                <p className="text-base font-bold text-rose-600">₺{totalEarned.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
                <p className="text-xs text-gray-400 mt-0.5">Toplam Hakediş</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
                <p className="text-base font-bold text-emerald-600">₺{totalPaid.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
                <p className="text-xs text-gray-400 mt-0.5">Ödenen</p>
              </div>
              <div className={`rounded-xl p-3 text-center border ${(totalEarned - totalPaid) > 0 ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100'}`}>
                <p className={`text-base font-bold ${(totalEarned - totalPaid) > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                  ₺{Math.max(0, totalEarned - totalPaid).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Kalan Borç</p>
              </div>
            </div>
 
            {/* İşlem listesi */}
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Ödeme Geçmişi</p>
            {payments.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="12" rx="2" stroke="#9ca3af" strokeWidth="1.5"/><path d="M2 8h16" stroke="#9ca3af" strokeWidth="1.5"/></svg>
                </div>
                <p className="text-sm text-gray-400">Henüz ödeme yapılmamış.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {payments.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1.5 7l3.5 3.5 7.5-7" stroke="#059669" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">₺{p.amount.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
                      {p.note && <p className="text-xs text-gray-500 truncate">{p.note}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-400">
                        {new Date(p.paid_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      <p className="text-xs text-emerald-500 font-medium">Ödendi</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
 
            {/* Yeni ödeme butonu */}
            {(totalEarned - totalPaid) > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Btn variant="success" className="w-full" onClick={() => { setShowPaymentHistory(false); setPaymentMember(historyMember); setPaymentAmount((totalEarned - totalPaid).toFixed(0)); setShowPaymentModal(true) }}>
                  Ödeme Yap →
                </Btn>
              </div>
            )}
          </>
        )
      })()}
    </div>
  )}
</Modal>

          {/* ── META ── */}
          {activeTab === 'whatsapp-baglanti' && profile?.id && <WhatsAppConnect ownerId={profile.id} />}
          {activeTab === 'meta-baglanti' && profile?.id && <MetaConnect ownerId={profile.id} />}
          {activeTab === 'meta-kampanyalar' && (() => {
            // Seçilen periyoda göre filtrele
            const days = parseInt(adSpendPeriod)
            const since = new Date(); since.setDate(since.getDate() - days)
            const filtered = adSpend.filter(r => new Date(r.date) >= since)

            // Kampanya bazında topla
            const campaignMap: Record<string, any> = {}
            filtered.forEach(r => {
              if (!campaignMap[r.campaign_id]) {
                campaignMap[r.campaign_id] = {
                  campaign_id: r.campaign_id,
                  campaign_name: r.campaign_name,
                  spend: 0, impressions: 0, clicks: 0,
                }
              }
              campaignMap[r.campaign_id].spend += r.spend || 0
              campaignMap[r.campaign_id].impressions += r.impressions || 0
              campaignMap[r.campaign_id].clicks += r.clicks || 0
            })
            const campaigns = Object.values(campaignMap).sort((a: any, b: any) => b.spend - a.spend)

            // Toplamlar
            const totalSpend = campaigns.reduce((s: number, c: any) => s + c.spend, 0)
            const totalImpressions = campaigns.reduce((s: number, c: any) => s + c.impressions, 0)
            const totalClicks = campaigns.reduce((s: number, c: any) => s + c.clicks, 0)
            const metaLeads = leads.filter(l => l.source === 'meta_form').length
            const metaSales = leads.filter(l => l.source === 'meta_form' && l.status === 'procedure_done')
            const metaRevenue = metaSales.reduce((s, l) => s + (l.procedure_amount || 0), 0)
            const cpl = metaLeads > 0 ? totalSpend / metaLeads : 0
            const cps = metaSales.length > 0 ? totalSpend / metaSales.length : 0
            const roi = totalSpend > 0 ? ((metaRevenue - totalSpend) / totalSpend * 100) : 0
            const lastSync = adSpend.length > 0 ? new Date(adSpend[0].synced_at).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : null

            return (
              <div className="space-y-5 max-w-4xl">

                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Kampanya Performansı</h2>
                    {lastSync && <p className="text-xs text-gray-400 mt-0.5">Son güncelleme: {lastSync}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Periyot seçici */}
                    <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                      {([['7', '7G'], ['30', '30G'], ['90', '90G']] as const).map(([val, label]) => (
                        <button key={val} onClick={() => setAdSpendPeriod(val)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${adSpendPeriod === val ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                    {/* Sync butonu */}
                    <button onClick={handleSyncAdSpend} disabled={adSpendSyncing || !metaConn?.access_token}
                      className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-medium rounded-xl transition-colors">
                      <svg className={adSpendSyncing ? 'animate-spin' : ''} width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path d="M11 6.5A4.5 4.5 0 012.5 4M2 2v2.5H4.5M2 6.5a4.5 4.5 0 008.5 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {adSpendSyncing ? 'Senkronize ediliyor...' : 'Şimdi Güncelle'}
                    </button>
                  </div>
                </div>

                {/* Meta bağlı değilse uyarı */}
                {!metaConn?.access_token && (
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-center gap-4">
                    <span className="text-3xl">⚠️</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Meta hesabı bağlı değil</p>
                      <p className="text-xs text-gray-500 mt-0.5">Kampanya verilerini görmek için Meta hesabını bağla.</p>
                      <button onClick={() => setActiveTab('meta-baglanti')}
                        className="mt-2 text-xs text-blue-600 font-medium hover:underline">Meta Bağlantısına Git →</button>
                    </div>
                  </div>
                )}

                {/* Veri yoksa */}
                {metaConn?.access_token && adSpend.length === 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 12a9 9 0 1018 0 9 9 0 00-18 0" stroke="#3b82f6" strokeWidth="1.5"/><path d="M12 8v4l3 3" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </div>
                    <p className="text-gray-600 text-sm font-medium">Henüz veri yok</p>
                    <p className="text-gray-400 text-xs mt-1 mb-4">Meta hesabı bağlı. İlk veriyi çekmek için güncelle.</p>
                    <button onClick={handleSyncAdSpend} disabled={adSpendSyncing}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors font-medium">
                      {adSpendSyncing ? 'Çekiliyor...' : 'Veriyi Çek'}
                    </button>
                  </div>
                )}

                {/* ROI & Özet kartlar */}
                {adSpend.length > 0 && (
                  <>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[
                        { label: 'Toplam Harcama', value: `₺${totalSpend.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, sub: `${days} gün`, color: 'text-red-600', bg: 'from-red-50 to-white', border: 'border-red-100', icon: '💸' },
                        { label: 'Meta Geliri', value: `₺${metaRevenue.toLocaleString()}`, sub: `${metaSales.length} satış`, color: 'text-emerald-600', bg: 'from-emerald-50 to-white', border: 'border-emerald-100', icon: '💰' },
                        { label: 'ROI', value: `%${roi.toFixed(1)}`, sub: totalSpend > 0 ? (roi >= 0 ? 'Kârlı' : 'Zararlı') : '—', color: roi >= 0 ? 'text-emerald-600' : 'text-red-600', bg: roi >= 0 ? 'from-emerald-50 to-white' : 'from-red-50 to-white', border: roi >= 0 ? 'border-emerald-100' : 'border-red-100', icon: roi >= 0 ? '📈' : '📉' },
                        { label: 'Lead Başı Maliyet', value: cpl > 0 ? `₺${cpl.toFixed(0)}` : '—', sub: `${metaLeads} meta lead`, color: 'text-blue-600', bg: 'from-blue-50 to-white', border: 'border-blue-100', icon: '🎯' },
                     ].map((card: any) => (
                        <div key={card.label} className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-5 border ${card.border} hover:shadow-md transition-all`}>
                        <div className={`w-9 h-9 ${card.iconBg} rounded-xl flex items-center justify-center text-lg mb-3`}>{card.icon}</div>
                         <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                         <p className="text-xs font-medium text-gray-700 mt-1">{card.label}</p>
                         <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
                    </div>
))}
                    </div>

                    {/* İkincil metrikler */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Toplam Gösterim', value: totalImpressions.toLocaleString(), icon: '👁' },
                        { label: 'Toplam Tıklama', value: totalClicks.toLocaleString(), icon: '🖱' },
                        { label: 'Satış Başı Maliyet', value: cps > 0 ? `₺${cps.toFixed(0)}` : '—', icon: '🏷' },
                      ].map(m => (
                        <div key={m.label} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3">
                          <span className="text-2xl">{m.icon}</span>
                          <div>
                            <p className="text-xs text-gray-400">{m.label}</p>
                            <p className="text-sm font-semibold text-gray-900">{m.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Kampanya tablosu */}
                    {campaigns.length > 0 && (
                      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-50">
                          <p className="text-sm font-semibold text-gray-900">Kampanya Detayı</p>
                          <p className="text-xs text-gray-400 mt-0.5">Son {days} gün · {campaigns.length} kampanya</p>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">Kampanya</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400">Harcama</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400">Gösterim</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400">Tıklama</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400">CTR</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400">Pay</th>
                              </tr>
                            </thead>
                            <tbody>
                              {campaigns.map((c: any, i: number) => {
                                const ctr = c.impressions > 0 ? (c.clicks / c.impressions * 100).toFixed(2) : '0.00'
                                const share = totalSpend > 0 ? (c.spend / totalSpend * 100).toFixed(0) : 0
                                return (
                                  <tr key={c.campaign_id} className={`border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors`}>
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" style={{ opacity: 1 - i * 0.15 }} />
                                        <p className="text-sm text-gray-800 font-medium truncate max-w-[180px]">{c.campaign_name}</p>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm font-semibold text-red-600">₺{c.spend.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                                    <td className="px-4 py-3 text-right text-sm text-gray-600">{c.impressions.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right text-sm text-gray-600">{c.clicks.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right text-sm text-gray-600">%{ctr}</td>
                                    <td className="px-4 py-3 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                          <div className="h-full bg-blue-400 rounded-full" style={{ width: `${share}%` }} />
                                        </div>
                                        <span className="text-xs text-gray-400 w-8 text-right">%{share}</span>
                                      </div>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })()}
          {activeTab === 'meta-leadformlar' && (() => {
            const notConnected = !metaConn?.access_token
            const metaLeads = leads.filter(l => l.source === 'meta')
            const metaLeadsThisMonth = metaLeads.filter(l => {
              const d = new Date(l.created_at)
              const now = new Date()
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
            })
            const metaSales = metaLeads.filter(l => l.status === 'procedure_done')

            if (notConnected) return (
              <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MetaLogo size={28} className="text-blue-600" />
                </div>
                <p className="text-gray-700 font-semibold mb-1">Meta Bağlantısı Gerekli</p>
                <p className="text-sm text-gray-400 mb-4">Önce Meta hesabını bağlamalısın.</p>
                <button onClick={() => setActiveTab('meta-baglanti')} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-xl font-medium hover:bg-indigo-700 transition-colors">Meta Bağlantısına Git →</button>
              </div>
            )

            return (
              <div className="space-y-5">

                {/* Webhook durum kartı */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white relative overflow-hidden">
                  <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/5 rounded-full" />
                  <div className="relative flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MetaLogo size={26} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-white">Meta Webhook Aktif</p>
                        <span className="flex items-center gap-1 bg-emerald-400/20 text-emerald-300 text-xs px-2 py-0.5 rounded-full font-medium">
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                          Canlı
                        </span>
                      </div>
                      <p className="text-blue-200 text-sm">Lead formunu dolduranlar otomatik olarak sisteme düşüyor</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-bold">{metaLeads.length}</p>
                      <p className="text-blue-300 text-xs">toplam Meta lead</p>
                    </div>
                  </div>
                </div>

                {/* Özet kartlar */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-2xl border border-blue-100 p-5 bg-gradient-to-br from-blue-50 to-white">
                    <p className="text-xs text-gray-400 mb-1">Bu Ay Gelen</p>
                    <p className="text-2xl font-bold text-blue-600">{metaLeadsThisMonth.length}</p>
                    <p className="text-xs text-gray-400 mt-1">Meta lead formu</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-emerald-100 p-5 bg-gradient-to-br from-emerald-50 to-white">
                    <p className="text-xs text-gray-400 mb-1">Satışa Dönen</p>
                    <p className="text-2xl font-bold text-emerald-600">{metaSales.length}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {metaLeads.length > 0 ? `%${((metaSales.length / metaLeads.length) * 100).toFixed(1)} dönüşüm` : 'Henüz lead yok'}
                    </p>
                  </div>
                  <div className="bg-white rounded-2xl border border-violet-100 p-5 bg-gradient-to-br from-violet-50 to-white">
                    <p className="text-xs text-gray-400 mb-1">Meta Cirosu</p>
                    <p className="text-2xl font-bold text-violet-600">
                      ₺{metaSales.reduce((s: number, l: any) => s + (l.procedure_amount || 0), 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">toplam satış tutarı</p>
                  </div>
                </div>

                {/* Meta lead listesi */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">Meta'dan Gelen Leadler</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Webhook ile otomatik kaydedildi</p>
                    </div>
                    <button onClick={() => setActiveTab('leadler-liste')}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                      Tümünü Gör →
                    </button>
                  </div>
                  {metaLeads.length === 0 ? (
                    <div className="p-16 text-center">
                      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <MetaLogo size={24} className="text-blue-500" />
                      </div>
                      <p className="text-gray-500 text-sm font-medium">Henüz Meta'dan lead gelmedi</p>
                      <p className="text-xs text-gray-400 mt-1">Reklam formunu dolduran biri olduğunda otomatik buraya düşecek</p>
                    </div>
                  ) : metaLeads.slice(0, 10).map((lead: any, idx: number) => {
                    const avatarColors = ['bg-blue-100 text-blue-600','bg-violet-100 text-violet-600','bg-emerald-100 text-emerald-600','bg-orange-100 text-orange-600','bg-pink-100 text-pink-600']
                    const ac = avatarColors[idx % avatarColors.length]
                    return (
                      <div key={lead.id} onClick={() => openDetailModal(lead)}
                        className="px-5 py-3.5 flex items-center gap-3 border-b border-gray-50 last:border-0 hover:bg-blue-50/30 cursor-pointer transition-colors">
                        <div className={`w-8 h-8 rounded-lg ${ac} flex items-center justify-center flex-shrink-0`}>
                          <span className="text-xs font-bold">{(lead.full_name || 'İ').charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{lead.full_name || 'İsimsiz'}</p>
                          <p className="text-xs text-gray-400">{lead.phone}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-gray-400">{new Date(lead.created_at).toLocaleDateString('tr-TR')}</span>
                          <Badge status={lead.status} />
                        </div>
                      </div>
                    )
                  })}
                </div>

              </div>
            )
          })()}

          {/* ── PERFORMANS ── */}
{activeTab === 'performans-genel' && (() => {
            const now = new Date()

            // ── Filtre aralığı ──
            const getPeriodRange = () => {
              const end = new Date(); end.setHours(23,59,59,999)
              if (perfPeriod === 'today') { const s = new Date(); s.setHours(0,0,0,0); return { start: s, end } }
              if (perfPeriod === '7day') { const s = new Date(); s.setDate(s.getDate()-6); s.setHours(0,0,0,0); return { start: s, end } }
              if (perfPeriod === '1month') { const s = new Date(now.getFullYear(), now.getMonth(), 1); return { start: s, end } }
              if (perfPeriod === '3month') { const s = new Date(now.getFullYear(), now.getMonth()-2, 1); return { start: s, end } }
              if (perfPeriod === '6month') { const s = new Date(now.getFullYear(), now.getMonth()-5, 1); return { start: s, end } }
              if (perfPeriod === '1year') { const s = new Date(now.getFullYear(), 0, 1); return { start: s, end } }
              if (perfPeriod === 'custom' && perfStartDate && perfEndDate) {
                const s = new Date(perfStartDate); s.setHours(0,0,0,0)
                const e = new Date(perfEndDate); e.setHours(23,59,59,999)
                return { start: s, end: e }
              }
              return { start: new Date(now.getFullYear(), now.getMonth()-5, 1), end }
            }
            const { start: rangeStart, end: rangeEnd } = getPeriodRange()
            const filteredLeads = leads.filter(l => { const d = new Date(l.created_at); return d >= rangeStart && d <= rangeEnd })

            // ── Grafik için aylar ──
            const monthCount = perfPeriod === 'today' || perfPeriod === '7day' ? 1 : perfPeriod === '1month' ? 1 : perfPeriod === '3month' ? 3 : perfPeriod === '1year' ? 12 : 6
            const months = Array.from({ length: monthCount }, (_, i) => {
              const d = new Date(now.getFullYear(), now.getMonth() - (monthCount - 1 - i), 1)
              return { label: d.toLocaleDateString('tr-TR', { month: 'short' }), year: d.getFullYear(), month: d.getMonth() }
            })
            const monthlyData = months.map(m => {
              const mLeads = filteredLeads.filter(l => { const d = new Date(l.created_at); return d.getFullYear() === m.year && d.getMonth() === m.month })
              const mSales = mLeads.filter(l => l.status === 'procedure_done')
              const mRevenue = mSales.reduce((s: number, l: any) => s + (l.procedure_amount || 0), 0)
              return { ...m, leads: mLeads.length, sales: mSales.length, revenue: mRevenue }
            })
            const totalLeads = filteredLeads.length
            const totalSales = filteredLeads.filter(l => l.status === 'procedure_done').length
            const totalRevenue = filteredLeads.filter(l => l.status === 'procedure_done').reduce((s: number, l: any) => s + (l.procedure_amount || 0), 0)
            const convRate = totalLeads > 0 ? ((totalSales / totalLeads) * 100).toFixed(1) : '0'
            const statusDist = [
              { key: 'new', label: 'Yeni', color: '#6366f1' },
              { key: 'called', label: 'Arandı', color: '#f59e0b' },
              { key: 'appointment_scheduled', label: 'Randevu', color: '#8b5cf6' },
              { key: 'procedure_done', label: 'Satış', color: '#10b981' },
              { key: 'cancelled', label: 'İptal', color: '#f87171' },
            ].map(s => ({ ...s, count: filteredLeads.filter(l => l.status === s.key).length }))
            const branchPerf = branches.map(b => {
              const bLeads = filteredLeads.filter(l => l.branch_id === b.id)
              const bSales = bLeads.filter(l => l.status === 'procedure_done')
              const bRevenue = bSales.reduce((s: number, l: any) => s + (l.procedure_amount || 0), 0)
              return { name: b.branch_name, leads: bLeads.length, sales: bSales.length, revenue: bRevenue, rate: bLeads.length > 0 ? ((bSales.length / bLeads.length) * 100).toFixed(0) : '0' }
            })
            const maxLeads = Math.max(...monthlyData.map(m => m.leads), 1)
            const maxRevenue = Math.max(...monthlyData.map(m => m.revenue), 1)
            const barW = monthCount <= 3 ? 64 : monthCount <= 6 ? 48 : 32
            const chartW = 520; const chartH = 140; const gap = (chartW - barW * monthCount) / (monthCount + 1)
            return (
              <div className="space-y-5">

                {/* ── Filtre Bar ── */}
                <div className="bg-white rounded-2xl border border-gray-100 px-5 py-3.5 flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-medium text-gray-500 flex-shrink-0">Dönem:</span>
                  <div className="flex gap-1 flex-wrap">
                    {[
                      { key: 'today', label: 'Bugün' },
                      { key: '7day', label: 'Son 7 Gün' },
                      { key: '1month', label: 'Bu Ay' },
                      { key: '3month', label: 'Son 3 Ay' },
                      { key: '6month', label: 'Son 6 Ay' },
                      { key: '1year', label: 'Bu Yıl' },
                      { key: 'custom', label: 'Özel' },
                    ].map(p => (
                      <button key={p.key} onClick={() => setPerfPeriod(p.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${perfPeriod === p.key ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                  {perfPeriod === 'custom' && (
                    <div className="flex items-center gap-2 ml-auto">
                      <input type="date" value={perfStartDate} onChange={e => setPerfStartDate(e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      <span className="text-xs text-gray-400">—</span>
                      <input type="date" value={perfEndDate} onChange={e => setPerfEndDate(e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: 'Toplam Lead', value: totalLeads, sub: 'Seçili dönem', color: 'text-indigo-600', bg: 'from-indigo-50 to-white', icon: '◈' },
                    { label: 'Toplam Satış', value: totalSales, sub: convRate + '% dönüşüm', color: 'text-emerald-600', bg: 'from-emerald-50 to-white', icon: '◉' },
                    { label: 'Toplam Ciro', value: '₺' + totalRevenue.toLocaleString(), sub: 'Onaylı satışlar', color: 'text-violet-600', bg: 'from-violet-50 to-white', icon: '◎' },
                    { label: 'Ort. Satış', value: totalSales > 0 ? '₺' + Math.round(totalRevenue / totalSales).toLocaleString() : '—', sub: 'Satış başına', color: 'text-amber-600', bg: 'from-amber-50 to-white', icon: '◐' },
                  ].map(k => (
                    <div key={k.label} className={'bg-gradient-to-br ' + k.bg + ' rounded-2xl border border-gray-100 p-5'}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-400 text-lg">{k.icon}</span>
                        <span className="text-xs text-gray-400">{k.sub}</span>
                      </div>
                      <p className={'text-2xl font-bold ' + k.color}>{k.value}</p>
                      <p className="text-xs text-gray-500 mt-1">{k.label}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-semibold text-gray-900">Lead ve Satış Trendi</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Son 6 ay</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-indigo-300 inline-block" /> Lead</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block" /> Satış</span>
                    </div>
                  </div>
                  <svg width={chartW} height={chartH + 30} viewBox={'0 0 ' + chartW + ' ' + (chartH + 30)}>
                    {[0, 0.25, 0.5, 0.75, 1].map(r => (
                      <line key={r} x1={0} y1={chartH * (1 - r)} x2={chartW} y2={chartH * (1 - r)} stroke="#f3f4f6" strokeWidth="1" />
                    ))}
                    {monthlyData.map((m, i) => {
                      const x = gap + i * (barW + gap)
                      const lH = (m.leads / maxLeads) * chartH
                      const sH = (m.sales / maxLeads) * chartH
                      return (
                        <g key={i}>
                          <rect x={x} y={chartH - lH} width={barW} height={lH} rx={6} fill="#a5b4fc" />
                          <rect x={x + 4} y={chartH - sH} width={barW - 8} height={sH} rx={4} fill="#34d399" />
                          <text x={x + barW / 2} y={chartH + 18} textAnchor="middle" fontSize="11" fill="#9ca3af">{m.label}</text>
                          {m.leads > 0 && <text x={x + barW / 2} y={chartH - lH - 5} textAnchor="middle" fontSize="10" fill="#6366f1" fontWeight="600">{m.leads}</text>}
                        </g>
                      )
                    })}
                  </svg>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Durum Dağılımı</h3>
                    {totalLeads === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-6">Henüz lead yok.</p>
                    ) : (
                      <div className="space-y-3">
                        {statusDist.map(s => (
                          <div key={s.key}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-gray-600">{s.label}</span>
                              <span className="text-xs text-gray-400">{s.count} · %{totalLeads > 0 ? ((s.count / totalLeads) * 100).toFixed(0) : 0}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: (totalLeads > 0 ? (s.count / totalLeads) * 100 : 0) + '%', backgroundColor: s.color }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Aylık Ciro</h3>
                    <div className="space-y-2">
                      {monthlyData.map((m, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 w-8 flex-shrink-0">{m.label}</span>
                          <div className="flex-1 h-6 bg-gray-50 rounded-lg overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-violet-400 to-violet-500 rounded-lg flex items-center px-2"
                              style={{ width: (maxRevenue > 0 ? (m.revenue / maxRevenue) * 100 : 0) + '%', minWidth: m.revenue > 0 ? '2rem' : '0' }}>
                              {m.revenue > 0 && <span className="text-white text-xs font-medium whitespace-nowrap">{'₺' + (m.revenue / 1000).toFixed(0) + 'K'}</span>}
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-gray-700 w-16 text-right flex-shrink-0">
                            {m.revenue > 0 ? '₺' + m.revenue.toLocaleString() : '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {branches.length > 1 && (
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900">Şube Karşılaştırması</h3>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {branchPerf.sort((a, b) => b.sales - a.sales).map((b, i) => (
                        <div key={i} className="px-6 py-4 flex items-center gap-4">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                            <span className="text-indigo-600 text-xs font-bold">{b.name.charAt(0)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{b.name}</p>
                            <div className="flex gap-3 mt-0.5">
                              <span className="text-xs text-indigo-600">{b.leads} lead</span>
                              <span className="text-xs text-emerald-600">{b.sales} satış</span>
                              <span className="text-xs text-gray-400">%{b.rate} dönüşüm</span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-semibold text-gray-900">{b.revenue > 0 ? '₺' + b.revenue.toLocaleString() : '—'}</p>
                            <p className="text-xs text-gray-400">ciro</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })()}

          {/* ── PERFORMANS KARŞILAŞTIRMA ── */}
          {activeTab === 'performans-karsilastirma' && (() => {
            const now = new Date()

            const getPeriods = (key: string) => {
              if (key === 'week') {
                const thisStart = new Date(now); thisStart.setDate(now.getDate() - now.getDay() + 1); thisStart.setHours(0,0,0,0)
                const thisEnd = new Date(now); thisEnd.setHours(23,59,59,999)
                const lastStart = new Date(thisStart); lastStart.setDate(lastStart.getDate() - 7)
                const lastEnd = new Date(thisStart); lastEnd.setDate(lastEnd.getDate() - 1); lastEnd.setHours(23,59,59,999)
                return { current: { start: thisStart, end: thisEnd, label: 'Bu Hafta' }, previous: { start: lastStart, end: lastEnd, label: 'Geçen Hafta' } }
              }
              if (key === 'month') {
                const thisStart = new Date(now.getFullYear(), now.getMonth(), 1)
                const thisEnd = new Date(now); thisEnd.setHours(23,59,59,999)
                const lastStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
                const lastEnd = new Date(now.getFullYear(), now.getMonth(), 0); lastEnd.setHours(23,59,59,999)
                return { current: { start: thisStart, end: thisEnd, label: 'Bu Ay' }, previous: { start: lastStart, end: lastEnd, label: 'Geçen Ay' } }
              }
              if (key === 'quarter') {
                const qMonth = Math.floor(now.getMonth() / 3) * 3
                const thisStart = new Date(now.getFullYear(), qMonth, 1)
                const thisEnd = new Date(now); thisEnd.setHours(23,59,59,999)
                const lastStart = new Date(now.getFullYear(), qMonth - 3, 1)
                const lastEnd = new Date(now.getFullYear(), qMonth, 0); lastEnd.setHours(23,59,59,999)
                return { current: { start: thisStart, end: thisEnd, label: 'Bu Çeyrek' }, previous: { start: lastStart, end: lastEnd, label: 'Geçen Çeyrek' } }
              }
              // year
              const thisStart = new Date(now.getFullYear(), 0, 1)
              const thisEnd = new Date(now); thisEnd.setHours(23,59,59,999)
              const lastStart = new Date(now.getFullYear() - 1, 0, 1)
              const lastEnd = new Date(now.getFullYear() - 1, 11, 31); lastEnd.setHours(23,59,59,999)
              return { current: { start: thisStart, end: thisEnd, label: 'Bu Yıl' }, previous: { start: lastStart, end: lastEnd, label: 'Geçen Yıl' } }
            }

            const { current, previous } = getPeriods(compPeriodA)

            const currentLeads = leads.filter(l => { const d = new Date(l.created_at); return d >= current.start && d <= current.end })
            const previousLeads = leads.filter(l => { const d = new Date(l.created_at); return d >= previous.start && d <= previous.end })

            const calc = (ls: any[]) => {
              const sales = ls.filter(l => l.status === 'procedure_done')
              const revenue = sales.reduce((s: number, l: any) => s + (l.procedure_amount || 0), 0)
              const conv = ls.length > 0 ? ((sales.length / ls.length) * 100) : 0
              return { leads: ls.length, sales: sales.length, revenue, conv }
            }

            const cur = calc(currentLeads)
            const prev = calc(previousLeads)

            const diff = (a: number, b: number) => {
              if (b === 0) return null
              return ((a - b) / b * 100)
            }

            const metrics = [
              { label: 'Lead', cur: cur.leads, prev: prev.leads, format: (v: number) => v.toString(), color: 'indigo', icon: '◈' },
              { label: 'Satış', cur: cur.sales, prev: prev.sales, format: (v: number) => v.toString(), color: 'emerald', icon: '◉' },
              { label: 'Ciro', cur: cur.revenue, prev: prev.revenue, format: (v: number) => '₺' + v.toLocaleString(), color: 'violet', icon: '◎' },
              { label: 'Dönüşüm', cur: cur.conv, prev: prev.conv, format: (v: number) => '%' + v.toFixed(1), color: 'amber', icon: '◐' },
            ]

            const colorMap: any = {
              indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' },
              emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
              violet: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100' },
              amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
            }

            // Satışçı karşılaştırması
            const memberPerf = teamMembers.map((tm: any) => {
              const mCur = currentLeads.filter(l => l.assigned_to === tm.user_id)
              const mPrev = previousLeads.filter(l => l.assigned_to === tm.user_id)
              const mCurSales = mCur.filter(l => l.status === 'procedure_done')
              const mPrevSales = mPrev.filter(l => l.status === 'procedure_done')
              const mCurRevenue = mCurSales.reduce((s: number, l: any) => s + (l.procedure_amount || 0), 0)
              const mPrevRevenue = mPrevSales.reduce((s: number, l: any) => s + (l.procedure_amount || 0), 0)
              const salesDiff = diff(mCurSales.length, mPrevSales.length)
              return {
                name: tm.profiles?.full_name || '—',
                branch: tm.branches?.branch_name || '—',
                curLeads: mCur.length, prevLeads: mPrev.length,
                curSales: mCurSales.length, prevSales: mPrevSales.length,
                curRevenue: mCurRevenue, prevRevenue: mPrevRevenue,
                salesDiff,
              }
            }).sort((a: any, b: any) => b.curSales - a.curSales)

            return (
              <div className="space-y-5">

                {/* Dönem Seçici */}
                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Karşılaştırma Dönemi</p>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { key: 'week', label: 'Haftalık', sub: 'Bu hafta vs geçen hafta' },
                      { key: 'month', label: 'Aylık', sub: 'Bu ay vs geçen ay' },
                      { key: 'quarter', label: 'Çeyreklik', sub: 'Bu çeyrek vs geçen çeyrek' },
                      { key: 'year', label: 'Yıllık', sub: 'Bu yıl vs geçen yıl' },
                    ].map(p => (
                      <button key={p.key} onClick={() => setCompPeriodA(p.key)}
                        className={`flex-1 min-w-[120px] px-4 py-3 rounded-xl border-2 text-left transition-all ${compPeriodA === p.key ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 hover:border-indigo-200 bg-white'}`}>
                        <p className={`text-sm font-bold ${compPeriodA === p.key ? 'text-indigo-700' : 'text-gray-700'}`}>{p.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{p.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dönem Etiketleri */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold">
                    <span className="w-2 h-2 bg-white rounded-full" />
                    {current.label}
                  </div>
                  <span className="text-gray-400 font-bold text-lg">vs</span>
                  <div className="flex items-center gap-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm font-semibold">
                    <span className="w-2 h-2 bg-gray-400 rounded-full" />
                    {previous.label}
                  </div>
                </div>

                {/* Metrik Kartları */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {metrics.map(m => {
                    const d = diff(m.cur, m.prev)
                    const up = d !== null && d > 0
                    const down = d !== null && d < 0
                    const c = colorMap[m.color]
                    return (
                      <div key={m.label} className={`${c.bg} border ${c.border} rounded-2xl p-5`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-lg ${c.text}`}>{m.icon}</span>
                          {d !== null && (
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${up ? 'bg-emerald-100 text-emerald-700' : down ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                              {up ? '↑' : down ? '↓' : '='} %{Math.abs(d).toFixed(0)}
                            </span>
                          )}
                        </div>
                        <p className={`text-2xl font-bold ${c.text}`}>{m.format(m.cur)}</p>
                        <p className="text-xs font-medium text-gray-600 mt-1">{m.label}</p>
                        <p className="text-xs text-gray-400 mt-1">{previous.label}: {m.format(m.prev)}</p>
                      </div>
                    )
                  })}
                </div>

                {/* Görsel Bar Karşılaştırması */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h3 className="font-semibold text-gray-900 mb-5">Detaylı Karşılaştırma</h3>
                  <div className="space-y-5">
                    {[
                      { label: 'Lead', cur: cur.leads, prev: prev.leads, max: Math.max(cur.leads, prev.leads, 1), curColor: 'bg-indigo-500', prevColor: 'bg-indigo-200', format: (v: number) => v.toString() },
                      { label: 'Satış', cur: cur.sales, prev: prev.sales, max: Math.max(cur.sales, prev.sales, 1), curColor: 'bg-emerald-500', prevColor: 'bg-emerald-200', format: (v: number) => v.toString() },
                      { label: 'Ciro', cur: cur.revenue, prev: prev.revenue, max: Math.max(cur.revenue, prev.revenue, 1), curColor: 'bg-violet-500', prevColor: 'bg-violet-200', format: (v: number) => '₺' + v.toLocaleString() },
                    ].map(m => (
                      <div key={m.label}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-gray-700">{m.label}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1.5"><span className={`w-2.5 h-2.5 rounded-sm ${m.curColor}`} />{current.label}: <strong className="text-gray-700">{m.format(m.cur)}</strong></span>
                            <span className="flex items-center gap-1.5"><span className={`w-2.5 h-2.5 rounded-sm ${m.prevColor}`} />{previous.label}: <strong className="text-gray-700">{m.format(m.prev)}</strong></span>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 w-20 text-right flex-shrink-0">{current.label}</span>
                            <div className="flex-1 h-7 bg-gray-50 rounded-lg overflow-hidden">
                              <div className={`h-full ${m.curColor} rounded-lg flex items-center px-3 transition-all`}
                                style={{ width: `${(m.cur / m.max) * 100}%`, minWidth: m.cur > 0 ? '2rem' : '0' }}>
                                {m.cur > 0 && <span className="text-white text-xs font-bold whitespace-nowrap">{m.format(m.cur)}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 w-20 text-right flex-shrink-0">{previous.label}</span>
                            <div className="flex-1 h-7 bg-gray-50 rounded-lg overflow-hidden">
                              <div className={`h-full ${m.prevColor} rounded-lg flex items-center px-3 transition-all`}
                                style={{ width: `${(m.prev / m.max) * 100}%`, minWidth: m.prev > 0 ? '2rem' : '0' }}>
                                {m.prev > 0 && <span className="text-gray-600 text-xs font-medium whitespace-nowrap">{m.format(m.prev)}</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Satışçı Karşılaştırması */}
                {teamMembers.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">Satışçı Performansı</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{current.label} vs {previous.label}</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-indigo-500 rounded-sm" /> {current.label}</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-gray-200 rounded-sm" /> {previous.label}</span>
                      </div>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {memberPerf.map((m: any, i: number) => {
                        const maxSales = Math.max(...memberPerf.map((x: any) => Math.max(x.curSales, x.prevSales)), 1)
                        const up = m.salesDiff !== null && m.salesDiff > 0
                        const down = m.salesDiff !== null && m.salesDiff < 0
                        return (
                          <div key={i} className="px-6 py-4">
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold
                                ${i === 0 ? 'bg-amber-100 text-amber-600' : i === 1 ? 'bg-gray-100 text-gray-500' : 'bg-gray-50 text-gray-400'}`}>
                                {i + 1}
                              </div>
                              <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                <span className="text-indigo-600 text-xs font-bold">{m.name.charAt(0)}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">{m.name}</p>
                                <p className="text-xs text-gray-400">{m.branch}</p>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                {m.salesDiff !== null && (
                                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${up ? 'bg-emerald-100 text-emerald-700' : down ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                                    {up ? '↑' : down ? '↓' : '='} %{Math.abs(m.salesDiff).toFixed(0)}
                                  </span>
                                )}
                                <div className="text-right">
                                  <p className="text-sm font-bold text-emerald-600">{m.curSales} <span className="text-gray-300 font-normal">/ {m.prevSales}</span></p>
                                  <p className="text-xs text-gray-400">satış</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-indigo-600">{m.curLeads} <span className="text-gray-300 font-normal">/ {m.prevLeads}</span></p>
                                  <p className="text-xs text-gray-400">lead</p>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-1 ml-14">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(m.curSales / maxSales) * 100}%` }} />
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-gray-200 rounded-full" style={{ width: `${(m.prevSales / maxSales) * 100}%` }} />
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

              </div>
            )
          })()}

          {/* ── KÂR ANALİZİ ── */}
          {activeTab === 'performans-kar' && (() => {
            const now = new Date()

            // Dönem filtresi — genel ile aynı state paylaşır
            const getPeriodRange = () => {
              const end = new Date(); end.setHours(23,59,59,999)
              if (perfPeriod === 'today') { const s = new Date(); s.setHours(0,0,0,0); return { start: s, end } }
              if (perfPeriod === '7day') { const s = new Date(); s.setDate(s.getDate()-6); s.setHours(0,0,0,0); return { start: s, end } }
              if (perfPeriod === '1month') { const s = new Date(now.getFullYear(), now.getMonth(), 1); return { start: s, end } }
              if (perfPeriod === '3month') { const s = new Date(now.getFullYear(), now.getMonth()-2, 1); return { start: s, end } }
              if (perfPeriod === '6month') { const s = new Date(now.getFullYear(), now.getMonth()-5, 1); return { start: s, end } }
              if (perfPeriod === '1year') { const s = new Date(now.getFullYear(), 0, 1); return { start: s, end } }
              if (perfPeriod === 'custom' && perfStartDate && perfEndDate) {
                const s = new Date(perfStartDate); s.setHours(0,0,0,0)
                const e = new Date(perfEndDate); e.setHours(23,59,59,999)
                return { start: s, end: e }
              }
              return { start: new Date(now.getFullYear(), now.getMonth()-5, 1), end }
            }
            const { start: rangeStart, end: rangeEnd } = getPeriodRange()
            const filteredLeads = leads.filter(l => { const d = new Date(l.created_at); return d >= rangeStart && d <= rangeEnd })
            const soldLeads = filteredLeads.filter(l => l.status === 'procedure_done')

            // Toplam ciro
            const totalRevenue = soldLeads.reduce((s: number, l: any) => s + (l.procedure_amount || 0), 0)

            // Satışçı prim hesabı
            const memberEarnings = teamMembers.map((tm: any) => {
              const branch = branches.find((b: any) => b.id === tm.branch_id)
              const commModel = branch?.commission_model || 'fixed_rate'
              const commValue = tm.commission_value ?? branch?.commission_value ?? 0
              const mSales = soldLeads.filter(l => l.assigned_to === tm.user_id)
              const mRevenue = mSales.reduce((s: number, l: any) => s + (l.procedure_amount || 0), 0)
              const mLeads = filteredLeads.filter(l => l.assigned_to === tm.user_id)

              let prim = 0
              if (commModel === 'fixed_rate') prim = (mRevenue * commValue) / 100
              else if (commModel === 'per_lead') prim = mLeads.length * commValue

              return {
                name: tm.profiles?.full_name || tm.profiles?.email || '—',
                branch: branch?.branch_name || '—',
                leads: mLeads.length,
                sales: mSales.length,
                revenue: mRevenue,
                commModel,
                commValue,
                prim,
              }
            }).sort((a: any, b: any) => b.prim - a.prim)

            const totalPrim = memberEarnings.reduce((s: number, m: any) => s + m.prim, 0)
            const netProfit = totalRevenue - totalPrim

            const periodLabels: any = {
              today: 'Bugün', '7day': 'Son 7 Gün', '1month': 'Bu Ay',
              '3month': 'Son 3 Ay', '6month': 'Son 6 Ay', '1year': 'Bu Yıl', custom: 'Özel Dönem'
            }

            return (
              <div className="space-y-5">

                {/* Dönem Filtresi */}
                <div className="bg-white rounded-2xl border border-gray-100 px-5 py-3.5 flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-medium text-gray-500 flex-shrink-0">Dönem:</span>
                  <div className="flex gap-1 flex-wrap">
                    {[
                      { key: 'today', label: 'Bugün' }, { key: '7day', label: 'Son 7 Gün' },
                      { key: '1month', label: 'Bu Ay' }, { key: '3month', label: 'Son 3 Ay' },
                      { key: '6month', label: 'Son 6 Ay' }, { key: '1year', label: 'Bu Yıl' },
                      { key: 'custom', label: 'Özel' },
                    ].map(p => (
                      <button key={p.key} onClick={() => setPerfPeriod(p.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${perfPeriod === p.key ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                  {perfPeriod === 'custom' && (
                    <div className="flex items-center gap-2 ml-auto">
                      <input type="date" value={perfStartDate} onChange={e => setPerfStartDate(e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      <span className="text-xs text-gray-400">—</span>
                      <input type="date" value={perfEndDate} onChange={e => setPerfEndDate(e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  )}
                </div>

                {/* Ana Özet Kartlar */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl border border-emerald-100 p-5">
                    <p className="text-xs text-gray-400 mb-1">Toplam Ciro</p>
                    <p className="text-3xl font-bold text-emerald-600">₺{totalRevenue.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-1">{soldLeads.length} satış · {periodLabels[perfPeriod]}</p>
                  </div>
                  <div className="bg-gradient-to-br from-rose-50 to-white rounded-2xl border border-rose-100 p-5">
                    <p className="text-xs text-gray-400 mb-1">Toplam Prim</p>
                    <p className="text-3xl font-bold text-rose-500">₺{totalPrim.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-1">{memberEarnings.length} satışçı · komisyon toplamı</p>
                  </div>
                  <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl border border-indigo-100 p-5 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, #4f46e5 1px, transparent 1px)', backgroundSize: '12px 12px' }} />
                    <p className="text-xs text-gray-400 mb-1">Sana Kalan</p>
                    <p className={`text-3xl font-bold ${netProfit >= 0 ? 'text-indigo-600' : 'text-red-500'}`}>₺{netProfit.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {totalRevenue > 0 ? `%${((netProfit / totalRevenue) * 100).toFixed(1)} net oran` : 'Henüz satış yok'}
                    </p>
                  </div>
                </div>

                {/* Görsel Dağılım */}
                {totalRevenue > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <p className="text-sm font-semibold text-gray-900 mb-4">Gelir Dağılımı</p>
                    <div className="h-4 rounded-full overflow-hidden flex">
                      <div className="h-full bg-indigo-500 transition-all" style={{ width: `${(netProfit / totalRevenue) * 100}%` }} title={`Sana kalan: ₺${netProfit.toLocaleString()}`} />
                      <div className="h-full bg-rose-400 transition-all" style={{ width: `${(totalPrim / totalRevenue) * 100}%` }} title={`Primler: ₺${totalPrim.toLocaleString()}`} />
                    </div>
                    <div className="flex gap-6 mt-3">
                      <span className="flex items-center gap-2 text-xs text-gray-500"><span className="w-3 h-3 bg-indigo-500 rounded-sm inline-block" /> Sana kalan %{totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}</span>
                      <span className="flex items-center gap-2 text-xs text-gray-500"><span className="w-3 h-3 bg-rose-400 rounded-sm inline-block" /> Satışçı primleri %{totalRevenue > 0 ? ((totalPrim / totalRevenue) * 100).toFixed(1) : 0}</span>
                    </div>
                  </div>
                )}

                {/* Satışçı Prim Dökümü */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">Satışçı Prim Dökümü</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{periodLabels[perfPeriod]} · komisyon oranlarına göre</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-rose-500">₺{totalPrim.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">toplam prim</p>
                    </div>
                  </div>
                  {memberEarnings.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-10">Henüz satışçı yok.</p>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {memberEarnings.map((m: any, i: number) => {
                        const maxPrim = Math.max(...memberEarnings.map((x: any) => x.prim), 1)
                        return (
                          <div key={i} className="px-6 py-4">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                                <span className="text-blue-600 text-xs font-bold">{m.name.charAt(0)}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">{m.name}</p>
                                <p className="text-xs text-gray-400">{m.branch} · {m.commModel === 'fixed_rate' ? `%${m.commValue} oran` : `₺${m.commValue}/lead`}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-sm font-bold text-rose-500">₺{m.prim.toLocaleString()}</p>
                                <p className="text-xs text-gray-400">prim</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-rose-400 rounded-full" style={{ width: `${(m.prim / maxPrim) * 100}%` }} />
                              </div>
                              <div className="flex gap-3 text-xs text-gray-400 flex-shrink-0">
                                <span>{m.leads} lead</span>
                                <span className="text-emerald-600 font-medium">{m.sales} satış</span>
                                <span>₺{m.revenue.toLocaleString()} ciro</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

              </div>
            )
          })()}

          {/* ── VERİ MERKEZİ ── */}
          {/* ── VERİ YÜKLE ── */}
          {activeTab === 'veri-yukle' && (
            <div className="space-y-5 max-w-3xl">

              {/* Başlık hero */}
              <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white relative overflow-hidden">
                <div className="absolute -right-6 -top-6 w-36 h-36 bg-white/5 rounded-full" />
                <div className="absolute -right-2 bottom-0 w-20 h-20 bg-white/5 rounded-full" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="white" strokeWidth="1.25"/><path d="M5 6h6M5 9h4" stroke="white" strokeWidth="1.25" strokeLinecap="round"/></svg>
                    </div>
                    <span className="text-indigo-200 text-sm font-medium">Veri Merkezi</span>
                  </div>
                  <h2 className="text-xl font-bold">Toplu Lead Yükle</h2>
                  <p className="text-indigo-200 text-sm mt-1">Mevcut müşteri veritabanını sisteme aktar. İki farklı yöntemle yükleyebilirsin.</p>
                </div>
              </div>

              {/* Yöntem seçici */}
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setImportTab('manuel')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${importTab === 'manuel' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:border-indigo-200'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${importTab === 'manuel' ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="3" width="16" height="14" rx="2" stroke={importTab === 'manuel' ? '#6366f1' : '#9ca3af'} strokeWidth="1.5"/><path d="M6 7h8M6 10h8M6 13h5" stroke={importTab === 'manuel' ? '#6366f1' : '#9ca3af'} strokeWidth="1.25" strokeLinecap="round"/></svg>
                  </div>
                  <p className={`text-sm font-bold ${importTab === 'manuel' ? 'text-indigo-700' : 'text-gray-700'}`}>Manuel Giriş</p>
                  <p className="text-xs text-gray-400 mt-0.5">Az sayıda lead için — tabloya direkt yaz</p>
                  {importTab === 'manuel' && <span className="mt-2 inline-block text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full font-medium">Seçili</span>}
                </button>

                <button onClick={() => setImportTab('excel')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${importTab === 'excel' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white hover:border-emerald-200'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${importTab === 'excel' ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 3h8l4 4v10a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" stroke={importTab === 'excel' ? '#059669' : '#9ca3af'} strokeWidth="1.5"/><path d="M12 3v4h4" stroke={importTab === 'excel' ? '#059669' : '#9ca3af'} strokeWidth="1.5" strokeLinejoin="round"/><path d="M7 12l2 2 4-4" stroke={importTab === 'excel' ? '#059669' : '#9ca3af'} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <p className={`text-sm font-bold ${importTab === 'excel' ? 'text-emerald-700' : 'text-gray-700'}`}>Excel / CSV Yükle</p>
                  <p className="text-xs text-gray-400 mt-0.5">Elinde hazır data var — şablona aktar, yükle</p>
                  {importTab === 'excel' && <span className="mt-2 inline-block text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full font-medium">Seçili</span>}
                </button>
              </div>

              {/* ── MANUEL GİRİŞ ── */}
              {importTab === 'manuel' && (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Lead Tablosu</p>
                      <p className="text-xs text-gray-400 mt-0.5">Her satıra bir lead gir, kaynağını seç</p>
                    </div>
                    <span className="text-xs bg-indigo-50 text-indigo-600 font-medium px-2.5 py-1 rounded-lg">
                      {bulkRows.filter(r => r.full_name || r.phone).length} lead hazır
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50/70 border-b border-gray-100">
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-400 w-7">#</th>
                          <th className="px-2 py-2.5 text-left text-xs font-semibold text-gray-400 min-w-[160px]">Ad Soyad</th>
                          <th className="px-2 py-2.5 text-left text-xs font-semibold text-gray-400 min-w-[140px]">Telefon</th>
                          <th className="px-2 py-2.5 text-left text-xs font-semibold text-gray-400 min-w-[135px]">Kaynak</th>
                          <th className="px-2 py-2.5 text-left text-xs font-semibold text-gray-400 min-w-[130px]">Şube</th>
                          <th className="px-2 py-2.5 text-left text-xs font-semibold text-gray-400 min-w-[150px]">Not</th>
                          <th className="px-2 py-2.5 w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkRows.map((row, i) => (
                          <tr key={row.id} className={`border-b border-gray-50 last:border-0 transition-colors ${row.full_name || row.phone ? 'bg-indigo-50/20' : ''}`}>
                            <td className="px-3 py-2 text-xs text-gray-300 font-medium">{i + 1}</td>
                            <td className="px-2 py-2">
                              <input value={row.full_name} onChange={e => setBulkRows(prev => prev.map(r => r.id === row.id ? { ...r, full_name: e.target.value } : r))}
                                placeholder="Ad Soyad"
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder-gray-300" />
                            </td>
                            <td className="px-2 py-2">
                              <input value={row.phone} onChange={e => setBulkRows(prev => prev.map(r => r.id === row.id ? { ...r, phone: e.target.value } : r))}
                                placeholder="05XX XXX XXXX"
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder-gray-300" />
                            </td>
                            <td className="px-2 py-2">
                              <div className="relative">
                                <select value={row.source} onChange={e => setBulkRows(prev => prev.map(r => r.id === row.id ? { ...r, source: e.target.value } : r))}
                                  className="w-full appearance-none px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 pr-7">
                                  <option value="manuel">Manuel</option>
                                  <option value="referral">Referans</option>
                                  <option value="website">Web Sitesi</option>
                                  <option value="whatsapp">WhatsApp</option>
                                  <option value="instagram_dm">Instagram</option>
                                  <option value="meta_form">Meta Form</option>
                                </select>
                                <svg className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              </div>
                            </td>
                            <td className="px-2 py-2">
                              <div className="relative">
                                <select value={row.branch_id} onChange={e => setBulkRows(prev => prev.map(r => r.id === row.id ? { ...r, branch_id: e.target.value } : r))}
                                  className="w-full appearance-none px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 pr-7">
                                  <option value="">Seç</option>
                                  {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                                </select>
                                <svg className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              </div>
                            </td>
                            <td className="px-2 py-2">
                              <input value={row.note} onChange={e => setBulkRows(prev => prev.map(r => r.id === row.id ? { ...r, note: e.target.value } : r))}
                                placeholder="Not..."
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder-gray-300" />
                            </td>
                            <td className="px-2 py-2">
                              {bulkRows.length > 1 && (
                                <button onClick={() => setBulkRows(prev => prev.filter(r => r.id !== row.id))}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-200 hover:text-red-400 transition-colors">
                                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between">
                    <button onClick={() => setBulkRows(prev => [...prev, EMPTY_ROW()])}
                      className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/></svg>
                      Satır Ekle
                    </button>
                    <button onClick={() => setBulkRows([EMPTY_ROW(), EMPTY_ROW(), EMPTY_ROW()])}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                      Temizle
                    </button>
                  </div>

                  {bulkResult && (
                    <div className={`mx-5 mb-4 rounded-xl p-4 border ${bulkResult.errors.length === 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{bulkResult.errors.length === 0 ? '✅' : '⚠️'}</span>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{bulkResult.success} lead başarıyla kaydedildi</p>
                          {bulkResult.errors.length > 0 && <p className="text-xs text-amber-700 mt-0.5">{bulkResult.errors.length} satırda hata</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="px-5 pb-5">
                    <button onClick={handleBulkSave} disabled={bulkLoading || bulkRows.filter(r => r.full_name || r.phone).length === 0}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                      {bulkLoading ? (
                        <><svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70"/></svg>Kaydediliyor...</>
                      ) : (
                        <><svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2 8l4 4 7-7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>{bulkRows.filter(r => r.full_name || r.phone).length} Leadi Kaydet</>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* ── EXCEL YÜKLE ── */}
              {importTab === 'excel' && (
                <div className="space-y-4">

                  {/* Adımlar */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { step: '1', icon: '⬇️', title: 'Şablonu İndir', desc: 'Excel şablonunu indir', color: 'from-blue-50 to-indigo-50 border-blue-100' },
                      { step: '2', icon: '✏️', title: 'Doldur', desc: 'Mevcut datanı kopyala yapıştır', color: 'from-violet-50 to-purple-50 border-violet-100' },
                      { step: '3', icon: '🚀', title: 'Yükle', desc: 'Dosyayı seç ve aktar', color: 'from-emerald-50 to-teal-50 border-emerald-100' },
                    ].map(s => (
                      <div key={s.step} className={`bg-gradient-to-br ${s.color} border rounded-xl p-4 text-center`}>
                        <span className="text-2xl">{s.icon}</span>
                        <p className="text-xs font-bold text-gray-800 mt-2">{s.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                      </div>
                    ))}
                  </div>

                  {/* Şablon indir */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">1. Şablonu İndir</p>
                        <p className="text-xs text-gray-400 mt-0.5">Sütun başlıkları hazır, sadece verilerini yapıştır</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {['Ad Soyad', 'Telefon', 'E-posta', 'Kaynak', 'Not', 'Şube Adı'].map(col => (
                            <span key={col} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium">{col}</span>
                          ))}
                        </div>
                      </div>
                      <button onClick={downloadTemplate}
                        className="flex-shrink-0 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        İndir
                      </button>
                    </div>
                  </div>

                  {/* Dosya yükle */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
                    <p className="text-sm font-semibold text-gray-900">2. Doldurulmuş Dosyayı Yükle</p>

                    {/* Varsayılan satışçı seçici */}
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-lg mt-0.5">👤</span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-800">Varsayılan Satışçı</p>
                          <p className="text-xs text-gray-500 mt-0.5 mb-2">Excel'de "Satışçı" sütunu doluysa o isim öncelikli atanır. Boş satirlar için buradan seç.</p>
                          <div className="relative">
                            <select value={xlsxDefaultAgent} onChange={e => setXlsxDefaultAgent(e.target.value)}
                              className="w-full appearance-none bg-white border border-amber-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 pr-8">
                              <option value="">— Atama yapma (satışçısız kaydet) —</option>
                              {teamMembers.filter(m => m.role === 'agent' || m.role === 'team').map(m => (
                                <option key={m.user_id} value={m.user_id}>{m.profiles?.full_name}</option>
                              ))}
                            </select>
                            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    <label className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all ${xlsxFile ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30'}`}>
                      <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleXlsxFile} />
                      {xlsxFile ? (
                        <div className="text-center px-4">
                          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 7a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" stroke="#059669" strokeWidth="1.5"/></svg>
                          </div>
                          <p className="text-sm font-semibold text-emerald-700">{xlsxFile.name}</p>
                          <p className="text-xs text-emerald-500 mt-0.5">{xlsxPreview.length > 0 ? `${xlsxPreview.length}+ satır okundu` : 'Okunuyor...'} · değiştirmek için tıkla</p>
                        </div>
                      ) : (
                        <div className="text-center px-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 7a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" stroke="#9ca3af" strokeWidth="1.5"/><path d="M12 11v5M9.5 13.5l2.5-2.5 2.5 2.5" stroke="#9ca3af" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </div>
                          <p className="text-sm font-medium text-gray-500">Dosyayı buraya sürükle veya tıkla</p>
                          <p className="text-xs text-gray-400 mt-1">.xlsx, .xls, .csv — max 10MB</p>
                        </div>
                      )}
                    </label>

                    {/* Önizleme */}
                    {xlsxPreview.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">📋 Önizleme (ilk {xlsxPreview.length} satır)</p>
                        <div className="overflow-x-auto rounded-xl border border-gray-100 bg-gray-50">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-gray-200">
                                {Object.keys(xlsxPreview[0]).slice(0, 6).map(k => (
                                  <th key={k} className="px-3 py-2 text-left font-semibold text-gray-500 whitespace-nowrap">{k}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {xlsxPreview.map((row, i) => (
                                <tr key={i} className="border-b border-gray-100 last:border-0 bg-white">
                                  {Object.values(row).slice(0, 6).map((val: any, j) => (
                                    <td key={j} className="px-3 py-2 text-gray-700 whitespace-nowrap max-w-[140px] truncate">{String(val)}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Sonuç */}
                    {xlsxResult && (
                      <div className={`rounded-xl p-4 border ${xlsxResult.errors.length === 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-xl">{xlsxResult.errors.length === 0 ? '✅' : '⚠️'}</span>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{xlsxResult.success} lead başarıyla aktarıldı</p>
                            {xlsxResult.errors.length > 0 && <p className="text-xs text-amber-700">{xlsxResult.errors.length} satırda hata oluştu</p>}
                          </div>
                        </div>
                        {xlsxResult.errors.slice(0, 3).map((e, i) => (
                          <p key={i} className="text-xs text-amber-700 bg-amber-100 rounded-lg px-2 py-1 mt-1">{e}</p>
                        ))}
                      </div>
                    )}

                    <button onClick={handleXlsxSubmit} disabled={!xlsxFile || xlsxLoading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                      {xlsxLoading ? (
                        <><svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70"/></svg>Aktarılıyor...</>
                      ) : (
                        <><svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 10V1M4 4l3.5-3.5L11 4M2 13h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>Leadleri Sisteme Aktar</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── VERİ SETLERİM ── */}
          {activeTab === 'veri-setlerim' && (
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Veri Setlerim</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Toplu lead giriş geçmişin</p>
                </div>
                <button onClick={() => setActiveTab('veri-yukle')}
                  className="text-sm text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/></svg>
                  Yeni Ekle
                </button>
              </div>

              {(() => {
                const sets = [...new Set(leads.filter(l => l.import_set).map(l => l.import_set))]
                if (sets.length === 0) return (
                  <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                    <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 7a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" stroke="#9ca3af" strokeWidth="1.5"/></svg>
                    </div>
                    <p className="text-gray-500 text-sm font-medium">Henüz veri seti yok</p>
                    <p className="text-gray-400 text-xs mt-1">Veri Yükle sekmesinden ilk aktarımını yap</p>
                    <button onClick={() => setActiveTab('veri-yukle')}
                      className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 transition-colors font-medium">
                      Veri Yükle
                    </button>
                  </div>
                )
                return (
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    {sets.map((setName: any, i) => {
                      const setLeads = leads.filter(l => l.import_set === setName)
                      const setDone = setLeads.filter(l => l.status === 'procedure_done').length
                      const conv = setLeads.length > 0 ? ((setDone / setLeads.length) * 100).toFixed(0) : 0
                      const isExcel = setName.includes('.xlsx') || setName.includes('.xls') || setName.includes('.csv')
                      return (
                        <div key={setName} className={`px-5 py-4 flex items-center gap-4 ${i < sets.length - 1 ? 'border-b border-gray-50' : ''}`}>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isExcel ? 'bg-emerald-50' : 'bg-indigo-50'}`}>
                            {isExcel ? (
                              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 4a1 1 0 011-1h7l3 3v9a1 1 0 01-1 1H4a1 1 0 01-1-1V4z" stroke="#059669" strokeWidth="1.25"/><path d="M10 3v3h3" stroke="#059669" strokeWidth="1.25" strokeLinejoin="round"/><path d="M6 10l2 2 4-3" stroke="#059669" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            ) : (
                              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="14" height="14" rx="2" stroke="#6366f1" strokeWidth="1.25"/><path d="M5 7h8M5 10h5" stroke="#6366f1" strokeWidth="1.1" strokeLinecap="round"/></svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{setName}</p>
                            <div className="flex gap-3 mt-1">
                              <span className="text-xs text-indigo-600 font-medium">{setLeads.length} lead</span>
                              <span className="text-xs text-emerald-600 font-medium">{setDone} satış</span>
                              <span className="text-xs text-gray-400">%{conv} dönüşüm</span>
                            </div>
                            <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1.5">
                              <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${conv}%` }} />
                            </div>
                          </div>
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${isExcel ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                            {isExcel ? 'Excel' : 'Manuel'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          )}
          {/* ── FATURALARIM ── */}
{activeTab === 'faturalarim' && (
  <div className="space-y-5 max-w-3xl">
    <div>
      <h2 className="text-base font-semibold text-gray-900">Faturalarım</h2>
      <p className="text-xs text-gray-400 mt-0.5">Hesabınıza kesilen faturalar</p>
    </div>

    {customerInvoices.length === 0 ? (
      <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">◧</div>
        <p className="text-gray-500 text-sm font-medium">Henüz fatura yok</p>
      </div>
    ) : (
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <div className="grid grid-cols-5 gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <div className="col-span-2">Fatura</div>
            <div className="text-right">Tutar</div>
            <div className="text-center">Durum</div>
            <div className="text-right">İşlem</div>
          </div>
        </div>
        {customerInvoices.map((inv, i) => {
          const statusMap: any = {
            pending: { label: 'Bekliyor', color: 'bg-amber-50 text-amber-700 border border-amber-200' },
            awaiting_approval: { label: 'Onay Bekliyor', color: 'bg-blue-50 text-blue-700 border border-blue-200' },
            paid: { label: 'Ödendi', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
            overdue: { label: 'Gecikmiş', color: 'bg-red-50 text-red-700 border border-red-200' },
          }
          const st = statusMap[inv.status] || statusMap.pending
          const issuedBy = inv.issued_by_role === 'superadmin' ? 'DataPilot' : 'Reklamcı'
          return (
            <div key={inv.id} className={`px-5 py-4 grid grid-cols-5 gap-2 items-center hover:bg-gray-50/50 transition-colors ${i < customerInvoices.length - 1 ? 'border-b border-gray-50' : ''}`}>
              <div className="col-span-2">
                <p className="text-sm font-semibold text-gray-900">₺{inv.total_amount?.toLocaleString()}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-400">{new Date(inv.created_at).toLocaleDateString('tr-TR')}</span>
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${inv.issued_by_role === 'superadmin' ? 'bg-violet-50 text-violet-600' : 'bg-amber-50 text-amber-600'}`}>
                    {issuedBy}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">₺{inv.total_amount?.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${st.color}`}>{st.label}</span>
              </div>
              <div className="text-right">
                {inv.status === 'pending' && (
                  <button
                    onClick={async () => {
                      await supabase.from('invoices').update({ status: 'awaiting_approval' }).eq('id', inv.id)
                      const { data: customerData } = await supabase.from('customers').select('id').eq('owner_id', profile.id).maybeSingle()
                      const { data: invoicesData } = await supabase.from('invoices').select('*').eq('customer_id', customerData?.id || '').order('created_at', { ascending: false })
                      setCustomerInvoices(invoicesData || [])
                    }}
                    className="text-xs text-blue-600 font-medium px-3 py-1.5 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200">
                    Ödeme Yaptım
                  </button>
                )}
                {inv.status === 'awaiting_approval' && (
                  <span className="text-xs text-gray-400">Onay bekleniyor...</span>
                )}
                {inv.status === 'paid' && (
                  <span className="text-xs text-emerald-600 font-medium">✓ Onaylandı</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )}
  </div>
)}
          {/* ── AYARLAR ── */}
          {activeTab === 'ayarlar' && (
            <div className="max-w-2xl space-y-5">

              {/* Logo & Profil Başlık */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-5">Firma Profili</h3>
                <div className="flex items-center gap-5 mb-6">
                  <div className="relative flex-shrink-0">
                    {profile?.logo_url ? (
                      <img src={profile.logo_url} alt="Logo" className="w-20 h-20 rounded-2xl object-cover border border-gray-200" />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center border border-indigo-100">
                        <span className="text-indigo-600 text-2xl font-bold">{(profile?.company_name || profile?.full_name || 'F').charAt(0)}</span>
                      </div>
                    )}
                    <label className={`absolute -bottom-2 -right-2 w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center cursor-pointer hover:bg-indigo-700 transition-colors shadow-sm ${logoUploading ? 'opacity-60 pointer-events-none' : ''}`}>
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                      {logoUploading ? (
                        <svg className="animate-spin text-white" width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70"/></svg>
                      ) : (
                        <svg className="text-white" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                      )}
                    </label>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{profile?.company_name || profile?.full_name}</p>
                    <p className="text-sm text-gray-400 mt-0.5">{profile?.email}</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG · Max 2MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input label="Ad Soyad *" value={settingsName} onChange={(e: any) => setSettingsName(e.target.value)} placeholder="Ad Soyad" />
                  <Input label="E-posta" value={profile?.email || ''} readOnly className="opacity-60" />
                  <Input label="Firma Adı" value={settingsCompany} onChange={(e: any) => setSettingsCompany(e.target.value)} placeholder="Firma A.Ş." />
                  <Input label="Telefon" value={settingsPhone} onChange={(e: any) => setSettingsPhone(e.target.value)} placeholder="+90 555 000 0000" />
                  <div className="col-span-2">
                    <Input label="Sektör" value={settingsSector} onChange={(e: any) => setSettingsSector(e.target.value)} placeholder="Estetik, Diş, Emlak..." />
                  </div>
                </div>

                {settingsMsg && (
                  <div className={`mt-4 px-4 py-3 rounded-xl text-sm font-medium ${settingsMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                    {settingsMsg.text}
                  </div>
                )}

                <div className="flex justify-end mt-5">
                  <Btn onClick={handleSaveProfile} disabled={settingsSaving}>
                    {settingsSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                  </Btn>
                </div>
              </div>

              {/* Şifre Değiştir */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-5">Şifre Değiştir</h3>
                <div className="space-y-4">
                  <Input label="Mevcut Şifre" type="password" value={settingsOldPassword} onChange={(e: any) => setSettingsOldPassword(e.target.value)} placeholder="Mevcut şifreniz" />
                  <Input label="Yeni Şifre" type="password" value={settingsNewPassword} onChange={(e: any) => setSettingsNewPassword(e.target.value)} placeholder="En az 6 karakter" />
                  <Input label="Yeni Şifre (Tekrar)" type="password" value={settingsNewPassword2} onChange={(e: any) => setSettingsNewPassword2(e.target.value)} placeholder="Şifreyi tekrar girin" />
                </div>

                {passwordMsg && (
                  <div className={`mt-4 px-4 py-3 rounded-xl text-sm font-medium ${passwordMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                    {passwordMsg.text}
                  </div>
                )}

                <div className="flex justify-end mt-5">
                  <Btn onClick={handleChangePassword} disabled={!settingsOldPassword || !settingsNewPassword || !settingsNewPassword2}>
                    Şifreyi Güncelle
                  </Btn>
                </div>
              </div>

              {/* Plan Bilgisi */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">Abonelik</h3>
                  <span className="text-xs bg-indigo-50 text-indigo-600 font-semibold px-3 py-1 rounded-full">Starter</span>
                </div>
                <p className="text-sm text-gray-400">Plan yükseltme ve fatura detayları için destek ekibiyle iletişime geçin.</p>
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {[
                    { label: 'Şube', value: `${branches.length}`, max: '1', color: 'text-indigo-600' },
                    { label: 'Satışçı', value: `${teamMembers.length}`, max: '3', color: 'text-blue-600' },
                    { label: 'Lead', value: `${leads.length}`, max: '500', color: 'text-emerald-600' },
                  ].map(item => (
                    <div key={item.label} className="bg-gray-50 rounded-xl p-3.5">
                      <div className="flex items-end gap-1 mb-1">
                        <span className={`text-lg font-bold ${item.color}`}>{item.value}</span>
                        <span className="text-xs text-gray-400 mb-0.5">/ {item.max}</span>
                      </div>
                      <p className="text-xs text-gray-400">{item.label}</p>
                      <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full bg-current ${item.color}`} style={{ width: `${Math.min(100, (parseInt(item.value) / parseInt(item.max)) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* ─────────────────── MODALS ─────────────────────── */}

      {/* ── ŞUBE EKLE ── */}
      <Modal open={showAddBranch} onClose={() => setShowAddBranch(false)} title="Yeni Şube" subtitle="Şube bilgilerini girin">
        <form onSubmit={handleAddBranch} className="p-6 space-y-4">
          <Input label="Şube Adı *" value={branchName} onChange={(e: any) => setBranchName(e.target.value)} required placeholder="İstanbul Şubesi" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="İletişim Kişisi" value={branchContact} onChange={(e: any) => setBranchContact(e.target.value)} placeholder="Ad Soyad" />
            <Input label="E-posta" type="email" value={branchEmail} onChange={(e: any) => setBranchEmail(e.target.value)} placeholder="sube@email.com" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Komisyon Modeli" value={commissionModel} onChange={(e: any) => setCommissionModel(e.target.value)}>
              <option value="fixed_rate">Sabit Oran</option>
              <option value="per_lead">Lead Başına</option>
            </Select>
            <Input label="Komisyon Değeri" type="number" value={commissionValue} onChange={(e: any) => setCommissionValue(e.target.value)} placeholder="10" />
          </div>
          <div className="flex gap-3 pt-2">
            <Btn type="button" variant="secondary" className="flex-1" onClick={() => setShowAddBranch(false)}>İptal</Btn>
            <Btn type="submit" className="flex-1" disabled={saving}>{saving ? 'Oluşturuluyor...' : 'Şube Oluştur'}</Btn>
          </div>
        </form>
      </Modal>

      {/* ── ÜYE EKLE ── */}
      <Modal open={showAddMember} onClose={() => setShowAddMember(false)} title="Ekip Üyesi Ekle" subtitle="Yeni satışçı veya yönetici ekleyin">
        <form onSubmit={handleAddMember} className="p-6 space-y-4">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Rol</p>
            <div className="grid grid-cols-2 gap-2">
              {[{ key: 'agent', label: '👤 Satışçı' }, { key: 'manager', label: '👔 Yönetici' }].map(r => (
                <button key={r.key} type="button" onClick={() => setMemberRole(r.key)}
                  className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${memberRole === r.key ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Ad Soyad *" value={memberName} onChange={(e: any) => setMemberName(e.target.value)} required placeholder="Ad Soyad" />
            <Select label="Şube *" value={memberBranch} onChange={(e: any) => setMemberBranch(e.target.value)} required>
              <option value="">Şube seçin...</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="E-posta *" type="email" value={memberEmail} onChange={(e: any) => setMemberEmail(e.target.value)} required placeholder="satis@email.com" />
            <Input label="Şifre *" type="password" value={memberPassword} onChange={(e: any) => setMemberPassword(e.target.value)} required placeholder="En az 6 karakter" />
          </div>
          <Input label="Prim Oranı (%)" type="number" value={memberCommission} onChange={(e: any) => setMemberCommission(e.target.value)} placeholder="10" />
          <div className="flex gap-3 pt-2">
            <Btn type="button" variant="secondary" className="flex-1" onClick={() => setShowAddMember(false)}>İptal</Btn>
            <Btn type="submit" className="flex-1" disabled={saving}>{saving ? 'Ekleniyor...' : 'Üye Ekle'}</Btn>
          </div>
        </form>
      </Modal>

      {/* ── LEAD EKLE ── */}
      <Modal open={showAddLead} onClose={() => setShowAddLead(false)} title="Yeni Lead" subtitle="Manuel lead ekleyin" size="lg">
        <form onSubmit={handleAddLead} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Ad Soyad *" value={leadName} onChange={(e: any) => setLeadName(e.target.value)} required placeholder="Ad Soyad" />
            <Input label="Telefon *" value={leadPhone} onChange={(e: any) => setLeadPhone(e.target.value)} required placeholder="05xx xxx xx xx" />
            <Input label="E-posta" type="email" value={leadEmail} onChange={(e: any) => setLeadEmail(e.target.value)} placeholder="ornek@email.com" />
           <Select label="Şube" value={leadBranch} onChange={(e: any) => setLeadBranch(e.target.value)}>
              <option value="">Şube seçin...</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
            </Select>
            <Select label="Kaynak" value={leadSource} onChange={(e: any) => setLeadSource(e.target.value)}>
              <option value="manual">Manuel Giriş</option>
              <option value="meta_form">Meta Form</option>
              <option value="instagram_dm">Instagram DM</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="website">Web Sitesi</option>
              <option value="referral">Referans</option>
            </Select>
            <Select label="Satışçıya Ata" value={leadAssignTo} onChange={(e: any) => setLeadAssignTo(e.target.value)}>
              <option value="">Atama yapma</option>
              {teamMembers.filter(m => m.role === 'agent').map(m => <option key={m.user_id} value={m.user_id}>{m.profiles?.full_name}</option>)}
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Not</label>
            <textarea value={leadNote} onChange={e => setLeadNote(e.target.value)} rows={2} placeholder="Ek not..."
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <Btn type="button" variant="secondary" className="flex-1" onClick={() => setShowAddLead(false)}>İptal</Btn>
            <Btn type="submit" className="flex-1" disabled={saving}>{saving ? 'Ekleniyor...' : 'Lead Ekle'}</Btn>
          </div>
        </form>
      </Modal>

      {/* ── DURUM GÜNCELLE ── */}
      <Modal open={!!selectedLead} onClose={() => setSelectedLead(null)} title={selectedLead?.full_name || 'Lead'} subtitle={`${selectedLead?.lead_code} · Durum güncelle`}>
        <form onSubmit={handleUpdateStatus} className="p-6 space-y-4">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Yeni Durum</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(STATUS_CONFIG).map(([key, val]: any) => (
                <button key={key} type="button" onClick={() => setNewStatus(key)}
                  className={`py-2.5 px-3 rounded-xl text-sm font-medium border-2 transition-all flex items-center gap-2 ${newStatus === key ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                  <span className={`w-2 h-2 rounded-full ${val.dot}`} />{val.label}
                </button>
              ))}
            </div>
          </div>
          {newStatus === 'procedure_done' && (
            <div className="bg-emerald-50 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-emerald-700">Satış Detayları</p>
              <Input label="İşlem Tipi" value={procedureType} onChange={(e: any) => setProcedureType(e.target.value)} placeholder="Örn: Yıllık üyelik" />
              <Input label="Tutar (₺)" type="number" value={procedureAmount} onChange={(e: any) => setProcedureAmount(e.target.value)} placeholder="0" />
            </div>
          )}
          {newStatus === 'appointment_scheduled' && (
            <div className="bg-violet-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-violet-700 mb-2">Randevu Tarihi</p>
              <Input type="datetime-local" value={appointmentDate} onChange={(e: any) => setAppointmentDate(e.target.value)} />
            </div>
          )}
          {newStatus === 'cancelled' && (
            <Input label="İptal Sebebi" value={cancelReason} onChange={(e: any) => setCancelReason(e.target.value)} placeholder="Sebebi yazın..." />
          )}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Not</label>
            <textarea value={statusNote} onChange={e => setStatusNote(e.target.value)} rows={2} placeholder="Görüşme notu..."
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <Btn type="button" variant="secondary" className="flex-1" onClick={() => setSelectedLead(null)}>İptal</Btn>
            <Btn type="submit" className="flex-1" disabled={saving || !newStatus}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Btn>
          </div>
        </form>
      </Modal>

      {/* ── LEAD DETAY ── */}
      <Modal open={showDetailModal} onClose={() => setShowDetailModal(false)} title={detailLead?.full_name || 'Lead Detayı'} subtitle={detailLead?.lead_code} size="lg">
        {detailLead && (
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-3">
              <Badge status={detailLead.status} />
              <SourceBadge source={detailLead.source} />
              {detailLead.procedure_amount > 0 && <span className="text-sm font-semibold text-emerald-600">₺{detailLead.procedure_amount.toLocaleString()}</span>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3.5">
                <p className="text-xs text-gray-400 mb-1">Telefon</p>
                <p className="text-sm font-medium text-gray-900">{detailLead.phone}</p>
              </div>
              {detailLead.email && (
                <div className="bg-gray-50 rounded-xl p-3.5">
                  <p className="text-xs text-gray-400 mb-1">E-posta</p>
                  <p className="text-sm font-medium text-gray-900 truncate">{detailLead.email}</p>
                </div>
              )}
              <div className="bg-gray-50 rounded-xl p-3.5">
                <p className="text-xs text-gray-400 mb-1">Eklenme</p>
                <p className="text-sm font-medium text-gray-900">{new Date(detailLead.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              {detailLead.appointment_at && (
                <div className="bg-violet-50 rounded-xl p-3.5">
                  <p className="text-xs text-violet-400 mb-1">Randevu</p>
                  <p className="text-sm font-medium text-violet-700">{new Date(detailLead.appointment_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              )}
            </div>
            {detailLead.note && (
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                <p className="text-xs font-medium text-amber-600 mb-1">Not</p>
                <p className="text-sm text-gray-700">{detailLead.note}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">İşlem Geçmişi</p>
              {leadHistory.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">Henüz işlem yapılmamış.</p>
              ) : (
                <div className="space-y-2">
                  {leadHistory.map((h, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 mt-2 flex-shrink-0" />
                      <div className="flex-1 bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <Badge status={h.old_status} />
                            <svg className="text-gray-300" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            <Badge status={h.new_status} />
                          </div>
                          <p className="text-xs text-gray-400">{new Date(h.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        {h.note && <p className="text-xs text-gray-600 mt-1">{h.note}</p>}
                        {h.profiles?.full_name && <p className="text-xs text-gray-400 mt-0.5">— {h.profiles.full_name}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setDeletingLeadId(detailLead.id); setShowDeleteConfirm(true) }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-100 text-red-400 hover:bg-red-50 hover:text-red-600 text-xs font-medium transition-colors">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1.5 3h9M4 3V2h4v1M5 5.5v3M7 5.5v3M2.5 3l.5 7h6l.5-7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Sil
              </button>
              <button onClick={() => { setShowDetailModal(false); setEditLead({...detailLead}); setShowEditModal(true) }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-blue-100 text-blue-500 hover:bg-blue-50 hover:text-blue-700 text-xs font-medium transition-colors">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 1.5l2.5 2.5-6.5 6.5H1.5V8L8 1.5z" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Düzenle
              </button>
              <Btn className="flex-1" onClick={() => { setShowDetailModal(false); setSelectedLead(detailLead); setNewStatus(detailLead.status) }}>
                Durumu Güncelle
              </Btn>
            </div>
          </div>
        )}
      </Modal>

      {/* ── ÜYE DETAY ── */}
      <Modal open={!!selectedMember} onClose={() => setSelectedMember(null)} title={selectedMember?.profiles?.full_name || 'Ekip Üyesi'} subtitle={selectedMember?.branches?.branch_name} size="lg">
        {selectedMember && (
          <div className="p-6">
            <div className="flex gap-2 mb-5 border-b border-gray-100 pb-4">
              {(['leads', 'hakedis', 'loglar'] as const).map(tab => (
                <button key={tab} onClick={() => setMemberTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${memberTab === tab ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                  {tab === 'leads' ? 'Leadler' : tab === 'hakedis' ? 'Hakediş' : 'Loglar'}
                </button>
              ))}
            </div>
            {memberTab === 'leads' && (
              <div className="space-y-2">
                {leads.filter(l => l.assigned_to === selectedMember.user_id).length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">Lead atanmamış.</p>
                ) : leads.filter(l => l.assigned_to === selectedMember.user_id).map(lead => (
                  <div key={lead.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{lead.full_name}</p>
                      <p className="text-xs text-gray-400">{lead.phone}</p>
                    </div>
                    <Badge status={lead.status} />
                  </div>
                ))}
              </div>
            )}
            {memberTab === 'hakedis' && (
              <div className="space-y-3">
                {(() => {
                  const mLeads = leads.filter(l => l.assigned_to === selectedMember.user_id)
                  const mSales = mLeads.filter(l => l.status === 'procedure_done')
                  const mRevenue = mSales.reduce((s, l) => s + (l.procedure_amount || 0), 0)
                  const commission = mRevenue * ((selectedMember.commission_rate || 0) / 100)
                  return (
                    <>
                      {[
                        { label: 'Toplam Lead', value: mLeads.length, color: 'text-blue-600' },
                        { label: 'Toplam Satış', value: mSales.length, color: 'text-emerald-600' },
                        { label: 'Toplam Ciro', value: `₺${mRevenue.toLocaleString()}`, color: 'text-gray-900' },
                        { label: 'Prim Oranı', value: `%${selectedMember.commission_rate || 0}`, color: 'text-gray-900' },
                        { label: 'Toplam Prim', value: `₺${commission.toLocaleString()}`, color: 'text-indigo-600', highlight: true },
                      ].map(item => (
                        <div key={item.label} className={`flex items-center justify-between px-4 py-3 rounded-xl ${item.highlight ? 'bg-indigo-50' : 'bg-gray-50'}`}>
                          <p className="text-sm text-gray-600">{item.label}</p>
                          <p className={`text-sm font-semibold ${item.color}`}>{item.value}</p>
                        </div>
                      ))}
                    </>
                  )
                })()}
              </div>
            )}
            {memberTab === 'loglar' && <p className="text-gray-400 text-sm text-center py-8">Loglar yakında eklenecek.</p>}
          </div>
        )}
      </Modal>

      {/* ── SİLME ONAY ── */}
      <Modal open={showDeleteConfirm} onClose={() => { setShowDeleteConfirm(false); setDeletingLeadId(null) }} title="Lead'i Sil" subtitle="Bu işlem geri alınamaz">
        <div className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3">
            <span className="text-2xl flex-shrink-0">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-gray-900">Emin misiniz?</p>
              <p className="text-xs text-gray-500 mt-1">Bu lead ve tüm işlem geçmişi kalıcı olarak silinecek. Bu işlem geri alınamaz.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Btn variant="secondary" className="flex-1" onClick={() => { setShowDeleteConfirm(false); setDeletingLeadId(null) }}>Vazgeç</Btn>
            <button onClick={handleDeleteLead}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
              Evet, Sil
            </button>
          </div>
        </div>
      </Modal>

      {/* ── LEAD DÜZENLE ── */}
      <Modal open={showEditModal} onClose={() => { setShowEditModal(false); setEditLead(null) }} title="Lead Düzenle" subtitle={editLead?.lead_code}>
        {editLead && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-500 mb-1 block">Ad Soyad</label>
                <input value={editLead.full_name || ''} onChange={e => setEditLead((prev: any) => ({ ...prev, full_name: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="Ad Soyad" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Telefon</label>
                <input value={editLead.phone || ''} onChange={e => setEditLead((prev: any) => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="05XX XXX XXXX" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">E-posta</label>
                <input value={editLead.email || ''} onChange={e => setEditLead((prev: any) => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="ornek@email.com" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Kaynak</label>
                <div className="relative">
                  <select value={editLead.source || 'manuel'} onChange={e => setEditLead((prev: any) => ({ ...prev, source: e.target.value }))}
                    className="w-full appearance-none px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 pr-8">
                    <option value="manuel">✏️ Manuel</option>
                    <option value="meta_form">🎯 Meta Form</option>
                    <option value="whatsapp">💬 WhatsApp</option>
                    <option value="instagram_dm">📸 Instagram</option>
                    <option value="referral">🤝 Referans</option>
                    <option value="website">🌐 Web Sitesi</option>
                  </select>
                  <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Şube</label>
                <div className="relative">
                  <select value={editLead.branch_id || ''} onChange={e => setEditLead((prev: any) => ({ ...prev, branch_id: e.target.value }))}
                    className="w-full appearance-none px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 pr-8">
                    <option value="">Şube seç</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                  </select>
                  <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-500 mb-1 block">Atanan Satışçı</label>
                <div className="relative">
                  <select value={editLead.assigned_to || ''} onChange={e => setEditLead((prev: any) => ({ ...prev, assigned_to: e.target.value || null }))}
                    className="w-full appearance-none px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 pr-8">
                    <option value="">— Atanmamış —</option>
                    {teamMembers.filter(m => m.role === 'agent' || m.role === 'team').map(m => (
                      <option key={m.user_id} value={m.user_id}>{m.profiles?.full_name}</option>
                    ))}
                  </select>
                  <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-500 mb-1 block">Not</label>
                <textarea value={editLead.note || ''} onChange={e => setEditLead((prev: any) => ({ ...prev, note: e.target.value }))} rows={3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" placeholder="Not ekle..." />
              </div>
                {editLead.status === 'procedure_done' && (
                <div className="col-span-2 border-t border-gray-100 pt-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Satış Detayları</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">İşlem Tipi</label>
                      <input value={editLead.procedure_type || ''} onChange={e => setEditLead((prev: any) => ({ ...prev, procedure_type: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="Örn: Yıllık üyelik" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Satış Tutarı (₺)</label>
                      <input type="number" value={editLead.procedure_amount || ''} onChange={e => setEditLead((prev: any) => ({ ...prev, procedure_amount: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="0" />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-1">
              <Btn variant="secondary" className="flex-1" onClick={() => { setShowEditModal(false); setEditLead(null) }}>İptal</Btn>
              <Btn className="flex-1" onClick={handleEditLead} disabled={editLoading}>
                {editLoading ? 'Kaydediliyor...' : 'Kaydet'}
              </Btn>
            </div>
          </div>
        )}
      </Modal>
        {/* ── ÖDEME RAPORU ── */}
      <Modal open={showPaymentReport} onClose={() => setShowPaymentReport(false)} title="Ödeme Raporu" subtitle="Hakediş ve ödeme geçmişi" size="xl">
        <div className="p-6 space-y-5">

          {/* Filtreler */}
          <div className="grid grid-cols-2 gap-4">
            <Select label="Satışçı" value={paymentReportMember} onChange={(e: any) => setPaymentReportMember(e.target.value)}>
              <option value="all">Tüm Satışçılar</option>
              {teamMembers.map(m => <option key={m.id} value={m.id}>{m.profiles?.full_name}</option>)}
            </Select>
            <Select label="Dönem" value={paymentReportPeriod} onChange={(e: any) => setPaymentReportPeriod(e.target.value)}>
              <option value="all">Tüm Zamanlar</option>
              <option value="this_month">Bu Ay</option>
              <option value="last_month">Geçen Ay</option>
              <option value="this_year">Bu Yıl</option>
              <option value="custom">Özel Tarih</option>
            </Select>
          </div>

          {paymentReportPeriod === 'custom' && (
            <div className="grid grid-cols-2 gap-3 bg-indigo-50 rounded-xl p-4">
              <Input label="Başlangıç" type="date" value={paymentReportStart} onChange={(e: any) => setPaymentReportStart(e.target.value)} />
              <Input label="Bitiş" type="date" value={paymentReportEnd} onChange={(e: any) => setPaymentReportEnd(e.target.value)} />
            </div>
          )}

          {/* Tablo */}
          {(() => {
            const now = new Date()
            let start: Date | null = null
            let end: Date | null = null

            if (paymentReportPeriod === 'this_month') {
              start = new Date(now.getFullYear(), now.getMonth(), 1)
              end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
            } else if (paymentReportPeriod === 'last_month') {
              start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
              end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
            } else if (paymentReportPeriod === 'this_year') {
              start = new Date(now.getFullYear(), 0, 1)
              end = new Date(now.getFullYear(), 11, 31, 23, 59, 59)
            } else if (paymentReportPeriod === 'custom' && paymentReportStart && paymentReportEnd) {
              start = new Date(paymentReportStart)
              end = new Date(paymentReportEnd + 'T23:59:59')
            }

            const filteredPayments = commissionPayments.filter(p => {
              const matchesMember = paymentReportMember === 'all' || p.team_member_id === paymentReportMember
              const d = new Date(p.paid_at)
              const matchesDate = !start || !end || (d >= start && d <= end)
              return matchesMember && matchesDate
            })

            // Her satışçı için özet
            const memberSummaries = teamMembers
              .filter(m => paymentReportMember === 'all' || m.id === paymentReportMember)
              .map(m => {
                const mSales = leads.filter(l => l.assigned_to === m.user_id && l.status === 'procedure_done')
                const mRevenue = mSales.reduce((s, l) => s + (l.procedure_amount || 0), 0)
                const totalEarned = mRevenue * ((m.commission_rate || 0) / 100)
                const allPaid = commissionPayments.filter(p => p.team_member_id === m.id).reduce((s, p) => s + (p.amount || 0), 0)
                const periodPaid = filteredPayments.filter(p => p.team_member_id === m.id).reduce((s, p) => s + (p.amount || 0), 0)
                const remaining = totalEarned - allPaid
                const memberPayments = filteredPayments.filter(p => p.team_member_id === m.id)
                return { member: m, totalEarned, allPaid, periodPaid, remaining, memberPayments }
              })

            const totalPeriodPaid = memberSummaries.reduce((s, ms) => s + ms.periodPaid, 0)
            const totalRemaining = memberSummaries.reduce((s, ms) => s + Math.max(0, ms.remaining), 0)

            const downloadPaymentExcel = async () => {
              setPaymentReportLoading(true)
              const XLSX = await import('xlsx')
              const rows: any[] = []
              memberSummaries.forEach(ms => {
                if (ms.memberPayments.length === 0) {
                  rows.push({
                    'Satışçı': ms.member.profiles?.full_name || '',
                    'Şube': ms.member.branches?.branch_name || '',
                    'Ödeme Tarihi': '—',
                    'Ödeme Tutarı': 0,
                    'Not': '',
                    'Toplam Hakediş': ms.totalEarned,
                    'Toplam Ödenen': ms.allPaid,
                    'Kalan Borç': Math.max(0, ms.remaining),
                  })
                } else {
                  ms.memberPayments.forEach((p, i) => {
                    rows.push({
                      'Satışçı': i === 0 ? (ms.member.profiles?.full_name || '') : '',
                      'Şube': i === 0 ? (ms.member.branches?.branch_name || '') : '',
                      'Ödeme Tarihi': new Date(p.paid_at).toLocaleDateString('tr-TR'),
                      'Ödeme Tutarı': p.amount,
                      'Not': p.note || '',
                      'Toplam Hakediş': i === 0 ? ms.totalEarned : '',
                      'Toplam Ödenen': i === 0 ? ms.allPaid : '',
                      'Kalan Borç': i === 0 ? Math.max(0, ms.remaining) : '',
                    })
                  })
                }
              })
              const ws = XLSX.utils.json_to_sheet(rows)
              ws['!cols'] = [20, 15, 14, 14, 25, 16, 14, 12].map(w => ({ wch: w }))
              const wb = XLSX.utils.book_new()
              XLSX.utils.book_append_sheet(wb, ws, 'Ödeme Raporu')
              XLSX.writeFile(wb, `DataPilot_Odeme_Raporu_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.xlsx`)
              setPaymentReportLoading(false)
            }

            const downloadPaymentPDF = async () => {
              setPaymentReportLoading(true)
              const { default: jsPDF } = await import('jspdf')
              const { default: autoTable } = await import('jspdf-autotable')
              const doc = new jsPDF({ orientation: 'landscape' })
              doc.setFontSize(16); doc.setFont('helvetica', 'bold')
              doc.text('DataPilot — Odeme Raporu', 14, 18)
              doc.setFontSize(9); doc.setFont('helvetica', 'normal')
              doc.text(`Toplam Odenen: TL${totalPeriodPaid.toLocaleString()}  |  Kalan Borc: TL${totalRemaining.toLocaleString()}  |  ${memberSummaries.length} satisci`, 14, 26)
              const tableRows: any[] = []
              memberSummaries.forEach(ms => {
                if (ms.memberPayments.length === 0) {
                  tableRows.push([ms.member.profiles?.full_name || '', ms.member.branches?.branch_name || '', '—', '—', `TL${ms.totalEarned.toLocaleString()}`, `TL${ms.allPaid.toLocaleString()}`, `TL${Math.max(0, ms.remaining).toLocaleString()}`])
                } else {
                  ms.memberPayments.forEach((p, i) => {
                    tableRows.push([
                      i === 0 ? (ms.member.profiles?.full_name || '') : '',
                      i === 0 ? (ms.member.branches?.branch_name || '') : '',
                      new Date(p.paid_at).toLocaleDateString('tr-TR'),
                      `TL${p.amount.toLocaleString()}`,
                      i === 0 ? `TL${ms.totalEarned.toLocaleString()}` : '',
                      i === 0 ? `TL${ms.allPaid.toLocaleString()}` : '',
                      i === 0 ? `TL${Math.max(0, ms.remaining).toLocaleString()}` : '',
                    ])
                  })
                }
              })
              autoTable(doc, {
                startY: 32,
                head: [['Satisci', 'Sube', 'Odeme Tarihi', 'Tutar', 'Toplam Hakedis', 'Toplam Odenen', 'Kalan Borc']],
                body: tableRows,
                styles: { fontSize: 8, cellPadding: 3 },
                headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [249, 250, 251] },
              })
              doc.save(`DataPilot_Odeme_Raporu_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.pdf`)
              setPaymentReportLoading(false)
            }

            return (
              <>
                {/* Özet Kartlar */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-400 mb-1">Dönem Ödenen</p>
                    <p className="text-xl font-bold text-emerald-600">₺{totalPeriodPaid.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-400 mb-1">Toplam Kalan Borç</p>
                    <p className="text-xl font-bold text-amber-600">₺{totalRemaining.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-400 mb-1">İşlem Sayısı</p>
                    <p className="text-xl font-bold text-indigo-600">{filteredPayments.length}</p>
                  </div>
                </div>

                {/* Satışçı Bazlı Tablo */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/50">
                    <div className="grid grid-cols-7 gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      <div className="col-span-2">Satışçı</div>
                      <div className="text-right">Hakediş</div>
                      <div className="text-right">Ödenen</div>
                      <div className="text-right">Kalan</div>
                      <div className="col-span-2">Son Ödeme</div>
                    </div>
                  </div>
                  {memberSummaries.length === 0 ? (
                    <div className="p-12 text-center">
                      <p className="text-gray-400 text-sm">Seçilen kriterlere göre sonuç bulunamadı.</p>
                    </div>
                  ) : memberSummaries.map((ms, i) => (
                    <div key={ms.member.id} className={`${i < memberSummaries.length - 1 ? 'border-b border-gray-50' : ''}`}>
                      {/* Satışçı Özet Satırı */}
                      <div className="px-5 py-3 grid grid-cols-7 gap-2 items-center hover:bg-gray-50/50 transition-colors">
                        <div className="col-span-2 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                            <span className="text-indigo-600 text-xs font-bold">{ms.member.profiles?.full_name?.charAt(0)}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{ms.member.profiles?.full_name}</p>
                            <p className="text-xs text-gray-400 truncate">{ms.member.branches?.branch_name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-rose-500">₺{ms.totalEarned.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-emerald-600">₺{ms.allPaid.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${ms.remaining > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                            ₺{Math.max(0, ms.remaining).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                          </p>
                        </div>
                        <div className="col-span-2 text-xs text-gray-400">
                          {ms.memberPayments.length > 0
                            ? new Date(ms.memberPayments[ms.memberPayments.length - 1].paid_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
                            : '— Ödeme yok'}
                        </div>
                      </div>

                      {/* Ödeme Detayları */}
                      {ms.memberPayments.length > 0 && (
                        <div className="bg-gray-50/50 border-t border-gray-50 px-5 py-2 space-y-1.5">
                          {ms.memberPayments.map((p) => (
                            <div key={p.id} className="flex items-center gap-3 py-1">
                              <div className="w-5 h-5 bg-emerald-100 rounded-md flex items-center justify-center flex-shrink-0 ml-9">
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 5l3 3 5-4" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              </div>
                              <p className="text-xs text-gray-500 w-28 flex-shrink-0">
                                {new Date(p.paid_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                              <p className="text-xs font-semibold text-emerald-600 w-24 flex-shrink-0">₺{p.amount.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
                              {p.note && <p className="text-xs text-gray-400 truncate">{p.note}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* İndir Butonları */}
                <div className="flex gap-3">
                  <Btn variant="secondary" className="flex-1" onClick={() => setShowPaymentReport(false)}>Kapat</Btn>
                  <Btn variant="success" className="flex-1" onClick={downloadPaymentExcel} disabled={paymentReportLoading}>
                    {paymentReportLoading ? 'Hazırlanıyor...' : '📗 Excel İndir'}
                  </Btn>
                  <Btn className="flex-1" onClick={downloadPaymentPDF} disabled={paymentReportLoading}>
                    {paymentReportLoading ? 'Hazırlanıyor...' : '📕 PDF İndir'}
                  </Btn>
                </div>
              </>
            )
          })()}
        </div>
      </Modal>
      {/* ── RAPOR ── */}
      <Modal open={showReportPanel} onClose={() => setShowReportPanel(false)} title="Rapor İndir" subtitle="Filtreleri ayarlayın ve indirin">
        <div className="p-6 space-y-5">
          <Select label="Dönem" value={reportPeriod} onChange={(e: any) => setReportPeriod(e.target.value)}>
            <option value="today">Bugün</option>
            <option value="this_week">Bu Hafta</option>
            <option value="this_month">Bu Ay</option>
            <option value="last_month">Geçen Ay</option>
            <option value="custom">Özel Tarih Aralığı</option>
          </Select>
          {reportPeriod === 'custom' && (
            <div className="grid grid-cols-2 gap-3 bg-indigo-50 rounded-xl p-4">
              <Input label="Başlangıç" type="date" value={reportStartDate} onChange={(e: any) => setReportStartDate(e.target.value)} />
              <Input label="Bitiş" type="date" value={reportEndDate} onChange={(e: any) => setReportEndDate(e.target.value)} />
            </div>
          )}
          <Select label="Durum Filtresi" value={reportStatus} onChange={(e: any) => setReportStatus(e.target.value)}>
            <option value="all">Tüm Durumlar</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]: any) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Format</p>
            <div className="grid grid-cols-2 gap-3">
              {[{ key: 'excel', label: 'Excel', icon: '📗', ext: '.xlsx' }, { key: 'pdf', label: 'PDF', icon: '📕', ext: '.pdf' }].map(f => (
                <button key={f.key} onClick={() => setReportFormat(f.key)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${reportFormat === f.key ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <span className="text-xl block mb-1">{f.icon}</span>
                  <p className={`text-sm font-semibold ${reportFormat === f.key ? 'text-indigo-700' : 'text-gray-700'}`}>{f.label}</p>
                  <p className="text-xs text-gray-400">{f.ext} dosyası</p>
                </button>
              ))}
            </div>
          </div>
          <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl p-4 flex items-center justify-between border border-indigo-100">
            <div>
              <p className="text-xs text-gray-500">Seçilen kriterlere göre</p>
              <p className="text-xl font-bold text-indigo-600 mt-0.5">{getReportLeads().length} <span className="text-sm font-normal text-gray-500">lead</span></p>
            </div>
            <span className="text-3xl">{reportFormat === 'excel' ? '📗' : '📕'}</span>
          </div>
          <div className="flex gap-3">
            <Btn variant="secondary" className="flex-1" onClick={() => setShowReportPanel(false)}>İptal</Btn>
            <Btn variant="success" className="flex-1" onClick={reportFormat === 'excel' ? downloadExcel : downloadPDF} disabled={reportLoading || getReportLeads().length === 0}>
              {reportLoading ? 'Hazırlanıyor...' : `${reportFormat === 'excel' ? '📗' : '📕'} İndir`}
            </Btn>
          </div>
        </div>
      </Modal>

    </div>
  )
}