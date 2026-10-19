import { useEffect, useState, type FC } from 'react';
import QRCode from 'qrcode';

import { Modal, Icon } from '../../components/common';
import { formatDate } from '../../utils';
import type { Attendee, AttendeePrivacySetting } from '../../types';
import { useAppDispatch } from '../../app/hooks';
import {
  approveAttendee,
  checkInAttendee,
  checkOutAttendee,
  deleteAttendee,
  fetchAttendeeById,
  regenerateQr,
  resetPasswordToken,
  toggleAttendeeStatus,
  updateAttendeePrivacy,
} from './attendeesThunks';

export interface AttendeeProfileModalProps {
  attendee: Attendee | null;
  activeEvent: { id: string; name: string; businessCode?: string; business_code?: string } | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (attendee: Attendee) => void;
  onReject: (attendee: Attendee) => void;
  onSendEmail: (attendee: Attendee) => void;
  onPrintBadge: (attendee: Attendee) => void;
  onSuccess: () => void;
}


export const AttendeeProfileModal: FC<AttendeeProfileModalProps> = ({
  attendee,
  activeEvent,
  isOpen,
  onClose,
  onEdit,
  onReject,
  onSendEmail,
  onPrintBadge,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<'info' | 'qr' | 'privacy' | 'activity'>('info');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [privacySettings, setPrivacySettings] = useState<Record<string, boolean>>({
    email: true,
    phone: false,
    company_name: true,
    job_title: true,
    qr_sharing: true,
  });
  const [privacySaving, setPrivacySaving] = useState<boolean>(false);
  const [privacySaved, setPrivacySaved] = useState<boolean>(false);
  const [passwordSetupLink, setPasswordSetupLink] = useState<string | null>(null);

  // Load detailed attendee data (with activity logs and check-ins) whenever modal opens
  useEffect(() => {
    if (isOpen && attendee && activeEvent?.id) {
      void dispatch(fetchAttendeeById({ eventId: activeEvent.id, attendeeId: attendee.id }));
    }
  }, [isOpen, attendee?.id, activeEvent?.id, dispatch]);

  // Generate QR code data URL
  useEffect(() => {
    if (attendee?.qr_token_hash) {
      QRCode.toDataURL(attendee.qr_token_hash, {
        width: 220,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to generate QR:', err));
    } else if (attendee?.id) {
      QRCode.toDataURL(`ONFRA:ATTENDEE:${attendee.id}`, { width: 220, margin: 1 })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to generate QR:', err));
    }
  }, [attendee?.qr_token_hash, attendee?.id]);

  // Initialize privacy settings
  useEffect(() => {
    if (attendee?.AttendeePrivacySettings && attendee.AttendeePrivacySettings.length > 0) {
      const next: Record<string, boolean> = {
        email: true,
        phone: false,
        company_name: true,
        job_title: true,
        qr_sharing: true,
      };
      attendee.AttendeePrivacySettings.forEach((s) => {
        if (s.field_name === 'qr_sharing') {
          next.qr_sharing = Boolean(s.allow_qr_share);
        } else {
          next[s.field_name] = Boolean(s.directory_visible);
        }
      });
      setPrivacySettings(next);
    }
  }, [attendee?.AttendeePrivacySettings]);

  if (!isOpen || !attendee || !activeEvent) return null;

  const handleApprove = async () => {
    setLoading(true);
    await dispatch(approveAttendee({ eventId: activeEvent.id, attendeeId: attendee.id }));
    setLoading(false);
    onSuccess();
  };

  const handleToggleCheckIn = async () => {
    setLoading(true);
    if (attendee.is_checked_in) {
      await dispatch(checkOutAttendee({ eventId: activeEvent.id, attendeeId: attendee.id }));
    } else {
      await dispatch(
        checkInAttendee({
          eventId: activeEvent.id,
          attendeeId: attendee.id,
          gate_location: 'Admin Portal',
          method: 'manual',
        })
      );
    }
    setLoading(false);
    onSuccess();
  };

  const handleToggleActive = async () => {
    setLoading(true);
    await dispatch(
      toggleAttendeeStatus({
        eventId: activeEvent.id,
        attendeeId: attendee.id,
        isActive: !attendee.is_active,
      })
    );
    setLoading(false);
    onSuccess();
  };

  const handleResetPassword = async () => {
    setLoading(true);
    const result = await dispatch(
      resetPasswordToken({
        eventId: activeEvent.id,
        attendeeId: attendee.id,
      })
    );
    setLoading(false);
    if (resetPasswordToken.fulfilled.match(result)) {
      const token = result.payload.password_setup_token;
      setPasswordSetupLink(`${window.location.origin}/set-password/${attendee.id}?token=${token}`);
      onSuccess();
    }
  };

  const handleRegenerateQr = async () => {
    if (confirm('Regenerating QR will invalidate the previous badge QR code. Proceed?')) {
      setLoading(true);
      await dispatch(regenerateQr({ eventId: activeEvent.id, attendeeId: attendee.id }));
      setLoading(false);
      onSuccess();
    }
  };

  const handleSavePrivacy = async () => {
    setPrivacySaving(true);
    setPrivacySaved(false);
    const settingsPayload: AttendeePrivacySetting[] = [
      { attendee_id: attendee.id, field_name: 'email', directory_visible: privacySettings.email, allow_qr_share: privacySettings.qr_sharing },
      { attendee_id: attendee.id, field_name: 'phone', directory_visible: privacySettings.phone, allow_qr_share: privacySettings.qr_sharing },
      { attendee_id: attendee.id, field_name: 'company_name', directory_visible: privacySettings.company_name, allow_qr_share: privacySettings.qr_sharing },
      { attendee_id: attendee.id, field_name: 'job_title', directory_visible: privacySettings.job_title, allow_qr_share: privacySettings.qr_sharing },
      { attendee_id: attendee.id, field_name: 'qr_sharing', directory_visible: true, allow_qr_share: privacySettings.qr_sharing },
    ];

    await dispatch(
      updateAttendeePrivacy({
        eventId: activeEvent.id,
        attendeeId: attendee.id,
        settings: settingsPayload,
      })
    );
    setPrivacySaving(false);
    setPrivacySaved(true);
    setTimeout(() => setPrivacySaved(false), 3000);
    onSuccess();
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete attendee '${attendee.full_name}' permanently? This cannot be undone.`)) {
      setLoading(true);
      await dispatch(deleteAttendee({ eventId: activeEvent.id, attendeeId: attendee.id }));
      setLoading(false);
      onSuccess();
      onClose();
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR_${attendee.full_name.replace(/\s+/g, '_')}.png`;
    a.click();
  };

  const handlePrintQr = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html>
        <head><title>QR Code - ${attendee.full_name}</title></head>
        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:90vh;font-family:sans-serif;">
          <h2>${attendee.full_name}</h2>
          <p>${attendee.company_name || ''} · ${attendee.job_title || ''}</p>
          <img src="${qrDataUrl}" style="width:300px;height:300px;margin:20px 0;" />
          <p style="font-size:12px;color:#64748b;">${attendee.email} · Onfra Events</p>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
  };

  const status = attendee.registration_status || 'registered';

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={attendee.full_name}
      subtitle={`Attendee Profile · ${attendee.email}`}
      footer={(
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="ghost-button"
              style={{ color: '#d64555' }}
              onClick={handleDelete}
              disabled={loading}
            >
              <Icon name="trash" />
              Delete Account
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={handleToggleActive}
              disabled={loading}
            >
              <Icon name={attendee.is_active ? 'lock' : 'check'} />
              {attendee.is_active ? 'Deactivate' : 'Activate'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="ghost-button" onClick={onClose}>
              Close
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                onClose();
                onEdit(attendee);
              }}
            >
              <Icon name="edit" />
              Edit Profile
            </button>
            <button
              type="button"
              className="ghost-button ghost-button--primary"
              onClick={() => {
                onClose();
                onPrintBadge(attendee);
              }}
            >
              <Icon name="badge" />
              Badge & Print
            </button>
          </div>
        </div>
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Attendee Hero Card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            background: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {attendee.photo_url ? (
              <img
                src={attendee.photo_url}
                alt={attendee.full_name}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #cbd5e1',
                }}
              />
            ) : (
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#e2e8f0',
                  color: '#334155',
                  fontSize: '22px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {attendee.full_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  {attendee.full_name}
                </h3>
                <span className={`status-pill status-pill--${status}`}>
                  {status}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: attendee.is_checked_in ? '#ecfdf5' : '#f1f5f9',
                    color: attendee.is_checked_in ? '#059669' : '#64748b',
                  }}
                >
                  {attendee.is_checked_in ? '✓ Checked In' : 'Not Checked In'}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>
                {attendee.job_title ? `${attendee.job_title} at ` : ''}
                <strong>{attendee.company_name || 'Individual'}</strong>
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {status === 'pending' && (
              <>
                <button
                  type="button"
                  className="ghost-button"
                  style={{ background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}
                  onClick={handleApprove}
                  disabled={loading}
                >
                  <Icon name="check-circle" />
                  Approve
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  style={{ background: '#fef2f2', color: '#b91c1c', borderColor: '#fecaca' }}
                  onClick={() => {
                    onClose();
                    onReject(attendee);
                  }}
                  disabled={loading}
                >
                  <Icon name="x-circle" />
                  Reject
                </button>
              </>
            )}

            <button
              type="button"
              className="ghost-button"
              onClick={handleToggleCheckIn}
              disabled={loading}
              title={attendee.is_checked_in ? 'Check out' : 'Check in'}
            >
              <Icon name="check" />
              {attendee.is_checked_in ? 'Check Out' : 'Check In'}
            </button>

            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                onClose();
                onSendEmail(attendee);
              }}
              disabled={loading}
            >
              <Icon name="mail" />
              Email
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
          {[
            { id: 'info', label: 'Details & Info', icon: 'user' },
            { id: 'qr', label: 'QR Code', icon: 'qr' },
            { id: 'privacy', label: 'Privacy Settings', icon: 'shield' },
            { id: 'activity', label: 'Activity Log', icon: 'history' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? '#2563eb' : '#64748b',
                background: activeTab === tab.id ? '#eff6ff' : 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Icon name={tab.icon as any} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: Sections A, B & C (Personal, Professional, Registration Details) */}
        {activeTab === 'info' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Section A: Personal Info */}
            <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#64748b' }}>
                Section A · Personal Information
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Full Name</span>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{attendee.full_name}</div>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Email</span>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{attendee.email}</div>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Phone</span>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{attendee.phone || '—'}</div>
                </div>
              </div>
              {attendee.bio && (
                <div style={{ marginTop: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Biography</span>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>{attendee.bio}</p>
                </div>
              )}
            </div>

            {/* Section B: Professional Info */}
            <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#64748b' }}>
                Section B · Professional Information
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Company Name</span>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{attendee.company_name || '—'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Job Title</span>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{attendee.job_title || '—'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Website</span>
                  <div style={{ fontSize: '14px', color: '#2563eb' }}>
                    {attendee.website_url ? (
                      <a href={attendee.website_url} target="_blank" rel="noreferrer">
                        {attendee.website_url.replace(/^https?:\/\//, '')}
                      </a>
                    ) : (
                      '—'
                    )}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>LinkedIn</span>
                  <div style={{ fontSize: '14px', color: '#2563eb' }}>
                    {attendee.linkedin_url ? (
                      <a href={attendee.linkedin_url} target="_blank" rel="noreferrer">
                        Profile Link
                      </a>
                    ) : (
                      '—'
                    )}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>WhatsApp</span>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                    {attendee.whatsapp_url || attendee.phone || '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Section C: Registration & Check-in Details */}
            <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#64748b' }}>
                Section C · Registration & Check-in Details
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Registration Date</span>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                    {formatDate(attendee.registered_at || attendee.created_at)}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Approval Date</span>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                    {attendee.approved_at ? formatDate(attendee.approved_at) : 'Not Approved / N/A'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Last Check-in</span>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                    {attendee.checked_in_at
                      ? `${formatDate(attendee.checked_in_at)} (${attendee.check_in_location || 'Gate'})`
                      : 'Never checked in'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Total Check-ins</span>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                    {attendee.check_in_count || 0} times
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Badge Status</span>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                    {attendee.is_badge_printed
                      ? `Printed (${attendee.badge_template || 'standard'})`
                      : 'Not Printed'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Account Access</span>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: attendee.is_active ? '#059669' : '#dc2626' }}>
                    {attendee.is_active ? 'Active' : 'Deactivated'}
                  </div>
                </div>
              </div>

              {attendee.rejection_reason && (
                <div style={{ marginTop: '12px', padding: '10px', background: '#fef2f2', borderRadius: '6px', color: '#991b1b', fontSize: '13px' }}>
                  <strong>Rejection Reason:</strong> {attendee.rejection_reason}
                </div>
              )}

              {/* Password Setup Token Generator Box */}
              <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {attendee.password_setup_token
                    ? `Active setup token: ${attendee.password_setup_token.slice(0, 10)}...`
                    : 'Attendee does not have an active setup token'}
                </div>
                <button
                  type="button"
                  className="ghost-button"
                  style={{ fontSize: '12px' }}
                  onClick={handleResetPassword}
                  disabled={loading}
                >
                  <Icon name="key" />
                  Generate Password Setup Token
                </button>
              </div>

              {passwordSetupLink && (
                <div style={{ marginTop: '10px', padding: '10px', background: '#eff6ff', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e40af', marginBottom: '4px' }}>
                    PASSWORD SETUP LINK GENERATED:
                  </div>
                  <code style={{ fontSize: '12px', wordBreak: 'break-all', color: '#1e3a8a' }}>
                    {passwordSetupLink}
                  </code>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Section D - QR Code Management */}
        {activeTab === 'qr' && (
          <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              Attendee Networking & Check-in QR
            </h4>
            <p style={{ margin: '0 0 18px', fontSize: '13px', color: '#64748b', maxWidth: '420px' }}>
              Used by attendee for fast badge scanning at entry gates, session tracking, and attendee-to-attendee networking contact exchange.
            </p>

            {qrDataUrl && (
              <div style={{ padding: '12px', background: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
                <img src={qrDataUrl} alt="QR Code" style={{ width: '200px', height: '200px', display: 'block' }} />
              </div>
            )}

            <div style={{ marginTop: '12px', fontSize: '12px', color: '#64748b' }}>
              Token Hash: <code>{attendee.qr_token_hash ? `${attendee.qr_token_hash.slice(0, 16)}...` : 'None'}</code>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button type="button" className="ghost-button" onClick={handleDownloadQr}>
                <Icon name="download" />
                Download PNG
              </button>
              <button type="button" className="ghost-button" onClick={handlePrintQr}>
                <Icon name="printer" />
                Print QR Code
              </button>
              <button type="button" className="ghost-button" onClick={handleRegenerateQr} disabled={loading}>
                <Icon name="refresh" />
                Regenerate QR
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: Section E - Privacy Settings */}
        {activeTab === 'privacy' && (
          <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <h4 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
              Directory & Contact Privacy Settings
            </h4>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#64748b' }}>
              Control which information is visible to other attendees in the public event attendee directory and what is shared during badge/QR networking scans.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { id: 'email', label: 'Email Address Visibility', desc: 'Allow other registered attendees to view email address in directory' },
                { id: 'phone', label: 'Phone Number Visibility', desc: 'Display phone number in public directory profile' },
                { id: 'company_name', label: 'Company Name Visibility', desc: 'Display company and organization info' },
                { id: 'job_title', label: 'Job Title Visibility', desc: 'Display job title in attendee listing and search' },
                { id: 'qr_sharing', label: 'QR Contact Sharing Allowed', desc: 'Allow contact details to be shared when other attendees scan this badge' },
              ].map((item) => (
                <label
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(privacySettings[item.id])}
                    onChange={(e) =>
                      setPrivacySettings((prev) => ({ ...prev, [item.id]: e.target.checked }))
                    }
                    style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0f172a' }}>{item.label}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{item.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              {privacySaved && (
                <span style={{ fontSize: '13px', color: '#059669', fontWeight: 600 }}>
                  ✓ Privacy settings updated in database!
                </span>
              )}
              <button
                type="button"
                className="ghost-button ghost-button--primary"
                onClick={handleSavePrivacy}
                disabled={privacySaving}
              >
                <Icon name="check" />
                {privacySaving ? 'Saving…' : 'Save Privacy Rules'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: Section F - Activity Log Timeline */}
        {activeTab === 'activity' && (
          <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <h4 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
              Activity Timeline & Check-in History
            </h4>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b' }}>
              Complete audit log of actions, approvals, check-ins, badge generation and emails stored in database.
            </p>

            {(!attendee.AttendeeActivityLogs || attendee.AttendeeActivityLogs.length === 0) ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                No activity logs recorded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {attendee.AttendeeActivityLogs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      background: '#f8fafc',
                      border: '1px solid #f1f5f9',
                    }}
                  >
                    <span
                      style={{
                        padding: '6px',
                        borderRadius: '50%',
                        background: '#e0e7ff',
                        color: '#3730a3',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon name="history" />
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{log.title}</strong>
                        <span style={{ fontSize: '11.5px', color: '#64748b' }}>{formatDate(log.created_at)}</span>
                      </div>
                      {log.description && (
                        <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#475569', lineHeight: 1.4 }}>
                          {log.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
