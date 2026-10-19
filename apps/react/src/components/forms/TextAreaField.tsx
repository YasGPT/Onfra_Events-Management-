import type { ReactNode, TextareaHTMLAttributes } from 'react';

export interface TextAreaFieldProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'className'> {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  labelAction?: ReactNode;
  full?: boolean;
}

export function TextAreaField({
  id,
  label,
  error,
  hint,
  labelAction,
  full,
  rows = 4,
  ...textareaProps
}: TextAreaFieldProps) {
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

      <textarea
        {...textareaProps}
        id={id}
        rows={rows}
        className="form-control form-control--area"
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

export default TextAreaField;
