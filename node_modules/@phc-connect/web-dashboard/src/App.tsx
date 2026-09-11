import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Pill,
  ShieldCheck,
  Building2,
  Users,
  Activity,
  Calendar,
  Package,
  Layers,
  LogOut,
  Bell,
  HeartPulse,
  ChevronDown,
  UserCheck,
  Sparkles,
  CheckCircle2,
  MapPin,
} from 'lucide-react';
import { UserRole, User, DoctorProfile, PharmacistProfile, AdminProfile } from '@phc-connect/types';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { PharmacistDashboard } from './pages/PharmacistDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { LoginPage } from './pages/LoginPage';

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('DOCTOR');
  const [activeDoctorId, setActiveDoctorId] = useState<string>('doc-001');
  const [activePharmacistId, setActivePharmacistId] = useState<string>('pharm-001');
  const [staffStatus, setStaffStatus] = useState<'AVAILABLE' | 'BUSY' | 'OFFLINE'>('AVAILABLE');
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  // Restore session from localStorage on startup
  useEffect(() => {
    const token = localStorage.getItem('phc_staff_token');
    const userStr = localStorage.getItem('phc_staff_user');
    const profileStr = localStorage.getItem('phc_staff_profile');
    const savedRole = localStorage.getItem('phc_staff_role') as UserRole;

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        const profile = profileStr ? JSON.parse(profileStr) : null;
        setCurrentUser(user);
        setCurrentProfile(profile);
        setCurrentRole(savedRole || user.role || 'DOCTOR');
        if (profile?.id) {
          if (savedRole === 'DOCTOR' || user.role === 'DOCTOR') setActiveDoctorId(profile.id);
          if (savedRole === 'PHARMACIST' || user.role === 'PHARMACIST') setActivePharmacistId(profile.id);
        }
        setIsAuthenticated(true);
      } catch (e) {
        console.error('Failed to parse stored session:', e);
      }
    }
  }, []);

  const handleLoginSuccess = (
    user: User,
    profile: DoctorProfile | PharmacistProfile | AdminProfile,
    role: UserRole,
    _token: string
  ) => {
    setCurrentUser(user);
    setCurrentProfile(profile);
    setCurrentRole(role);
    if (role === 'DOCTOR' && profile?.id) setActiveDoctorId(profile.id);
    if (role === 'PHARMACIST' && profile?.id) setActivePharmacistId(profile.id);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('phc_staff_token');
    localStorage.removeItem('phc_staff_user');
    localStorage.removeItem('phc_staff_profile');
    localStorage.removeItem('phc_staff_role');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentProfile(null);
    setShowUserMenu(false);
  };

  const handleSwitchRole = (role: UserRole) => {
    setCurrentRole(role);
    localStorage.setItem('phc_staff_role', role);
  };

  // If not logged in, show the comprehensive Login Interface
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Display Name and Details
  const displayName = currentProfile?.fullName || currentUser?.fullName || 'Clinical Staff';
  const displayPhc = currentProfile?.phcName || 'Central Urban PHC - Karol Bagh';
  const roleBadgeText =
    currentRole === 'DOCTOR'
      ? 'Medical Officer (OPD)'
      : currentRole === 'PHARMACIST'
      ? 'Registered Pharmacist'
      : 'PHC Administrator (MOIC)';
  const avatarInitials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0].toUpperCase())
    .join('');

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon-dash">
            <HeartPulse size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.3px' }}>
              ArogyaMitra
            </h2>
            <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 700, letterSpacing: '0.5px' }}>
              STAFF & CLINICAL PORTAL
            </span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {currentRole === 'DOCTOR' && (
            <>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', padding: '6px 14px' }}>
                Doctor Workspace
              </div>
              <button className="nav-link active">
                <Activity size={18} />
                <span>Clinical Queue & OPD</span>
              </button>
              <button className="nav-link">
                <Calendar size={18} />
                <span>Today's Schedule</span>
              </button>
              <button className="nav-link">
                <Users size={18} />
                <span>Patient EHR Records</span>
              </button>
            </>
          )}

          {currentRole === 'PHARMACIST' && (
            <>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', padding: '6px 14px' }}>
                Pharmacy Operations
              </div>
              <button className="nav-link active">
                <Package size={18} />
                <span>Inventory & Stock</span>
              </button>
              <button className="nav-link">
                <Pill size={18} />
                <span>Dispensing Console</span>
              </button>
              <button className="nav-link">
                <Layers size={18} />
                <span>Batch & Expiry Alerts</span>
              </button>
            </>
          )}

          {currentRole === 'ADMIN' && (
            <>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', padding: '6px 14px' }}>
                PHC Administration
              </div>
              <button className="nav-link active">
                <Building2 size={18} />
                <span>Executive Analytics</span>
              </button>
              <button className="nav-link">
                <Stethoscope size={18} />
                <span>Doctor & Staff Roster</span>
              </button>
              <button className="nav-link">
                <ShieldCheck size={18} />
                <span>Audit & Governance</span>
              </button>
            </>
          )}
        </nav>

        {/* Sidebar Footer Authenticated Staff Card */}
        <div className="sidebar-user-footer">
          <div className="sidebar-user-avatar">
            {avatarInitials || (currentRole === 'DOCTOR' ? 'DR' : currentRole === 'PHARMACIST' ? 'PH' : 'AD')}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 className="sidebar-user-name">
              {displayName}
            </h4>
            <span className="sidebar-user-facility">
              {displayPhc}
            </span>
          </div>
          <button
            onClick={handleLogout}
            title="Log out of clinical session"
            className="sidebar-logout-btn"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="main-wrapper">
        {/* Top Navbar */}
        <header className="top-navbar">
          <div className="nav-left-section">
            <div className="facility-pill">
              <MapPin size={14} color="#0284c7" />
              <span>{displayPhc}</span>
            </div>
            <div className="nav-role-badge">
              <span className="live-dot" />
              <span>{roleBadgeText}</span>
            </div>
          </div>

          {/* Center: Role View Switcher */}
          <div className="role-switcher">
            <button
              className={`role-pill ${currentRole === 'DOCTOR' ? 'active doctor-pill' : ''}`}
              onClick={() => handleSwitchRole('DOCTOR')}
            >
              👨‍⚕️ Doctor View
            </button>
            <button
              className={`role-pill ${currentRole === 'PHARMACIST' ? 'active pharmacist-pill' : ''}`}
              onClick={() => handleSwitchRole('PHARMACIST')}
            >
              💊 Pharmacist View
            </button>
            <button
              className={`role-pill ${currentRole === 'ADMIN' ? 'active admin-pill' : ''}`}
              onClick={() => handleSwitchRole('ADMIN')}
            >
              🏥 PHC Admin View
            </button>
          </div>

          {/* Right: Status, Notifications, User Menu & Logout */}
          <div className="nav-right-section">
            {/* Status Dropdown */}
            {currentRole === 'DOCTOR' && (
              <div className="status-selector">
                <select
                  value={staffStatus}
                  onChange={(e) => setStaffStatus(e.target.value as any)}
                  className={`status-select ${staffStatus.toLowerCase()}`}
                >
                  <option value="AVAILABLE">🟢 Available for OPD</option>
                  <option value="BUSY">🟡 In Consultation</option>
                  <option value="OFFLINE">⚪ Off Duty / Break</option>
                </select>
              </div>
            )}

            {/* Notifications Bell */}
            <button
              type="button"
              className="nav-icon-btn"
              onClick={() => setShowNotifications(!showNotifications)}
              title="Clinical notifications"
            >
              <Bell size={18} />
              <span className="notif-badge">3</span>
            </button>

            {/* User Profile Pill & Dropdown */}
            <div className="user-profile-menu-wrap">
              <div
                className="user-profile-pill"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="header-avatar">
                  {avatarInitials || 'DR'}
                </div>
                <div className="header-user-meta">
                  <span className="header-user-name">{displayName}</span>
                  <span className="header-user-role">{currentRole}</span>
                </div>
                <ChevronDown size={14} style={{ color: '#64748b' }} />
              </div>

              {showUserMenu && (
                <div className="user-dropdown-menu">
                  <div className="user-dropdown-header">
                    <strong>{displayName}</strong>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      {currentUser?.email || currentUser?.phone}
                    </div>
                    <div className="user-dropdown-phc">
                      <MapPin size={11} /> {displayPhc}
                    </div>
                  </div>

                  <div className="user-dropdown-divider" />

                  <button
                    className="dropdown-item logout-item"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
                    <span>Sign Out of Terminal</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Dynamic Content */}
        <main className="dash-content">
          {currentRole === 'DOCTOR' && <DoctorDashboard doctorId={activeDoctorId} />}
          {currentRole === 'PHARMACIST' && <PharmacistDashboard pharmacistId={activePharmacistId} />}
          {currentRole === 'ADMIN' && <AdminDashboard />}
        </main>
      </div>
    </div>
  );
};
export default App;
