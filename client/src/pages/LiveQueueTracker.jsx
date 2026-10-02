import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { doctorService, queueService } from '../services/api';
import {
  Activity,
  Clock,
  Users,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Stethoscope
} from 'lucide-react';

const LiveQueueTracker = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchParams] = useSearchParams();
  const urlDoctorId = searchParams.get('doctorId');

  const fetchDoctorList = async () => {
    try {
      const res = await doctorService.getAll();
      const docs = res.data.data || [];
      setDoctors(docs);
      if (urlDoctorId && docs.some((d) => d._id === urlDoctorId)) {
        setSelectedDoctorId(urlDoctorId);
      } else if (docs.length > 0 && !selectedDoctorId) {
        setSelectedDoctorId(docs[0]._id);
      }
    } catch (err) {
      console.error('Failed to load doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQueue = async (docId, showIndicator = false) => {
    if (!docId) return;
    if (showIndicator) setRefreshing(true);
    try {
      const res = await queueService.getDoctorQueue(docId);
      setQueueData(res.data);
    } catch (err) {
      console.error('Failed to load queue:', err);
    } finally {
      if (showIndicator) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDoctorList();
  }, [urlDoctorId]);

  useEffect(() => {
    if (selectedDoctorId) {
      fetchQueue(selectedDoctorId, false);
      const interval = setInterval(() => {
        fetchQueue(selectedDoctorId, false);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [selectedDoctorId]);

  if (loading) return <div className="loader" style={{ marginTop: '5rem' }}></div>;

  return (
    <div style={{ paddingTop: '2.5rem', paddingBottom: '3rem' }}>
      <div className="container">
        {/* Header & Doctor Selection */}
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
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Live OPD Queue Tracker</h1>
            <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
              Real-time synchronization for hospital waiting rooms and patient monitoring
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <select
              className="form-select"
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              style={{ minWidth: 260 }}
            >
              {doctors.map((doc) => (
                <option key={doc._id} value={doc._id}>
                  {doc.name} ({doc.specialization} - {doc.roomNumber})
                </option>
              ))}
            </select>

            <button
              onClick={() => fetchQueue(selectedDoctorId, true)}
              className="btn btn-secondary btn-sm"
              disabled={refreshing}
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Updating...' : 'Refresh'}
            </button>
          </div>
        </div>

        {queueData && (
          <>
            {/* Doctor Status Banner */}
            <div
              className="card"
              style={{
                marginBottom: '1.5rem',
                backgroundColor: '#ffffff',
                borderLeft: queueData.doctor.delayMinutes > 0 ? '6px solid #ef4444' : '6px solid #0284c7',
                padding: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{queueData.doctor.name}</h2>
                  <p style={{ color: '#0284c7', fontWeight: 600, fontSize: '0.9rem' }}>
                    {queueData.doctor.specialization} • Room {queueData.doctor.roomNumber}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <span
                    className="badge"
                    style={{
                      fontSize: '0.85rem',
                      padding: '0.4rem 0.8rem',
                      backgroundColor: queueData.doctor.status === 'Available' ? '#dcfce7' : '#fee2e2',
                      color: queueData.doctor.status === 'Available' ? '#15803d' : '#b91c1c',
                    }}
                  >
                    ● Status: {queueData.doctor.status}
                  </span>

                  {queueData.doctor.delayMinutes > 0 && (
                    <span className="badge badge-delayed" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
                      ⚠ Delay: +{queueData.doctor.delayMinutes} mins
                    </span>
                  )}
                </div>
              </div>

              {queueData.doctor.delayReason && (
                <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#b91c1c', backgroundColor: '#fee2e2', padding: '0.5rem 0.75rem', borderRadius: 6 }}>
                  <strong>Notice from Doctor/Reception:</strong> {queueData.doctor.delayReason}
                </div>
              )}
            </div>

            {/* Quick Metrics */}
            <div className="grid-3" style={{ marginBottom: '2rem' }}>
              {/* Serving Token */}
              <div className="stat-card" style={{ borderTop: '4px solid #10b981' }}>
                <div>
                  <span className="stat-label">NOW IN ROOM</span>
                  <div className="stat-value" style={{ color: '#10b981' }}>
                    {queueData.summary?.activeToken?.tokenNumber || 'None'}
                  </div>
                  <small style={{ color: '#64748b' }}>
                    {queueData.summary?.activeToken?.patientName || 'Consultation room open'}
                  </small>
                </div>
                <div className="stat-icon" style={{ backgroundColor: '#dcfce7', color: '#10b981' }}>
                  <Activity size={24} />
                </div>
              </div>

              {/* Waiting Count */}
              <div className="stat-card" style={{ borderTop: '4px solid #0284c7' }}>
                <div>
                  <span className="stat-label">WAITING IN QUEUE</span>
                  <div className="stat-value" style={{ color: '#0284c7' }}>
                    {queueData.summary?.waitingCount || 0}
                  </div>
                  <small style={{ color: '#64748b' }}>Estimated dynamically</small>
                </div>
                <div className="stat-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
                  <Users size={24} />
                </div>
              </div>

              {/* Consultations Completed Today */}
              <div className="stat-card" style={{ borderTop: '4px solid #6366f1' }}>
                <div>
                  <span className="stat-label">COMPLETED TODAY</span>
                  <div className="stat-value" style={{ color: '#6366f1' }}>
                    {queueData.summary?.completedCount || 0}
                  </div>
                  <small style={{ color: '#64748b' }}>Patients served today</small>
                </div>
                <div className="stat-icon" style={{ backgroundColor: '#ede9fe', color: '#6366f1' }}>
                  <CheckCircle2 size={24} />
                </div>
              </div>
            </div>

            {/* Sequential Token Queue Table */}
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Today's Sequential Queue</h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Both online and offline tokens share this unified queue in chronological order
                  </p>
                </div>
              </div>

              {queueData.tokens.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                  No tokens booked for this doctor today yet.
                </p>
              ) : (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Queue #</th>
                        <th>Token #</th>
                        <th>Patient Name</th>
                        <th>Channel Type</th>
                        <th>Status</th>
                        <th>Est. Start Time</th>
                        <th>Est. Wait</th>
                      </tr>
                    </thead>
                    <tbody>
                      {queueData.tokens.map((t, idx) => (
                        <tr
                          key={t._id}
                          style={{
                            backgroundColor:
                              t.status === 'in_consultation'
                                ? '#f0fdf4'
                                : t.status === 'waiting' && t.queuePosition === 1
                                ? '#f8fafc'
                                : 'inherit',
                          }}
                        >
                          <td>
                            <strong>#{t.sequenceNumber}</strong>
                          </td>
                          <td>
                            <strong style={{ fontSize: '1.05rem', color: '#0284c7' }}>
                              {t.tokenNumber}
                            </strong>
                          </td>
                          <td>
                            {/* Privacy: Obfuscate last 4 chars if public, or show first name */}
                            {t.patientName}
                          </td>
                          <td>
                            <span className={`badge badge-${t.tokenType}`}>
                              {t.tokenType === 'online' ? '🌐 Online' : '🏥 Walk-In'}
                            </span>
                          </td>
                          <td>
                            <span className={`badge badge-${t.status}`}>
                              {t.status === 'in_consultation' ? 'Inside Room' : t.status}
                            </span>
                          </td>
                          <td>
                            {t.status === 'waiting' && t.estimatedStartTime
                              ? new Date(t.estimatedStartTime).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : t.status === 'completed'
                              ? 'Finished'
                              : 'Now'}
                          </td>
                          <td>
                            {t.status === 'waiting' ? (
                              <strong style={{ color: '#16a34a' }}>~{t.estimatedWaitMinutes} mins</strong>
                            ) : t.status === 'in_consultation' ? (
                              <span style={{ color: '#059669', fontWeight: 600 }}>Active</span>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LiveQueueTracker;
