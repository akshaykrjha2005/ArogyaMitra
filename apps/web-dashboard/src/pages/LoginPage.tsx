import React, { useState } from 'react';
import {
  Stethoscope,
  Pill,
  Building2,
  ClipboardList,
  HeartPulse,
  Lock,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Activity,
  Award,
  Clock,
  Phone,
} from 'lucide-react';
import { UserRole, User, DoctorProfile, PharmacistProfile, AdminProfile, ReceptionistProfile } from '@phc-connect/types';
import { apiClient } from '../services/api';

interface Props {
  onLoginSuccess: (
    user: User,
    profile: DoctorProfile | PharmacistProfile | AdminProfile | ReceptionistProfile,
    role: UserRole,
    token: string
  ) => void;
  onNavigateToReceptionistLogin?: () => void;
}

interface DemoAccount {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  title: string;
  specialization: string;
  phcName: string;
  phcId: string;
  id: string;
  badge: string;
  avatarBg: string;
  avatarText: string;
}

const DEMO_ACCOUNTS: Record<UserRole, DemoAccount[]> = {
  DOCTOR: [
    {
      id: 'doc-001',
      name: 'Dr. Rajesh Verma',
      email: 'dr.verma@phc.gov.in',
      phone: '+91 98111 00101',
      role: 'DOCTOR',
      title: 'Senior Medical Officer',
      specialization: 'General Medicine • MBBS, MD',
      phcName: 'Central Urban PHC - Karol Bagh',
      phcId: 'phc-001',
      badge: 'OPD Room 1',
      avatarBg: '#2563eb',
      avatarText: 'RV',
    },
    {
      id: 'doc-002',
      name: 'Dr. Priya Sharma',
      email: 'dr.priya@phc.gov.in',
      phone: '+91 98111 00102',
      role: 'DOCTOR',
      title: 'Pediatric Specialist',
      specialization: 'Pediatrics & Child Health • MBBS, DCH',
      phcName: 'Central Urban PHC - Karol Bagh',
      phcId: 'phc-001',
      badge: 'OPD Room 3 (Child Health)',
      avatarBg: '#0284c7',
      avatarText: 'PS',
    },
    {
      id: 'doc-004',
      name: 'Dr. Amit Deshmukh',
      email: 'dr.amit@phc.gov.in',
      phone: '+91 98111 00104',
      role: 'DOCTOR',
      title: 'Emergency Trauma Officer',
      specialization: 'Emergency Medicine • MBBS, MEM',
      phcName: 'Suburban CHC - Rohini',
      phcId: 'phc-002',
      badge: '24x7 Emergency Trauma Bay',
      avatarBg: '#dc2626',
      avatarText: 'AD',
    },
    {
      id: 'doc-005',
      name: 'Dr. Sunita Patel',
      email: 'dr.sunita@phc.gov.in',
      phone: '+91 98111 00105',
      role: 'DOCTOR',
      title: 'Community Health Officer',
      specialization: 'Community Medicine • MBBS, MD',
      phcName: 'Model Rural PHC - Najafgarh',
      phcId: 'phc-003',
      badge: 'Rural Consultation Bay',
      avatarBg: '#059669',
      avatarText: 'SP',
    },
  ],
  PHARMACIST: [
    {
      id: 'pharm-001',
      name: 'Ramesh Kumar',
      email: 'pharmacist.karolbagh@phc.gov.in',
      phone: '+91 98222 00201',
      role: 'PHARMACIST',
      title: 'Senior Clinical Pharmacist',
      specialization: 'Lic: DL-PHARM-2015-8832',
      phcName: 'Central Urban PHC - Karol Bagh',
      phcId: 'phc-001',
      badge: 'Pharmacy Counter A',
      avatarBg: '#059669',
      avatarText: 'RK',
    },
    {
      id: 'pharm-002',
      name: 'Suresh Pillai',
      email: 'pharmacist.rohini@phc.gov.in',
      phone: '+91 98222 00202',
      role: 'PHARMACIST',
      title: 'Lead Dispensary Officer',
      specialization: 'Lic: DL-PHARM-2012-9901',
      phcName: 'Suburban CHC - Rohini',
      phcId: 'phc-002',
      badge: '24x7 Hospital Dispensary',
      avatarBg: '#0d9488',
      avatarText: 'SP',
    },
    {
      id: 'pharm-003',
      name: 'Kavita Sen',
      email: 'pharmacist.najafgarh@phc.gov.in',
      phone: '+91 98222 00203',
      role: 'PHARMACIST',
      title: 'Rural Drug Distribution Lead',
      specialization: 'Lic: DL-PHARM-2018-4412',
      phcName: 'Model Rural PHC - Najafgarh',
      phcId: 'phc-003',
      badge: 'Dispensary Counter 1',
      avatarBg: '#16a34a',
      avatarText: 'KS',
    },
  ],
  ADMIN: [
    {
      id: 'admin-001',
      name: 'Dr. Harish Chandra (MOIC)',
      email: 'admin.karolbagh@phc.gov.in',
      phone: '+91 98333 00301',
      role: 'ADMIN',
      title: 'Medical Officer In-Charge (MOIC)',
      specialization: 'PHC Administration & Governance',
      phcName: 'Central Urban PHC - Karol Bagh',
      phcId: 'phc-001',
      badge: 'Facility Command',
      avatarBg: '#7c3aed',
      avatarText: 'HC',
    },
    {
      id: 'admin-002',
      name: 'Dr. Shalini Mukherji',
      email: 'admin.rohini@phc.gov.in',
      phone: '+91 98333 00302',
      role: 'ADMIN',
      title: 'Chief Medical Superintendent',
      specialization: 'District Healthcare Oversight',
      phcName: 'Suburban CHC - Rohini',
      phcId: 'phc-002',
      badge: 'District Admin',
      avatarBg: '#9333ea',
      avatarText: 'SM',
    },
  ],
  RECEPTIONIST: [
    {
      id: 'rec-001',
      name: 'Pooja Sharma',
      email: 'receptionist.karolbagh@phc.gov.in',
      phone: '+91 98444 00401',
      role: 'RECEPTIONIST',
      title: 'Front Desk Officer',
      specialization: 'Patient Registration & Vitals Intake',
      phcName: 'Central Urban PHC - Karol Bagh',
      phcId: 'phc-001',
      badge: 'Counter 1',
      avatarBg: '#0284c7',
      avatarText: 'PS',
    },
    {
      id: 'rec-002',
      name: 'Anjali Verma',
      email: 'receptionist.rohini@phc.gov.in',
      phone: '+91 98444 00402',
      role: 'RECEPTIONIST',
      title: 'Lead Registration Officer',
      specialization: 'Pre-Consultation Check-Up Bay',
      phcName: 'Suburban CHC - Rohini',
      phcId: 'phc-002',
      badge: 'Desk A',
      avatarBg: '#0ea5e9',
      avatarText: 'AV',
    },
  ],
  PATIENT: [],
};

