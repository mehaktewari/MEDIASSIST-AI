import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import Dashboard from './pages/Dashboard'
import UploadPage from './pages/UploadPage'
import QueryPage from './pages/QueryPage'
import SummarizePage from './pages/SummarizePage'
import DrugCheckerPage from './pages/DrugCheckerPage'
import HealthRiskPage from './pages/HealthRiskPage'
import HistoryPage from './pages/HistoryPage'
import DoctorNotePage from './pages/DoctorNotePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'

function NotFound() {
  return (
    <div className="max-w-md mx-auto text-center py-24 animate-fadeIn">
      <p className="text-6xl mb-4">🩺</p>
      <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Page not found</h1>
      <p className="text-gray-500 dark:text-slate-400 mb-8">
        That page doesn't exist. Let's get you back somewhere useful.
      </p>
      <Link to="/">
        <button className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 transition-all">
          Back to Home
        </button>
      </Link>
    </div>
  )
}

function App() {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('darkMode') === 'true'
  )

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

  return (
    <AuthProvider>
      <Router>
        <Layout darkMode={darkMode} setDarkMode={setDarkMode}>
          <Routes>
            {/* Public routes — no login needed */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Everything else requires being logged in */}
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
            <Route path="/query" element={<ProtectedRoute><QueryPage /></ProtectedRoute>} />
            <Route path="/summarize" element={<ProtectedRoute><SummarizePage /></ProtectedRoute>} />
            <Route path="/drug-checker" element={<ProtectedRoute><DrugCheckerPage /></ProtectedRoute>} />
            <Route path="/health-risk" element={<ProtectedRoute><HealthRiskPage /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
            <Route path="/doctor-note" element={<ProtectedRoute><DoctorNotePage /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  )
}

export default App