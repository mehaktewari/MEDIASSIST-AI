import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import axios from 'axios'

const API = 'http://localhost:8000/api'

export default function Dashboard() {
  const [stats, setStats] = useState({ docs: 0, online: false })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        const [h, d] = await Promise.all([
          axios.get(`${API}/health`),
          axios.get(`${API}/documents`)
        ])
        setStats({ docs: d.data.documents.length, online: true })
      } catch {
        setStats({ docs: 0, online: false })
      } finally {
        setLoaded(true)
      }
    }
    fetch()
  }, [])

  const features = [
    { icon: '📄', title: 'Upload', desc: 'PDF, DOCX & TXT files', path: '/upload', gradient: 'from-blue-500 to-blue-600' },
    { icon: '🤖', title: 'Ask AI', desc: 'Chat with your documents', path: '/query', gradient: 'from-violet-500 to-violet-600' },
    { icon: '📋', title: 'Summarize', desc: 'Instant report summaries', path: '/summarize', gradient: 'from-emerald-500 to-emerald-600' },
    { icon: '💊', title: 'Drug Checker', desc: 'Interaction analysis', path: '/drug-checker', gradient: 'from-rose-500 to-rose-600' },
    { icon: '📊', title: 'Risk Score', desc: 'Health risk assessment', path: '/health-risk', gradient: 'from-amber-500 to-orange-500' },
    { icon: '🗂️', title: 'History', desc: 'All your documents', path: '/history', gradient: 'from-slate-500 to-slate-600' },
  ]

  return (
    <div className="animate-fadeUp">

      {/* Hero Section */}
      <div className="relative text-center py-20 mb-16 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-10 right-1/4 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-200/50 bg-blue-50/80 dark:bg-blue-500/10 dark:border-blue-500/20 mb-6">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">AI Running — 100% Free & Private</span>
        </div>

        <h1 className="text-6xl md:text-7xl font-black tracking-tight mb-6 dark:text-white">
          Your Medical Docs,<br />
          <span className="gradient-text">Understood Instantly</span>
        </h1>

        <p className="text-xl text-gray-500 dark:text-slate-400 max-w-xl mx-auto mb-10">
          Upload any medical document. Ask questions, get summaries, check drug interactions — all powered by AI.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/upload">
            <button className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all hover:-translate-y-0.5 transform text-lg">
              Get Started →
            </button>
          </Link>
          <Link to="/query">
            <button className="px-8 py-4 bg-white dark:bg-white/10 dark:text-white text-gray-800 font-semibold rounded-2xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/15 transition-all text-lg">
              Ask AI
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-16 max-w-lg mx-auto">
        {[
          { value: loaded ? (stats.online ? 'Online' : 'Offline') : '...', label: 'AI Status', color: stats.online ? 'text-emerald-500' : 'text-red-400' },
          { value: loaded ? stats.docs : '...', label: 'Documents', color: 'text-blue-500' },
          { value: 'Free', label: 'Cost', color: 'text-violet-500' },
        ].map((s, i) => (
          <div key={i} className="text-center p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-1 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Features Grid */}
      <div className="mb-16">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-8 text-center">Everything you need</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <Link key={f.path} to={f.path}>
              <div className="group p-6 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 card-hover cursor-pointer">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center text-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">{f.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-3xl bg-gradient-to-br from-blue-500 to-violet-600 p-10 text-white text-center">
        <h2 className="text-3xl font-black mb-10">How it works</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { n: '1', icon: '📤', t: 'Upload', d: 'Drop your medical file' },
            { n: '2', icon: '🧠', t: 'AI Reads', d: 'Analyzes content instantly' },
            { n: '3', icon: '💬', t: 'You Ask', d: 'Type any question' },
            { n: '4', icon: '✨', t: 'Get Insights', d: 'Clear, accurate answers' },
          ].map((s, i) => (
            <div key={i} className="relative">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-black text-lg mx-auto mb-3">{s.n}</div>
              <div className="text-3xl mb-2">{s.icon}</div>
              <p className="font-bold">{s.t}</p>
              <p className="text-sm text-blue-100 mt-1">{s.d}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}