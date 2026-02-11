import { useNavigate } from 'react-router-dom'
import { KTIcon } from '../../../../../../..//helpers'
import { useListView } from '../../core/ListViewProvider'
import { UsersListFilter } from './UsersListFilter'
import { useIntl } from 'react-intl'

const UsersListToolbar = () => {
  const navigate = useNavigate()
  const intl = useIntl()
  const { setItemIdForUpdate } = useListView()
  const openAddUserModal = () => {
    setItemIdForUpdate(null)
  }

  return (
    <div className='d-flex justify-content-end' data-kt-user-table-toolbar='base'>
      <UsersListFilter />

      {/* begin::Integrations */}
      <button type='button' className='btn btn-light-info me-3' onClick={() => navigate('/company/settings?tab=integrations')}>
        <KTIcon iconName='technology-2' className='fs-2' />
        Integração
      </button>
      {/* end::Integrations */}

      {/* begin::Export */}
      <button type='button' className='btn btn-light-primary me-3'>
        <KTIcon iconName='exit-up' className='fs-2' />
        {intl.formatMessage({ id: 'USER_MANAGEMENT.TOOLBAR.EXPORT' })}
      </button>
      {/* end::Export */}

      {/* begin::Add user */}
      <button type='button' className='btn btn-primary' onClick={openAddUserModal}>
        <KTIcon iconName='plus' className='fs-2' />
        {intl.formatMessage({ id: 'USER_MANAGEMENT.TOOLBAR.ADD_USER' })}
      </button>
      {/* end::Add user */}
    </div>
  )
}

export { UsersListToolbar }
