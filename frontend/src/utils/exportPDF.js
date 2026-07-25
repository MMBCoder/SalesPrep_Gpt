import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ── Colours ──────────────────────────────────────────────────────────────────
const C = {
  primary:      [29, 106, 74],
  primaryLight: [212, 237, 225],
  dark:         [17,  17,  17],
  gray:         [100, 110, 120],
  lightBg:      [248, 250, 249],
  white:        [255, 255, 255],
  red:          [185,  28,  28],
  amber:        [180, 120,  10],
  blue:         [ 29,  78, 216],
}

const W   = 210   // A4 width mm
const H   = 297   // A4 height mm
const ML  = 14    // left margin
const MR  = 14    // right margin
const CW  = W - ML - MR   // 182 mm content width
const HDR = 22    // header height
const FTR = 10    // footer height
const BOT = H - FTR - 4   // y where page content must stop

// ── Shared helpers ────────────────────────────────────────────────────────────

function hdr(doc, name) {
  doc.setFillColor(...C.primary)
  doc.rect(0, 0, W, HDR, 'F')
  doc.setTextColor(...C.white)
  doc.setFont('helvetica', 'bold');  doc.setFontSize(11)
  doc.text('SalesPrep', ML, 9)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
  doc.text('AI-Powered Sales Brief', ML, 16)
  doc.text(new Date().toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }), W - MR, 16, { align:'right' })
  doc.setTextColor(...C.dark)
}

function ftr(doc, n, total) {
  doc.setFontSize(7.5)
  doc.setTextColor(180, 180, 180)
  doc.text(`Page ${n} of ${total}  •  Confidential — SalesPrep`, W / 2, H - 4, { align:'center' })
  doc.setTextColor(...C.dark)
}

function secTitle(doc, icon, text, y) {
  doc.setFillColor(...C.primary)
  doc.rect(ML, y, 2, 7, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(...C.dark)
  doc.text(`${icon}  ${text}`, ML + 5, y + 5.5)
  return y + 13
}

function sectionBox(doc, y, h) {
  doc.setDrawColor(220, 228, 224)
  doc.setFillColor(...C.white)
  doc.roundedRect(ML - 2, y - 4, CW + 4, h, 3, 3, 'FD')
}

function chip(doc, text, x, y, color) {
  const col = color || C.primary
  doc.setFillColor(col[0], col[1], col[2], 0.15)
  doc.setFillColor(...C.primaryLight)
  doc.roundedRect(x, y - 4, doc.getStringUnitWidth(text) * 3.2 + 6, 7, 2, 2, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...C.primary)
  doc.text(text, x + 3, y + 0.5)
  doc.setTextColor(...C.dark)
}

function kpiCard(doc, label, value, x, y, w, h, highlight) {
  if (highlight) {
    doc.setFillColor(...C.primary)
    doc.roundedRect(x, y, w, h, 3, 3, 'F')
    doc.setTextColor(...C.white)
  } else {
    doc.setFillColor(...C.lightBg)
    doc.roundedRect(x, y, w, h, 3, 3, 'F')
    doc.setTextColor(...C.gray)
  }
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
  doc.text(label, x + 3, y + 5)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5)
  doc.setTextColor(highlight ? 255 : C.dark[0], highlight ? 255 : C.dark[1], highlight ? 255 : C.dark[2])
  const lines = doc.splitTextToSize(value || 'N/A', w - 6)
  doc.text(lines[0], x + 3, y + 11)
  doc.setTextColor(...C.dark)
}

function needsPage(doc, y, needed) {
  return y + needed > BOT
}

// ── Page builders ─────────────────────────────────────────────────────────────

