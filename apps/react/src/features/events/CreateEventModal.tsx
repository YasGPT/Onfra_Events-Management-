import { useState, useMemo } from 'react';
import type { FormEvent } from 'react';

import { Modal, Icon } from '../../components/common';
import { ImageUploadField, SelectField, TextAreaField, TextField } from '../../components/forms';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { createEvent } from './eventsThunks';
import { resetSaveState } from './eventsSlice';
import type { CreateEventInput, EventSummary, MediaUploadPayload } from '../../types';

export interface CreateEventModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (event: EventSummary) => void;
}

type FormValues = {
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
  allowPersonalPhotoUploads: boolean;
  logoData: MediaUploadPayload | null;
  bannerData: MediaUploadPayload | null;
};

const emptyForm: FormValues = {
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
  allowPersonalPhotoUploads: false,
  logoData: null,
  bannerData: null,
};

const timezoneOptions = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (GMT+5:30)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'Asia/Colombo', label: 'Asia/Colombo (GMT+5:30)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GMT+4)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (GMT+8)' },
  { value: 'Europe/London', label: 'Europe/London' },
  { value: 'America/New_York', label: 'America/New_York' },
];

type FormErrors = Partial<Record<keyof FormValues, string>>;

export function CreateEventModal({ open, onClose, onCreated }: CreateEventModalProps) {
  const dispatch = useAppDispatch();
  const saving = useAppSelector((state) => state.events.saving);
  const saveError = useAppSelector((state) => state.events.saveError);
  const [values, setValues] = useState<FormValues>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});

  const update = <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const close = () => {
    setValues(emptyForm);
    setErrors({});
    dispatch(resetSaveState());
    onClose();
  };

  // Live multi-day detection
  const daySchedule = useMemo(() => {
    if (!values.startsAt || !values.endsAt) return null;
    const s = new Date(values.startsAt);
    const e = new Date(values.endsAt);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;
    if (e <= s) return null;

    const sDay = new Date(s.getFullYear(), s.getMonth(), s.getDate());
    const eDay = new Date(e.getFullYear(), e.getMonth(), e.getDate());
    const diff = Math.round((eDay.getTime() - sDay.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const count = Math.max(1, diff);

    return {
      count,
      isMultiDay: count > 1,
    };
  }, [values.startsAt, values.endsAt]);

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};

    if (values.name.trim().length < 3) nextErrors.name = 'Event name is required (min 3 characters).';
    if (!values.startsAt) nextErrors.startsAt = 'Start date and time is required.';
    if (!values.endsAt) nextErrors.endsAt = 'End date and time is required.';
    if (values.startsAt && values.endsAt && new Date(values.endsAt) <= new Date(values.startsAt)) {
      nextErrors.endsAt = 'End date/time must be after start date/time.';
    }
    if (!values.venueName || values.venueName.trim().length < 2) {
      nextErrors.venueName = 'Venue name is required.';
    }
    if (values.organizerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.organizerEmail)) {
      nextErrors.organizerEmail = 'Enter a valid organizer email.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildInput = (): CreateEventInput => ({
    name: values.name,
    description: values.description,
    starts_at: values.startsAt ? new Date(values.startsAt).toISOString() : undefined,
    ends_at: values.endsAt ? new Date(values.endsAt).toISOString() : undefined,
    timezone: values.timezone,
    venue_name: values.venueName,
    venue_address: values.venueAddress,
    organizer_name: values.organizerName,
    organizer_email: values.organizerEmail,
    organizer_phone: values.organizerPhone,
    meeting_request_expiry_hours: 24, // Standard system default
    allow_personal_photo_uploads: values.allowPersonalPhotoUploads,
    logo_data: values.logoData || undefined,
    banner_data: values.bannerData || undefined,
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    const result = await dispatch(createEvent(buildInput()));

    if (createEvent.fulfilled.match(result)) {
      onCreated?.(result.payload);
      close();
    }
  };

  const handleSaveDraft = async () => {
    if (!validate()) return;

    const result = await dispatch(createEvent(buildInput()));

    if (createEvent.fulfilled.match(result)) {
      onCreated?.(result.payload);
      close();
    }
  };

  return (
    <Modal
      title="Create Event"
      subtitle="Enter the event details to create and publish your event."
      open={open}
      onClose={close}
      error={saveError}
      footer={(
        <>
          <button className="ghost-button" type="button" onClick={close} disabled={saving}>
            Cancel
          </button>
          <button className="ghost-button" type="button" onClick={handleSaveDraft} disabled={saving}>
            {saving ? 'Saving…' : 'Save Draft'}
          </button>
          <button className="ghost-button ghost-button--primary" type="submit" form="create-event-form" disabled={saving}>
            {saving ? 'Creating…' : 'Create Event'}
          </button>
        </>
      )}
    >
      <form id="create-event-form" onSubmit={handleSubmit} noValidate>
        {/* Event Details */}
        <div className="section-label">Event Details</div>
        <div className="modal__grid">
          <TextField
            id="event-name"
            label="Event Name *"
            placeholder="e.g. International Business Expo 2027"
            value={values.name}
            onChange={(e) => update('name', e.target.value)}
            error={errors.name}
            full
          />

          <TextAreaField
            id="event-description"
            label="Event Description"
            rows={3}
            placeholder="Short description about the event..."
            value={values.description}
            onChange={(e) => update('description', e.target.value)}
            full
          />

          <div className="field--full">
            <ImageUploadField
              id="modal-logo-upload"
              label="Event Logo"
              sublabel="Square · 1:1"
              variant="logo"
              value={values.logoData}
              onChange={(payload) => update('logoData', payload)}
              optional
            />
          </div>

          <div className="field--full">
            <ImageUploadField
              id="modal-banner-upload"
              label="Event Banner"
              sublabel="Wide · 3:1"
              variant="banner"
              value={values.bannerData}
              onChange={(payload) => update('bannerData', payload)}
              optional
            />
          </div>
        </div>

        {/* Schedule */}
        <div className="section-label" style={{ marginTop: '16px' }}>Schedule</div>
        <div className="modal__grid">
          <TextField
            id="event-starts-at"
            label="Start Date & Time *"
            type="datetime-local"
            value={values.startsAt}
            onChange={(e) => update('startsAt', e.target.value)}
            error={errors.startsAt}
          />

          <TextField
            id="event-ends-at"
            label="End Date & Time *"
            type="datetime-local"
            value={values.endsAt}
            onChange={(e) => update('endsAt', e.target.value)}
            error={errors.endsAt}
          />

          <SelectField
            id="event-timezone"
            label="Time Zone *"
            options={timezoneOptions}
            value={values.timezone}
            onChange={(e) => update('timezone', e.target.value)}
            full
          />

          {daySchedule && (
            <div className="field--full" style={{ padding: '8px 12px', background: '#f0f5ff', borderRadius: '8px', fontSize: '12px', color: '#1a429b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="calendar" />
              <span>
                {daySchedule.isMultiDay
                  ? `${daySchedule.count} event days detected. Records will be created in event_days automatically.`
                  : 'Single-day event.'}
              </span>
            </div>
          )}
        </div>

        {/* Event Venue */}
        <div className="section-label" style={{ marginTop: '16px' }}>Event Venue</div>
        <div className="modal__grid">
          <TextField
            id="event-venue-name"
            label="Main Venue Name *"
            placeholder="e.g. Chennai Trade Centre"
            value={values.venueName}
            onChange={(e) => update('venueName', e.target.value)}
            error={errors.venueName}
            full
          />

          <TextAreaField
            id="event-venue-address"
            label="Venue Address"
            rows={2}
            placeholder="Full address..."
            value={values.venueAddress}
            onChange={(e) => update('venueAddress', e.target.value)}
            full
          />
        </div>

        {/* Organizer & Settings */}
        <div className="section-label" style={{ marginTop: '16px' }}>Organizer & Settings</div>
        <div className="modal__grid">
          <TextField
            id="event-organizer-name"
            label="Organizer Name"
            placeholder="Organization or contact person"
            value={values.organizerName}
            onChange={(e) => update('organizerName', e.target.value)}
          />

          <TextField
            id="event-organizer-email"
            label="Organizer Email"
            type="email"
            placeholder="contact@example.com"
            value={values.organizerEmail}
            onChange={(e) => update('organizerEmail', e.target.value)}
            error={errors.organizerEmail}
          />

          <TextField
            id="event-organizer-phone"
            label="Organizer Phone"
            placeholder="Contact number"
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
            <small className="field-hint">Controls the attendee photo upload option in the app</small>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default CreateEventModal;
