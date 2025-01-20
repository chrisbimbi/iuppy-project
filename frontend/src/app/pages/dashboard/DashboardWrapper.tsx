import React, { useEffect } from 'react'
import { useIntl } from 'react-intl'
import {
  MixedWidget2,
  ListsWidget5,
  TablesWidget10,
  TablesWidget13,
  TablesWidget11,
  ChartsWidget1,
  ChartsWidget8,
  ListsWidget9,
  FeedsWidget3,
} from '../../..//partials/widgets'
import { Toolbar } from '../../../layout/components/toolbar/Toolbar'
import { Content } from '../../../layout/components/Content'
import { PageTitle } from '../../../layout/core'
import { useApiData } from '../../../hooks/useApiData'


const DashboardPage: React.FC = () => {
  const { data, loading, error } = useApiData()

  useEffect(() => {
    document.getElementById('kt_layout_toolbar')?.classList.remove('d-none')
    return () => {
      document.getElementById('kt_layout_toolbar')?.classList.add('d-none')
    }
  }, [])

  if (loading) return <div>Carregando...</div>
  if (error) return <div>Erro ao carregar os dados: {error.message}</div>
  if (!data) return <div>Nenhum dado disponível</div>

  return (
    <>
      <Toolbar />
      <Content>
        <div className='row g-5 g-xl-8'>
          <div className='col-xl-4'>
            <MixedWidget2
              className="card-xl-stretch mb-xl-8"
              chartHeight="200px"
              data={{
                active: 245,
                total: 280,
                inactive: 35,
                monthlyTrend: [200, 210, 220, 230, 240, 245]
              }}
            />
          </div>
          <div className='col-xl-4'>
            <TablesWidget10 className='card-xl-stretch mb-xl-8' data={data.contentEngagement} />
          </div>
          <div className='col-xl-4'>
            <ChartsWidget8 className='card-xl-stretch mb-5 mb-xl-8' data={data.turnoverRate} />
          </div>
        </div>
        <div className='row gy-5 g-xl-8'>
          <div className='col-xl-4'>
            <TablesWidget13 className='card-xl-stretch mb-xl-8' data={data.openPositions} />
          </div>
          <div className='col-xl-4'>
            <ChartsWidget1 className='card-xl-stretch mb-xl-8' data={data.hiringVsFiring} />
          </div>
          <div className='col-xl-4'>
            <ListsWidget9 className='card-xl-stretch mb-5 mb-xl-8' data={data.faqTopics} />
          </div>
        </div>
        <div className='row gy-5 g-xl-8'>
          <div className='col-xxl-6'>
            <ListsWidget5 className='card-xxl-stretch' data={data.multimediaContent} />
          </div>
          <div className='col-xxl-6'>
            <FeedsWidget3 className='card-xxl-stretch mb-5 mb-xl-8' data={data.latestSurveyResults} />
          </div>
        </div>
        <div className='row g-5 g-xl-8'>
          <div className='col-xl-12'>
            <TablesWidget11 className='card-xl-stretch mb-5 mb-xl-8' data={data.pendingVacations} />
          </div>
        </div>
      </Content>
    </>
  )
}

const DashboardWrapper: React.FC = () => {
  const intl = useIntl()
  console.log('Current locale:', intl.locale)

  return (
    <>
      <PageTitle breadcrumbs={[]}>{intl.formatMessage({ id: 'MENU.DASHBOARD' })}</PageTitle>
      <DashboardPage />
    </>
  )
}

export { DashboardWrapper }