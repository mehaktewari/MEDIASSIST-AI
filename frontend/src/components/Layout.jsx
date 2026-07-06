import { Link, useLocation } from 'react-router-dom'

export default function Layout({ children }) {
  const location = useLocation()

  const navItems = [
    { path: '/', label: '🏠 Home' },
    { path: '/upload', label: '📄 Upload' },
    { path: '/query', label: '🤖 Ask AI' },
    { path: '/summarize', label: '📋 Summarize' },
    { path: '/drug-checker', label: '💊 Drug Check' },
    { path: '/health-risk', label: '📊 Risk Score' },
    { path: '/history', label: '🗂️ History' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <nav className="bg-blue-700 text-white px-6 py-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">🏥 MediAssist AI</h1>
          <div className="flex gap-4">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all
                  ${location.pathname === item.path
                    ? 'bg-white text-blue-700'
                    : 'hover:bg-blue-600'
                  }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}