function buildCover(doc, brief, ai) {
  hdr(doc, brief.client_name)

  let y = HDR + 10

  // Company name
  doc.setFont('helvetica', 'bold'); doc.setFontSize(28); doc.setTextColor(...C.dark)
  doc.text(brief.client_name || '', ML, y); y += 12

  // Industry pill
  chip(doc, `${ai?.industry || brief.industry || 'FMCG'}  •  ${brief.client_type || 'Distributor'}`, ML, y); y += 10

  // Meta line
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...C.gray)
  const genDate = new Date().toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })
  doc.text(`Generated: ${genDate}     Source: Tavily Web Search + GPT-4o-mini`, ML, y); y += 5
  if (brief.meeting_date)     { doc.text(`Meeting Date: ${brief.meeting_date}  ${brief.meeting_time || ''}`, ML, y); y += 5 }
  if (brief.meeting_location) { doc.text(`Location: ${brief.meeting_location}`, ML, y); y += 5 }
  y += 3

  // Divider
  doc.setDrawColor(...C.primaryLight); doc.setLineWidth(0.5)
  doc.line(ML, y, W - MR, y); y += 6

  // Tagline
  if (ai?.tagline) {
    doc.setFont('helvetica', 'italic'); doc.setFontSize(11); doc.setTextColor(...C.primary)
    const tLines = doc.splitTextToSize(ai.tagline, CW)
    doc.text(tLines, ML, y); y += tLines.length * 6 + 4
  }

  // Overview
  if (ai?.overview) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(55, 55, 55)
    const oLines = doc.splitTextToSize(ai.overview, CW)
    doc.text(oLines, ML, y)
  }
}

function buildMetrics(doc, brief, ai, startPage, totalPages) {
  const km = ai.key_metrics || {}
  const kpis = [
    { label:'Market Cap',     value: km.market_cap,          hi: true },
    { label:'Annual Revenue', value: km.revenue_annual },
    { label:'Net Profit',     value: km.net_profit_annual },
    { label:'EBITDA Margin',  value: km.ebitda_margin },
    { label:'YoY Growth',     value: km.yoy_growth },
    { label:'Net Margin',     value: km.net_profit_margin },
    { label:'Market Share',   value: km.market_share },
    { label:'Distribution',   value: km.distribution_reach },
    { label:'Employees',      value: km.employee_count },
    { label:'P/E Ratio',      value: km.pe_ratio },
    { label:'Dividend Yield', value: km.dividend_yield },
    { label:'R&D Spend',      value: km.r_and_d_spend },
  ].filter(k => k.value && k.value !== 'N/A')

  let y = HDR + 6
  y = secTitle(doc, '📊', 'Key Performance Metrics', y)

  // KPI grid — 4 per row
  const cols = 4
  const cardW = CW / cols - 2
  const cardH = 18
  const gap = 2.5

  kpis.forEach((k, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    kpiCard(doc, k.label, k.value, ML + col * (cardW + gap), y + row * (cardH + gap), cardW, cardH, k.hi)
  })

  const rows = Math.ceil(kpis.length / cols)
  y += rows * (cardH + gap) + 8

  // Quarterly performance
  if (ai.quarters?.length) {
    y = secTitle(doc, '📈', 'Quarterly Financial Performance', y)
    autoTable(doc, {
      startY: y,
      head: [['Period', 'Revenue', 'Net Profit', 'YoY Growth', 'EBITDA Margin', 'Highlights']],
      body: ai.quarters.map(q => [
        q.period, q.revenue, q.profit, q.growth_yoy, q.ebitda_margin || 'N/A',
        (q.highlights || []).slice(0, 2).join(' • '),
      ]),
      headStyles:          { fillColor: C.primary, fontSize: 8.5, fontStyle:'bold', textColor: 255 },
      styles:              { fontSize: 8.5, cellPadding: 3.5 },
      columnStyles:        { 0:{fontStyle:'bold'}, 5:{fontSize:7.5, textColor: C.gray} },
      alternateRowStyles:  { fillColor: C.lightBg },
      margin:              { left: ML, right: MR },
    })
    y = doc.lastAutoTable.finalY + 8
  }

  return y
}

