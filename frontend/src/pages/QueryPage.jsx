import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const API = 'http://localhost:8000/api'

export default function QueryPage() {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hello! Upload a medical document and ask me anything about it. I\'m here to help.', time: now() }
  ])
  const [input, setInput] = useState('')
  const [fileId, setFileId] = useState(localStorage.getItem('last_file_id') || '')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const bottomRef = useRef(null)
  const recRef = useRef(null)

  function now() { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return toast.error('Use Chrome for voice input')
    const r = new SR()
    r.lang = 'en-US'
    r.onstart = () => setListening(true)
    r.onend = () => setListening(false)
    r.onresult = e => setInput(e.results[0][0].transcript)
    recRef.current = r
    r.start()
  }

  const send = async () => {
    if (!input.trim()) return
    const q = input
    setMessages(p => [...p, { role: 'user', text: q, time: now() }])
    setInput('')
    setLoading(true)
    try {
      const res = await axios.post(`${API}/query`, { question: q, file_id: fileId || null })
      setMessages(p => [...p, { role: 'ai', text: res.data.answer, time: now() }])
    } catch {
      setMessages(p => [...p, { role: 'ai', text: 'Something went wrong. Please try again.', time: now(), err: true }])
    } finally {
      setLoading(false)
    }
  }

  const exportChat = () => {
    const txt = messages.map(m => `[${m.role.toUpperCase()}] ${m.text}`).join('\n\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain' }))
    a.download = `chat-${Date.now()}.txt`
    a.click()
    toast.success('Chat exported!')
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col animate-fadeUp" style={{ height: 'calc(100vh - 140px)' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Ask AI</h1>
          <p className="text-sm text-gray-400">Powered by Ollama — runs locally</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportChat} className="px-3 py-2 text-sm font-medium rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-white/20 transition-all">Export</button>
          <button onClick={() => setMessages([{ role: 'ai', text: 'Chat cleared!', time: now() }])}
            className="px-3 py-2 text-sm font-medium rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-white/20 transition-all">Clear</button>
        </div>
      </div>

      {/* File ID */}
      <div className="mb-3">
        <input type="text" value={fileId}
          onChange={e => { setFileId(e.target.value); localStorage.setItem('last_file_id', e.target.value) }}
          placeholder="File ID (leave empty to search all documents)"
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-gray-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder-gray-400" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 py-2">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''} animate-fadeIn`}>
            <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-bold
              ${m.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gradient-to-br from-violet-500 to-blue-500 text-white'}`}>
              {m.role === 'user' ? 'U' : 'AI'}
            </div>
            <div className={`max-w-[78%]`}>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed
                ${m.role === 'user'
                  ? 'bg-blue-500 text-white rounded-tr-none'
                  : m.err
                    ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded-tl-none'
                    : 'bg-white dark:bg-white/8 text-gray-800 dark:text-slate-200 border border-gray-100 dark:border-white/10 rounded-tl-none shadow-sm'
                }`}>
                {m.text}
              </div>
              <p className={`text-xs text-gray-400 mt-1 ${m.role === 'user' ? 'text-right' : ''}`}>{m.time}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 animate-fadeIn">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex-shrink-0 flex items-center justify-center text-white text-sm font-bold">AI</div>
            <div className="bg-white dark:bg-white/8 border border-gray-100 dark:border-white/10 rounded-2xl rounded-tl-none px-4 py-3">
              <div className="flex gap-1 items-center">
                {[0, 150, 300].map(d => (
                  <div key={d} className="w-2 h-2 bg-gray-300 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }}></div>
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-3 flex gap-2 items-end">
        <button onClick={listening ? () => recRef.current?.stop() : startVoice}
          className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-lg transition-all
            ${listening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-white/20'}`}>
          🎤
        </button>
        <div className="flex-1 relative">
          <textarea value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder={listening ? 'Listening...' : 'Ask anything about your document...'}
            rows={1}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none placeholder-gray-400" />
        </div>
        <button onClick={send} disabled={loading || !input.trim()}
          className="flex-shrink-0 w-11 h-11 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white rounded-xl flex items-center justify-center text-lg transition-all hover:scale-105 transform disabled:cursor-not-allowed">
          ➤
        </button>
      </div>
    </div>
  )
}