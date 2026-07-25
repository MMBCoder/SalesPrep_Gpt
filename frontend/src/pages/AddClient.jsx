import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../api'

const COMMON_CLIENTS = ['Hindustan Unilever', 'Emami', 'Marico', 'Dabur India', 'ITC Limited']

export default function AddClient() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const isFromDashboard = location.state?.from === 'dashboard'

  const handleGenerate = async () => {
    const clientName = selected || search
    if (!clientName.trim()) return
    setLoading(true)
    try {
      navigate('/brief-loading', { state: { clientName: clientName.trim() } })
    } catch (e) { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[#F2F2F2] flex flex-col">
      <div className="px-12 py-5 bg-white border-b border-gray-border">
        <div className="flex items-center gap-3">
          <span className="bg-primary-light text-primary text-[16px] font-medium px-3 py-1 rounded-full">Step 3 of 3</span>
          <span className="text-[14px] text-gray-label ml-auto">Step 3 of 3</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-sm p-12 max-w-[761px] w-full">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-[16px] font-medium text-white bg-primary px-3 py-1 rounded-full">Almost there!</span>
            <span className="text-[20px] text-gray-400 font-medium">Ready in under 2 mins</span>
          </div>

          <h2 className="text-[36px] font-bold text-[#111] mb-3">Add your first client</h2>
          <p className="text-[19px] text-gray-label mb-2">
            Enter a distributor or retailer you're meeting soon. We'll generate your first brief right now
          </p>
          <p className="text-[18px] text-gray-label mb-6">e.g. Hindustan Unilever, ITC Limited, Dabur India</p>

          <div className="relative mb-6">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">🔍</span>
            <input
              className="w-full bg-input-bg rounded-xl pl-12 pr-4 py-4 text-[20px] font-medium outline-none border-2 border-transparent focus:border-primary transition-colors placeholder-gray-400"
              placeholder="Search distributor or company name"
              value={search}
              onChange={e => { setSearch(e.target.value); setSelected(null) }}
            />
          </div>

          {selected && (
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="bg-primary text-white text-[18px] font-medium px-4 py-2 rounded-lg">{selected} ✓</span>
            </div>
          )}

          <p className="text-[18px] text-gray-label mb-3">Common FMCG accounts:</p>
          <div className="flex flex-wrap gap-2 mb-8">
            {COMMON_CLIENTS.map(c => (
              <button key={c} onClick={() => { setSelected(c); setSearch(c) }}
                className={`px-4 py-2 rounded-lg text-[18px] font-medium border-2 transition-colors ${selected === c ? 'bg-primary text-white border-primary' : 'bg-input-bg text-[#111] border-transparent hover:border-primary'}`}>
                {c}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={handleGenerate}
              disabled={!search.trim() || loading}
              className="flex-1 h-[61px] bg-primary text-white font-semibold text-[20px] rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate my first brief →'}
            </button>
            <button onClick={() => navigate('/dashboard')} className="text-[16px] text-gray-400 hover:text-gray-600 whitespace-nowrap">
              Skip for now, I'll add clients later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
