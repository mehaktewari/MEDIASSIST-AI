import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import UploadPage from './pages/UploadPage'
import QueryPage from './pages/QueryPage'
import SummarizePage from './pages/SummarizePage'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/query" element={<QueryPage />} />
          <Route path="/summarize" element={<SummarizePage />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App