import { useState, useEffect } from 'react';
import { ContentService } from '../services/content.service';
import { News } from '@shared/types';

interface UseContentProps {
  channelId: string | null;
}

export const useContent = ({ channelId }: UseContentProps) => {
  const [items, setItems] = useState<News[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    try {
      const data = await ContentService.list(channelId);
      setItems(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, [channelId]);

  return { items, loading, error, refetch: fetch };
};