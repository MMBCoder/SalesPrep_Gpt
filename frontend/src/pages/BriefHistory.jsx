import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar, { SidebarToggle } from '../components/Sidebar'
import { exportBriefPDF, exportHistoryPDF } from '../utils/exportPDF'
import api from '../api'

export default function BriefHistory() {
  const navigate = useNavigate()
  const [briefs, setBriefs] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const PER_PAGE = 5

  useEffect(() => { api.get('/briefs').then(r => setBriefs(r.data)) }, [])

  const filtered = briefs.filter(b => b.client_name.toLowerCase().includes(search.toLowerCase()))
  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const totalBriefs = briefs.length
  const thisMonth = briefs.filter(b => new Date(b.created_at).getMonth() === new Date().getMonth()).length
  const rated = briefs.filter(b => b.rating)
  const avgRating = rated.length ? (rated.reduce((s, b) => s + b.rating, 0) / rated.length).toFixed(1) : '—'
  const timeSaved = Math.round(totalBriefs * 0.75)

  const clients = [...new Set(briefs.map(b => b.client_name))]

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex overflow-hidden">
        {/* Main */}
        <div className="flex-1 overflow-y-auto bg-white p-4 md:p-8">
          {/* Mobile top bar */}
          <div className="flex items-center gap-3 mb-4 md:hidden">
            <SidebarToggle />
            <span className="font-bold text-lg text-[#000]">Brief History</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-[26px] md:text-[36px] font-bold text-[#000]">Brief History</h1>
              <p className="text-[15px] md:text-[19px] font-medium text-[#6B7288]">All briefs generated across your accounts.</p>
            </div>
            <button onClick={() => exportHistoryPDF(briefs)} className="border-2 border-primary text-primary font-bold text-[15px] md:text-[18px] px-5 py-2.5 md:px-6 md:py-3 rounded-xl hover:bg-primary-light whitespace-nowrap self-start">
              Export All PDF
            </button>
          </div>

          {/* Stats — 2×2 on mobile, 4 cols on desktop */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
            {[
              { label: 'Total Briefs', value: totalBriefs, sub: 'All time', color: 'text-[#000]' },
              { label: 'This Month', value: thisMonth, sub: 'May 2026', color: 'text-[#1D6A4A]' },
              { label: 'Avg. Rating', value: avgRating, sub: 'Est. total', color: 'text-[#000]' },
              { label: 'Time Saved', value: `${timeSaved} hrs`, sub: 'Est.', color: 'text-[#1D6A4A]' },
            ].map(s => (
              <div key={s.label} className="bg-input-bg rounded-xl p-4 md:p-5">
                <p className="text-[14px] md:text-[17px] font-medium text-[#6B7288] mb-1">{s.label}</p>
                <p className={`text-[24px] md:text-[32px] font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[13px] md:text-[15px] text-[#6B7288]">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Filters — scroll on narrow screens */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
            <div className="relative flex-1 sm:max-w-[300px]">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input className="w-full bg-input-bg rounded-xl pl-10 pr-4 py-3 text-[15px] md:text-[18px] outline-none border-2 border-transparent focus:border-primary"
                placeholder="Search by client name" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <select className="bg-input-bg rounded-xl px-4 py-3 text-[15px] md:text-[18px] outline-none border-2 border-transparent focus:border-primary flex-shrink-0">
                <option>All</option>
                <option>FMCG</option>
                <option>Food & Bev</option>
                <option>Personal Care</option>
              </select>
              <select className="bg-input-bg rounded-xl px-4 py-3 text-[15px] md:text-[18px] outline-none border-2 border-transparent focus:border-primary flex-shrink-0">
                <option>All Ratings</option>
                <option>5 ⭐</option>
                <option>4 ⭐</option>
                <option>3 ⭐</option>
              </select>
              {search && <button onClick={() => { setSearch(''); setPage(1) }} className="text-primary text-[15px] font-medium hover:underline flex-shrink-0">Clear</button>}
            </div>
          </div>

          <p className="text-[15px] md:text-[18px] font-medium text-[#6B7288] mb-4">
            Showing {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE, filtered.length)} of {filtered.length} briefs
          </p>

          {/* Table with horizontal scroll on mobile */}
          <div className="bg-input-bg rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-gray-border">
                    {['Client Name', 'Industry', 'Generated', 'Meeting Date', 'Rating', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-4 text-[16px] md:text-[19px] font-bold text-[#000] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((b, i) => (
                    <tr key={b.id} className={`border-b border-gray-border last:border-0 ${i % 2 === 0 ? 'bg-[#FAFAFA]' : 'bg-white'} hover:bg-primary-light transition-colors`}>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-[14px] flex-shrink-0">
                            {b.client_name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[16px] md:text-[19px] font-bold text-[#000] whitespace-nowrap">{b.client_name}</p>
                            <p className="text-[13px] md:text-[15px] font-medium text-[#6B7288]">{b.client_type || 'Distributor'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="bg-primary-light text-[#1D6A62] text-[13px] md:text-[15px] font-medium px-3 py-1 rounded-lg whitespace-nowrap">{b.industry}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <p className="text-[13px] md:text-[15px] font-medium text-[#6B7288]">{new Date(b.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        <p className="text-[13px] md:text-[15px] text-[#6B7288]">{new Date(b.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <p className="text-[15px] md:text-[17px] font-bold text-[#000]">{b.meeting_date ? new Date(b.meeting_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</p>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {b.rating ? <span className="text-[12px] md:text-[13px] font-medium text-[#6B7288]">{b.rating}/5 {'⭐'.repeat(b.rating)}</span>
                          : <button onClick={() => navigate(`/briefs/${b.id}/rating`)} className="text-primary text-[13px] md:text-[15px] font-medium hover:underline">Rate now</button>}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2 md:gap-3 whitespace-nowrap">
                          <button onClick={() => navigate(`/briefs/${b.id}`)} className="text-primary text-[13px] md:text-[15px] font-medium hover:underline">View</button>
                          <button onClick={() => exportBriefPDF(b)} className="text-[#6B7288] text-[13px] md:text-[15px] font-medium hover:text-primary">PDF</button>
                          <button onClick={() => navigate(`/briefs/${b.id}/regenerate`)} className="text-[#6B7288] text-[13px] md:text-[15px] font-medium hover:text-primary hidden sm:inline">Regen</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center gap-2 mt-6 justify-between flex-wrap">
            <span className="text-[14px] md:text-[16px] text-gray-label">Rows per page: {PER_PAGE}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                className="w-10 h-10 md:w-12 md:h-12 bg-input-bg rounded-lg flex items-center justify-center text-[18px] md:text-[20px] disabled:opacity-40 hover:bg-gray-200">‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-lg text-[16px] md:text-[20px] font-semibold ${p === page ? 'bg-primary text-white' : 'bg-input-bg text-[#000] hover:bg-gray-200'}`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
                className="w-10 h-10 md:w-12 md:h-12 bg-input-bg rounded-lg flex items-center justify-center text-[18px] md:text-[20px] disabled:opacity-40 hover:bg-gray-200">›</button>
            </div>
          </div>
        </div>

        {/* Right sidebar — hidden on mobile/tablet */}
        <div className="hidden xl:flex flex-col w-[320px] bg-input-bg border-l border-gray-border overflow-y-auto p-6">
          <h3 className="text-[20px] md:text-[22px] font-bold text-[#000] mb-1">Filter by Account</h3>
          <input className="w-full bg-white rounded-xl px-4 py-3 text-[16px] md:text-[18px] outline-none border-2 border-transparent focus:border-primary mb-4"
            placeholder="Search Accounts..." />
          <p className="text-[18px] md:text-[20px] font-semibold text-[#6B7288] mb-3">Your Accounts</p>
          <div className="space-y-2 mb-6">
            {clients.slice(0, 4).map(c => (
              <div key={c} className="bg-white rounded-xl p-4 flex items-center gap-3 hover:shadow-sm cursor-pointer" onClick={() => setSearch(c)}>
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold flex-shrink-0">{c.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[17px] md:text-[20px] font-bold text-[#000] truncate">{c.split(' ').slice(0, 2).join(' ')}</p>
                  <p className="text-[13px] md:text-[14px] text-gray-label">{briefs.filter(b => b.client_name === c).length} briefs</p>
                </div>
                <span className="text-[20px] md:text-[24px] text-gray-label">›</span>
              </div>
            ))}
          </div>

          <div className="bg-[#000] rounded-xl p-5 mb-4">
            <p className="text-white text-[18px] md:text-[20px] font-bold mb-1">Insights</p>
            <p className="text-gray-400 text-[14px] md:text-[15px]">Most prepared for:</p>
            <p className="text-white font-medium mt-1">{briefs[0]?.client_name || '—'}</p>
            <p className="text-gray-400 text-[14px] md:text-[15px] mt-3">Best rated brief:</p>
            <p className="text-primary font-medium mt-1">Avg. rating {avgRating}/5</p>
          </div>

          <div>
            <p className="text-[18px] md:text-[20px] font-bold mb-3">Export Options</p>
            <button onClick={() => exportHistoryPDF(briefs)} className="w-full text-left text-[16px] md:text-[18px] font-bold text-[#000] py-3 border-b border-gray-border hover:text-primary">Export as PDF</button>
            <button className="w-full text-left text-[16px] md:text-[18px] font-bold text-[#000] py-3 hover:text-primary">Export as CSV</button>
          </div>
        </div>
      </div>
    </div>
  )
}
