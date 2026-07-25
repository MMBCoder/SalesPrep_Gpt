import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../App'
import api from '../api'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [briefs, setBriefs] = useState([])
  const [search, setSearch] = useState('')
  const [generating, setGenerating] = useState(false)

  useEffect(() => { api.get('/briefs').then(r => setBriefs(r.data)) }, [])

  const latestBrief = briefs[0]

  const handleGenerate = () => {
    if (!search.trim()) return
    navigate('/brief-loading', { state: { clientName: search.trim() } })
  }

  const upcoming = briefs.slice(0, 4)
  const previousBriefs = briefs.slice(0, 4)

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex overflow-hidden">
        {/* Main */}
        <div className="flex-1 overflow-y-auto bg-white p-8">
          <div className="mb-8">
            <h1 className="text-[32px] font-bold text-[#000] mb-1">
              {(() => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening' })()}, {user?.name?.split(' ')[0] || 'Mirza'} 👋
            </h1>
            <p className="text-gray-label text-[16px]">Ready for your next meeting? Generate a brief below.</p>
          </div>

          {/* Generate new brief */}
          <div className="bg-input-bg rounded-2xl p-8 mb-8">
            <h2 className="text-[24px] font-bold text-[#000] mb-2">Generate a new brief</h2>
            <p className="text-gray-label text-[16px] mb-6">Enter a client or distributor name to get started.</p>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">🔍</span>
                <input
                  className="w-full bg-white rounded-xl pl-12 pr-4 py-4 text-[18px] outline-none border-2 border-transparent focus:border-primary"
                  placeholder="Search distributor or company name"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                />
              </div>
              <button onClick={handleGenerate} disabled={!search.trim()}
                className="bg-primary text-white px-8 py-4 rounded-xl text-[18px] font-semibold hover:opacity-90 disabled:opacity-50">
                Generate Brief →
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {['Hindustan Unilever', 'Dabur India', 'ITC Limited', 'Marico', 'Britannia'].map(c => (
                <button key={c} onClick={() => setSearch(c)}
                  className="bg-white border border-gray-border text-[14px] px-3 py-1.5 rounded-lg hover:border-primary hover:text-primary transition-colors">
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Recent briefs */}
          {latestBrief && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[22px] font-bold text-[#000]">Latest Brief</h2>
                <button onClick={() => navigate('/history')} className="text-primary text-[14px] font-medium hover:underline">View all history →</button>
              </div>
              <div className="bg-primary rounded-2xl p-8 text-white cursor-pointer hover:opacity-95" onClick={() => navigate(`/briefs/${latestBrief.id}`)}>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="bg-white text-primary text-[14px] font-semibold px-3 py-1 rounded-full">{latestBrief.industry} • {latestBrief.client_type}</span>
                    <h3 className="text-[32px] font-bold mt-3 mb-2">{latestBrief.client_name}</h3>
                    <p className="text-white/80 text-[16px] line-clamp-2">{latestBrief.company_background}</p>
                  </div>
                  <button className="bg-white text-primary font-bold px-5 py-2 rounded-xl text-[16px] hover:bg-primary-light ml-6 flex-shrink-0">
                    View Brief →
                  </button>
                </div>
                <div className="flex gap-6 mt-6 text-white/70 text-[14px]">
                  <span>Generated {new Date(latestBrief.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                  {latestBrief.rating && <span>Rated {latestBrief.rating}/5</span>}
                </div>
              </div>
            </div>
          )}

          {/* All briefs grid */}
          {briefs.length > 1 && (
            <div>
              <h2 className="text-[22px] font-bold text-[#000] mb-4">Previous Briefs</h2>
              <div className="grid grid-cols-2 gap-4">
                {briefs.slice(1, 5).map(b => (
                  <div key={b.id} onClick={() => navigate(`/briefs/${b.id}`)}
                    className="border border-gray-border rounded-xl p-5 hover:border-primary hover:shadow-sm cursor-pointer transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold">{b.client_name.charAt(0)}</div>
                      <div>
                        <p className="text-[16px] font-bold text-[#000]">{b.client_name}</p>
                        <p className="text-[13px] text-gray-label">{new Date(b.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <p className="text-[14px] text-gray-label line-clamp-2">{b.company_background}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="bg-primary-light text-primary text-[13px] px-2 py-0.5 rounded">{b.industry}</span>
                      {b.rating ? <span className="text-[13px] text-gray-label">{b.rating}/5 ⭐</span> : <button onClick={e => { e.stopPropagation(); navigate(`/briefs/${b.id}/rating`) }} className="text-primary text-[13px] hover:underline">Rate →</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="w-[240px] bg-input-bg border-l border-gray-border overflow-y-auto p-5">
          <h3 className="text-[16px] font-bold mb-4">Upcoming meetings</h3>
          {upcoming.map(b => (
            <div key={b.id} className="bg-white rounded-xl p-3 mb-2 cursor-pointer hover:shadow-sm" onClick={() => navigate(`/briefs/${b.id}`)}>
              <p className="text-[14px] font-bold">{b.client_name}</p>
              <p className="text-[12px] text-primary">{b.meeting_time || '10:30 AM'}</p>
              <p className="text-[12px] text-gray-label">{b.meeting_date ? new Date(b.meeting_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Upcoming'}</p>
            </div>
          ))}
          <button onClick={() => navigate('/add-client')} className="w-full mt-4 bg-primary text-white font-semibold py-3 rounded-xl text-[15px] hover:opacity-90">
            + New Brief
          </button>
          <button onClick={() => navigate('/history')} className="w-full mt-2 text-primary text-[13px] font-medium hover:underline">
            View all history →
          </button>
        </div>
      </div>
    </div>
  )
}
