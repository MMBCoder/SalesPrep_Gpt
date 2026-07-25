import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import AIBriefContent from '../components/AIBriefContent'
import { exportBriefPDF } from '../utils/exportPDF'
import api from '../api'

export default function BriefResult() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [brief, setBrief] = useState(null)
  const [allBriefs, setAllBriefs] = useState([])
  const [exporting, setExporting] = useState(false)
  const contentRef = useRef(null)

  useEffect(() => {
    api.get(`/briefs/${id}`).then(r => setBrief(r.data))
    api.get('/briefs').then(r => setAllBriefs(r.data.slice(0, 4)))
  }, [id])

  if (!brief) return <div className="flex h-screen items-center justify-center text-gray-400">Loading...</div>

  const news = Array.isArray(brief.recent_news) ? brief.recent_news : []

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8 bg-white">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <span className="bg-primary text-white text-[16px] font-semibold px-4 py-1.5 rounded-full">
                {brief.industry || 'FMCG'} • {brief.client_type || 'Distributor'}
              </span>
              <h1 className="text-[36px] font-bold text-[#000] mt-3">{brief.client_name}</h1>
            </div>
            <div className="flex gap-3">
              <button onClick={() => navigate(`/briefs/${id}/regenerate`)} className="flex items-center justify-center bg-primary text-white w-[168px] h-[49px] rounded-lg font-bold text-[18px] hover:opacity-90">
                + New Brief
              </button>
              <button
                onClick={async () => { setExporting(true); await exportBriefPDF(brief, contentRef.current); setExporting(false) }}
                disabled={exporting}
                className="flex items-center justify-center border-2 border-primary text-primary w-[168px] h-[49px] rounded-lg font-bold text-[18px] hover:bg-primary-light disabled:opacity-60">
                {exporting ? 'Exporting...' : 'Export PDF'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6 mb-6 text-[14px] font-medium text-gray-label">
            <span>Source: Tavily Web Search + GPT-4o-mini</span>
            <span>Generated {new Date(brief.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <span className="inline-flex items-center gap-1 bg-input-bg px-3 py-1 rounded-md text-[13px]">🤖 AI-generated</span>
          </div>

          {/* AI-generated content block */}
          {brief.ai_content ? (
            <div ref={contentRef}>
              <AIBriefContent data={brief.ai_content} sources={brief.sources} />
            </div>
          ) : (
            <>
              {/* AI failed notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 flex items-start gap-3">
                <span className="text-amber-500 text-xl mt-0.5">⚠️</span>
                <div>
                  <p className="text-[15px] font-semibold text-amber-800">AI brief generation failed</p>
                  <p className="text-[13px] text-amber-700 mt-1">The OpenAI API key may be invalid or quota exceeded. Check <code className="bg-amber-100 px-1 rounded">backend/.env</code> and regenerate this brief.</p>
                </div>
              </div>
              {/* Fallback: Company Background */}
              <div className="bg-input-bg rounded-xl p-8 mb-6">
                <h2 className="text-[22px] font-bold text-[#000] mb-4">Company Background</h2>
                <p className="text-[18px] leading-relaxed text-[#000]">{brief.company_background}</p>
              </div>

              {/* Fallback: Recent News */}
              {news.length > 0 && (
                <div className="bg-input-bg rounded-xl p-8 mb-6">
                  <h2 className="text-[22px] font-bold text-[#000] mb-6">Recent News</h2>
                  <div className="space-y-5">
                    {news.map((item, i) => (
                      <div key={i} className="border-b border-gray-border pb-5 last:border-0 last:pb-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-[20px] font-semibold text-[#000] mb-1">{item.title}</p>
                            <p className="text-[17px] font-light text-[#6B7290]">{item.subtitle || item.summary}</p>
                          </div>
                          {item.date && (
                            <span className="bg-input-bg border border-gray-border text-[14px] font-medium text-gray-label px-3 py-1 rounded-md flex-shrink-0">{item.date}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Rating */}
          <div className="border border-gray-border rounded-xl p-6 flex items-center justify-between mt-8">
            <div>
              <p className="text-[18px] font-semibold text-[#000]">How was this brief?</p>
              <p className="text-[16px] text-[#6B7290]">You can also rate after your meeting →</p>
            </div>
            <button onClick={() => navigate(`/briefs/${id}/rating`)} className="bg-primary text-white px-8 py-3 rounded-xl text-[20px] font-bold hover:opacity-90">
              Rate this brief
            </button>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-[240px] bg-input-bg border-l border-gray-border overflow-y-auto p-5">
          <h3 className="text-[16px] font-bold text-[#000] mb-4">Meeting details</h3>
          {brief.meeting_date && (
            <div className="bg-white rounded-xl p-4 mb-4">
              <p className="text-[14px] font-bold text-[#000] mb-1">{brief.client_name}</p>
              <p className="text-[14px] font-medium text-primary flex items-center gap-1">
                🕐 {brief.meeting_time || 'Today, 10:30 AM'}
              </p>
              <p className="text-[14px] text-gray-label flex items-center gap-1">
                📍 {brief.meeting_location || 'Client office'}
              </p>
            </div>
          )}

          <h3 className="text-[16px] font-bold text-[#000] mb-3">Previous Briefs</h3>
          <div className="space-y-2">
            {allBriefs.filter(b => b.id !== parseInt(id)).slice(0, 3).map(b => (
              <button key={b.id} onClick={() => navigate(`/briefs/${b.id}`)} className="w-full text-left bg-white rounded-xl p-3 hover:shadow-sm transition-shadow">
                <p className="text-[14px] font-bold text-[#000] mb-1">{b.client_name}</p>
                <p className="text-[12px] text-gray-label">{new Date(b.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </button>
            ))}
          </div>
          <button onClick={() => navigate('/history')} className="text-[13px] font-medium text-primary mt-4 hover:underline">
            View all history →
          </button>
        </div>
      </div>
    </div>
  )
}
