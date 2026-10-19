import { useEffect, useState, useCallback, type FC } from 'react';
import { NavLink } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { Icon } from '../../components/common';
import type { Attendee } from '../../types';
import { useActiveEvent } from '../events';
import { AttendeesTable } from './AttendeesTable';
import { AttendeesQuickStats } from './AttendeesQuickStats';
import { RegisterAttendeeModal } from './RegisterAttendeeModal';
import { BulkImportModal } from './BulkImportModal';
import { EditAttendeeModal } from './EditAttendeeModal';
import { AttendeeProfileModal } from './AttendeeProfileModal';
import { RejectAttendeeModal } from './RejectAttendeeModal';
import { SendEmailModal } from './SendEmailModal';
import { BadgeModal } from './BadgeModal';
import { QrCheckInModal } from './QrCheckInModal';
import {
  fetchAttendees,
  fetchAttendeeStats,
  approveAttendee,
  bulkApproveAttendees,
  checkInAttendee,
  checkOutAttendee,
  deleteAttendee,
  bulkDeleteAttendees,
  bulkPrintBadges,
  resendAttendeeLink,
} from './attendeesThunks';
import { clearAttendees, clearLinkNotice } from './attendeesSlice';
import './attendees.css';

function exportToCsv(attendees: Attendee[], filename: string) {
  const headers = [
    'Full Name',
    'Email',
    'Phone',
    'Company Name',
    'Job Title',
    'Registration Status',
    'Check-in Status',
    'Check-in Time',
    'Check-in Location',
    'Check-in Count',
    'Badge Printed',
    'Registration Date',
  ];

  const escapeCell = (val: unknown) => {
    const str = val === null || val === undefined ? '' : String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const rows = attendees.map((a) => [
    escapeCell(a.full_name),
    escapeCell(a.email),
    escapeCell(a.phone),
    escapeCell(a.company_name),
    escapeCell(a.job_title),
    escapeCell(a.registration_status || 'registered'),
    escapeCell(a.is_checked_in ? 'Checked In' : 'Not Checked In'),
    escapeCell(a.checked_in_at),
    escapeCell(a.check_in_location),
    escapeCell(a.check_in_count || 0),
    escapeCell(a.is_badge_printed ? 'Yes' : 'No'),
    escapeCell(a.registered_at || a.created_at),
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export const AttendeesPage: FC = () => {
  const dispatch = useAppDispatch();
  const activeEvent = useActiveEvent();
  const { items, stats, loading, statsLoading, error, updatingId, linkBusyId, linkNotice, linkError } =
    useAppSelector((state) => state.attendees);

  // Filters State
  const [searchDraft, setSearchDraft] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('');
  const [jobTitleFilter, setJobTitleFilter] = useState<string>('');
  const [checkInFilter, setCheckInFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modals state
  const [registerOpen, setRegisterOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [profileModalAttendee, setProfileModalAttendee] = useState<Attendee | null>(null);
  const [editModalAttendee, setEditModalAttendee] = useState<Attendee | null>(null);
  const [rejectModalData, setRejectModalData] = useState<{
    isOpen: boolean;
    attendeeId?: string;
    attendeeName?: string;
    bulkAttendeeIds?: string[];
  }>({ isOpen: false });
  const [emailModalData, setEmailModalData] = useState<{
    isOpen: boolean;
    attendeeId?: string;
    attendeeName?: string;
    attendeeEmail?: string;
    bulkAttendeeIds?: string[];
  }>({ isOpen: false });
  const [badgeModalAttendee, setBadgeModalAttendee] = useState<Attendee | null>(null);
  const [qrCheckInOpen, setQrCheckInOpen] = useState(false);

  // Status message / toast
  const [bannerMessage, setBannerMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(
    null
  );

  const eventId = activeEvent?.id ?? '';

  const showNotification = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    setBannerMessage({ text, type });
    setTimeout(() => {
      setBannerMessage(null);
    }, 4500);
  }, []);

  // Fetch attendees with filters
  const loadAttendees = useCallback(() => {
    if (!eventId) return;

    const params: Record<string, string | undefined> = {
      eventId,
      search: appliedSearch || undefined,
      company: companyFilter.trim() || undefined,
      job_title: jobTitleFilter.trim() || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    };

    if (statusFilter !== 'all' && statusFilter !== 'checked_in') {
      params.status = statusFilter;
    }

    if (checkInFilter !== 'all') {
      params.checkInStatus = checkInFilter;
    } else if (statusFilter === 'checked_in') {
      params.checkInStatus = 'checked_in';
    }

    void dispatch(fetchAttendees(params as any));
    void dispatch(fetchAttendeeStats(eventId));
  }, [
    dispatch,
    eventId,
    appliedSearch,
    statusFilter,
    companyFilter,
    jobTitleFilter,
    checkInFilter,
    startDate,
    endDate,
  ]);

  useEffect(() => {
    if (!eventId) {
      dispatch(clearAttendees());
      return;
    }
    loadAttendees();
  }, [eventId, loadAttendees, dispatch]);

  // Handle Multi-Select
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === items.length && items.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((a) => a.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Actions
  const handleApprove = async (attendee: Attendee) => {
    if (!eventId) return;
    try {
      await dispatch(approveAttendee({ eventId, attendeeId: attendee.id })).unwrap();
      showNotification(`Approved ${attendee.full_name}'s registration.`);
      loadAttendees();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to approve attendee', 'error');
    }
  };

  const handleToggleCheckIn = async (attendee: Attendee) => {
    if (!eventId) return;
    try {
      if (attendee.is_checked_in) {
        await dispatch(checkOutAttendee({ eventId, attendeeId: attendee.id })).unwrap();
        showNotification(`Checked out ${attendee.full_name}`);
      } else {
        await dispatch(checkInAttendee({ eventId, attendeeId: attendee.id, gate_location: 'Admin Desk' })).unwrap();
        showNotification(`Checked in ${attendee.full_name} at Admin Desk`);
      }
      loadAttendees();
    } catch (err: any) {
      showNotification(err?.message || 'Check-in failed', 'error');
    }
  };

  const handlePasswordSetupEmail = async (attendee: Attendee) => {
    if (!eventId) return;
    try {
      // The slice keeps the result in linkNotice so it stays visible until dismissed.
      await dispatch(resendAttendeeLink({ eventId, attendeeId: attendee.id })).unwrap();
      loadAttendees();
    } catch {
      /* surfaced through the setup-link banner below */
    }
  };

  const handleDelete = async (attendee: Attendee) => {
    if (!eventId) return;
    if (window.confirm(`Are you sure you want to permanently delete attendee "${attendee.full_name}"?`)) {
      try {
        await dispatch(deleteAttendee({ eventId, attendeeId: attendee.id })).unwrap();
        showNotification(`Deleted attendee ${attendee.full_name}`);
        if (selectedIds.has(attendee.id)) {
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(attendee.id);
            return next;
          });
        }
        loadAttendees();
      } catch (err: any) {
        showNotification(err?.message || 'Failed to delete attendee', 'error');
      }
    }
  };

  // Bulk Actions
  const handleBulkApprove = async () => {
    if (!eventId || selectedIds.size === 0) return;
    try {
      const ids = Array.from(selectedIds);
      await dispatch(bulkApproveAttendees({ eventId, attendeeIds: ids })).unwrap();
      showNotification(`Successfully approved ${ids.length} attendees.`);
      handleClearSelection();
      loadAttendees();
    } catch (err: any) {
      showNotification(err?.message || 'Bulk approve failed', 'error');
    }
  };

  const handleBulkReject = () => {
    if (selectedIds.size === 0) return;
    setRejectModalData({
      isOpen: true,
      bulkAttendeeIds: Array.from(selectedIds),
    });
  };

  const handleBulkEmail = () => {
    if (selectedIds.size === 0) return;
    setEmailModalData({
      isOpen: true,
      bulkAttendeeIds: Array.from(selectedIds),
    });
  };

  const handleBulkBadge = async () => {
    if (!eventId || selectedIds.size === 0) return;
    try {
      const ids = Array.from(selectedIds);
      await dispatch(bulkPrintBadges({ eventId, attendeeIds: ids })).unwrap();
      showNotification(`Generated badges for ${ids.length} attendees.`);
      loadAttendees();
    } catch (err: any) {
      showNotification(err?.message || 'Bulk badge generation failed', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (!eventId || selectedIds.size === 0) return;
    if (
      window.confirm(
        `Are you sure you want to delete ${selectedIds.size} selected attendee(s)? This action cannot be undone.`
      )
    ) {
      try {
        const ids = Array.from(selectedIds);
        await dispatch(bulkDeleteAttendees({ eventId, attendeeIds: ids })).unwrap();
        showNotification(`Successfully deleted ${ids.length} attendees.`);
        handleClearSelection();
        loadAttendees();
      } catch (err: any) {
        showNotification(err?.message || 'Bulk delete failed', 'error');
      }
    }
  };

  const handleExportSelected = () => {
    const selectedAttendees = items.filter((a) => selectedIds.has(a.id));
    if (selectedAttendees.length === 0) return;
    exportToCsv(selectedAttendees, `attendees-selected-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleExportAll = () => {
    if (items.length === 0) return;
    exportToCsv(items, `attendees-export-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleClearFilters = () => {
    setSearchDraft('');
    setAppliedSearch('');
    setStatusFilter('all');
    setCompanyFilter('');
    setJobTitleFilter('');
    setCheckInFilter('all');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = Boolean(
    appliedSearch ||
      statusFilter !== 'all' ||
      companyFilter ||
      jobTitleFilter ||
      checkInFilter !== 'all' ||
      startDate ||
      endDate
  );

  if (!activeEvent) {
    return (
      <section className="attendees">
        <header className="page-head">
          <div>
            <span className="page-head__eyebrow">Attendees</span>
            <h1>Manage Attendees</h1>
          </div>
        </header>

        <div className="empty-state">
          <strong>No active event selected</strong>
          Attendees are stored per event. Pick an event first and this screen will load its directory.
          <div className="empty-state__action">
            <NavLink className="ghost-button ghost-button--primary" to="/events">
              <Icon name="calendar" />
              Go to Events
            </NavLink>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="attendees">
      {/* Page Header */}
      <header className="page-head">
        <div>
          <span className="page-head__eyebrow">{activeEvent.businessCode} · Module 3</span>
          <h1>Manage Attendees</h1>
          <p>
            Attendee registration, approval queues, check-in tracking, badges, and real-time directory
            sync.
          </p>
        </div>

        <div className="page-head__actions">
          <button
            className="ghost-button"
            type="button"
            onClick={() => setQrCheckInOpen(true)}
            title="Scan QR token for fast check-in"
          >
            <Icon name="qr" />
            QR Scanner Check-in
          </button>

          <button
            className="ghost-button"
            type="button"
            onClick={handleExportAll}
            disabled={items.length === 0}
            title="Export full list to CSV"
          >
            <Icon name="download" />
            Export to CSV
          </button>

          <button
            className="ghost-button"
            type="button"
            onClick={() => setBulkImportOpen(true)}
            title="Import attendees from a CSV file"
          >
            <Icon name="plus" />
            Bulk Import (CSV)
          </button>

          <button
            className="ghost-button ghost-button--primary"
            type="button"
            onClick={() => setRegisterOpen(true)}
          >
            <Icon name="plus" />
            Register Attendee
          </button>
        </div>
      </header>

      {/* Banner Notification */}
      {bannerMessage && (
        <div className={`notification-banner notification-banner--${bannerMessage.type}`}>
          <Icon name={bannerMessage.type === 'success' ? 'check-circle' : 'x-circle'} />
          <span>{bannerMessage.text}</span>
          <button
            type="button"
            className="notification-banner__close"
            onClick={() => setBannerMessage(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Setup-link delivery status – stays until dismissed */}
      {(linkNotice || linkError) && (
        <div className={`notification-banner notification-banner--${linkError ? 'error' : 'info'}`}>
          <Icon name={linkError ? 'x-circle' : 'mail'} />
          <span>{linkError || linkNotice}</span>
          <button
            type="button"
            className="notification-banner__close"
            onClick={() => dispatch(clearLinkNotice())}
          >
            ×
          </button>
        </div>
      )}

      {/* Quick Stats Bar */}
      <AttendeesQuickStats
        stats={stats}
        loading={statsLoading}
        activeStatus={statusFilter}
        onSelectStatus={(status) => {
          setStatusFilter(status);
        }}
      />

      {/* Main Directory Panel */}
      <div className="panel attendees-panel">
        {/* Comprehensive Filter Bar */}
        <div className="attendee-filters-container">
          <form
            className="attendee-filters-form"
            onSubmit={(e) => {
              e.preventDefault();
              setAppliedSearch(searchDraft.trim());
            }}
          >
            {/* Search by Name/Email */}
            <div className="filter-item filter-item--search">
              <Icon name="search" />
              <input
                type="search"
                placeholder="Search by Name or Email..."
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                aria-label="Search by Name or Email"
              />
            </div>

            {/* Registration Status Filter */}
            <div className="filter-item">
              <label htmlFor="filter-status" className="filter-label">
                Status:
              </label>
              <select
                id="filter-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="registered">Registered</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Company Filter */}
            <div className="filter-item">
              <label htmlFor="filter-company" className="filter-label">
                Company:
              </label>
              <input
                id="filter-company"
                type="text"
                placeholder="Filter company..."
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="filter-input"
              />
            </div>

            {/* Job Title Filter */}
            <div className="filter-item">
              <label htmlFor="filter-job" className="filter-label">
                Job Title:
              </label>
              <input
                id="filter-job"
                type="text"
                placeholder="Filter title..."
                value={jobTitleFilter}
                onChange={(e) => setJobTitleFilter(e.target.value)}
                className="filter-input"
              />
            </div>

            {/* Check-in Status Filter */}
            <div className="filter-item">
              <label htmlFor="filter-checkin" className="filter-label">
                Check-in:
              </label>
              <select
                id="filter-checkin"
                value={checkInFilter}
                onChange={(e) => setCheckInFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Check-in</option>
                <option value="checked_in">Checked In</option>
                <option value="not_checked_in">Not Checked In</option>
              </select>
            </div>

            {/* Date Range Filters */}
            <div className="filter-item filter-item--date">
              <label htmlFor="filter-from-date" className="filter-label">
                From:
              </label>
              <input
                id="filter-from-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="filter-date"
                title="Registration Start Date"
              />
            </div>

            <div className="filter-item filter-item--date">
              <label htmlFor="filter-to-date" className="filter-label">
                To:
              </label>
              <input
                id="filter-to-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="filter-date"
                title="Registration End Date"
              />
            </div>

            {/* Submit / Action buttons */}
            <div className="filter-actions">
              <button className="ghost-button ghost-button--primary" type="submit" disabled={loading}>
                <Icon name="search" />
                Apply
              </button>

              {hasActiveFilters && (
                <button className="ghost-button" type="button" onClick={handleClearFilters}>
                  Clear
                </button>
              )}

              <button
                className="ghost-button"
                type="button"
                onClick={loadAttendees}
                disabled={loading}
                title="Refresh from database"
              >
                <Icon name="refresh" />
              </button>
            </div>
          </form>
        </div>

        {/* Floating / Sticky Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div className="attendees-bulk-bar">
            <div className="attendees-bulk-bar__info">
              <span className="attendees-bulk-bar__count">{selectedIds.size}</span>
              <span>attendee(s) selected</span>
            </div>

            <div className="attendees-bulk-bar__actions">
              <button
                type="button"
                className="bulk-action-btn bulk-action-btn--approve"
                onClick={handleBulkApprove}
                title="Approve all selected pending attendees"
              >
                <Icon name="check-circle" />
                Bulk Approve
              </button>

              <button
                type="button"
                className="bulk-action-btn bulk-action-btn--reject"
                onClick={handleBulkReject}
                title="Reject selected with reason"
              >
                <Icon name="x-circle" />
                Bulk Reject
              </button>

              <button
                type="button"
                className="bulk-action-btn"
                onClick={handleBulkEmail}
                title="Send announcement or setup email to selected"
              >
                <Icon name="send" />
                Bulk Email
              </button>

              <button
                type="button"
                className="bulk-action-btn"
                onClick={handleBulkBadge}
                title="Generate badge records for selected"
              >
                <Icon name="badge" />
                Bulk Badges
              </button>

              <button
                type="button"
                className="bulk-action-btn"
                onClick={handleExportSelected}
                title="Download CSV for selected attendees"
              >
                <Icon name="download" />
                Export Selected
              </button>

              <button
                type="button"
                className="bulk-action-btn bulk-action-btn--danger"
                onClick={handleBulkDelete}
                title="Delete selected attendees"
              >
                <Icon name="trash" />
                Delete
              </button>

              <button
                type="button"
                className="bulk-action-btn bulk-action-btn--close"
                onClick={handleClearSelection}
                title="Cancel selection"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Error message */}
        {error ? <p className="panel__error">{error}</p> : null}

        {/* Directory Table */}
        <AttendeesTable
          attendees={items}
          loading={loading}
          search={appliedSearch}
          eventId={activeEvent.id}
          updatingId={updatingId}
          linkBusyId={linkBusyId}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          onViewProfile={(att) => setProfileModalAttendee(att)}
          onEdit={(att) => setEditModalAttendee(att)}
          onApprove={handleApprove}
          onReject={(att) =>
            setRejectModalData({
              isOpen: true,
              attendeeId: att.id,
              attendeeName: att.full_name,
            })
          }
          onSendEmail={(att) =>
            setEmailModalData({
              isOpen: true,
              attendeeId: att.id,
              attendeeName: att.full_name,
              attendeeEmail: att.email,
            })
          }
          onPasswordSetupEmail={handlePasswordSetupEmail}
          onPrintBadge={(att) => setBadgeModalAttendee(att)}
          onToggleCheckIn={handleToggleCheckIn}
          onDelete={handleDelete}
        />
      </div>

      {/* --- Modals --- */}

      {/* Register Attendee Modal */}
      <RegisterAttendeeModal
        open={registerOpen}
        eventId={activeEvent.id}
        eventName={activeEvent.name}
        onClose={() => setRegisterOpen(false)}
        onSuccess={() => {
          showNotification('Attendee registered successfully!');
          loadAttendees();
        }}
      />

      {/* Bulk Import CSV Modal */}
      <BulkImportModal
        isOpen={bulkImportOpen}
        eventId={activeEvent.id}
        onClose={() => setBulkImportOpen(false)}
        onImportComplete={() => {
          showNotification('Attendees bulk imported successfully!');
          loadAttendees();
          void dispatch(fetchAttendeeStats(activeEvent.id));
        }}
      />

      {/* Attendee Profile Modal (Sections A - F) */}
      <AttendeeProfileModal
        isOpen={Boolean(profileModalAttendee)}
        attendee={profileModalAttendee}
        activeEvent={activeEvent}
        onClose={() => setProfileModalAttendee(null)}
        onEdit={(att) => {
          setProfileModalAttendee(null);
          setEditModalAttendee(att);
        }}
        onReject={(att) => {
          setProfileModalAttendee(null);
          setRejectModalData({
            isOpen: true,
            attendeeId: att.id,
            attendeeName: att.full_name,
          });
        }}
        onSendEmail={(att) => {
          setEmailModalData({
            isOpen: true,
            attendeeId: att.id,
            attendeeName: att.full_name,
            attendeeEmail: att.email,
          });
        }}
        onPrintBadge={(att) => {
          setBadgeModalAttendee(att);
        }}
        onSuccess={() => {
          loadAttendees();
        }}
      />

      {/* Edit Attendee Modal */}
      <EditAttendeeModal
        isOpen={Boolean(editModalAttendee)}
        attendee={editModalAttendee}
        eventId={activeEvent.id}
        onClose={() => setEditModalAttendee(null)}
        onSuccess={() => {
          showNotification('Attendee updated successfully!');
          loadAttendees();
        }}
      />

      {/* Reject Attendee Modal */}
      <RejectAttendeeModal
        isOpen={rejectModalData.isOpen}
        eventId={activeEvent.id}
        attendeeId={rejectModalData.attendeeId}
        attendeeName={rejectModalData.attendeeName}
        bulkAttendeeIds={rejectModalData.bulkAttendeeIds}
        onClose={() => setRejectModalData({ isOpen: false })}
        onSuccess={() => {
          showNotification(
            rejectModalData.bulkAttendeeIds
              ? `Rejected ${rejectModalData.bulkAttendeeIds.length} attendee(s)`
              : 'Attendee registration rejected'
          );
          handleClearSelection();
          loadAttendees();
        }}
      />

      {/* Send Custom / Preset Email Modal */}
      <SendEmailModal
        isOpen={emailModalData.isOpen}
        eventId={activeEvent.id}
        attendeeId={emailModalData.attendeeId}
        attendeeName={emailModalData.attendeeName}
        attendeeEmail={emailModalData.attendeeEmail}
        bulkAttendeeIds={emailModalData.bulkAttendeeIds}
        onClose={() => setEmailModalData({ isOpen: false })}
        onSuccess={() => {
          showNotification('Email message sent successfully!');
          handleClearSelection();
        }}
      />

      {/* Badge Preview and Print Modal */}
      <BadgeModal
        isOpen={Boolean(badgeModalAttendee)}
        attendee={badgeModalAttendee}
        activeEvent={activeEvent}
        onClose={() => setBadgeModalAttendee(null)}
      />

      {/* QR Check-in Station Modal */}
      <QrCheckInModal
        isOpen={qrCheckInOpen}
        eventId={activeEvent.id}
        onClose={() => setQrCheckInOpen(false)}
        onSuccess={() => {
          showNotification('Attendee check-in recorded via QR token!');
          loadAttendees();
        }}
      />
    </section>
  );
};

export default AttendeesPage;
