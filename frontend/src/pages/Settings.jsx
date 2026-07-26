import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar, { SidebarToggle } from '../components/Sidebar'
import { useAuth } from '../App'
import api from '../api'

const INDUSTRIES = ['FMCG', 'Personal Care', 'Food & Bev', 'Healthcare', 'Retail', 'Technology', 'Finance', 'Other']

export default function Settings() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: user?.name || '',
    company: user?.company || '',
    job_title: user?.job_title || '',
    industry: user?.industry || '',
    city: user?.city || '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const isDemo = localStorage.getItem('sp_token') === 'demo-token-mirza'

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setSaved(false)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      if (!isDemo) {
        await api.put('/me/profile', form)
      }
      setUser(u => ({ ...u, ...form }))
      setSaved(true)
    } catch (err) {
      console.error('Save error:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto bg-white p-4 md:p-8">
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 mb-4 md:hidden">
          <SidebarToggle />
          <span className="font-bold text-lg text-[#000]">Settings</span>
        </div>
        <div className="max-w-2xl">
          <h1 className="text-[26px] md:text-[36px] font-bold text-[#000] mb-2">Settings</h1>
          <p className="text-[15px] md:text-[18px] text-gray-label mb-8 md:mb-10">Manage your profile and account preferences.</p>

          {/* Profile Avatar */}
          <div className="flex items-center gap-6 mb-10">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-[32px] font-bold">
              {(form.name || user?.email || 'M').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-[22px] font-bold text-[#000]">{form.name || 'Your Name'}</p>
              <p className="text-[16px] text-gray-label">{user?.email}</p>
              {isDemo && <p className="text-[12px] text-amber-600 mt-1 bg-amber-50 px-2 py-0.5 rounded-full inline-block">Demo account — changes saved locally</p>}
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Section: Personal Info */}
            <div>
              <h2 className="text-[20px] font-bold text-[#000] mb-5 flex items-center gap-3">
                <div className="w-1 h-6 bg-primary rounded-full" />
                Personal Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[14px] font-semibold text-gray-label mb-2">Full Name</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full bg-input-bg rounded-xl px-4 py-3 text-[16px] outline-none border-2 border-transparent focus:border-primary"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-[14px] font-semibold text-gray-label mb-2">City</label>
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    className="w-full bg-input-bg rounded-xl px-4 py-3 text-[16px] outline-none border-2 border-transparent focus:border-primary"
                    placeholder="e.g. Mumbai, Maharashtra"
                  />
                </div>
              </div>
            </div>

            {/* Section: Work Info */}
            <div>
              <h2 className="text-[20px] font-bold text-[#000] mb-5 flex items-center gap-3">
                <div className="w-1 h-6 bg-primary rounded-full" />
                Work Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[14px] font-semibold text-gray-label mb-2">Company / Organisation</label>
                  <input
                    name="company"
                    value={form.company}
                    onChange={handleChange}
                    className="w-full bg-input-bg rounded-xl px-4 py-3 text-[16px] outline-none border-2 border-transparent focus:border-primary"
                    placeholder="e.g. SalesPrep India Pvt. Ltd."
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[14px] font-semibold text-gray-label mb-2">Job Title</label>
                    <input
                      name="job_title"
                      value={form.job_title}
                      onChange={handleChange}
                      className="w-full bg-input-bg rounded-xl px-4 py-3 text-[16px] outline-none border-2 border-transparent focus:border-primary"
                      placeholder="e.g. Territory Sales Executive"
                    />
                  </div>
                  <div>
                    <label className="block text-[14px] font-semibold text-gray-label mb-2">Industry</label>
                    <select
                      name="industry"
                      value={form.industry}
                      onChange={handleChange}
                      className="w-full bg-input-bg rounded-xl px-4 py-3 text-[16px] outline-none border-2 border-transparent focus:border-primary"
                    >
                      <option value="">Select industry</option>
                      {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Section */}
            <div>
              <h2 className="text-[20px] font-bold text-[#000] mb-5 flex items-center gap-3">
                <div className="w-1 h-6 bg-primary rounded-full" />
                Account
              </h2>
              <div className="bg-input-bg rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[16px] font-semibold text-[#000]">Email address</p>
                    <p className="text-[14px] text-gray-label">{user?.email}</p>
                  </div>
                  <span className="text-[12px] font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full">Verified</span>
                </div>
                <div className="border-t border-gray-border pt-3 flex items-center justify-between">
                  <div>
                    <p className="text-[16px] font-semibold text-[#000]">Password</p>
                    <p className="text-[14px] text-gray-label">••••••••</p>
                  </div>
                  <button type="button" className="text-primary text-[14px] font-semibold hover:underline">Change</button>
                </div>
              </div>
            </div>

            {/* Save button */}
            <div className="flex items-center gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="bg-primary text-white font-bold text-[16px] px-10 py-3 rounded-xl hover:opacity-90 disabled:opacity-60 transition-opacity"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              {saved && (
                <span className="text-green-600 font-semibold text-[15px] flex items-center gap-2">
                  ✓ Changes saved successfully
                </span>
              )}
              <button type="button" onClick={() => navigate('/dashboard')} className="text-gray-label font-medium text-[15px] hover:underline ml-2">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
