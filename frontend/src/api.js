import axios from 'axios'

// In production (Vercel) the API is on the same domain at /api
// In local dev the Vite proxy forwards /api → http://localhost:3001/api
const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('sp_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api
