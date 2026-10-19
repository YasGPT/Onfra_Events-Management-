import type { FC } from 'react';
import { Icon } from '../../components/common';
import type { AttendeeStats } from '../../types';

export interface AttendeesQuickStatsProps {
  stats: AttendeeStats | null;
  loading: boolean;
  activeStatus: string;
  onSelectStatus: (status: string) => void;
}

export const AttendeesQuickStats: FC<AttendeesQuickStatsProps> = ({
  stats,
  loading,
  activeStatus,
  onSelectStatus,
}) => {
  const cards = [
    {
      id: 'all',
      label: 'Total Registrations',
      count: stats?.total ?? 0,
      icon: 'users',
      accentColor: '#3b82f6',
      bg: '#eff6ff',
    },
    {
      id: 'pending',
      label: 'Pending Approvals',
      count: stats?.pending ?? 0,
      icon: 'clock',
      accentColor: '#f59e0b',
      bg: '#fffbeb',
      highlight: (stats?.pending ?? 0) > 0,
    },
    {
      id: 'approved',
      label: 'Approved',
      count: stats?.approved ?? 0,
      icon: 'check-circle',
      accentColor: '#10b981',
      bg: '#ecfdf5',
    },
    {
      id: 'checked_in',
      label: 'Checked In',
      count: stats?.checkedIn ?? 0,
      icon: 'check',
      accentColor: '#059669',
      bg: '#ecfdf5',
    },
    {
      id: 'rejected',
      label: 'Rejected',
      count: stats?.rejected ?? 0,
      icon: 'x-circle',
      accentColor: '#ef4444',
      bg: '#fef2f2',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '12px',
        marginBottom: '20px',
      }}
    >
      {cards.map((c) => {
        const isSelected = activeStatus === c.id;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelectStatus(c.id)}
            style={{
              padding: '14px 16px',
              borderRadius: '10px',
              background: '#ffffff',
              border: isSelected ? `2px solid ${c.accentColor}` : '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
              boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
            }}
          >
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>{c.label}</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                {loading ? '…' : c.count}
              </div>
            </div>
            <span
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: c.bg,
                color: c.accentColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name={c.icon as any} />
            </span>
          </button>
        );
      })}
    </div>
  );
};
