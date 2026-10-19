import { useState } from 'react';
import type { FormEvent } from 'react';

import { Icon } from '../common';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { loginWithCredentials } from '../../features/auth/authThunks';
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
  const dispatch = useAppDispatch();
  const loading = useAppSelector((state) => state.auth.loading);
  const serverError = useAppSelector((state) => state.auth.error);
  const [values, setValues] = useState<LoginFormValues>(initialValues);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const updateField = (field: keyof LoginFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
    if (Object.keys(nextErrors).length > 0) return;

    const result = await dispatch(
      loginWithCredentials({
        businessCode: values.businessCode,
        email: values.email,
        password: values.password,
      }),
    );

    // A successful login flips auth.isAuthenticated, which redirects the
    // /login route to the workspace, so nothing to do here but clear password.
    if (loginWithCredentials.fulfilled.match(result)) {
      setValues((current) => ({ ...current, password: '' }));
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

      <button className="submit-button" type="submit" disabled={loading}>
        <span>{loading ? 'Verifying credentials…' : 'Sign in to Admin Portal'}</span>
        {!loading && <Icon name="arrow" />}
      </button>

      {serverError && (
        <p className="form-status form-status--error" role="alert">
          <Icon name="eye-off" />
          {serverError}
        </p>
      )}
    </form>
  );
}

export default LoginForm;
