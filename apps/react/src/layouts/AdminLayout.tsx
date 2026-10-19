// Admin sidebar/header layout
import { useState, type FC, type ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '../app/hooks';
import { Brand, Icon } from '../components/common';
import type { IconName } from '../components/common';
import { signOut } from '../features/auth/authThunks';
import { selectActiveEvent } from '../features/events/eventsThunks';
import { useActiveEvent } from '../features/events/useActiveEvent';
import { useLoadEvents } from '../features/events/useLoadEvents';
import { EventSettingsModal } from '../features/events/EventSettingsModal';
import './admin.css';

export interface AdminLayoutProps {
  children?: ReactNode;
}

interface NavItem {
  label: string;
  path: string;
  icon: IconName;
  /** Modules that are not built yet are shown but not clickable. */
  available?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: 'grid', available: true },
  { label: 'Manage Event Details', path: '/events', icon: 'calendar', available: true },
  { label: 'Manage Agenda', path: '/agenda', icon: 'calendar' },
  { label: 'Manage Attendees', path: '/attendees', icon: 'users', available: true },
  { label: 'Manage Exhibitors', path: '/exhibitors', icon: 'building', available: true },
  { label: 'Manage Sponsors & Partners', path: '/sponsors', icon: 'handshake' },
  { label: 'Manage Users', path: '/users', icon: 'user' },
  { label: 'Reports & Analytics', path: '/reports', icon: 'chart' },
];

export const AdminLayout: FC<AdminLayoutProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const eventList = useAppSelector((state) => state.events.list);
  const activeEvent = useActiveEvent();
  const [settingsOpen, setSettingsOpen] = useState(false);

  // The header switcher needs the event list even when the first screen is the dashboard.
  useLoadEvents();

  const handleSignOut = async () => {
    await dispatch(signOut());
    navigate('/login', { replace: true });
  };

  const handleSwitchEvent = (eventId: string) => {
    const next = eventList.find((item) => item.id === eventId);
    if (next) void dispatch(selectActiveEvent(next));
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Brand variant="light" />

        <nav className="admin-nav" aria-label="Admin sections">
          {navItems.map((item) =>
            item.available ? (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => `admin-nav__link ${isActive ? 'is-active' : ''}`}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </NavLink>
            ) : (
              <button key={item.path} className="admin-nav__link admin-nav__link--disabled" type="button" disabled>
                <Icon name={item.icon} />
                <span>{item.label}</span>
                <em>soon</em>
              </button>
            ),
          )}
        </nav>

        <p className="admin-sidebar__note">
          Connected to the shared Confra API<br />
          <code>{activeEvent?.businessCode || 'no event scope'}</code>
        </p>
      </aside>

      <div className="admin-body">
        <header className="admin-topbar">
          <div className="admin-topbar__event">
            <span className="admin-topbar__label">Active event</span>
            {eventList.length > 1 ? (
              <select
                className="admin-topbar__switcher"
                value={activeEvent?.id ?? ''}
                onChange={(event) => handleSwitchEvent(event.target.value)}
                aria-label="Switch active event"
              >
                {!activeEvent && <option value="">Select an event</option>}
                {eventList.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · {item.business_code}
                  </option>
                ))}
              </select>
            ) : (
              <strong>{activeEvent?.name || activeEvent?.businessCode || 'Select an event'}</strong>
            )}

            {activeEvent && (
              <button
                type="button"
                className="ghost-button"
                title="Event Settings & Rules"
                onClick={() => setSettingsOpen(true)}
                style={{ padding: '4px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              >
                <Icon name="shield" />
                <span>Settings</span>
              </button>
            )}
          </div>

          <div className="admin-topbar__user">
            <div className="admin-topbar__details">
              <strong>{user?.name}</strong>
              <span>{user?.role || 'Administrator'}</span>
            </div>
            <span className="admin-topbar__avatar" aria-hidden="true">
              {(user?.name || 'A').charAt(0).toUpperCase()}
            </span>
            <button className="admin-topbar__signout" type="button" onClick={handleSignOut}>
              <Icon name="logout" />
              Sign out
            </button>
          </div>
        </header>

        <main className="admin-content">{children ?? <Outlet />}</main>
      </div>

      {activeEvent && (
        <EventSettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          eventId={activeEvent.id}
          eventName={activeEvent.name || activeEvent.businessCode || 'Active Event'}
        />
      )}
    </div>
  );
};

export default AdminLayout;
