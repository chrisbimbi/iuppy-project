// frontend/src/app/modules/surveys/utils/pdf.ts
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export type ExportPdfOptions = {
  /** margem interna em pontos (pt). Default: 36 (~12,7mm) */
  margin?: number
  /** escala do html2canvas (qualidade). Default: 3 */
  scale?: number
  /** orientação do PDF. Default: 'p' (retrato) */
  orientation?: 'p' | 'l'
  /** formato da página. Default: 'a4' */
  format?: 'a4' | 'letter' | 'legal'
  /** cor de fundo do canvas. Default: '#ffffff' */
  backgroundColor?: string
  /**
   * seletor das seções que serão paginadas (apenas em exportSectionsAsPdf)
   * Default: '[data-pdf-section]'
   */
  selector?: string
}

/** Renderiza um elemento para canvas com alta qualidade. */
async function toCanvas(el: HTMLElement, scale: number, backgroundColor: string) {
  return await html2canvas(el, {
    scale,
    useCORS: true,
    backgroundColor,
    logging: false,
    // garante que todo conteúdo rolável entre no render
    windowWidth: el.scrollWidth,
    windowHeight: el.scrollHeight,
  })
}

/**
 * Exporta TODO o container como uma imagem única, ajustando a largura à página
 * e criando páginas extras automaticamente para o overflow vertical.
 */
export async function exportContainerAsPdf(
  containerId: string,
  filename: string,
  opts: ExportPdfOptions = {}
) {
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

  // FIT-TO-WIDTH (sempre usa a largura disponível)
  const ratio = availW / canvas.width
  const imgW = canvas.width * ratio
  const imgH = canvas.height * ratio

  // primeira página
  pdf.addImage(img, 'PNG', margin, margin, imgW, imgH)

  // páginas seguintes (tile vertical da mesma imagem)
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

/**
 * Exporta o container em **seções** (ex.: 1ª página geral, depois cada pergunta),
 * cada seção “ajustada à largura” da página e com paginação automática por seção.
 *
 * Para usar, marque blocos no DOM com `data-pdf-section`.
 */
export async function exportSectionsAsPdf(
  containerId: string,
  filename: string,
  opts: ExportPdfOptions = {}
) {
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

  let firstPage = true

  for (const section of sections) {
    const canvas = await toCanvas(section, scale, backgroundColor)
    const img = canvas.toDataURL('image/png')

    const ratio = availW / canvas.width
    const imgW = canvas.width * ratio
    const imgH = canvas.height * ratio

    if (firstPage) {
      firstPage = false
      pdf.addImage(img, 'PNG', margin, margin, imgW, imgH)
    } else {
      pdf.addPage()
      pdf.addImage(img, 'PNG', margin, margin, imgW, imgH)
    }

    // paginação da seção (se for mais alta que a área útil)
    let heightLeft = imgH - availH
    let positionY = margin - availH
    while (heightLeft > 0) {
      pdf.addPage()
      pdf.addImage(img, 'PNG', margin, positionY, imgW, imgH)
      heightLeft -= availH
      positionY -= availH
    }
  }

  pdf.save(filename)
}