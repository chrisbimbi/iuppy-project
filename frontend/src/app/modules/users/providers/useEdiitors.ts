import { useState, useEffect } from 'react';
import { UsersService } from '../services/users.service';
import { User } from '@shared/types';

export const useEditors = (companyId: string) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const editors = await UsersService.listEditors(companyId);
      setUsers(editors);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, [companyId]);

  return { users, loading, error, refetch: fetch };
};