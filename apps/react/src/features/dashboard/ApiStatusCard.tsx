import { useEffect, useState } from 'react';

import { Icon } from '../../components/common';
import { checkApiHealth } from '../../services/systemApi';
import type { ApiHealth } from '../../services/systemApi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

/** Live status of the Express backend, proved with a real /api/health call. */
export function ApiStatusCard() {
  const [health, setHealth] = useState<ApiHealth | null>(null);
  const [checking, setChecking] = useState(true);

  const runCheck = () => {
    setChecking(true);
    checkApiHealth()
      .then(setHealth)
      .finally(() => setChecking(false));
  };

  useEffect(() => {
    runCheck();
  }, []);

  const online = Boolean(health?.ok);

  return (
    <section className={`status-card ${online ? 'status-card--online' : 'status-card--offline'}`}>
      <header className="status-card__head">
        <span className="status-dot" aria-hidden="true" />
        <div>
          <h3>Backend connection</h3>
          <p>{online ? 'Connected' : 'Not reachable'}</p>
        </div>
      </header>

      <p className="status-card__message">{health?.message ?? 'Checking API…'}</p>

      <dl className="status-card__meta">
        <div>
          <dt>API base</dt>
          <dd>{API_BASE_URL}</dd>
        </div>
        <div>
          <dt>Health check</dt>
          <dd>/api/health</dd>
        </div>
      </dl>

      <button className="ghost-button" type="button" onClick={runCheck} disabled={checking}>
        <Icon name="refresh" />
        {checking ? 'Rechecking…' : 'Check again'}
      </button>
    </section>
  );
}

export default ApiStatusCard;
