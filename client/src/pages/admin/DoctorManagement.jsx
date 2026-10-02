import React, { useEffect, useState } from 'react';
import { doctorService } from '../../services/api';
import { Stethoscope, Plus, Edit, CheckCircle2, Clock, MapPin, X } from 'lucide-react';

const DoctorManagement = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    specialization: '',
    department: 'General OPD',
    roomNumber: 'OPD-101',
    averageConsultationTime: 10,
    scheduleStartTime: '09:00 AM',
    scheduleEndTime: '05:00 PM',
    maxDailyTokens: 30,
  });

  const [statusData, setStatusData] = useState({
    status: 'Available',
    delayMinutes: 0,
    delayReason: '',
  });

  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchDoctors = async () => {
    try {
      const res = await doctorService.getAll();
      setDoctors(res.data.data || []);
    } catch (err) {
      console.error('Failed to load doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    try {
      await doctorService.create(formData);
      setMessage({ type: 'success', text: `Doctor ${formData.name} added successfully!` });
      setShowAddModal(false);
      setFormData({
        name: '',
        specialization: '',
        department: 'General OPD',
        roomNumber: 'OPD-101',
        averageConsultationTime: 10,
        scheduleStartTime: '09:00 AM',
        scheduleEndTime: '05:00 PM',
        maxDailyTokens: 30,
      });
      fetchDoctors();
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to add doctor' });
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedDoctor) return;
    try {
      await doctorService.updateStatus(selectedDoctor._id, statusData);
      setMessage({ type: 'success', text: `Status updated for ${selectedDoctor.name}. Queue recalculated!` });
      setShowStatusModal(false);
      fetchDoctors();
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to update status' });
    }
  };

  const openStatusModal = (doc) => {
    setSelectedDoctor(doc);
    setStatusData({
      status: doc.status,
      delayMinutes: doc.delayMinutes || 0,
      delayReason: doc.delayReason || '',
    });
    setShowStatusModal(true);
  };

  return (
    <div style={{ paddingTop: '2.5rem', paddingBottom: '3rem' }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Doctor & OPD Management</h1>
            <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
              Configure doctor schedules, consulting speeds, rooms, and live statuses
            </p>
          </div>

          <button onClick={() => setShowAddModal(true)} className="btn btn-primary btn-sm">
            <Plus size={16} /> Add New Doctor
          </button>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`} style={{ marginBottom: '1.5rem' }}>
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="loader"></div>
        ) : (
          <div className="card">
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Doctor Name</th>
                    <th>Specialization</th>
                    <th>Room</th>
                    <th>Consultation Speed</th>
                    <th>Hours</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((doc) => (
                    <tr key={doc._id}>
                      <td><strong>{doc.name}</strong></td>
                      <td>{doc.specialization}</td>
                      <td>{doc.roomNumber}</td>
                      <td>{doc.averageConsultationTime} mins/patient</td>
                      <td>{doc.scheduleStartTime} - {doc.scheduleEndTime}</td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            backgroundColor:
                              doc.status === 'Available'
                                ? '#dcfce7'
                                : doc.status === 'Delayed'
                                ? '#fee2e2'
                                : '#e0f2fe',
                            color:
                              doc.status === 'Available'
                                ? '#15803d'
                                : doc.status === 'Delayed'
                                ? '#b91c1c'
                                : '#0369a1',
                          }}
                        >
                          {doc.status}
                        </span>
                        {doc.delayMinutes > 0 && (
                          <div style={{ fontSize: '0.75rem', color: '#dc2626' }}>
                            +{doc.delayMinutes}m delay
                          </div>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => openStatusModal(doc)}
                          className="btn btn-secondary btn-sm"
                        >
                          <Edit size={14} /> Update Status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add Doctor Modal */}
        {showAddModal && (
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
            <div className="card" style={{ maxWidth: 520, width: '90%', padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Add New Doctor</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddDoctor}>
                <div className="form-group">
                  <label className="form-label">Doctor Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Rajesh Sharma"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Specialization</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cardiology"
                    className="form-input"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Room Number</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.roomNumber}
                      onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Avg Consult (mins)</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={formData.averageConsultationTime}
                      onChange={(e) => setFormData({ ...formData, averageConsultationTime: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Daily Tokens</label>
                    <input
                      type="number"
                      min="5"
                      className="form-input"
                      value={formData.maxDailyTokens}
                      onChange={(e) => setFormData({ ...formData, maxDailyTokens: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary btn-sm">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm">
                    Save Doctor
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Update Status Modal */}
        {showStatusModal && selectedDoctor && (
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
                Update Status: {selectedDoctor.name}
              </h3>

              <form onSubmit={handleUpdateStatus}>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={statusData.status}
                    onChange={(e) => setStatusData({ ...statusData, status: e.target.value })}
                  >
                    <option value="Available">Available</option>
                    <option value="Delayed">Delayed</option>
                    <option value="In Consultation">In Consultation</option>
                    <option value="On Break">On Break</option>
                    <option value="Completed">Completed Today</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Delay (minutes)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={statusData.delayMinutes}
                    onChange={(e) => setStatusData({ ...statusData, delayMinutes: Number(e.target.value) })}
                  />
                  <small style={{ color: '#64748b' }}>
                    Adjusting this value shifts patient wait times across the doctor's queue.
                  </small>
                </div>

                <div className="form-group">
                  <label className="form-label">Delay Reason</label>
                  <input
                    type="text"
                    placeholder="e.g. Emergency procedure"
                    className="form-input"
                    value={statusData.delayReason}
                    onChange={(e) => setStatusData({ ...statusData, delayReason: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button type="button" onClick={() => setShowStatusModal(false)} className="btn btn-secondary btn-sm">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorManagement;
