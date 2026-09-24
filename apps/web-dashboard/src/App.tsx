import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Pill,
  Building2,
  ClipboardList,
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
  Clock,
  ShieldCheck,
  AlertCircle,
  PhoneCall,
  PhoneForwarded,
  Tent,
  Siren,
} from 'lucide-react';
import { UserRole, User, DoctorProfile, PharmacistProfile, AdminProfile, ReceptionistProfile } from '@phc-connect/types';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { PharmacistDashboard } from './pages/PharmacistDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ReceptionistDashboard } from './pages/ReceptionistDashboard';
import { ComplaintsManagementDashboard } from './pages/ComplaintsManagementDashboard';
import { CallServicesDashboard } from './pages/CallServicesDashboard';
import { HealthAssistantDashboard } from './pages/HealthAssistantDashboard';
import { AwarenessManagementDashboard } from './pages/AwarenessManagementDashboard';
import { HealthCampDashboard } from './pages/HealthCampDashboard';
import { EmergencyPreAlertDashboard } from './pages/EmergencyPreAlertDashboard';
import { FollowUpDashboard } from './pages/FollowUpDashboard';
import { LoginPage } from './pages/LoginPage';
import { ReceptionistLoginPage } from './pages/ReceptionistLoginPage';

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('DOCTOR');
  const [activeDoctorId, setActiveDoctorId] = useState<string>('doc-001');
  const [activePharmacistId, setActivePharmacistId] = useState<string>('pharm-001');
  const [activeReceptionistId, setActiveReceptionistId] = useState<string>('rec-001');
  const [activeAssistantId, setActiveAssistantId] = useState<string>('asst-001');
  const [staffStatus, setStaffStatus] = useState<'AVAILABLE' | 'BUSY' | 'OFFLINE'>('AVAILABLE');
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [isDedicatedReceptionistLogin, setIsDedicatedReceptionistLogin] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname.includes('/receptionist') || window.location.search.includes('receptionist');
    }
    return false;
  });

  // Role Sub-Tab States
  const [doctorTab, setDoctorTab] = useState<'opd' | 'schedule' | 'ehr' | 'emergency' | 'followups'>('opd');
  const [pharmacistTab, setPharmacistTab] = useState<'inventory' | 'dispense' | 'alerts'>('inventory');
  const [adminTab, setAdminTab] = useState<'analytics' | 'roster' | 'audit' | 'complaints' | 'calls' | 'awareness' | 'camps' | 'emergency' | 'followups'>('analytics');
  const [assistantTab, setAssistantTab] = useState<'telecare' | 'camps' | 'emergency' | 'followups'>('telecare');
  const [receptionistTab, setReceptionistTab] = useState<'checkup' | 'queue' | 'patients'>('checkup');

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
          if (savedRole === 'RECEPTIONIST' || user.role === 'RECEPTIONIST') setActiveReceptionistId(profile.id);
        }
        setIsAuthenticated(true);
      } catch (e) {
        console.error('Failed to parse stored session:', e);
      }
    }
  }, []);

  const handleLoginSuccess = (
    user: User,
    profile: DoctorProfile | PharmacistProfile | AdminProfile | ReceptionistProfile,
    role: UserRole,
    _token: string
  ) => {
    setCurrentUser(user);
    setCurrentProfile(profile);
    setCurrentRole(role);
    if (role === 'DOCTOR' && profile?.id) setActiveDoctorId(profile.id);
    if (role === 'PHARMACIST' && profile?.id) setActivePharmacistId(profile.id);
    if (role === 'RECEPTIONIST' && profile?.id) setActiveReceptionistId(profile.id);
    if (role === 'HEALTH_ASSISTANT' && profile?.id) setActiveAssistantId(profile.id);
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

  // If not logged in, show dedicated Receptionist Login or Unified Login Interface
  if (!isAuthenticated) {
    if (isDedicatedReceptionistLogin) {
      return (
        <ReceptionistLoginPage
          onLoginSuccess={handleLoginSuccess}
          onNavigateToGeneralLogin={() => setIsDedicatedReceptionistLogin(false)}
        />
      );
    }
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onNavigateToReceptionistLogin={() => setIsDedicatedReceptionistLogin(true)}
      />
    );
  }

  // Display Name and Details
  const displayName = currentProfile?.fullName || currentUser?.fullName || 'Clinical Staff';
  const displayPhc = currentProfile?.phcName || 'Central Urban PHC - Karol Bagh';
  const roleBadgeText =
    currentRole === 'DOCTOR'
      ? 'Medical Officer (OPD)'
      : currentRole === 'PHARMACIST'
      ? 'Registered Pharmacist'
      : currentRole === 'RECEPTIONIST'
      ? 'Front Desk Officer (Reception)'
      : currentRole === 'HEALTH_ASSISTANT'
      ? 'Community Health Assistant (ASHA/CHO)'
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
              <button
                className={`nav-link ${doctorTab === 'opd' ? 'active' : ''}`}
                onClick={() => setDoctorTab('opd')}
              >
                <Activity size={18} />
                <span>Clinical Queue & OPD</span>
              </button>
              <button
                className={`nav-link ${doctorTab === 'emergency' ? 'active' : ''}`}
                onClick={() => setDoctorTab('emergency')}
              >
                <Siren size={18} />
                <span>Emergency Pre-Alerts</span>
              </button>
              <button
                className={`nav-link ${doctorTab === 'followups' ? 'active' : ''}`}
                onClick={() => setDoctorTab('followups')}
              >
                <HeartPulse size={18} />
                <span>Patient Follow-ups & Referrals</span>
              </button>
              <button
                className={`nav-link ${doctorTab === 'schedule' ? 'active' : ''}`}
                onClick={() => setDoctorTab('schedule')}
              >
                <Calendar size={18} />
                <span>Today's Schedule</span>
              </button>
              <button
                className={`nav-link ${doctorTab === 'ehr' ? 'active' : ''}`}
                onClick={() => setDoctorTab('ehr')}
              >
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
              <button
                className={`nav-link ${pharmacistTab === 'inventory' ? 'active' : ''}`}
                onClick={() => setPharmacistTab('inventory')}
              >
                <Package size={18} />
                <span>Inventory & Stock</span>
              </button>
              <button
                className={`nav-link ${pharmacistTab === 'dispense' ? 'active' : ''}`}
                onClick={() => setPharmacistTab('dispense')}
              >
                <Pill size={18} />
                <span>Dispensing Console</span>
              </button>
              <button
                className={`nav-link ${pharmacistTab === 'alerts' ? 'active' : ''}`}
                onClick={() => setPharmacistTab('alerts')}
              >
                <Layers size={18} />
                <span>Batch & Expiry Alerts</span>
              </button>
            </>
          )}

          {currentRole === 'RECEPTIONIST' && (
            <>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', padding: '6px 14px' }}>
                Front Desk Reception
              </div>
              <button
                className={`nav-link ${receptionistTab === 'checkup' ? 'active' : ''}`}
                onClick={() => setReceptionistTab('checkup')}
              >
                <ClipboardList size={18} />
                <span>Patient Pre-Checkup</span>
              </button>
              <button
                className={`nav-link ${receptionistTab === 'queue' ? 'active' : ''}`}
                onClick={() => setReceptionistTab('queue')}
              >
                <Clock size={18} />
                <span>Live OPD Queue</span>
              </button>
            </>
          )}

          {currentRole === 'HEALTH_ASSISTANT' && (
            <>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', padding: '6px 14px' }}>
                Health Assistant Workspace
              </div>
              <button
                className={`nav-link ${assistantTab === 'telecare' ? 'active' : ''}`}
                onClick={() => setAssistantTab('telecare')}
              >
                <HeartPulse size={18} />
                <span>Live Tele-Care & Calls</span>
              </button>
              <button
                className={`nav-link ${assistantTab === 'followups' ? 'active' : ''}`}
                onClick={() => setAssistantTab('followups')}
              >
                <ClipboardList size={18} />
                <span>Follow-up & Tracking (ASHA)</span>
              </button>
              <button
                className={`nav-link ${assistantTab === 'emergency' ? 'active' : ''}`}
                onClick={() => setAssistantTab('emergency')}
              >
                <Siren size={18} />
                <span>Emergency Pre-Alerts</span>
              </button>
              <button
                className={`nav-link ${assistantTab === 'camps' ? 'active' : ''}`}
                onClick={() => setAssistantTab('camps')}
              >
                <Tent size={18} />
                <span>Community Health Camps</span>
              </button>
            </>
          )}

          {currentRole === 'ADMIN' && (
            <>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', padding: '6px 14px' }}>
                PHC Administration
              </div>
              <button
                className={`nav-link ${adminTab === 'analytics' ? 'active' : ''}`}
                onClick={() => setAdminTab('analytics')}
              >
                <Building2 size={18} />
                <span>Executive Analytics</span>
              </button>
              <button
                className={`nav-link ${adminTab === 'followups' ? 'active' : ''}`}
                onClick={() => setAdminTab('followups')}
              >
                <HeartPulse size={18} />
                <span>Referrals & Follow-up Tracker</span>
              </button>
              <button
                className={`nav-link ${adminTab === 'emergency' ? 'active' : ''}`}
                onClick={() => setAdminTab('emergency')}
              >
                <Siren size={18} />
                <span>Emergency Casualty Triage</span>
              </button>
              <button
                className={`nav-link ${adminTab === 'camps' ? 'active' : ''}`}
                onClick={() => setAdminTab('camps')}
              >
                <Tent size={18} />
                <span>Health Camps & Outreach</span>
              </button>
              <button
                className={`nav-link ${adminTab === 'roster' ? 'active' : ''}`}
                onClick={() => setAdminTab('roster')}
              >
                <Stethoscope size={18} />
                <span>Doctor & Staff Roster</span>
              </button>
              <button
                className={`nav-link ${adminTab === 'complaints' ? 'active' : ''}`}
                onClick={() => setAdminTab('complaints')}
              >
                <AlertCircle size={18} />
                <span>Grievances & Redressal</span>
              </button>
              <button
                className={`nav-link ${adminTab === 'awareness' ? 'active' : ''}`}
                onClick={() => setAdminTab('awareness')}
              >
                <Sparkles size={18} />
                <span>Health Awareness & IEC</span>
              </button>
              <button
                className={`nav-link ${adminTab === 'audit' ? 'active' : ''}`}
                onClick={() => setAdminTab('audit')}
              >
                <ShieldCheck size={18} />
                <span>Audit & Governance</span>
              </button>
            </>
          )}
        </nav>

        {/* Sidebar Footer Authenticated Staff Card */}
        <div className="sidebar-user-footer">
          <div className="sidebar-user-avatar">
            {avatarInitials || (currentRole === 'DOCTOR' ? 'DR' : currentRole === 'PHARMACIST' ? 'PH' : currentRole === 'RECEPTIONIST' ? 'RC' : currentRole === 'HEALTH_ASSISTANT' ? 'HA' : 'AD')}
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
              className={`role-pill ${currentRole === 'HEALTH_ASSISTANT' ? 'active' : ''}`}
              onClick={() => handleSwitchRole('HEALTH_ASSISTANT')}
              style={{
                background: currentRole === 'HEALTH_ASSISTANT' ? 'linear-gradient(135deg, #0d9488, #059669)' : undefined,
                color: currentRole === 'HEALTH_ASSISTANT' ? '#ffffff' : undefined,
              }}
            >
              👩‍⚕️ Health Assistant
            </button>
            <button
              className={`role-pill ${currentRole === 'PHARMACIST' ? 'active pharmacist-pill' : ''}`}
              onClick={() => handleSwitchRole('PHARMACIST')}
            >
              💊 Pharmacist View
            </button>
            <button
              className={`role-pill ${currentRole === 'RECEPTIONIST' ? 'active receptionist-pill' : ''}`}
              onClick={() => handleSwitchRole('RECEPTIONIST')}
            >
              📋 Reception Desk
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
                <div className="header-avatar" style={{ background: currentRole === 'RECEPTIONIST' ? 'linear-gradient(135deg, #0284c7, #0ea5e9)' : currentRole === 'HEALTH_ASSISTANT' ? 'linear-gradient(135deg, #0d9488, #059669)' : undefined }}>
                  {avatarInitials || (currentRole === 'RECEPTIONIST' ? 'RC' : currentRole === 'HEALTH_ASSISTANT' ? 'HA' : 'DR')}
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
          {currentRole === 'DOCTOR' && (
            doctorTab === 'emergency' ? (
              <EmergencyPreAlertDashboard
                currentFacilityId={currentProfile?.phcId || 'phc-001'}
                userRole="DOCTOR"
                userId={activeDoctorId}
                userName={displayName}
              />
            ) : doctorTab === 'followups' ? (
              <FollowUpDashboard
                currentFacilityId={currentProfile?.phcId || 'phc-001'}
                userRole="DOCTOR"
                userId={activeDoctorId}
                userName={displayName}
              />
            ) : (
              <DoctorDashboard
                doctorId={activeDoctorId}
                activeTab={doctorTab as any}
                onSelectTab={(tab) => setDoctorTab(tab as any)}
              />
            )
          )}
          {currentRole === 'HEALTH_ASSISTANT' && (
            assistantTab === 'emergency' ? (
              <EmergencyPreAlertDashboard
                currentFacilityId={currentProfile?.phcId || 'phc-001'}
                userRole="HEALTH_ASSISTANT"
                userId={activeAssistantId}
                userName={displayName}
              />
            ) : assistantTab === 'followups' ? (
              <FollowUpDashboard
                currentFacilityId={currentProfile?.phcId || 'phc-001'}
                userRole="HEALTH_ASSISTANT"
                userId={activeAssistantId}
                userName={displayName}
              />
            ) : assistantTab === 'camps' ? (
              <HealthCampDashboard
                currentUser={currentUser}
                onNavigateTab={(tab) => {
                  if (tab === 'assistant') setAssistantTab('telecare');
                }}
              />
            ) : (
              <HealthAssistantDashboard
                assistantId={activeAssistantId}
                currentRole={currentRole}
                phcId={currentProfile?.phcId || 'phc-001'}
              />
            )
          )}
          {currentRole === 'PHARMACIST' && (
            <PharmacistDashboard
              pharmacistId={activePharmacistId}
              activeTab={pharmacistTab}
              onSelectTab={(tab) => setPharmacistTab(tab)}
            />
          )}
          {currentRole === 'RECEPTIONIST' && (
            <ReceptionistDashboard
              receptionistId={activeReceptionistId}
              activeTab={receptionistTab}
              onSelectTab={(tab) => setReceptionistTab(tab)}
            />
          )}
          {currentRole === 'ADMIN' && (
            adminTab === 'emergency' ? (
              <EmergencyPreAlertDashboard
                currentFacilityId="phc-001"
                userRole="ADMIN"
                userId="admin-001"
                userName={displayName}
              />
            ) : adminTab === 'followups' ? (
              <FollowUpDashboard
                currentFacilityId="phc-001"
                userRole="ADMIN"
                userId="admin-001"
                userName={displayName}
              />
            ) : adminTab === 'camps' ? (
              <HealthCampDashboard currentUser={currentUser} />
            ) : adminTab === 'complaints' ? (
              <ComplaintsManagementDashboard currentRole={currentRole} />
            ) : adminTab === 'awareness' ? (
              <AwarenessManagementDashboard currentRole={currentRole} />
            ) : (
              <AdminDashboard
                activeTab={adminTab as 'analytics' | 'roster' | 'audit'}
                onSelectTab={(tab) => setAdminTab(tab)}
              />
            )
          )}
        </main>
      </div>
    </div>
  );
};
export default App;

