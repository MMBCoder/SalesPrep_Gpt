import React, { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, Cell
} from 'recharts'

const PRIMARY = '#1D6A4A'
const PRIMARY_LIGHT = '#D4EDE1'
const COLORS = ['#1D6A4A', '#2196A4', '#E05C2D', '#7C4DFF', '#F59E0B']

// ─── Helpers ───────────────────────────────────────────────────────────────

function SectionTitle({ children, icon }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-1 h-7 bg-primary rounded-full" />
      <h2 className="text-[19px] font-bold text-[#111]">{icon && <span className="mr-2">{icon}</span>}{children}</h2>
    </div>
  )
}

function PriorityBadge({ priority }) {
  const map = { high: 'bg-red-100 text-red-700 border-red-200', medium: 'bg-amber-100 text-amber-700 border-amber-200', low: 'bg-green-100 text-green-700 border-green-200' }
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${map[priority] || map.low}`}>{priority}</span>
}

function ImpactBadge({ impact }) {
  const map = { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-blue-100 text-blue-700' }
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${map[impact] || map.low}`}>{impact}</span>
}

function ThreatBadge({ level }) {
  const map = { high: 'bg-red-600 text-white', medium: 'bg-amber-500 text-white', low: 'bg-green-600 text-white' }
  return <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${map[level] || 'bg-gray-300 text-gray-700'}`}>{level} threat</span>
}

function SentimentDot({ sentiment }) {
  const map = { positive: 'bg-green-500', negative: 'bg-red-500', neutral: 'bg-gray-400' }
  return <span className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${map[sentiment] || 'bg-gray-400'}`} />
}

function TrendArrow({ trend }) {
  if (trend === 'growing' || trend === 'fast-growing') return <span className="text-green-600 text-[12px] font-bold">▲ {trend}</span>
  if (trend === 'declining') return <span className="text-red-600 text-[12px] font-bold">▼ {trend}</span>
  return <span className="text-gray-500 text-[12px]">→ {trend}</span>
}

