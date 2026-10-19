export interface SplashProps {
  label?: string;
}

/** Full-screen loader used while the session is being restored. */
export function Splash({ label = 'Loading…' }: SplashProps) {
  return (
    <div className="app-splash" role="status" aria-live="polite">
      <span className="app-splash__spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

export default Splash;
