import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorService, tokenService } from '../../services/api';
import { UserPlus, CheckCircle, Ticket, ArrowRight, Printer } from 'lucide-react';

const OfflineBooking = () => {
  const [doctors, setDoctors] = useState([]);
  const [formData, setFormData] = useState({
    patientName: '',
    patientPhone: '',
    doctorId: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [generatedToken, setGeneratedToken] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await doctorService.getAll();
        const docs = res.data.data || [];
        setDoctors(docs);
        if (docs.length > 0) {
          setFormData((prev) => ({ ...prev, doctorId: docs[0]._id }));
        }
      } catch (err) {
        setError('Failed to fetch doctors list');
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.patientName || !formData.patientPhone || !formData.doctorId) {
      return setError('Please provide patient name, phone number, and doctor.');
    }

    setSubmitting(true);

    try {
      const res = await tokenService.bookOffline(formData);
      setGeneratedToken(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate offline token');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintSlip = () => {
    window.print();
  };

  if (loading) return <div className="loader" style={{ marginTop: '5rem' }}></div>;

  return (
    <div style={{ paddingTop: '2.5rem', paddingBottom: '3rem' }}>
      <div className="container" style={{ maxWidth: 640 }}>
        {generatedToken ? (
          /* Printable Token Slip */
          <div
            className="card"
            style={{
              padding: '2.5rem',
              textAlign: 'center',
              borderRadius: 16,
              border: '2px solid #b45309',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: '#fef3c7',
                color: '#b45309',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
              }}
            >
              <Ticket size={32} />
            </div>

            <span className="badge badge-offline" style={{ marginBottom: '0.5rem' }}>
              OFFLINE WALK-IN TOKEN SLIP
            </span>

            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem' }}>
              Token Generated Successfully!
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Patient has been queued in sequential order alongside online patients.
            </p>

            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '2px dashed #cbd5e1',
                borderRadius: 12,
                padding: '1.5rem',
                margin: '0 auto 1.5rem',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>
                HOSPITAL OPD TOKEN
              </span>
              <div style={{ fontSize: '3.25rem', fontWeight: 900, color: '#b45309', margin: '0.25rem 0' }}>
                {generatedToken.tokenNumber}
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                {generatedToken.patientName}
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                📞 {generatedToken.patientPhone}
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.75rem',
                  fontSize: '0.85rem',
                  borderTop: '1px solid #e2e8f0',
                  paddingTop: '0.75rem',
                  textAlign: 'left',
                }}
              >
                <div>
                  <span style={{ color: '#64748b' }}>Doctor:</span>
                  <div><strong>{generatedToken.doctorId?.name}</strong></div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Room:</span>
                  <div><strong>{generatedToken.doctorId?.roomNumber}</strong></div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Queue Position:</span>
                  <div><strong>#{generatedToken.queuePosition || 1}</strong></div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Est. Waiting:</span>
                  <div><strong style={{ color: '#16a34a' }}>~{generatedToken.estimatedWaitMinutes || 0} mins</strong></div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <button
                onClick={() => {
                  setGeneratedToken(null);
                  setFormData({ patientName: '', patientPhone: '', doctorId: doctors[0]?._id || '' });
                }}
                className="btn btn-secondary btn-sm"
              >
                + Book Another Walk-in
              </button>
              <button onClick={handlePrintSlip} className="btn btn-outline btn-sm">
                <Printer size={15} /> Print Slip
              </button>
              <button
                onClick={() => navigate(`/admin/queue?doctorId=${generatedToken.doctorId?._id}`)}
                className="btn btn-primary btn-sm"
              >
                View Live Queue <ArrowRight size={15} />
              </button>
            </div>
          </div>
        ) : (
          /* Offline Walk-in Form */
          <div className="card" style={{ padding: '2rem', borderRadius: 16 }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  backgroundColor: '#fef3c7',
                  color: '#b45309',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                }}
              >
                <UserPlus size={26} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Offline Walk-In Registration</h2>
              <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                Reception Desk • Generate token for patients arriving in person
              </p>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Patient Full Name</label>
                <input
                  type="text"
                  name="patientName"
                  required
                  placeholder="e.g. Meera Sharma"
                  className="form-input"
                  value={formData.patientName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Patient Phone Number</label>
                <input
                  type="tel"
                  name="patientPhone"
                  required
                  placeholder="9876543210"
                  className="form-input"
                  value={formData.patientPhone}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Assign OPD Doctor</label>
                <select
                  name="doctorId"
                  className="form-select"
                  value={formData.doctorId}
                  onChange={handleChange}
                  required
                >
                  {doctors.map((doc) => (
                    <option key={doc._id} value={doc._id}>
                      {doc.name} — {doc.specialization} ({doc.roomNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: 8,
                  padding: '0.85rem',
                  marginBottom: '1.5rem',
                  fontSize: '0.85rem',
                  color: '#1e40af',
                }}
              >
                ℹ️ <strong>Unified Queue Notice:</strong> This offline walk-in token will enter the exact same sequential queue alongside online booked patients.
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-warning"
                style={{ width: '100%', padding: '0.75rem', fontWeight: 700 }}
              >
                {submitting ? 'Generating Walk-in Token...' : 'Generate Offline Token'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfflineBooking;
