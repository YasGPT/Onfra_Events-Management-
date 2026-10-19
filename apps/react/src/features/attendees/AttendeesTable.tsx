import { useState, useRef, useEffect, type FC } from 'react';
import { Icon } from '../../components/common';
import { formatDate } from '../../utils';
import type { Attendee } from '../../types';

export interface AttendeesTableProps {
  attendees: Attendee[];
  loading: boolean;
  search: string;
  eventId: string;
  updatingId: string | null;
  linkBusyId?: string | null;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onViewProfile: (attendee: Attendee) => void;
  onEdit: (attendee: Attendee) => void;
  onApprove: (attendee: Attendee) => void;
  onReject: (attendee: Attendee) => void;
  onSendEmail: (attendee: Attendee) => void;
  onPasswordSetupEmail: (attendee: Attendee) => void;
  onPrintBadge: (attendee: Attendee) => void;
  onToggleCheckIn: (attendee: Attendee) => void;
  onDelete: (attendee: Attendee) => void;
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

/**
 * Where the attendee currently stands on the "can they sign in?" question:
 * pending -> no link yet, approved -> link emailed but no password, registered -> usable account.
 */
function describeAccountAccess(attendee: Attendee): { tone: string; label: string; hint: string } {
  const status = attendee.registration_status || 'registered';

  if (status === 'pending') {
    return {
      tone: 'setup-none',
      label: 'Not sent',
      hint: 'Approve the registration to email a password setup link.',
    };
  }

  if (status === 'rejected') {
    return {
      tone: 'setup-none',
      label: 'Blocked',
      hint: attendee.rejection_reason ? `Rejected: ${attendee.rejection_reason}` : 'Registration was rejected.',
    };
  }

  if (attendee.password_setup_at) {
    return {
      tone: 'setup-done',
      label: 'Password set',
      hint: `Can sign in with email or mobile since ${formatDate(attendee.password_setup_at)}.`,
    };
  }

  if (attendee.email_verified_at) {
    return {
      tone: 'setup-sent',
      label: 'Link sent',
      hint: `Emailed ${formatDate(attendee.email_verified_at)} — still waiting for them to create a password.`,
    };
  }

  return {
    tone: 'setup-needed',
    label: 'Link pending',
    hint: 'No setup link sent yet. Use “Send Link” to email the password setup link.',
  };
}

/** True when the attendee is approved but has not created a password. */
function needsSetupLink(attendee: Attendee): boolean {
  return attendee.registration_status === 'approved' && !attendee.password_setup_at;
}

interface RowActionsMenuProps {
  attendee: Attendee;
  updating: boolean;
  linkBusy: boolean;
  onViewProfile: () => void;
  onEdit: () => void;
  onApprove: () => void;
  onReject: () => void;
  onSendEmail: () => void;
  onPasswordSetupEmail: () => void;
  onPrintBadge: () => void;
  onToggleCheckIn: () => void;
  onDelete: () => void;
}

const RowActionsMenu: FC<RowActionsMenuProps> = ({
  attendee,
  updating,
  linkBusy,
  onViewProfile,
  onEdit,
  onApprove,
  onReject,
  onSendEmail,
  onPasswordSetupEmail,
  onPrintBadge,
  onToggleCheckIn,
  onDelete,
}) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const isPending = attendee.registration_status === 'pending';
  const canSendLink = needsSetupLink(attendee);
  const linkAlreadySent = Boolean(attendee.email_verified_at) && canSendLink;
  const isCheckedIn = Boolean(attendee.is_checked_in);

