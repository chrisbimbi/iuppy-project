import { FC } from 'react'
import { useIntl } from 'react-intl'
import { useSurveyStats } from '../providers/useSurveyStats'
import { useAuth } from '../../auth';

interface Props {
  surveyId: string
}

const SurveyTotalResponses: FC<Props> = ({ surveyId }) => {
  const { currentUser } = useAuth();
  const companyId = currentUser?.companyId
  const intl = useIntl()

  const { data, loading } = useSurveyStats(companyId!, surveyId)

  if (!companyId) return null
  if (loading) return <span className="text-muted">{intl.formatMessage({ id: 'SURVEYS.TOTAL_RESPONSES.LOADING', defaultMessage: '...' })}</span>
  return <span>{data?.totalResponses ?? 0}</span>
}

export default SurveyTotalResponses