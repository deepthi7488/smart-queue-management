import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { tokenService } from '../../services/api';
import {
  Clock,
  Users,
  Stethoscope,
  Calendar,
  AlertCircle,
  RefreshCw,
  XCircle,
  CheckCircle2,
  Hourglass,
  ArrowRight
} from 'lucide-react';

const PatientDashboard = () => {
  const { user } = useAuth();
  const [tokens, setTokens] = useState([]);
  const [activeToken, setActiveToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelModal, setCancelModal] = useState({ open: false, tokenId: null });
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  const fetchMyTokens = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true);
    try {
      const res = await tokenService.getMyTokens();
      const allTokens = res.data.data || [];
      setTokens(allTokens);

      // Find first waiting or in_consultation token
      const current = allTokens.find(
        (t) => t.status === 'waiting' || t.status === 'in_consultation'
      );
      setActiveToken(current || null);
    } catch (err) {
      console.error('Failed to fetch patient tokens:', err);
    } finally {
      setLoading(false);
      if (showRefreshIndicator) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMyTokens();
    // Auto-refresh every 12 seconds to keep live queue wait times up to date
    const interval = setInterval(() => {
      fetchMyTokens(false);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleCancelToken = async () => {
    if (!cancelModal.tokenId) return;
    try {
      await tokenService.cancel(cancelModal.tokenId, 'Patient requested cancellation');
      setActionMessage({ type: 'success', text: 'Token cancelled successfully. Queue has been updated.' });
      setCancelModal({ open: false, tokenId: null });
      fetchMyTokens(true);
    } catch (err) {
      setActionMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to cancel token' });
    }
  };

  const getDoctorStatusBadge = (status) => {
    switch (status) {
      case 'Available':
        return <span className="badge" style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>● Doctor Available</span>;
      case 'In Consultation':
        return <span className="badge badge-in_consultation">In Consultation</span>;
      case 'Delayed':
        return <span className="badge badge-delayed">⚠ Doctor Delayed</span>;
      case 'On Break':
        return <span className="badge badge-offline">On Break</span>;
      default:
        return <span className="badge badge-completed">{status}</span>;
    }
  };

  if (loading) {
    return <div className="loader" style={{ marginTop: '5rem' }}></div>;
  }

  return (
    <div style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
      <div className="container">
        {/* Welcome Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
              Welcome back, {user?.name}! 👋
            </h1>
            <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
              Patient Portal • Phone: {user?.phone} • Email: {user?.email}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => fetchMyTokens(true)}
              className="btn btn-secondary btn-sm"
              disabled={refreshing}
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh Queue'}
            </button>
            <Link to="/patient/book" className="btn btn-primary btn-sm">
              <Calendar size={14} /> Book New Token
            </Link>
          </div>
        </div>

        {actionMessage.text && (
          <div className={`alert alert-${actionMessage.type}`} style={{ marginBottom: '1.5rem' }}>
            {actionMessage.text}
          </div>
        )}

        {/* Section 7: Patient Queue Dashboard (Active Live Token Card) */}
        {activeToken ? (
          <div
            className="card"
            style={{
              backgroundColor: '#ffffff',
              border: '2px solid #0284c7',
              borderRadius: 16,
              padding: '2rem',
              marginBottom: '2rem',
              boxShadow: '0 8px 25px -4px rgba(2, 132, 199, 0.15)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span
                  style={{
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    padding: '0.4rem 1rem',
                    borderRadius: 8,
                    fontWeight: 800,
                    fontSize: '1.4rem',
                    letterSpacing: '0.05em',
                  }}
                >
                  {activeToken.tokenNumber}
                </span>
                <div>
                  <span className="badge badge-online" style={{ marginRight: 6 }}>ONLINE TOKEN</span>
                  <span className="badge badge-waiting">ACTIVE IN QUEUE</span>
                </div>
              </div>
              <div>{getDoctorStatusBadge(activeToken.doctorId?.status)}</div>
            </div>

            {/* Doctor Info Banner */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                padding: '1rem',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                marginBottom: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  CONSULTING DOCTOR
                </p>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                  {activeToken.doctorId?.name}
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#0284c7' }}>
                  {activeToken.doctorId?.specialization} • 📍 {activeToken.doctorId?.roomNumber}
                </p>
              </div>

              {activeToken.doctorId?.delayMinutes > 0 && (
                <div
                  style={{
                    backgroundColor: '#fee2e2',
                    padding: '0.5rem 0.85rem',
                    borderRadius: 8,
                    alignSelf: 'center',
                    border: '1px solid #fecaca',
                  }}
                >
                  <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#b91c1c' }}>
                    ⚠ Doctor Schedule Delayed: +{activeToken.doctorId?.delayMinutes} mins
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#991b1b' }}>
                    {activeToken.doctorId?.delayReason || 'Queue times adjusted accordingly'}
                  </p>
                </div>
              )}
            </div>

            {/* Smart Queue Metrics Grid */}
            <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
              {/* Queue Position */}
              <div
                style={{
                  backgroundColor: '#eff6ff',
                  padding: '1.25rem',
                  borderRadius: 12,
                  border: '1px solid #bfdbfe',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e40af' }}>
                  YOUR QUEUE POSITION
                </span>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1d4ed8', margin: '0.25rem 0' }}>
                  #{activeToken.queuePosition || 1}
                </div>
                <p style={{ fontSize: '0.8rem', color: '#3b82f6' }}>
                  {Math.max(0, (activeToken.queuePosition || 1) - 1)} patient(s) ahead of you
                </p>
              </div>

              {/* Estimated Waiting Time */}
              <div
                style={{
                  backgroundColor: '#f0fdf4',
                  padding: '1.25rem',
                  borderRadius: 12,
                  border: '1px solid #bbf7d0',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#166534' }}>
                  ESTIMATED WAITING TIME
                </span>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#15803d', margin: '0.25rem 0' }}>
                  ~{activeToken.estimatedWaitMinutes || 0} <span style={{ fontSize: '1.1rem' }}>mins</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#16a34a' }}>
                  {activeToken.estimatedStartTime
                    ? `Expected at: ${new Date(activeToken.estimatedStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : 'Calculated dynamically'}
                </p>
              </div>

              {/* Consultation Status */}
              <div
                style={{
                  backgroundColor: '#fefce8',
                  padding: '1.25rem',
                  borderRadius: 12,
                  border: '1px solid #fef08a',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#854d0e' }}>
                  CONSULTATION STATUS
                </span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#a16207', margin: '0.75rem 0' }}>
                  {activeToken.status === 'in_consultation' ? '🟢 INSIDE ROOM NOW' : 'WAITING FOR TURN'}
                </div>
                <p style={{ fontSize: '0.8rem', color: '#ca8a04' }}>
                  Auto-updates as doctor calls tokens
                </p>
              </div>
            </div>

            {/* Dynamic Recalculation Alert */}
            <div className="alert alert-info" style={{ marginBottom: '1.5rem', fontSize: '0.85rem' }}>
              <Hourglass size={18} style={{ flexShrink: 0 }} />
              <div>
                <strong>Smart Queue Active:</strong> If consultations take longer or the doctor is delayed,
                your estimated waiting time automatically updates above without requiring manual inquiry at reception.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button
                onClick={() => setCancelModal({ open: true, tokenId: activeToken._id })}
                className="btn btn-danger btn-sm"
              >
                <XCircle size={14} /> Cancel Token
              </button>
            </div>
          </div>
        ) : (
          <div
            className="card"
            style={{
              padding: '2.5rem',
              textAlign: 'center',
              borderRadius: 16,
              marginBottom: '2rem',
              backgroundColor: '#ffffff',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                color: '#64748b',
              }}
            >
              <Calendar size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              You don't have an active token right now
            </h3>
            <p style={{ color: '#64748b', maxWidth: 480, margin: '0 auto 1.5rem', fontSize: '0.9rem' }}>
              Avoid waiting in crowded hospital lobbies. Book your appointment token online and track your live queue position from home!
            </p>
            <Link to="/patient/book" className="btn btn-primary">
              Book a Token Online <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {/* Quick Links & Past History Preview */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recent Token History</h3>
            <Link to="/patient/history" className="btn btn-outline btn-sm">
              View All History
            </Link>
          </div>

          {tokens.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>
              No previous appointments found.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Token #</th>
                    <th>Doctor</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.slice(0, 5).map((t) => (
                    <tr key={t._id}>
                      <td><strong>{t.tokenNumber}</strong></td>
                      <td>{t.doctorId?.name || 'General OPD'}</td>
                      <td>{new Date(t.appointmentDate).toLocaleDateString()}</td>
                      <td><span className={`badge badge-${t.tokenType}`}>{t.tokenType}</span></td>
                      <td><span className={`badge badge-${t.status}`}>{t.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Cancel Confirmation Modal */}
        {cancelModal.open && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
          >
            <div className="card" style={{ maxWidth: 420, width: '90%', padding: '1.75rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Cancel Token Appointment?
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem' }}>
                Are you sure you want to cancel your token? Your position in the queue will be released for other waiting patients.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  onClick={() => setCancelModal({ open: false, tokenId: null })}
                  className="btn btn-secondary btn-sm"
                >
                  Keep Token
                </button>
                <button
                  onClick={handleCancelToken}
                  className="btn btn-danger btn-sm"
                >
                  Confirm Cancellation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;
