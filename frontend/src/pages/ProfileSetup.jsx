import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import api from '../api'

export default function ProfileSetup() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: user?.name || '',
    company: user?.company || '',
    job_title: user?.job_title || '',
    industry: user?.industry || '',
    city: user?.city || '',
  })
  const [loading, setLoading] = useState(false)

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await api.put('/me/profile', form)
    setUser(u => ({ ...u, ...form, profile_complete: 1 }))
    navigate('/add-client')
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F2F2F2]">
      <div className="bg-white rounded-2xl shadow-lg p-12 max-w-[761px] w-full mx-4 relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[16px] font-medium text-primary bg-primary-light px-3 py-1 rounded-full">Step 2 of 3</span>
          <span className="text-[14px] font-medium text-gray-label">Step 3 of 3</span>
        </div>
        <h2 className="text-[36px] font-bold text-[#111] mt-4 mb-2">Set up your profile</h2>
        <p className="text-[19px] font-medium text-gray-label mb-2">This helps SalesPrep personalize your briefs.</p>
        <p className="text-[15px] text-gray-label mb-8">You can update this anytime in the Settings.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="text-[18px] text-gray-label mb-1 block">Full name</label>
              <input name="name" className="input-field text-[20px] py-4" placeholder="e.g. John Smith" value={form.name} onChange={handle} />
            </div>
            <div>
              <label className="text-[18px] text-gray-label mb-1 block">Job title</label>
              <input name="job_title" className="input-field text-[20px] py-4" placeholder="e.g. Territory Sales Executive" value={form.job_title} onChange={handle} />
            </div>
            <div>
              <label className="text-[18px] text-gray-label mb-1 block">Company name</label>
              <input name="company" className="input-field text-[20px] py-4" placeholder="e.g. Hindustan Unilever" value={form.company} onChange={handle} />
            </div>
            <div>
              <label className="text-[18px] text-gray-label mb-1 block">Industry</label>
              <select name="industry" className="input-field text-[20px] py-4" value={form.industry} onChange={handle}>
                <option value="">Select Industry</option>
                <option>FMCG</option>
                <option>Food & Beverage</option>
                <option>Personal Care</option>
                <option>Healthcare</option>
                <option>Retail</option>
              </select>
            </div>
            <div>
              <label className="text-[18px] text-gray-label mb-1 block">City/region</label>
              <input name="city" className="input-field text-[20px] py-4" placeholder="e.g. Mumbai, Maharashtra" value={form.city} onChange={handle} />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button type="button" onClick={() => navigate('/add-client')} className="text-[18px] text-gray-400 hover:text-gray-600">Skip for now</button>
            <button type="submit" disabled={loading} className="btn-primary px-8 py-3 text-[18px] font-semibold rounded-lg">
              {loading ? 'Saving...' : 'Continue →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
