import { useState, useCallback } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

const API = 'http://localhost:8000/api'

export default function UploadPage() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [progress, setProgress] = useState(0)
  const [dragging, setDragging] = useState(false)

  const handleFile = (f) => {
    if (!f) return
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    if (!allowed.includes(f.type)) return toast.error('Only PDF, DOCX, TXT allowed!')
    setFile(f)
    setResult(null)
    toast.success(`${f.name} ready!`)
  }

  const onDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)
  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleUpload = async () => {
    if (!file) return toast.error('Select a file first')
    setLoading(true)
    const formData = new FormData()
    formData.append('file', file)
    const tid = toast.loading('Uploading & indexing...')
    try {
      const res = await axios.post(`${API}/upload`, formData, {
        onUploadProgress: e => setProgress(Math.round(e.loaded * 100 / e.total))
      })
      setResult(res.data)
      localStorage.setItem('last_file_id', res.data.file_id)
      toast.success('Document ready!', { id: tid })
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Upload failed', { id: tid })
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }

  const fileIcon = (f) => {
    if (!f) return '☁️'
    if (f.name.endsWith('.pdf')) return '📕'
    if (f.name.endsWith('.docx')) return '📘'
    return '📄'
  }

  return (
    <div className="max-w-xl mx-auto animate-fadeUp">

      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">Upload Document</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-2">PDF, DOCX or TXT — we handle it all</p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => document.getElementById('fileInput').click()}
        className={`relative border-2 border-dashed rounded-3xl p-14 text-center cursor-pointer transition-all duration-300
          ${dragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 scale-105'
            : file
              ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
              : 'border-gray-200 dark:border-white/10 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 bg-white dark:bg-white/5'
          }`}
      >
        <input
          id="fileInput"
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={e => handleFile(e.target.files[0])}
        />

        {file ? (
          <div className="animate-fadeIn">
            <div className="text-6xl mb-3">{fileIcon(file)}</div>
            <p className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">{file.name}</p>
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB • Click to change</p>
          </div>
        ) : (
          <div>
            <div className={`text-6xl mb-4 transition-transform duration-300 ${dragging ? 'scale-125' : 'hover:scale-110'}`}>
              {dragging ? '📥' : '☁️'}
            </div>
            <p className="font-bold text-gray-700 dark:text-slate-300 text-lg">
              {dragging ? 'Drop it here!' : 'Drag & drop your file'}
            </p>
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">or click to browse</p>
            <div className="flex gap-2 justify-center mt-4">
              {['PDF', 'DOCX', 'TXT'].map(t => (
                <span key={t} className="px-3 py-1 bg-gray-100 dark:bg-white/10 rounded-full text-xs font-semibold text-gray-500 dark:text-slate-400">{t}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Progress */}
      {loading && (
        <div className="mt-4 animate-fadeIn">
          <div className="flex justify-between text-sm text-gray-500 dark:text-slate-400 mb-2">
            <span>Processing...</span>
            <span className="font-semibold">{progress}%</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-300"
              style={{ width: `${progress || 30}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Button */}
      <button
        onClick={handleUpload}
        disabled={loading || !file}
        className="mt-4 w-full py-4 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 transform text-lg"
      >
        {loading ? 'Processing...' : 'Upload & Analyze →'}
      </button>

      {/* Result */}
      {result && (
        <div className="mt-6 p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 animate-fadeUp">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">✅</span>
            <p className="font-black text-emerald-700 dark:text-emerald-400 text-lg">Upload Successful!</p>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white dark:bg-white/10 rounded-2xl p-4">
              <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">File ID</p>
              <p className="font-black text-blue-600 dark:text-blue-400 text-xl font-mono">{result.file_id}</p>
            </div>
            <div className="bg-white dark:bg-white/10 rounded-2xl p-4">
              <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Chunks</p>
              <p className="font-black text-gray-800 dark:text-white text-xl">{result.chunks_created}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link to="/query" className="py-3 bg-blue-500 text-white text-center rounded-xl font-semibold text-sm hover:bg-blue-600 transition-all">
              Ask AI →
            </Link>
            <Link to="/summarize" className="py-3 bg-violet-500 text-white text-center rounded-xl font-semibold text-sm hover:bg-violet-600 transition-all">
              Summarize →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}