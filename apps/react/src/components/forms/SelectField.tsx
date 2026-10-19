import type { ReactNode, SelectHTMLAttributes } from 'react';

export interface SelectFieldOption {
  value: string;
  label: string;
}

export interface SelectFieldProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'className' | 'children'> {
  id: string;
  label: string;
  options: SelectFieldOption[];
  error?: string;
  hint?: string;
  labelAction?: ReactNode;
  full?: boolean;
  /** Keeps the label for screen readers but hides it visually (toolbars, tables). */
  hideLabel?: boolean;
}

/** Labelled select used by the admin module forms. */
export function SelectField({
  id,
  label,
  options,
  error,
  hint,
  labelAction,
  full,
  hideLabel,
  ...selectProps
}: SelectFieldProps) {
  const descriptionId = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={`field ${error ? 'field--error' : ''} ${full ? 'field--full' : ''}`}>
      {labelAction ? (
        <div className="field-label-row">
          <label htmlFor={id}>{label}</label>
          {labelAction}
        </div>
      ) : (
        <label htmlFor={id} className={hideLabel ? 'sr-only' : undefined}>{label}</label>
      )}

      <select
        {...selectProps}
        id={id}
        className="form-control"
        aria-describedby={descriptionId}
        aria-invalid={Boolean(error)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error ? (
        <small className="field-message" id={`${id}-error`}>{error}</small>
      ) : hint ? (
        <small className="field-hint" id={`${id}-hint`}>{hint}</small>
      ) : null}
    </div>
  );
}

export default SelectField;
