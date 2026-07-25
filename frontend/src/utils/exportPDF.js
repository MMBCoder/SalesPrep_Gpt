import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import html2canvas from 'html2canvas'

const PRIMARY      = [29, 106, 74]
const PRIMARY_RGB  = '#1D6A4A'

function addPageHeader(doc, clientName) {
  const pageW = doc.internal.pageSize.getWidth()
  doc.setFillColor(...PRIMARY)
  doc.rect(0, 0, pageW, 20, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('SalesPrep', 10, 9)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('AI-Powered Sales Brief', 10, 16)
  doc.text(
    new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    pageW - 10, 16, { align: 'right' }
  )
  doc.setTextColor(0, 0, 0)
}

function addPageFooter(doc, pageNum, totalPages) {
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  doc.setFontSize(7.5)
  doc.setTextColor(180, 180, 180)
  doc.text(
    `Page ${pageNum} of ${totalPages}  •  Confidential — SalesPrep`,
    pageW / 2, pageH - 4, { align: 'center' }
  )
  doc.setTextColor(0, 0, 0)
}

export async function exportBriefPDF(brief, element) {
  if (!element) return exportBriefPDFFallback(brief)

  const clientName = brief.client_name || 'Brief'

  // ── 1. Capture only the AIBriefContent element ──────────────────────────
  const canvas = await html2canvas(element, {
    scale:        2,
    useCORS:      true,
    logging:      false,
    backgroundColor: '#ffffff',
    scrollX:      0,
    scrollY:      0,
    windowWidth:  element.scrollWidth,
    windowHeight: element.scrollHeight,
  })

  // ── 2. Page geometry ──────────────────────────────────────────────────
  const doc      = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  const pageW    = doc.internal.pageSize.getWidth()   // 210 mm
  const pageH    = doc.internal.pageSize.getHeight()  // 297 mm
  const headerH  = 22   // header bar height
  const footerH  = 10   // footer bar height
  const marginX  = 8    // left/right margin
  const contentW = pageW - marginX * 2
  const contentH = pageH - headerH - footerH          // usable body height per page

  // Total scaled height of the captured element in mm
  const totalImgH  = (canvas.height / canvas.width) * contentW
  const totalPages = Math.ceil(totalImgH / contentH)

  // ── 3. Title page ─────────────────────────────────────────────────────
  addPageHeader(doc, clientName)

  // Company name
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(26)
  doc.setTextColor(0, 0, 0)
  doc.text(clientName, marginX, 38)

  // Industry / type pill
  doc.setFillColor(212, 237, 225)
  doc.setDrawColor(...PRIMARY)
  doc.roundedRect(marginX, 44, 60, 8, 2, 2, 'FD')
  doc.setFontSize(9)
  doc.setTextColor(...PRIMARY)
  doc.text(`${brief.industry || 'FMCG'}  •  ${brief.client_type || 'Distributor'}`, marginX + 3, 49.5)

  // Meeting details
  let my = 60
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(80, 80, 80)
  if (brief.meeting_date) {
    doc.text(`Meeting Date:  ${brief.meeting_date}  ${brief.meeting_time || ''}`, marginX, my)
    my += 7
  }
  if (brief.meeting_location) {
    doc.text(`Location:  ${brief.meeting_location}`, marginX, my)
    my += 7
  }
  doc.text(`Generated:  ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`, marginX, my)
  my += 7
  doc.text('Source:  Tavily Web Search + GPT-4o-mini', marginX, my)

  // Divider
  my += 8
  doc.setDrawColor(212, 237, 225)
  doc.setLineWidth(0.5)
  doc.line(marginX, my, pageW - marginX, my)

  // Overview text if available
  if (brief.ai_content?.overview) {
    my += 8
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9.5)
    doc.setTextColor(...PRIMARY)
    doc.text(brief.ai_content.tagline || '', marginX, my)
    my += 6
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(60, 60, 60)
    const lines = doc.splitTextToSize(brief.ai_content.overview, contentW)
    doc.text(lines, marginX, my)
  }

  addPageFooter(doc, 1, totalPages + 1)

  // ── 4. Content pages (sliced canvas) ─────────────────────────────────
  for (let page = 0; page < totalPages; page++) {
    doc.addPage()
    addPageHeader(doc, clientName)

    // Pixel slice for this page
    const sliceStartPx  = Math.round((page * contentH / totalImgH) * canvas.height)
    const sliceHeightPx = Math.min(
      Math.round((contentH / totalImgH) * canvas.height),
      canvas.height - sliceStartPx
    )

    // Skip a nearly-empty trailing page (< 3% of canvas height)
    if (sliceHeightPx < canvas.height * 0.03) {
      doc.deletePage(doc.internal.getNumberOfPages())
      break
    }

    // Draw this slice onto a temp canvas
    const sliceCanvas    = document.createElement('canvas')
    sliceCanvas.width    = canvas.width
    sliceCanvas.height   = sliceHeightPx
    const ctx            = sliceCanvas.getContext('2d')
    ctx.fillStyle        = '#ffffff'
    ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height)
    ctx.drawImage(canvas, 0, -sliceStartPx)

    const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.93)
    const sliceHmm  = (sliceHeightPx / canvas.width) * contentW

    doc.addImage(sliceData, 'JPEG', marginX, headerH + 2, contentW, sliceHmm)
    addPageFooter(doc, page + 2, totalPages + 1)
  }

  doc.save(`SalesPrep_${clientName.replace(/\s+/g, '_')}_Brief.pdf`)
}

// Minimal fallback when element ref is unavailable
function exportBriefPDFFallback(brief) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const { client_name, ai_content } = brief
  addPageHeader(doc, client_name)
  let y = 30
  doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(0, 0, 0)
  doc.text(client_name, 14, y); y += 10
  if (ai_content?.overview) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(50, 50, 50)
    const lines = doc.splitTextToSize(ai_content.overview, 182)
    doc.text(lines, 14, y)
  }
  doc.save(`SalesPrep_${client_name.replace(/\s+/g, '_')}_Brief.pdf`)
}

// History summary — table format is fine here
export function exportHistoryPDF(briefs) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  addPageHeader(doc, 'All Briefs')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(0, 0, 0)
  doc.text('Brief History Report', 14, 30)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(107, 114, 128)
  doc.text(`Total briefs: ${briefs.length}`, 14, 38)
  autoTable(doc, {
    startY: 44,
    head: [['Client Name', 'Industry', 'Type', 'Meeting Date', 'Generated', 'Rating']],
    body: briefs.map(b => [
      b.client_name, b.industry, b.client_type || 'Distributor',
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
