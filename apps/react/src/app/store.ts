import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import eventsReducer from '../features/events/eventsSlice';
import activeEventReducer from '../features/events/activeEventSlice';
import attendeesReducer from '../features/attendees/attendeesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    events: eventsReducer,
    activeEvent: activeEventReducer,
    attendees: attendeesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
