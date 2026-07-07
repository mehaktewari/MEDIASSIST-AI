import { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import useLanguages from '../hooks/useLanguages'

const API = 'http://localhost:8000/api'

export default function DoctorNotePage() {
  const LANGUAGES = useLanguages()
  const [fileId, setFileId] = useState(localStorage.getItem('last_file_id') || '')
  const [patientName, setPatientName] = useState('')
  const [language, setLanguage] = useState(localStorage.getItem('preferred_language') || 'english')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleGenerate = async () => {
    if (!fileId.trim()) return toast.error('Please enter a File ID!')
    setLoading(true)
    const toastId = toast.loading('Writing doctor\'s note...')

    try {
      const res = await axios.post(`${API}/generate-doctor-note`, {
        file_id: fileId,
        patient_name: patientName.trim() || null,
        language,
      })
      setResult(res.data)
      toast.success('Note generated!', { id: toastId })
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to generate note', { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  const exportTxt = () => {
    if (!result) return
    const content = `DOCTOR'S NOTE\nGenerated ${result.generated_at}\nPatient: ${result.patient_name}\n${'='.repeat(40)}\n\n${result.doctor_note}\n\n${'='.repeat(40)}\nThis is an AI-generated note. Always have it reviewed by a licensed physician.`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Doctor-Note-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Exported as .txt')
  }

  const exportPdf = () => {
    if (!result) return
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const marginX = 44
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const maxWidth = pageWidth - marginX * 2
    let y = 56

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(20)
    doc.text("Doctor's Note", marginX, y)
    y += 20

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(120)
    doc.text(`Patient: ${result.patient_name}  •  Generated ${result.generated_at}`, marginX, y)
    y += 26

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10.5)
    doc.setTextColor(30)
    const lines = doc.splitTextToSize(result.doctor_note, maxWidth)
    lines.forEach(line => {
      if (y > pageHeight - 50) { doc.addPage(); y = 56 }
      doc.text(line, marginX, y)
      y += 15
    })

    if (y > pageHeight - 60) { doc.addPage(); y = 56 }
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(150)
    doc.text('This is an AI-generated note. Always have it reviewed by a licensed physician.', marginX, pageHeight - 30)

    doc.save(`Doctor-Note-${Date.now()}.pdf`)
    toast.success('Exported as PDF')
  }

  return (
    <div className="max-w-2xl mx-auto animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">📝 Doctor Report Generator</h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm">Turn raw report text into a professional clinical note</p>
        </div>
        {result && (
          <div className="flex gap-2">
            <button onClick={exportPdf}
              className="bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-teal-700 transition-all">
              📄 PDF
            </button>
            <button onClick={exportTxt}
              className="bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-slate-300 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/20 transition-all">
              TXT
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">File ID</label>
          <input
            type="text"
            value={fileId}
            onChange={e => { setFileId(e.target.value); localStorage.setItem('last_file_id', e.target.value) }}
            placeholder="e.g. a1b2c3d4"
            className="w-full border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-gray-800 dark:text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder-gray-400"
          />
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Patient Name (optional)</label>
            <input
              type="text"
              value={patientName}
              onChange={e => setPatientName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-gray-800 dark:text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Language</label>
            <select value={language}
              onChange={e => { setLanguage(e.target.value); localStorage.setItem('preferred_language', e.target.value) }}
              className="border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-gray-800 dark:text-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
              {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading || !fileId.trim()}
        className="w-full bg-teal-600 text-white py-3 rounded-xl font-semibold hover:bg-teal-700 disabled:opacity-50 transition-all shadow-lg"
      >
        {loading ? 'Writing note...' : 'Generate Doctor\'s Note'}
      </button>

      {loading && (
        <div className="mt-6 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-5 w-full"></div>
          ))}
        </div>
      )}

      {result && (
        <div className="mt-4 space-y-3 animate-fadeIn">
          <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3 text-xs text-gray-400 dark:text-slate-500">
              <span>Patient: {result.patient_name}</span>
              <span>{result.generated_at}</span>
            </div>
            <div className="text-sm text-gray-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
              {result.doctor_note}
            </div>
          </div>
          <p className="text-xs text-center text-gray-400">This is an AI-generated note — always have it reviewed by a licensed physician</p>
        </div>
      )}
    </div>
  )
}