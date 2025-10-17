import { useState, useEffect } from 'react';
import mockData from '../data/mockData.json';
import { MockData } from '../types/types';

export const useApiData = () => {
  const [data, setData] = useState<MockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simula um delay de rede
        await new Promise(resolve => setTimeout(resolve, 1000));
        setData(mockData as MockData);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
};