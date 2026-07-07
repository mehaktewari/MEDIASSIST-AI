import { useState, useEffect } from 'react'
import api from '../api/axios'

const FALLBACK_LANGUAGES = [
  { value: 'english', label: 'English' },
  { value: 'hindi', label: 'हिन्दी Hindi' },
  { value: 'tamil', label: 'தமிழ் Tamil' },
]

/**
 * Fetches the list of supported languages from the backend (/api/languages)
 * so every page shows the same, single source of truth instead of each
 * page hardcoding its own copy of the list. Falls back to English/Hindi/Tamil
 * if the backend call fails, so the dropdown never ends up empty.
 */
export default function useLanguages() {
  const [languages, setLanguages] = useState(FALLBACK_LANGUAGES)

  useEffect(() => {
    let cancelled = false
    api.get('/languages')
      .then(res => {
        if (!cancelled && Array.isArray(res.data.languages) && res.data.languages.length) {
          setLanguages(res.data.languages)
        }
      })
      .catch(() => {
        // backend not reachable yet — keep the fallback list, no error shown to user
      })
    return () => { cancelled = true }
  }, [])

  return languages
}