import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import UploadPage from './pages/UploadPage'
import QueryPage from './pages/QueryPage'
import SummarizePage from './pages/SummarizePage'
import DrugCheckerPage from './pages/DrugCheckerPage'
import HealthRiskPage from './pages/HealthRiskPage'
import HistoryPage from './pages/HistoryPage'
import DoctorNotePage from './pages/DoctorNotePage'

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
    <Router>
      <Layout darkMode={darkMode} setDarkMode={setDarkMode}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/query" element={<QueryPage />} />
          <Route path="/summarize" element={<SummarizePage />} />
          <Route path="/drug-checker" element={<DrugCheckerPage />} />
          <Route path="/health-risk" element={<HealthRiskPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/doctor-note" element={<DoctorNotePage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App