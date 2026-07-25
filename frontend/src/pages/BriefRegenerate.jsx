import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import api from '../api'

export default function BriefRegenerate() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [brief, setBrief] = useState(null)
  const [allBriefs, setAllBriefs] = useState([])
  const [newClient, setNewClient] = useState('')
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    api.get(`/briefs/${id}`).then(r => setBrief(r.data))
    api.get('/briefs').then(r => setAllBriefs(r.data))
  }, [id])

  const handleRegenerate = async () => {
    if (!newClient.trim() && !brief) return
    setGenerating(true)
    navigate('/brief-loading', { state: { clientName: newClient.trim() || brief?.client_name } })
  }

  if (!brief) return <div className="flex h-screen items-center justify-center text-gray-400">Loading...</div>

  const upcoming = allBriefs.slice(0, 4)

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex overflow-hidden">
        {/* Main */}
        <div className="flex-1 overflow-y-auto p-8">
          <h1 className="text-[36px] font-bold text-[#000] mb-2">{brief.client_name}</h1>
          <p className="text-gray-label mb-8">Regenerate brief with updated data</p>

          <div className="bg-white border border-gray-border rounded-xl p-8 mb-6">
            <h2 className="text-[22px] font-bold mb-4">Generate a new brief</h2>
            <div className="relative mb-4">
              <input
                className="w-full bg-input-bg rounded-xl px-5 py-4 text-[18px] outline-none border-2 border-transparent focus:border-primary"
                placeholder="Search distributor or company name"
                value={newClient}
                onChange={e => setNewClient(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <button onClick={handleRegenerate} disabled={generating}
                className="flex-1 h-[52px] bg-primary text-white font-bold text-[22px] rounded-xl hover:opacity-90 disabled:opacity-50">
                Regenerate
              </button>
              <button onClick={() => navigate(`/briefs/${id}`)} className="px-8 h-[52px] border-2 border-primary text-primary font-bold text-[18px] rounded-xl hover:bg-primary-light">
                Cancel
              </button>
            </div>
          </div>

          <div className="bg-input-bg rounded-xl p-6">
            <p className="text-[16px] text-gray-label">Original brief for <strong className="text-[#000]">{brief.client_name}</strong></p>
            <p className="text-[15px] text-gray-label mt-2 line-clamp-3">{brief.company_background}</p>
            <button onClick={() => navigate(`/briefs/${id}`)} className="text-primary text-[14px] font-medium mt-3 hover:underline">
              View original brief →
            </button>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-[240px] bg-input-bg border-l border-gray-border overflow-y-auto p-5">
          <h3 className="text-[16px] font-bold text-[#000] mb-4">Meeting details</h3>
          <div className="bg-white rounded-xl p-4 mb-6">
            <p className="text-[14px] font-bold">{brief.client_name}</p>
            <p className="text-[14px] text-primary">🕐 {brief.meeting_time || '10:30 AM'}</p>
            <p className="text-[14px] text-gray-label">📍 {brief.meeting_location || 'Client office'}</p>
          </div>
          <h3 className="text-[16px] font-bold mb-3">New Meetings</h3>
          {upcoming.slice(0, 3).map(b => (
            <div key={b.id} className="bg-white rounded-xl p-3 mb-2">
              <p className="text-[14px] font-medium text-[#000]">{b.client_name}</p>
              <p className="text-[12px] text-gray-label">{new Date(b.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
            </div>
          ))}
          <h3 className="text-[16px] font-bold mt-4 mb-3">Previous Briefs</h3>
          {allBriefs.slice(0, 3).map(b => (
            <button key={b.id} onClick={() => navigate(`/briefs/${b.id}`)} className="w-full text-left bg-white rounded-xl p-3 mb-2 hover:shadow-sm">
              <p className="text-[14px] font-medium text-[#000]">{b.client_name}</p>
              <p className="text-[12px] text-gray-label">{new Date(b.created_at).toLocaleDateString('en-GB')}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
