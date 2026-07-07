import { useState } from 'react'
import api from '../api/axios'

export default function HealthRiskPage() {
  const [fileId, setFileId] = useState(localStorage.getItem('last_file_id') || '')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleCheck = async () => {
    if (!fileId.trim()) return setError('Enter a File ID!')
    setLoading(true)
    setError('')

    try {
      const res = await api.post('/health-risk', { file_id: fileId })
      setResult(res.data)
    } catch {
      setError('Failed! Make sure file ID is correct.')
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (level) => {
    const colors = {
      'Low': 'text-green-600 bg-green-50 border-green-200',
      'Medium': 'text-yellow-600 bg-yellow-50 border-yellow-200',
      'High': 'text-orange-600 bg-orange-50 border-orange-200',
      'Critical': 'text-red-600 bg-red-50 border-red-200',
    }
    return colors[level] || 'text-gray-600 bg-gray-50 border-gray-200'
  }

  const getScoreColor = (score) => {
    if (score <= 30) return '#22c55e'
    if (score <= 60) return '#eab308'
    if (score <= 80) return '#f97316'
    return '#ef4444'
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">📊 Health Risk Score</h2>
      <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">AI analyzes your medical report and calculates risk level</p>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">File ID</label>
        <input
          type="text"
          value={fileId}
          onChange={e => setFileId(e.target.value)}
          placeholder="e.g. a1b2c3d4"
          className="w-full border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-gray-800 dark:text-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-gray-400"
        />
      </div>

      <button
        onClick={handleCheck}
        disabled={loading || !fileId.trim()}
        className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50 transition-all"
      >
        {loading ? '⏳ Analyzing report...' : '📊 Calculate Health Risk'}
      </button>

      {error && (
        <div className="mt-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-300 p-4 rounded-xl text-sm">❌ {error}</div>
      )}

      {result && (
        <div className="mt-6 space-y-4">

          {/* Score Circle */}
          <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl p-6 text-center shadow-sm">
            <div className="relative inline-flex items-center justify-center w-32 h-32 mb-3">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="#e5e7eb" strokeWidth="3"/>
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke={getScoreColor(result.risk_score)} strokeWidth="3"
                  strokeDasharray={`${result.risk_score}, 100`}/>
              </svg>
              <div className="absolute text-center">
                <p className="text-3xl font-bold" style={{color: getScoreColor(result.risk_score)}}>
                  {result.risk_score}
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-500">/100</p>
              </div>
            </div>
            <p className={`inline-block px-4 py-1 rounded-full text-sm font-bold border ${getRiskColor(result.risk_level)}`}>
              {result.risk_level} Risk
            </p>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-2">{result.urgency}</p>
          </div>

          {/* Risk Factors */}
          {result.risk_factors?.length > 0 && (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4">
              <p className="font-bold text-red-700 dark:text-red-400 mb-2">⚠️ Risk Factors</p>
              <ul className="space-y-1">
                {result.risk_factors.map((r, i) => (
                  <li key={i} className="text-sm text-red-600 dark:text-red-300 flex items-center gap-2">
                    <span>•</span>{r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Positive Factors */}
          {result.positive_factors?.length > 0 && (
            <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl p-4">
              <p className="font-bold text-green-700 dark:text-green-400 mb-2">✅ Positive Factors</p>
              <ul className="space-y-1">
                {result.positive_factors.map((r, i) => (
                  <li key={i} className="text-sm text-green-600 dark:text-green-300 flex items-center gap-2">
                    <span>•</span>{r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Lifestyle Tips */}
          {result.lifestyle_tips?.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4">
              <p className="font-bold text-blue-700 dark:text-blue-400 mb-2">💡 Lifestyle Tips</p>
              <ul className="space-y-1">
                {result.lifestyle_tips.map((r, i) => (
                  <li key={i} className="text-sm text-blue-600 dark:text-blue-300 flex items-center gap-2">
                    <span>•</span>{r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}