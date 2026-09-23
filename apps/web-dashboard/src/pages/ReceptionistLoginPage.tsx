import React, { useState } from 'react';
import {
  ClipboardList,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Activity,
  HeartPulse,
  HelpCircle,
  X,
  Phone,
} from 'lucide-react';
import { UserRole, User, ReceptionistProfile } from '@phc-connect/types';
import { apiClient } from '../services/api';

interface Props {
  onLoginSuccess: (
    user: User,
    profile: ReceptionistProfile,
    role: UserRole,
    token: string
  ) => void;
  onNavigateToGeneralLogin?: () => void;
}

interface DemoReceptionist {
  id: string;
  receptionistId: string;
  name: string;
  email: string;
  phone: string;
  counter: string;
  shift: string;
  phcName: string;
  phcId: string;
  avatarText: string;
}

const DEMO_RECEPTIONISTS: DemoReceptionist[] = [
  {
    id: 'rec-001',
    receptionistId: 'PHC-REC-001',
    name: 'Pooja Sharma',
    email: 'receptionist.karolbagh@phc.gov.in',
    phone: '+91 98444 00401',
    counter: 'Front Desk Counter 1',
    shift: 'Morning (08:00 AM - 02:00 PM)',
    phcName: 'Central Urban PHC - Karol Bagh',
    phcId: 'phc-001',
    avatarText: 'PS',
  },
  {
    id: 'rec-002',
    receptionistId: 'PHC-REC-002',
    name: 'Anjali Verma',
    email: 'receptionist.rohini@phc.gov.in',
    phone: '+91 98444 00402',
    counter: 'Registration Desk A',
    shift: 'General (09:00 AM - 05:00 PM)',
    phcName: 'Suburban CHC - Rohini',
    phcId: 'phc-002',
    avatarText: 'AV',
  },
  {
    id: 'rec-003',
    receptionistId: 'PHC-REC-003',
    name: 'Meena Rawat',
    email: 'receptionist.najafgarh@phc.gov.in',
    phone: '+91 98444 00403',
    counter: 'Rural Helpdesk 1',
    shift: 'Day Shift (09:00 AM - 04:00 PM)',
    phcName: 'Model Rural PHC - Najafgarh',
    phcId: 'phc-003',
    avatarText: 'MR',
  },
];

