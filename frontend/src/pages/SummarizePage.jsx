import { useState } from 'react'
import axios from 'axios'

const API = 'http://127.0.0.1:8000/api'

export default function SummarizePage() {
  const [fileId, setFileId] = useState(localStorage.getItem('last_file_id') || '')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleSummarize = async () => {
    if (!fileId.trim()) return setError('Please enter a File ID!')
    setLoading(true)
    setError('')

    try {
      const res = await axios.post(`${API}/summarize`, { file_id: fileId })
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Summarize failed!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">📋 Summarize Medical Report</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">File ID</label>
        <input
          type="text"
          value={fileId}
          onChange={e => setFileId(e.target.value)}
          placeholder="e.g. a1b2c3d4"
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
      </div>

      <button
        onClick={handleSummarize}
        disabled={loading || !fileId.trim()}
        className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold
          hover:bg-purple-700 disabled:opacity-50 transition-all"
      >
        {loading ? '⏳ Analyzing...' : '📋 Summarize Report'}
      </button>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
          ❌ {error}
        </div>
      )}

      {result && (
        <div className="mt-4 space-y-4">
          {[
            { label: '👤 Patient Name', value: result.patient_name },
            { label: '🏥 Diagnosis', value: result.diagnosis },
            { label: '📝 Summary', value: result.full_summary },
          ].map(item => (
            <div key={item.label} className="bg-white border rounded-xl p-4 shadow-sm">
              <p className="text-sm font-bold text-gray-500 mb-1">{item.label}</p>
              <p className="text-gray-800">{item.value}</p>
            </div>
          ))}

          {result.abnormal_values?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm font-bold text-red-600 mb-2">⚠️ Abnormal Values</p>
              <ul className="list-disc list-inside text-sm text-gray-700">
                {result.abnormal_values.map((v, i) => <li key={i}>{v}</li>)}
              </ul>
            </div>
          )}

          {result.recommendations?.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm font-bold text-green-700 mb-2">✅ Recommendations</p>
              <ul className="list-disc list-inside text-sm text-gray-700">
                {result.recommendations.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}