import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../api/axios'

export default function Dashboard() {
  const [stats, setStats] = useState({ docs: 0, online: false })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [, d] = await Promise.all([
          api.get('/health'),
          api.get('/documents')
        ])
        setStats({ docs: d.data.documents.length, online: true })
      } catch {
        setStats({ docs: 0, online: false })
      } finally {
        setLoaded(true)
      }
    }
    fetchStats()
  }, [])

  const features = [
    { icon: '📄', title: 'Upload', desc: 'PDF, DOCX & TXT files', path: '/upload', gradient: 'from-blue-500 to-blue-600' },
    { icon: '🤖', title: 'Ask AI', desc: 'Chat with your documents', path: '/query', gradient: 'from-violet-500 to-violet-600' },
    { icon: '📋', title: 'Summarize', desc: 'Instant report summaries', path: '/summarize', gradient: 'from-emerald-500 to-emerald-600' },
    { icon: '💊', title: 'Drug Checker', desc: 'Interaction analysis', path: '/drug-checker', gradient: 'from-rose-500 to-rose-600' },
    { icon: '📊', title: 'Risk Score', desc: 'Health risk assessment', path: '/health-risk', gradient: 'from-amber-500 to-orange-500' },
    { icon: '📝', title: 'Doctor Note', desc: 'Professional clinical notes', path: '/doctor-note', gradient: 'from-teal-500 to-teal-600' },
    { icon: '🗂️', title: 'History', desc: 'All your documents', path: '/history', gradient: 'from-slate-500 to-slate-600' },
  ]

  return (
    <div>
      {/* Hero */}
      <div className="relative text-center py-24 mb-12 overflow-hidden">
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none -z-10"></div>
        <div className="absolute top-10 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl pointer-events-none -z-10"></div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-500/30 mb-6">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">AI Running — 100% Free & Private</span>
        </div>

        <h1 className="text-6xl md:text-7xl font-black tracking-tight mb-6 leading-tight">
          <span className="text-gray-900 dark:text-white">Your Medical Docs,</span><br />
          <span style={{background: 'linear-gradient(135deg, #2563eb, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
            Understood Instantly
          </span>
        </h1>

        <p className="text-xl text-gray-500 dark:text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
          Upload any medical document. Ask questions, get summaries, check drug interactions — all powered by local AI.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/upload">
            <button className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 hover:-translate-y-1 transform transition-all duration-200 text-base">
              Get Started →
            </button>
          </Link>
          <Link to="/query">
            <button className="px-8 py-4 bg-white dark:bg-white/10 text-gray-800 dark:text-white font-bold rounded-2xl border-2 border-gray-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-white/20 hover:-translate-y-1 transform transition-all duration-200 text-base">
              Try Ask AI
            </button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-16 max-w-md mx-auto">
        {[
          { value: loaded ? (stats.online ? '✅ Online' : '❌ Offline') : '...', label: 'AI Status' },
          { value: loaded ? String(stats.docs) : '...', label: 'Documents' },
          { value: '$0', label: 'Total Cost' },
        ].map((s, i) => (
          <div key={i} className="text-center p-5 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm">
            <p className="text-xl font-black text-blue-600 dark:text-blue-400">{s.value}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Features */}
      <div className="mb-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-gray-900 dark:text-white">Everything you need</h2>
          <p className="text-gray-500 dark:text-slate-400 mt-2">Powerful AI tools for medical document analysis</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <Link key={f.path} to={f.path}>
              <div className="group p-6 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:border-blue-200 dark:hover:border-blue-500/30 hover:shadow-xl hover:-translate-y-1 transform transition-all duration-300 cursor-pointer h-full">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center text-3xl mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{f.title}</h3>
                <p className="text-gray-500 dark:text-slate-400 text-sm">{f.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-violet-600 p-12 text-white mb-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black">How it works</h2>
          <p className="text-blue-100 mt-2">Simple 4-step process</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { n: '1', icon: '📤', t: 'Upload File', d: 'Drop your medical document' },
            { n: '2', icon: '🧠', t: 'AI Analyzes', d: 'Local AI reads and indexes' },
            { n: '3', icon: '💬', t: 'You Ask', d: 'Type any question' },
            { n: '4', icon: '✨', t: 'Get Insights', d: 'Clear, accurate answers' },
          ].map((s) => (
            <div key={s.n} className="text-center">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center font-black text-xl mx-auto mb-4">{s.n}</div>
              <div className="text-4xl mb-3">{s.icon}</div>
              <p className="font-bold text-lg">{s.t}</p>
              <p className="text-sm text-blue-100 mt-1 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center py-12 rounded-3xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 mb-8">
        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">Ready to get started?</h3>
        <p className="text-gray-500 dark:text-slate-400 mb-6">Upload your first document and experience AI-powered medical insights</p>
        <Link to="/upload">
          <button className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 hover:-translate-y-1 transform transition-all duration-200">
            Upload Document →
          </button>
        </Link>
      </div>
    </div>
  )
}