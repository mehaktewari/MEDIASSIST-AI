import { useState } from 'react'
import axios from 'axios'

const API = 'http://127.0.0.1:8000/api'

export default function QueryPage() {
  const [question, setQuestion] = useState('')
  const [fileId, setFileId] = useState(localStorage.getItem('last_file_id') || '')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleQuery = async () => {
    if (!question.trim()) return setError('Please type a question!')
    setLoading(true)
    setError('')

    try {
      const res = await axios.post(`${API}/query`, {
        question,
        file_id: fileId || null,
        language: 'english'
      })
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Query failed!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">🤖 Ask AI</h2>

      {/* File ID Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          File ID (optional — leave empty to search all docs)
        </label>
        <input
          type="text"
          value={fileId}
          onChange={e => setFileId(e.target.value)}
          placeholder="e.g. a1b2c3d4"
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Question Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Your Question
        </label>
        <textarea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="e.g. What is the patient's diagnosis? What medicines are prescribed?"
          rows={4}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <button
        onClick={handleQuery}
        disabled={loading || !question.trim()}
        className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold
          hover:bg-green-700 disabled:opacity-50 transition-all"
      >
        {loading ? '⏳ Thinking...' : '🔍 Ask Question'}
      </button>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
          ❌ {error}
        </div>
      )}

      {result && (
        <div className="mt-4 bg-white border rounded-xl p-6 shadow-sm">
          <p className="font-bold text-gray-700 mb-2">💬 Answer:</p>
          <p className="text-gray-800 leading-relaxed">{result.answer}</p>
        </div>
      )}
    </div>
  )
}