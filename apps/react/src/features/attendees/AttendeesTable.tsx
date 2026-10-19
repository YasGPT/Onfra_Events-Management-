import { Icon } from '../../components/common';
import { formatDate } from '../../utils';
import type { Attendee } from '../../types';

export interface AttendeesTableProps {
  attendees: Attendee[];
  loading: boolean;
  search: string;
  eventId: string;
  updatingId: string | null;
  onToggle: (attendee: Attendee) => void;
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

/** Directory table for the attendees of the active event. */
export function AttendeesTable({
  attendees,
  loading,
  search,
  updatingId,
  onToggle,
}: AttendeesTableProps) {
  if (loading && attendees.length === 0) {
    return (
      <div className="table-skeleton" aria-hidden="true">
        {[0, 1, 2, 3].map((key) => (
          <span key={key} />
        ))}
      </div>
    );
  }

  if (attendees.length === 0) {
    return (
      <div className="empty-state">
        <strong>{search ? 'No attendee matches that search' : 'No attendees yet'}</strong>
        {search
          ? 'Try another name, email or company.'
          : 'Register the first attendee and they can immediately sign in on the mobile app.'}
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Attendee</th>
            <th>Company / role</th>
            <th>Registration</th>
            <th>Account</th>
            <th>Registered</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {attendees.map((attendee) => {
            const busy = attendee.id === updatingId;
            const registration = attendee.registration_status || 'registered';

            return (
              <tr key={attendee.id}>
                <td>
                  <div className="attendee-cell">
                    <span className="attendee-cell__avatar" aria-hidden="true">
                      {initials(attendee.full_name)}
                    </span>
                    <span>
                      <strong className="data-table__primary">{attendee.full_name}</strong>
                      <span className="data-table__sub">{attendee.email}</span>
                    </span>
                  </div>
                </td>

                <td>
                  <span className="data-table__primary">{attendee.company_name || '—'}</span>
                  <span className="data-table__sub">{attendee.job_title || 'No job title'}</span>
                </td>

                <td>
                  <span className={`status-pill status-pill--${registration}`}>{registration}</span>
                </td>

                <td>
                  <span className={`status-pill status-pill--${attendee.is_active ? 'active' : 'inactive'}`}>
                    {attendee.is_active ? 'active' : 'inactive'}
                  </span>
                </td>

                <td>{formatDate(attendee.registered_at || attendee.created_at)}</td>

                <td>
                  <div className="data-table__actions">
                    <button
                      className={`ghost-button ${attendee.is_active ? 'ghost-button--danger' : ''}`}
                      type="button"
                      disabled={busy}
                      onClick={() => onToggle(attendee)}
                    >
                      {busy ? (
                        'Saving…'
                      ) : attendee.is_active ? (
                        <>
                          <Icon name="lock" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Icon name="check" />
                          Activate
                        </>
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default AttendeesTable;
