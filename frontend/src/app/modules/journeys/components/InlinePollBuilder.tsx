import React from 'react';
import { KTSVG } from '../../../../helpers';

interface InlinePollBuilderProps {
    value: any;
    onChange: (value: any) => void;
}

export const InlinePollBuilder: React.FC<InlinePollBuilderProps> = ({ value, onChange }) => {
    const question = value?.question || '';
    const options = value?.options || ['', ''];

    const handleQuestionChange = (val: string) => {
        onChange({ ...value, question: val });
    };

    const handleOptionChange = (index: number, val: string) => {
        const newOptions = [...options];
        newOptions[index] = val;
        onChange({ ...value, options: newOptions });
    };

    const addOption = () => {
        onChange({ ...value, options: [...options, ''] });
    };

    const removeOption = (index: number) => {
        const newOptions = options.filter((_: string, i: number) => i !== index);
        onChange({ ...value, options: newOptions });
    };

    return (
        <div className="border rounded p-4 bg-light">
            <h5 className="mb-4">Poll Configuration</h5>

            <div className="mb-4">
                <label className="form-label required">Question</label>
                <input
                    type="text"
                    className="form-control"
                    value={question}
                    onChange={(e) => handleQuestionChange(e.target.value)}
                    placeholder="Enter your question"
                />
            </div>

            <div className="mb-4">
                <label className="form-label required">Options</label>
                {options.map((opt: string, idx: number) => (
                    <div key={idx} className="d-flex gap-2 mb-2">
                        <input
                            type="text"
                            className="form-control"
                            value={opt}
                            onChange={(e) => handleOptionChange(idx, e.target.value)}
                            placeholder={`Option ${idx + 1}`}
                        />
                        {options.length > 2 && (
                            <button
                                type="button"
                                className="btn btn-icon btn-light-danger"
                                onClick={() => removeOption(idx)}
                            >
                                <i className="ki-duotone ki-trash fs-2"></i>
                            </button>
                        )}
                    </div>
                ))}
                <button
                    type="button"
                    className="btn btn-light-primary btn-sm mt-2"
                    onClick={addOption}
                >
                    <KTSVG path="/media/icons/duotune/arrows/arr075.svg" className="svg-icon-2" />
                    Add Option
                </button>
            </div>
        </div>
    );
};
