import { useState, type FC, type FormEvent, type ChangeEvent } from 'react';
import { Modal, Icon } from '../../components/common';
import { TextField, TextAreaField, SelectField } from '../../components/forms';
import { useAppDispatch } from '../../app/hooks';
import { sendEmail, bulkSendEmail } from './attendeesThunks';

export interface SendEmailModalProps {
  eventId: string;
  attendeeId?: string;
  attendeeName?: string;
  attendeeEmail?: string;
  bulkAttendeeIds?: string[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const templateOptions = [
  { value: 'custom', label: 'Custom Announcement / Email' },
  { value: 'password_setup', label: 'Password Setup & Invitation' },
  { value: 'approval', label: 'Registration Approval Notice' },
  { value: 'event_reminder', label: 'Event Schedule & Location Reminder' },
];

export const SendEmailModal: FC<SendEmailModalProps> = ({
  eventId,
  attendeeId,
  attendeeName,
  attendeeEmail,
  bulkAttendeeIds,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const [template, setTemplate] = useState<string>('custom');
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isBulk = Boolean(bulkAttendeeIds && bulkAttendeeIds.length > 0);
  const recipientCount = bulkAttendeeIds ? bulkAttendeeIds.length : 1;

  const handleTemplateChange = (val: string) => {
    setTemplate(val);
    if (val === 'password_setup') {
      setSubject('Set up your account password - Onfra Event');
      setMessage(
        'Welcome! Your registration has been confirmed. Please click the link to set up your account password and download the attendee app.'
      );
    } else if (val === 'approval') {
      setSubject('Your Event Registration has been Approved!');
      setMessage(
        'Congratulations! Your registration for the event has been approved by the organizers. We look forward to meeting you!'
      );
    } else if (val === 'event_reminder') {
      setSubject('Important Reminder: Event schedule and badge instructions');
      setMessage(
        'The event is starting soon. Please ensure you have your QR badge ready at the check-in gate for fast entry.'
      );
    } else {
      setSubject('');
      setMessage('');
    }
  };

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      setError('Please provide an email subject.');
      return;
    }
    if (!message.trim()) {
      setError('Please provide email body content.');
      return;
    }

    setLoading(true);
    setError(null);

    let result;
    if (isBulk && bulkAttendeeIds) {
      result = await dispatch(
        bulkSendEmail({
          eventId,
          attendeeIds: bulkAttendeeIds,
          subject: subject.trim(),
          message: message.trim(),
        })
      );
    } else if (attendeeId) {
      result = await dispatch(
        sendEmail({
          eventId,
          attendeeId,
          subject: subject.trim(),
          message: message.trim(),
          type: template,
        })
      );
    }

    setLoading(false);
    if (result && !result.type.endsWith('/rejected')) {
      onSuccess();
      onClose();
    } else {
      setError('Failed to dispatch email. Please check server logs.');
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={isBulk ? `Send Email to ${recipientCount} Attendees` : `Send Email: ${attendeeName || 'Attendee'}`}
      subtitle={
        isBulk
          ? `Dispatches email notification to all ${recipientCount} selected attendees`
          : `Sent to: ${attendeeEmail}`
      }
      footer={(
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <button type="button" className="ghost-button" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            type="button"
            className="ghost-button ghost-button--primary"
            onClick={handleSend}
            disabled={loading}
          >
            <Icon name="send" />
            {loading ? 'Sending…' : isBulk ? `Send to ${recipientCount} Attendees` : 'Send Email'}
          </button>
        </div>
      )}
    >
      <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <SelectField
          id="email-template"
          label="Email Template Preset"
          options={templateOptions}
          value={template}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => handleTemplateChange(e.target.value)}
          full
        />

        <TextField
          id="email-subject"
          label="Email Subject *"
          placeholder="e.g. Welcome to the conference / Badge ready"
          value={subject}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            setSubject(e.target.value);
            setError(null);
          }}
          full
        />

        <TextAreaField
          id="email-message"
          label="Message Body *"
          rows={5}
          placeholder="Enter message text to be sent to attendees..."
          value={message}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
            setMessage(e.target.value);
            setError(null);
          }}
          full
        />

        {error && <div className="panel__error">{error}</div>}

        <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
          Emails sent will be recorded in each attendee's Activity Timeline in the database.
        </p>
      </form>
    </Modal>
  );
};

export default SendEmailModal;
