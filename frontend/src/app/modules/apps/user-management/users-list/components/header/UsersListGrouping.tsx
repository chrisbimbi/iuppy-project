import { useQueryClient, useMutation } from '@tanstack/react-query'
import { QUERIES } from '../../../../../../..//helpers'
import { useListView } from '../../core/ListViewProvider'
import { useQueryResponse } from '../../core/QueryResponseProvider'
import { deleteSelectedUsers } from '../../core/_requests'
import { useIntl } from 'react-intl'

const UsersListGrouping = () => {
  const intl = useIntl()
  const { selected, clearSelected } = useListView()
  const queryClient = useQueryClient()
  const { query } = useQueryResponse()

  const deleteSelectedItems = useMutation({
    mutationFn: () => deleteSelectedUsers(selected),
    onSuccess: () => {
      // ✅ update detail view directly
      queryClient.invalidateQueries({
        queryKey: [`${QUERIES.USERS_LIST}-${query}`]
      })
      clearSelected()
    }
  });

  return <div className='d-flex justify-content-end align-items-center'>
    <div className='fw-bolder me-5'>
      <span className='me-2'>{selected.length}</span> {intl.formatMessage({ id: 'USER_MANAGEMENT.GROUPING.SELECTED' })}
    </div>

    <button
      type='button'
      className='btn btn-danger'
      onClick={async () => await deleteSelectedItems.mutateAsync()}
    >
      {intl.formatMessage({ id: 'USER_MANAGEMENT.GROUPING.DELETE_SELECTED' })}
    </button>
  </div>
}

export { UsersListGrouping }
