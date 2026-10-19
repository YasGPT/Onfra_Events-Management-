import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface Exhibitor {
  id: string;
  event_id: string;
  company_name: string;
  category_id?: string | null;
  description?: string | null;
  website_url?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  booth_number?: string | null;
  booth_type?: string;
  stall_size?: string | null;
  zone_location?: string | null;
  special_requirements?: string | null;
  internal_notes?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive';
  display_order: number;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
  };
}

export interface ExhibitorsState {
  exhibitors: Exhibitor[];
  loading: boolean;
  error: string | null;
  stats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    active: number;
  } | null;
}

const initialState: ExhibitorsState = {
  exhibitors: [],
  loading: false,
  error: null,
  stats: null,
};

const exhibitorsSlice = createSlice({
  name: 'exhibitors',
  initialState,
  reducers: {
    setLoading: (state) => {
      state.loading = true;
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    setExhibitors: (state, action: PayloadAction<Exhibitor[]>) => {
      state.loading = false;
      state.exhibitors = action.payload;
    },
    setStats: (state, action: PayloadAction<ExhibitorsState['stats']>) => {
      state.stats = action.payload;
    },
    reset: () => initialState,
  },
});

export const { setLoading, setError, setExhibitors, setStats, reset } = exhibitorsSlice.actions;
export default exhibitorsSlice;
