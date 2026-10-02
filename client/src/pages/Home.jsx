import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { doctorService } from '../services/api';
import {
  Clock,
  Users,
  ShieldCheck,
  Stethoscope,
  Activity,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

const Home = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await doctorService.getAll();
        setDoctors(res.data.data || []);
      } catch (err) {
        console.error('Failed to load doctors on home page:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

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
    <div style={{ paddingTop: '2rem' }}>
      <div className="container">
        {/* Hero Section */}
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#ffffff',
            padding: '3rem 2rem',
            borderRadius: 16,
            marginBottom: '3rem',
            boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.4)',
          }}
        >
          <div style={{ maxWidth: 760 }}>
            <span
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                padding: '0.35rem 0.85rem',
                borderRadius: 20,
                fontSize: '0.85rem',
                fontWeight: 600,
                letterSpacing: '0.03em',
                display: 'inline-block',
                marginBottom: '1rem',
              }}
            >
              Design Thinking & Engineering (DT&E)
            </span>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '1rem' }}>
              Smart Queue Management System for Hospitals
            </h1>
            <p style={{ fontSize: '1.1rem', opacity: 0.95, lineHeight: 1.6, marginBottom: '1.75rem' }}>
              Eliminating long, unpredictable hospital waiting times through dynamic queue recalculation.
              Real-time updates when consultations overrun or doctor schedules shift, seamlessly uniting online bookings and offline walk-ins.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link
                to="/patient/book"
                className="btn"
                style={{ backgroundColor: '#ffffff', color: '#0369a1', fontWeight: 700 }}
              >
                Book a Token Online <ArrowRight size={16} />
              </Link>
              <Link
                to="/queue-tracker"
                className="btn"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.4)' }}
              >
                Track Live Queue Status
              </Link>
            </div>
          </div>
        </div>

        {/* Core Problem & Smart Solution Banner */}
        <div className="grid-3" style={{ marginBottom: '3rem' }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ backgroundColor: '#fee2e2', padding: 8, borderRadius: 8, color: '#dc2626' }}>
                <Clock size={24} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Dynamic Recalculation</h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
              If a 10-minute consultation takes 25 minutes or a doctor arrives late, all subsequent patient wait times shift dynamically.
            </p>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ backgroundColor: '#e0f2fe', padding: 8, borderRadius: 8, color: '#0284c7' }}>
                <Users size={24} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Unified Queue Architecture</h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
              Online booked tokens and offline walk-in tokens enter the exact same synchronized sequence without separate chaotic lines.
            </p>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ backgroundColor: '#dcfce7', padding: 8, borderRadius: 8, color: '#16a34a' }}>
                <ShieldCheck size={24} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Queue Transparency</h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
              Patients can view how many people are ahead, the token currently inside the room, and their updated arrival time.
            </p>
          </div>
        </div>

        {/* Live Doctor Availability */}
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Today's OPD Doctors & Queue Status</h2>
              <p style={{ fontSize: '0.9rem', color: '#64748b' }}>Real-time consultation status across departments</p>
            </div>
            <Link to="/doctors" className="btn btn-outline btn-sm">
              View All Doctors
            </Link>
          </div>

          {loading ? (
            <div className="loader"></div>
          ) : doctors.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
              <p style={{ color: '#64748b' }}>No doctors listed yet.</p>
            </div>
          ) : (
            <div className="grid-2">
              {doctors.map((doc) => (
                <div key={doc._id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{doc.name}</h3>
                        <p style={{ fontSize: '0.85rem', color: '#0284c7', fontWeight: 600 }}>{doc.specialization}</p>
                      </div>
                      {getStatusBadge(doc.status)}
                    </div>

                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                      🏥 {doc.department} • 📍 {doc.roomNumber}
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
                        <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>NOW SERVING</span>
                        <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                          {doc.queueSummary?.currentServingToken || 'None'}
                        </strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>IN QUEUE</span>
                        <strong style={{ fontSize: '0.95rem', color: '#2563eb' }}>
                          {doc.queueSummary?.waitingPatients || 0}
                        </strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>AVG TIME</span>
                        <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                          {doc.averageConsultationTime}m
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
    </div>
  );
};

export default Home;