export const LoginPage: React.FC<Props> = ({ onLoginSuccess, onNavigateToReceptionistLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('DOCTOR');
  const [emailOrPhone, setEmailOrPhone] = useState('dr.verma@phc.gov.in');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Switch default input when changing role
  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMsg(null);
    const firstDemo = DEMO_ACCOUNTS[role]?.[0];
    if (firstDemo) {
      setEmailOrPhone(firstDemo.email);
    }
  };

  // Direct login with credentials
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone.trim()) {
      setErrorMsg('Please enter your Registered Staff Email or Phone Number.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      const isEmail = emailOrPhone.includes('@');
      const payload: any = {
        role: selectedRole,
      };
      if (isEmail) {
        payload.email = emailOrPhone.trim();
      } else {
        payload.phone = emailOrPhone.trim();
      }

      const res = await apiClient.post('/auth/login', payload);

      if (res.success && res.token) {
        localStorage.setItem('phc_staff_token', res.token);
        localStorage.setItem('phc_staff_user', JSON.stringify(res.user));
        localStorage.setItem('phc_staff_profile', JSON.stringify(res.profile));
        localStorage.setItem('phc_staff_role', res.user.role || selectedRole);

        onLoginSuccess(res.user, res.profile, res.user.role || selectedRole, res.token);
      } else {
        setErrorMsg(res.message || 'Login failed. Please verify your credentials.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to connect to PHC Auth Gateway. Please ensure backend is active.');
    } finally {
      setLoading(false);
    }
  };

  // Quick 1-Click Demo Login
  const handleQuickLogin = async (account: DemoAccount) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      setEmailOrPhone(account.email);

      const res = await apiClient.post('/auth/login', {
        email: account.email,
        role: account.role,
      });

      if (res.success && res.token) {
        localStorage.setItem('phc_staff_token', res.token);
        localStorage.setItem('phc_staff_user', JSON.stringify(res.user));
        localStorage.setItem('phc_staff_profile', JSON.stringify(res.profile));
        localStorage.setItem('phc_staff_role', account.role);

        onLoginSuccess(res.user, res.profile, account.role, res.token);
      } else {
        setErrorMsg(res.message || 'Quick login failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleTheme = () => {
    switch (selectedRole) {
      case 'DOCTOR':
        return {
          primary: '#2563eb',
          lightBg: '#eff6ff',
          accent: '#3b82f6',
          title: 'Doctor & Medical Officer Portal',
          desc: 'Clinical OPD queue, AI triage validation, electronic diagnosis & e-prescriptions',
          icon: <Stethoscope size={24} />,
        };
      case 'PHARMACIST':
        return {
          primary: '#059669',
          lightBg: '#ecfdf5',
          accent: '#10b981',
          title: 'Pharmacy & Dispensary Console',
          desc: 'Real-time drug inventory, batch expiry management & automated barcode dispensing',
          icon: <Pill size={24} />,
        };
      case 'ADMIN':
        return {
          primary: '#7c3aed',
          lightBg: '#f5f3ff',
          accent: '#8b5cf6',
          title: 'PHC Administration & Governance',
          desc: 'Epidemic outbreak surveillance, patient footfall metrics & clinical staff roster',
          icon: <Building2 size={24} />,
        };
      case 'RECEPTIONIST':
        return {
          primary: '#0284c7',
          lightBg: '#f0f9ff',
          accent: '#0ea5e9',
          title: 'Receptionist & Front Desk Portal',
          desc: 'Patient intake, pre-consultation vitals recording, auto BMI calculation & OPD token assignment',
          icon: <ClipboardList size={24} />,
        };
      default:
        return {
          primary: '#2563eb',
          lightBg: '#eff6ff',
          accent: '#3b82f6',
          title: 'Clinical Portal',
          desc: 'Staff Gateway',
          icon: <HeartPulse size={24} />,
        };
    }
  };

  const theme = getRoleTheme();

  return (
    <div className="login-wrapper">
      {/* Background Decor */}
      <div className="login-bg-glow" />

      {/* Main Container */}
      <div className="login-container">
        {/* Top Branding Header */}
        <header className="login-brand-header">
          <div className="login-brand-top">
            <div className="login-logo-glow">
              <HeartPulse size={28} />
            </div>
            <div>
              <div className="login-badge-govt">
                <ShieldCheck size={13} />
                <span>GOVERNMENT OF INDIA • NATIONAL HEALTH MISSION (ABDM)</span>
              </div>
              <h1 className="login-title">
                ArogyaMitra <span style={{ color: '#38bdf8', fontWeight: 600, fontSize: '20px' }}>• Clinical Gateway</span>
              </h1>
              <p className="login-subtitle">
                Smart Primary Healthcare Facility & Clinical Operations Portal
              </p>
            </div>
          </div>

          <div className="login-security-pills">
            <span className="security-pill">
              <CheckCircle2 size={13} color="#22c55e" /> ABDM / Ayushman Bharat M1/M2/M3
            </span>
            <span className="security-pill">
              <Lock size={13} color="#38bdf8" /> 256-Bit Encrypted Healthcare Gateway
            </span>
            <span className="security-pill">
              <Activity size={13} color="#a855f7" /> 99.98% High-Availability Uptime
            </span>
          </div>
        </header>

        {/* Main Grid: Left is Form, Right is Demo Selector */}
        <div className="login-card-grid">
          {/* Left Column: Form & Role Tabs */}
          <div className="login-form-card">
            {/* Role Tab Bar */}
            <div className="role-tab-bar" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              <button
                type="button"
                className={`role-tab-btn ${selectedRole === 'DOCTOR' ? 'active-doctor' : ''}`}
                onClick={() => handleRoleSelect('DOCTOR')}
              >
                <Stethoscope size={18} />
                <div>
                  <div className="role-tab-label">Doctor</div>
                  <div className="role-tab-sub">OPD</div>
                </div>
              </button>

              <button
                type="button"
                className={`role-tab-btn ${selectedRole === 'PHARMACIST' ? 'active-pharmacist' : ''}`}
                onClick={() => handleRoleSelect('PHARMACIST')}
              >
                <Pill size={18} />
                <div>
                  <div className="role-tab-label">Pharmacy</div>
                  <div className="role-tab-sub">Stock</div>
                </div>
              </button>

              <button
                type="button"
                className={`role-tab-btn ${selectedRole === 'ADMIN' ? 'active-admin' : ''}`}
                onClick={() => handleRoleSelect('ADMIN')}
              >
                <Building2 size={18} />
                <div>
                  <div className="role-tab-label">Admin</div>
                  <div className="role-tab-sub">Facility</div>
                </div>
              </button>

              <button
                type="button"
                className={`role-tab-btn ${selectedRole === 'RECEPTIONIST' ? 'active-receptionist' : ''}`}
                onClick={() => handleRoleSelect('RECEPTIONIST')}
              >
                <ClipboardList size={18} />
                <div>
                  <div className="role-tab-label">Reception</div>
                  <div className="role-tab-sub">Front Desk</div>
                </div>
              </button>
            </div>

            {/* Dynamic Role Banner */}
            <div
              className="role-info-banner"
              style={{
                background: theme.lightBg,
                borderColor: `${theme.primary}33`,
              }}
            >
              <div
                className="role-info-icon"
                style={{ background: theme.primary, color: '#ffffff' }}
              >
                {theme.icon}
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                  {theme.title}
                </h3>
                <p style={{ fontSize: '12px', color: '#475569', marginTop: '2px', lineHeight: 1.4 }}>
                  {theme.desc}
                </p>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="login-error-alert">
                <AlertCircle size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Credential Form */}
            <form onSubmit={handleSubmit} className="login-form-inner">
              <div className="form-group-dash">
                <label className="form-label-dash">
                  <Mail size={15} style={{ color: theme.primary }} />
                  <span>Official Health Portal Email or Mobile ID</span>
                </label>
                <div className="input-with-icon">
                  <input
                    type="text"
                    required
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    placeholder="e.g. dr.verma@phc.gov.in or +91 98111 00101"
                    className="input-field-dash"
                  />
                </div>
              </div>

              <div className="form-group-dash">
                <label className="form-label-dash">
                  <Lock size={15} style={{ color: theme.primary }} />
                  <span>Clinical Password / Security PIN</span>
                </label>
                <div className="input-with-icon password-input-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter terminal PIN or password"
                    className="input-field-dash"
                  />
                  <button
                    type="button"
                    className="pwd-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-options-row">
                <label className="remember-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember this clinical terminal session</span>
                </label>
                <span className="pwd-recovery-link">Forgot Clinical PIN?</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-login-submit"
                style={{
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                }}
              >
                {loading ? (
                  <span className="loading-spinner-wrap">
                    <Activity className="animate-spin" size={18} /> Authenticating Clinical Staff...
                  </span>
                ) : (
                  <>
                    <span>Authenticate & Open {selectedRole} View</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: 1-Click Demo Profiles */}
          <div className="login-quick-card">
            <div className="quick-card-header">
              <div className="quick-badge">
                <Sparkles size={14} color="#f59e0b" />
                <span>1-CLICK DEMO ACCESS FOR EVALUATORS</span>
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
                Select a Staff Profile to Test
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b' }}>
                Instant login without entering passwords. Pre-loaded with live OPD patients, inventory records & analytics.
              </p>
            </div>

            <div className="quick-profiles-list">
              {DEMO_ACCOUNTS[selectedRole].map((acc) => (
                <div
                  key={acc.id}
                  className="quick-profile-item"
                  onClick={() => handleQuickLogin(acc)}
                >
                  <div
                    className="quick-avatar"
                    style={{ background: acc.avatarBg, color: '#ffffff' }}
                  >
                    {acc.avatarText}
                  </div>

                  <div className="quick-profile-info">
                    <div className="quick-name-row">
                      <h4 className="quick-name">{acc.name}</h4>
                      <span className="quick-badge-tag">{acc.badge}</span>
                    </div>
                    <div className="quick-spec">{acc.specialization}</div>
                    <div className="quick-phc-row">
                      <Building2 size={12} style={{ color: '#64748b' }} />
                      <span>{acc.phcName}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={loading}
                    className="quick-login-btn"
                    style={{ color: theme.primary, borderColor: `${theme.primary}44` }}
                  >
                    Login →
                  </button>
                </div>
              ))}
            </div>

            {/* Quick Switch Helper */}
            <div className="quick-help-box">
              <Award size={18} color={theme.primary} />
              <div>
                <strong>Role Switchable:</strong> You can switch roles at any time from the top navigation bar while testing.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="login-footer">
          <div>
            <strong>ArogyaMitra</strong> • Ministry of Health & Family Welfare Integration Portal
          </div>
          <div className="footer-links">
            <span>Clinical Support: 1800-180-1104</span>
            <span>•</span>
            <span>Privacy Policy</span>
            <span>•</span>
            <span>ABDM Standards v3.1</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
