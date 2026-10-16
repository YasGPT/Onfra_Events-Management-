import { Brand } from '../../components/common';
import { LoginForm } from '../../components/forms';
import AuthLayout from '../../layouts/AuthLayout';
import { LoginShowcase } from './LoginShowcase';

export function LoginPage() {
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
