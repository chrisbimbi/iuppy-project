// frontend/src/hooks/useSpaces.ts
import { useState, useEffect } from 'react';
import { Space } from '@shared/types';
import { spacesService } from '../services/spaces.service';

export function useSpaces(companyId: string) {
    const [data, setData] = useState<Space[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        setLoading(true);
        spacesService.list(companyId)
            .then(setData)
            .catch(err => setError(err))
            .finally(() => setLoading(false));
    }, [companyId]);

    return { data, loading, error };
}
