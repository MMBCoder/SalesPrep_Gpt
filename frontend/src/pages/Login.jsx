import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { useAuth } from '../App'
import api from '../api'

const GOOGLE_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const DEMO_USER = {
  id: 1,
  email: 'demo@salesprep.ai',
  name: 'Demo User',
  company: 'SalesPrep',
  job_title: 'Territory Sales Executive',
  industry: 'FMCG',
  city: 'Mumbai, Maharashtra',
  onboarding_complete: 1,
  profile_complete: 1,
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    if (searchParams.get('error') === 'google_denied') setError('Google sign-in was cancelled.')
    if (searchParams.get('error') === 'google_failed') setError('Google sign-in failed. Please try again.')
  }, [])

  const handleGoogle = () => {
    window.location.href = `${API_BASE.replace('/api', '')}/api/auth/google`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Hardcoded demo credentials — always works
    if (email === 'demo@salesprep.ai' && password === 'demo1234') {
      login('demo-token-mirza', DEMO_USER)
      navigate('/dashboard')
      return
    }

    // Try backend for any other credentials
    try {
      const res = await api.post('/login', { email, password })
      login(res.data.token, res.data.user)
      if (!res.data.user.onboarding_complete) navigate('/onboarding')
      else if (!res.data.user.profile_complete) navigate('/profile-setup')
      else navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password.')
    } finally { setLoading(false) }
  }

  return (
    <AuthLayout>
      <h2 className="text-[36px] font-bold text-[#111111] mb-1">Welcome back</h2>
      <p className="text-[14px] text-gray-label mb-8">
        Don't have an account?{' '}
        <Link to="/signup" className="text-primary font-semibold hover:underline">Sign up</Link>
      </p>

      <form onSubmit={handleSubmit} className="space-y-5 w-full max-w-[400px]">
        <div>
          <label className="label">Email</label>
          <input className="input-field" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input-field" type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-[13px] text-primary hover:underline">Forgot password?</Link>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full h-[52px] text-[16px] font-semibold rounded-lg">
          {loading ? 'Logging in...' : 'Login →'}
        </button>
      </form>

      <div className="flex items-center gap-4 my-6 w-full max-w-[400px]">
        <div className="flex-1 h-px bg-gray-border" />
        <span className="text-[13px] text-gray-label">or continue with</span>
        <div className="flex-1 h-px bg-gray-border" />
      </div>

      <div className="flex gap-3 w-full max-w-[400px]">
        <button onClick={handleGoogle} className="flex-1 h-[52px] bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center gap-2 text-[15px] font-semibold text-[#111111] hover:border-primary hover:bg-primary-light transition-colors shadow-sm">
          {GOOGLE_ICON}
          Sign in with Google
        </button>
      </div>
    </AuthLayout>
  )
}
