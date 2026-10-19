import { Modal, Icon } from '../../components/common';
import type { EventSummary } from '../../types';
import { formatDate } from '../../utils';

export interface EventViewModalProps {
  event: EventSummary | null;
  open: boolean;
  onClose: () => void;
  onEdit: (event: EventSummary) => void;
  onDelete: (event: EventSummary) => void;
  onManageEvent: (event: EventSummary) => void;
}

export function EventViewModal({
  event,
  open,
  onClose,
  onEdit,
  onDelete,
  onManageEvent,
}: EventViewModalProps) {
  if (!event) return null;

  const statusKey = event.is_active === false ? 'inactive' : event.status || 'draft';

  return (
    <Modal
      title={event.name}
      subtitle={`Business Code: ${event.business_code}`}
      open={open}
      onClose={onClose}
      footer={(
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <button
            type="button"
            className="ghost-button"
            style={{ color: '#d64555' }}
            onClick={() => {
              onClose();
              onDelete(event);
            }}
          >
            <Icon name="trash" />
            Delete Event
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                onClose();
                onEdit(event);
              }}
            >
              <Icon name="edit" />
              Edit Event
            </button>
            <button
              type="button"
              className="ghost-button ghost-button--primary"
              onClick={() => {
                onClose();
                onManageEvent(event);
              }}
            >
              Manage Event
              <Icon name="arrow" />
            </button>
          </div>
        </div>
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Status & Code Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="code-chip">{event.business_code}</span>
            <span className={`status-pill status-pill--${statusKey}`}>{statusKey}</span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
            Status: <strong>{event.is_active ? 'Active' : 'Inactive'}</strong>
          </span>
        </div>

        {/* Description */}
        <div>
          <h4 style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 650, color: 'var(--ink)' }}>Description</h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: '#475569', lineHeight: 1.6 }}>
            {event.description || 'No description provided.'}
          </p>
        </div>

        {/* Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px 18px', padding: '16px', background: '#ffffff', borderRadius: '10px', border: '1px solid #eef2f6' }}>
          <div>
            <span style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600 }}>Start Date & Time</span>
            <strong style={{ fontSize: '13px', color: 'var(--ink)' }}>{formatDate(event.starts_at)}</strong>
          </div>

          <div>
            <span style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600 }}>End Date & Time</span>
            <strong style={{ fontSize: '13px', color: 'var(--ink)' }}>{formatDate(event.ends_at)}</strong>
          </div>

          <div>
            <span style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600 }}>Timezone</span>
            <span style={{ fontSize: '13px', color: 'var(--ink)' }}>{event.timezone || 'UTC'}</span>
          </div>

          <div>
            <span style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600 }}>Main Venue</span>
            <strong style={{ fontSize: '13px', color: 'var(--ink)' }}>{event.venue_name || '—'}</strong>
            {event.venue_address && (
              <span style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                {event.venue_address}
              </span>
            )}
          </div>
        </div>

        {/* Organizer Information */}
        {(event.organizer_name || event.organizer_email || event.organizer_phone) && (
          <div>
            <h4 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 650, color: 'var(--ink)' }}>Organizer Contact</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: '#334155' }}>
              {event.organizer_name && <div><strong>Name: </strong> {event.organizer_name}</div>}
              {event.organizer_email && <div><strong>Email: </strong> {event.organizer_email}</div>}
              {event.organizer_phone && <div><strong>Phone: </strong> {event.organizer_phone}</div>}
            </div>
          </div>
        )}

        {/* Feature Settings */}
        <div>
          <h4 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 650, color: 'var(--ink)' }}>Event Settings</h4>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span className="code-chip" style={{ background: event.allow_personal_photo_uploads ? '#eaf5ee' : '#f1f5f9', color: event.allow_personal_photo_uploads ? '#1f7a45' : '#64748b' }}>
              Attendee Photo Uploads: {event.allow_personal_photo_uploads ? 'Enabled' : 'Disabled'}
            </span>
            <span className="code-chip">
              Meeting Expiry: {event.meeting_request_expiry_hours || 24} hours
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default EventViewModal;
