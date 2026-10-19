import type { InputHTMLAttributes, ReactNode } from 'react';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'className'> {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  labelAction?: ReactNode;
  full?: boolean;
}

/** Icon-free labelled input used by the admin module forms. */
export function TextField({
  id,
  label,
  error,
  hint,
  labelAction,
  full,
  ...inputProps
}: TextFieldProps) {
  const descriptionId = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={`field ${error ? 'field--error' : ''} ${full ? 'field--full' : ''}`}>
      {labelAction ? (
        <div className="field-label-row">
          <label htmlFor={id}>{label}</label>
          {labelAction}
        </div>
      ) : (
        <label htmlFor={id}>{label}</label>
      )}

      <input
        {...inputProps}
        id={id}
        className="form-control"
        aria-describedby={descriptionId}
        aria-invalid={Boolean(error)}
      />

      {error ? (
        <small className="field-message" id={`${id}-error`}>{error}</small>
      ) : hint ? (
        <small className="field-hint" id={`${id}-hint`}>{hint}</small>
      ) : null}
    </div>
  );
}

export default TextField;
