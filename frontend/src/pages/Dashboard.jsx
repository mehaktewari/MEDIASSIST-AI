import { Link } from 'react-router-dom'

export default function Dashboard() {
  const features = [
    { icon: '📄', title: 'Upload Documents', desc: 'PDF, DOCX, TXT medical files', path: '/upload', color: 'bg-blue-50 border-blue-200' },
    { icon: '🤖', title: 'Ask AI', desc: 'Chat with your documents', path: '/query', color: 'bg-green-50 border-green-200' },
    { icon: '📋', title: 'Summarize', desc: 'Get key info from reports', path: '/summarize', color: 'bg-purple-50 border-purple-200' },
    { icon: '💊', title: 'Drug Checker', desc: 'Check medicine interactions', path: '/drug-checker', color: 'bg-red-50 border-red-200' },
    { icon: '📊', title: 'Health Risk Score', desc: 'AI risk analysis 0-100', path: '/health-risk', color: 'bg-orange-50 border-orange-200' },
    { icon: '🗂️', title: 'Document History', desc: 'Manage uploaded files', path: '/history', color: 'bg-gray-50 border-gray-200' },
  ]

  return (
    <div>
      {/* Hero */}
      <div className="text-center py-12">
        <h2 className="text-4xl font-bold text-gray-800 mb-4">
          🏥 MediAssist AI
        </h2>
        <p className="text-xl text-gray-500 mb-2">
          Intelligent Healthcare Document Assistant
        </p>
        <p className="text-gray-400">
          Upload medical documents and ask questions in natural language
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        {features.map(f => (
          <Link key={f.path} to={f.path}>
            <div className={`border-2 rounded-xl p-6 ${f.color} hover:shadow-lg transition-all cursor-pointer`}>
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm">{f.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-10">
        {[
          { label: 'Supported Formats', value: 'PDF, DOCX, TXT' },
          { label: 'Languages', value: 'English, Hindi, Tamil' },
          { label: 'AI Model', value: 'Gemini Flash (Free)' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 text-center shadow-sm border">
            <p className="text-lg font-bold text-blue-700">{s.value}</p>
            <p className="text-sm text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}