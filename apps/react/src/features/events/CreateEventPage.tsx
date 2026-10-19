import { useState, useMemo } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { Icon } from '../../components/common';
import {
  ImageUploadField,
  SelectField,
  TextAreaField,
  TextField,
} from '../../components/forms';
import type { CreateEventInput, MediaUploadPayload } from '../../types';
import { createEvent, selectActiveEvent } from './eventsThunks';
import { resetSaveState } from './eventsSlice';
import './createEvent.css';

interface FormValues {
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
}

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
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST · GMT+5:30)' },
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST · GMT+4:00)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT · GMT+8:00)' },
  { value: 'Asia/Colombo', label: 'Asia/Colombo (SLST · GMT+5:30)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
  { value: 'America/New_York', label: 'America/New_York (EST/EDT)' },
];

type FormErrors = Partial<Record<keyof FormValues, string>>;

export function CreateEventPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const saving = useAppSelector((state) => state.events.saving);
  const saveError = useAppSelector((state) => state.events.saveError);

  const [values, setValues] = useState<FormValues>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});

  const update = <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // Multi-day calculation
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
      startDate: sDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      endDate: eDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
  }, [values.startsAt, values.endsAt]);

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!values.name.trim() || values.name.trim().length < 3) {
      nextErrors.name = 'Event name is required (minimum 3 characters).';
    }
    if (!values.startsAt) {
      nextErrors.startsAt = 'Start date and time is required.';
    }
    if (!values.endsAt) {
      nextErrors.endsAt = 'End date and time is required.';
    }
    if (values.startsAt && values.endsAt && new Date(values.endsAt) <= new Date(values.startsAt)) {
      nextErrors.endsAt = 'End date/time must be after start date/time.';
    }
    if (!values.venueName || values.venueName.trim().length < 2) {
      nextErrors.venueName = 'Venue name is required.';
    }
    if (values.organizerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.organizerEmail.trim())) {
      nextErrors.organizerEmail = 'Please provide a valid email address.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitForm = async (publish = true) => {
    if (!validate()) return;

    const input: CreateEventInput = {
      name: values.name,
      description: values.description || undefined,
      starts_at: values.startsAt ? new Date(values.startsAt).toISOString() : undefined,
      ends_at: values.endsAt ? new Date(values.endsAt).toISOString() : undefined,
      timezone: values.timezone,
      venue_name: values.venueName,
      venue_address: values.venueAddress || undefined,
      organizer_name: values.organizerName || undefined,
      organizer_email: values.organizerEmail || undefined,
      organizer_phone: values.organizerPhone || undefined,
      meeting_request_expiry_hours: 24, // System default (24 hours)
      allow_personal_photo_uploads: values.allowPersonalPhotoUploads,
      logo_data: values.logoData || undefined,
      banner_data: values.bannerData || undefined,
      status: publish ? 'published' : 'draft',
    };

    const result = await dispatch(createEvent(input));
    if (createEvent.fulfilled.match(result)) {
      if (publish) {
        await dispatch(selectActiveEvent(result.payload));
      }
      dispatch(resetSaveState());
      navigate('/events');
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await submitForm(true);
  };

  return (
    <section className="create-event-page">
      {/* Breadcrumb Navigation */}
      <nav className="create-event-breadcrumb" aria-label="Breadcrumb">
        <Link to="/events">Events</Link>
        <span>/</span>
        <strong>Create Event</strong>
      </nav>

      <header className="page-head">
        <div>
          <h1>Create Event</h1>
          <p>Fill in the event details below to create and publish your event.</p>
        </div>
      </header>

      {saveError && <div className="panel__error">{saveError}</div>}

      <div className="create-event-layout">
        {/* Left Column: Form Cards */}
        <form id="create-event-form" className="create-event-form" onSubmit={handleSubmit} noValidate>
          {/* Card 1: Event Details */}
          <div className="create-event-card">
            <div className="create-event-card__head">
              <div className="create-event-card__title">
                <h2>Event Details</h2>
                <p>Basic information, logo and banner</p>
              </div>
            </div>

            <div className="create-event-grid">
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

              <ImageUploadField
                id="event-logo-upload"
                label="Event Logo"
                sublabel="Square · 1:1"
                hint="Upload logo · PNG, JPG, SVG up to 5MB"
                variant="logo"
                value={values.logoData}
                onChange={(payload) => update('logoData', payload)}
                optional
              />

              <ImageUploadField
                id="event-banner-upload"
                label="Event Banner"
                sublabel="Wide · 3:1"
                hint="Upload banner · Recommended 1200×400px · PNG, JPG"
                variant="banner"
                value={values.bannerData}
                onChange={(payload) => update('bannerData', payload)}
                optional
              />
            </div>
          </div>

          {/* Card 2: Schedule */}
          <div className="create-event-card">
            <div className="create-event-card__head">
              <div className="create-event-card__title">
                <h2>Schedule</h2>
                <p>Event start date, end date and timezone</p>
              </div>
            </div>

            <div className="create-event-grid">
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
                <div className="create-event-note">
                  <Icon name="calendar" />
                  <span>
                    {daySchedule.isMultiDay
                      ? `${daySchedule.count} event days detected (${daySchedule.startDate} – ${daySchedule.endDate}). Day records will be created automatically.`
                      : `Single day event (${daySchedule.startDate}).`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Venue */}
          <div className="create-event-card">
            <div className="create-event-card__head">
              <div className="create-event-card__title">
                <h2>Event Venue</h2>
                <p>Main location for the event</p>
              </div>
            </div>

            <div className="create-event-grid">
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
          </div>

          {/* Card 4: Organizer & Settings */}
          <div className="create-event-card">
            <div className="create-event-card__head">
              <div className="create-event-card__title">
                <h2>Organizer & Settings</h2>
                <p>Contact information and attendee permissions</p>
              </div>
            </div>

            <div className="create-event-grid">
              <TextField
                id="event-organizer-name"
                label="Organizer Name"
                placeholder="Organization or contact person"
                value={values.organizerName}
                onChange={(e) => update('organizerName', e.target.value)}
                full
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

              <label className="feature-toggle-card">
                <input
                  type="checkbox"
                  checked={values.allowPersonalPhotoUploads}
                  onChange={(e) => update('allowPersonalPhotoUploads', e.target.checked)}
                />
                <div className="feature-toggle-card__info">
                  <span className="feature-toggle-card__title">Allow Attendees to Upload Profile Photos</span>
                  <span className="feature-toggle-card__caption">
                    Controls whether attendees can upload custom profile pictures in the app.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Action Bar */}
          <div className="create-event-actions">
            <button
              type="button"
              className="ghost-button"
              onClick={() => navigate('/events')}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={() => submitForm(false)}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save as Draft'}
            </button>
            <button
              type="submit"
              className="ghost-button ghost-button--primary"
              disabled={saving}
            >
              {saving ? 'Publishing…' : 'Create & Publish Event'}
            </button>
          </div>
        </form>

        {/* Right Column: Clean Event Preview Card */}
        <aside className="create-event-preview-col" aria-label="Event Preview">
          <div className="preview-card">
            <div className="preview-card__head-bar">
              <span>Preview</span>
              <span className="preview-card__status-tag">Draft</span>
            </div>

            <div className="preview-card__banner">
              {values.bannerData?.storage_key ? (
                <img src={values.bannerData.storage_key} alt="Event banner preview" />
              ) : (
                <div className="preview-card__banner-placeholder" />
              )}
              <div className="preview-card__logo-container">
                {values.logoData?.storage_key ? (
                  <img src={values.logoData.storage_key} alt="Event logo preview" />
                ) : (
                  <span className="preview-card__logo-fallback">
                    {(values.name || 'E').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            <div className="preview-card__body">
              <div className="preview-card__title-row">
                <h3>{values.name.trim() || 'Untitled Event'}</h3>
                {values.description.trim() && (
                  <p className="preview-card__desc">{values.description.trim()}</p>
                )}
              </div>

              <div className="preview-card__meta-list">
                <div className="preview-card__meta-item">
                  <Icon name="calendar" />
                  <div>
                    <strong>Date: </strong>
                    <span>
                      {values.startsAt
                        ? new Date(values.startsAt).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Not selected'}
                      {daySchedule?.isMultiDay ? ` (${daySchedule.count} days)` : ''}
                    </span>
                  </div>
                </div>

                <div className="preview-card__meta-item">
                  <Icon name="building" />
                  <div>
                    <strong>Venue: </strong>
                    <span>{values.venueName.trim() || 'Not specified'}</span>
                    {values.venueAddress.trim() && (
                      <small style={{ display: 'block', color: 'var(--muted)', marginTop: '2px' }}>
                        {values.venueAddress.trim()}
                      </small>
                    )}
                  </div>
                </div>

                {(values.organizerName || values.organizerEmail) && (
                  <div className="preview-card__meta-item">
                    <Icon name="users" />
                    <div>
                      <strong>Organizer: </strong>
                      <span>{values.organizerName || values.organizerEmail}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="preview-card__footer-tags">
                <span className="code-chip">{values.timezone}</span>
                {values.allowPersonalPhotoUploads && (
                  <span className="code-chip" style={{ background: '#eaf5ee', color: '#1f7a45' }}>
                    Photo Uploads Enabled
                  </span>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default CreateEventPage;
