import { KTIcon } from '../../../../../../..//helpers'
import { useListView } from '../../core/ListViewProvider'
import { UsersListFilter } from './UsersListFilter'
import { useIntl } from 'react-intl'

const UsersListToolbar = () => {
  const intl = useIntl()
  const { setItemIdForUpdate } = useListView()
  const openAddUserModal = () => {
    setItemIdForUpdate(null)
  }

  return (
    <div className='d-flex justify-content-end' data-kt-user-table-toolbar='base'>
      <UsersListFilter />

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
