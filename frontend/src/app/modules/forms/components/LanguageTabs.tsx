// src/app/modules/forms/components/LanguageTabs.tsx
import React, { useState } from 'react';
import { Form, Tabs, Tab } from 'react-bootstrap';
import { TranslatableString } from '../services/api'; // (Este tipo virá do próximo arquivo)

type Props = {
    locales: string[];
    values: TranslatableString;
    onChange: (locale: string, value: string) => void;
    as?: 'input' | 'textarea';
};

/**
 * Componente de UI para campos traduzíveis (Fase 3)
 */
export default function LanguageTabs({
    locales,
    values,
    onChange,
    as = 'input',
}: Props) {
    const [activeLocale, setActiveLocale] = useState(locales[0] || 'pt-BR');

    return (
        <Tabs
            activeKey={activeLocale}
            onSelect={(k) => setActiveLocale(k || 'pt-BR')}
            className="mb-2"
            variant="pills"
            unmountOnExit
        >
            {locales.map((locale) => (
                <Tab eventKey={locale} title={locale.toUpperCase()} key={locale}>
                    <Form.Control
                        as={as as any} // 'input' ou 'textarea'
                        rows={as === 'textarea' ? 3 : undefined}
                        value={values[locale] || ''}
                        onChange={(e) => onChange(locale, e.target.value)}
                    />
                </Tab>
            ))}
        </Tabs>
    );
}