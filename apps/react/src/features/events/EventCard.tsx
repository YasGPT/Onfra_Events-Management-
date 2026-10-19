import { useState } from 'react';

import { Icon } from '../../components/common';
import { formatDate } from '../../utils';
import type { EventSummary } from '../../types';

export interface EventCardProps {
  event: EventSummary;
  isActive: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onView: (event: EventSummary) => void;
  onEdit: (event: EventSummary) => void;
  onDelete: (event: EventSummary) => void;
  onOpen: (event: EventSummary) => void;
  onSetAsActive: (event: EventSummary) => void;
  onSettings?: (event: EventSummary) => void;
}

export function EventCard({
  event,
  isActive,
  isSelected = false,
  onToggleSelect,
  onView,
  onEdit,
  onDelete,
  onOpen,
  onSetAsActive,
  onSettings,
}: EventCardProps) {
  const [copied, setCopied] = useState(false);
  const statusKey = event.is_active === false ? 'inactive' : event.status || 'draft';

  const copyCode = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText(event.business_code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <article className={`event-card ${isActive ? 'event-card--active' : ''} ${isSelected ? 'event-card--selected' : ''}`}>
      <header className="event-card__head">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(event.id)}
              style={{ width: '17px', height: '17px', marginTop: '2px', cursor: 'pointer', accentColor: 'var(--blue)' }}
              aria-label={`Select ${event.name}`}
            />
          )}
          <div className="event-card__title">
            <h3 style={{ cursor: 'pointer' }} onClick={() => onView(event)}>
              {event.name}
            </h3>
            <span className="code-chip">{event.business_code}</span>
            <button className="event-card__copy" type="button" onClick={copyCode}>
              {copied ? 'Copied' : 'Copy code'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={`status-pill status-pill--${statusKey}`}>{statusKey}</span>
        </div>
      </header>

      <p className="event-card__desc" onClick={() => onView(event)} style={{ cursor: 'pointer' }}>
        {event.description || 'No description saved yet.'}
      </p>

      <dl className="event-card__meta" onClick={() => onView(event)} style={{ cursor: 'pointer' }}>
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

      <footer className="event-card__actions" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            className="ghost-button"
            type="button"
            onClick={() => onView(event)}
            title="View details"
            style={{ padding: '6px 10px', fontSize: '12px' }}
          >
            <Icon name="eye" />
            View
          </button>
          <button
            className="ghost-button"
            type="button"
            onClick={() => onEdit(event)}
            title="Edit event"
            style={{ padding: '6px 10px', fontSize: '12px' }}
          >
            <Icon name="edit" />
            Edit
          </button>
          {onSettings && (
            <button
              className="ghost-button"
              type="button"
              onClick={() => onSettings(event)}
              title="Event Feature Toggles & Registration Settings"
              style={{ padding: '6px 10px', fontSize: '12px' }}
            >
              <Icon name="shield" />
              Settings
            </button>
          )}
          <button
            className="ghost-button"
            type="button"
            onClick={() => onDelete(event)}
            title="Delete event"
            style={{ padding: '6px 10px', fontSize: '12px', color: '#d64555' }}
          >
            <Icon name="trash" />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isActive ? (
            <span className="event-card__badge">
              <Icon name="pin" />
              Active
            </span>
          ) : (
            <button
              className="ghost-button"
              type="button"
              onClick={() => onSetAsActive(event)}
              style={{ fontSize: '12px' }}
            >
              Set active
            </button>
          )}

          <button
            className="ghost-button ghost-button--primary"
            type="button"
            onClick={() => onOpen(event)}
            style={{ fontSize: '12px' }}
          >
            Manage
            <Icon name="arrow" />
          </button>
        </div>
      </footer>
    </article>
  );
}

export default EventCard;
