import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import useLanguages from '../hooks/useLanguages'

const API = 'http://localhost:8000/api'

const LANGUAGES = useLanguages()

function now() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function storageKey(fileId) {
  return `chat_history_${fileId || 'all'}`
}

function welcomeMessage() {
  return { role: 'ai', text: "Hello! Upload a medical document and ask me anything about it. I'm here to help.", time: now() }
}

function loadHistory(fileId) {
  try {
    const raw = localStorage.getItem(storageKey(fileId))
    if (!raw) return [welcomeMessage()]
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length ? parsed : [welcomeMessage()]
  } catch {
    return [welcomeMessage()]
  }
}

export default function QueryPage() {
  const [fileId, setFileId] = useState(localStorage.getItem('last_file_id') || '')
  const [messages, setMessages] = useState(() => loadHistory(fileId))
  const [input, setInput] = useState('')
  const [language, setLanguage] = useState(localStorage.getItem('preferred_language') || 'english')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const bottomRef = useRef(null)
  const recRef = useRef(null)
  const exportMenuRef = useRef(null)

  // Reload the right conversation whenever the active file changes
  useEffect(() => {
    setMessages(loadHistory(fileId))
  }, [fileId])

  // Persist every change so refreshing the page doesn't lose the conversation
  useEffect(() => {
    localStorage.setItem(storageKey(fileId), JSON.stringify(messages))
  }, [messages, fileId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Close the export dropdown when clicking outside it
  useEffect(() => {
    const onClick = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) setExportOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return toast.error('Use Chrome for voice input')
    const r = new SR()
    r.lang = 'en-US'
    r.onstart = () => setListening(true)
    r.onend = () => setListening(false)
    r.onresult = e => setInput(e.results[0][0].transcript)
    r.onerror = () => { setListening(false); toast.error('Voice input failed, try again') }
    recRef.current = r
    r.start()
  }

  const send = async () => {
    if (!input.trim()) return
    const q = input
    const updatedMessages = [...messages, { role: 'user', text: q, time: now() }]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)
    try {
      // Send the last few turns so the AI has memory of the conversation,
      // not just the current question in isolation.
      const historyForApi = updatedMessages
        .slice(-9, -1) // last 4 exchanges, excluding the question we're asking right now
        .map(m => ({ role: m.role, text: m.text }))

      const res = await axios.post(`${API}/query`, {
        question: q,
        file_id: fileId || null,
        language,
        history: historyForApi,
      })
      setMessages(p => [...p, { role: 'ai', text: res.data.answer, time: now() }])
    } catch {
      setMessages(p => [...p, { role: 'ai', text: 'Something went wrong. Please try again.', time: now(), err: true }])
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    const fresh = [welcomeMessage()]
    setMessages(fresh)
    localStorage.setItem(storageKey(fileId), JSON.stringify(fresh))
    toast.success('Chat cleared')
  }

  const exportTxt = () => {
    const txt = messages.map(m => `[${m.role.toUpperCase()} • ${m.time}] ${m.text}`).join('\n\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain' }))
    a.download = `mediassist-chat-${Date.now()}.txt`
    a.click()
    toast.success('Exported as .txt')
    setExportOpen(false)
  }

  const exportPdf = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const marginX = 40
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const maxWidth = pageWidth - marginX * 2
    let y = 50

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text('MediAssist AI — Chat Transcript', marginX, y)
    y += 18

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(120)
    doc.text(`Exported ${new Date().toLocaleString()}${fileId ? ` • File ID: ${fileId}` : ''}`, marginX, y)
    y += 24
    doc.setTextColor(20)

    messages.forEach(m => {
      const label = m.role === 'user' ? 'You' : 'MediAssist AI'
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      if (y > pageHeight - 60) { doc.addPage(); y = 50 }
      doc.text(`${label}  •  ${m.time}`, marginX, y)
      y += 14

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      const lines = doc.splitTextToSize(m.text, maxWidth)
      lines.forEach(line => {
        if (y > pageHeight - 40) { doc.addPage(); y = 50 }
        doc.text(line, marginX, y)
        y += 14
      })
      y += 10
    })

    doc.save(`mediassist-chat-${Date.now()}.pdf`)
    toast.success('Exported as PDF')
    setExportOpen(false)
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col animate-fadeUp" style={{ height: 'calc(100vh - 140px)' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Ask AI</h1>
          <p className="text-sm text-gray-400">Remembers this conversation and saves it on this device</p>
        </div>
        <div className="flex gap-2">
          <div className="relative" ref={exportMenuRef}>
            <button onClick={() => setExportOpen(v => !v)}
              className="px-3 py-2 text-sm font-medium rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-white/20 transition-all flex items-center gap-1">
              Export
              <span className="text-xs">▾</span>
            </button>
            {exportOpen && (
              <div className="absolute right-0 mt-2 w-40 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-800 shadow-lg overflow-hidden z-10 animate-fadeIn">
                <button onClick={exportPdf} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">
                  📄 Export as PDF
                </button>
                <button onClick={exportTxt} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors border-t border-gray-100 dark:border-white/10">
                  📝 Export as .txt
                </button>
              </div>
            )}
          </div>
          <button onClick={clearChat}
            className="px-3 py-2 text-sm font-medium rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-white/20 transition-all">
            Clear
          </button>
        </div>
      </div>

      {/* File ID + Language */}
      <div className="mb-3 flex gap-2">
        <input type="text" value={fileId}
          onChange={e => { setFileId(e.target.value); localStorage.setItem('last_file_id', e.target.value) }}
          placeholder="File ID (leave empty to search all documents)"
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-gray-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder-gray-400" />
        <select value={language}
          onChange={e => { setLanguage(e.target.value); localStorage.setItem('preferred_language', e.target.value) }}
          className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-gray-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50">
          {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
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