function buildSegmentsChannels(doc, ai, y) {
  const hasSegments = ai.segment_revenue?.length > 0
  const hasChannels = ai.sales_channels?.length > 0

  if (hasSegments) {
    y = secTitle(doc, '🗂️', 'Revenue by Segment', y)
    autoTable(doc, {
      startY: y,
      head: [['Segment', 'Revenue', 'Share', 'YoY Growth', 'Trend']],
      body: (ai.segment_revenue || []).map(s => [s.segment, s.revenue, s.share, s.growth_yoy, s.trend]),
      headStyles:         { fillColor: C.primary, fontSize: 8.5, textColor: 255 },
      styles:             { fontSize: 8.5, cellPadding: 3.5 },
      columnStyles:       { 0:{fontStyle:'bold'} },
      alternateRowStyles: { fillColor: C.lightBg },
      margin:             { left: ML, right: MR },
    })
    y = doc.lastAutoTable.finalY + 8
  }

  if (hasChannels) {
    y = secTitle(doc, '🛒', 'Sales Channel Mix', y)
    autoTable(doc, {
      startY: y,
      head: [['Channel', 'Share', 'Growth', 'Trend', 'Reach']],
      body: (ai.sales_channels || []).map(c => [c.channel, c.share, c.growth, c.trend, c.outlets]),
      headStyles:         { fillColor: C.primary, fontSize: 8.5, textColor: 255 },
      styles:             { fontSize: 8.5, cellPadding: 3.5 },
      columnStyles:       { 0:{fontStyle:'bold'} },
      alternateRowStyles: { fillColor: C.lightBg },
      margin:             { left: ML, right: MR },
    })
    y = doc.lastAutoTable.finalY + 8
  }

  return y
}

function buildBrands(doc, ai, y) {
  if (!ai.brand_portfolio?.length) return y
  y = secTitle(doc, '🏷️', 'Brand Portfolio', y)
  autoTable(doc, {
    startY: y,
    head: [['Brand', 'Category', 'Market Rank', 'Revenue Contribution', 'YoY Growth']],
    body: (ai.brand_portfolio || []).map(b => [b.name, b.category, b.market_rank, b.revenue_contribution, b.growth]),
    headStyles:         { fillColor: C.primary, fontSize: 8.5, textColor: 255 },
    styles:             { fontSize: 8.5, cellPadding: 3.5 },
    columnStyles:       { 0:{fontStyle:'bold', textColor: C.primary} },
    alternateRowStyles: { fillColor: C.lightBg },
    margin:             { left: ML, right: MR },
  })
  return doc.lastAutoTable.finalY + 8
}

