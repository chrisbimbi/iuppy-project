import React, { useState } from 'react';
import { useTags } from '../provider/useTags';

interface Props {
    value: string[];
    onChange(next: string[]): void;
}

const TagInput: React.FC<Props> = ({ value, onChange }) => {
    const { tags } = useTags();
    const [text, setText] = useState('');
    const filtered = tags.filter(t => t.includes(text) && !value.includes(t));

    const add = (t: string) => {
        onChange([...value, t]);
        setText('');
    };
    const remove = (t: string) => {
        onChange(value.filter(x => x !== t));
    };

    return (
        <div>
            <div className="mb-2 d-flex flex-wrap gap-2">
                {value.map(t => (
                    <span key={t} className="badge bg-secondary">
                        {t}
                        <button type="button" className="btn-close btn-close-white btn-sm ms-1"
                            onClick={() => remove(t)} />
                    </span>
                ))}
            </div>
            <input
                type="text"
                className="form-control"
                placeholder="Digite para buscar tag..."
                value={text}
                onChange={e => setText(e.target.value)}
            />
            {text && (
                <ul className="list-group position-absolute zindex-dropdown w-100 mt-1">
                    {filtered.map(t => (
                        <li key={t} className="list-group-item list-group-item-action"
                            onClick={() => add(t)}>
                            {t}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default TagInput;