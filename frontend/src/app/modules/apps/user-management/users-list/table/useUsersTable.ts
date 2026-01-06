import { useMemo } from 'react'
import { useReactTable, getCoreRowModel } from '@tanstack/react-table'
import { useQueryResponseData, useQueryResponseLoading } from '../core/QueryResponseProvider'
import { usersColumns } from './columns/_columns'

const useUsersTable = () => {
    const users = useQueryResponseData()
    const isLoading = useQueryResponseLoading()
    const data = useMemo(() => users, [users])
    const columns = useMemo(() => usersColumns, [])
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    return { table, isLoading }
}

export { useUsersTable }
