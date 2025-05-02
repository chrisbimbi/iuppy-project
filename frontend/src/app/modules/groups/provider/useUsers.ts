// hook para carregar todos os usuários da empresa
import { useState, useEffect } from 'react';
import { UsersService } from 'src/app/modules/users/services/users.service';
import { User } from '@shared/types';

export const useUsers = (companyId: string) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    UsersService.list(companyId)
      .then(setUsers)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [companyId]);

  return { users, loading, error };
};