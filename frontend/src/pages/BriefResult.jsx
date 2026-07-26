import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Sidebar, { SidebarToggle } from '../components/Sidebar'
import AIBriefContent from '../components/AIBriefContent'
import { exportBriefPDF } from '../utils/exportPDF'
import api from '../api'

const SECTOR_RULES = [
  { sector: 'Banking & Finance',    words: ['bank', 'financial service', 'credit card', 'credit product', 'payment solution', 'lending', 'loan', 'insurance', 'wealth management', 'asset management', 'brokerage', 'fintech', 'mortgage'] },
  { sector: 'Pharmaceuticals',      words: ['pharma', 'drug', 'medicine', 'therapeutic', 'biotech', 'clinical', 'healthcare product', 'formulation'] },
  { sector: 'Healthcare',           words: ['hospital', 'healthcare service', 'medical device', 'diagnostic', 'health system'] },
  { sector: 'IT Services',          words: ['software', 'it service', 'cloud computing', 'saas', 'enterprise software', 'digital transformation', 'information technology'] },
  { sector: 'Telecommunications',   words: ['telecom', 'mobile network', 'wireless', 'broadband', 'internet service provider'] },
  { sector: 'Automobiles',          words: ['automobile', 'automotive', 'vehicle', 'car manufacturer', 'electric vehicle', 'two-wheeler'] },
  { sector: 'Retail',               words: ['retail chain', 'e-commerce', 'supermarket', 'hypermarket', 'department store'] },
  { sector: 'Energy',               words: ['oil and gas', 'petroleum', 'renewable energy', 'power generation', 'electricity distribution'] },
  { sector: 'Metals & Mining',      words: ['steel', 'aluminium', 'mining', 'iron ore', 'cement'] },
  { sector: 'Media & Entertainment',words: ['media', 'entertainment', 'broadcasting', 'streaming', 'film', 'television'] },
]

function detectSector(brief) {
  const ai = brief.ai_content
  if (ai?.industry && ai.industry !== brief.industry) return ai.industry
  const text = ((ai?.overview || '') + ' ' + (ai?.tagline || '')).toLowerCase()
  for (const { sector, words } of SECTOR_RULES) {
    if (words.some(w => text.includes(w))) return sector
  }
  return brief.industry || 'FMCG'
}

export default function BriefResult() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [brief, setBrief] = useState(null)
  const [allBriefs, setAllBriefs] = useState([])
  const [exporting, setExporting] = useState(false)

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
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-white">
          {/* Mobile top bar */}
          <div className="flex items-center gap-3 mb-4 md:hidden">
            <SidebarToggle />
            <span className="font-bold text-base text-[#000] truncate">{brief.client_name}</span>
          </div>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div className="min-w-0">
              <span className="bg-primary text-white text-[14px] md:text-[16px] font-semibold px-4 py-1.5 rounded-full">
                {detectSector(brief)} • {brief.client_type || 'Distributor'}
              </span>
              <h1 className="text-[26px] md:text-[36px] font-bold text-[#000] mt-3 leading-tight">{brief.client_name}</h1>
            </div>
            <div className="flex gap-2 sm:gap-3 flex-shrink-0">
              <button onClick={() => navigate(`/briefs/${id}/regenerate`)}
                className="flex-1 sm:flex-none flex items-center justify-center bg-primary text-white sm:w-[168px] h-[44px] md:h-[49px] px-4 rounded-lg font-bold text-[15px] md:text-[18px] hover:opacity-90">
                + New Brief
              </button>
              <button
                onClick={async () => { setExporting(true); await exportBriefPDF(brief); setExporting(false) }}
                disabled={exporting}
                className="flex-1 sm:flex-none flex items-center justify-center border-2 border-primary text-primary sm:w-[168px] h-[44px] md:h-[49px] px-4 rounded-lg font-bold text-[15px] md:text-[18px] hover:bg-primary-light disabled:opacity-60">
                {exporting ? 'Exporting...' : 'Export PDF'}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 md:gap-6 mb-6 text-[12px] md:text-[14px] font-medium text-gray-label">
            <span>Source: Tavily + GPT-4o-mini</span>
            <span>Generated {new Date(brief.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <span className="inline-flex items-center gap-1 bg-input-bg px-3 py-1 rounded-md text-[12px] md:text-[13px]">🤖 AI-generated</span>
          </div>

          {/* AI-generated content */}
          {brief.ai_content ? (
            <AIBriefContent data={brief.ai_content} sources={brief.sources} />
          ) : (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 flex items-start gap-3">
                <span className="text-amber-500 text-xl mt-0.5">⚠️</span>
                <div>
                  <p className="text-[15px] font-semibold text-amber-800">AI brief generation failed</p>
                  <p className="text-[13px] text-amber-700 mt-1">The OpenAI API key may be invalid or quota exceeded. Check <code className="bg-amber-100 px-1 rounded">backend/.env</code> and regenerate this brief.</p>
                </div>
              </div>
              <div className="bg-input-bg rounded-xl p-6 md:p-8 mb-6">
                <h2 className="text-[20px] md:text-[22px] font-bold text-[#000] mb-4">Company Background</h2>
                <p className="text-[16px] md:text-[18px] leading-relaxed text-[#000]">{brief.company_background}</p>
              </div>
              {news.length > 0 && (
                <div className="bg-input-bg rounded-xl p-6 md:p-8 mb-6">
                  <h2 className="text-[20px] md:text-[22px] font-bold text-[#000] mb-6">Recent News</h2>
                  <div className="space-y-5">
                    {news.map((item, i) => (
                      <div key={i} className="border-b border-gray-border pb-5 last:border-0 last:pb-0">
                        <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-3">
                          <div className="flex-1">
                            <p className="text-[18px] md:text-[20px] font-semibold text-[#000] mb-1">{item.title}</p>
                            <p className="text-[15px] md:text-[17px] font-light text-[#6B7290]">{item.subtitle || item.summary}</p>
                          </div>
                          {item.date && (
                            <span className="bg-input-bg border border-gray-border text-[13px] md:text-[14px] font-medium text-gray-label px-3 py-1 rounded-md flex-shrink-0">{item.date}</span>
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
          <div className="border border-gray-border rounded-xl p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4 mt-8">
            <div>
              <p className="text-[16px] md:text-[18px] font-semibold text-[#000]">How was this brief?</p>
              <p className="text-[14px] md:text-[16px] text-[#6B7290]">You can also rate after your meeting →</p>
            </div>
            <button onClick={() => navigate(`/briefs/${id}/rating`)} className="w-full sm:w-auto bg-primary text-white px-6 md:px-8 py-3 rounded-xl text-[17px] md:text-[20px] font-bold hover:opacity-90">
              Rate this brief
            </button>
          </div>
        </div>

        {/* Right sidebar — hidden on mobile/tablet */}
        <div className="hidden lg:flex flex-col w-[240px] bg-input-bg border-l border-gray-border overflow-y-auto p-5">
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
