import { useState } from 'react';
import { Space } from '@shared/types';
import { spacesService } from '../services/spaces.service';

export function useSpaceActions() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createSpace = async (payload: Partial<Space> & { memberIds?: string[] }) => {
        setLoading(true);
        setError(null);
        try {
            await spacesService.create(payload);
        } catch (err: any) {
            setError(err.message || 'Error creating space');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateSpace = async (id: string, payload: Partial<Space> & { memberIds?: string[] }) => {
        setLoading(true);
        setError(null);
        try {
            await spacesService.update(id, payload);
        } catch (err: any) {
            setError(err.message || 'Error updating space');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteSpace = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            await spacesService.remove(id);
        } catch (err: any) {
            setError(err.message || 'Error deleting space');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        createSpace,
        updateSpace,
        deleteSpace,
        loading,
        error
    };
}
