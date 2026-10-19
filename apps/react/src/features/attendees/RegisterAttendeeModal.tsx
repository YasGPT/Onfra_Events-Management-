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
}

type FormValues = {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  jobTitle: string;
  companyName: string;
  websiteUrl: string;
  whatsappUrl: string;
  bio: string;
};

const emptyForm: FormValues = {
  fullName: '',
  email: '',
  password: '',
  phone: '',
  jobTitle: '',
  companyName: '',
  websiteUrl: '',
  whatsappUrl: '',
  bio: '',
};

const accessOptions = [
  { value: 'password', label: 'Set a password now (share it with the attendee)' },
];

type FormErrors = Partial<Record<keyof FormValues, string>>;

export function RegisterAttendeeModal({ open, eventId, eventName, onClose }: RegisterAttendeeModalProps) {
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

    if (values.fullName.trim().length < 2) nextErrors.fullName = 'Enter the attendee full name.';
    if (!isValidEmail(values.email.trim())) nextErrors.email = 'Enter a valid email address.';
    if (values.password.length < 6) nextErrors.password = 'Use at least 6 characters.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    const input: CreateAttendeeInput = {
      full_name: values.fullName,
      email: values.email,
      password: values.password,
      phone: values.phone || undefined,
      job_title: values.jobTitle || undefined,
      company_name: values.companyName || undefined,
      website_url: values.websiteUrl || undefined,
      whatsapp_url: values.whatsappUrl || undefined,
      bio: values.bio || undefined,
    };

    const result = await dispatch(registerAttendee({ eventId, input }));

    if (registerAttendee.fulfilled.match(result)) close();
  };

  return (
    <Modal
      title="Register attendee"
      subtitle={
        eventName
          ? `Adds an attendee login to ${eventName}. They can sign in on the mobile app with this email.`
          : 'Adds an attendee login to the active event.'
      }
      open={open}
      onClose={close}
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
            {registering ? 'Saving…' : 'Register attendee'}
          </button>
        </>
      )}
    >
      <form id="register-attendee-form" onSubmit={handleSubmit} noValidate>
        <div className="modal__grid">
          <TextField
            id="attendee-full-name"
            label="Full name"
            placeholder="Amara Perera"
            value={values.fullName}
            onChange={(e) => update('fullName', e.target.value)}
            error={errors.fullName}
            autoComplete="off"
          />

          <TextField
            id="attendee-email"
            label="Email"
            type="email"
            placeholder="amara@company.com"
            value={values.email}
            onChange={(e) => update('email', e.target.value)}
            error={errors.email}
            autoComplete="off"
          />

          <TextField
            id="attendee-password"
            label="Login password"
            placeholder="Min. 6 characters"
            value={values.password}
            onChange={(e) => update('password', e.target.value)}
            error={errors.password}
            hint="Give this to the attendee — it is stored hashed."
            autoComplete="new-password"
          />

          <SelectField
            id="attendee-access"
            label="Access method"
            options={accessOptions}
            defaultValue="password"
            hint="Email invites are not wired up yet."
          />

          <TextField
            id="attendee-phone"
            label="Phone"
            placeholder="+94 77 000 0000"
            value={values.phone}
            onChange={(e) => update('phone', e.target.value)}
          />

          <TextField
            id="attendee-job-title"
            label="Job title"
            placeholder="Product Manager"
            value={values.jobTitle}
            onChange={(e) => update('jobTitle', e.target.value)}
          />

          <TextField
            id="attendee-company"
            label="Company"
            placeholder="Nexora Labs"
            value={values.companyName}
            onChange={(e) => update('companyName', e.target.value)}
          />

          <TextField
            id="attendee-website"
            label="Website"
            placeholder="https://company.com"
            value={values.websiteUrl}
            onChange={(e) => update('websiteUrl', e.target.value)}
          />

          <TextField
            id="attendee-whatsapp"
            label="WhatsApp link"
            placeholder="https://wa.me/94770000000"
            value={values.whatsappUrl}
            onChange={(e) => update('whatsappUrl', e.target.value)}
          />

          <TextAreaField
            id="attendee-bio"
            label="Short bio"
            rows={3}
            placeholder="Shown in the attendee networking directory."
            value={values.bio}
            onChange={(e) => update('bio', e.target.value)}
            full
          />
        </div>
      </form>
    </Modal>
  );
}

export default RegisterAttendeeModal;
