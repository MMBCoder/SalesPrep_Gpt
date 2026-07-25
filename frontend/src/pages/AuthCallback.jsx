import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../App'

export default function AuthCallback() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState('Completing sign-in...')

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const token = params.get('token')
      const userParam = params.get('user')
      const next = params.get('next') || '/dashboard'

      if (!token || !userParam) {
        setStatus('Sign-in failed. Redirecting...')
        setTimeout(() => navigate('/login?error=google_failed'), 1500)
        return
      }

      const user = JSON.parse(decodeURIComponent(userParam))
      login(token, user)
      navigate(next)
    } catch {
      navigate('/login?error=google_failed')
    }
  }, [])

  return (
    <div className="flex h-screen items-center justify-center bg-white flex-col gap-4">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-[16px] font-medium text-gray-label">{status}</p>
    </div>
  )
}
