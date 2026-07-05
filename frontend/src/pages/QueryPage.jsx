import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

const API = 'http://localhost:8000/api'

export default function QueryPage() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: '👋 Hello! I am MediAssist AI. Upload a document and ask me anything about it!',
      time: new Date().toLocaleTimeString()
    }
  ])
  const [question, setQuestion] = useState('')
  const [fileId, setFileId] = useState(localStorage.getItem('last_file_id') || '')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  // Auto scroll to bottom when new message arrives
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleQuery = async () => {
    if (!question.trim()) return

    const userMsg = {
      role: 'user',
      text: question,
      time: new Date().toLocaleTimeString()
    }

    setMessages(prev => [...prev, userMsg])
    setQuestion('')
    setLoading(true)

    try {
      const res = await axios.post(`${API}/query`, {
        question,
        file_id: fileId || null,
        language: 'english'
      })

      setMessages(prev => [...prev, {
        role: 'assistant',
        text: res.data.answer,
        time: new Date().toLocaleTimeString()
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: '❌ Sorry, I could not get an answer. Please check your API key or try again.',
        time: new Date().toLocaleTimeString(),
        error: true
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleQuery()
    }
  }

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      text: '👋 Chat cleared! Ask me anything about your medical documents.',
      time: new Date().toLocaleTimeString()
    }])
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[80vh]">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">🤖 Ask AI</h2>
        <button
          onClick={clearChat}
          className="text-sm text-red-500 hover:text-red-700 border border-red-200 px-3 py-1 rounded-lg"
        >
          🗑️ Clear Chat
        </button>
      </div>

      {/* File ID bar */}
      <div className="mb-3 flex gap-2 items-center">
        <span className="text-sm text-gray-500 whitespace-nowrap">File ID:</span>
        <input
          type="text"
          value={fileId}
          onChange={e => {
            setFileId(e.target.value)
            localStorage.setItem('last_file_id', e.target.value)
          }}
          placeholder="Paste file ID here (or leave empty for all docs)"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 rounded-xl border p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>

              {/* Avatar */}
              <div className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0
                  ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border-2 border-gray-200'}`}>
                  {msg.role === 'user' ? '👤' : '🤖'}
                </div>

                {/* Bubble */}
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed
                  ${msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : msg.error
                      ? 'bg-red-50 text-red-700 border border-red-200 rounded-bl-none'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'
                  }`}>
                  {msg.text}
                </div>
              </div>

              {/* Time */}
              <p className={`text-xs text-gray-400 mt-1 ${msg.role === 'user' ? 'text-right mr-10' : 'ml-10'}`}>
                {msg.time}
              </p>
            </div>
          </div>
        ))}

        {/* Loading bubble */}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-end gap-2">
              <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">🤖</div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center h-4">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Box */}
      <div className="mt-3 flex gap-2">
        <textarea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about your document... (Enter to send)"
          rows={2}
          className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
        />
        <button
          onClick={handleQuery}
          disabled={loading || !question.trim()}
          className="bg-blue-600 text-white px-5 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all"
        >
          {loading ? '⏳' : '➤'}
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-1 text-center">Press Enter to send • Shift+Enter for new line</p>
    </div>
  )
}