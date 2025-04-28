import { useEffect, useState } from 'react';
import { channelsService } from '../services/channels.service';
import { Channel } from '@shared/types';

interface Props {
  companyId: string | undefined;
  spaceId: string | null;
  enabled?: boolean;          // permite desligar a busca se o módulo selecionado não for “News”
}

export const useChannels = ({
  companyId,
  spaceId,
  enabled = true,
}: Props) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !companyId) return;

    setLoading(true);
    setError(null);

    channelsService
      .list(companyId, spaceId)
      .then(setChannels)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [companyId, spaceId, enabled]);

  return { channels, loading, error };
};
