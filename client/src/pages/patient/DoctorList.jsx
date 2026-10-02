import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { doctorService } from '../../services/api';
import { Search, Stethoscope, Clock, MapPin, Calendar, ArrowRight } from 'lucide-react';

const DoctorList = () => {
  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchDoctors();
  }, []);

  const departments = ['All', ...new Set(doctors.map((d) => d.specialization))];

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'All' || doc.specialization === selectedDept;
    return matchesSearch && matchesDept;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Available':
        return <span className="badge" style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>● Available</span>;
      case 'In Consultation':
        return <span className="badge badge-in_consultation">In Consultation</span>;
      case 'Delayed':
        return <span className="badge badge-delayed">Delayed</span>;
      case 'On Break':
        return <span className="badge badge-offline">On Break</span>;
      default:
        return <span className="badge badge-completed">{status}</span>;
    }
  };

  return (
    <div style={{ paddingTop: '2.5rem', paddingBottom: '3rem' }}>
      <div className="container">
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Hospital Doctors & OPD Schedules</h1>
          <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
            Check doctor availability, consultation speeds, and book a smart queue token
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="card" style={{ padding: '1rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
              <input
                type="text"
                placeholder="Search by doctor name or specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
              />
            </div>

            <div style={{ minWidth: 200 }}>
              <select
                className="form-select"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept === 'All' ? 'All Specializations' : dept}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loader"></div>
        ) : filteredDoctors.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: '#64748b' }}>No doctors found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid-2">
            {filteredDoctors.map((doc) => (
              <div key={doc._id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{doc.name}</h3>
                      <p style={{ fontSize: '0.85rem', color: '#0284c7', fontWeight: 600 }}>{doc.specialization}</p>
                    </div>
                    {getStatusBadge(doc.status)}
                  </div>

                  <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>
                    🏥 {doc.department}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                    📍 Room: <strong>{doc.roomNumber}</strong> • Hours: {doc.scheduleStartTime} - {doc.scheduleEndTime}
                  </p>

                  <div
                    style={{
                      backgroundColor: '#f8fafc',
                      padding: '0.75rem',
                      borderRadius: 8,
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '0.5rem',
                      textAlign: 'center',
                      marginBottom: '1.25rem',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>SERVING</span>
                      <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                        {doc.queueSummary?.currentServingToken || 'None'}
                      </strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>WAITING</span>
                      <strong style={{ fontSize: '0.95rem', color: '#2563eb' }}>
                        {doc.queueSummary?.waitingPatients || 0}
                      </strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>AVG SPEED</span>
                      <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                        {doc.averageConsultationTime} min
                      </strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Link to={`/queue-tracker?doctorId=${doc._id}`} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                    Live Queue
                  </Link>
                  <Link to={`/patient/book?doctorId=${doc._id}`} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                    Book Token
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorList;
