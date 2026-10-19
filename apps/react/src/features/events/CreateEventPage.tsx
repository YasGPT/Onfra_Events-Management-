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
  meetingRequestExpiryHours: string;
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
  meetingRequestExpiryHours: '24',
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
  const user = useAppSelector((state) => state.auth.user);

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
      nextErrors.endsAt = 'End date/time must be strictly after start date/time.';
    }
    if (!values.venueName || values.venueName.trim().length < 2) {
      nextErrors.venueName = 'Main venue name is required.';
    }
    if (values.organizerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.organizerEmail.trim())) {
      nextErrors.organizerEmail = 'Please provide a valid email address.';
    }
    const expiry = parseInt(values.meetingRequestExpiryHours, 10);
    if (isNaN(expiry) || expiry < 1 || expiry > 168) {
      nextErrors.meetingRequestExpiryHours = 'Please enter an expiry time between 1 and 168 hours.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitForm = async (autoSelect = true) => {
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
      meeting_request_expiry_hours: parseInt(values.meetingRequestExpiryHours, 10) || 24,
      allow_personal_photo_uploads: values.allowPersonalPhotoUploads,
      logo_data: values.logoData || undefined,
      banner_data: values.bannerData || undefined,
    };

    const result = await dispatch(createEvent(input));
    if (createEvent.fulfilled.match(result)) {
      if (autoSelect) {
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
      {/* Top Breadcrumb */}
      <nav className="create-event-breadcrumb" aria-label="Breadcrumb">
        <Link to="/events">Events</Link>
        <span>/</span>
        <strong>Create New Event</strong>
      </nav>

      <header className="page-head">
        <div>
          <span className="page-head__eyebrow">Event Setup Wizard</span>
          <h1>Create Event</h1>
          <p>
            Configure your event across the 4 core sections. System fields such as business code,
            admin attribution, initial tiers, and calendar days will be provisioned automatically.
          </p>
        </div>
      </header>

      {saveError && <div className="panel__error">{saveError}</div>}

      <div className="create-event-layout">
        {/* Left Column: Form Sections */}
        <form id="create-event-form" className="create-event-form" onSubmit={handleSubmit} noValidate>
          {/* SECTION A: Basic Event Details */}
          <div className="create-event-card">
            <div className="create-event-card__head">
              <div className="create-event-card__title">
                <span className="create-event-card__badge">Section A</span>
                <h2>Event Details</h2>
                <p>Section 1 · Required and optional fields</p>
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
                hint="Identifies your event across badges, attendee mobile app, and public agenda."
                full
              />

              <TextAreaField
                id="event-description"
                label="Event Description"
                rows={3}
                placeholder="Event pathi short description..."
                value={values.description}
                onChange={(e) => update('description', e.target.value)}
                hint="Optional overview displayed on the event landing page and attendee agenda."
                full
              />

              <ImageUploadField
                id="event-logo-upload"
                label="Event Logo"
                sublabel="Square · 1:1 ratio"
                hint="Upload logo · PNG, JPG, SVG up to 5MB"
                variant="logo"
                value={values.logoData}
                onChange={(payload) => update('logoData', payload)}
                optional
              />

              <ImageUploadField
                id="event-banner-upload"
                label="Event Banner"
                sublabel="Wide · 3:1 ratio"
                hint="Upload banner · Recommended 1200×400px · PNG, JPG, WebP"
                variant="banner"
                value={values.bannerData}
                onChange={(payload) => update('bannerData', payload)}
                optional
              />

              <div className="create-event-callout">
                <Icon name="check" />
                <div>
                  <strong>Storage Architecture Note:</strong> Logo and banner images are stored as metadata in the
                  <code>media_assets</code> table, with their generated UUIDs referenced in <code>events.logo_asset_id</code>
                  and <code>events.banner_asset_id</code>.
                </div>
              </div>
            </div>
          </div>

          {/* SECTION B: Event Date & Time */}
          <div className="create-event-card">
            <div className="create-event-card__head">
              <div className="create-event-card__title">
                <span className="create-event-card__badge">Section B</span>
                <h2>Schedule</h2>
                <p>Event start & end timing with timezone synchronization</p>
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
                hint="Start and end times will be interpreted based on this timezone."
                full
              />

              {daySchedule && (
                <div className={`create-event-callout ${daySchedule.isMultiDay ? 'create-event-callout--highlight' : ''}`}>
                  <Icon name="calendar" />
                  <div>
                    {daySchedule.isMultiDay ? (
                      <>
                        <strong>Multi-day Event Detected:</strong> {daySchedule.count} days ({daySchedule.startDate} to {daySchedule.endDate}).
                        The backend will automatically generate {daySchedule.count} records in the <code>event_days</code> table
                        (Day 1 through Day {daySchedule.count}). Day titles can be customized later in the Agenda manager.
                      </>
                    ) : (
                      <>
                        <strong>Single-day Event:</strong> 1 record will be created in the <code>event_days</code> table for {daySchedule.startDate}.
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION C: Main Venue */}
          <div className="create-event-card">
            <div className="create-event-card__head">
              <div className="create-event-card__title">
                <span className="create-event-card__badge">Section C</span>
                <h2>Event Venue</h2>
                <p>Primary event location and session hall seeding</p>
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
                hint="The primary convention center, hotel, or campus where the event occurs."
                full
              />

              <TextAreaField
                id="event-venue-address"
                label="Venue Address"
                rows={3}
                placeholder="Full address..."
                value={values.venueAddress}
                onChange={(e) => update('venueAddress', e.target.value)}
                hint="Street, city, postal code, and landmark information."
                full
              />

              <div className="create-event-callout">
                <Icon name="building" />
                <div>
                  <strong>Venue Relation:</strong> <code>events.venue_name</code> stores the event's master location.
                  The backend simultaneously initializes this as the primary hall in the <code>venues</code> table,
                  enabling instant venue selection across Sessions and 1-on-1 Meeting rooms.
                </div>
              </div>
            </div>
          </div>

          {/* SECTION D: Organizer & Event Settings */}
          <div className="create-event-card">
            <div className="create-event-card__head">
              <div className="create-event-card__title">
                <span className="create-event-card__badge">Section D</span>
                <h2>Organizer & Event Settings</h2>
                <p>Organizer contact details and networking feature controls</p>
              </div>
            </div>

            <div className="create-event-grid">
              <TextField
                id="event-organizer-name"
                label="Organizer Name"
                placeholder="Organization / contact person"
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

              <TextField
                id="meeting-request-expiry"
                label="Meeting Request Expiry (Hours) *"
                type="number"
                placeholder="24"
                value={values.meetingRequestExpiryHours}
                onChange={(e) => update('meetingRequestExpiryHours', e.target.value)}
                error={errors.meetingRequestExpiryHours}
                hint="Suggested default: 24 hours. Admin can change it."
                full
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
                    Controls the attendee photo upload option in the attendee mobile app and registration flow.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Form Actions Footer */}
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
              {saving ? 'Saving Draft…' : 'Save as Draft'}
            </button>
            <button
              type="submit"
              className="ghost-button ghost-button--primary"
              disabled={saving}
            >
              <Icon name="check" />
              {saving ? 'Creating Event…' : 'Create Event & Launch Workspace'}
            </button>
          </div>
        </form>

        {/* Right Column: Live Real-Time Event Preview */}
        <aside className="create-event-preview-col" aria-label="Event Live Preview">
          <div className="preview-card">
            <div className="preview-card__head-bar">
              <span>Real-Time Preview</span>
              <span className="preview-card__live-indicator">Live</span>
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
                <div className="preview-card__badges">
                  <span className="code-chip">CODE: Auto-assigned</span>
                  <span className="status-pill status-pill--draft">Draft</span>
                  {daySchedule?.isMultiDay && (
                    <span className="code-chip" style={{ background: '#e9f7ee', color: '#1f8a52' }}>
                      {daySchedule.count} Days
                    </span>
                  )}
                </div>
                <h3>{values.name.trim() || 'Untitled Event'}</h3>
                <p className="preview-card__desc">
                  {values.description.trim() || 'Event description will appear here once entered...'}
                </p>
              </div>

              <div className="preview-card__meta-list">
                <div className="preview-card__meta-item">
                  <Icon name="calendar" />
                  <div>
                    <strong>Date & Schedule: </strong>
                    <span>
                      {values.startsAt
                        ? new Date(values.startsAt).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Select date & time'}
                      {values.endsAt ? ` → ${new Date(values.endsAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : ''}
                      {' '}({values.timezone})
                    </span>
                  </div>
                </div>

                <div className="preview-card__meta-item">
                  <Icon name="building" />
                  <div>
                    <strong>Venue: </strong>
                    <span>{values.venueName.trim() || 'Venue name not set yet'}</span>
                    {values.venueAddress && <small style={{ display: 'block', color: 'var(--muted)' }}>{values.venueAddress}</small>}
                  </div>
                </div>

                {(values.organizerName || values.organizerEmail) && (
                  <div className="preview-card__meta-item">
                    <Icon name="users" />
                    <div>
                      <strong>Organizer: </strong>
                      <span>{values.organizerName || 'Organizer'}</span>
                      {values.organizerEmail && (
                        <small style={{ display: 'block', color: 'var(--muted)' }}>{values.organizerEmail}</small>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="preview-card__features">
                <span className="preview-feature-tag">
                  <Icon name="clock" /> Expiry: {values.meetingRequestExpiryHours || 24}h
                </span>
                <span className="preview-feature-tag">
                  <Icon name="users" /> Photos: {values.allowPersonalPhotoUploads ? 'Allowed' : 'Disabled'}
                </span>
                <span className="preview-feature-tag">
                  <Icon name="tag" /> 3 Default Tiers (Gold, Silver, Bronze)
                </span>
              </div>
            </div>
          </div>

          {/* Database Mapping Specs Helper */}
          <div className="db-spec-box">
            <h4>
              <Icon name="grid" /> Database Column Mapping
            </h4>
            <ul>
              <li>
                <strong>Section A:</strong> <code>events.name</code>, <code>events.description</code>, <code>media_assets</code> (logo & banner IDs).
              </li>
              <li>
                <strong>Section B:</strong> <code>events.starts_at</code>, <code>events.ends_at</code>, <code>events.timezone</code> → generates <code>event_days</code>.
              </li>
              <li>
                <strong>Section C:</strong> <code>events.venue_name</code>, <code>events.venue_address</code> → seeds initial <code>venues</code> record.
              </li>
              <li>
                <strong>Section D:</strong> <code>events.organizer_*</code>, <code>events.meeting_request_expiry_hours</code>, <code>events.allow_personal_photo_uploads</code>.
              </li>
              <li>
                <strong>System/Auto:</strong> <code>id</code>, <code>business_code</code> ({user?.email ? 'tenant derived' : 'auto'}), <code>created_by_admin_id</code>, <code>status='draft'</code>, <code>is_active=true</code>.
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default CreateEventPage;
