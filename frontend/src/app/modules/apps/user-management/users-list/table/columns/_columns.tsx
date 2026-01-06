import { ColumnDef } from '@tanstack/react-table'
import { UserInfoCell } from './UserInfoCell'
import { UserLastLoginCell } from './UserLastLoginCell'
import { UserTwoStepsCell } from './UserTwoStepsCell'
import { UserActionsCell } from './UserActionsCell'
import { UserSelectionCell } from './UserSelectionCell'
import { UserCustomHeader } from './UserCustomHeader'
import { UserSelectionHeader } from './UserSelectionHeader'
import { User } from '../../core/_models'
import { useIntl } from 'react-intl'

const usersColumns: ColumnDef<User>[] = [
  {
    header: () => <UserSelectionHeader />,
    id: 'selection',
    cell: (info) => <UserSelectionCell id={info.row.original.id} />,
  },
  {
    header: (props) => {
      const intl = useIntl()
      return <UserCustomHeader tableProps={props} title={intl.formatMessage({ id: 'USER_MANAGEMENT.TABLE.HEADER.NAME' })} className='min-w-125px' />
    },
    id: 'name',
    cell: (info) => <UserInfoCell user={info.row.original} />,
  },
  {
    header: (props) => {
      const intl = useIntl()
      return <UserCustomHeader tableProps={props} title={intl.formatMessage({ id: 'USER_MANAGEMENT.TABLE.HEADER.ROLE' })} className='min-w-125px' />
    },
    accessorKey: 'role',
  },
  {
    header: (props) => {
      const intl = useIntl()
      return <UserCustomHeader tableProps={props} title={intl.formatMessage({ id: 'USER_MANAGEMENT.TABLE.HEADER.LAST_LOGIN' })} className='min-w-125px' />
    },
    id: 'last_login',
    cell: (info) => <UserLastLoginCell last_login={info.row.original.last_login} />,
  },
  {
    header: (props) => {
      const intl = useIntl()
      return <UserCustomHeader tableProps={props} title={intl.formatMessage({ id: 'USER_MANAGEMENT.TABLE.HEADER.TWO_STEPS' })} className='min-w-125px' />
    },
    id: 'two_steps',
    cell: (info) => <UserTwoStepsCell two_steps={info.row.original.two_steps} />,
  },
  {
    header: (props) => {
      const intl = useIntl()
      return <UserCustomHeader tableProps={props} title={intl.formatMessage({ id: 'USER_MANAGEMENT.TABLE.HEADER.JOINED_DAY' })} className='min-w-125px' />
    },
    accessorKey: 'joined_day',
  },
  {
    header: (props) => {
      const intl = useIntl()
      return <UserCustomHeader tableProps={props} title={intl.formatMessage({ id: 'USER_MANAGEMENT.TABLE.HEADER.ACTIONS' })} className='text-end min-w-100px' />
    },
    id: 'actions',
    cell: (info) => <UserActionsCell id={info.row.original.id} />,
  },
]

export { usersColumns }
