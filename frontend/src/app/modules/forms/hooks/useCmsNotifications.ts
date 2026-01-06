// src/app/modules/forms/hooks/useCmsNotifications.ts
import { useState, useEffect, useCallback } from 'react';
import { api } from 'src/app/api';

export type ActivityItem = {
    id: string;
    title: string;
    message: string;
    count: number;
    createdAt: string;
    link: string;
};

// Helper simples para pegar o companyId (duplicado de api.ts pois não é exportado lá)
function getCompanyId(): string | undefined {
    if (typeof window !== 'undefined') {
        const fromLs = window.localStorage.getItem('companyId');
        if (fromLs) return fromLs;
    }
    return undefined;
}

export function useCmsNotifications() {
    const [badgeCount, setBadgeCount] = useState(0);
    const [items, setItems] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const companyId = getCompanyId();
            const { data } = await api.get('/v2/forms/analytics/badges', {
                params: { companyId }
            });

            setBadgeCount(data.totalNew || 0);

            const rawItems = (data.byForm || []) as any[];
            const mapped: ActivityItem[] = rawItems.map((f: any) => ({
                id: f.formId,
                title: f.title || 'Formulário',
                count: f.newCount,
                message: `${f.newCount} novas interações (SLA/Chat)`,
                createdAt: f.lastSeenAt,
                // Link filtrado para facilitar o trabalho do RH
                link: `/forms/${f.formId}/submissions`,
            }));

            setItems(mapped);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    // Polling a cada 30s
    useEffect(() => {
        fetchData();
        const i = setInterval(fetchData, 30000);
        return () => clearInterval(i);
    }, [fetchData]);

    // Ação de "Resolver": Avisa o backend que o RH viu
    const markAsRead = async (formId: string) => {
        try {
            // Chama endpoint de ACK
            const companyId = getCompanyId();
            await api.post('/v2/forms/analytics/badges/ack', { formId }, {
                params: { companyId }
            });
            // Atualiza localmente instantaneamente
            setItems(prev => prev.filter(i => i.id !== formId));
            setBadgeCount(prev => Math.max(0, prev - 1)); // Aproximação visual
            // Recarrega dados reais em seguida
            fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    return { badgeCount, items, loading, refresh: fetchData, markAsRead };
}