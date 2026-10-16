import { useState } from 'react';
import type { FormEvent } from 'react';

import { Icon } from '../common';
import { isValidEmail } from '../../utils';
import { FormField } from './FormField';

type LoginFormValues = {
  businessCode: string;
  email: string;
  password: string;
};

type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;

const initialValues: LoginFormValues = {
  businessCode: '',
  email: '',
  password: '',
};

export function LoginForm() {
  const [values, setValues] = useState<LoginFormValues>(initialValues);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [status, setStatus] = useState('');

  const updateField = (field: keyof LoginFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setStatus('');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: LoginFormErrors = {};
    if (values.businessCode.trim().length < 3) {
      nextErrors.businessCode = 'Enter the business code provided by your organization.';
    }
    if (!isValidEmail(values.email.trim())) {
      nextErrors.email = 'Enter a valid work email address.';
    }
    if (values.password.length < 6) {
      nextErrors.password = 'Password must contain at least 6 characters.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      setStatus('Your sign-in details are ready for secure verification.');
    }
  };

  return (
    <form className="login-form" onSubmit={handleSubmit} noValidate>
      <FormField
        id="business-code"
        label="Business code"
        icon="building"
        name="businessCode"
        value={values.businessCode}
        onChange={(event) => updateField('businessCode', event.target.value.toUpperCase())}
        placeholder="e.g. CONFRA-2026"
        autoComplete="organization"
        spellCheck="false"
        hint="Use the code shared by your organization"
        error={errors.businessCode}
      />

      <FormField
        id="email"
        label="Work email"
        icon="mail"
        name="email"
        type="email"
        value={values.email}
        onChange={(event) => updateField('email', event.target.value)}
        placeholder="you@company.com"
        autoComplete="email"
        error={errors.email}
      />

      <FormField
        id="password"
        label="Password"
        icon="lock"
        name="password"
        type={showPassword ? 'text' : 'password'}
        value={values.password}
        onChange={(event) => updateField('password', event.target.value)}
        placeholder="Enter your password"
        autoComplete="current-password"
        error={errors.password}
        labelAction={<a href="#forgot-password">Forgot password?</a>}
        endAdornment={(
          <button
            className="password-toggle"
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <Icon name={showPassword ? 'eye-off' : 'eye'} />
          </button>
        )}
      />

      <label className="remember-option">
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(event) => setRememberMe(event.target.checked)}
        />
        <span className="custom-checkbox"><Icon name="check" /></span>
        Keep me signed in on this device
      </label>

      <button className="submit-button" type="submit">
        <span>Sign in to workspace</span>
        <Icon name="arrow" />
      </button>

      {status && (
        <p className="form-status" role="status">
          <Icon name="check" />
          {status}
        </p>
      )}
    </form>
  );
}

export default LoginForm;
