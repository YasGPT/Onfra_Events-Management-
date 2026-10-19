// Attendee "create password" screen, opened from the approval email link.
// Public page: no admin session involved, the token in the URL is the credential.
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { TextField } from '../../components/forms';
import apiClient, { ApiError } from '../../services/apiClient';
import type { SetupLinkDetails } from '../../types';
import './setPassword.css';

const MIN_PASSWORD_LENGTH = 8;

type Phase = 'loading' | 'ready' | 'invalid' | 'saving' | 'done';

export function SetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const [phase, setPhase] = useState<Phase>('loading');
  const [details, setDetails] = useState<SetupLinkDetails | null>(null);
  const [problem, setProblem] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldError, setFieldError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!token) {
        setPhase('invalid');
        setProblem('This link is incomplete. Open the password setup link from your email.');
        return;
      }

      try {
        const data = await apiClient.get<SetupLinkDetails>(
          '/public/attendee/setup-link',
          { params: { token }, withAuth: false },
        );
        if (cancelled) return;
        setDetails(data);
        setPhase('ready');
      } catch (error) {
        if (cancelled) return;
        setPhase('invalid');
        setProblem(error instanceof ApiError ? error.message : 'This link is not valid.');
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (password.length < MIN_PASSWORD_LENGTH) {
      setFieldError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setFieldError('Both passwords must match.');
      return;
    }

    setFieldError('');
    setPhase('saving');

    try {
      await apiClient.post('/public/attendee/set-password', { token, password }, { withAuth: false });
      setPhase('done');
    } catch (error) {
      setPhase('ready');
      setFieldError(error instanceof ApiError ? error.message : 'Unable to save the password.');
    }
  };

  return (
    <main className="set-password">
      <div className="set-password__card">
        {/* Wordmark only – an attendee link should not jump into the admin shell. */}
        <span className="brand brand--dark set-password__brand">
          <span className="brand-mark" aria-hidden="true">
            <span className="brand-mark__bar brand-mark__bar--one" />
            <span className="brand-mark__bar brand-mark__bar--two" />
            <span className="brand-mark__bar brand-mark__bar--three" />
          </span>
          <span>CONFRA</span>
        </span>

        {phase === 'loading' ? <p className="set-password__note">Checking your link…</p> : null}

        {phase === 'invalid' ? (
          <>
            <h1>Link not usable</h1>
            <p className="set-password__problem">{problem}</p>
            <p className="set-password__note">
              Ask the event team to send you a new password setup link from the Attendees page.
            </p>
          </>
        ) : null}

        {phase === 'done' ? (
          <>
            <h1>Password created</h1>
            <p className="set-password__note">
              You can now sign in to the attendee app with {' '}
              <strong>{details?.email}</strong> or your mobile number and this password.
            </p>
          </>
        ) : null}

        {(phase === 'ready' || phase === 'saving') && details ? (
          <>
            <span className="set-password__eyebrow">{details.event?.name ?? 'Event'}</span>
            <h1>Create your password</h1>
            <p className="set-password__note">
              Hi {details.full_name}, your registration was approved. Set a password for{' '}
              <strong>{details.email}</strong>.
            </p>

            {details.already_setup ? (
              <p className="set-password__warn">
                A password already exists for this account. Creating a new one will replace it.
              </p>
            ) : null}

            <form className="set-password__form" onSubmit={handleSubmit}>
              <TextField
                id="new-password"
                label="New password"
                type="password"
                autoComplete="new-password"
                minLength={MIN_PASSWORD_LENGTH}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
                error={fieldError || undefined}
                disabled={phase === 'saving'}
                required
              />

              <TextField
                id="confirm-password"
                label="Confirm password"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                disabled={phase === 'saving'}
                required
              />

              <button className="ghost-button ghost-button--primary" type="submit" disabled={phase === 'saving'}>
                {phase === 'saving' ? 'Saving…' : 'Create password'}
              </button>
            </form>

            {details.expires_at ? (
              <p className="set-password__expiry">
                This link stops working on {new Date(details.expires_at).toLocaleString()}.
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </main>
  );
}

export default SetPasswordPage;
