import './App.css';

import { useEffect } from 'react';

import { useAppDispatch } from './app/hooks';
import { AppRouter } from './app/router';
import { logout } from './features/auth/authSlice';

function App() {
  const dispatch = useAppDispatch();

  // The API client broadcasts this when the backend rejects the stored token.
  useEffect(() => {
    const handleUnauthorized = () => {
      dispatch(logout());
    };

    window.addEventListener('confra:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('confra:unauthorized', handleUnauthorized);
  }, [dispatch]);

  return <AppRouter />;
}

export default App;
