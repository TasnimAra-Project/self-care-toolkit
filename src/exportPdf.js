import { jsPDF } from 'jspdf'
import { DIMENSIONS, EMERGENCY_TOOLS, PLANNER_ORDER, dimById } from './data'

function blank(value) {
  const text = String(value ?? '').trim()
  return text || '-'
}

function buildPdf(plan) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const m = 48
  const maxW = pageW - m * 2
  let y = m

  const navy = [37, 53, 64]
  const magenta = [162, 0, 90]
  const muted = [93, 105, 113]
  const lavender = [220, 167, 255]
  const cyan = [167, 217, 255]
  const peach = [245, 176, 105]
  const teal = [63, 163, 186]

  function addFooter() {
    const pages = doc.getNumberOfPages()
    for (let i = 1; i <= pages; i += 1) {
      doc.setPage(i)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...muted)
      doc.text(
        'Self-Care Toolkit  ·  Advancing a Healthier Wisconsin  ·  Saved copy for personal use',
        m,
        pageH - 28,
      )
      doc.text(`Page ${i} of ${pages}`, pageW - m, pageH - 28, { align: 'right' })
    }
  }

  function newPage() {
    doc.addPage()
    y = m
  }

  function need(height) {
    if (y + height > pageH - 52) newPage()
  }

  function band(title, fill) {
    need(32)
    doc.setFillColor(...fill)
    doc.rect(m, y, maxW, 24, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...navy)
    doc.text(title, m + 10, y + 16)
    y += 34
  }

  function para(text, { size = 10, bold = false, color = navy, gap = 8 } = {}) {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(size)
    doc.setTextColor(...color)
    const lines = doc.splitTextToSize(text, maxW)
    need(lines.length * (size + 3) + gap)
    doc.text(lines, m, y)
    y += lines.length * (size + 3) + gap
  }

  function labeledBlock(label, value, { compact = false } = {}) {
    const lines = doc.splitTextToSize(blank(value), maxW - 16)
    const lineH = compact ? 11 : 13
    const minBody = compact ? 28 : 36
    const h = 22 + Math.max(minBody, lines.length * lineH) + 8
    need(h)
    doc.setDrawColor(...teal)
    doc.setLineWidth(1)
    doc.rect(m, y, maxW, h)
    doc.setFillColor(243, 226, 255)
    doc.rect(m, y, maxW, 20, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(compact ? 9 : 10)
    doc.setTextColor(...navy)
    doc.text(label, m + 8, y + 14)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(compact ? 9 : 10)
    doc.text(lines, m + 8, y + 34)
    y += h + (compact ? 4 : 8)
  }

  function titleBlock(subtitle) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.setTextColor(...magenta)
    doc.text('Self-Care Toolkit', m, y)
    y += 26
    para(subtitle, { size: 13, bold: true, gap: 6 })
    para(
      `Saved on ${new Date().toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}`,
      { size: 10, color: muted, gap: 14 },
    )
  }

  function renderDailySection({ compact = false, withTitle = true, onePage = false } = {}) {
    if (withTitle) band('My Daily Self-Care Plan', lavender)
    para('Favorite practices for each category:', { size: 9, color: muted, gap: 10 })

    if (onePage) {
      const colW = (maxW - 12) / 2
      const cellH = 92
      const startY = y
      PLANNER_ORDER.forEach((id, index) => {
        const col = index % 2
        const row = Math.floor(index / 2)
        const x = m + col * (colW + 12)
        const cellY = startY + row * (cellH + 10)
        const d = dimById(id)
        const lines = doc.splitTextToSize(blank(plan.daily?.[id]), colW - 16)
        doc.setDrawColor(...teal)
        doc.setLineWidth(1)
        doc.rect(x, cellY, colW, cellH)
        doc.setFillColor(243, 226, 255)
        doc.rect(x, cellY, colW, 18, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.setTextColor(...navy)
        doc.text(d.name, x + 8, cellY + 12)
        doc.setFont('helvetica', 'normal')
        doc.text(lines.slice(0, 4), x + 8, cellY + 32)
      })
      y = startY + 4 * (cellH + 10) + 8
      return
    }

    PLANNER_ORDER.forEach((id) => {
      labeledBlock(dimById(id).name, plan.daily?.[id], { compact })
    })
  }

  function renderEmergencyNeedsSection() {
    band('Emergency Self-Care Needs', cyan)
    EMERGENCY_TOOLS.forEach((tool) => {
      const row = plan.emergencyNeeds?.[tool.id] || { helpful: '', harmful: '' }
      para(tool.name, { size: 11, bold: true, gap: 4 })
      para(`Helpful (what to do): ${blank(row.helpful)}`, { size: 10, gap: 4 })
      para(`Harmful (what to avoid): ${blank(row.harmful)}`, { size: 10, gap: 12 })
    })
  }

  function renderEmergencyPlanSection() {
    band('My Emergency Self-Care Plan', cyan)
    para('Helpful (to do)', { size: 11, bold: true, gap: 4 })
    ;(plan.emergencyHelpful || []).forEach((item, i) => {
      para(`${i + 1}. ${blank(item)}`, { size: 10, gap: 4 })
    })
    y += 8
    para('Harmful (to avoid)', { size: 11, bold: true, gap: 4 })
    ;(plan.emergencyHarmful || []).forEach((item, i) => {
      para(`${i + 1}. ${blank(item)}`, { size: 10, gap: 4 })
    })
  }

  function renderGoalsSection() {
    band('My Goals', peach)
    ;(plan.goals || []).forEach((goal, i) => {
      para(`${i + 1}. ${blank(goal)}`, { size: 11, gap: 8 })
    })
  }

  return {
    doc,
    titleBlock,
    band,
    para,
    renderDailySection,
    renderEmergencyNeedsSection,
    renderEmergencyPlanSection,
    renderGoalsSection,
    addFooter,
    newPage,
    muted,
    cyan,
    DIMENSIONS,
  }
}

export function downloadDailyPdf(plan) {
  const pdf = buildPdf(plan)
  pdf.titleBlock('My Daily Self-Care Plan')
  pdf.renderDailySection({ compact: true, withTitle: false })
  pdf.addFooter()
  pdf.doc.save('daily-self-care-plan.pdf')
}

export function downloadEmergencyPlanPdf(plan) {
  const pdf = buildPdf(plan)
  pdf.titleBlock('My Emergency Self-Care Plan')
  pdf.renderEmergencyNeedsSection()
  pdf.renderEmergencyPlanSection()
  pdf.addFooter()
  pdf.doc.save('emergency-self-care-plan.pdf')
}

export function downloadPlanPdf(plan) {
  const pdf = buildPdf(plan)

  pdf.titleBlock('My one-sheet self-care planner')
  pdf.renderDailySection({ onePage: true })

  pdf.newPage()
  pdf.renderEmergencyNeedsSection()
  pdf.renderEmergencyPlanSection()
  pdf.renderGoalsSection()

  pdf.addFooter()
  pdf.doc.save('self-care-plan.pdf')
}
