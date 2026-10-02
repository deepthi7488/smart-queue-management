import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  Calendar,
  Clock,
  User,
  LogOut,
  LayoutDashboard,
  Users,
  UserPlus,
  Stethoscope,
  ClipboardList
} from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, isPatient, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="container nav-content">
        <Link to="/" className="brand-logo">
          <Activity size={26} color="#0284c7" />
          <div>
            Smart<span>Queue</span>
            <small style={{ display: 'block', fontSize: '0.65rem', color: '#64748b', fontWeight: 500, letterSpacing: '0.04em' }}>
              HOSPITAL MANAGEMENT
            </small>
          </div>
        </Link>

        <ul className="nav-links">
          {/* Public Links */}
          <li>
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
              Home
            </Link>
          </li>
          <li>
            <Link to="/doctors" className={`nav-link ${isActive('/doctors') ? 'active' : ''}`}>
              Doctors
            </Link>
          </li>
          <li>
            <Link to="/queue-tracker" className={`nav-link ${isActive('/queue-tracker') ? 'active' : ''}`}>
              Live Queue
            </Link>
          </li>

          {/* Patient Specific Links */}
          {isAuthenticated && isPatient && (
            <>
              <li>
                <Link to="/patient" className={`nav-link ${isActive('/patient') ? 'active' : ''}`}>
                  <LayoutDashboard size={16} style={{ display: 'inline', marginRight: 4 }} />
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/patient/book" className={`nav-link ${isActive('/patient/book') ? 'active' : ''}`}>
                  <Calendar size={16} style={{ display: 'inline', marginRight: 4 }} />
                  Book Token
                </Link>
              </li>
              <li>
                <Link to="/patient/history" className={`nav-link ${isActive('/patient/history') ? 'active' : ''}`}>
                  <Clock size={16} style={{ display: 'inline', marginRight: 4 }} />
                  My Tokens
                </Link>
              </li>
            </>
          )}

          {/* Admin Specific Links */}
          {isAuthenticated && isAdmin && (
            <>
              <li>
                <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`}>
                  <LayoutDashboard size={16} style={{ display: 'inline', marginRight: 4 }} />
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/admin/queue" className={`nav-link ${isActive('/admin/queue') ? 'active' : ''}`}>
                  <ClipboardList size={16} style={{ display: 'inline', marginRight: 4 }} />
                  Manage Queue
                </Link>
              </li>
              <li>
                <Link to="/admin/offline-booking" className={`nav-link ${isActive('/admin/offline-booking') ? 'active' : ''}`}>
                  <UserPlus size={16} style={{ display: 'inline', marginRight: 4 }} />
                  Offline Token
                </Link>
              </li>
              <li>
                <Link to="/admin/doctors" className={`nav-link ${isActive('/admin/doctors') ? 'active' : ''}`}>
                  <Stethoscope size={16} style={{ display: 'inline', marginRight: 4 }} />
                  Doctors
                </Link>
              </li>
              <li>
                <Link to="/admin/patients" className={`nav-link ${isActive('/admin/patients') ? 'active' : ''}`}>
                  <Users size={16} style={{ display: 'inline', marginRight: 4 }} />
                  Patients
                </Link>
              </li>
            </>
          )}

          {/* Auth State Button */}
          {isAuthenticated ? (
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.5rem' }}>
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  padding: '0.25rem 0.6rem',
                  borderRadius: 6,
                  backgroundColor: isAdmin ? '#fef3c7' : '#e0f2fe',
                  color: isAdmin ? '#92400e' : '#0369a1',
                  border: `1px solid ${isAdmin ? '#fde68a' : '#bae6fd'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <User size={13} />
                {user.name.split(' ')[0]} ({isAdmin ? 'Admin' : 'Patient'})
              </span>
              <button
                onClick={handleLogout}
                className="btn btn-secondary btn-sm"
                title="Logout"
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <LogOut size={14} />
                Logout
              </button>
            </li>
          ) : (
            <li style={{ display: 'flex', gap: '0.5rem', marginLeft: '0.5rem' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
