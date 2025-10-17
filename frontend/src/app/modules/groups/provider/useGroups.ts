import { useState, useEffect } from 'react';
import { GroupsService } from '../services/groups.service';
import { UserGroup } from '@shared/types';

interface Props {
  companyId: string;
  spaceId?: string;
  channelId?: string;
}

export const useGroups = ({ companyId, spaceId, channelId }: Props) => {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await GroupsService.list(companyId, spaceId, channelId);
      setGroups(list);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar grupos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetch();
    }
  }, [companyId, spaceId, channelId]);

  return { groups, loading, error, refetch: fetch };
};