import { useEffect, useState } from 'react'
import { SurveyStatisticsDto } from '@shared/types'
import { SurveyService } from '../services/surveys.service'

export function useSurveyStats(companyId: string, surveyId: string, params?: { from?: string; to?: string; onlyIdentified?: boolean }) {
  const [data, setData] = useState<SurveyStatisticsDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!companyId || !surveyId) return
    setLoading(true)
    setError(null)
    SurveyService.getSurveyStatistics(companyId, surveyId, params)
      .then(setData)
      .catch((e) => setError(e?.message || 'Erro ao carregar stats'))
      .finally(() => setLoading(false))
  }, [companyId, surveyId, params?.from, params?.to, params?.onlyIdentified])

  return { data, loading, error }
}