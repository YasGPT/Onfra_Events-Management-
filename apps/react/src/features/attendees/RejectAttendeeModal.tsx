import { useState, type FC, type ChangeEvent } from 'react';
import { Modal, Icon } from '../../components/common';
import { TextAreaField } from '../../components/forms';
import { useAppDispatch } from '../../app/hooks';
import { rejectAttendee, bulkRejectAttendees } from './attendeesThunks';

export interface RejectAttendeeModalProps {
  eventId: string;
  attendeeId?: string;
  attendeeName?: string;
  bulkAttendeeIds?: string[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RejectAttendeeModal: FC<RejectAttendeeModalProps> = ({
  eventId,
  attendeeId,
  attendeeName,
  bulkAttendeeIds,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const isBulk = Boolean(bulkAttendeeIds && bulkAttendeeIds.length > 0);
  const title = isBulk
    ? `Reject ${bulkAttendeeIds?.length} Attendee Registrations`
    : `Reject Registration: ${attendeeName || 'Attendee'}`;

  const handleConfirm = async () => {
    setLoading(true);
    if (isBulk && bulkAttendeeIds) {
      await dispatch(
        bulkRejectAttendees({
          eventId,
          attendeeIds: bulkAttendeeIds,
          reason: reason.trim(),
        })
      );
    } else if (attendeeId) {
      await dispatch(
        rejectAttendee({
          eventId,
          attendeeId,
          reason: reason.trim(),
        })
      );
    }
    setLoading(false);
    setReason('');
    onSuccess();
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={title}
      subtitle="Optionally provide a reason for declining this registration."
      footer={(
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <button type="button" className="ghost-button" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            type="button"
            className="ghost-button"
            style={{ background: '#d64555', color: '#ffffff', borderColor: '#d64555' }}
            onClick={handleConfirm}
            disabled={loading}
          >
            <Icon name="x-circle" />
            {loading ? 'Rejecting…' : isBulk ? `Reject ${bulkAttendeeIds?.length} Attendees` : 'Confirm Rejection'}
          </button>
        </div>
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
          The attendee account will be marked as <strong>Rejected</strong> and deactivated in the database.
          They will not be able to log in to the attendee app.
        </p>

        <TextAreaField
          id="rejection-reason"
          label="Reason for Rejection (Optional)"
          rows={3}
          placeholder="e.g. Capacity reached, duplicate registration, or missing mandatory company information..."
          value={reason}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
          full
        />
      </div>
    </Modal>
  );
};

export default RejectAttendeeModal;