export const ReceptionistLoginPage: React.FC<Props> = ({
  onLoginSuccess,
  onNavigateToGeneralLogin,
}) => {
  const [usernameOrId, setUsernameOrId] = useState('PHC-REC-001');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Direct login submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!usernameOrId.trim()) {
      setErrorMsg('Please enter your Receptionist ID or registered Username.');
      return;
    }

    if (!password.trim()) {
      setErrorMsg('Please enter your Terminal PIN / Password.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      const isEmail = usernameOrId.includes('@');
      const isPhone = !isEmail && /^\+?[\d\s-]{10,}$/.test(usernameOrId.trim());

      const payload: any = {
        role: 'RECEPTIONIST' as UserRole,
      };

      if (isEmail) {
        payload.email = usernameOrId.trim();
      } else if (isPhone) {
        payload.phone = usernameOrId.trim();
      } else {
        payload.receptionistId = usernameOrId.trim();
        payload.username = usernameOrId.trim();
      }

      const res = await apiClient.post('/auth/login', payload);

      if (res.success && res.token) {
        localStorage.setItem('phc_staff_token', res.token);
        localStorage.setItem('phc_staff_user', JSON.stringify(res.user));
        localStorage.setItem('phc_staff_profile', JSON.stringify(res.profile));
        localStorage.setItem('phc_staff_role', 'RECEPTIONIST');

        onLoginSuccess(res.user, res.profile, 'RECEPTIONIST', res.token);
      } else {
        setErrorMsg(res.message || 'Incorrect credentials. Please verify your Receptionist ID and password.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication service unreachable. Please ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Quick Login
  const handleQuickLogin = async (acc: DemoReceptionist) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      setUsernameOrId(acc.receptionistId);

      const res = await apiClient.post('/auth/login', {
        receptionistId: acc.receptionistId,
        role: 'RECEPTIONIST',
      });

      if (res.success && res.token) {
        localStorage.setItem('phc_staff_token', res.token);
        localStorage.setItem('phc_staff_user', JSON.stringify(res.user));
        localStorage.setItem('phc_staff_profile', JSON.stringify(res.profile));
        localStorage.setItem('phc_staff_role', 'RECEPTIONIST');

        onLoginSuccess(res.user, res.profile, 'RECEPTIONIST', res.token);
      } else {
        setErrorMsg(res.message || 'Quick login failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to authenticate demo receptionist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      {/* Background Decor */}
      <div className="login-bg-glow" style={{ background: 'radial-gradient(circle, rgba(2, 132, 199, 0.18) 0%, rgba(14, 165, 233, 0.08) 50%, transparent 70%)' }} />

      {/* Main Container */}
      <div className="login-container">
        {/* Top Branding Header */}
        <header className="login-brand-header">
          <div className="login-brand-top">
            <div className="login-logo-glow" style={{ background: 'linear-gradient(135deg, #0284c7, #0d9488)' }}>
              <ClipboardList size={28} />
            </div>
            <div>
              <div className="login-badge-govt" style={{ background: 'rgba(2, 132, 199, 0.15)', borderColor: 'rgba(2, 132, 199, 0.35)', color: '#38bdf8' }}>
                <ShieldCheck size={13} />
                <span>GOVERNMENT OF INDIA • NATIONAL HEALTH MISSION (ABDM)</span>
              </div>
              <h1 className="login-title">
                ArogyaMitra <span style={{ color: '#38bdf8', fontWeight: 600, fontSize: '20px' }}>• Receptionist Desk</span>
              </h1>
              <p className="login-subtitle">
                Patient Registration, Pre-Consultation Check-Up & Front Desk Triage Portal
              </p>
            </div>
          </div>

          <div className="login-security-pills">
            <span className="security-pill">
              <CheckCircle2 size={13} color="#22c55e" /> Front Desk Fast-Track Entry
            </span>
            <span className="security-pill">
              <Lock size={13} color="#38bdf8" /> 256-Bit Encrypted Healthcare Gateway
            </span>
            <span className="security-pill">
              <Activity size={13} color="#0284c7" /> Live OPD Queue Synchronization
            </span>
          </div>
        </header>

        {/* Main Grid: Form Left, Quick Profiles Right */}
        <div className="login-card-grid">
          {/* Left: Receptionist Form */}
          <div className="login-form-card">
            {/* Header Banner */}
            <div
              className="role-info-banner"
              style={{
                background: '#f0f9ff',
                borderColor: '#bae6fd',
              }}
            >
              <div
                className="role-info-icon"
                style={{ background: '#0284c7', color: '#ffffff' }}
              >
                <ClipboardList size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                  Receptionist & Front Desk Portal
                </h3>
                <p style={{ fontSize: '12px', color: '#475569', marginTop: '2px', lineHeight: 1.4 }}>
                  Register walk-in patients, measure vitals, calculate BMI, and prepare pre-consultation reports for OPD doctors.
                </p>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="login-error-alert" role="alert">
                <AlertCircle size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="login-form-inner">
              <div className="form-group-dash">
                <label className="form-label-dash" htmlFor="rec-username">
                  <UserIcon size={15} style={{ color: '#0284c7' }} />
                  <span>Receptionist ID / Official Username *</span>
                </label>
                <div className="input-with-icon">
                  <input
                    id="rec-username"
                    type="text"
                    required
                    value={usernameOrId}
                    onChange={(e) => setUsernameOrId(e.target.value)}
                    placeholder="e.g. PHC-REC-001 or receptionist.karolbagh@phc.gov.in"
                    className="input-field-dash"
                    style={{ borderColor: !usernameOrId.trim() && errorMsg ? '#ef4444' : undefined }}
                  />
                </div>
              </div>

              <div className="form-group-dash">
                <label className="form-label-dash" htmlFor="rec-password">
                  <Lock size={15} style={{ color: '#0284c7' }} />
                  <span>Front Desk Password / PIN *</span>
                </label>
                <div className="input-with-icon password-input-wrap">
                  <input
                    id="rec-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter terminal password"
                    className="input-field-dash"
                    style={{ borderColor: !password.trim() && errorMsg ? '#ef4444' : undefined }}
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
                  <span>Remember this front desk terminal</span>
                </label>
                <button
                  type="button"
                  className="pwd-recovery-link"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0284c7', fontWeight: 600 }}
                  onClick={() => setShowForgotModal(true)}
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-login-submit"
                style={{
                  background: 'linear-gradient(135deg, #0284c7, #0284c7dd)',
                }}
              >
                {loading ? (
                  <span className="loading-spinner-wrap">
                    <Activity className="animate-spin" size={18} /> Authenticating Receptionist...
                  </span>
                ) : (
                  <>
                    <span>Authenticate & Open Receptionist Desk</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              {onNavigateToGeneralLogin && (
                <button
                  type="button"
                  onClick={onNavigateToGeneralLogin}
                  className="btn-switch-login"
                  style={{
                    background: 'transparent',
                    border: '1px solid #e2e8f0',
                    color: '#64748b',
                    padding: '8px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginTop: '4px',
                  }}
                >
                  ← Return to Doctor / Pharmacist / Admin Portal
                </button>
              )}
            </form>
          </div>

          {/* Right: 1-Click Demo Profiles */}
          <div className="login-quick-card">
            <div className="quick-card-header">
              <div className="quick-badge" style={{ background: '#e0f2fe', borderColor: '#bae6fd', color: '#0369a1' }}>
                <Sparkles size={14} color="#0284c7" />
                <span>1-CLICK RECEPTIONIST DEMO ACCESS</span>
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
                Select Reception Desk Profile
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b' }}>
                Instant login without manual typing. Pre-loaded with live OPD facility rosters & patient records.
              </p>
            </div>

            <div className="quick-profiles-list">
              {DEMO_RECEPTIONISTS.map((acc) => (
                <div
                  key={acc.id}
                  className="quick-profile-item"
                  onClick={() => handleQuickLogin(acc)}
                >
                  <div
                    className="quick-avatar"
                    style={{ background: '#0284c7', color: '#ffffff' }}
                  >
                    {acc.avatarText}
                  </div>

                  <div className="quick-profile-info">
                    <div className="quick-name-row">
                      <h4 className="quick-name">{acc.name}</h4>
                      <span className="quick-badge-tag" style={{ background: '#e0f2fe', color: '#0369a1' }}>{acc.receptionistId}</span>
                    </div>
                    <div className="quick-spec">{acc.counter} • {acc.shift}</div>
                    <div className="quick-phc-row">
                      <Building2 size={12} style={{ color: '#64748b' }} />
                      <span>{acc.phcName}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={loading}
                    className="quick-login-btn"
                    style={{ color: '#0284c7', borderColor: '#0284c744' }}
                  >
                    Login →
                  </button>
                </div>
              ))}
            </div>

            <div className="quick-help-box" style={{ background: '#f0f9ff', borderColor: '#bae6fd', color: '#0369a1' }}>
              <HelpCircle size={18} color="#0284c7" />
              <div>
                <strong>Front Desk Fast-Path:</strong> Receptionists can record pre-consultation vital signs, height, weight, and automated BMI calculations for all incoming OPD patients.
              </div>
            </div>
          </div>
        </div>

        {/* Forgot Password Modal */}
        {showForgotModal && (
          <div className="modal-overlay" onClick={() => setShowForgotModal(false)}>
            <div className="modal-card" style={{ maxWidth: '440px', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <HelpCircle size={20} color="#0284c7" />
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Terminal PIN Assistance</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
                >
                  <X size={18} />
                </button>
              </div>

              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, marginBottom: '16px' }}>
                For security compliance under National Health Mission guidelines, terminal PIN resets must be authorized by your PHC Medical Officer In-Charge (MOIC) or IT Administrator.
              </p>

              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a', fontWeight: 700 }}>
                  <Phone size={14} color="#0284c7" /> Facility IT Helpdesk
                </div>
                <div style={{ color: '#64748b', marginTop: '4px' }}>
                  Toll-Free: <strong>1800-180-1104</strong> (Ext: 201)
                </div>
                <div style={{ color: '#64748b', marginTop: '2px' }}>
                  Demo Terminal PIN: <strong>password123</strong>
                </div>
              </div>

              <button
                type="button"
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', background: '#0284c7' }}
                onClick={() => setShowForgotModal(false)}
              >
                Understood, Return to Login
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="login-footer">
          <div>
            <strong>ArogyaMitra</strong> • Ministry of Health & Family Welfare Front Desk Terminal
          </div>
          <div className="footer-links">
            <span>Helpdesk: 1800-180-1104</span>
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
