import { useState } from 'react';

import { Icon } from '../../components/common';
import { formatDate } from '../../utils';
import type { EventSummary } from '../../types';

export interface EventCardProps {
  event: EventSummary;
  isActive: boolean;
  onOpen: (event: EventSummary) => void;
  onSetAsActive: (event: EventSummary) => void;
}

export function EventCard({ event, isActive, onOpen, onSetAsActive }: EventCardProps) {
  const [copied, setCopied] = useState(false);
  const statusKey = event.is_active === false ? 'inactive' : event.status || 'draft';

  const copyCode = async () => {
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText(event.business_code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <article className={`event-card ${isActive ? 'event-card--active' : ''}`}>
      <header className="event-card__head">
        <div className="event-card__title">
          <h3>{event.name}</h3>
          <span className="code-chip">{event.business_code}</span>
          <button className="event-card__copy" type="button" onClick={copyCode}>
            {copied ? 'Copied' : 'Copy code'}
          </button>
        </div>
        <span className={`status-pill status-pill--${statusKey}`}>{statusKey}</span>
      </header>

      <p className="event-card__desc">{event.description || 'No description saved yet.'}</p>

      <dl className="event-card__meta">
        <div>
          <dt>Dates</dt>
          <dd>{formatDate(event.starts_at)} → {formatDate(event.ends_at)}</dd>
        </div>
        <div>
          <dt>Venue</dt>
          <dd>{event.venue_name || '—'}</dd>
        </div>
        <div>
          <dt>Timezone</dt>
          <dd>{event.timezone || 'UTC'}</dd>
        </div>
      </dl>

      <footer className="event-card__actions">
        <button className="ghost-button ghost-button--primary" type="button" onClick={() => onOpen(event)}>
          Open workspace
          <Icon name="arrow" />
        </button>

        {isActive ? (
          <span className="event-card__badge">
            <Icon name="pin" />
            Active event
          </span>
        ) : (
          <button className="ghost-button" type="button" onClick={() => onSetAsActive(event)}>
            Set as active
          </button>
        )}
      </footer>
    </article>
  );
}

export default EventCard;
