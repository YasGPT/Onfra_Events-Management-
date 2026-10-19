import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { Icon } from '../../components/common';
import { SelectField } from '../../components/forms';
import type { EventSummary } from '../../types';
import { CreateEventModal } from './CreateEventModal';
import { EventCard } from './EventCard';
import { fetchEvents, selectActiveEvent } from './eventsThunks';
import { useLoadEvents } from './useLoadEvents';
import './events.css';

const statusOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'inactive', label: 'Inactive' },
];

function statusKeyOf(event: EventSummary): string {
  return event.is_active === false ? 'inactive' : event.status || 'draft';
}

/** Event workspace picker: search, filter, create and switch the active event. */
export function EventsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { list, loading, error } = useAppSelector((state) => state.events);
  const activeEvent = useAppSelector((state) => state.activeEvent.event);
  const sessionEventId = useAppSelector((state) => state.auth.event?.id);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);

  useLoadEvents();

  const scopedId = activeEvent?.id ?? sessionEventId ?? null;

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return list.filter((event) => {
      if (status !== 'all' && statusKeyOf(event) !== status) return false;
      if (!term) return true;
      return [event.name, event.business_code, event.venue_name, event.description]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term));
    });
  }, [list, search, status]);

  const openWorkspace = (event: EventSummary) => {
    void dispatch(selectActiveEvent(event));
    navigate('/attendees');
  };

  return (
    <section className="events">
      <header className="page-head">
        <div>
          <span className="page-head__eyebrow">Workspace</span>
          <h1>Events</h1>
          <p>
            {loading
              ? 'Loading events from the API…'
              : `${list.length} event(s) in this account · every module below is scoped to the active one`}
          </p>
        </div>

        <div className="page-head__actions">
          <button
            className="ghost-button"
            type="button"
            onClick={() => void dispatch(fetchEvents())}
            disabled={loading}
          >
            <Icon name="refresh" />
            Refresh
          </button>
          <button className="ghost-button" type="button" onClick={() => setCreateOpen(true)}>
            <Icon name="plus" />
            Quick Dialog
          </button>
          <button className="ghost-button ghost-button--primary" type="button" onClick={() => navigate('/events/new')}>
            <Icon name="plus" />
            Create Event Page
          </button>
        </div>
      </header>

      <div className="panel">
        <div className="toolbar">
          <div className="toolbar__search">
            <Icon name="search" />
            <input
              type="search"
              placeholder="Search by name, code or venue"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search events"
            />
          </div>

          <SelectField
            id="events-status"
            label="Filter by status"
            options={statusOptions}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            hideLabel
          />
        </div>

        {error ? <p className="panel__error">{error}</p> : null}

        {loading && list.length === 0 ? (
          <div className="event-grid">
            {[0, 1, 2].map((key) => (
              <div key={key} className="event-card event-card--skeleton" aria-hidden="true">
                <span /><span /><span />
              </div>
            ))}
          </div>
        ) : visible.length > 0 ? (
          <div className="event-grid">
            {visible.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                isActive={event.id === scopedId}
                onOpen={openWorkspace}
                onSetAsActive={(item) => void dispatch(selectActiveEvent(item))}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <strong>{list.length === 0 ? 'No events yet' : 'Nothing matches this filter'}</strong>
            {list.length === 0
              ? 'Create the first event and the API will provision its own workspace, tiers and access.'
              : 'Try a different search term or set the status filter back to “All statuses”.'}
          </div>
        )}
      </div>

      <CreateEventModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(event) => void dispatch(selectActiveEvent(event))}
      />
    </section>
  );
}

export default EventsPage;
