// src/app/modules/news/hooks/useNews.ts
import { useState, useEffect } from 'react';
import { News } from '@shared/types';
import { NewsService } from '../services/news.service';

interface UseNewsProps {
  channelId: string | null;
}

export const useNews = ({ channelId }: UseNewsProps) => {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const data = await NewsService.list(channelId);
        setNews(data);
      } catch (err: any) {
        setError(err.message || 'Erro ao buscar conteúdos.');
      } finally {
        setLoading(false);
      }
    };
    if (channelId !== null) fetchNews();
  }, [channelId, refreshIndex]);

  const refetch = () => setRefreshIndex(i => i + 1);

  return { news, loading, error, refetch };
};