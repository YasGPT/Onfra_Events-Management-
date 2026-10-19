import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';

import { Modal } from '../../components/common';
import { SelectField, TextAreaField, TextField } from '../../components/forms';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { updateEvent } from './eventsThunks';
import type { EventSummary, UpdateEventInput } from '../../types';

export interface EditEventModalProps {
  event: EventSummary | null;
  open: boolean;
  onClose: () => void;
  onUpdated?: (event: EventSummary) => void;
}

interface EditFormValues {
  name: string;
  description: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  venueName: string;
  venueAddress: string;
  organizerName: string;
  organizerEmail: string;
  organizerPhone: string;
  status: string;
  allowPersonalPhotoUploads: boolean;
}

const timezoneOptions = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (GMT+5:30)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'Asia/Colombo', label: 'Asia/Colombo (GMT+5:30)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GMT+4)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (GMT+8)' },
  { value: 'Europe/London', label: 'Europe/London' },
  { value: 'America/New_York', label: 'America/New_York' },
];

const statusOptions = [
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'inactive', label: 'Inactive' },
];

function formatForDatetimeInput(isoString?: string | null): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export function EditEventModal({ event, open, onClose, onUpdated }: EditEventModalProps) {
  const dispatch = useAppDispatch();
  const saving = useAppSelector((state) => state.events.saving);
  const saveError = useAppSelector((state) => state.events.saveError);

  const [values, setValues] = useState<EditFormValues>({
    name: '',
    description: '',
    startsAt: '',
    endsAt: '',
    timezone: 'Asia/Kolkata',
    venueName: '',
    venueAddress: '',
    organizerName: '',
    organizerEmail: '',
    organizerPhone: '',
    status: 'published',
    allowPersonalPhotoUploads: false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof EditFormValues, string>>>({});

  useEffect(() => {
    if (event) {
      setValues({
        name: event.name || '',
        description: event.description || '',
        startsAt: formatForDatetimeInput(event.starts_at),
        endsAt: formatForDatetimeInput(event.ends_at),
        timezone: event.timezone || 'Asia/Kolkata',
        venueName: event.venue_name || '',
        venueAddress: event.venue_address || '',
        organizerName: event.organizer_name || '',
        organizerEmail: event.organizer_email || '',
        organizerPhone: event.organizer_phone || '',
        status: event.status || (event.is_active === false ? 'inactive' : 'published'),
        allowPersonalPhotoUploads: Boolean(event.allow_personal_photo_uploads),
      });
      setErrors({});
    }
  }, [event]);

  const update = <K extends keyof EditFormValues>(field: K, value: EditFormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof EditFormValues, string>> = {};
    if (!values.name.trim() || values.name.trim().length < 3) {
      nextErrors.name = 'Event name is required (min 3 chars).';
    }
    if (values.startsAt && values.endsAt && new Date(values.endsAt) <= new Date(values.startsAt)) {
      nextErrors.endsAt = 'End date/time must be after start date/time.';
    }
    if (values.organizerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.organizerEmail)) {
      nextErrors.organizerEmail = 'Enter a valid organizer email.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!event || !validate()) return;

    const input: UpdateEventInput = {
      name: values.name.trim(),
      description: values.description ? values.description.trim() : undefined,
      starts_at: values.startsAt ? new Date(values.startsAt).toISOString() : undefined,
      ends_at: values.endsAt ? new Date(values.endsAt).toISOString() : undefined,
      timezone: values.timezone,
      venue_name: values.venueName ? values.venueName.trim() : undefined,
      venue_address: values.venueAddress ? values.venueAddress.trim() : undefined,
      organizer_name: values.organizerName ? values.organizerName.trim() : undefined,
      organizer_email: values.organizerEmail ? values.organizerEmail.trim() : undefined,
      organizer_phone: values.organizerPhone ? values.organizerPhone.trim() : undefined,
      status: values.status,
      allow_personal_photo_uploads: values.allowPersonalPhotoUploads,
      is_active: values.status !== 'inactive',
    };

    const result = await dispatch(updateEvent({ id: event.id, input }));
    if (updateEvent.fulfilled.match(result)) {
      onUpdated?.(result.payload);
      onClose();
    }
  };

  if (!event) return null;

  return (
    <Modal
      title="Edit Event"
      subtitle={`Editing "${event.name}" (${event.business_code})`}
      open={open}
      onClose={onClose}
      error={saveError}
      footer={(
        <>
          <button type="button" className="ghost-button" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" form="edit-event-form" className="ghost-button ghost-button--primary" disabled={saving}>
            {saving ? 'Saving Changes…' : 'Save Changes'}
          </button>
        </>
      )}
    >
      <form id="edit-event-form" onSubmit={handleSubmit} noValidate>
        <div className="section-label">Event Details</div>
        <div className="modal__grid">
          <TextField
            id="edit-event-name"
            label="Event Name *"
            value={values.name}
            onChange={(e) => update('name', e.target.value)}
            error={errors.name}
            full
          />

          <TextAreaField
            id="edit-event-description"
            label="Event Description"
            rows={3}
            value={values.description}
            onChange={(e) => update('description', e.target.value)}
            full
          />

          <SelectField
            id="edit-event-status"
            label="Event Status"
            options={statusOptions}
            value={values.status}
            onChange={(e) => update('status', e.target.value)}
            full
          />
        </div>

        <div className="section-label" style={{ marginTop: '16px' }}>Schedule</div>
        <div className="modal__grid">
          <TextField
            id="edit-starts-at"
            label="Start Date & Time"
            type="datetime-local"
            value={values.startsAt}
            onChange={(e) => update('startsAt', e.target.value)}
          />

          <TextField
            id="edit-ends-at"
            label="End Date & Time"
            type="datetime-local"
            value={values.endsAt}
            onChange={(e) => update('endsAt', e.target.value)}
            error={errors.endsAt}
          />

          <SelectField
            id="edit-timezone"
            label="Time Zone"
            options={timezoneOptions}
            value={values.timezone}
            onChange={(e) => update('timezone', e.target.value)}
            full
          />
        </div>

        <div className="section-label" style={{ marginTop: '16px' }}>Main Venue</div>
        <div className="modal__grid">
          <TextField
            id="edit-venue-name"
            label="Venue Name"
            value={values.venueName}
            onChange={(e) => update('venueName', e.target.value)}
            full
          />

          <TextAreaField
            id="edit-venue-address"
            label="Venue Address"
            rows={2}
            value={values.venueAddress}
            onChange={(e) => update('venueAddress', e.target.value)}
            full
          />
        </div>

        <div className="section-label" style={{ marginTop: '16px' }}>Organizer & Settings</div>
        <div className="modal__grid">
          <TextField
            id="edit-organizer-name"
            label="Organizer Name"
            value={values.organizerName}
            onChange={(e) => update('organizerName', e.target.value)}
          />

          <TextField
            id="edit-organizer-email"
            label="Organizer Email"
            type="email"
            value={values.organizerEmail}
            onChange={(e) => update('organizerEmail', e.target.value)}
            error={errors.organizerEmail}
          />

          <TextField
            id="edit-organizer-phone"
            label="Organizer Phone"
            value={values.organizerPhone}
            onChange={(e) => update('organizerPhone', e.target.value)}
          />

          <div className="field--full">
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={values.allowPersonalPhotoUploads}
                onChange={(e) => update('allowPersonalPhotoUploads', e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Allow Attendees to Upload Profile Photos</span>
            </label>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default EditEventModal;
