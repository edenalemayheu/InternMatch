/** TagInput — multi-tag text input. */
import { useState } from 'react';
import { X } from 'lucide-react';

export default function TagInput({ label, value = [], onChange, placeholder = 'Type and press Enter', error }) {
  const [input, setInput] = useState('');

  function addTag(tag) {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed]);
    setInput('');
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="input-group">
      {label && <label className="input-label">{label}</label>}
      <div className={`tag-input ${error ? 'input--error' : ''}`}
        onClick={() => document.getElementById('tag-input-inner')?.focus()}>
        {value.map(tag => (
          <span key={tag} className="tag-item">
            {tag}
            <button type="button" className="tag-item__remove" onClick={() => onChange(value.filter(t => t !== tag))}>
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          id="tag-input-inner"
          className="tag-input__inner"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={value.length === 0 ? placeholder : ''}
        />
      </div>
      {error && <span className="input-error-text">{error}</span>}
      <span className="input-helper">Press Enter to add a skill</span>
    </div>
  );
}