function buildCompetitors(doc, brief, ai, y) {
  if (!ai.competitors?.length) return y
  y = secTitle(doc, '⚔️', 'Competitive Landscape', y)

  // Competitor summary table
  autoTable(doc, {
    startY: y,
    head: [['Competitor', 'Q3 Revenue', 'Market Share', 'YoY Growth', 'Threat', 'Recent Move']],
    body: (ai.competitors || []).map(c => [
      c.name, c.revenue_q3 || 'N/A', c.market_share || 'N/A',
      c.yoy_growth || 'N/A', (c.threat_level || '').toUpperCase(), c.recent_move || '—',
    ]),
    headStyles:         { fillColor: C.primary, fontSize: 8.5, textColor: 255 },
    styles:             { fontSize: 8, cellPadding: 3.5 },
    columnStyles:       { 0:{fontStyle:'bold'}, 5:{fontSize:7.5, textColor:C.gray} },
    alternateRowStyles: { fillColor: C.lightBg },
    margin:             { left: ML, right: MR },
  })
  y = doc.lastAutoTable.finalY + 6

  // Strengths & weaknesses
  autoTable(doc, {
    startY: y,
    head: [['Competitor', '✓  Strength', '✗  Weakness']],
    body: (ai.competitors || []).map(c => [c.name, c.key_strength || '—', c.key_weakness || '—']),
    headStyles:         { fillColor: [50, 50, 50], fontSize: 8.5, textColor: 255 },
    styles:             { fontSize: 8, cellPadding: 3.5 },
    columnStyles:       { 0:{fontStyle:'bold', cellWidth:40} },
    alternateRowStyles: { fillColor: C.lightBg },
    margin:             { left: ML, right: MR },
  })
  y = doc.lastAutoTable.finalY + 6

  // Side-by-side comparison
  if (ai.comparison_table?.length) {
    const c0 = (brief.client_name || '').split(' ').slice(0, 2).join(' ')
    const c1 = ai.competitors[0]?.name?.split(' ').slice(0, 2).join(' ') || 'Comp 1'
    const c2 = ai.competitors[1]?.name?.split(' ').slice(0, 2).join(' ') || 'Comp 2'
    const c3 = ai.competitors[2]?.name?.split(' ').slice(0, 2).join(' ') || 'Comp 3'
    autoTable(doc, {
      startY: y,
      head: [['Metric', c0, c1, c2, c3]],
      body: (ai.comparison_table || []).map(r => [r.metric, r.company, r.comp1, r.comp2, r.comp3 || '—']),
      headStyles:        { fillColor: [30, 30, 30], fontSize: 8.5, textColor: 255 },
      styles:            { fontSize: 8.5, cellPadding: 3.5 },
      columnStyles:      { 1:{ textColor: C.primary, fontStyle:'bold' } },
      alternateRowStyles:{ fillColor: C.lightBg },
      margin:            { left: ML, right: MR },
    })
    y = doc.lastAutoTable.finalY + 8
  }

  return y
}

function buildNews(doc, ai, y) {
  if (!ai.news_highlights?.length) return y
  y = secTitle(doc, '📰', 'Market Intelligence & News', y)
  autoTable(doc, {
    startY: y,
    head: [['Category', 'Date', 'Headline', 'Summary', 'Source']],
    body: (ai.news_highlights || []).map(n => [
      n.category || '—', n.date || '—', n.title, n.summary, n.source || '—',
    ]),
    headStyles:         { fillColor: C.primary, fontSize: 8.5, textColor: 255 },
    styles:             { fontSize: 8, cellPadding: 3.5 },
    columnStyles: {
      0: { cellWidth: 18, fontStyle:'bold', fontSize:7.5 },
      1: { cellWidth: 18, fontSize:7.5, textColor: C.gray },
      2: { cellWidth: 40, fontStyle:'bold' },
      4: { cellWidth: 22, fontSize:7.5, textColor: C.primary },
    },
    alternateRowStyles: { fillColor: C.lightBg },
    margin:             { left: ML, right: MR },
  })
  return doc.lastAutoTable.finalY + 8
}

function buildBattleCard(doc, ai, y) {
  // Talking points
  if (ai.talking_points?.length) {
    y = secTitle(doc, '💬', 'Key Talking Points', y)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...C.dark)
    ;(ai.talking_points || []).forEach((tp, i) => {
      // bullet circle
      doc.setFillColor(...C.primary)
      doc.circle(ML + 2, y + 2.5, 2.5, 'F')
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.white); doc.setFontSize(7)
      doc.text(`${i+1}`, ML + 2, y + 3.2, { align:'center' })
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.dark); doc.setFontSize(9)
      const lines = doc.splitTextToSize(tp, CW - 12)
      doc.text(lines, ML + 8, y + 3)
      y += lines.length * 5 + 3
      if (y > BOT - 10) { doc.addPage(); hdr(doc, ''); y = HDR + 8 }
    })
    y += 4
  }

  // Sales opportunity
  if (ai.sales_opportunity) {
    if (y > BOT - 30) { doc.addPage(); hdr(doc, ''); y = HDR + 8 }
    y = secTitle(doc, '🎯', 'Sales Opportunity', y)
    doc.setFillColor(...C.primary)
    doc.roundedRect(ML, y, CW, 2, 1, 1, 'F')
    y += 5
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(50, 50, 50)
    const soLines = doc.splitTextToSize(ai.sales_opportunity, CW)
    doc.text(soLines, ML, y); y += soLines.length * 5 + 8
  }

  // Meeting agenda
  if (ai.meeting_agenda?.length) {
    if (y > BOT - 40) { doc.addPage(); hdr(doc, ''); y = HDR + 8 }
    y = secTitle(doc, '📋', 'Suggested Meeting Agenda', y)
    ;(ai.meeting_agenda || []).forEach((item, i) => {
      doc.setFillColor(...C.primaryLight)
      doc.roundedRect(ML, y - 2, CW, 8, 2, 2, 'F')
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...C.primary)
      doc.text(`${i+1}.`, ML + 2, y + 3.5)
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.dark)
      const lines = doc.splitTextToSize(item, CW - 12)
      doc.text(lines[0], ML + 8, y + 3.5)
      y += 11
    })
    y += 4
  }

  return y
}