function CategoryBadge({ category }) {
  const map = {
    Financial: 'bg-blue-100 text-blue-700',
    Strategy: 'bg-purple-100 text-purple-700',
    Product: 'bg-green-100 text-green-700',
    Regulatory: 'bg-red-100 text-red-700',
    Partnership: 'bg-teal-100 text-teal-700',
  }
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${map[category] || 'bg-gray-100 text-gray-600'}`}>{category}</span>
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-3 text-[12px]">
      <p className="font-bold text-[#000] mb-2">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          {p.name}: <strong>{p.value?.toLocaleString()}</strong>
        </p>
      ))}
    </div>
  )
}

// ─── Source link pill ──────────────────────────────────────────────────────

function SourceLink({ title, url, index }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-2 bg-white border border-gray-200 hover:border-primary hover:bg-primary-light rounded-lg px-3 py-2 transition-colors group"
      title={title}>
      <span className="w-5 h-5 rounded-full bg-input-bg text-[10px] font-bold text-gray-500 flex items-center justify-center flex-shrink-0">{index + 1}</span>
      <span className="text-[12px] text-[#333] group-hover:text-primary line-clamp-1 flex-1">{title}</span>
      <span className="text-gray-400 group-hover:text-primary text-[12px]">↗</span>
    </a>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function AIBriefContent({ data, sources }) {
  if (!data) return null
  const [activeQuarter, setActiveQuarter] = useState(2)

  const {
    company_name, industry, tagline, overview, key_metrics,
    segment_revenue = [], quarters = [], brand_portfolio = [],
    sales_channels = [], competitors = [], comparison_table = [],
    news_highlights = [], talking_points = [], recommendations = [],
    risk_table = [], risk_factors = [], sales_opportunity, meeting_agenda = [],
  } = data

  const quarterChartData = quarters.map(q => ({
    name: q.period, Revenue: q.revenue_value || 0, Profit: q.profit_value || 0,
  }))

  const compChartData = [
    { name: (company_name || '').split(' ').slice(0, 2).join(' '), Revenue: quarters[2]?.revenue_value || 0 },
    ...competitors.map(c => ({ name: (c.name || '').split(' ').slice(0, 2).join(' '), Revenue: c.revenue_value || 0 }))
  ]

  const currencySymbol = (() => {
    const s = key_metrics?.market_cap || key_metrics?.revenue_annual || ''
    if (typeof s === 'string' && s.startsWith('$')) return '$'
    if (typeof s === 'string' && s.startsWith('£')) return '£'
    if (typeof s === 'string' && s.startsWith('€')) return '€'
    return '₹'
  })()

  const allSources = [
    ...(sources?.financial || []).map(s => ({ ...s, category: 'Financial Data' })),
    ...(sources?.competitors || []).map(s => ({ ...s, category: 'Market & Competitors' })),
    ...(sources?.news || []).map(s => ({ ...s, category: 'News & Developments' })),
  ]

  const comp1Name = competitors[0]?.name?.split(' ').slice(0, 2).join(' ') || 'Comp 1'
  const comp2Name = competitors[1]?.name?.split(' ').slice(0, 2).join(' ') || 'Comp 2'
  const comp3Name = competitors[2]?.name?.split(' ').slice(0, 2).join(' ') || 'Comp 3'

  // Merge risk_table and legacy risk_factors
  const risks = risk_table.length > 0 ? risk_table
    : (risk_factors || []).map(r => ({ risk: r, impact: 'medium', category: 'Market', mitigation: '—' }))

  return (
    <div className="space-y-8 text-[#111]">

      {/* ── 1. OVERVIEW ─────────────────────────────────────────────── */}
      <div>
        <p className="text-[14px] text-primary font-semibold italic mb-2">{tagline}</p>
        <p className="text-[15px] leading-relaxed text-[#444] mb-6">{overview}</p>

        {/* KPI Strip */}
        <div className="grid grid-cols-4 gap-3 lg:grid-cols-6">
          {[
            { label: 'Market Cap', value: key_metrics?.market_cap, hi: true },
            { label: 'Annual Revenue', value: key_metrics?.revenue_annual },
            { label: 'Net Profit', value: key_metrics?.net_profit_annual },
            { label: 'EBITDA Margin', value: key_metrics?.ebitda_margin },
            { label: 'YoY Growth', value: key_metrics?.yoy_growth },
            { label: 'Net Margin', value: key_metrics?.net_profit_margin },
            { label: 'Market Share', value: key_metrics?.market_share },
            { label: 'Distribution', value: key_metrics?.distribution_reach },
            { label: 'Employees', value: key_metrics?.employee_count },
            { label: 'P/E Ratio', value: key_metrics?.pe_ratio },
            { label: 'Dividend Yield', value: key_metrics?.dividend_yield },
            { label: 'R&D Spend', value: key_metrics?.r_and_d_spend },
          ].filter(m => m.value).map((m, i) => (
            <div key={i} className={`rounded-xl px-4 py-3 flex flex-col gap-0.5 ${m.hi ? 'bg-primary text-white' : 'bg-input-bg'}`}>
              <span className={`text-[11px] font-medium ${m.hi ? 'text-white/70' : 'text-gray-label'}`}>{m.label}</span>
              <span className={`text-[14px] font-bold leading-tight ${m.hi ? 'text-white' : 'text-[#000]'}`}>{m.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 2. FINANCIAL PERFORMANCE ─────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <SectionTitle icon="📊">Quarterly Financial Performance</SectionTitle>

        {/* Quarter cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {quarters.map((q, i) => (
            <div key={q.period} onClick={() => setActiveQuarter(i)}
              className={`rounded-xl p-4 cursor-pointer transition-all border-2 ${activeQuarter === i ? 'border-primary bg-primary text-white' : 'border-transparent bg-input-bg hover:border-primary/40'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[12px] font-bold ${activeQuarter === i ? 'text-white/80' : 'text-gray-label'}`}>{q.period}</span>
                <span className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${activeQuarter === i ? 'bg-white/20 text-white' : 'bg-primary-light text-primary'}`}>{q.growth_yoy}</span>
              </div>
              <p className={`text-[22px] font-bold ${activeQuarter === i ? 'text-white' : 'text-[#000]'}`}>{q.revenue}</p>
              <p className={`text-[11px] ${activeQuarter === i ? 'text-white/70' : 'text-gray-label'}`}>Net Revenue</p>
              <p className={`text-[16px] font-semibold mt-2 ${activeQuarter === i ? 'text-white' : 'text-primary'}`}>{q.profit}</p>
              <p className={`text-[11px] ${activeQuarter === i ? 'text-white/70' : 'text-gray-label'}`}>Net Profit • EBITDA {q.ebitda_margin}</p>
            </div>
          ))}
        </div>

        {/* Quarter highlights */}
        {quarters[activeQuarter]?.highlights?.length > 0 && (
          <div className="bg-input-bg rounded-xl p-4 mb-6">
            <p className="text-[12px] font-bold text-gray-label uppercase tracking-wider mb-3">{quarters[activeQuarter].period} Highlights</p>
            <ul className="grid grid-cols-2 gap-2">
              {quarters[activeQuarter].highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] text-[#333]">
                  <span className="text-primary mt-0.5 flex-shrink-0 font-bold">•</span> {h}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Revenue & Profit Chart */}
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={quarterChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Revenue" fill={PRIMARY} radius={[4, 4, 0, 0]} maxBarSize={50} />
            <Bar dataKey="Profit" fill={PRIMARY_LIGHT} stroke={PRIMARY} strokeWidth={1} radius={[4, 4, 0, 0]} maxBarSize={50} />
          </BarChart>
        </ResponsiveContainer>

        {/* Quarterly comparison table */}
        {quarters.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-[#F8FAF9]">
                  <th className="text-left px-4 py-2 font-bold text-gray-label rounded-tl-lg">Metric</th>
                  {quarters.map(q => <th key={q.period} className="text-center px-4 py-2 font-bold text-gray-label">{q.period}</th>)}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Net Revenue', fn: q => q.revenue },
                  { label: 'Net Profit', fn: q => q.profit },
                  { label: 'YoY Growth', fn: q => q.growth_yoy },
                  { label: 'EBITDA Margin', fn: q => q.ebitda_margin },
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}>
                    <td className="px-4 py-2.5 font-semibold text-[#555]">{row.label}</td>
                    {quarters.map(q => <td key={q.period} className="px-4 py-2.5 text-center font-bold text-[#000]">{row.fn(q)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 3. SEGMENT & CHANNELS ────────────────────────────────────── */}
      {(segment_revenue.length > 0 || sales_channels.length > 0) && (
        <div className="grid grid-cols-2 gap-6">

          {/* Segment Revenue */}
          {segment_revenue.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <SectionTitle icon="🗂️">Revenue by Segment</SectionTitle>
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="bg-input-bg">
                    <th className="text-left px-3 py-2.5 font-bold text-gray-label rounded-tl-lg">Segment</th>
                    <th className="text-right px-3 py-2.5 font-bold text-gray-label">Revenue</th>
                    <th className="text-right px-3 py-2.5 font-bold text-gray-label">Share</th>
                    <th className="text-right px-3 py-2.5 font-bold text-gray-label rounded-tr-lg">Growth</th>
                  </tr>
                </thead>
                <tbody>
                  {segment_revenue.map((s, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="font-semibold text-[#000]">{s.segment}</span>
                        </div>
                        {/* Share bar */}
                        <div className="w-full bg-gray-100 rounded-full h-1 mt-1.5">
                          <div className="h-1 rounded-full" style={{ width: s.share, background: COLORS[i % COLORS.length] }} />
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-[#000]">{s.revenue}</td>
                      <td className="px-3 py-3 text-right font-semibold text-gray-label">{s.share}</td>
                      <td className="px-3 py-3 text-right">
                        <span className={`font-bold text-[12px] ${(s.growth_yoy || '').startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>{s.growth_yoy}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Sales Channels */}
          {sales_channels.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <SectionTitle icon="🛒">Sales Channel Mix</SectionTitle>
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="bg-input-bg">
                    <th className="text-left px-3 py-2.5 font-bold text-gray-label rounded-tl-lg">Channel</th>
                    <th className="text-right px-3 py-2.5 font-bold text-gray-label">Share</th>
                    <th className="text-right px-3 py-2.5 font-bold text-gray-label">Growth</th>
                    <th className="text-right px-3 py-2.5 font-bold text-gray-label rounded-tr-lg">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {sales_channels.map((ch, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}>
                      <td className="px-3 py-3">
                        <p className="font-semibold text-[#000]">{ch.channel}</p>
                        <p className="text-[11px] text-gray-label mt-0.5">{ch.outlets}</p>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1.5">
                          <div className="h-1.5 rounded-full bg-primary" style={{ width: ch.share }} />
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-[#000]">{ch.share}</td>
                      <td className="px-3 py-3 text-right font-bold text-green-600">{ch.growth}</td>
                      <td className="px-3 py-3 text-right"><TrendArrow trend={ch.trend} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── 4. BRAND PORTFOLIO ───────────────────────────────────────── */}
      {brand_portfolio.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <SectionTitle icon="🏷️">Brand Portfolio</SectionTitle>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {brand_portfolio.map((b, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-4 hover:border-primary hover:shadow-sm transition-all">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-[16px] mb-3" style={{ background: COLORS[i % COLORS.length] }}>
                  {(b.name || '').charAt(0)}
                </div>
                <p className="text-[15px] font-bold text-[#000] mb-0.5">{b.name}</p>
                <p className="text-[11px] text-gray-label mb-2">{b.category}</p>
                <p className="text-[12px] font-semibold text-primary mb-1">{b.market_rank}</p>
                <p className="text-[11px] text-gray-label">{b.revenue_contribution}</p>
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <span className={`text-[11px] font-bold ${(b.growth || '').startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>{b.growth} YoY</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 5. COMPETITOR ANALYSIS ───────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <SectionTitle icon="⚔️">Competitive Landscape</SectionTitle>

        {/* Competitor cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {competitors.map((c, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-[15px] font-bold text-[#000]">{c.name}</p>
                  <p className="text-[12px] text-gray-label">Market Share: {c.market_share}</p>
                </div>
                <ThreatBadge level={c.threat_level} />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3 text-[12px]">
                <div className="bg-input-bg rounded-lg p-2">
                  <p className="text-gray-label">Q3 Revenue</p>
                  <p className="font-bold text-[#000]">{c.revenue_q3}</p>
                </div>
                <div className="bg-input-bg rounded-lg p-2">
                  <p className="text-gray-label">YoY Growth</p>
                  <p className="font-bold text-green-600">{c.yoy_growth}</p>
                </div>
              </div>
              {c.recent_move && (
                <div className="bg-blue-50 rounded-lg p-2 mb-3">
                  <p className="text-[11px] font-semibold text-blue-700">Recent Move</p>
                  <p className="text-[11px] text-[#333]">{c.recent_move}</p>
                </div>
              )}
              <div className="space-y-1 text-[11px]">
                <p><span className="text-green-600 font-bold">✓ </span>{c.key_strength}</p>
                <p><span className="text-red-500 font-bold">✗ </span>{c.key_weakness}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Revenue Bar Chart */}
        {compChartData.length > 1 && (
          <div className="mb-6">
            <p className="text-[12px] font-bold text-gray-label uppercase tracking-wide mb-3">Revenue Comparison — Latest Quarter</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={compChartData} layout="vertical" margin={{ left: 10, right: 50, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `${currencySymbol}${(v / 1000).toFixed(0)}K`} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Revenue" radius={[0, 4, 4, 0]} maxBarSize={22}
                  label={{ position: 'right', fontSize: 11, formatter: v => `${currencySymbol}${v?.toLocaleString()}` }}>
                  {compChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Full Comparison Table */}
        {comparison_table.length > 0 && (
          <div className="overflow-x-auto">
            <p className="text-[12px] font-bold text-gray-label uppercase tracking-wide mb-3">Side-by-Side Metrics Comparison</p>
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-[#111] text-white">
                  <th className="text-left px-4 py-3 rounded-tl-lg font-semibold">Metric</th>
                  <th className="text-center px-4 py-3 text-primary-light font-bold">{(company_name || '').split(' ').slice(0, 2).join(' ')}</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-300">{comp1Name}</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-300">{comp2Name}</th>
                  {comparison_table[0]?.comp3 && <th className="text-center px-4 py-3 font-semibold text-gray-300 rounded-tr-lg">{comp3Name}</th>}
                </tr>
              </thead>
              <tbody>
                {comparison_table.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F8FAF9]'}>
                    <td className="px-4 py-3 font-semibold text-[#555]">{row.metric}</td>
                    <td className="px-4 py-3 text-center font-bold text-primary">{row.company}</td>
                    <td className="px-4 py-3 text-center text-gray-label">{row.comp1}</td>
                    <td className="px-4 py-3 text-center text-gray-label">{row.comp2}</td>
                    {row.comp3 && <td className="px-4 py-3 text-center text-gray-label">{row.comp3}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 6. MARKET NEWS ───────────────────────────────────────────── */}
      {news_highlights.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <SectionTitle icon="📰">Market Intelligence & News</SectionTitle>
          <div className="grid grid-cols-2 gap-4">
            {news_highlights.map((n, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-4 hover:border-primary/50 hover:shadow-sm transition-all">
                <div className="flex items-start gap-3 mb-2">
                  <SentimentDot sentiment={n.sentiment} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {n.category && <CategoryBadge category={n.category} />}
                      <span className="text-[11px] text-gray-label">{n.date}</span>
                    </div>
                    <p className="text-[14px] font-bold text-[#000] leading-tight">{n.title}</p>
                  </div>
                </div>
                <p className="text-[12px] text-[#555] leading-relaxed mb-2 ml-5">{n.summary}</p>
                <div className="flex items-center gap-2 ml-5">
                  <span className="text-[11px] text-gray-400">Source:</span>
                  {/* Try to find matching source URL */}
                  {(() => {
                    const match = (sources?.news || []).find(s =>
                      s.title?.toLowerCase().includes((n.source || '').toLowerCase()) ||
                      (n.source || '').toLowerCase().includes((s.title || '').toLowerCase().slice(0, 20))
                    )
                    return match ? (
                      <a href={match.url} target="_blank" rel="noopener noreferrer"
                        className="text-[11px] text-primary font-semibold hover:underline flex items-center gap-1">
                        {n.source} ↗
                      </a>
                    ) : (
                      <span className="text-[11px] text-gray-500 font-semibold">{n.source}</span>
                    )
                  })()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 7. SALES BATTLE CARD ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <SectionTitle icon="💬">Key Talking Points</SectionTitle>
          <ol className="space-y-3">
            {talking_points.map((tp, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-[11px] font-bold mt-0.5">{i + 1}</span>
                <p className="text-[13px] text-[#333] leading-relaxed">{tp}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-4">
          {sales_opportunity && (
            <div className="bg-primary border border-primary rounded-2xl p-6 text-white">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🎯</span>
                <p className="text-[16px] font-bold">Sales Opportunity</p>
              </div>
              <p className="text-[13px] text-white/90 leading-relaxed">{sales_opportunity}</p>
            </div>
          )}
          {meeting_agenda.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-[14px] font-bold text-[#000] mb-3 flex items-center gap-2">📋 Suggested Meeting Agenda</p>
              <ol className="space-y-2">
                {meeting_agenda.map((item, i) => (
                  <li key={i} className="flex gap-2 text-[12px] text-[#444]">
                    <span className="text-primary font-bold flex-shrink-0">{i + 1}.</span>
                    {item.replace(/^Agenda item \d+:\s*/i, '')}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>

      {/* ── 8. RISK ASSESSMENT ───────────────────────────────────────── */}
      {risks.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <SectionTitle icon="⚠️">Risk Assessment</SectionTitle>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-red-50">
                <th className="text-left px-4 py-3 font-bold text-red-800 rounded-tl-lg">Risk</th>
                <th className="text-center px-4 py-3 font-bold text-red-800">Impact</th>
                <th className="text-center px-4 py-3 font-bold text-red-800">Category</th>
                <th className="text-left px-4 py-3 font-bold text-red-800 rounded-tr-lg">Mitigation Strategy</th>
              </tr>
            </thead>
            <tbody>
              {risks.map((r, i) => (
                <tr key={i} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}`}>
                  <td className="px-4 py-3 text-[#333] font-medium">{r.risk}</td>
                  <td className="px-4 py-3 text-center"><ImpactBadge impact={r.impact} /></td>
                  <td className="px-4 py-3 text-center text-gray-label">{r.category}</td>
                  <td className="px-4 py-3 text-[#555]">{r.mitigation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── 9. STRATEGIC RECOMMENDATIONS ─────────────────────────────── */}
      {recommendations.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <SectionTitle icon="🚀">Strategic Action Plan</SectionTitle>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-[#F8FAF9]">
                <th className="text-left px-4 py-3 font-bold text-gray-label rounded-tl-lg w-20">Priority</th>
                <th className="text-left px-4 py-3 font-bold text-gray-label w-32">Category</th>
                <th className="text-left px-4 py-3 font-bold text-gray-label">Action</th>
                <th className="text-center px-4 py-3 font-bold text-gray-label rounded-tr-lg w-28">Timing</th>
              </tr>
            </thead>
            <tbody>
              {recommendations.map((r, i) => (
                <tr key={i} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}`}>
                  <td className="px-4 py-3"><PriorityBadge priority={r.priority} /></td>
                  <td className="px-4 py-3 font-semibold text-[#555]">{r.category}</td>
                  <td className="px-4 py-3 text-[#333]">{r.action}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[11px] font-semibold px-2 py-1 rounded-lg ${r.timing === 'This meeting' ? 'bg-primary text-white' : 'bg-input-bg text-gray-label'}`}>
                      {r.timing || 'TBD'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── 10. DATA SOURCES ─────────────────────────────────────────── */}
      {allSources.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <SectionTitle icon="🔗">Data Sources</SectionTitle>
          <p className="text-[12px] text-gray-label mb-5">This brief was compiled from {allSources.length} web sources via real-time search. Click any source to view the original article.</p>

          {['Financial Data', 'Market & Competitors', 'News & Developments'].map(cat => {
            const catSources = allSources.filter(s => s.category === cat)
            if (!catSources.length) return null
            return (
              <div key={cat} className="mb-6">
                <p className="text-[11px] font-bold text-gray-label uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                  {cat} ({catSources.length} sources)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {catSources.map((s, i) => <SourceLink key={i} title={s.title} url={s.url} index={i} />)}
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
