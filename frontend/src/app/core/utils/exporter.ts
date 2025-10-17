/* eslint-disable @typescript-eslint/no-explicit-any */
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

/** ===== Types base tabulares ===== */
export type ExportAlign = 'left' | 'center' | 'right'
export type ExportColumn = { key: string; label: string; width?: number; align?: ExportAlign }
export type ExportRow = Record<string, string | number | null | undefined>
export type ExportTable = {
    /** Título da seção/planilha */
    title?: string
    /** Nome da planilha (XLSX). Se não vier, usa title ou "Aba N" */
    sheetName?: string
    columns: ExportColumn[]
    rows: ExportRow[]
}

/** ===== Helpers de formatação genéricos ===== */
export function formatDatePt(value?: string | Date | null) {
    if (!value) return ''
    const dt = typeof value === 'string' ? new Date(value) : value
    if (isNaN(dt.getTime())) return ''
    return dt.toLocaleString('pt-BR')
}
export function formatPercent(value?: number | null, digits = 2) {
    const v = typeof value === 'number' && isFinite(value) ? value : 0
    return (v * 100).toLocaleString('pt-BR', { maximumFractionDigits: digits }) + '%'
}

/** ===== CSV ===== */
export function exportTablesToCsv(tables: ExportTable | ExportTable[], delimiter = ';'): Blob {
    const list = Array.isArray(tables) ? tables : [tables]
    const chunks: string[] = []
    for (const t of list) {
        if (t.title) chunks.push(`# ${t.title}`)
        const header = t.columns.map((c) => escapeCsv(c.label, delimiter)).join(delimiter)
        chunks.push(header)
        for (const row of t.rows) {
            const line = t.columns.map((c) => escapeCsv(valueToString(row[c.key]), delimiter)).join(delimiter)
            chunks.push(line)
        }
        chunks.push('') // linha em branco entre seções
    }
    const csv = chunks.join('\n')
    return new Blob([csv], { type: 'text/csv;charset=utf-8;' })
}

function escapeCsv(s: string, delimiter = ';') {
    if (s == null) s = ''
    const needsQuote = s.includes('"') || s.includes('\n') || s.includes(delimiter)
    if (needsQuote) return `"${s.replace(/"/g, '""')}"`
    return s
}
function valueToString(v: any): string {
    if (v == null) return ''
    if (typeof v === 'number') return String(v)
    if (v instanceof Date) return formatDatePt(v)
    return String(v)
}

/** ===== XLSX ===== */
export function exportTablesToXlsx(tables: ExportTable | ExportTable[], filename: string) {
    const list = Array.isArray(tables) ? tables : [tables]
    const wb = XLSX.utils.book_new()
    const used = new Set<string>()

    list.forEach((t, idx) => {
        const sheetLabel = safeSheetName(t.sheetName || t.title || `Aba ${idx + 1}`, used)
        const aoa: any[][] = []
        // título opcional como primeira linha (em XLSX geralmente preferimos cabeçalho direto)
        // aoa.push([t.title || sheetLabel])
        // header
        aoa.push(t.columns.map((c) => c.label))
        // rows
        for (const row of t.rows) {
            aoa.push(t.columns.map((c) => valueToString(row[c.key])))
        }
        const sh = XLSX.utils.aoa_to_sheet(aoa)
        // largura de colunas (se houver hint)
        if (t.columns.some((c) => c.width)) {
            const colWidths = t.columns.map((c) => ({ wch: c.width || 20 }))
                ; (sh as any)['!cols'] = colWidths
        }
        XLSX.utils.book_append_sheet(wb, sh, sheetLabel)
    })

    XLSX.writeFile(wb, filename)
}

function safeSheetName(name: string, used: Set<string>) {
    let n = (name || 'Aba').replace(/[:\\/?*\[\]]/g, ' ').replace(/\s+/g, ' ').trim()
    if (!n) n = 'Aba'
    if (n.length > 31) n = n.slice(0, 31)
    const base = n
    let i = 1
    while (used.has(n)) {
        const suffix = ` ${++i}`
        n = (base.slice(0, Math.max(0, 31 - suffix.length)) + suffix).trim()
    }
    used.add(n)
    return n
}

/** ===== PDF (captura de DOM) ===== */
export type ExportPdfOptions = {
    margin?: number // pt
    scale?: number
    orientation?: 'p' | 'l'
    format?: 'a4' | 'letter' | 'legal'
    backgroundColor?: string
    selector?: string // só para exportSectionsAsPdf
}

async function toCanvas(el: HTMLElement, scale: number, backgroundColor: string) {
    return await html2canvas(el, {
        scale,
        useCORS: true,
        backgroundColor,
        logging: false,
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight,
    })
}

export async function exportContainerAsPdf(containerId: string, filename: string, opts: ExportPdfOptions = {}) {
    const {
        margin = 36,
        scale = 3,
        orientation = 'p',
        format = 'a4',
        backgroundColor = '#ffffff',
    } = opts

    const node = document.getElementById(containerId)
    if (!node) throw new Error(`Container #${containerId} não encontrado`)

    const canvas = await toCanvas(node, scale, backgroundColor)
    const img = canvas.toDataURL('image/png')

    const pdf = new jsPDF(orientation, 'pt', format)
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()
    const availW = pageW - margin * 2
    const availH = pageH - margin * 2

    const ratio = availW / canvas.width
    const imgW = canvas.width * ratio
    const imgH = canvas.height * ratio

    pdf.addImage(img, 'PNG', margin, margin, imgW, imgH)

    let heightLeft = imgH - availH
    let positionY = margin - availH
    while (heightLeft > 0) {
        pdf.addPage()
        pdf.addImage(img, 'PNG', margin, positionY, imgW, imgH)
        heightLeft -= availH
        positionY -= availH
    }

    pdf.save(filename)
}

export async function exportSectionsAsPdf(containerId: string, filename: string, opts: ExportPdfOptions = {}) {
    const {
        margin = 36,
        scale = 3,
        orientation = 'p',
        format = 'a4',
        backgroundColor = '#ffffff',
        selector = '[data-pdf-section]',
    } = opts

    const root = document.getElementById(containerId)
    if (!root) throw new Error(`Container #${containerId} não encontrado`)

    const sections = Array.from(root.querySelectorAll<HTMLElement>(selector))
    if (sections.length === 0) {
        throw new Error('Nenhuma seção encontrada para exportar. Adicione data-pdf-section nos blocos.')
    }

    const pdf = new jsPDF(orientation, 'pt', format)
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()
    const availW = pageW - margin * 2
    const availH = pageH - margin * 2

    let first = true
    for (const section of sections) {
        const canvas = await toCanvas(section, scale, backgroundColor)
        const img = canvas.toDataURL('image/png')
        const ratio = availW / canvas.width
        const imgW = canvas.width * ratio
        const imgH = canvas.height * ratio

        if (first) {
            first = false
            pdf.addImage(img, 'PNG', margin, margin, imgW, imgH)
        } else {
            pdf.addPage()
            pdf.addImage(img, 'PNG', margin, margin, imgW, imgH)
        }

        let heightLeft = imgH - availH
        let y = margin - availH
        while (heightLeft > 0) {
            pdf.addPage()
            pdf.addImage(img, 'PNG', margin, y, imgW, imgH)
            heightLeft -= availH
            y -= availH
        }
    }

    pdf.save(filename)
}

/** ===== Download helper ===== */
export function downloadBlob(blobOrString: Blob | string, filename: string) {
    const blob = blobOrString instanceof Blob ? blobOrString : new Blob([blobOrString], { type: 'text/plain;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(url)
    a.remove()
}