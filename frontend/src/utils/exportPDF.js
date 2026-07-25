import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import html2canvas from 'html2canvas'

const PRIMARY = [29, 106, 74]

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

// Screenshot the live rendered dashboard and slice into A4 pages
export async function exportBriefPDF(brief, element) {
  if (!element) {
    // Fallback: basic text PDF if no element ref provided
    return exportBriefPDFFallback(brief)
  }

  const clientName = brief.client_name || 'Brief'

  // Capture the full scrollable element at 2x for retina quality
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    scrollX: 0,
    scrollY: 0,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  })

  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  const pageW = doc.internal.pageSize.getWidth()   // 210 mm
  const pageH = doc.internal.pageSize.getHeight()  // 297 mm
  const headerH = 22   // mm — header bar
  const marginX = 10   // mm — left/right margin
  const contentW = pageW - marginX * 2             // 190 mm usable width
  const contentH = pageH - headerH - 6             // mm usable height per page

  // Total rendered height in mm (scaled to fit A4 width)
  const totalImgH = (canvas.height / canvas.width) * contentW
  const totalPages = Math.ceil(totalImgH / contentH)

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) doc.addPage()
    addPageHeader(doc, clientName)

    // Pixel rows for this page slice
    const sliceStartPx = Math.round((page * contentH / totalImgH) * canvas.height)
    const sliceHeightPx = Math.min(
      Math.round((contentH / totalImgH) * canvas.height),
      canvas.height - sliceStartPx
    )

    if (sliceHeightPx <= 0) break

    // Draw the slice onto a temporary canvas
    const sliceCanvas = document.createElement('canvas')
    sliceCanvas.width = canvas.width
    sliceCanvas.height = sliceHeightPx
    const ctx = sliceCanvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height)
    ctx.drawImage(canvas, 0, -sliceStartPx)

    const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.93)
    const sliceHmm = (sliceHeightPx / canvas.width) * contentW

    doc.addImage(sliceData, 'JPEG', marginX, headerH + 2, contentW, sliceHmm)
  }

  // Footer page number on each page
  const total = doc.internal.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(160, 160, 160)
    doc.text(`Page ${i} of ${total}  •  Confidential — SalesPrep`, pageW / 2, pageH - 4, { align: 'center' })
  }

  doc.save(`SalesPrep_${clientName.replace(/\s+/g, '_')}_Brief.pdf`)
}

// Plain text fallback when no element ref
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
    doc.text(lines, 14, y); y += lines.length * 5 + 6
  }
  doc.save(`SalesPrep_${client_name.replace(/\s+/g, '_')}_Brief.pdf`)
}

// History summary PDF (table format is fine here)
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
