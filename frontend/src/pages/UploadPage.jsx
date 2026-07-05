import { useState } from 'react'
import axios from 'axios'

const API = 'http://127.0.0.1:8000/api'

export default function UploadPage() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleUpload = async () => {
    if (!file) return setError('Please select a file first!')
    setLoading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await axios.post(`${API}/upload`, formData)
      setResult(res.data)
      localStorage.setItem('last_file_id', res.data.file_id)
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">📄 Upload Document</h2>

      {/* Upload Box */}
      <div className="border-2 border-dashed border-blue-300 rounded-xl p-10 text-center bg-blue-50">
        <div className="text-5xl mb-4">📁</div>
        <p className="text-gray-500 mb-4">PDF, DOCX, or TXT files only</p>
        <input
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={e => setFile(e.target.files[0])}
          className="block mx-auto text-sm text-gray-500"
        />
        {file && (
          <p className="mt-3 text-blue-700 font-medium">✅ {file.name}</p>
        )}
      </div>

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={loading || !file}
        className="mt-4 w-full bg-blue-700 text-white py-3 rounded-xl font-semibold
          hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {loading ? '⏳ Uploading & Indexing...' : '🚀 Upload Document'}
      </button>

      {/* Error */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
          ❌ {error}
        </div>
      )}

      {/* Success */}
      {result && (
        <div className="mt-4 bg-green-50 border border-green-200 p-4 rounded-xl">
          <p className="text-green-700 font-bold mb-2">✅ Upload Successful!</p>
          <p className="text-sm text-gray-600">File ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{result.file_id}</span></p>
          <p className="text-sm text-gray-600">Chunks created: {result.chunks_created}</p>
          <p className="text-sm text-gray-400 mt-2">💡 Save your File ID to use in Query & Summarize pages!</p>
        </div>
      )}
    </div>
  )
}