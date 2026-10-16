import type { InputHTMLAttributes, ReactNode } from 'react';

import { Icon } from '../common';
import type { IconName } from '../common';

export interface FormFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  id: string;
  label: string;
  icon: IconName;
  error?: string;
  hint?: string;
  labelAction?: ReactNode;
  endAdornment?: ReactNode;
}

export function FormField({
  id,
  label,
  icon,
  error,
  hint,
  labelAction,
  endAdornment,
  ...inputProps
}: FormFieldProps) {
  const descriptionId = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={`field ${error ? 'field--error' : ''}`}>
      {labelAction ? (
        <div className="field-label-row">
          <label htmlFor={id}>{label}</label>
          {labelAction}
        </div>
      ) : (
        <label htmlFor={id}>{label}</label>
      )}

      <div className="field-control">
        <span className="field-icon"><Icon name={icon} /></span>
        <input
          {...inputProps}
          id={id}
          aria-describedby={descriptionId}
          aria-invalid={Boolean(error)}
        />
        {endAdornment}
      </div>

      {error ? (
        <small className="field-message" id={`${id}-error`}>{error}</small>
      ) : hint ? (
        <small className="field-hint" id={`${id}-hint`}>{hint}</small>
      ) : null}
    </div>
  );
}

export default FormField;
