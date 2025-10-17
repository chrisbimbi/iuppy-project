// src/app/modules/channels/provider/useChannels.ts
import { useEffect, useState } from 'react'
import { ChannelsService } from '../services/channels.service'
import { Channel } from '@shared/types/Channel'

interface Props {
  companyId: string | undefined
  spaceId: string | null
  enabled?: boolean
}

export const useChannels = ({
  companyId,
  spaceId,
  enabled = true,
}: Props) => {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !companyId) return

    setLoading(true)
    setError(null)

    ChannelsService
      .list(companyId, spaceId ?? undefined)
      .then(setChannels)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [companyId, spaceId, enabled])

  return { channels, loading, error }
}