// Route guard: only signed-in admins reach the workspace.
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { getAccessToken } from '../../services/tokenStorage';
import { Splash } from '../../components/common';
import { restoreSession } from './authThunks';

export interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const initializing = useAppSelector((state) => state.auth.initializing);

  // A token saved from an earlier visit is exchanged for a fresh profile on /auth/me.
  useEffect(() => {
    if (!user && getAccessToken()) {
      dispatch(restoreSession());
    }
  }, [dispatch, user]);

  if (!isAuthenticated || !user) {
    if (initializing) {
      return <Splash label="Restoring your session…" />;
    }
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

export default RequireAuth;
