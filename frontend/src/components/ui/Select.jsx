/** Select — label + select + error. */
export default function Select({ label, error, options = [], placeholder, className = '', ...props }) {
  return (
    <div className="input-group">
      {label && <label className="input-label">{label}</label>}
      <select className={`input ${error ? 'input--error' : ''} ${className}`} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => (
          <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
        ))}
      </select>
      {error && <span className="input-error-text">{error}</span>}
    </div>
  );
}
