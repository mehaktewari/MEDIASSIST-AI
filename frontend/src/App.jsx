import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import UploadPage from './pages/UploadPage'
import QueryPage from './pages/QueryPage'
import SummarizePage from './pages/SummarizePage'
import DrugCheckerPage from './pages/DrugCheckerPage'
import HealthRiskPage from './pages/HealthRiskPage'
import HistoryPage from './pages/HistoryPage'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/query" element={<QueryPage />} />
          <Route path="/summarize" element={<SummarizePage />} />
          <Route path="/drug-checker" element={<DrugCheckerPage />} />
          <Route path="/health-risk" element={<HealthRiskPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App