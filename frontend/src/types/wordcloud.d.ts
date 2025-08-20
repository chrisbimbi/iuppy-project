declare module 'wordcloud' {
    interface WordCloudOptions {
        list: [string, number][]
        gridSize?: number
        weightFactor?: (count: number) => number
        minRotation?: number
        maxRotation?: number
        rotateRatio?: number
        backgroundColor?: string
        color?: string | ((word: string, weight: number, fontSize: number, radius: number, theta: number) => string)
        drawOutOfBound?: boolean
        fontFamily?: string
        clearCanvas?: boolean
        origin?: [number, number]
        classes?: string | ((word: string, weight: number, fontSize: number, radius: number, theta: number) => string)
    }
    function WordCloud(canvas: HTMLCanvasElement | HTMLElement, options: WordCloudOptions): void
    export default WordCloud
}