function buildRisk(doc, ai, y) {
  if (!ai.risk_table?.length) return y
  y = secTitle(doc, '⚠️', 'Risk Assessment', y)
  autoTable(doc, {
    startY: y,
    head: [['Risk Factor', 'Impact', 'Category', 'Mitigation Strategy']],
    body: (ai.risk_table || []).map(r => [r.risk, (r.impact||'').toUpperCase(), r.category, r.mitigation]),
    headStyles:        { fillColor: [185, 28, 28], fontSize: 8.5, textColor: 255 },
    styles:            { fontSize: 8.5, cellPadding: 3.5 },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 18, fontStyle:'bold', halign:'center' },
      2: { cellWidth: 28 },
    },
    alternateRowStyles:{ fillColor:[255,250,250] },
    margin:            { left: ML, right: MR },
  })
  return doc.lastAutoTable.finalY + 8
}

function buildActionPlan(doc, ai, y) {
  if (!ai.recommendations?.length) return y
  y = secTitle(doc, '🚀', 'Strategic Action Plan', y)
  autoTable(doc, {
    startY: y,
    head: [['Priority', 'Category', 'Recommended Action', 'Timing']],
    body: (ai.recommendations || []).map(r => [
      (r.priority||'').toUpperCase(), r.category, r.action, r.timing || '—',
    ]),
    headStyles:        { fillColor: C.primary, fontSize: 8.5, textColor: 255 },
    styles:            { fontSize: 8.5, cellPadding: 3.5 },
    columnStyles: {
      0: { cellWidth: 20, fontStyle:'bold', halign:'center' },
      1: { cellWidth: 32 },
      3: { cellWidth: 24, halign:'center' },
    },
    alternateRowStyles:{ fillColor: C.lightBg },
    margin:            { left: ML, right: MR },
  })
  return doc.lastAutoTable.finalY + 8
}

