import React, { useEffect, useState } from 'react';
import { patientService } from '../../services/api';
import { Search, Users, Filter, Download, Calendar } from 'lucide-react';

const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [tokenType, setTokenType] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPatients = async () => {
    try {
      const res = await patientService.getAll({
        search: search || undefined,
        tokenType: tokenType || undefined,
        status: status || undefined,
      });
      setPatients(res.data.data || []);
    } catch (err) {
      console.error('Failed to load patient records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [tokenType, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPatients();
  };

  return (
    <div style={{ paddingTop: '2.5rem', paddingBottom: '3rem' }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Patient Directory & Appointments</h1>
          <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
            Comprehensive register of online registrants and walk-in consultation tokens
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <input
                type="text"
                placeholder="Search by Patient Name, Phone, or Token #..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
              />
            </div>

            <div style={{ minWidth: 160 }}>
              <select
                className="form-select"
                value={tokenType}
                onChange={(e) => setTokenType(e.target.value)}
              >
                <option value="">All Channels (Online & Walk-In)</option>
                <option value="online">Online Booking</option>
                <option value="offline">Offline Walk-In</option>
              </select>
            </div>

            <div style={{ minWidth: 160 }}>
              <select
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="waiting">Waiting</option>
                <option value="in_consultation">In Consultation</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="missed">Missed</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary btn-sm">
              <Search size={14} /> Search
            </button>
          </form>
        </div>

        {loading ? (
          <div className="loader"></div>
        ) : (
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                Patients Record ({patients.length})
              </h3>
            </div>

            {patients.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                No patient tokens found matching the selected filters.
              </p>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Token #</th>
                      <th>Patient Name</th>
                      <th>Phone</th>
                      <th>Assigned Doctor</th>
                      <th>Date / Time</th>
                      <th>Token Type</th>
                      <th>Queue Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((p) => (
                      <tr key={p._id}>
                        <td>
                          <strong style={{ fontSize: '1.05rem', color: '#0284c7' }}>
                            {p.tokenNumber}
                          </strong>
                        </td>
                        <td>
                          <strong>{p.patientName}</strong>
                          {p.patientId?.email && (
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              {p.patientId.email}
                            </div>
                          )}
                        </td>
                        <td>{p.patientPhone}</td>
                        <td>
                          {p.doctorId?.name || 'General OPD'}
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            Room {p.doctorId?.roomNumber}
                          </div>
                        </td>
                        <td>
                          {new Date(p.appointmentDate).toLocaleDateString()}
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td>
                          <span className={`badge badge-${p.tokenType}`}>
                            {p.tokenType === 'online' ? '🌐 Online' : '🏥 Offline'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-${p.status}`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientList;
