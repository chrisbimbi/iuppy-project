import { useEffect, useState } from 'react'
import { Survey } from '@shared/types'
import { SurveyService } from '../services/surveys.service'

type SurveyWithCount = Survey & { totalResponses: number }

type Filters = {
    spaceId?: string
    spaceIds?: string[]
    includeGlobal?: boolean
}

export function useSurveys(companyId: string, filters?: Filters) {
    const [data, setData] = useState<SurveyWithCount[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!companyId) return
        setLoading(true)

        SurveyService.list(companyId, filters)
            .then(async (surveys) => {
                const surveysWithCounts = await Promise.all(
                    surveys.map(async (survey) => {
                        const responses = await SurveyService.getResponses(companyId, survey.id)
                        return { ...survey, totalResponses: responses.length }
                    })
                )
                setData(surveysWithCounts)
            })
            .catch((err) => console.error('Erro ao carregar surveys', err))
            .finally(() => setLoading(false))
    }, [
        companyId,
        filters?.spaceId,
        (filters?.spaceIds || []).join(','),
        !!filters?.includeGlobal,
    ])

    return { data, loading }
}