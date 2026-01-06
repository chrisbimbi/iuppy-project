import React, { FC } from 'react'
import {
  StatisticsWidget1,
  StatisticsWidget2,
  StatisticsWidget3,
  StatisticsWidget4,
  StatisticsWidget5,
  StatisticsWidget6,
} from '../../../..//partials/widgets'
import { Toolbar } from '../../../..//layout/components/toolbar/Toolbar'
import { Content } from '../../../..//layout/components/Content'
import { useIntl } from 'react-intl'

const Statistics: FC = () => {
  const intl = useIntl()
  return (
    <>
      <Toolbar />
      <Content>
        {/* begin::Row */}
        <div className='row g-5 g-xl-8'>
          <div className='col-xl-4'>
            <StatisticsWidget1
              className='card-xl-stretch mb-xl-8'
              image='abstract-4.svg'
              title={intl.formatMessage({ id: 'WIDGETS.STATISTICS.MEETING_SCHEDULE', defaultMessage: 'Meeting Schedule' })}
              time={intl.formatMessage({ id: 'WIDGETS.STATISTICS.TIME.330_420', defaultMessage: '3:30PM - 4:20PM' })}
              description={intl.formatMessage({ id: 'WIDGETS.STATISTICS.DESC.HEADLINE', defaultMessage: "Create a headline that is informative<br/>and will capture readers'" })}
            />
          </div>

          <div className='col-xl-4'>
            <StatisticsWidget1
              className='card-xl-stretch mb-xl-8'
              image='abstract-2.svg'
              title={intl.formatMessage({ id: 'WIDGETS.STATISTICS.MEETING_SCHEDULE', defaultMessage: 'Meeting Schedule' })}
              time={intl.formatMessage({ id: 'WIDGETS.STATISTICS.TIME.03_MAY', defaultMessage: '03 May 2020' })}
              description={intl.formatMessage({ id: 'WIDGETS.STATISTICS.DESC.BLOG', defaultMessage: 'Great blog posts don’t just happen Even the best bloggers need it' })}
            />
          </div>

          <div className='col-xl-4'>
            <StatisticsWidget1
              className='card-xl-stretch mb-5 mb-xl-8'
              image='abstract-1.svg'
              title={intl.formatMessage({ id: 'WIDGETS.STATISTICS.UI_CONFERENCE', defaultMessage: 'UI Conference' })}
              time={intl.formatMessage({ id: 'WIDGETS.STATISTICS.TIME.10AM_JAN', defaultMessage: '10AM Jan, 2021' })}
              description={intl.formatMessage({ id: 'WIDGETS.STATISTICS.DESC.AIRWAYS', defaultMessage: 'AirWays - A Front-end solution for airlines build with ReactJS' })}
            />
          </div>
        </div>
        {/* end::Row */}

        {/* begin::Row */}
        <div className='row g-5 g-xl-8'>
          <div className='col-xl-4'>
            <StatisticsWidget2
              className='card-xl-stretch mb-xl-8'
              avatar='../media/svg/avatars/029-boy-11.svg'
              title='Arthur Goldstain'
              description={intl.formatMessage({ id: 'WIDGETS.STATISTICS.ROLE.ARCHITECT', defaultMessage: 'System & Software Architect' })}
            />
          </div>

          <div className='col-xl-4'>
            <StatisticsWidget2
              className='card-xl-stretch mb-xl-8'
              avatar='../media/svg/avatars/014-girl-7.svg'
              title='Lisa Bold'
              description={intl.formatMessage({ id: 'WIDGETS.STATISTICS.ROLE.MANAGER', defaultMessage: 'Marketing & Fanance Manager' })}
            />
          </div>

          <div className='col-xl-4'>
            <StatisticsWidget2
              className='card-xl-stretch mb-5 mb-xl-8'
              avatar='../media/svg/avatars/004-boy-1.svg'
              title='Nick Stone'
              description={intl.formatMessage({ id: 'WIDGETS.STATISTICS.ROLE.SUPPORT', defaultMessage: 'Customer Support Team' })}
            />
          </div>
        </div>
        {/* end::Row */}

        {/* begin::Row */}
        <div className='row g-5 g-xl-8'>
          <div className='col-xl-4'>
            <StatisticsWidget3
              className='card-xl-stretch mb-xl-8'
              color='success'
              title={intl.formatMessage({ id: 'WIDGETS.STATISTICS.WEEKLY_SALES', defaultMessage: 'Weekly Sales' })}
              description={intl.formatMessage({ id: 'WIDGETS.STATISTICS.DESC.WEEKLY_SALES', defaultMessage: 'Your Weekly Sales Chart' })}
              change='+100'
            />
          </div>

          <div className='col-xl-4'>
            <StatisticsWidget3
              className='card-xl-stretch mb-xl-8'
              color='danger'
              title={intl.formatMessage({ id: 'WIDGETS.STATISTICS.AUTHORS_PROGRESS', defaultMessage: 'Authors Progress' })}
              description={intl.formatMessage({ id: 'WIDGETS.STATISTICS.DESC.AUTHORS_PROGRESS', defaultMessage: 'Marketplace Authors Chart' })}
              change='-260'
            />
          </div>

          <div className='col-xl-4'>
            <StatisticsWidget3
              className='card-xl-stretch mb-5 mb-xl-8'
              color='primary'
              title={intl.formatMessage({ id: 'WIDGETS.STATISTICS.SALES_PROGRESS', defaultMessage: 'Sales Progress' })}
              description={intl.formatMessage({ id: 'WIDGETS.STATISTICS.DESC.SALES_PROGRESS', defaultMessage: 'Marketplace Sales Chart' })}
              change='+180'
            />
          </div>
        </div>
        {/* end::Row */}

        {/* begin::Row */}
        <div className='row g-5 g-xl-8'>
          <div className='col-xl-4'>
            <StatisticsWidget4
              className='card-xl-stretch mb-xl-8'
              svgIcon='basket'
              color='info'
              description={intl.formatMessage({ id: 'WIDGETS.STATISTICS.SALES_CHANGE', defaultMessage: 'Sales Change' })}
              change='+256'
            />
          </div>

          <div className='col-xl-4'>
            <StatisticsWidget4
              className='card-xl-stretch mb-xl-8'
              svgIcon='element-11'
              color='success'
              description={intl.formatMessage({ id: 'WIDGETS.STATISTICS.WEEKLY_INCOME', defaultMessage: 'Weekly Income' })}
              change='750$'
            />
          </div>

          <div className='col-xl-4'>
            <StatisticsWidget4
              className='card-xl-stretch mb-5 mb-xl-8'
              svgIcon='briefcase'
              color='primary'
              description={intl.formatMessage({ id: 'WIDGETS.STATISTICS.NEW_USERS', defaultMessage: 'New Users' })}
              change='+6.6K'
            />
          </div>
        </div>
        {/* end::Row */}

        {/* begin::Row */}
        <div className='row g-5 g-xl-8'>
          <div className='col-xl-4'>
            <StatisticsWidget5
              className='card-xl-stretch mb-xl-8'
              svgIcon='basket'
              color='danger'
              iconColor='white'
              title={intl.formatMessage({ id: 'WIDGETS.STATISTICS.SHOPPING_CART', defaultMessage: 'Shopping Cart' })}
              titleColor='white'
              description={intl.formatMessage({ id: 'WIDGETS.STATISTICS.DESC.LANDS', defaultMessage: 'Lands, Houses, Ranchos, Farms' })}
              descriptionColor='white'
            />
          </div>

          <div className='col-xl-4'>
            <StatisticsWidget5
              className='card-xl-stretch mb-xl-8'
              svgIcon='cheque'
              color='primary'
              iconColor='white'
              title={intl.formatMessage({ id: 'WIDGETS.STATISTICS.APPARTMENTS', defaultMessage: 'Appartments' })}
              titleColor='white'
              description={intl.formatMessage({ id: 'WIDGETS.STATISTICS.DESC.FLATS', defaultMessage: 'Flats, Shared Rooms, Duplex' })}
              descriptionColor='white'
            />
          </div>

          <div className='col-xl-4'>
            <StatisticsWidget5
              className='card-xl-stretch mb-5 mb-xl-8'
              svgIcon='chart-simple-3'
              color='success'
              iconColor='white'
              title={intl.formatMessage({ id: 'WIDGETS.STATISTICS.SALES_STATS', defaultMessage: 'Sales Stats' })}
              titleColor='white'
              description={intl.formatMessage({ id: 'WIDGETS.STATISTICS.DESC.INCREASED', defaultMessage: '50% Increased for FY20' })}
              descriptionColor='white'
            />
          </div>
        </div>
        {/* end::Row */}

        {/* begin::Row */}
        <div className='row g-5 g-xl-8'>
          <div className='col-xl-3'>
            <StatisticsWidget5
              className='card-xl-stretch mb-xl-8'
              svgIcon='chart-simple'
              color='white'
              iconColor='primary'
              title='500M$'
              description={intl.formatMessage({ id: 'WIDGETS.STATISTICS.DESC.SAP', defaultMessage: 'SAP UI Progress' })}
            />
          </div>

          <div className='col-xl-3'>
            <StatisticsWidget5
              className='card-xl-stretch mb-xl-8'
              svgIcon='cheque'
              color='dark'
              iconColor='white'
              title='+3000'
              titleColor='white'
              description={intl.formatMessage({ id: 'WIDGETS.STATISTICS.DESC.NEW_CUSTOMERS', defaultMessage: 'New Customers' })}
              descriptionColor='white'
            />
          </div>

          <div className='col-xl-3'>
            <StatisticsWidget5
              className='card-xl-stretch mb-xl-8'
              svgIcon='briefcase'
              color='warning'
              iconColor='white'
              title='$50,000'
              titleColor='white'
              description={intl.formatMessage({ id: 'WIDGETS.STATISTICS.DESC.MILESTONE', defaultMessage: 'Milestone Reached' })}
              descriptionColor='white'
            />
          </div>

          <div className='col-xl-3'>
            <StatisticsWidget5
              className='card-xl-stretch mb-5 mb-xl-8'
              svgIcon='chart-pie-simple'
              color='info'
              iconColor='white'
              title='$50,000'
              titleColor='white'
              description={intl.formatMessage({ id: 'WIDGETS.STATISTICS.DESC.MILESTONE', defaultMessage: 'Milestone Reached' })}
              descriptionColor='white'
            />
          </div>
        </div>
        {/* end::Row */}

        {/* begin::Row */}
        <div className='row g-5 g-xl-8'>
          <div className='col-xl-4'>
            <StatisticsWidget6
              className='card-xl-stretch mb-xl-8'
              color='success'
              title={intl.formatMessage({ id: 'WIDGETS.STATISTICS.AVERAGE', defaultMessage: 'Avarage' })}
              description={intl.formatMessage({ id: 'WIDGETS.STATISTICS.DESC.PROJECT_PROGRESS', defaultMessage: 'Project Progress' })}
              progress='50%'
            />
          </div>

          <div className='col-xl-4'>
            <StatisticsWidget6
              className='card-xl-stretch mb-xl-8'
              color='warning'
              title={intl.formatMessage({ id: 'WIDGETS.STATISTICS.GOAL_48K', defaultMessage: '48k Goal' })}
              description={intl.formatMessage({ id: 'WIDGETS.STATISTICS.DESC.COMPANY_FINANCE', defaultMessage: 'Company Finance' })}
              progress='15%'
            />
          </div>

          <div className='col-xl-4'>
            <StatisticsWidget6
              className='card-xl-stretch mb-xl-8'
              color='primary'
              title={intl.formatMessage({ id: 'WIDGETS.STATISTICS.IMPRESSIONS_400K', defaultMessage: '400k Impressions' })}
              description={intl.formatMessage({ id: 'WIDGETS.STATISTICS.DESC.MARKETING_ANALYSIS', defaultMessage: 'Marketing Analysis' })}
              progress='76%'
            />
          </div>
        </div>
        {/* end::Row */}
      </Content>
    </>
  )
}

export { Statistics }
