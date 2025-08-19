import { FC, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { SurveyService } from '../services/surveys.service'
import { SurveyQuestionType, SurveyStatisticsDto } from '@shared/types'
import { PageTitle } from 'src/layout/core'

const SurveyStatisticsPage: FC = () => {
    const { companyId, surveyId } = useParams()
    const [data, setData] = useState<SurveyStatisticsDto | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!companyId || !surveyId) return
        SurveyService.getStatistics(companyId, surveyId).then((stats) => {
            setData(stats)
            setLoading(false)
        })
    }, [companyId, surveyId])

    if (loading || !data) return <div className='p-10'>Carregando...</div>

    return (
        <div className='p-10'>
            <PageTitle>Estatísticas da Enquete</PageTitle>
            <h4>Total de respostas: {data.totalResponses}</h4>

            <div className='mt-10'>
                {data.questions.map((q) => (
                    <div key={q.questionId} className='mb-10'>
                        <h5 className='fw-bold'>Pergunta: {q.questionId}</h5>

                        {q.options && (
                            <ul>
                                {Object.entries(q.options).map(([opt, count]) => (
                                    <li key={opt}>
                                        {opt}: {count}
                                    </li>
                                ))}
                            </ul>
                        )}

                        {q.answers && (
                            <div>
                                <p className='fw-semibold'>Respostas abertas:</p>
                                <ul>
                                    {q.answers.map((text, i) => (
                                        <li key={i}>{text}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {q.distribution && (
                            <div>
                                <p className='fw-semibold'>Distribuição:</p>
                                <ul>
                                    {Object.entries(q.distribution).map(([val, count]) => (
                                        <li key={val}>
                                            {val}: {count}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {q.average !== undefined && (
                            <p>Média: {q.average.toFixed(2)}</p>
                        )}

                        {q.npsScore !== undefined && (
                            <p>Pontuação NPS: {q.npsScore.toFixed(2)}</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default SurveyStatisticsPage