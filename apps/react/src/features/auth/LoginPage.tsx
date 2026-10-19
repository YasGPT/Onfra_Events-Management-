import { Navigate, useLocation } from 'react-router-dom';

import { Brand } from '../../components/common';
import { LoginForm } from '../../components/forms';
import AuthLayout from '../../layouts/AuthLayout';
import { useAppSelector } from '../../app/hooks';
import { LoginShowcase } from './LoginShowcase';

export function LoginPage() {
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const location = useLocation();

  // Already signed in (fresh login or restored session) → go to the workspace.
  if (isAuthenticated && user) {
    const from = (location.state as { from?: string } | null)?.from ?? '/';
    return <Navigate to={from} replace />;
  }

  return (
    <AuthLayout>
      <main className="login-page">
        <LoginShowcase />

        <section className="login-panel">
          <div className="login-panel__inner">
            <Brand variant="dark" />

            <div className="login-heading">
              <span className="login-heading__badge">Admin workspace</span>
              <h2>Welcome back</h2>
              <p>Sign in to manage your events and organization.</p>
            </div>

            <LoginForm />

            <div className="support-note">
              <span>Having trouble signing in?</span>
              <a href="mailto:support@confra.com">Contact support</a>
            </div>
          </div>

          <footer className="login-footer">
            <span>© 2026 CONFRA</span>
            <nav aria-label="Legal links">
              <a href="#privacy">Privacy</a>
              <a href="#terms">Terms</a>
            </nav>
          </footer>
        </section>
      </main>
    </AuthLayout>
  );
}

export default LoginPage;
