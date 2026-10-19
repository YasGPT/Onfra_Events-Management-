import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { useActiveEvent } from '../events';
import { useLoadEvents } from '../events/useLoadEvents';
import { fetchEvents } from '../events/eventsThunks';
import { ApiStatusCard } from './ApiStatusCard';
import { EventListPanel } from './EventListPanel';
import { QuickLinks } from './QuickLinks';
import { SessionCard } from './SessionCard';
import './dashboard.css';

/** First screen after sign-in — everything here is fetched live from the backend. */
export function DashboardPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const sessionEvent = useAppSelector((state) => state.auth.event);
  const { list, loading, error } = useAppSelector((state) => state.events);
  const activeEvent = useActiveEvent();

  useLoadEvents();

  const scopedEvent = list.find((item) => item.id === (activeEvent?.id ?? sessionEvent?.id));
  const firstName = user?.name ? user.name.split(' ')[0] : 'Administrator';

  return (
    <section className="dashboard">
      <div className="dashboard__intro">
        <span className="dashboard__eyebrow">Workspace</span>
        <h1>Welcome back, {firstName}</h1>
        <p>
          This admin frontend is talking to the shared Confra API. The session, connection status
          and event list below all come from <code>apps/backend</code>.
        </p>
      </div>

      <div className="dashboard__grid">
        <SessionCard
          user={user}
          event={sessionEvent}
          activeEventName={scopedEvent?.name || activeEvent?.name}
        />
        <ApiStatusCard />
        <QuickLinks />
        <EventListPanel
          events={list}
          loading={loading}
          error={error}
          activeEventId={activeEvent?.id ?? sessionEvent?.id}
          onReload={() => void dispatch(fetchEvents())}
        />
      </div>
    </section>
  );
}

export default DashboardPage;
