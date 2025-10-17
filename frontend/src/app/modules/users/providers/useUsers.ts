import { useState,useEffect } from 'react';
import { UsersService } from '../services/users.service';
import { User } from '@shared/types';

export const useUsers = (companyId: string) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);

  const fetch = async () => {
    setLoading(true);
    try {
      setUsers(await UsersService.list(companyId));
    } catch(e:any){
      setError(e.message);
    } finally{ setLoading(false); }
  };

  useEffect(()=>{ if(companyId) fetch(); },[companyId]);
  return { users, loading, error, refetch: fetch };
};