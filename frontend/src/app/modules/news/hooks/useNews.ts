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

  useEffect(() => {
    const fetchNews = async () => {
      if (!channelId) {
        setNews([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data: News[] = await NewsService.getNews();

        // Filtrar news pelo canal selecionado
        const filtered = data.filter((news) => news.channelId === channelId);

        // Garantir que settings e targetAudience sejam válidos
        const mappedNews = filtered.map((news) => ({
          ...news,
          settings: {
            ...news.settings,
            targetAudience: Array.isArray(news.settings?.targetAudience)
              ? news.settings.targetAudience
              : [], // Garante que seja um array
            moderateComments: news.settings?.moderateComments ?? false,
            allowReactions: news.settings?.allowReactions ?? false,
            pushNotification: news.settings?.pushNotification ?? false,
          },
        }));

        setNews(mappedNews);
      } catch (err: any) {
        setError(err?.message || 'Erro ao buscar news.'); // Fallback seguro para erros
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [channelId]); // Executa o efeito apenas quando channelId mudar

  return { news, loading, error };
};