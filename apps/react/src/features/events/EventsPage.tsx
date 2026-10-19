import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { Icon, Modal } from '../../components/common';
import { SelectField } from '../../components/forms';
import type { EventSummary } from '../../types';
import { EventCard } from './EventCard';
import { EventViewModal } from './EventViewModal';
import { EditEventModal } from './EditEventModal';
import { EventSettingsModal } from './EventSettingsModal';
import { bulkDeleteEvents, deleteEvent, fetchEvents, selectActiveEvent } from './eventsThunks';
import { useLoadEvents } from './useLoadEvents';
import './events.css';

const statusOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'inactive', label: 'Inactive' },
];

function statusKeyOf(event: EventSummary): string {
  return event.is_active === false ? 'inactive' : event.status || 'draft';
}

/** Event workspace picker: search, filter, select, view, edit, single delete, bulk delete, and switch active event. */
export function EventsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { list, loading, error } = useAppSelector((state) => state.events);
  const activeEvent = useAppSelector((state) => state.activeEvent.event);
  const sessionEventId = useAppSelector((state) => state.auth.event?.id);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal states
  const [viewingEvent, setViewingEvent] = useState<EventSummary | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventSummary | null>(null);
  const [settingsEvent, setSettingsEvent] = useState<EventSummary | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<EventSummary | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

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

  const handleManageEvent = (event: EventSummary) => {
    void dispatch(selectActiveEvent(event));
    navigate('/attendees');
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === visible.length && visible.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visible.map((e) => e.id)));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingEvent) return;
    setActionLoading(true);
    await dispatch(deleteEvent(deletingEvent.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(deletingEvent.id);
      return next;
    });
    setActionLoading(false);
    setDeletingEvent(null);
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedIds.size === 0) return;
    setActionLoading(true);
    await dispatch(bulkDeleteEvents(Array.from(selectedIds)));
    setSelectedIds(new Set());
    setActionLoading(false);
    setBulkDeleteOpen(false);
  };

  const allSelected = visible.length > 0 && selectedIds.size === visible.length;

  return (
    <section className="events">
      <header className="page-head">
        <div>
          <span className="page-head__eyebrow">Admin Portal</span>
          <h1>Events</h1>
          <p>
            {loading
              ? 'Loading events from the API…'
              : `${list.length} event(s) in this account · every module is scoped to the active one`}
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
          <button
            className="ghost-button ghost-button--primary"
            type="button"
            onClick={() => navigate('/events/new')}
          >
            <Icon name="plus" />
            Create Event
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

          {visible.length > 0 && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={handleToggleSelectAll}
                style={{ width: '17px', height: '17px', cursor: 'pointer', accentColor: 'var(--blue)' }}
              />
              Select All
            </label>
          )}
        </div>

        {/* Bulk Action Toolbar */}
        {selectedIds.size > 0 && (
          <div className="bulk-toolbar">
            <div className="bulk-toolbar__info">
              <Icon name="check" />
              <span><strong>{selectedIds.size}</strong> event(s) selected</span>
            </div>
            <div className="bulk-toolbar__actions">
              <button
                type="button"
                className="ghost-button"
                style={{ fontSize: '12.5px', padding: '6px 12px' }}
                onClick={() => setSelectedIds(new Set())}
              >
                Deselect All
              </button>
              <button
                type="button"
                className="ghost-button"
                style={{ fontSize: '12.5px', padding: '6px 12px', color: '#d64555' }}
                onClick={() => setBulkDeleteOpen(true)}
              >
                <Icon name="trash" />
                Delete Selected ({selectedIds.size})
              </button>
            </div>
          </div>
        )}

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
                isSelected={selectedIds.has(event.id)}
                onToggleSelect={handleToggleSelect}
                onView={(item) => setViewingEvent(item)}
                onEdit={(item) => setEditingEvent(item)}
                onSettings={(item) => setSettingsEvent(item)}
                onDelete={(item) => setDeletingEvent(item)}
                onOpen={handleManageEvent}
                onSetAsActive={(item) => void dispatch(selectActiveEvent(item))}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <strong>{list.length === 0 ? 'No events yet' : 'Nothing matches this filter'}</strong>
            {list.length === 0
              ? 'Create your first event to get started.'
              : 'Try a different search term or set the status filter back to “All statuses”.'}
            {list.length === 0 && (
              <div className="empty-state__action" style={{ marginTop: '16px' }}>
                <button
                  className="ghost-button ghost-button--primary"
                  type="button"
                  onClick={() => navigate('/events/new')}
                >
                  <Icon name="plus" />
                  Create First Event
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Single View Modal */}
      <EventViewModal
        event={viewingEvent}
        open={Boolean(viewingEvent)}
        onClose={() => setViewingEvent(null)}
        onEdit={(item) => setEditingEvent(item)}
        onDelete={(item) => setDeletingEvent(item)}
        onManageEvent={handleManageEvent}
      />

      {/* Edit Event Modal */}
      <EditEventModal
        event={editingEvent}
        open={Boolean(editingEvent)}
        onClose={() => setEditingEvent(null)}
        onUpdated={(updated) => {
          if (viewingEvent?.id === updated.id) {
            setViewingEvent(updated);
          }
        }}
      />

      {/* Single Delete Confirmation Modal */}
      <Modal
        title="Delete Event"
        subtitle={deletingEvent ? `Are you sure you want to delete "${deletingEvent.name}"?` : ''}
        open={Boolean(deletingEvent)}
        onClose={() => setDeletingEvent(null)}
        footer={(
          <>
            <button
              type="button"
              className="ghost-button"
              onClick={() => setDeletingEvent(null)}
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="ghost-button"
              style={{ background: '#d64555', color: '#ffffff', borderColor: '#d64555' }}
              onClick={handleDeleteConfirm}
              disabled={actionLoading}
            >
              {actionLoading ? 'Deleting…' : 'Delete Event'}
            </button>
          </>
        )}
      >
        <p style={{ margin: 0, fontSize: '13.5px', color: '#475569', lineHeight: 1.5 }}>
          This will permanently delete the event and its associated schedule, venue references, and tiers.
          This action cannot be undone.
        </p>
      </Modal>

      {/* Bulk Delete Confirmation Modal */}
      <Modal
        title="Delete Selected Events"
        subtitle={`Are you sure you want to delete ${selectedIds.size} event(s)?`}
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        footer={(
          <>
            <button
              type="button"
              className="ghost-button"
              onClick={() => setBulkDeleteOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="ghost-button"
              style={{ background: '#d64555', color: '#ffffff', borderColor: '#d64555' }}
              onClick={handleBulkDeleteConfirm}
              disabled={actionLoading}
            >
              {actionLoading ? 'Deleting…' : `Delete ${selectedIds.size} Events`}
            </button>
          </>
        )}
      >
        <p style={{ margin: 0, fontSize: '13.5px', color: '#475569', lineHeight: 1.5 }}>
          This action cannot be undone. All {selectedIds.size} selected events and their associated data will be permanently removed.
        </p>
      </Modal>

      {/* Event Settings Modal */}
      {settingsEvent && (
        <EventSettingsModal
          isOpen={Boolean(settingsEvent)}
          onClose={() => setSettingsEvent(null)}
          eventId={settingsEvent.id}
          eventName={settingsEvent.name}
        />
      )}
    </section>
  );
}

export default EventsPage;
