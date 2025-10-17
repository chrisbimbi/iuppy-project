import { useState, useEffect } from 'react';
import { GroupsService } from '../services/groups.service';
import { User } from '@shared/types';

export const useGroupMembers = (groupId: string | null) => {
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const fetch = async () => {
    if (!groupId) return;
    setLoading(true); setError(null);
    try {
      const data = await GroupsService.listMembers(groupId);
      setMembers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch() }, [groupId]);

  return { members, loading, error, refetch: fetch };
};