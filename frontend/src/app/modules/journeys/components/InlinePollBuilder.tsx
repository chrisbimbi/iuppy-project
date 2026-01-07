import React from 'react';
import { KTSVG } from '../../../../helpers';
import FieldEditor, { Field } from '../../forms/components/FieldEditor';

interface InlinePollBuilderProps {
    value: any;
    onChange: (value: any) => void;
}

export const InlinePollBuilder: React.FC<InlinePollBuilderProps> = ({ value, onChange }) => {
    // Map PollConfig (simple) to Field[] (complex)
    // PollConfig: { question: string, options: string[] }
    // Field: { id, type='single_choice', label={pt-BR: question}, options=[{id, label:{pt-BR: option}}] }

    const question = value?.question || '';
    const options: string[] = value?.options || ['', ''];

    const fields: Field[] = [{
        id: 'poll_field',
        type: 'single_choice',
        label: { 'pt-BR': question, 'en': question, 'es-ES': question }, // Sync all or just pt-BR? Let's use pt-BR as primary for legacy
        required: true,
        order: 0,
        options: options.map((opt, idx) => ({
            id: `opt_${idx}`,
            label: { 'pt-BR': opt, 'en': opt, 'es-ES': opt }
        }))
    }];

    const handleFieldsChange = (newFields: Field[]) => {
        if (newFields.length === 0) {
            // Should not happen if we don't allow delete, but if it does:
            onChange({ question: '', options: [] });
            return;
        }

        const f = newFields[0];
        // Extract question from pt-BR label (or first available)
        const q = f.label['pt-BR'] || Object.values(f.label)[0] || '';

        // Extract options
        const opts = (f.options || []).map(o => o.label['pt-BR'] || Object.values(o.label)[0] || '');

        onChange({
            question: q,
            options: opts
        });
    };

    return (
        <div className="border rounded p-4 bg-light">
            <h5 className="mb-4">Poll Configuration</h5>

            <FieldEditor
                fields={fields}
                onChange={handleFieldsChange}
                locales={['pt-BR']} // Polls (Legacy) seem to be single language mostly? Or should we expose others?
                // User said "Poll module 'original'". If original supports only string, then it's single language.
                // We'll show only pt-BR to avoid confusion, or if the user wants full multi-lang support later we can add.
                // For now, let's stick to pt-BR as the interface to the simple string.
                allowedTypes={['single_choice']}
                maxFields={1}
            />
        </div>
    );
};
