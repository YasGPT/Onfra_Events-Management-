import { useEffect, useState } from 'react';

import { Icon } from '../../components/common';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { ExhibitorModal } from './ExhibitorModal';
import {
  fetchExhibitors,
  fetchExhibitorStats,
  deleteExhibitor,
  updateExhibitorStatus,
} from './exhibitorsThunks';
import { reset, type Exhibitor } from './exhibitorsSlice';

export function ExhibitorsPage() {
  const dispatch = useAppDispatch();
  const exhibitorsState = useAppSelector((state) => state.exhibitors as any);
  const { exhibitors = [], stats = null } = exhibitorsState || {};
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedExhibitor, setSelectedExhibitor] = useState<Exhibitor | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dispatch(fetchExhibitors());
    dispatch(fetchExhibitorStats());
    return () => {
      dispatch(reset());
    };
  }, [dispatch]);

  const handleCreate = () => {
    setSelectedExhibitor(null);
    setModalOpen(true);
  };

  const handleEdit = (exhibitor: Exhibitor) => {
    setSelectedExhibitor(exhibitor);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this exhibitor?')) {
      await dispatch(deleteExhibitor(id));
      dispatch(fetchExhibitors());
      dispatch(fetchExhibitorStats());
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    await dispatch(updateExhibitorStatus({ id, status }));
    dispatch(fetchExhibitors());
    dispatch(fetchExhibitorStats());
  };

  const filteredExhibitors = exhibitors.filter((exhibitor: Exhibitor) => {
    const matchesStatus = filterStatus === 'all' || exhibitor.status === filterStatus;
    const matchesSearch =
      !searchQuery ||
      exhibitor.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exhibitor.contact_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#d97706';
      case 'approved':
        return '#059669';
      case 'rejected':
        return '#dc2626';
      case 'active':
        return '#0891b2';
      case 'inactive':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'pending':
        return '#fef3c7';
      case 'approved':
        return '#dcfce7';
      case 'rejected':
        return '#fee2e2';
      case 'active':
        return '#e0f2fe';
      case 'inactive':
        return '#f3f4f6';
      default:
        return '#f3f4f6';
    }
  };

  return (
    <div style={{ padding: '32px', background: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div>
            <span style={{ 
              display: 'inline-block', 
              padding: '6px 12px', 
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', 
              color: 'white', 
              borderRadius: '100px', 
              fontSize: '11px', 
              fontWeight: 700, 
              letterSpacing: '0.1em', 
              textTransform: 'uppercase',
              marginBottom: '12px'
            }}>
              Commercial
            </span>
            <h1 style={{ 
              fontSize: '32px', 
              fontWeight: 800, 
              margin: '0 0 8px', 
              letterSpacing: '-0.02em',
              color: '#1e293b'
            }}>
              Manage Exhibitors
            </h1>
            <p style={{ 
              fontSize: '15px', 
              color: '#64748b', 
              margin: 0,
              lineHeight: 1.6
            }}>
              Manage exhibitors, booth assignments, and booth details for your event
            </p>
          </div>
          <button
            onClick={handleCreate}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Icon name="plus" />
            Add Exhibitor
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
          gap: '20px', 
          marginBottom: '32px' 
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                borderRadius: '12px',
                color: 'white'
              }}>
                <Icon name="users" />
              </div>
              <div>
                <h3 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 4px', color: '#1e293b' }}>
                  {stats.total}
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0, fontWeight: 500 }}>
                  Total Exhibitors
                </p>
              </div>
            </div>
          </div>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#fef3c7',
                borderRadius: '12px',
                color: '#d97706'
              }}>
                <Icon name="clock" />
              </div>
              <div>
                <h3 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 4px', color: '#1e293b' }}>
                  {stats.pending}
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0, fontWeight: 500 }}>
                  Pending
                </p>
              </div>
            </div>
          </div>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#dcfce7',
                borderRadius: '12px',
                color: '#059669'
              }}>
                <Icon name="check" />
              </div>
              <div>
                <h3 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 4px', color: '#1e293b' }}>
                  {stats.approved}
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0, fontWeight: 500 }}>
                  Approved
                </p>
              </div>
            </div>
          </div>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#e0f2fe',
                borderRadius: '12px',
                color: '#0891b2'
              }}>
                <Icon name="grid" />
              </div>
              <div>
                <h3 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 4px', color: '#1e293b' }}>
                  {stats.active}
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0, fontWeight: 500 }}>
                  Active
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <div style={{
          flex: 1,
          minWidth: '300px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          background: 'white',
          borderRadius: '12px',
          border: '2px solid #e2e8f0',
          padding: '12px 16px',
          transition: 'border-color 0.2s ease'
        }}>
          <span style={{ color: '#94a3b8', marginRight: '12px' }}>
            <Icon name="search" />
          </span>
          <input
            type="text"
            placeholder="Search exhibitors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              fontSize: '14px',
              fontWeight: 500,
              color: '#1e293b',
              background: 'transparent'
            }}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: '12px 16px',
            borderRadius: '12px',
            border: '2px solid #e2e8f0',
            background: 'white',
            fontSize: '14px',
            fontWeight: 500,
            color: '#1e293b',
            cursor: 'pointer',
            minWidth: '150px'
          }}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Exhibitors Table */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ 
                padding: '16px', 
                textAlign: 'left', 
                fontSize: '12px', 
                fontWeight: 700, 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em', 
                color: '#64748b' 
              }}>
                Company Name
              </th>
              <th style={{ 
                padding: '16px', 
                textAlign: 'left', 
                fontSize: '12px', 
                fontWeight: 700, 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em', 
                color: '#64748b' 
              }}>
                Contact Person
              </th>
              <th style={{ 
                padding: '16px', 
                textAlign: 'left', 
                fontSize: '12px', 
                fontWeight: 700, 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em', 
                color: '#64748b' 
              }}>
                Email
              </th>
              <th style={{ 
                padding: '16px', 
                textAlign: 'left', 
                fontSize: '12px', 
                fontWeight: 700, 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em', 
                color: '#64748b' 
              }}>
                Booth Number
              </th>
              <th style={{ 
                padding: '16px', 
                textAlign: 'left', 
                fontSize: '12px', 
                fontWeight: 700, 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em', 
                color: '#64748b' 
              }}>
                Booth Type
              </th>
              <th style={{ 
                padding: '16px', 
                textAlign: 'left', 
                fontSize: '12px', 
                fontWeight: 700, 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em', 
                color: '#64748b' 
              }}>
                Zone
              </th>
              <th style={{ 
                padding: '16px', 
                textAlign: 'left', 
                fontSize: '12px', 
                fontWeight: 700, 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em', 
                color: '#64748b' 
              }}>
                Status
              </th>
              <th style={{ 
                padding: '16px', 
                textAlign: 'left', 
                fontSize: '12px', 
                fontWeight: 700, 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em', 
                color: '#64748b' 
              }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredExhibitors.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '64px 32px', textAlign: 'center' }}>
                  <div style={{ 
                    padding: '48px 32px', 
                    background: '#f8fafc', 
                    borderRadius: '16px',
                    border: '2px dashed #e2e8f0'
                  }}>
                    <strong style={{ 
                      fontSize: '18px', 
                      color: '#1e293b', 
                      display: 'block', 
                      marginBottom: '8px' 
                    }}>
                      No exhibitors found
                    </strong>
                    <p style={{ 
                      fontSize: '14px', 
                      color: '#64748b', 
                      margin: '0 0 24px' 
                    }}>
                      Get started by adding your first exhibitor
                    </p>
                    <button
                      onClick={handleCreate}
                      style={{
                        padding: '12px 24px',
                        border: 'none',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                      }}
                    >
                      Add Exhibitor
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredExhibitors.map((exhibitor: Exhibitor) => (
                <tr 
                  key={exhibitor.id}
                  style={{ 
                    borderBottom: '1px solid #e2e8f0',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                >
                  <td style={{ padding: '16px', fontWeight: 600, color: '#1e293b' }}>
                    {exhibitor.company_name}
                  </td>
                  <td style={{ padding: '16px', color: '#64748b' }}>
                    {exhibitor.contact_name || '-'}
                  </td>
                  <td style={{ padding: '16px', color: '#64748b' }}>
                    {exhibitor.contact_email || '-'}
                  </td>
                  <td style={{ padding: '16px', color: '#64748b' }}>
                    {exhibitor.booth_number || '-'}
                  </td>
                  <td style={{ padding: '16px', color: '#64748b', textTransform: 'capitalize' }}>
                    {exhibitor.booth_type || '-'}
                  </td>
                  <td style={{ padding: '16px', color: '#64748b' }}>
                    {exhibitor.zone_location || '-'}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '6px 12px',
                        borderRadius: '100px',
                        fontSize: '12px',
                        fontWeight: 600,
                        textTransform: 'capitalize',
                        color: getStatusColor(exhibitor.status),
                        background: getStatusBg(exhibitor.status)
                      }}
                    >
                      {exhibitor.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleEdit(exhibitor)}
                        title="Edit"
                        style={{
                          width: '36px',
                          height: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px solid #e2e8f0',
                          borderRadius: '8px',
                          background: 'white',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          color: '#64748b'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.borderColor = '#6366f1';
                          e.currentTarget.style.color = '#6366f1';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.color = '#64748b';
                        }}
                      >
                        <Icon name="refresh" />
                      </button>
                      {exhibitor.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(exhibitor.id, 'approved')}
                            title="Approve"
                            style={{
                              width: '36px',
                              height: '36px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '2px solid #e2e8f0',
                              borderRadius: '8px',
                              background: 'white',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              color: '#64748b'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.borderColor = '#059669';
                              e.currentTarget.style.color = '#059669';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.borderColor = '#e2e8f0';
                              e.currentTarget.style.color = '#64748b';
                            }}
                          >
                            <Icon name="check" />
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(exhibitor.id, 'rejected')}
                            title="Reject"
                            style={{
                              width: '36px',
                              height: '36px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '2px solid #e2e8f0',
                              borderRadius: '8px',
                              background: 'white',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              color: '#64748b'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.borderColor = '#dc2626';
                              e.currentTarget.style.color = '#dc2626';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.borderColor = '#e2e8f0';
                              e.currentTarget.style.color = '#64748b';
                            }}
                          >
                            <Icon name="logout" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(exhibitor.id)}
                        title="Delete"
                        style={{
                          width: '36px',
                          height: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px solid #e2e8f0',
                          borderRadius: '8px',
                          background: 'white',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          color: '#64748b'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.borderColor = '#dc2626';
                          e.currentTarget.style.color = '#dc2626';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.color = '#64748b';
                        }}
                      >
                        <Icon name="logout" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ExhibitorModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        exhibitor={selectedExhibitor}
        categories={[]}
      />
    </div>
  );
}

export default ExhibitorsPage;
