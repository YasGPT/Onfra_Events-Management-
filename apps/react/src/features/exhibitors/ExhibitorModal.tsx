import { useState } from 'react';
import type { FormEvent } from 'react';

import { Modal } from '../../components/common';
import { SelectField, TextAreaField, TextField } from '../../components/forms';
import { useAppDispatch } from '../../app/hooks';
import { createExhibitor, updateExhibitor } from './exhibitorsThunks';

export interface ExhibitorModalProps {
  open: boolean;
  onClose: () => void;
  exhibitor?: any;
  categories?: any[];
}

type FormValues = {
  company_name: string;
  category_id: string;
  description: string;
  website_url: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  booth_number: string;
  booth_type: string;
  stall_size: string;
  zone_location: string;
  special_requirements: string;
  internal_notes: string;
};

const emptyForm: FormValues = {
  company_name: '',
  category_id: '',
  description: '',
  website_url: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  booth_number: '',
  booth_type: 'standard',
  stall_size: '',
  zone_location: '',
  special_requirements: '',
  internal_notes: '',
};

const boothTypes = [
  { value: 'standard', label: 'Standard' },
  { value: 'premium', label: 'Premium' },
  { value: 'corner', label: 'Corner' },
  { value: 'island', label: 'Island' },
];

export function ExhibitorModal({ open, onClose, exhibitor, categories }: ExhibitorModalProps) {
  const dispatch = useAppDispatch();
  const [values, setValues] = useState<FormValues>(
    exhibitor ? { ...emptyForm, ...exhibitor } : emptyForm
  );
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});

  const update = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof FormValues, string>> = {};

    if (!values.company_name.trim()) nextErrors.company_name = 'Company name is required.';
    if (values.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.contact_email)) {
      nextErrors.contact_email = 'Enter a valid email.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    try {
      if (exhibitor) {
        await dispatch(updateExhibitor({ id: exhibitor.id, data: values }));
      } else {
        await dispatch(createExhibitor(values));
      }
      onClose();
    } catch (error) {
      console.error('Error saving exhibitor:', error);
    }
  };

  return (
    <Modal
      title={exhibitor ? 'Edit Exhibitor' : 'Add Exhibitor'}
      subtitle={exhibitor ? 'Update exhibitor details' : 'Add a new exhibitor to the event'}
      open={open}
      onClose={onClose}
      footer={
        <>
          <button className="ghost-button" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="ghost-button ghost-button--primary" type="submit" form="exhibitor-form">
            {exhibitor ? 'Update' : 'Create'}
          </button>
        </>
      }
    >
      <form id="exhibitor-form" onSubmit={handleSubmit} noValidate>
        <div className="modal__grid">
          {/* Section A - Company Info */}
          <div className="section-label">Section A — Company Information</div>
          <TextField
            id="company-name"
            label="Company Name *"
            placeholder="Acme Corporation"
            value={values.company_name}
            onChange={(e) => update('company_name', e.target.value)}
            error={errors.company_name}
            full
          />

          <SelectField
            id="category"
            label="Category"
            options={categories?.map((c: any) => ({ value: c.id, label: c.name })) || []}
            value={values.category_id}
            onChange={(e) => update('category_id', e.target.value)}
          />

          <TextAreaField
            id="description"
            label="Company Description"
            rows={3}
            placeholder="Brief description about the company..."
            value={values.description}
            onChange={(e) => update('description', e.target.value)}
            full
          />

          <TextField
            id="website-url"
            label="Website URL"
            type="url"
            placeholder="https://example.com"
            value={values.website_url}
            onChange={(e) => update('website_url', e.target.value)}
          />

          {/* Section B - Contact Details */}
          <div className="section-label">Section B — Contact Details</div>
          <TextField
            id="contact-name"
            label="Contact Person Name *"
            placeholder="John Doe"
            value={values.contact_name}
            onChange={(e) => update('contact_name', e.target.value)}
          />

          <TextField
            id="contact-email"
            label="Contact Email *"
            type="email"
            placeholder="contact@example.com"
            value={values.contact_email}
            onChange={(e) => update('contact_email', e.target.value)}
            error={errors.contact_email}
          />

          <TextField
            id="contact-phone"
            label="Contact Phone"
            placeholder="+1234567890"
            value={values.contact_phone}
            onChange={(e) => update('contact_phone', e.target.value)}
          />

          {/* Section C - Booth Details */}
          <div className="section-label">Section C — Booth Details</div>
          <TextField
            id="booth-number"
            label="Booth Number *"
            placeholder="A-101"
            value={values.booth_number}
            onChange={(e) => update('booth_number', e.target.value)}
          />

          <SelectField
            id="booth-type"
            label="Booth Type"
            options={boothTypes}
            value={values.booth_type}
            onChange={(e) => update('booth_type', e.target.value)}
          />

          <TextField
            id="stall-size"
            label="Stall Size"
            placeholder="3x3m"
            value={values.stall_size}
            onChange={(e) => update('stall_size', e.target.value)}
          />

          <TextField
            id="zone-location"
            label="Zone/Location"
            placeholder="Zone A"
            value={values.zone_location}
            onChange={(e) => update('zone_location', e.target.value)}
          />

          <TextAreaField
            id="special-requirements"
            label="Special Requirements"
            rows={2}
            placeholder="Power, WiFi, furniture requirements..."
            value={values.special_requirements}
            onChange={(e) => update('special_requirements', e.target.value)}
            full
          />

          {/* Section D - Internal Notes */}
          <div className="section-label">Section D — Internal Notes</div>
          <TextAreaField
            id="internal-notes"
            label="Internal Notes"
            rows={2}
            placeholder="Notes for admin reference..."
            value={values.internal_notes}
            onChange={(e) => update('internal_notes', e.target.value)}
            full
          />
        </div>
      </form>
    </Modal>
  );
}

export default ExhibitorModal;
