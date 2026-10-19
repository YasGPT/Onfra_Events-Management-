import { useEffect, useState, type FC, type ChangeEvent, type FormEvent } from 'react';
import { Modal, Icon } from '../../components/common';
import { TextField, TextAreaField, SelectField } from '../../components/forms';
import { useAppDispatch } from '../../app/hooks';
import { updateAttendee } from './attendeesThunks';
import type { Attendee, UpdateAttendeeInput } from '../../types';

export interface EditAttendeeModalProps {
  eventId: string;
  attendee: Attendee | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const statusOptions = [
  { value: 'registered', label: 'Registered' },
  { value: 'approved', label: 'Approved' },
  { value: 'pending', label: 'Pending Approval' },
  { value: 'rejected', label: 'Rejected' },
];

export const EditAttendeeModal: FC<EditAttendeeModalProps> = ({
  eventId,
  attendee,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [jobTitle, setJobTitle] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [websiteUrl, setWebsiteUrl] = useState<string>('');
  const [linkedinUrl, setLinkedinUrl] = useState<string>('');
  const [whatsappUrl, setWhatsappUrl] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [status, setStatus] = useState<string>('registered');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (attendee) {
      setFullName(attendee.full_name || '');
      setEmail(attendee.email || '');
      setPhone(attendee.phone || '');
      setCompanyName(attendee.company_name || '');
      setJobTitle(attendee.job_title || '');
      setBio(attendee.bio || '');
      setWebsiteUrl(attendee.website_url || '');
      setLinkedinUrl(attendee.linkedin_url || '');
      setWhatsappUrl(attendee.whatsapp_url || '');
      setPhotoUrl(attendee.photo_url || '');
      setStatus(attendee.registration_status || 'registered');
      setIsActive(Boolean(attendee.is_active));
      setError(null);
    }
  }, [attendee]);

  if (!isOpen || !attendee) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setError('Full Name and Email are required.');
      return;
    }

    setLoading(true);
    setError(null);

    const input: UpdateAttendeeInput = {
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || undefined,
      company_name: companyName.trim() || undefined,
      job_title: jobTitle.trim() || undefined,
      bio: bio.trim() || undefined,
      website_url: websiteUrl.trim() || undefined,
      linkedin_url: linkedinUrl.trim() || undefined,
      whatsapp_url: whatsappUrl.trim() || undefined,
      photo_url: photoUrl.trim() || undefined,
      registration_status: status,
      is_active: isActive,
    };

    const result = await dispatch(
      updateAttendee({
        eventId,
        attendeeId: attendee.id,
        input,
      })
    );

    setLoading(false);

    if (updateAttendee.fulfilled.match(result)) {
      onSuccess();
      onClose();
    } else {
      setError((result.payload as string) || 'Failed to update attendee.');
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Edit Attendee Profile"
      subtitle={`Update information for ${attendee.full_name}`}
      footer={(
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <button type="button" className="ghost-button" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            type="button"
            className="ghost-button ghost-button--primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            <Icon name="check" />
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      )}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && <div className="panel__error">{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <TextField
            id="edit-name"
            label="Full Name *"
            value={fullName}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
            full
          />
          <TextField
            id="edit-email"
            label="Email Address *"
            type="email"
            value={email}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            full
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <TextField
            id="edit-phone"
            label="Phone Number"
            value={phone}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
            full
          />
          <TextField
            id="edit-company"
            label="Company Name"
            value={companyName}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setCompanyName(e.target.value)}
            full
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <TextField
            id="edit-job-title"
            label="Job Title"
            value={jobTitle}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setJobTitle(e.target.value)}
            full
          />
          <SelectField
            id="edit-status"
            label="Registration Status"
            options={statusOptions}
            value={status}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value)}
            full
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <TextField
            id="edit-linkedin"
            label="LinkedIn Profile URL"
            placeholder="https://linkedin.com/in/..."
            value={linkedinUrl}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setLinkedinUrl(e.target.value)}
            full
          />
          <TextField
            id="edit-whatsapp"
            label="WhatsApp URL / Number"
            placeholder="https://wa.me/..."
            value={whatsappUrl}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setWhatsappUrl(e.target.value)}
            full
          />
        </div>

        <TextField
          id="edit-website"
          label="Website URL"
          placeholder="https://company.com"
          value={websiteUrl}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setWebsiteUrl(e.target.value)}
          full
        />

        <TextField
          id="edit-photo-url"
          label="Profile Photo URL"
          placeholder="https://images.example.com/photo.jpg"
          value={photoUrl}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPhotoUrl(e.target.value)}
          full
        />

        <TextAreaField
          id="edit-bio"
          label="Bio / Professional Background"
          rows={3}
          value={bio}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setBio(e.target.value)}
          full
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
          <input
            type="checkbox"
            id="edit-is-active"
            checked={isActive}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setIsActive(e.target.checked)}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <label htmlFor="edit-is-active" style={{ fontSize: '13px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
            Account is Active (attendee can log in to attendee app)
          </label>
        </div>
      </form>
    </Modal>
  );
};

export default EditAttendeeModal;
