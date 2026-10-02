import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserCheck, ShieldAlert, Sparkles } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        const from = location.state?.from?.pathname || '/patient';
        navigate(from);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Quick fill helper for presentation/evaluation
  const fillCredentials = (role) => {
    if (role === 'patient') {
      setEmail('patient@example.com');
      setPassword('patientpassword123');
    } else {
      setEmail('admin@hospital.com');
      setPassword('adminpassword123');
    }
    setError('');
  };

  return (
    <div style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <div className="container" style={{ maxWidth: 460 }}>
        <div className="card" style={{ padding: '2rem' }}>
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
              <LogIn size={26} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Sign In</h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
              Access the Smart Queue Management Portal
            </p>
          </div>

          {/* Quick Demo Fill Buttons for Viva Presentation */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: 8,
              padding: '0.75rem',
              marginBottom: '1.25rem',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: '0.5rem' }}>
              <Sparkles size={13} color="#f59e0b" /> DEMO CREDENTIALS AUTOFILL
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => fillCredentials('patient')}
                className="btn btn-secondary btn-sm"
                style={{ flex: 1, fontSize: '0.8rem' }}
              >
                👤 Demo Patient
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('admin')}
                className="btn btn-secondary btn-sm"
                style={{ flex: 1, fontSize: '0.8rem', backgroundColor: '#fef3c7', borderColor: '#fde68a', color: '#92400e' }}
              >
                🛡️ Hospital Admin
              </button>
            </div>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="form-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#64748b' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ fontWeight: 600 }}>
              Register as Patient
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
