import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const PRIMARY = [29, 106, 74]
const PRIMARY_LIGHT = [212, 237, 225]

function addHeader(doc, clientName) {
  doc.setFillColor(...PRIMARY)
  doc.rect(0, 0, 210, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('SalesPrep', 14, 12)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('AI-Powered Sales Brief', 14, 22)
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`, 140, 22)
  doc.setTextColor(0, 0, 0)
}

export function exportBriefPDF(brief) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const { client_name, meeting_date, meeting_time, meeting_location, ai_content } = brief

  addHeader(doc, client_name)

  // Company title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(0, 0, 0)
  doc.text(client_name, 14, 44)

  // Meeting details
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(107, 114, 128)
  let metaY = 52
  if (meeting_date) { doc.text(`Meeting Date: ${meeting_date}  ${meeting_time || ''}`, 14, metaY); metaY += 6 }
  if (meeting_location) { doc.text(`Location: ${meeting_location}`, 14, metaY); metaY += 6 }

  let y = metaY + 6

  if (!ai_content) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    const lines = doc.splitTextToSize(brief.company_background || '', 182)
    doc.text(lines, 14, y)
    doc.save(`SalesPrep_${client_name.replace(/\s+/g, '_')}_Brief.pdf`)
    return
  }

  // Tagline & Overview
  if (ai_content.tagline) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(11)
    doc.setTextColor(29, 106, 74)
    doc.text(ai_content.tagline, 14, y)
    y += 7
  }
  if (ai_content.overview) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(50, 50, 50)
    const lines = doc.splitTextToSize(ai_content.overview, 182)
    doc.text(lines, 14, y)
    y += lines.length * 5 + 6
  }

  // Key Metrics
  if (ai_content.key_metrics) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(...PRIMARY)
    doc.text('Key Metrics', 14, y)
    y += 3
    const km = ai_content.key_metrics
    const metricRows = [
      ['Market Cap', km.market_cap || '—', 'Annual Revenue', km.revenue_annual || '—'],
      ['YoY Growth', km.yoy_growth || '—', 'Net Margin', km.net_profit_margin || '—'],
      ['Market Share', km.market_share || '—', 'Distribution', km.distribution_reach || '—'],
    ]
    autoTable(doc, {
      startY: y,
      body: metricRows,
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: 'bold', textColor: [80, 80, 80] }, 2: { fontStyle: 'bold', textColor: [80, 80, 80] } },
      headStyles: { fillColor: PRIMARY },
      alternateRowStyles: { fillColor: [248, 252, 250] },
      margin: { left: 14, right: 14 },
    })
    y = doc.lastAutoTable.finalY + 8
  }

  // Quarterly Performance
  if (ai_content.quarters?.length) {
    if (y > 240) { doc.addPage(); addHeader(doc, client_name); y = 36 }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(...PRIMARY)
    doc.text('Last 3 Quarters Performance', 14, y)
    y += 3
    autoTable(doc, {
      startY: y,
      head: [['Period', 'Revenue', 'Net Profit', 'YoY Growth', 'EBITDA Margin']],
      body: ai_content.quarters.map(q => [q.period, q.revenue, q.profit, q.growth_yoy, q.ebitda_margin]),
      headStyles: { fillColor: PRIMARY, fontSize: 9 },
      styles: { fontSize: 9, cellPadding: 3 },
      alternateRowStyles: { fillColor: [248, 252, 250] },
      margin: { left: 14, right: 14 },
    })
    y = doc.lastAutoTable.finalY + 8
  }

  // Competitor Analysis
  if (ai_content.competitors?.length) {
    if (y > 200) { doc.addPage(); addHeader(doc, client_name); y = 36 }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(...PRIMARY)
    doc.text('Competitor Analysis', 14, y)
    y += 3
    autoTable(doc, {
      startY: y,
      head: [['Competitor', 'Q3 Revenue', 'Market Share', 'YoY Growth', 'Threat']],
      body: ai_content.competitors.map(c => [c.name, c.revenue_q3, c.market_share, c.yoy_growth, (c.threat_level || '').toUpperCase()]),
      headStyles: { fillColor: PRIMARY, fontSize: 9 },
      styles: { fontSize: 9, cellPadding: 3 },
      alternateRowStyles: { fillColor: [248, 252, 250] },
      margin: { left: 14, right: 14 },
    })
    y = doc.lastAutoTable.finalY + 4

    if (ai_content.comparison_table?.length) {
      const firstComp = ai_content.competitors[0]?.name?.split(' ').slice(0, 2).join(' ') || 'Comp 1'
      const secondComp = ai_content.competitors[1]?.name?.split(' ').slice(0, 2).join(' ') || 'Comp 2'
      autoTable(doc, {
        startY: y,
        head: [['Metric', client_name.split(' ').slice(0, 2).join(' '), firstComp, secondComp]],
        body: ai_content.comparison_table.map(r => [r.metric, r.company, r.comp1, r.comp2]),
        headStyles: { fillColor: [60, 60, 60], fontSize: 9 },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: { 1: { textColor: PRIMARY, fontStyle: 'bold' } },
        margin: { left: 14, right: 14 },
      })
      y = doc.lastAutoTable.finalY + 8
    }
  }

  // Talking Points
  if (ai_content.talking_points?.length) {
    doc.addPage()
    addHeader(doc, client_name)
    y = 38
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(...PRIMARY)
    doc.text('Key Talking Points', 14, y)
    y += 8
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    ai_content.talking_points.forEach((tp, i) => {
      const lines = doc.splitTextToSize(`${i + 1}.  ${tp}`, 178)
      if (y + lines.length * 6 > 280) { doc.addPage(); addHeader(doc, client_name); y = 36 }
      doc.text(lines, 14, y)
      y += lines.length * 6 + 3
    })
    y += 4
  }

  // Recommendations
  if (ai_content.recommendations?.length) {
    if (y > 220) { doc.addPage(); addHeader(doc, client_name); y = 36 }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(...PRIMARY)
    doc.text('Strategic Recommendations', 14, y)
    y += 3
    autoTable(doc, {
      startY: y,
      head: [['Priority', 'Category', 'Recommendation']],
      body: ai_content.recommendations.map(r => [(r.priority || '').toUpperCase(), r.category, r.action]),
      headStyles: { fillColor: PRIMARY, fontSize: 9 },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 20, fontStyle: 'bold' },
        1: { cellWidth: 28 },
      },
      alternateRowStyles: { fillColor: [248, 252, 250] },
      margin: { left: 14, right: 14 },
    })
    y = doc.lastAutoTable.finalY + 8
  }

  // Sales Opportunity & Risk Factors
  if (ai_content.sales_opportunity || ai_content.risk_factors?.length) {
    if (y > 230) { doc.addPage(); addHeader(doc, client_name); y = 36 }
    if (ai_content.sales_opportunity) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(...PRIMARY)
      doc.text('Sales Opportunity', 14, y)
      y += 6
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      const lines = doc.splitTextToSize(ai_content.sales_opportunity, 182)
      doc.text(lines, 14, y)
      y += lines.length * 5 + 8
    }
    if (ai_content.risk_factors?.length) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(185, 28, 28)
      doc.text('Risk Factors', 14, y)
      y += 6
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      ai_content.risk_factors.forEach(r => {
        const lines = doc.splitTextToSize(`• ${r}`, 182)
        if (y + lines.length * 5 > 280) { doc.addPage(); addHeader(doc, client_name); y = 36 }
        doc.text(lines, 14, y)
        y += lines.length * 5 + 3
      })
    }
  }

  doc.save(`SalesPrep_${client_name.replace(/\s+/g, '_')}_Brief.pdf`)
}

export function exportHistoryPDF(briefs) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  addHeader(doc, 'All Briefs')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(0, 0, 0)
  doc.text('Brief History Report', 14, 42)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(107, 114, 128)
  doc.text(`Total briefs: ${briefs.length}`, 14, 50)

  autoTable(doc, {
    startY: 56,
    head: [['Client Name', 'Industry', 'Type', 'Meeting Date', 'Generated', 'Rating']],
    body: briefs.map(b => [
      b.client_name,
      b.industry,
      b.client_type || 'Distributor',
      b.meeting_date || '—',
      new Date(b.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      b.rating ? `${b.rating}/5` : 'Not rated',
    ]),
    headStyles: { fillColor: PRIMARY, fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 3 },
    alternateRowStyles: { fillColor: [248, 252, 250] },
    margin: { left: 14, right: 14 },
  })

  doc.save('SalesPrep_Brief_History.pdf')
}
