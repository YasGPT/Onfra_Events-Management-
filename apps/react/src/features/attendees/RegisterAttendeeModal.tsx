import { useState } from 'react';
import type { FormEvent } from 'react';

import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { Modal } from '../../components/common';
import { SelectField, TextAreaField, TextField } from '../../components/forms';
import { isValidEmail } from '../../utils';
import type { CreateAttendeeInput } from '../../types';
import { registerAttendee } from './attendeesThunks';
import { resetRegisterState } from './attendeesSlice';

export interface RegisterAttendeeModalProps {
  open: boolean;
  eventId: string;
  eventName?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

type FormValues = {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  jobTitle: string;
  companyName: string;
  websiteUrl: string;
  linkedinUrl: string;
  whatsappUrl: string;
  photoUrl: string;
  bio: string;
  registrationStatus: 'registered' | 'pending';
  badgeTemplate: string;
};

const emptyForm: FormValues = {
  fullName: '',
  email: '',
  password: '',
  phone: '',
  jobTitle: '',
  companyName: '',
  websiteUrl: '',
  linkedinUrl: '',
  whatsappUrl: '',
  photoUrl: '',
  bio: '',
  registrationStatus: 'registered',
  badgeTemplate: 'standard',
};

const registrationStatusOptions = [
  { value: 'registered', label: 'Registered (Active immediately)' },
  { value: 'pending', label: 'Pending Approval (Must be approved before access)' },
];

const badgeTemplateOptions = [
  { value: 'standard', label: 'Standard Attendee' },
  { value: 'vip', label: 'VIP Guest' },
  { value: 'speaker', label: 'Keynote Speaker' },
  { value: 'exhibitor', label: 'Exhibitor' },
];

type FormErrors = Partial<Record<keyof FormValues, string>>;

export function RegisterAttendeeModal({ open, eventId, eventName, onClose, onSuccess }: RegisterAttendeeModalProps) {
  const dispatch = useAppDispatch();
  const registering = useAppSelector((state) => state.attendees.registering);
  const registerError = useAppSelector((state) => state.attendees.registerError);
  const [values, setValues] = useState<FormValues>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});

  const update = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const close = () => {
    setValues(emptyForm);
    setErrors({});
    dispatch(resetRegisterState());
    onClose();
  };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};

    if (values.fullName.trim().length < 2) nextErrors.fullName = 'Enter attendee full name.';
    if (!isValidEmail(values.email.trim())) nextErrors.email = 'Enter a valid email address.';
    if (values.registrationStatus === 'registered' && values.password && values.password.length < 6) {
      nextErrors.password = 'Use at least 6 characters.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    const input: CreateAttendeeInput = {
      full_name: values.fullName,
      email: values.email,
      password: values.password || undefined,
      phone: values.phone || undefined,
      job_title: values.jobTitle || undefined,
      company_name: values.companyName || undefined,
      website_url: values.websiteUrl || undefined,
      linkedin_url: values.linkedinUrl || undefined,
      whatsapp_url: values.whatsappUrl || undefined,
      photo_url: values.photoUrl || undefined,
      bio: values.bio || undefined,
      registration_status: values.registrationStatus,
      badge_template: values.badgeTemplate,
    };

    const result = await dispatch(registerAttendee({ eventId, input }));

    if (registerAttendee.fulfilled.match(result)) {
      if (onSuccess) onSuccess();
      close();
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Register Attendee"
      subtitle={eventName ? `Add an attendee to ${eventName}` : 'Enter attendee details'}
      error={registerError}
      footer={(
        <>
          <button className="ghost-button" type="button" onClick={close} disabled={registering}>
            Cancel
          </button>
          <button
            className="ghost-button ghost-button--primary"
            type="submit"
            form="register-attendee-form"
            disabled={registering}
          >
            {registering ? 'Registering…' : values.registrationStatus === 'pending' ? 'Save as Pending' : 'Register Attendee'}
          </button>
        </>
      )}
    >
      <form id="register-attendee-form" onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <TextField
            id="register-full-name"
            label="Full Name *"
            placeholder="e.g. Priyan Sharma"
            value={values.fullName}
            onChange={(e) => update('fullName', e.target.value)}
            error={errors.fullName}
            autoFocus
            full
          />

          <TextField
            id="register-email"
            label="Email Address *"
            type="email"
            placeholder="e.g. priyan@example.com"
            value={values.email}
            onChange={(e) => update('email', e.target.value)}
            error={errors.email}
            full
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <SelectField
            id="register-status"
            label="Registration Workflow"
            options={registrationStatusOptions}
            value={values.registrationStatus}
            onChange={(e) => update('registrationStatus', e.target.value as any)}
            full
          />

          <SelectField
            id="register-badge-template"
            label="Badge Template"
            options={badgeTemplateOptions}
            value={values.badgeTemplate}
            onChange={(e) => update('badgeTemplate', e.target.value)}
            full
          />
        </div>

        {values.registrationStatus === 'registered' && (
          <div style={{ marginBottom: '12px' }}>
            <TextField
              id="register-password"
              label="Account Password (Optional)"
              type="password"
              placeholder="Leave blank to send setup link or enter password"
              value={values.password}
              onChange={(e) => update('password', e.target.value)}
              error={errors.password}
              full
            />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <TextField
            id="register-phone"
            label="Phone Number"
            placeholder="+91 98765 43210"
            value={values.phone}
            onChange={(e) => update('phone', e.target.value)}
            full
          />

          <TextField
            id="register-company"
            label="Company / Organization"
            placeholder="e.g. Acme Corp"
            value={values.companyName}
            onChange={(e) => update('companyName', e.target.value)}
            full
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <TextField
            id="register-job-title"
            label="Job Title"
            placeholder="e.g. VP Engineering"
            value={values.jobTitle}
            onChange={(e) => update('jobTitle', e.target.value)}
            full
          />

          <TextField
            id="register-photo-url"
            label="Profile Photo URL"
            placeholder="https://images.example.com/photo.jpg"
            value={values.photoUrl}
            onChange={(e) => update('photoUrl', e.target.value)}
            full
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <TextField
            id="register-linkedin"
            label="LinkedIn URL"
            placeholder="https://linkedin.com/in/..."
            value={values.linkedinUrl}
            onChange={(e) => update('linkedinUrl', e.target.value)}
            full
          />

          <TextField
            id="register-website"
            label="Website URL"
            placeholder="https://example.com"
            value={values.websiteUrl}
            onChange={(e) => update('websiteUrl', e.target.value)}
            full
          />
        </div>

        <TextAreaField
          id="register-bio"
          label="Bio / Notes"
          placeholder="Short attendee background..."
          rows={3}
          value={values.bio}
          onChange={(e) => update('bio', e.target.value)}
          full
        />
      </form>
    </Modal>
  );
}

export default RegisterAttendeeModal;
