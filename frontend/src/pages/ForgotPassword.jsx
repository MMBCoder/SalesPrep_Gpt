import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import api from '../api'

export default function ForgotPassword() {
  const [method, setMethod] = useState('email')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    await api.post('/forgot-password', { email })
    setSent(true)
  }

  return (
    <AuthLayout>
      <h2 className="text-[36px] font-bold text-[#111111] mb-2">Reset your password</h2>
      <p className="text-[16px] text-gray-label mb-8">Choose how you'd like to receive your reset link.</p>

      <div className="flex gap-3 mb-6 w-full max-w-[400px]">
        <button onClick={() => setMethod('email')} className={`flex-1 h-[44px] rounded-lg text-[16px] font-medium border-2 transition-colors ${method === 'email' ? 'border-primary text-primary bg-primary-light' : 'border-gray-border text-gray-label'}`}>Via Email</button>
        <button onClick={() => setMethod('phone')} className={`flex-1 h-[44px] rounded-lg text-[16px] font-medium border-2 transition-colors ${method === 'phone' ? 'border-primary text-primary bg-primary-light' : 'border-gray-border text-gray-label'}`}>Via Phone</button>
      </div>

      {sent ? (
        <div className="w-full max-w-[400px] bg-primary-light border border-primary rounded-lg p-4 text-primary font-medium">
          ✓ Reset link sent! Check your email inbox.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-[400px]">
          <input className="input-field text-[20px] py-4" type={method === 'email' ? 'email' : 'tel'} placeholder={method === 'email' ? 'Enter your email address' : 'Enter your phone number'} value={email} onChange={e => setEmail(e.target.value)} required />
          <button type="submit" className="btn-primary w-full h-[52px] text-[17px]">Send reset link →</button>
        </form>
      )}

      <div className="mt-6 flex items-center gap-4 w-full max-w-[400px]">
        <Link to="/login" className="text-[16px] font-semibold text-primary hover:underline">← Back to login</Link>
        <span className="text-gray-label text-[15px]">Remember your password?</span>
        <Link to="/login" className="text-[15px] text-primary font-medium hover:underline">Log in</Link>
      </div>
    </AuthLayout>
  )
}
