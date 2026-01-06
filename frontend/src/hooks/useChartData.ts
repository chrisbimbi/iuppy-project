import { useState, useEffect } from 'react'

export type ChartData = {
    series: {
        name: string
        data: number[]
    }[]
    categories: string[]
}

export const useChartData = () => {
    const [data, setData] = useState<ChartData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Simulate API call
        const fetchData = async () => {
            await new Promise(resolve => setTimeout(resolve, 500))
            setData({
                series: [
                    {
                        name: 'Net Profit',
                        data: [15, 25, 15, 40, 20, 50],
                    },
                ],
                categories: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
            })
            setLoading(false)
        }

        fetchData()
    }, [])

    return { data, loading }
}
