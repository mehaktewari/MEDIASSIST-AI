import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Layout({ children, darkMode, setDarkMode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/upload', label: 'Upload' },
    { path: '/query', label: 'Ask AI' },
    { path: '/summarize', label: 'Summarize' },
    { path: '/drug-checker', label: 'Drug Check' },
    { path: '/health-risk', label: 'Risk Score' },
    { path: '/doctor-note', label: 'Doctor Note' },
    { path: '/history', label: 'History' },
  ]

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
    navigate('/login')
  }

  return (
    <div className={`min-h-screen transition-all duration-500 ${darkMode ? 'dark bg-[#0a0f1e]' : 'bg-slate-50'}`}>

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300
        ${scrolled
          ? darkMode
            ? 'bg-[#0a0f1e]/90 backdrop-blur-xl border-b border-white/5 shadow-2xl'
            : 'bg-white/90 backdrop-blur-xl border-b border-gray-200/60 shadow-lg'
          : 'bg-transparent'
        }`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <span className="text-white text-lg">+</span>
              </div>
              <span className={`font-bold text-lg tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Medi<span className="text-blue-500">Assist</span>
              </span>
            </Link>

            {/* Desktop Nav — only shown when logged in */}
            {user && (
              <div className="hidden lg:flex items-center gap-1">
                {navItems.map(item => (
                  <Link key={item.path} to={item.path}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                      ${location.pathname === item.path
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                        : darkMode
                          ? 'text-slate-400 hover:text-white hover:bg-white/10'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}>
                    {item.label}
                  </Link>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button onClick={() => setDarkMode(!darkMode)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all
                  ${darkMode ? 'bg-white/10 hover:bg-white/20 text-yellow-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
                {darkMode ? '☀️' : '🌙'}
              </button>

              {user ? (
                <>
                  <span className={`hidden md:block text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                    {user.full_name}
                  </span>
                  <button onClick={handleLogout}
                    className={`hidden md:block px-3 py-2 rounded-xl text-sm font-medium transition-all
                      ${darkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    Log out
                  </button>
                </>
              ) : (
                <Link to="/login"
                  className="hidden md:block px-4 py-2 rounded-xl text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-all">
                  Log in
                </Link>
              )}

              <button onClick={() => setMenuOpen(!menuOpen)}
                className={`lg:hidden w-10 h-10 rounded-xl flex items-center justify-center transition-all
                  ${darkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {menuOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {menuOpen && (
            <div className={`lg:hidden mt-4 p-4 rounded-2xl border animate-fadeIn
              ${darkMode ? 'bg-slate-800/90 border-white/10' : 'bg-white border-gray-200'}`}>
              {user && navItems.map(item => (
                <Link key={item.path} to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-sm font-medium mb-1 transition-all
                    ${location.pathname === item.path
                      ? 'bg-blue-500 text-white'
                      : darkMode ? 'text-slate-300 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-50'
                    }`}>
                  {item.label}
                </Link>
              ))}

              <div className={`mt-2 pt-2 border-t ${darkMode ? 'border-white/10' : 'border-gray-100'}`}>
                {user ? (
                  <button onClick={handleLogout}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium
                      ${darkMode ? 'text-slate-300 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-50'}`}>
                    Log out ({user.full_name})
                  </button>
                ) : (
                  <Link to="/login" onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 rounded-xl text-sm font-semibold bg-blue-500 text-white">
                    Log in
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Content */}
      <main className="pt-20 max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className={`mt-20 py-8 border-t text-center text-sm
        ${darkMode ? 'border-white/5 text-slate-500' : 'border-gray-100 text-gray-400'}`}>
        <p className="font-medium">MediAssist AI</p>
        <p className="mt-1 text-xs">AI-powered healthcare document analysis</p>
      </footer>
    </div>
  )
}