  return (
    <div className="attendee-actions-cell" ref={menuRef}>
      {/* Quick Primary Action */}
      {isPending ? (
        <button
          type="button"
          className="action-btn action-btn--approve"
          disabled={updating}
          title="One-click Approve"
          onClick={onApprove}
        >
          <Icon name="check" />
          <span>Approve</span>
        </button>
      ) : (
        <button
          type="button"
          className={`action-btn ${isCheckedIn ? 'action-btn--checked-in' : 'action-btn--check-in'}`}
          disabled={updating}
          title={isCheckedIn ? 'Click to Check Out' : 'Click to Check In'}
          onClick={onToggleCheckIn}
        >
          <Icon name={isCheckedIn ? 'check-circle' : 'check'} />
          <span>{isCheckedIn ? 'Check Out' : 'Check In'}</span>
        </button>
      )}

      {canSendLink && (
        <button
          type="button"
          className="action-btn action-btn--link"
          disabled={linkBusy || updating}
          title={linkAlreadySent ? 'Re-send the password setup link' : 'Email the password setup link'}
          onClick={onPasswordSetupEmail}
        >
          <Icon name="key" />
          <span>{linkBusy ? 'Sending…' : linkAlreadySent ? 'Resend Link' : 'Send Link'}</span>
        </button>
      )}

      {/* 3-dots Menu Button */}
      <div className="dropdown-wrapper">
        <button
          type="button"
          className={`dropdown-trigger ${open ? 'active' : ''}`}
          onClick={() => setOpen((prev) => !prev)}
          title="More actions"
          aria-expanded={open}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="19" r="2" />
          </svg>
        </button>

        {open && (
          <div className="actions-dropdown-menu">
            <button
              type="button"
              className="dropdown-item"
              onClick={() => {
                setOpen(false);
                onViewProfile();
              }}
            >
              <Icon name="users" />
              <span>View Profile</span>
            </button>

            <button
              type="button"
              className="dropdown-item"
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
            >
              <Icon name="edit" />
              <span>Edit Profile</span>
            </button>

            {isPending && (
              <>
                <button
                  type="button"
                  className="dropdown-item dropdown-item--approve"
                  onClick={() => {
                    setOpen(false);
                    onApprove();
                  }}
                >
                  <Icon name="check-circle" />
                  <span>Approve Registration</span>
                </button>
                <button
                  type="button"
                  className="dropdown-item dropdown-item--danger"
                  onClick={() => {
                    setOpen(false);
                    onReject();
                  }}
                >
                  <Icon name="x-circle" />
                  <span>Reject with Reason</span>
                </button>
              </>
            )}

            {canSendLink && (
              <button
                type="button"
                className="dropdown-item"
                disabled={linkBusy}
                onClick={() => {
                  setOpen(false);
                  onPasswordSetupEmail();
                }}
              >
                <Icon name="key" />
                <span>{linkAlreadySent ? 'Resend Password Setup Link' : 'Send Password Setup Link'}</span>
              </button>
            )}

            <button
              type="button"
              className="dropdown-item"
              onClick={() => {
                setOpen(false);
                onPrintBadge();
              }}
            >
              <Icon name="badge" />
              <span>Generate / Print Badge</span>
            </button>

            <button
              type="button"
              className="dropdown-item"
              onClick={() => {
                setOpen(false);
                onSendEmail();
              }}
            >
              <Icon name="send" />
              <span>Send Custom Email</span>
            </button>

            <button
              type="button"
              className="dropdown-item dropdown-item--danger"
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
            >
              <Icon name="trash" />
              <span>Delete Attendee</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const AttendeesTable: FC<AttendeesTableProps> = ({
  attendees,
  loading,
  search,
  updatingId,
  linkBusyId = null,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onViewProfile,
  onEdit,
  onApprove,
  onReject,
  onSendEmail,
  onPasswordSetupEmail,
  onPrintBadge,
  onToggleCheckIn,
  onDelete,
}) => {
  if (loading && attendees.length === 0) {
    return (
      <div className="table-skeleton" aria-hidden="true">
        {[0, 1, 2, 3, 4, 5].map((key) => (
          <span key={key} />
        ))}
      </div>
    );
  }

  if (attendees.length === 0) {
    return (
      <div className="empty-state">
        <Icon name="users" />
        <strong>{search ? 'No attendee matches that filter' : 'No attendees registered yet'}</strong>
        <p>
          {search
            ? 'Try adjusting your search criteria, status filter, or date range.'
            : 'Register your first attendee or invite participants to start tracking check-ins and badges.'}
        </p>
      </div>
    );
  }

  const allSelected = attendees.length > 0 && attendees.every((a) => selectedIds.has(a.id));
  const someSelected = attendees.some((a) => selectedIds.has(a.id)) && !allSelected;

  return (
    <div className="table-wrap attendee-table-wrap">
      <table className="data-table attendee-table">
        <thead>
          <tr>
            <th style={{ width: '40px', textAlign: 'center' }}>
              <input
                type="checkbox"
                className="custom-checkbox"
                checked={allSelected}
                ref={(input) => {
                  if (input) input.indeterminate = someSelected;
                }}
                onChange={onSelectAll}
                aria-label="Select all attendees"
              />
            </th>
            <th>Full Name & Photo</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Company Name</th>
            <th>Job Title</th>
            <th>Registration Status</th>
            <th>Account Access</th>
            <th>Check-in Status</th>
            <th>QR Status</th>
            <th>Badge Printed</th>
            <th>Registration Date</th>
            <th style={{ minWidth: '210px', textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {attendees.map((attendee) => {
            const isSelected = selectedIds.has(attendee.id);
            const busy = attendee.id === updatingId;
            const status = attendee.registration_status || 'registered';
            const account = describeAccountAccess(attendee);
            const isCheckedIn = Boolean(attendee.is_checked_in);
            const hasQr = Boolean(attendee.qr_token_hash || attendee.id);
            const isBadgePrinted = Boolean(attendee.is_badge_printed);

            return (
              <tr key={attendee.id} className={isSelected ? 'row--selected' : ''}>
                {/* Multi-select Checkbox */}
                <td style={{ textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    className="custom-checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(attendee.id)}
                    aria-label={`Select ${attendee.full_name}`}
                  />
                </td>

                {/* Full Name & Thumbnail Photo */}
                <td>
                  <div
                    className="attendee-cell attendee-cell--clickable"
                    onClick={() => onViewProfile(attendee)}
                    title="Click to view profile"
                  >
                    {attendee.photo_url ? (
                      <img
                        src={attendee.photo_url}
                        alt={attendee.full_name}
                        className="attendee-avatar-img"
                      />
                    ) : (
                      <span className="attendee-cell__avatar" aria-hidden="true">
                        {initials(attendee.full_name)}
                      </span>
                    )}
                    <div className="attendee-cell__info">
                      <strong className="attendee-name">{attendee.full_name}</strong>
                      {!attendee.is_active && (
                        <span className="attendee-cell__tag attendee-cell__tag--inactive">Deactivated</span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Email */}
                <td>
                  <span className="data-table__primary attendee-email" title={attendee.email}>
                    {attendee.email}
                  </span>
                </td>

                {/* Phone */}
                <td>
                  <span className="data-table__sub">
                    {attendee.phone || <span className="text-muted">—</span>}
                  </span>
                </td>

                {/* Company Name */}
                <td>
                  <span className="data-table__primary">
                    {attendee.company_name || <span className="text-muted">—</span>}
                  </span>
                </td>

                {/* Job Title */}
                <td>
                  <span className="data-table__sub">
                    {attendee.job_title || <span className="text-muted">—</span>}
                  </span>
                </td>

                {/* Registration Status */}
                <td>
                  <span className={`status-pill status-pill--${status}`}>
                    {status === 'pending' && <Icon name="clock" />}
                    {status === 'approved' && <Icon name="check-circle" />}
                    {status === 'registered' && <Icon name="check" />}
                    {status === 'rejected' && <Icon name="x-circle" />}
                    <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                  </span>
                </td>

                {/* Account access – is a login actually possible yet? */}
                <td>
                  <span className={`setup-pill setup-pill--${account.tone}`} title={account.hint}>
                    <Icon name={account.tone === 'setup-done' ? 'check-circle' : 'key'} />
                    <span>{account.label}</span>
                  </span>
                </td>

                {/* Check-in Status */}
                <td>
                  {isCheckedIn ? (
                    <span className="checkin-badge checkin-badge--in" title={`Gate: ${attendee.check_in_location || 'Main Gate'} · ${attendee.checked_in_at ? formatDate(attendee.checked_in_at) : 'Checked in'}`}>
                      <Icon name="check-circle" />
                      <span>In ({attendee.check_in_location || 'Gate'})</span>
                    </span>
                  ) : (
                    <span className="checkin-badge checkin-badge--out">
                      <span>Not Checked In</span>
                    </span>
                  )}
                </td>

                {/* QR Code Status */}
                <td>
                  {hasQr ? (
                    <button
                      type="button"
                      className="qr-status-btn"
                      onClick={() => onViewProfile(attendee)}
                      title="QR Ready — Click to preview"
                    >
                      <Icon name="qr" />
                      <span>Ready</span>
                    </button>
                  ) : (
                    <span className="text-muted">None</span>
                  )}
                </td>

                {/* Badge Printed */}
                <td>
                  {isBadgePrinted ? (
                    <span className="badge-status-pill badge-status-pill--printed" title={attendee.badge_printed_at ? `Printed ${formatDate(attendee.badge_printed_at)}` : 'Badge printed'}>
                      <Icon name="printer" />
                      <span>Printed</span>
                    </span>
                  ) : (
                    <span className="badge-status-pill badge-status-pill--pending">
                      <span>Pending</span>
                    </span>
                  )}
                </td>

                {/* Registration Date */}
                <td>
                  <span className="data-table__sub">
                    {formatDate(attendee.registered_at || attendee.created_at)}
                  </span>
                </td>

                {/* Actions */}
                <td style={{ textAlign: 'right' }}>
                  <RowActionsMenu
                    attendee={attendee}
                    updating={busy}
                    linkBusy={attendee.id === linkBusyId}
                    onViewProfile={() => onViewProfile(attendee)}
                    onEdit={() => onEdit(attendee)}
                    onApprove={() => onApprove(attendee)}
                    onReject={() => onReject(attendee)}
                    onSendEmail={() => onSendEmail(attendee)}
                    onPasswordSetupEmail={() => onPasswordSetupEmail(attendee)}
                    onPrintBadge={() => onPrintBadge(attendee)}
                    onToggleCheckIn={() => onToggleCheckIn(attendee)}
                    onDelete={() => onDelete(attendee)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AttendeesTable;
