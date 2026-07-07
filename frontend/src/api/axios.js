import axios from 'axios'

// In production (Vercel/Netlify/etc), set VITE_API_BASE_URL as an environment
// variable pointing at your deployed backend, e.g. https://mediassist-api.onrender.com/api
// Locally, it falls back to your local backend so `npm run dev` keeps working
// with zero config.
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const api = axios.create({ baseURL: API_BASE })

// Attach the saved JWT to every outgoing request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// If the token is invalid/expired, the backend returns 401 — bounce to /login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
export { API_BASE }