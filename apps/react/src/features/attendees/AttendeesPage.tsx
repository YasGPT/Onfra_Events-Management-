import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { Icon } from '../../components/common';
import type { Attendee } from '../../types';
import { useActiveEvent } from '../events';
import { AttendeesTable } from './AttendeesTable';
import { RegisterAttendeeModal } from './RegisterAttendeeModal';
import { fetchAttendees, toggleAttendeeStatus } from './attendeesThunks';
import { clearAttendees } from './attendeesSlice';
import './attendees.css';

/** Attendee CRUD screen for whichever event the admin has active. */
export function AttendeesPage() {
  const dispatch = useAppDispatch();
  const activeEvent = useActiveEvent();
  const { items, loading, error, updatingId } = useAppSelector((state) => state.attendees);

  const [searchDraft, setSearchDraft] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [revision, setRevision] = useState(0);
  const [registerOpen, setRegisterOpen] = useState(false);

  const eventId = activeEvent?.id ?? '';

  useEffect(() => {
    if (!eventId) {
      dispatch(clearAttendees());
      return;
    }
    void dispatch(fetchAttendees({ eventId, search: appliedSearch || undefined }));
  }, [dispatch, eventId, appliedSearch, revision]);

  const handleToggle = (attendee: Attendee) => {
    void dispatch(toggleAttendeeStatus({ eventId, attendeeId: attendee.id, isActive: !attendee.is_active }));
  };

  const activeCount = items.filter((item) => item.is_active).length;

  if (!activeEvent) {
    return (
      <section className="attendees">
        <header className="page-head">
          <div>
            <span className="page-head__eyebrow">Attendees</span>
            <h1>Attendees</h1>
          </div>
        </header>

        <div className="empty-state">
          <strong>No active event selected</strong>
          Attendees are stored per event. Pick an event first and this screen will load its directory.
          <div className="empty-state__action">
            <NavLink className="ghost-button ghost-button--primary" to="/events">
              <Icon name="calendar" />
              Go to Events
            </NavLink>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="attendees">
      <header className="page-head">
        <div>
          <span className="page-head__eyebrow">{activeEvent.businessCode}</span>
          <h1>Attendees</h1>
          <p>
            {loading
              ? 'Loading the directory from the API…'
              : `${items.length} attendee record(s) in ${activeEvent.name} · ${activeCount} active`}
          </p>
        </div>

        <div className="page-head__actions">
          <button className="ghost-button ghost-button--primary" type="button" onClick={() => setRegisterOpen(true)}>
            <Icon name="plus" />
            Register attendee
          </button>
        </div>
      </header>

      <div className="panel">
        <form
          className="toolbar"
          onSubmit={(event) => {
            event.preventDefault();
            setAppliedSearch(searchDraft.trim());
          }}
        >
          <div className="toolbar__search">
            <Icon name="search" />
            <input
              type="search"
              placeholder="Search name, email or company"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              aria-label="Search attendees"
            />
          </div>

          <button className="ghost-button" type="submit" disabled={loading}>
            <Icon name="search" />
            Search
          </button>

          {appliedSearch ? (
            <button
              className="ghost-button"
              type="button"
              onClick={() => {
                setSearchDraft('');
                setAppliedSearch('');
              }}
            >
              Clear
            </button>
          ) : null}

          <button
            className="ghost-button"
            type="button"
            onClick={() => setRevision((current) => current + 1)}
            disabled={loading}
          >
            <Icon name="refresh" />
            Refresh
          </button>
        </form>

        {error ? <p className="panel__error">{error}</p> : null}

        <AttendeesTable
          attendees={items}
          loading={loading}
          search={appliedSearch}
          eventId={activeEvent.id}
          updatingId={updatingId}
          onToggle={handleToggle}
        />
      </div>

      <RegisterAttendeeModal
        open={registerOpen}
        eventId={activeEvent.id}
        eventName={activeEvent.name}
        onClose={() => setRegisterOpen(false)}
      />
    </section>
  );
}

export default AttendeesPage;
