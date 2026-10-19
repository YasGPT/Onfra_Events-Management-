import { Icon } from '../../components/common';
import type { EventContext, User } from '../../types';

export interface SessionCardProps {
  user: User | null;
  event: EventContext | null;
  /** Event name resolved from the events list, since /auth/me only carries the id. */
  activeEventName?: string;
}

/** Confirms which admin account and which event scope the API session is bound to. */
export function SessionCard({ user, event, activeEventName }: SessionCardProps) {
  const rows = [
    { label: 'Administrator', value: user?.name || '—' },
    { label: 'Email', value: user?.email || '—' },
    { label: 'Role', value: user?.role || '—' },
    { label: 'Active event', value: activeEventName || event?.businessCode || '—' },
    { label: 'Business code', value: event?.businessCode || '—' },
  ];

  return (
    <section className="panel">
      <header className="panel__head">
        <span className="panel__icon">
          <Icon name="check" />
        </span>
        <div>
          <h3>Signed-in session</h3>
          <p>Issued by the Confra auth API</p>
        </div>
      </header>

      <dl className="detail-list">
        {rows.map((row) => (
          <div key={row.label} className="detail-list__row">
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default SessionCard;