function buildSources(doc, sources, y) {
  if (!sources) return y
  y = secTitle(doc, '🔗', 'Data Sources', y)
  const all = [
    ...((sources.financial||[]).map(s => ({ ...s, cat:'Financial Data' }))),
    ...((sources.competitors||[]).map(s => ({ ...s, cat:'Market & Competitors' }))),
    ...((sources.news||[]).map(s => ({ ...s, cat:'News & Developments' }))),
  ]
  if (!all.length) return y
  autoTable(doc, {
    startY: y,
    head: [['#', 'Category', 'Source Title', 'Published']],
    body: all.map((s, i) => [i+1, s.cat, s.title, s.published_date || '—']),
    headStyles:        { fillColor: [60, 60, 60], fontSize: 8, textColor: 255 },
    styles:            { fontSize: 7.5, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 8, halign:'center' },
      1: { cellWidth: 38, fontStyle:'bold' },
      3: { cellWidth: 22, textColor: C.gray },
    },
    alternateRowStyles:{ fillColor: C.lightBg },
    margin:            { left: ML, right: MR },
  })
  return doc.lastAutoTable.finalY + 8
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function exportBriefPDF(brief) {
  const ai = brief.ai_content
  const doc = new jsPDF({ unit:'mm', format:'a4', compress:true })

  // ── Page 1: Cover ──
  buildCover(doc, brief, ai)

  if (!ai) {
    const total = doc.internal.getNumberOfPages()
    for (let i = 1; i <= total; i++) { doc.setPage(i); ftr(doc, i, total) }
    doc.save(`SalesPrep_${(brief.client_name||'Brief').replace(/\s+/g,'_')}_Brief.pdf`)
    return
  }

  // ── Page 2: KPIs + Quarters ──
  doc.addPage(); hdr(doc, brief.client_name)
  buildMetrics(doc, brief, ai, 2, 0)

  // ── Page 3: Segments + Channels + Brands ──
  doc.addPage(); hdr(doc, brief.client_name)
  let y = HDR + 6
  y = buildSegmentsChannels(doc, ai, y)
  if (y > BOT - 40) { doc.addPage(); hdr(doc, brief.client_name); y = HDR + 6 }
  y = buildBrands(doc, ai, y)

  // ── Page 4+: Competitors ──
  doc.addPage(); hdr(doc, brief.client_name)
  y = HDR + 6
  y = buildCompetitors(doc, brief, ai, y)

  // ── Next: News ──
  if (ai.news_highlights?.length) {
    if (y > BOT - 50) { doc.addPage(); hdr(doc, brief.client_name); y = HDR + 6 }
    y = buildNews(doc, ai, y)
  }

  // ── Next: Battle Card ──
  doc.addPage(); hdr(doc, brief.client_name)
  y = HDR + 6
  y = buildBattleCard(doc, ai, y)

  // ── Next: Risk + Action Plan ──
  if (y > BOT - 60) { doc.addPage(); hdr(doc, brief.client_name); y = HDR + 6 }
  y = buildRisk(doc, ai, y)
  if (y > BOT - 60) { doc.addPage(); hdr(doc, brief.client_name); y = HDR + 6 }
  y = buildActionPlan(doc, ai, y)

  // ── Last: Sources ──
  if (y > BOT - 40) { doc.addPage(); hdr(doc, brief.client_name); y = HDR + 6 }
  buildSources(doc, brief.sources, y)

  // ── Footers on all pages ──
  const total = doc.internal.getNumberOfPages()
  for (let i = 1; i <= total; i++) { doc.setPage(i); ftr(doc, i, total) }

  doc.save(`SalesPrep_${(brief.client_name||'Brief').replace(/\s+/g,'_')}_Brief.pdf`)
}

// History summary PDF
export function exportHistoryPDF(briefs) {
  const doc = new jsPDF({ unit:'mm', format:'a4', compress:true })
  hdr(doc, 'All Briefs')
  doc.setFont('helvetica','bold'); doc.setFontSize(18); doc.setTextColor(...C.dark)
  doc.text('Brief History Report', ML, HDR + 12)
  doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...C.gray)
  doc.text(`Total: ${briefs.length} briefs`, ML, HDR + 20)
  autoTable(doc, {
    startY: HDR + 26,
    head: [['Client Name', 'Industry', 'Type', 'Meeting Date', 'Generated', 'Rating']],
    body: briefs.map(b => [
      b.client_name, b.industry, b.client_type || 'Distributor',
      b.meeting_date || '—',
      new Date(b.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }),
      b.rating ? `${b.rating}/5` : 'Not rated',
    ]),
    headStyles:        { fillColor: C.primary, fontSize: 9, textColor: 255 },
    styles:            { fontSize: 9, cellPadding: 3.5 },
    alternateRowStyles:{ fillColor: C.lightBg },
    margin:            { left: ML, right: MR },
  })
  ftr(doc, 1, 1)
  doc.save('SalesPrep_Brief_History.pdf')
}
