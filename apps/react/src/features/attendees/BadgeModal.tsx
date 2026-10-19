import { useEffect, useState, type FC } from 'react';
import QRCode from 'qrcode';

import { Modal, Icon } from '../../components/common';
import type { Attendee } from '../../types';
import { useAppDispatch } from '../../app/hooks';
import { printBadge } from './attendeesThunks';

export interface BadgeModalProps {
  attendee: Attendee | null;
  activeEvent: { id: string; name: string; businessCode?: string; business_code?: string } | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BadgeModal: FC<BadgeModalProps> = ({
  attendee,
  activeEvent,
  isOpen,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const [template, setTemplate] = useState<string>(attendee?.badge_template || 'standard');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [printing, setPrinting] = useState<boolean>(false);

  useEffect(() => {
    if (attendee?.badge_template) {
      setTemplate(attendee.badge_template);
    }
  }, [attendee]);

  useEffect(() => {
    if (attendee?.qr_token_hash) {
      QRCode.toDataURL(attendee.qr_token_hash, {
        width: 160,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to generate QR:', err));
    } else if (attendee?.id) {
      QRCode.toDataURL(`ONFRA:ATTENDEE:${attendee.id}`, {
        width: 160,
        margin: 1,
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to generate QR:', err));
    }
  }, [attendee]);

  if (!isOpen || !attendee) return null;

  const handlePrint = async () => {
    setPrinting(true);
    if (activeEvent?.id) {
      await dispatch(
        printBadge({
          eventId: activeEvent.id,
          attendeeId: attendee.id,
          badge_template: template,
        })
      );
    }
    setPrinting(false);
    window.print();
  };

  const templateStyles: Record<string, { headerBg: string; tagBg: string; tagColor: string; title: string }> = {
    standard: {
      headerBg: 'linear-gradient(135deg, #1e293b, #0f172a)',
      tagBg: '#e2e8f0',
      tagColor: '#334155',
      title: 'ATTENDEE',
    },
    vip: {
      headerBg: 'linear-gradient(135deg, #b45309, #78350f)',
      tagBg: '#fef3c7',
      tagColor: '#92400e',
      title: 'VIP GUEST',
    },
    speaker: {
      headerBg: 'linear-gradient(135deg, #6366f1, #4338ca)',
      tagBg: '#e0e7ff',
      tagColor: '#3730a3',
      title: 'KEYNOTE SPEAKER',
    },
    exhibitor: {
      headerBg: 'linear-gradient(135deg, #059669, #065f46)',
      tagBg: '#d1fae5',
      tagColor: '#065f46',
      title: 'EXHIBITOR',
    },
  };

  const currentStyle = templateStyles[template] || templateStyles.standard;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Badge Management & Print Preview"
      subtitle={`Design and print badge for ${attendee.full_name}`}
      footer={(
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <button type="button" className="ghost-button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="ghost-button ghost-button--primary"
            onClick={handlePrint}
            disabled={printing}
          >
            <Icon name="printer" />
            {printing ? 'Generating...' : 'Print Badge'}
          </button>
        </div>
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Template Selector */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
            Select Badge Template
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {[
              { id: 'standard', name: 'Standard' },
              { id: 'vip', name: 'VIP Guest' },
              { id: 'speaker', name: 'Speaker' },
              { id: 'exhibitor', name: 'Exhibitor' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplate(t.id)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: template === t.id ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  background: template === t.id ? '#eff6ff' : '#ffffff',
                  color: template === t.id ? '#1d4ed8' : '#475569',
                  transition: 'all 0.15s ease',
                }}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Live Printable Badge Card Preview */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
          <div
            id="printable-badge"
            className="printable-badge-card"
            style={{
              width: '320px',
              minHeight: '440px',
              background: '#ffffff',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            {/* Badge Header */}
            <div
              style={{
                background: currentStyle.headerBg,
                color: '#ffffff',
                padding: '20px 16px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.85 }}>
                {activeEvent?.business_code || activeEvent?.businessCode || 'ONFRA EVENT'}
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '4px' }}>
                {activeEvent?.name || 'Annual Event Expo'}
              </div>
            </div>

            {/* Badge Body */}
            <div
              style={{
                padding: '24px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1,
                justifyContent: 'space-between',
                textAlign: 'center',
              }}
            >
              {/* Photo or Avatar */}
              {attendee.photo_url ? (
                <img
                  src={attendee.photo_url}
                  alt={attendee.full_name}
                  style={{
                    width: '84px',
                    height: '84px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid #e2e8f0',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '84px',
                    height: '84px',
                    borderRadius: '50%',
                    background: '#f1f5f9',
                    color: '#334155',
                    fontSize: '26px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '3px solid #e2e8f0',
                  }}
                >
                  {attendee.full_name.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Attendee Name & Role */}
              <div style={{ marginTop: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                  {attendee.full_name}
                </h3>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginTop: '4px' }}>
                  {attendee.job_title || 'Attendee'}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {attendee.company_name || 'Organization'}
                </div>
              </div>

              {/* QR Code */}
              {qrDataUrl && (
                <div style={{ marginTop: '16px', padding: '6px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <img src={qrDataUrl} alt="Badge QR Code" style={{ width: '110px', height: '110px', display: 'block' }} />
                </div>
              )}

              {/* Category Pill */}
              <div
                style={{
                  marginTop: '16px',
                  background: currentStyle.tagBg,
                  color: currentStyle.tagColor,
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.8px',
                  padding: '4px 14px',
                  borderRadius: '999px',
                  textTransform: 'uppercase',
                }}
              >
                {currentStyle.title}
              </div>
            </div>
          </div>
        </div>

        <p style={{ margin: 0, fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
          Clicking Print Badge will automatically mark this attendee as "Badge Printed" in the database and launch the print dialog.
        </p>
      </div>
    </Modal>
  );
};
