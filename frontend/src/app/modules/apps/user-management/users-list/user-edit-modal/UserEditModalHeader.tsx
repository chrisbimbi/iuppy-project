import { KTIcon } from '../../../../../..//helpers'
import { useListView } from '../core/ListViewProvider'
import { useIntl } from 'react-intl'

const UserEditModalHeader = () => {
  const intl = useIntl()
  const { setItemIdForUpdate } = useListView()

  return (
    <div className='modal-header'>
      {/* begin::Modal title */}
      <h2 className='fw-bolder'>{intl.formatMessage({ id: 'USER_MANAGEMENT.EDIT_MODAL.TITLE' })}</h2>
      {/* end::Modal title */}

      {/* begin::Close */}
      <div
        className='btn btn-icon btn-sm btn-active-icon-primary'
        data-kt-users-modal-action='close'
        onClick={() => setItemIdForUpdate(undefined)}
        style={{ cursor: 'pointer' }}
      >
        <KTIcon iconName='cross' className='fs-1' />
      </div>
      {/* end::Close */}
    </div>
  )
}

export { UserEditModalHeader }
