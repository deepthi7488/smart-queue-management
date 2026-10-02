import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { queueService, doctorService } from '../../services/api';
import {
  Users,
  Ticket,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  Stethoscope,
  ClipboardList,
  ArrowRight,
  RefreshCw,
  Globe
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async (showIndicator = false) => {
    if (showIndicator) setRefreshing(true);
    try {
      const [statsRes, docsRes] = await Promise.all([
        queueService.getAdminStats(),
        doctorService.getAll(),
      ]);
      setStats(statsRes.data.stats);
      setDoctors(docsRes.data.data || []);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
      if (showIndicator) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => {
      fetchDashboardData(false);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="loader" style={{ marginTop: '5rem' }}></div>;

  return (
    <div style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="badge badge-offline" style={{ marginBottom: '0.25rem' }}>
              ADMINISTRATIVE CONTROL PANEL
            </span>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>Hospital Queue Overview</h1>
            <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
              Real-time OPD token orchestration, walk-in registration, and queue monitoring
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => fetchDashboardData(true)}
              className="btn btn-secondary btn-sm"
              disabled={refreshing}
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Updating...' : 'Refresh'}
            </button>
            <Link to="/admin/offline-booking" className="btn btn-primary btn-sm">
              <UserPlus size={14} /> Walk-in Token
            </Link>
            <Link to="/admin/queue" className="btn btn-success btn-sm">
              <ClipboardList size={14} /> Live Queue Controls
            </Link>
          </div>
        </div>

        {/* Section 8: Admin Dashboard Metric Cards */}
        <div className="grid-4" style={{ marginBottom: '2rem' }}>
          {/* Total Patients */}
          <div className="stat-card">
            <div>
              <span className="stat-label">REGISTERED PATIENTS</span>
              <div className="stat-value">{stats?.totalRegisteredPatients || 0}</div>
              <small style={{ color: '#64748b' }}>Online patient accounts</small>
            </div>
            <div className="stat-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
              <Users size={24} />
            </div>
          </div>

          {/* Today's Total Tokens */}
          <div className="stat-card">
            <div>
              <span className="stat-label">TODAY'S TOKENS</span>
              <div className="stat-value">{stats?.totalTokensToday || 0}</div>
              <small style={{ color: '#64748b' }}>Combined queue entries</small>
            </div>
            <div className="stat-icon" style={{ backgroundColor: '#ede9fe', color: '#7c3aed' }}>
              <Ticket size={24} />
            </div>
          </div>

          {/* Online Tokens */}
          <div className="stat-card">
            <div>
              <span className="stat-label">ONLINE BOOKED</span>
              <div className="stat-value" style={{ color: '#0284c7' }}>
                {stats?.onlineTokensCount || 0}
              </div>
              <small style={{ color: '#64748b' }}>Web/Mobile bookings</small>
            </div>
            <div className="stat-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
              <Globe size={24} />
            </div>
          </div>

          {/* Offline Tokens */}
          <div className="stat-card">
            <div>
              <span className="stat-label">OFFLINE WALK-INS</span>
              <div className="stat-value" style={{ color: '#b45309' }}>
                {stats?.offlineTokensCount || 0}
              </div>
              <small style={{ color: '#64748b' }}>Front desk tokens</small>
            </div>
            <div className="stat-icon" style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>
              <UserPlus size={24} />
            </div>
          </div>
        </div>

        {/* Second Row Metric Cards */}
        <div className="grid-3" style={{ marginBottom: '2.5rem' }}>
          {/* Waiting Patients */}
          <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
            <div>
              <span className="stat-label">PATIENTS WAITING</span>
              <div className="stat-value" style={{ color: '#d97706' }}>
                {stats?.waitingCount || 0}
              </div>
              <small style={{ color: '#64748b' }}>Pending consultation</small>
            </div>
            <div className="stat-icon" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
              <Clock size={24} />
            </div>
          </div>

          {/* In Consultation */}
          <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
            <div>
              <span className="stat-label">IN CONSULTATION NOW</span>
              <div className="stat-value" style={{ color: '#059669' }}>
                {stats?.inConsultationCount || 0}
              </div>
              <small style={{ color: '#64748b' }}>Inside doctor rooms</small>
            </div>
            <div className="stat-icon" style={{ backgroundColor: '#dcfce7', color: '#059669' }}>
              <Stethoscope size={24} />
            </div>
          </div>

          {/* Completed Consultations */}
          <div className="stat-card" style={{ borderLeft: '4px solid #0284c7' }}>
            <div>
              <span className="stat-label">COMPLETED TODAY</span>
              <div className="stat-value" style={{ color: '#0284c7' }}>
                {stats?.completedCount || 0}
              </div>
              <small style={{ color: '#64748b' }}>Consultations finished</small>
            </div>
            <div className="stat-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
              <CheckCircle2 size={24} />
            </div>
          </div>
        </div>

        {/* Doctors Active Queue Grid */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>OPD Doctors & Queue Status</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Monitor individual doctor consultation speeds, delays, and current queue load
              </p>
            </div>
            <Link to="/admin/queue" className="btn btn-outline btn-sm">
              Open Queue Management <ArrowRight size={14} />
            </Link>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Department / Room</th>
                  <th>Status</th>
                  <th>Current Token</th>
                  <th>Waiting</th>
                  <th>Completed</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((doc) => (
                  <tr key={doc._id}>
                    <td>
                      <strong>{doc.name}</strong>
                      <div style={{ fontSize: '0.8rem', color: '#0284c7' }}>{doc.specialization}</div>
                    </td>
                    <td>
                      {doc.department}
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>📍 {doc.roomNumber}</div>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          backgroundColor:
                            doc.status === 'Available'
                              ? '#dcfce7'
                              : doc.status === 'Delayed'
                              ? '#fee2e2'
                              : doc.status === 'In Consultation'
                              ? '#dbeafe'
                              : '#f1f5f9',
                          color:
                            doc.status === 'Available'
                              ? '#15803d'
                              : doc.status === 'Delayed'
                              ? '#b91c1c'
                              : doc.status === 'In Consultation'
                              ? '#1e40af'
                              : '#475569',
                        }}
                      >
                        {doc.status}
                      </span>
                      {doc.delayMinutes > 0 && (
                        <div style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600 }}>
                          +{doc.delayMinutes}m delay
                        </div>
                      )}
                    </td>
                    <td>
                      <strong style={{ fontSize: '1.1rem', color: '#16a34a' }}>
                        {doc.queueSummary?.currentServingToken || 'None'}
                      </strong>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#2563eb' }}>
                        {doc.queueSummary?.waitingPatients || 0}
                      </span>
                    </td>
                    <td>{doc.queueSummary?.completedPatients || 0}</td>
                    <td>
                      <Link
                        to={`/admin/queue?doctorId=${doc._id}`}
                        className="btn btn-secondary btn-sm"
                      >
                        Manage Queue
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
