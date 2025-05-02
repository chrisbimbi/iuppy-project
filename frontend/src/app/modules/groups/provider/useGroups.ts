// frontend/src/app/modules/groups/provider/useGroups.ts
import { useState, useEffect } from 'react'
import { GroupsService } from '../services/groups.service'
import { UserGroup } from '@shared/types'

interface Props { companyId: string }

export const useGroups = ({ companyId }: Props) => {
  const [groups, setGroups] = useState<UserGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = async () => {
    setLoading(true)
    setError(null)
    try {
      setGroups(await GroupsService.list(companyId))
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar grupos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (companyId) fetch()
  }, [companyId])

  return { groups, loading, error, refetch: fetch }
}