import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { doctorService, queueService, tokenService } from '../../services/api';
import {
  Play,
  CheckCircle2,
  AlertTriangle,
  UserX,
  Clock,
  RefreshCw,
  PlusCircle,
  Timer,
  Stethoscope,
  XCircle,
  Sparkles
} from 'lucide-react';

const QueueManagement = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  // Doctor Status Modal / State
  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('Available');
  const [delayInput, setDelayInput] = useState(0);
  const [delayReasonInput, setDelayReasonInput] = useState('');

  // Complete consultation notes
  const [notesInput, setNotesInput] = useState('');

  const [searchParams] = useSearchParams();
  const urlDoctorId = searchParams.get('doctorId');

  const fetchDoctors = async () => {
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

  const loadDoctorQueue = async (docId) => {
    if (!docId) return;
    try {
      const res = await queueService.getDoctorQueue(docId);
      setQueueData(res.data);
      if (res.data.doctor) {
        setNewStatus(res.data.doctor.status);
        setDelayInput(res.data.doctor.delayMinutes || 0);
        setDelayReasonInput(res.data.doctor.delayReason || '');
      }
    } catch (err) {
      console.error('Failed to fetch doctor queue:', err);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [urlDoctorId]);

  useEffect(() => {
    if (selectedDoctorId) {
      loadDoctorQueue(selectedDoctorId);
      const interval = setInterval(() => {
        loadDoctorQueue(selectedDoctorId);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [selectedDoctorId]);

  // Operational Actions
  const handleCallNext = async () => {
    setActionLoading(true);
    setActionMessage({ type: '', text: '' });
    try {
      const res = await queueService.callNext(selectedDoctorId);
      setActionMessage({ type: 'success', text: res.data.message });
      loadDoctorQueue(selectedDoctorId);
    } catch (err) {
      setActionMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to call next patient' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteConsultation = async () => {
    setActionLoading(true);
    setActionMessage({ type: '', text: '' });
    try {
      const res = await queueService.completeConsultation(selectedDoctorId, notesInput);
      setActionMessage({ type: 'success', text: res.data.message });
      setNotesInput('');
      loadDoctorQueue(selectedDoctorId);
    } catch (err) {
      setActionMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to complete consultation' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkMissed = async (tokenId) => {
    setActionLoading(true);
    try {
      const res = await queueService.markMissed(tokenId, 'Patient absent when called');
      setActionMessage({ type: 'warning', text: res.data.message });
      loadDoctorQueue(selectedDoctorId);
    } catch (err) {
      setActionMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to mark patient as missed' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelToken = async (tokenId) => {
    setActionLoading(true);
    try {
      const res = await tokenService.cancel(tokenId, 'Cancelled by Admin from queue management');
      setActionMessage({ type: 'success', text: res.data.message });
      loadDoctorQueue(selectedDoctorId);
    } catch (err) {
      setActionMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to cancel token' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateDoctorStatus = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await doctorService.updateStatus(selectedDoctorId, {
        status: newStatus,
        delayMinutes: Number(delayInput),
        delayReason: delayReasonInput,
      });
      setActionMessage({
        type: 'success',
        text: `Doctor status updated! Smart queue recalculated remaining patient wait times.`,
      });
      setStatusModal(false);
      loadDoctorQueue(selectedDoctorId);
    } catch (err) {
      setActionMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to update doctor status' });
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Delay simulation for demonstration
  const handleSimulateDelay = async (additionalMin) => {
    setActionLoading(true);
    try {
      const res = await queueService.updateDuration(selectedDoctorId, additionalMin, 'Consultation overrun reported by doctor');
      setActionMessage({
        type: 'warning',
        text: `+${additionalMin} minutes delay injected. All subsequent tokens dynamically pushed forward!`,
      });
      loadDoctorQueue(selectedDoctorId);
    } catch (err) {
      setActionMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to simulate delay' });
    } finally {
      setActionLoading(false);
    }
  };

  const activeConsultationToken = queueData?.tokens?.find((t) => t.status === 'in_consultation');

  if (loading) return <div className="loader" style={{ marginTop: '5rem' }}></div>;

  return (
    <div style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>Queue Operations & Consultation Control</h1>
            <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
              Real-time patient flow management, doctor delay tracking, and smart recalculation
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
                  {doc.name} ({doc.specialization})
                </option>
              ))}
            </select>

            <button
              onClick={() => loadDoctorQueue(selectedDoctorId)}
              className="btn btn-secondary btn-sm"
              title="Refresh Queue"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {actionMessage.text && (
          <div className={`alert alert-${actionMessage.type}`} style={{ marginBottom: '1.5rem' }}>
            {actionMessage.text}
          </div>
        )}

        {queueData && (
          <>
            {/* Top Doctor & Consultation Status Banner */}
            <div
              className="card"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                padding: '1.5rem',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{queueData.doctor.name}</h2>
                    <span
                      className="badge"
                      style={{
                        backgroundColor:
                          queueData.doctor.status === 'Available'
                            ? '#dcfce7'
                            : queueData.doctor.status === 'Delayed'
                            ? '#fee2e2'
                            : '#eff6ff',
                        color:
                          queueData.doctor.status === 'Available'
                            ? '#15803d'
                            : queueData.doctor.status === 'Delayed'
                            ? '#b91c1c'
                            : '#1e40af',
                      }}
                    >
                      ● {queueData.doctor.status}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                    {queueData.doctor.specialization} • 📍 Room {queueData.doctor.roomNumber} • Avg consultation:{' '}
                    <strong>{queueData.doctor.averageConsultationTime} mins</strong>
                  </p>
                  {queueData.doctor.delayMinutes > 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#b91c1c', fontWeight: 600 }}>
                      ⚠ Schedule Delay: +{queueData.doctor.delayMinutes} mins ({queueData.doctor.delayReason || 'Doctor running late'})
                    </div>
                  )}
                </div>

                {/* Quick Delay Injection / Status Controls */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setStatusModal(true)}
                    className="btn btn-secondary btn-sm"
                  >
                    Change Status / Delay
                  </button>

                  {/* DT&E Viva Feature: 1-Click Simulation of Consultation Overrun */}
                  <button
                    onClick={() => handleSimulateDelay(15)}
                    className="btn btn-sm"
                    style={{ backgroundColor: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }}
                    title="Simulate doctor delay / consultation overrun to demonstrate smart recalculation"
                  >
                    <Sparkles size={14} /> +15m Delay (Demo)
                  </button>
                </div>
              </div>
            </div>

            {/* Active Consultation Console */}
            <div
              className="card"
              style={{
                backgroundColor: activeConsultationToken ? '#f0fdf4' : '#f8fafc',
                border: activeConsultationToken ? '2px solid #10b981' : '1px dashed #cbd5e1',
                padding: '1.5rem',
                borderRadius: 14,
                marginBottom: '2rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: activeConsultationToken ? '#15803d' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    CURRENT CONSULTATION ROOM STATUS
                  </span>
                  {activeConsultationToken ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                        <h3 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f172a' }}>
                          Token {activeConsultationToken.tokenNumber}
                        </h3>
                        <span className={`badge badge-${activeConsultationToken.tokenType}`}>
                          {activeConsultationToken.tokenType.toUpperCase()}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155' }}>
                        Patient: {activeConsultationToken.patientName} (📞 {activeConsultationToken.patientPhone})
                      </p>
                      <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        Started at:{' '}
                        {activeConsultationToken.actualStartTime
                          ? new Date(activeConsultationToken.actualStartTime).toLocaleTimeString()
                          : 'In progress'}
                      </p>
                    </div>
                  ) : (
                    <div style={{ marginTop: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#475569' }}>
                        No patient is currently inside the room
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        Doctor is ready. Click "Call Next Patient" to summon the first sequential token.
                      </p>
                    </div>
                  )}
                </div>

                {/* Operations Buttons */}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {activeConsultationToken ? (
                    <>
                      <button
                        onClick={handleCompleteConsultation}
                        disabled={actionLoading}
                        className="btn btn-success"
                        style={{ padding: '0.625rem 1.25rem' }}
                      >
                        <CheckCircle2 size={18} /> Complete Consultation
                      </button>
                      <button
                        onClick={() => handleMarkMissed(activeConsultationToken._id)}
                        disabled={actionLoading}
                        className="btn btn-danger btn-sm"
                      >
                        <UserX size={16} /> Mark Missed
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleCallNext}
                      disabled={actionLoading || queueData.summary?.waitingCount === 0}
                      className="btn btn-primary"
                      style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', fontWeight: 700 }}
                    >
                      <Play size={18} /> Call Next Patient
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Unified Queue Section */}
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Sequential Patient Queue</h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Unified ordering for online and offline walk-ins. Wait times update dynamically.
                  </p>
                </div>
                <div>
                  <span className="badge badge-online" style={{ marginRight: 6 }}>● Online Token</span>
                  <span className="badge badge-offline">● Walk-in Offline</span>
                </div>
              </div>

              {queueData.tokens.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                  No tokens scheduled today. Use the "Offline Token" button above to add walk-in patients.
                </p>
              ) : (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Seq #</th>
                        <th>Token #</th>
                        <th>Patient Name</th>
                        <th>Phone</th>
                        <th>Channel Type</th>
                        <th>Status</th>
                        <th>Est. Time</th>
                        <th>Est. Wait</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {queueData.tokens.map((t) => (
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
                            <strong style={{ fontSize: '1.1rem', color: '#0284c7' }}>
                              {t.tokenNumber}
                            </strong>
                          </td>
                          <td>
                            <strong>{t.patientName}</strong>
                          </td>
                          <td>{t.patientPhone}</td>
                          <td>
                            <span className={`badge badge-${t.tokenType}`}>
                              {t.tokenType === 'online' ? '🌐 Online' : '🏥 Offline'}
                            </span>
                          </td>
                          <td>
                            <span className={`badge badge-${t.status}`}>
                              {t.status === 'in_consultation' ? 'In Room' : t.status}
                            </span>
                          </td>
                          <td>
                            {t.status === 'waiting' && t.estimatedStartTime
                              ? new Date(t.estimatedStartTime).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : t.status === 'completed'
                              ? 'Completed'
                              : 'Now'}
                          </td>
                          <td>
                            {t.status === 'waiting' ? (
                              <strong style={{ color: '#16a34a' }}>~{t.estimatedWaitMinutes}m</strong>
                            ) : t.status === 'in_consultation' ? (
                              <span style={{ color: '#059669', fontWeight: 600 }}>Active</span>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>-</span>
                            )}
                          </td>
                          <td>
                            {t.status === 'waiting' && (
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                  onClick={() => handleMarkMissed(t._id)}
                                  className="btn btn-secondary btn-sm"
                                  title="Mark as Missed/Absent"
                                >
                                  Missed
                                </button>
                                <button
                                  onClick={() => handleCancelToken(t._id)}
                                  className="btn btn-danger btn-sm"
                                  title="Cancel Token"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Doctor Status & Delay Modal */}
            {statusModal && (
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
                <div className="card" style={{ maxWidth: 460, width: '90%', padding: '2rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>
                    Update Doctor Status & Delay
                  </h3>

                  <form onSubmit={handleUpdateDoctorStatus}>
                    <div className="form-group">
                      <label className="form-label">Doctor Status</label>
                      <select
                        className="form-select"
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                      >
                        <option value="Available">Available</option>
                        <option value="Delayed">Delayed</option>
                        <option value="In Consultation">In Consultation</option>
                        <option value="On Break">On Break</option>
                        <option value="Completed">Completed Today</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Delay in Minutes (e.g. late arrival)</label>
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        value={delayInput}
                        onChange={(e) => setDelayInput(e.target.value)}
                      />
                      <small style={{ color: '#64748b' }}>
                        This will automatically shift all subsequent patients' wait times.
                      </small>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Reason for Delay (shown to patients)</label>
                      <input
                        type="text"
                        placeholder="e.g. Emergency surgery in progress"
                        className="form-input"
                        value={delayReasonInput}
                        onChange={(e) => setDelayReasonInput(e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setStatusModal(false)}
                        className="btn btn-secondary btn-sm"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary btn-sm">
                        Save & Recalculate Queue
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default QueueManagement;
