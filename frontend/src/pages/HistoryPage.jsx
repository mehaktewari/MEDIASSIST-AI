import { useState, useEffect } from 'react'
import axios from 'axios'

const API = 'http://localhost:8000/api'

export default function HistoryPage() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchDocs = async () => {
    try {
      const res = await axios.get(`${API}/documents`)
      setDocuments(res.data.documents.reverse())
    } catch {
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDocs() }, [])

  const handleDelete = async (fileId) => {
    if (!confirm('Delete this document?')) return
    try {
      await axios.delete(`${API}/documents/${fileId}`)
      fetchDocs()
    } catch {
      alert('Delete failed!')
    }
  }

  const handleUse = (fileId) => {
    localStorage.setItem('last_file_id', fileId)
    alert(`✅ File ID "${fileId}" set! Go to Ask AI or Summarize page.`)
  }

  const typeIcon = (type) => ({ '.pdf': '📕', '.docx': '📘', '.txt': '📄' }[type] || '📄')

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🗂️ Document History</h2>
          <p className="text-gray-500 text-sm">All your uploaded medical documents</p>
        </div>
        <button onClick={fetchDocs} className="text-sm text-blue-600 border border-blue-200 px-3 py-1 rounded-lg hover:bg-blue-50">
          🔄 Refresh
        </button>
      </div>

      {loading && (
        <div className="text-center py-12 text-gray-400">⏳ Loading...</div>
      )}

      {!loading && documents.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-500 font-medium">No documents yet!</p>
          <p className="text-gray-400 text-sm mt-1">Upload a document to get started</p>
        </div>
      )}

      <div className="space-y-3">
        {documents.map((doc) => (
          <div key={doc.file_id} className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{typeIcon(doc.file_type)}</span>
                <div>
                  <p className="font-semibold text-gray-800">{doc.filename}</p>
                  <div className="flex gap-3 mt-0.5">
                    <span className="text-xs text-gray-400">ID: <span className="font-mono bg-gray-100 px-1 rounded">{doc.file_id}</span></span>
                    <span className="text-xs text-gray-400">{doc.chunks} chunks</span>
                    <span className="text-xs text-gray-400">{doc.uploaded_at}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleUse(doc.file_id)}
                  className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100"
                >
                  Use
                </button>
                <button
                  onClick={() => handleDelete(doc.file_id)}
                  className="text-xs bg-red-50 text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}