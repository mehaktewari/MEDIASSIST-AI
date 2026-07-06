import { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const API = 'http://localhost:8000/api'

export default function SummarizePage() {
  const [fileId, setFileId] = useState(localStorage.getItem('last_file_id') || '')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleSummarize = async () => {
    if (!fileId.trim()) return toast.error('Please enter a File ID!')
    setLoading(true)

    const toastId = toast.loading('⏳ Analyzing medical report...')

    try {
      const res = await axios.post(`${API}/summarize`, { file_id: fileId })
      setResult(res.data)
      toast.success('✅ Report analyzed!', { id: toastId })
    } catch (err) {
      toast.error(err.response?.data?.detail || '❌ Failed!', { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  const exportSummary = () => {
    if (!result) return
    const content = `
MEDIASSIST AI - MEDICAL REPORT SUMMARY
=======================================
Generated: ${new Date().toLocaleString()}

PATIENT NAME: ${result.patient_name}
DIAGNOSIS: ${result.diagnosis}
SUMMARY: ${result.full_summary}

ABNORMAL VALUES:
${result.abnormal_values?.map(v => `• ${v}`).join('\n') || 'None'}

RECOMMENDATIONS:
${result.recommendations?.map(r => `• ${r}`).join('\n') || 'None'}

=======================================
⚠️ AI-generated. Always consult a doctor.
    `.trim()

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Medical-Summary-${result.patient_name}-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('📄 Summary exported!')
  }

  return (
    <div className="max-w-2xl mx-auto animate-fadeIn">

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">📋 Summarize Report</h2>
          <p className="text-gray-500 text-sm">AI extracts key medical information</p>
        </div>
        {result && (
          <button onClick={exportSummary}
            className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700 transition-all">
            📄 Export
          </button>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">File ID</label>
        <input
          type="text"
          value={fileId}
          onChange={e => { setFileId(e.target.value); localStorage.setItem('last_file_id', e.target.value) }}
          placeholder="e.g. a1b2c3d4"
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
      </div>

      <button
        onClick={handleSummarize}
        disabled={loading || !fileId.trim()}
        className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 transition-all shadow-lg"
      >
        {loading ? '⏳ Analyzing...' : '📋 Summarize Report'}
      </button>

      {loading && (
        <div className="mt-6 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-16 w-full"></div>
          ))}
        </div>
      )}

      {result && (
        <div className="mt-4 space-y-3 animate-fadeIn">
          {[
            { label: '👤 Patient Name', value: result.patient_name, color: 'border-l-blue-500' },
            { label: '🏥 Diagnosis', value: result.diagnosis, color: 'border-l-purple-500' },
            { label: '📝 Summary', value: result.full_summary, color: 'border-l-green-500' },
          ].map(item => (
            <div key={item.label} className={`bg-white border border-l-4 ${item.color} rounded-xl p-4 shadow-sm`}>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{item.label}</p>
              <p className="text-gray-800">{item.value}</p>
            </div>
          ))}

          {result.abnormal_values?.length > 0 && (
            <div className="bg-red-50 border border-red-200 border-l-4 border-l-red-500 rounded-xl p-4">
              <p className="text-sm font-bold text-red-600 mb-2">⚠️ Abnormal Values</p>
              <ul className="space-y-1">
                {result.abnormal_values.map((v, i) => (
                  <li key={i} className="text-sm text-red-700 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>{v}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.recommendations?.length > 0 && (
            <div className="bg-green-50 border border-green-200 border-l-4 border-l-green-500 rounded-xl p-4">
              <p className="text-sm font-bold text-green-700 mb-2">✅ Recommendations</p>
              <ul className="space-y-1">
                {result.recommendations.map((r, i) => (
                  <li key={i} className="text-sm text-green-700 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>{r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button onClick={exportSummary}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-all">
            📄 Export Summary as TXT
          </button>
          <p className="text-xs text-center text-gray-400">⚠️ AI-generated — always consult a real doctor</p>
        </div>
      )}
    </div>
  )
}