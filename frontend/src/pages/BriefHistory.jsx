import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
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
        <div className="flex-1 overflow-y-auto bg-white p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-[36px] font-bold text-[#000]">Brief History</h1>
              <p className="text-[19px] font-medium text-[#6B7288]">All briefs generated across your accounts.</p>
            </div>
            <button onClick={() => exportHistoryPDF(briefs)} className="border-2 border-primary text-primary font-bold text-[18px] px-6 py-3 rounded-xl hover:bg-primary-light">
              Export All PDF
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Briefs', value: totalBriefs, sub: 'All time', color: 'text-[#000]' },
              { label: 'This Month', value: thisMonth, sub: 'May 2026', color: 'text-[#1D6A4A]' },
              { label: 'Avg. Rating', value: avgRating, sub: 'Est. total', color: 'text-[#000]' },
              { label: 'Time Saved', value: `${timeSaved} hrs`, sub: 'Est.', color: 'text-[#1D6A4A]' },
            ].map(s => (
              <div key={s.label} className="bg-input-bg rounded-xl p-5">
                <p className="text-[17px] font-medium text-[#6B7288] mb-1">{s.label}</p>
                <p className={`text-[32px] font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[15px] text-[#6B7288]">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1 max-w-[300px]">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input className="w-full bg-input-bg rounded-xl pl-10 pr-4 py-3 text-[18px] outline-none border-2 border-transparent focus:border-primary"
                placeholder="Search by client name" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
            </div>
            <select className="bg-input-bg rounded-xl px-4 py-3 text-[18px] outline-none border-2 border-transparent focus:border-primary">
              <option>All</option>
              <option>FMCG</option>
              <option>Food & Bev</option>
              <option>Personal Care</option>
            </select>
            <select className="bg-input-bg rounded-xl px-4 py-3 text-[18px] outline-none border-2 border-transparent focus:border-primary">
              <option>All Ratings</option>
              <option>5 ⭐</option>
              <option>4 ⭐</option>
              <option>3 ⭐</option>
            </select>
            {search && <button onClick={() => { setSearch(''); setPage(1) }} className="text-primary text-[18px] font-medium hover:underline">Clear filters</button>}
          </div>

          <p className="text-[18px] font-medium text-[#6B7288] mb-4">Showing {(page-1)*PER_PAGE+1}-{Math.min(page*PER_PAGE, filtered.length)} of {filtered.length} briefs</p>

          {/* Table */}
          <div className="bg-input-bg rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-border">
                  {['Client Name', 'Industry', 'Generated', 'Meeting Date', 'Rating', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-4 text-[19px] font-bold text-[#000]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((b, i) => (
                  <tr key={b.id} className={`border-b border-gray-border last:border-0 ${i % 2 === 0 ? 'bg-[#FAFAFA]' : 'bg-white'} hover:bg-primary-light transition-colors`}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-[16px]">
                          {b.client_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-[19px] font-bold text-[#000]">{b.client_name}</p>
                          <p className="text-[15px] font-medium text-[#6B7288]">{b.client_type || 'Distributor'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="bg-primary-light text-[#1D6A62] text-[15px] font-medium px-3 py-1 rounded-lg">{b.industry}</span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-[15px] font-medium text-[#6B7288]">{new Date(b.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      <p className="text-[15px] text-[#6B7288]">{new Date(b.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-[17px] font-bold text-[#000]">{b.meeting_date ? new Date(b.meeting_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</p>
                    </td>
                    <td className="px-4 py-4">
                      {b.rating ? <span className="text-[13px] font-medium text-[#6B7288]">{b.rating}/5 {'⭐'.repeat(b.rating)}</span>
                        : <button onClick={() => navigate(`/briefs/${b.id}/rating`)} className="text-primary text-[15px] font-medium hover:underline">Rate now</button>}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-3">
                        <button onClick={() => navigate(`/briefs/${b.id}`)} className="text-primary text-[15px] font-medium hover:underline">View</button>
                        <button onClick={() => exportBriefPDF(b)} className="text-[#6B7288] text-[15px] font-medium hover:text-primary">PDF</button>
                        <button onClick={() => navigate(`/briefs/${b.id}/regenerate`)} className="text-[#6B7288] text-[15px] font-medium hover:text-primary">Regenerate</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center gap-2 mt-6 justify-between">
            <span className="text-[16px] text-gray-label">Rows per page: {PER_PAGE}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                className="w-12 h-12 bg-input-bg rounded-lg flex items-center justify-center text-[20px] disabled:opacity-40 hover:bg-gray-200">‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-12 h-12 rounded-lg text-[20px] font-semibold ${p === page ? 'bg-primary text-white' : 'bg-input-bg text-[#000] hover:bg-gray-200'}`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
                className="w-12 h-12 bg-input-bg rounded-lg flex items-center justify-center text-[20px] disabled:opacity-40 hover:bg-gray-200">›</button>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-[358px] bg-input-bg border-l border-gray-border overflow-y-auto p-6">
          <h3 className="text-[22px] font-bold text-[#000] mb-1">Filter by Account</h3>
          <input className="w-full bg-white rounded-xl px-4 py-3 text-[18px] outline-none border-2 border-transparent focus:border-primary mb-4"
            placeholder="Search Accounts..." />
          <p className="text-[20px] font-semibold text-[#6B7288] mb-3">Your Accounts</p>
          <div className="space-y-2 mb-6">
            {clients.slice(0, 4).map(c => (
              <div key={c} className="bg-white rounded-xl p-4 flex items-center gap-3 hover:shadow-sm cursor-pointer" onClick={() => setSearch(c)}>
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold">{c.charAt(0)}</div>
                <div className="flex-1">
                  <p className="text-[20px] font-bold text-[#000]">{c.split(' ').slice(0, 2).join(' ')}</p>
                  <p className="text-[14px] text-gray-label">{briefs.filter(b => b.client_name === c).length} briefs</p>
                </div>
                <span className="text-[24px] text-gray-label">›</span>
              </div>
            ))}
          </div>

          <div className="bg-[#000] rounded-xl p-5 mb-4">
            <p className="text-white text-[20px] font-bold mb-1">Insights</p>
            <p className="text-gray-400 text-[15px]">Most prepared for:</p>
            <p className="text-white font-medium mt-1">{briefs[0]?.client_name || '—'}</p>
            <p className="text-gray-400 text-[15px] mt-3">Best rated brief:</p>
            <p className="text-primary font-medium mt-1">Avg. rating {avgRating}/5</p>
          </div>

          <div>
            <p className="text-[20px] font-bold mb-3">Export Options</p>
            <button onClick={() => exportHistoryPDF(briefs)} className="w-full text-left text-[18px] font-bold text-[#000] py-3 border-b border-gray-border hover:text-primary">Export as PDF</button>
            <button className="w-full text-left text-[18px] font-bold text-[#000] py-3 hover:text-primary">Export as CSV</button>
          </div>
        </div>
      </div>
    </div>
  )
}
