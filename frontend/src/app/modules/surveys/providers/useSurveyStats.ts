import { useEffect, useState } from 'react'
import { SurveyStatisticsDto } from '@shared/types'

export function useSurveyStats(companyId: string, surveyId: string) {
    const [data, setData] = useState<SurveyStatisticsDto>()
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!companyId || !surveyId) return

        fetch(`/api/companies/${companyId}/surveys/${surveyId}/stats`)
            .then((res) => res.json())
            .then(setData)
            .catch((err) => console.error('Erro ao carregar stats', err))
            .finally(() => setLoading(false))
    }, [companyId, surveyId])

    return { data, loading }
}