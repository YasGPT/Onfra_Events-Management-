import { useEffect, useState, type FC } from 'react';
import { Modal, Icon } from '../../components/common';
import { eventsApi, type EventSettings } from '../../api';

export interface EventSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventName: string;
}

export const EventSettingsModal: FC<EventSettingsModalProps> = ({
  isOpen,
  onClose,
  eventId,
  eventName,
}) => {
  const [settings, setSettings] = useState<EventSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (isOpen && eventId) {
      setLoading(true);
      setNotice(null);
      eventsApi
        .getEventSettings(eventId)
        .then((data) => setSettings(data))
        .catch((err: any) => {
          setNotice({
            text: err?.message || 'Failed to fetch event settings.',
            type: 'error',
          });
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, eventId]);

  const handleToggleFeature = (feature: keyof EventSettings['features']) => {
    if (!settings) return;
    setSettings({
      ...settings,
      features: {
        ...settings.features,
        [feature]: !settings.features[feature],
      },
    });
  };

  const handleToggleRegistration = (field: keyof EventSettings['registration']) => {
    if (!settings) return;
    setSettings({
      ...settings,
      registration: {
        ...settings.registration,
        [field]: !settings.registration[field],
      },
    });
  };

  const handleTogglePrivacy = (field: keyof EventSettings['privacy']) => {
    if (!settings) return;
    setSettings({
      ...settings,
      privacy: {
        ...settings.privacy,
        [field]: !settings.privacy[field],
      },
    });
  };

  const handleSave = async () => {
    if (!settings || !eventId) return;

    try {
      setSaving(true);
      setNotice(null);
      const updated = await eventsApi.updateEventSettings(eventId, settings);
      setSettings(updated);
      setNotice({ text: 'Event settings updated successfully!', type: 'success' });
      setTimeout(() => {
        setNotice(null);
      }, 4000);
    } catch (err: any) {
      setNotice({
        text: err?.message || 'Failed to save event settings.',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} title={`Event Settings & Feature Toggles — ${eventName}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '70vh', overflowY: 'auto', paddingRight: '0.25rem' }}>
        {notice && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              backgroundColor: notice.type === 'success' ? '#f0fdf4' : '#fef2f2',
              color: notice.type === 'success' ? '#166534' : '#dc2626',
              border: `1px solid ${notice.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
              fontSize: '0.875rem',
            }}
          >
            {notice.text}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
            <Icon name="refresh" /> Loading settings from backend…
          </div>
        ) : settings ? (
          <>
            {/* Section 1: Feature Modules Toggles */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
              <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', fontWeight: 650, color: '#0f172a' }}>
                Event Feature Modules
              </h4>
              <p style={{ margin: '0 0 1rem', fontSize: '0.825rem', color: '#64748b' }}>
                Toggle which modules are enabled for attendees in the mobile application.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                {(
                  [
                    { key: 'networking', label: '1-on-1 Networking', desc: 'Allow attendee connections' },
                    { key: 'meetings', label: '1-on-1 Meetings', desc: 'Meeting scheduling system' },
                    { key: 'chat', label: 'Live Chat', desc: 'Direct in-app messaging' },
                    { key: 'gallery', label: 'Photo Gallery', desc: 'Event photo albums & uploads' },
                    { key: 'exhibitors', label: 'Exhibitors & Floor Map', desc: 'Stalls & booth navigation' },
                    { key: 'sponsors', label: 'Sponsors & Partners', desc: 'Tiered partner directory' },
                  ] as const
                ).map((item) => (
                  <label
                    key={item.key}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      padding: '0.6rem 0.75rem',
                      background: settings.features[item.key] ? '#f8fafc' : '#ffffff',
                      border: '1px solid',
                      borderColor: settings.features[item.key] ? '#cbd5e1' : '#f1f5f9',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(settings.features[item.key])}
                      onChange={() => handleToggleFeature(item.key)}
                      style={{ marginTop: '0.2rem', cursor: 'pointer' }}
                    />
                    <div>
                      <strong style={{ fontSize: '0.875rem', display: 'block' }}>{item.label}</strong>
                      <span style={{ fontSize: '0.775rem', color: '#64748b' }}>{item.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Section 2: Registration & Approval Rules */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
              <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', fontWeight: 650, color: '#0f172a' }}>
                Registration & Access Rules
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.75rem',
                    background: '#f8fafc',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.875rem' }}>Require Admin Approval</strong>
                    <div style={{ fontSize: '0.775rem', color: '#64748b' }}>
                      New registrations start as PENDING until approved by an admin
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(settings.registration.require_admin_approval)}
                    onChange={() => handleToggleRegistration('require_admin_approval')}
                    style={{ cursor: 'pointer' }}
                  />
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.75rem',
                    background: '#f8fafc',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.875rem' }}>Allow Public Web Registration</strong>
                    <div style={{ fontSize: '0.775rem', color: '#64748b' }}>
                      Enable self-service registration route (/register/:eventSlug)
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(settings.registration.allow_public_registration)}
                    onChange={() => handleToggleRegistration('allow_public_registration')}
                    style={{ cursor: 'pointer' }}
                  />
                </label>
              </div>
            </div>

            {/* Section 3: Privacy & Meeting Rules */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
              <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', fontWeight: 650, color: '#0f172a' }}>
                Privacy & Networking Defaults
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 0.75rem',
                    background: '#f8fafc',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(settings.privacy.directory_visible_default)}
                    onChange={() => handleTogglePrivacy('directory_visible_default')}
                  />
                  <span style={{ fontSize: '0.85rem' }}>Show attendees in directory by default</span>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 0.75rem',
                    background: '#f8fafc',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(settings.privacy.allow_contact_sharing)}
                    onChange={() => handleTogglePrivacy('allow_contact_sharing')}
                  />
                  <span style={{ fontSize: '0.85rem' }}>Allow contact detail sharing between connections</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                    Max Meeting Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    value={settings.meeting_rules.max_duration_minutes || 30}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        meeting_rules: {
                          ...settings.meeting_rules,
                          max_duration_minutes: parseInt(e.target.value, 10) || 30,
                        },
                      })
                    }
                    min={10}
                    max={120}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                    Meeting Buffer Time (Minutes)
                  </label>
                  <input
                    type="number"
                    value={settings.meeting_rules.buffer_minutes || 10}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        meeting_rules: {
                          ...settings.meeting_rules,
                          buffer_minutes: parseInt(e.target.value, 10) || 10,
                        },
                      })
                    }
                    min={0}
                    max={60}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>
            </div>
          </>
        ) : null}

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button type="button" className="ghost-button" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={handleSave}
            disabled={saving || loading || !settings}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Icon name="check" />
            {saving ? 'Saving Changes…' : 'Save Settings'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default EventSettingsModal;
