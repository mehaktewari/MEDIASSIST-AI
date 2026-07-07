import { useState } from 'react'
import axios from 'axios'

const API = 'http://localhost:8000/api'

export default function DrugCheckerPage() {
  const [medicines, setMedicines] = useState(['', ''])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const addMedicine = () => {
    if (medicines.length < 6) setMedicines([...medicines, ''])
  }

  const removeMedicine = (i) => {
    if (medicines.length > 2) {
      setMedicines(medicines.filter((_, idx) => idx !== i))
    }
  }

  const updateMedicine = (i, val) => {
    const updated = [...medicines]
    updated[i] = val
    setMedicines(updated)
  }

  const handleCheck = async () => {
    const filled = medicines.filter(m => m.trim())
    if (filled.length < 2) return setError('Enter at least 2 medicines!')
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await axios.post(`${API}/drug-interaction`, { medicines: filled })
      setResult(res.data)
    } catch {
      setError('Check failed! Make sure backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">💊 Drug Interaction Checker</h2>
      <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">Check if medicines are safe to take together</p>

      {/* Medicine Inputs */}
      <div className="space-y-3 mb-4">
        {medicines.map((med, i) => (
          <div key={i} className="flex gap-2 items-center">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 flex items-center justify-center text-sm font-bold flex-shrink-0">
              {i + 1}
            </div>
            <input
              type="text"
              value={med}
              onChange={e => updateMedicine(i, e.target.value)}
              placeholder={`Medicine ${i + 1} (e.g. Metformin 500mg)`}
              className="flex-1 border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-gray-800 dark:text-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400"
            />
            {medicines.length > 2 && (
              <button onClick={() => removeMedicine(i)} className="text-red-400 hover:text-red-600 text-lg">✕</button>
            )}
          </div>
        ))}
      </div>

      {/* Add Medicine Button */}
      {medicines.length < 6 && (
        <button
          onClick={addMedicine}
          className="w-full border-2 border-dashed border-gray-300 dark:border-white/20 text-gray-400 dark:text-slate-400 py-2 rounded-lg text-sm hover:border-blue-400 hover:text-blue-500 dark:hover:text-blue-400 transition-all mb-4"
        >
          + Add Another Medicine
        </button>
      )}

      {/* Check Button */}
      <button
        onClick={handleCheck}
        disabled={loading}
        className="w-full bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 disabled:opacity-50 transition-all"
      >
        {loading ? '⏳ Checking interactions...' : '🔍 Check Drug Interactions'}
      </button>

      {error && (
        <div className="mt-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-300 p-4 rounded-xl text-sm">
          ❌ {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-6 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">💊</span>
            <div>
              <p className="font-bold text-gray-800 dark:text-white">Interaction Analysis</p>
              <p className="text-xs text-gray-400 dark:text-slate-500">Medicines: {result.medicines_checked.join(', ')}</p>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-4 text-sm text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {result.result}
          </div>
          <p className="text-xs text-red-400 mt-3">⚠️ Always consult your doctor before changing medicines</p>
        </div>
      )}
    </div>
  )
}