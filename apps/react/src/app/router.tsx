// App routing configuration
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import AdminLayout from '../layouts/AdminLayout';
import { AttendeesPage, SetPasswordPage } from '../features/attendees';
import { DashboardPage } from '../features/dashboard';
import { CreateEventPage, EventsPage } from '../features/events';
import { ExhibitorsPage } from '../features/exhibitors';
import { LoginPage, RequireAuth } from '../features/auth';

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Public attendee screen – opened from the approval email link. */}
        <Route path="/set-password" element={<SetPasswordPage />} />

        {/* Everything inside the shell requires a valid admin session. */}
        <Route
          path="/"
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="events/new" element={<CreateEventPage />} />
          <Route path="attendees" element={<AttendeesPage />} />
          <Route path="exhibitors" element={<ExhibitorsPage />} />
        </Route>

        {/* Modules below are not built yet – keep the admin inside the workspace. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
