import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('auth_user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(true)

  // On first load, if we have a token, confirm it's still valid and refresh user info
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      setLoading(false)
      return
    }
    api.get('/auth/me')
      .then(res => {
        setUser(res.data)
        localStorage.setItem('auth_user', JSON.stringify(res.data))
      })
      .catch(() => {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const signup = async (email, password, fullName) => {
    const res = await api.post('/auth/signup', { email, password, full_name: fullName })
    localStorage.setItem('auth_token', res.data.access_token)
    localStorage.setItem('auth_user', JSON.stringify(res.data.user))
    setUser(res.data.user)
  }

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    localStorage.setItem('auth_token', res.data.access_token)
    localStorage.setItem('auth_user', JSON.stringify(res.data.user))
    setUser(res.data.user)
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside an <AuthProvider>')
  return ctx
}