import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import api from '../api'

const RATINGS = [
  { value: 1, label: 'Poor' },
  { value: 2, label: 'Fair' },
  { value: 3, label: 'Good' },
  { value: 4, label: 'Great' },
  { value: 5, label: 'Excellent' },
]

export default function BriefRating() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [brief, setBrief] = useState(null)
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [allBriefs, setAllBriefs] = useState([])

  useEffect(() => {
    api.get(`/briefs/${id}`).then(r => { setBrief(r.data); setSelected(r.data.rating) })
    api.get('/briefs').then(r => setAllBriefs(r.data))
  }, [id])

  const handleSubmit = async () => {
    if (!selected) return
    await api.put(`/briefs/${id}/rating`, { rating: selected })
    setSubmitted(true)
    setTimeout(() => navigate('/history'), 1500)
  }

  if (!brief) return <div className="flex h-screen items-center justify-center text-gray-400">Loading...</div>

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex overflow-hidden">
        {/* Main */}
        <div className="flex-1 overflow-y-auto p-10">
          <h1 className="text-[32px] font-bold text-[#000] mb-1">{brief.client_name}</h1>
          <p className="text-[18px] font-medium text-gray-label mb-10">Today, {brief.meeting_time || '10:30 AM'}</p>

          <div className="max-w-[600px]">
            <h2 className="text-[23px] font-bold text-[#000] mb-2">How was this brief useful?</h2>
            <p className="text-[15px] text-gray-label mb-8">Your ratings helps SalesPrep improve future briefs.</p>

            <div className="flex gap-4 mb-10">
              {RATINGS.map(r => (
                <button key={r.value} onClick={() => setSelected(r.value)}
                  className={`flex-1 py-4 rounded-xl border-2 font-bold text-[15px] transition-all ${selected === r.value ? 'bg-primary text-white border-primary' : 'border-gray-border text-[#000] hover:border-primary hover:text-primary'}`}>
                  {'⭐'.repeat(r.value)}<br />{r.label}
                </button>
              ))}
            </div>

            {submitted ? (
              <div className="bg-primary-light border border-primary rounded-xl p-6 text-center">
                <p className="text-primary text-[20px] font-bold">✓ Rating submitted!</p>
                <p className="text-gray-label mt-1">Redirecting to history...</p>
              </div>
            ) : (
              <button onClick={handleSubmit} disabled={!selected}
                className="w-full h-[52px] bg-primary text-white font-bold text-[20px] rounded-xl hover:opacity-90 disabled:opacity-40">
                Submit Rating →
              </button>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-[260px] bg-input-bg border-l border-gray-border overflow-y-auto p-5">
          <h3 className="text-[16px] font-bold mb-3">Upcoming meetings</h3>
          {allBriefs.slice(0, 4).map(b => (
            <div key={b.id} className="bg-white rounded-xl p-3 mb-2">
              <p className="text-[14px] font-medium">{b.client_name}</p>
              <p className="text-[12px] text-gray-label">{new Date(b.created_at).toLocaleDateString('en-GB')}</p>
            </div>
          ))}
          <button className="text-[13px] text-primary mt-2 hover:underline">View full calendar →</button>
        </div>
      </div>
    </div>
  )
}
