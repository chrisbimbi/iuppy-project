// hook de tags (mock)
import { useState, useEffect } from 'react';

const MOCK_TAGS = [
    'role:manager',
    'location:HQ',
    'project:alpha',
    'project:beta',
    'team:field',
];

export const useTags = () => {
    const [tags, setTags] = useState<string[]>([]);
    useEffect(() => {
        // simula fetch
        setTags(MOCK_TAGS);
    }, []);
    return { tags };
};