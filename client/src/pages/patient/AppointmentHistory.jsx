import React, { useEffect, useState } from 'react';
import { tokenService } from '../../services/api';
import { Clock, Calendar, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const AppointmentHistory = () => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await tokenService.getMyTokens();
        setTokens(res.data.data || []);
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filteredTokens = tokens.filter((t) => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  return (
    <div style={{ paddingTop: '2.5rem', paddingBottom: '3rem' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>My Appointment History</h1>
            <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
              Complete record of your hospital tokens and consultation logs
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['all', 'waiting', 'completed', 'cancelled'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`btn btn-sm ${filter === tab ? 'btn-primary' : 'btn-secondary'}`}
                style={{ textTransform: 'capitalize' }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loader"></div>
        ) : filteredTokens.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: '#64748b' }}>No appointments matching "{filter}" found.</p>
          </div>
        ) : (
          <div className="card">
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Token #</th>
                    <th>Doctor</th>
                    <th>Specialization</th>
                    <th>Room</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTokens.map((t) => (
                    <tr key={t._id}>
                      <td>
                        <strong style={{ fontSize: '1.05rem', color: '#0284c7' }}>
                          {t.tokenNumber}
                        </strong>
                      </td>
                      <td>{t.doctorId?.name || 'Doctor'}</td>
                      <td>{t.doctorId?.specialization || 'OPD'}</td>
                      <td>{t.doctorId?.roomNumber || 'Room 101'}</td>
                      <td>{new Date(t.appointmentDate).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge badge-${t.tokenType}`}>{t.tokenType}</span>
                      </td>
                      <td>
                        <span className={`badge badge-${t.status}`}>{t.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentHistory;
