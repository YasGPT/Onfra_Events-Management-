import { useState, type FC, type FormEvent, type ChangeEvent } from 'react';
import { Modal, Icon } from '../../components/common';
import { TextField, SelectField } from '../../components/forms';
import { useAppDispatch } from '../../app/hooks';
import { qrCheckIn } from './attendeesThunks';
import type { Attendee } from '../../types';

export interface QrCheckInModalProps {
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const gateOptions = [
  { value: 'Main Gate', label: 'Main Entrance Gate' },
  { value: 'VIP Gate', label: 'VIP / Speaker Lounge' },
  { value: 'Hall A', label: 'Hall A Entrance' },
  { value: 'Hall B', label: 'Hall B Entrance' },
  { value: 'Exhibition Area', label: 'Exhibition Floor Gate' },
];

export const QrCheckInModal: FC<QrCheckInModalProps> = ({
  eventId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const [qrCode, setQrCode] = useState<string>('');
  const [gateLocation, setGateLocation] = useState<string>('Main Gate');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [checkedAttendee, setCheckedAttendee] = useState<Attendee | null>(null);

  if (!isOpen) return null;

  const handleCheckIn = async (e: FormEvent) => {
    e.preventDefault();
    if (!qrCode.trim()) {
      setError('Please enter or scan a QR code token.');
      return;
    }

    setLoading(true);
    setError(null);
    setCheckedAttendee(null);

    const result = await dispatch(
      qrCheckIn({
        eventId,
        qr_token_hash: qrCode.trim(),
        gate_location: gateLocation,
      })
    );

    setLoading(false);
    if (qrCheckIn.fulfilled.match(result)) {
      setCheckedAttendee(result.payload);
      setQrCode('');
      onSuccess();
    } else {
      setError((result.payload as string) || 'Invalid QR code or attendee not found.');
    }
  };

  const handleClose = () => {
    setQrCode('');
    setError(null);
    setCheckedAttendee(null);
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title="QR Code Check-in Station"
      subtitle="Scan badge or enter attendee QR hash to check in"
      footer={(
        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
          <button type="button" className="ghost-button" onClick={handleClose}>
            Done
          </button>
        </div>
      )}
    >
      <form onSubmit={handleCheckIn} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <SelectField
          id="gate-location"
          label="Check-in Gate / Station"
          options={gateOptions}
          value={gateLocation}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setGateLocation(e.target.value)}
          full
        />

        <TextField
          id="qr-token-input"
          label="Attendee QR Code / Hash *"
          placeholder="Scan or paste QR code token..."
          value={qrCode}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            setQrCode(e.target.value);
            setError(null);
          }}
          autoFocus
          full
        />

        {error && <div className="panel__error">{error}</div>}

        <button
          type="submit"
          className="ghost-button ghost-button--primary"
          disabled={loading || !qrCode.trim()}
          style={{ justifyContent: 'center' }}
        >
          <Icon name="qr" />
          {loading ? 'Verifying & Checking In…' : 'Process Check-in'}
        </button>

        {checkedAttendee && (
          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#065f46',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '15px' }}>
              <Icon name="check-circle" />
              Check-in Successful!
            </div>
            <div style={{ fontSize: '13px' }}>
              <strong>{checkedAttendee.full_name}</strong> ({checkedAttendee.email})
            </div>
            <div style={{ fontSize: '12px', color: '#047857' }}>
              Company: {checkedAttendee.company_name || 'N/A'} · Gate: {checkedAttendee.check_in_location} · Total Check-ins: {checkedAttendee.check_in_count}
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default QrCheckInModal;
