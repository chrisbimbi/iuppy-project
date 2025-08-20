import { useEffect, useMemo, useRef } from 'react'
import WordCloud from 'wordcloud'

type Props = {
  topWords: Array<{ word: string; count: number }>
  className?: string
  /** proporção da altura em relação à largura do container (ex.: 0.65 = 65%) */
  heightRatio?: number
  /** altura mínima do canvas (px) */
  minHeight?: number
  /** máximo de palavras renderizadas */
  maxWords?: number
  /** faixa de tamanho da fonte em px [min, max] */
  fontRange?: [number, number]
}

/**
 * Word Cloud com estética Metronic.
 * Canvas responsivo, alta densidade para boa impressão no PDF.
 */
export default function WordCloudCanvas({
  topWords,
  className,
  heightRatio = 0.65,
  minHeight = 420,
  maxWords = 120,
  fontRange = [40, 200],
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const hostRef = useRef<HTMLDivElement | null>(null)

  const palette = useMemo(() => {
    if (typeof window === 'undefined') {
      return ['#3E97FF', '#50CD89', '#7239EA', '#1B84FF', '#F6C000', '#F1416C', '#181C32', '#7E8299']
    }
    const gcs = getComputedStyle(document.documentElement)
    const pick = (k: string, fb: string) => gcs.getPropertyValue(k)?.trim() || fb
    return [
      pick('--bs-primary', '#3E97FF'),
      pick('--bs-success', '#50CD89'),
      pick('--bs-info', '#7239EA'),
      pick('--bs-primary-active', '#1B84FF'),
      pick('--bs-warning', '#F6C000'),
      pick('--bs-danger', '#F1416C'),
      pick('--bs-gray-900', '#181C32'),
      pick('--bs-gray-600', '#7E8299'),
    ]
  }, [])

  useEffect(() => {
    if (!canvasRef.current || !hostRef.current) return
    const host = hostRef.current
    const canvas = canvasRef.current

    const render = () => {
      const { width } = host.getBoundingClientRect()
      const height = Math.max(minHeight, Math.round(width * heightRatio))
      // 2x para nitidez no PDF
      canvas.width = Math.max(800, Math.round(width * 2))
      canvas.height = Math.round(height * 2)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      const list = (topWords || [])
        .slice(0, maxWords)
        .map(({ word, count }) => [word, count]) as [string, number][]

      const max = list.reduce((m, [, c]) => Math.max(m, c), 1)
      const [minPx, maxPx] = fontRange

      WordCloud(canvas, {
        list,
        gridSize: 8,
        weightFactor: (c: number) => {
          const t = Math.sqrt(c / max) // suaviza
          return minPx + t * (maxPx - minPx)
        },
        minRotation: 0,
        maxRotation: 0,
        rotateRatio: 0,
        backgroundColor: 'transparent',
        color: (_w, _c, size) => {
          const idx = size > (maxPx * 0.85) ? 0 :
                      size > (maxPx * 0.7)  ? 1 :
                      size > (maxPx * 0.55) ? 2 :
                      (Math.random() * (palette.length - 1) + 3) | 0
          return palette[Math.max(0, Math.min(palette.length - 1, idx))]
        },
        fontFamily: 'Inter, system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
        clearCanvas: true,
        drawOutOfBound: false,
        classes: 'fw-semibold',
      })
    }

    render()
    const ro = new ResizeObserver(() => render())
    ro.observe(host)
    return () => ro.disconnect()
  }, [topWords, palette, maxWords, heightRatio, minHeight, fontRange])

  return (
    <div ref={hostRef} className={className}>
      <canvas ref={canvasRef} />
    </div>
  )
}