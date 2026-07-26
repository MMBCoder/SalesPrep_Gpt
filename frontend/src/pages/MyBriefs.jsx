import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar, { SidebarToggle } from '../components/Sidebar'
import { exportBriefPDF } from '../utils/exportPDF'
import api from '../api'

const INDUSTRY_COLORS = {
  'FMCG': 'bg-green-100 text-green-700',
  'Personal Care': 'bg-blue-100 text-blue-700',
  'Food & Bev': 'bg-orange-100 text-orange-700',
  'Healthcare': 'bg-purple-100 text-purple-700',
}

function ratingStars(rating) {
  if (!rating) return null
  return '⭐'.repeat(Math.round(rating))
}

export default function MyBriefs() {
  const navigate = useNavigate()
  const [briefs, setBriefs] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => { api.get('/briefs').then(r => setBriefs(r.data)) }, [])

  const industries = [...new Set(briefs.map(b => b.industry).filter(Boolean))]

  const filtered = briefs.filter(b => {
    const matchIndustry = filter === 'all' || b.industry === filter
    const matchSearch = !search || b.client_name.toLowerCase().includes(search.toLowerCase())
    return matchIndustry && matchSearch
  })

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto bg-white p-4 md:p-8">
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 mb-4 md:hidden">
          <SidebarToggle />
          <span className="font-bold text-lg text-[#000]">My Briefs</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-[26px] md:text-[36px] font-bold text-[#000]">My Briefs</h1>
            <p className="text-[15px] md:text-[18px] text-gray-label mt-1">All {briefs.length} briefs across your accounts</p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="bg-primary text-white font-bold text-[14px] md:text-[16px] px-5 py-2.5 md:px-6 md:py-3 rounded-xl hover:opacity-90 self-start">
            + Generate New
          </button>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6 md:mb-8">
          <div className="relative flex-1 sm:max-w-sm">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by client name..."
              className="w-full bg-input-bg rounded-xl pl-11 pr-4 py-3 text-[14px] md:text-[15px] outline-none border-2 border-transparent focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {['all', ...industries].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-[13px] md:text-[14px] font-semibold transition-colors flex-shrink-0 ${filter === f ? 'bg-primary text-white' : 'bg-input-bg text-gray-label hover:bg-gray-200'}`}
              >
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>
        </div>

        {/* Cards Grid — 1 col mobile, 2 col tablet, 3 col desktop */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-label">
            <p className="text-[18px] font-semibold mb-2">No briefs found</p>
            <p className="text-[14px]">Try a different filter or generate a new brief</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filtered.map(brief => {
              const colorClass = INDUSTRY_COLORS[brief.industry] || 'bg-gray-100 text-gray-700'
              const isAI = !!brief.ai_content
              return (
                <div key={brief.id} className="bg-white border border-gray-border rounded-2xl p-5 md:p-6 hover:shadow-md transition-shadow group">
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-[18px] md:text-[20px]">
                      {brief.client_name.charAt(0)}
                    </div>
                    <div className="flex items-center gap-2">
                      {isAI && <span className="text-[11px] font-bold bg-primary-light text-primary px-2 py-0.5 rounded-full">🤖 AI</span>}
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${colorClass}`}>{brief.industry}</span>
                    </div>
                  </div>

                  <h3 className="text-[17px] md:text-[18px] font-bold text-[#000] mb-1 leading-tight">{brief.client_name}</h3>
                  <p className="text-[12px] md:text-[13px] text-gray-label mb-4">{brief.client_type || 'Distributor'}</p>

                  {brief.ai_content?.tagline && (
                    <p className="text-[12px] md:text-[13px] text-gray-label italic mb-4 line-clamp-2">{brief.ai_content.tagline}</p>
                  )}

                  {brief.ai_content?.key_metrics && (
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {Object.entries(brief.ai_content.key_metrics).slice(0, 4).map(([k, v]) => (
                        <div key={k} className="bg-input-bg rounded-lg px-3 py-2">
                          <p className="text-[10px] text-gray-label uppercase tracking-wide">{k.replace(/_/g, ' ')}</p>
                          <p className="text-[12px] md:text-[13px] font-bold text-[#000] truncate">{v}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {brief.meeting_date && (
                    <div className="flex items-center gap-2 text-[12px] md:text-[13px] text-gray-label mb-4">
                      <span>📅</span>
                      <span>{brief.meeting_date}</span>
                      {brief.meeting_time && <span>• {brief.meeting_time}</span>}
                    </div>
                  )}

                  {brief.rating ? (
                    <div className="text-[13px] md:text-[14px] mb-4">{ratingStars(brief.rating)} <span className="text-gray-label text-[12px]">{brief.rating}/5</span></div>
                  ) : (
                    <div className="text-[12px] md:text-[13px] text-gray-400 mb-4">Not rated yet</div>
                  )}

                  <p className="text-[11px] md:text-[12px] text-gray-400 mb-5">
                    {new Date(brief.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>

                  {/* Actions — always visible on mobile, hover on desktop */}
                  <div className="flex gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => navigate(`/briefs/${brief.id}`)}
                      className="flex-1 bg-primary text-white text-[13px] font-bold py-2 rounded-lg hover:opacity-90"
                    >
                      View Brief
                    </button>
                    <button
                      onClick={() => exportBriefPDF(brief)}
                      className="border border-primary text-primary text-[13px] font-bold px-3 py-2 rounded-lg hover:bg-primary-light"
                    >
                      PDF
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
