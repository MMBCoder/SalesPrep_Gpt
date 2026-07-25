import React, { createContext, useContext, useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import api from './api'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import Onboarding from './pages/Onboarding'
import ProfileSetup from './pages/ProfileSetup'
import AddClient from './pages/AddClient'
import BriefLoading from './pages/BriefLoading'
import BriefResult from './pages/BriefResult'
import BriefHistory from './pages/BriefHistory'
import BriefRating from './pages/BriefRating'
import BriefRegenerate from './pages/BriefRegenerate'
import Dashboard from './pages/Dashboard'
import MyBriefs from './pages/MyBriefs'
import Settings from './pages/Settings'
import AuthCallback from './pages/AuthCallback'

export const AuthContext = createContext(null)

export function useAuth() { return useContext(AuthContext) }

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen text-gray-400">Loading...</div>
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('sp_token')
    if (!token) { setLoading(false); return }
    if (token === 'demo-token-mirza') {
      setUser({ id: 1, email: 'demo@salesprep.ai', name: 'Demo User', company: 'SalesPrep', job_title: 'Territory Sales Executive', industry: 'FMCG', city: 'Mumbai, Maharashtra', onboarding_complete: 1, profile_complete: 1 })
      setLoading(false)
      return
    }
    api.get('/me').then(r => { setUser(r.data); setLoading(false) }).catch(() => { localStorage.removeItem('sp_token'); setLoading(false) })
  }, [])

  const login = (token, userData) => { localStorage.setItem('sp_token', token); setUser(userData) }
  const logout = () => { localStorage.removeItem('sp_token'); setUser(null) }

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />
        <Route path="/profile-setup" element={<PrivateRoute><ProfileSetup /></PrivateRoute>} />
        <Route path="/add-client" element={<PrivateRoute><AddClient /></PrivateRoute>} />
        <Route path="/brief-loading" element={<PrivateRoute><BriefLoading /></PrivateRoute>} />
        <Route path="/briefs/:id" element={<PrivateRoute><BriefResult /></PrivateRoute>} />
        <Route path="/briefs/:id/regenerate" element={<PrivateRoute><BriefRegenerate /></PrivateRoute>} />
        <Route path="/briefs/:id/rating" element={<PrivateRoute><BriefRating /></PrivateRoute>} />
        <Route path="/history" element={<PrivateRoute><BriefHistory /></PrivateRoute>} />
        <Route path="/my-briefs" element={<PrivateRoute><MyBriefs /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthContext.Provider>
  )
}
