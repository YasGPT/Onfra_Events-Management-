import { Icon } from '../../components/common';
import { formatDate } from '../../utils';
import type { EventSummary } from '../../types';

export interface EventListPanelProps {
  events: EventSummary[];
  loading: boolean;
  error: string | null;
  activeEventId?: string | null;
  onReload: () => void;
}

/** Events returned by `GET /api/v1/events` for the signed-in admin. */
export function EventListPanel({
  events,
  loading,
  error,
  activeEventId,
  onReload,
}: EventListPanelProps) {
  return (
    <section className="panel panel--wide">
      <header className="panel__head">
        <span className="panel__icon">
          <Icon name="calendar" />
        </span>
        <div>
          <h3>Your events</h3>
          <p>{loading ? 'Loading from the API…' : `${events.length} event(s) in this account`}</p>
        </div>
        <button className="ghost-button ghost-button--inline" type="button" onClick={onReload} disabled={loading}>
          <Icon name="refresh" />
          Refresh
        </button>
      </header>

      {error ? (
        <p className="panel__error">{error}</p>
      ) : (
        <ul className="event-list">
          {events.map((event) => (
            <li
              key={event.id}
              className={`event-list__item ${event.id === activeEventId ? 'event-list__item--active' : ''}`}
            >
              <div className="event-list__main">
                <strong>{event.name}</strong>
                <span className="code-chip">{event.business_code}</span>
              </div>
              <div className="event-list__meta">
                <span>{formatDate(event.starts_at)} → {formatDate(event.ends_at)}</span>
                <span className={`status-pill status-pill--${event.status || 'draft'}`}>
                  {event.is_active === false ? 'inactive' : event.status || 'draft'}
                </span>
              </div>
            </li>
          ))}

          {!loading && events.length === 0 && (
            <li className="event-list__empty">No events are assigned to this administrator yet.</li>
          )}
        </ul>
      )}
    </section>
  );
}

export default EventListPanel;
