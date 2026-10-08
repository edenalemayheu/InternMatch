/** Input — label + input + error text. Forwards ref. */
import { forwardRef } from 'react';

const Input = forwardRef(function Input({ label, error, helper, className = '', ...props }, ref) {
  return (
    <div className="input-group">
      {label && <label className="input-label">{label}</label>}
      <input
        ref={ref}
        className={`input ${error ? 'input--error' : ''} ${className}`}
        {...props}
      />
      {error  && <span className="input-error-text">{error}</span>}
      {helper && !error && <span className="input-helper">{helper}</span>}
    </div>
  );
});
export default Input;
