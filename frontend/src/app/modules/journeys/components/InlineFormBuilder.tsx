import React from 'react';
import FieldEditor, { Field } from '../../forms/components/FieldEditor';

interface InlineFormBuilderProps {
    value: any;
    onChange: (value: any) => void;
    locales: string[];
}

export const InlineFormBuilder: React.FC<InlineFormBuilderProps> = ({ value, onChange, locales }) => {
    const fields = value?.fields || [];
    const settings = value || {};

    const handleFieldsChange = (newFields: Field[]) => {
        onChange({ ...settings, fields: newFields });
    };

    const handleSettingChange = (key: string, val: any) => {
        onChange({ ...settings, [key]: val });
    };

    return (
        <div className="border rounded p-4 bg-light">
            <h5 className="mb-4">Form Configuration</h5>

            <div className="mb-4">
                <div className="form-check form-switch">
                    <input
                        id="allowAttachments"
                        className="form-check-input"
                        type="checkbox"
                        checked={!!settings.attachmentsAllowed}
                        onChange={(e) => handleSettingChange('attachmentsAllowed', e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="allowAttachments">Allow Attachments</label>
                </div>
            </div>

            <FieldEditor
                fields={fields}
                onChange={handleFieldsChange}
                locales={locales}
            />
        </div>
    );
};
