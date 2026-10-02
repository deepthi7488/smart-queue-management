import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { doctorService, tokenService } from '../../services/api';
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Stethoscope
} from 'lucide-react';

const BookToken = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [bookedToken, setBookedToken] = useState(null);

  const [searchParams] = useSearchParams();
  const preselectedDoctor = searchParams.get('doctorId');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await doctorService.getAll();
        const docs = res.data.data || [];
        setDoctors(docs);
        if (preselectedDoctor && docs.some((d) => d._id === preselectedDoctor)) {
          setSelectedDoctorId(preselectedDoctor);
        } else if (docs.length > 0) {
          setSelectedDoctorId(docs[0]._id);
        }
      } catch (err) {
        setError('Failed to load doctors list');
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, [preselectedDoctor]);

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!selectedDoctorId) {
      return setError('Please select a doctor to book a token');
    }

    setError('');
    setSubmitting(true);

    try {
      const res = await tokenService.bookOnline({ doctorId: selectedDoctorId });
      setBookedToken(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book token. You may already have an active appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDoctor = doctors.find((d) => d._id === selectedDoctorId);

  if (loading) return <div className="loader" style={{ marginTop: '5rem' }}></div>;

  return (
    <div style={{ paddingTop: '2.5rem', paddingBottom: '3rem' }}>
      <div className="container" style={{ maxWidth: 680 }}>
        {bookedToken ? (
          /* Confirmation Success Card */
          <div
            className="card"
            style={{
              textAlign: 'center',
              padding: '3rem 2rem',
              borderRadius: 16,
              border: '2px solid #10b981',
            }}
          >
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                backgroundColor: '#dcfce7',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}
            >
              <CheckCircle size={38} />
            </div>

            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
              Token Booked Successfully!
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '1.75rem' }}>
              Your appointment token has entered the live hospital queue.
            </p>

            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '1.5rem',
                maxWidth: 420,
                margin: '0 auto 2rem',
              }}
            >
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                YOUR TOKEN NUMBER
              </span>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: '#0284c7', margin: '0.25rem 0' }}>
                {bookedToken.tokenNumber}
              </div>
              <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155' }}>
                {bookedToken.doctorId?.name}
              </p>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                📍 {bookedToken.doctorId?.roomNumber} • OPD Consultation
              </p>
              <div
                style={{
                  marginTop: '1rem',
                  paddingTop: '1rem',
                  borderTop: '1px dashed #cbd5e1',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.85rem',
                }}
              >
                <span>Current Queue Position:</span>
                <strong>#{bookedToken.queuePosition || 1}</strong>
              </div>
              <div
                style={{
                  marginTop: '0.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.85rem',
                }}
              >
                <span>Estimated Wait:</span>
                <strong style={{ color: '#16a34a' }}>~{bookedToken.estimatedWaitMinutes || 0} mins</strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <button
                onClick={() => navigate('/patient')}
                className="btn btn-primary"
              >
                Go to Live Queue Dashboard <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          /* Booking Form */
          <div className="card" style={{ padding: '2rem', borderRadius: 16 }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  backgroundColor: '#e0f2fe',
                  color: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                }}
              >
                <Calendar size={26} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Book an Appointment Token</h2>
              <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                Select an OPD doctor to secure your spot in the smart queue
              </p>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleBooking}>
              <div className="form-group">
                <label className="form-label">Select Doctor & Specialization</label>
                <select
                  className="form-select"
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  required
                >
                  {doctors.map((doc) => (
                    <option key={doc._id} value={doc._id}>
                      {doc.name} — {doc.specialization} ({doc.roomNumber})
                    </option>
                  ))}
                </select>
              </div>

              {selectedDoctor && (
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: 10,
                    padding: '1rem',
                    border: '1px solid #e2e8f0',
                    marginBottom: '1.5rem',
                  }}
                >
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>
                    Doctor Schedule & Availability
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: '#64748b' }}>Status: </span>
                      <strong style={{ color: selectedDoctor.status === 'Available' ? '#16a34a' : '#ea580c' }}>
                        {selectedDoctor.status}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Room: </span>
                      <strong>{selectedDoctor.roomNumber}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Avg Time/Patient: </span>
                      <strong>{selectedDoctor.averageConsultationTime} mins</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Currently Waiting: </span>
                      <strong style={{ color: '#2563eb' }}>
                        {selectedDoctor.queueSummary?.waitingPatients || 0} patient(s)
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem' }}
              >
                {submitting ? 'Generating Token...' : 'Confirm & Book Token'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookToken;
