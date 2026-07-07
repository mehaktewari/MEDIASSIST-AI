import { useState, useEffect } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'

export default function HistoryPage() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmId, setConfirmId] = useState(null)

  const fetchDocs = async () => {
    try {
      const res = await api.get('/documents')
      setDocuments(res.data.documents.reverse())
    } catch {
      setDocuments([])
      toast.error('Could not load document history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDocs() }, [])

  const handleDelete = async (fileId) => {
    try {
      await api.delete(`/documents/${fileId}`)
      setConfirmId(null)
      toast.success('Document deleted')
      fetchDocs()
    } catch {
      toast.error('Delete failed')
    }
  }

  const handleUse = (fileId) => {
    localStorage.setItem('last_file_id', fileId)
    toast.success(`File ID "${fileId}" set — head to Ask AI or Summarize`)
  }

  const typeIcon = (type) => ({ '.pdf': '📕', '.docx': '📘', '.txt': '📄' }[type] || '📄')

  return (
    <div className="max-w-3xl mx-auto animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">🗂️ Document History</h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm">All your uploaded medical documents</p>
        </div>
        <button onClick={fetchDocs}
          className="text-sm text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 px-3 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
          🔄 Refresh
        </button>
      </div>

      {loading && (
        <div className="text-center py-12 text-gray-400 dark:text-slate-500">⏳ Loading...</div>
      )}

      {!loading && documents.length === 0 && (
        <div className="text-center py-16 bg-gray-50 dark:bg-white/5 rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-500 dark:text-slate-300 font-medium">No documents yet!</p>
          <p className="text-gray-400 dark:text-slate-500 text-sm mt-1">Upload a document to get started</p>
        </div>
      )}

      <div className="space-y-3">
        {documents.map((doc) => (
          <div key={doc.file_id} className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl p-4 shadow-sm hover:shadow-md dark:hover:bg-white/[0.07] transition-all">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{typeIcon(doc.file_type)}</span>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-white">{doc.filename}</p>
                  <div className="flex gap-3 mt-0.5 flex-wrap">
                    <span className="text-xs text-gray-400 dark:text-slate-500">ID: <span className="font-mono bg-gray-100 dark:bg-white/10 dark:text-slate-300 px-1 rounded">{doc.file_id}</span></span>
                    <span className="text-xs text-gray-400 dark:text-slate-500">{doc.chunks} chunks</span>
                    <span className="text-xs text-gray-400 dark:text-slate-500">{doc.uploaded_at}</span>
                  </div>
                </div>
              </div>

              {confirmId === doc.file_id ? (
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-gray-500 dark:text-slate-400">Delete this document?</span>
                  <button onClick={() => handleDelete(doc.file_id)}
                    className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors">
                    Confirm
                  </button>
                  <button onClick={() => setConfirmId(null)}
                    className="text-xs bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUse(doc.file_id)}
                    className="text-xs bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 px-3 py-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                  >
                    Use
                  </button>
                  <button
                    onClick={() => setConfirmId(doc.file_id)}
                    className="text-xs bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 border border-red-200 dark:border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}