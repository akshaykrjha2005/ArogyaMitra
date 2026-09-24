import React, { useState, useEffect } from 'react';
import {
  Home,
  HeartPulse,
  MapPin,
  Calendar,
  FileText,
  Bell,
  Smartphone,
  Maximize2,
  Globe,
  Pill,
  User,
  PhoneCall,
  PhoneForwarded,
  MessageCircle,
  History,
  Sparkles,
  Tent,
  Siren,
} from 'lucide-react';
import { PatientProfile, Notification, AppLanguage, getSavedLanguage, saveSelectedLanguage, NAV_TRANSLATIONS, ALL_INDIAN_LANGUAGES } from '@phc-connect/types';
import { apiClient } from './services/api';
import { HomeScreen } from './pages/HomeScreen';
import { PHCMapScreen } from './pages/PHCMapScreen';
import { DoctorListScreen } from './pages/DoctorListScreen';
import { BookAppointmentModal } from './pages/BookAppointmentModal';
import { MyAppointmentsScreen } from './pages/MyAppointmentsScreen';
import { MedicalRecordsScreen } from './pages/MedicalRecordsScreen';
import { MedicineCatalogScreen } from './pages/MedicineCatalogScreen';
import { PatientProfileScreen } from './pages/PatientProfileScreen';
import { MyComplaintsScreen } from './pages/MyComplaintsScreen';
import { CallServicesScreen } from './pages/CallServicesScreen';
import { HealthAssistantChatScreen } from './pages/HealthAssistantChatScreen';
import { PatientTimelineScreen } from './pages/PatientTimelineScreen';
import { SocialAwarenessScreen } from './pages/SocialAwarenessScreen';
import { HealthCampsScreen } from './pages/HealthCampsScreen';
import { EmergencyPreAlertScreen } from './pages/EmergencyPreAlertScreen';
import { FollowUpTrackingScreen } from './pages/FollowUpTrackingScreen';
import { AuthScreen } from './pages/AuthScreen';
import { EmergencyModal } from './components/EmergencyModal';
import { NotificationModal } from './components/NotificationModal';
import { LanguageSelectorModal } from './components/LanguageSelectorModal';

export const App: React.FC = () => {
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [activeTab, setActiveTab] = useState<string>('home');
  const [navigationExtra, setNavigationExtra] = useState<any>(null);
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth > 768);
  const [lang, setLang] = useState<AppLanguage>(() => getSavedLanguage());
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState<boolean>(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [emergencyReason, setEmergencyReason] = useState<string | undefined>(undefined);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentTime, setCurrentTime] = useState<string>('09:41');

  useEffect(() => {
    // Check localStorage for patient session
    const saved = localStorage.getItem('phc_patient_profile');
    if (saved) {
      try {
        setPatient(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }

    loadNotifications();

    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await apiClient.get('/notifications');
      if (res.success && res.notifications) {
        setNotifications(res.notifications);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleNavigate = (tab: string, extra?: any) => {
    setNavigationExtra(extra || null);
    setActiveTab(tab);
  };

  const handleEmergencyTrigger = (reason?: string) => {
    setEmergencyReason(reason);
    setIsEmergencyOpen(true);
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.patch('/notifications/all/read', {});
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('phc_patient_token');
    localStorage.removeItem('phc_patient_profile');
    setPatient(null);
  };

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      {/* Top Floating Viewport Control Bar */}
      <div className="viewport-toggle-bar">
        <button
          className={`toggle-btn ${isMobileFrame ? 'active' : ''}`}
          onClick={() => setIsMobileFrame(true)}
        >
          <Smartphone size={14} /> Mobile App View
        </button>
        <button
          className={`toggle-btn ${!isMobileFrame ? 'active' : ''}`}
          onClick={() => setIsMobileFrame(false)}
        >
          <Maximize2 size={14} /> Web View
        </button>
      </div>

      {/* Main Container */}
      <div className={`device-container ${isMobileFrame ? 'mobile-mode' : 'fullscreen-mode'}`}>
        <div className="screen-viewport">
          {/* Mobile Notch & Status Bar */}
          {isMobileFrame && (
            <>
              <div className="phone-notch" />
              <div className="phone-status-bar">
                <span>{currentTime}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>5G</span>
                  <span>100%</span>
                </div>
              </div>
            </>
          )}

          {/* App Header */}
          <header className="app-header">
            <div className="brand-badge" onClick={() => handleNavigate('home')} style={{ cursor: 'pointer' }}>
              <div className="brand-icon">
                <HeartPulse size={20} />
              </div>
              <div className="brand-text">
                <h1>ArogyaMitra</h1>
                <span>SMART HEALTHCARE</span>
              </div>
            </div>

            <div className="header-actions">
              <button
                className="lang-select-btn"
                onClick={() => setIsLanguageModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #cbd5e1',
                  borderRadius: '20px',
                  padding: '5px 10px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#0f766e',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  transition: 'all 0.15s ease',
                }}
                title="Change Language (22 Official Indian Languages & Regional Dialects)"
              >
                <Globe size={14} color="#0d9488" />
                <span>{ALL_INDIAN_LANGUAGES.find((l) => l.code === lang)?.nativeName || 'English'}</span>
              </button>

              <button
                className={`icon-badge-btn ${activeTab === 'assistant-chat' ? 'active-icon-btn' : ''}`}
                onClick={() => handleNavigate('assistant-chat')}
                title="Talk to Human Health Assistant (ASHA / CHO)"
                style={{
                  background: activeTab === 'assistant-chat' ? '#ccfbf1' : '#f8fafc',
                  color: activeTab === 'assistant-chat' ? '#0f766e' : '#334155',
                }}
              >
                <MessageCircle size={18} />
              </button>

              <button
                className={`icon-badge-btn ${activeTab === 'calls' ? 'active-icon-btn' : ''}`}
                onClick={() => handleNavigate('calls')}
                title="Call Services & Helplines"
                style={{
                  background: activeTab === 'calls' ? '#ccfbf1' : '#f8fafc',
                  color: activeTab === 'calls' ? '#0f766e' : '#334155',
                }}
              >
                <PhoneCall size={18} />
              </button>

              <button
                className={`icon-badge-btn ${activeTab === 'timeline' ? 'active-icon-btn' : ''}`}
                onClick={() => handleNavigate('timeline')}
                title="Care Timeline & Communication History"
                style={{
                  background: activeTab === 'timeline' ? '#ccfbf1' : '#f8fafc',
                  color: activeTab === 'timeline' ? '#0f766e' : '#334155',
                }}
              >
                <History size={18} />
              </button>

              <button
                className={`icon-badge-btn ${activeTab === 'awareness' ? 'active-icon-btn' : ''}`}
                onClick={() => handleNavigate('awareness')}
                title="Public Health Awareness & Vaccination Drives"
                style={{
                  background: activeTab === 'awareness' ? '#ccfbf1' : '#f8fafc',
                  color: activeTab === 'awareness' ? '#0f766e' : '#334155',
                }}
              >
                <Sparkles size={18} />
              </button>

              <button
                className={`icon-badge-btn ${activeTab === 'emergency-pre-alert' ? 'active-icon-btn' : ''}`}
                onClick={() => handleNavigate('emergency-pre-alert')}
                title="ASHA Emergency Pre-Alert"
                style={{
                  background: activeTab === 'emergency-pre-alert' ? '#fee2e2' : '#f8fafc',
                  color: activeTab === 'emergency-pre-alert' ? '#dc2626' : '#334155',
                }}
              >
                <Siren size={18} />
              </button>

              <button
                className={`icon-badge-btn ${activeTab === 'camps' ? 'active-icon-btn' : ''}`}
                onClick={() => handleNavigate('camps')}
                title="Free Community Health Camps & Passes"
                style={{
                  background: activeTab === 'camps' ? '#ccfbf1' : '#f8fafc',
                  color: activeTab === 'camps' ? '#0f766e' : '#334155',
                }}
              >
                <Tent size={18} />
              </button>

              <button
                className="icon-badge-btn"
                onClick={() => setIsNotifOpen(true)}
              >
                <Bell size={18} />
                {unreadNotifsCount > 0 && <span className="badge-dot" />}
              </button>

              {patient && (
                <button
                  className="icon-badge-btn"
                  onClick={() => handleNavigate('profile')}
                >
                  <User size={18} />
                </button>
              )}
            </div>
          </header>

          {/* Screen Routing */}
          <main className="app-content">
            {!patient ? (
              activeTab === 'awareness' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button
                    onClick={() => setActiveTab('home')}
                    style={{
                      alignSelf: 'flex-start',
                      background: 'none',
                      border: 'none',
                      color: '#0f766e',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 0',
                    }}
                  >
                    ← {lang === 'hi' ? 'लॉगिन स्क्रीन पर वापस जाएं' : 'Back to Login / Registration'}
                  </button>
                  <SocialAwarenessScreen
                    onNavigate={handleNavigate}
                    lang={lang}
                    initialCategory={navigationExtra?.category}
                    initialType={navigationExtra?.type}
                  />
                </div>
              ) : (
                <AuthScreen
                  lang={lang}
                  onBrowsePublicAwareness={() => setActiveTab('awareness')}
                  onSuccess={(newPat) => {
                    setPatient(newPat);
                    setActiveTab('home');
                  }}
                />
              )
            ) : (
              <>
                {activeTab === 'home' && (
                  <HomeScreen
                    patient={patient}
                    onNavigate={handleNavigate}
                    onOpenEmergency={handleEmergencyTrigger}
                    lang={lang}
                  />
                )}

                {activeTab === 'phcs' && (
                  <PHCMapScreen
                    onNavigate={handleNavigate}
                    lang={lang}
                  />
                )}

                {activeTab === 'doctors' && (
                  <DoctorListScreen
                    onNavigate={handleNavigate}
                    lang={lang}
                  />
                )}

                {activeTab === 'book' && (
                  <BookAppointmentModal
                    patient={patient}
                    initialData={navigationExtra}
                    onSuccess={() => handleNavigate('appointments')}
                    onCancel={() => handleNavigate('home')}
                    lang={lang}
                  />
                )}

                {activeTab === 'appointments' && (
                  <MyAppointmentsScreen
                    onNavigate={handleNavigate}
                    lang={lang}
                  />
                )}

                {activeTab === 'records' && (
                  <MedicalRecordsScreen
                    patient={patient}
                    lang={lang}
                  />
                )}

                {activeTab === 'medicines' && (
                  <MedicineCatalogScreen
                    onNavigate={handleNavigate}
                    lang={lang}
                  />
                )}

                {activeTab === 'profile' && (
                  <PatientProfileScreen
                    patient={patient}
                    onLogout={handleLogout}
                    lang={lang}
                  />
                )}

                {activeTab === 'complaints' && (
                  <MyComplaintsScreen
                    patient={patient}
                    onNavigate={handleNavigate}
                    lang={lang}
                    initialOpenNewModal={navigationExtra?.openNew || false}
                  />
                )}

                {activeTab === 'calls' && (
                  <CallServicesScreen
                    patient={patient}
                    onNavigate={handleNavigate}
                    lang={lang}
                    initialTab={navigationExtra?.initialTab || 'directory'}
                  />
                )}

                {activeTab === 'assistant-chat' && (
                  <HealthAssistantChatScreen
                    patient={patient}
                    onNavigate={handleNavigate}
                    lang={lang}
                    initialAssistantId={navigationExtra?.assistantId}
                  />
                )}

                {activeTab === 'timeline' && (
                  <PatientTimelineScreen
                    patient={patient}
                    onNavigate={handleNavigate}
                    lang={lang}
                    initialFilter={navigationExtra?.filter || 'ALL'}
                  />
                )}

                {activeTab === 'awareness' && (
                  <SocialAwarenessScreen
                    onNavigate={handleNavigate}
                    lang={lang}
                    initialCategory={navigationExtra?.category}
                    initialType={navigationExtra?.type}
                  />
                )}

                {activeTab === 'camps' && (
                  <HealthCampsScreen
                    patient={patient}
                    onNavigate={handleNavigate}
                    lang={lang}
                    initialCampId={navigationExtra?.campId}
                  />
                )}

                {activeTab === 'emergency-pre-alert' && (
                  <EmergencyPreAlertScreen
                    onBack={() => handleNavigate('home')}
                    lang={lang}
                    currentPatientId={patient?.id}
                    currentPatientName={patient?.fullName}
                  />
                )}

                {activeTab === 'followups' && (
                  <FollowUpTrackingScreen
                    patient={patient}
                    onNavigate={handleNavigate}
                    onBack={() => handleNavigate('home')}
                    lang={lang}
                    initialPatientId={navigationExtra?.patientId}
                  />
                )}
              </>
            )}
          </main>

          {/* Bottom Nav Bar */}
          {patient && (
            <nav className="bottom-nav">
              <button
                className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
                onClick={() => handleNavigate('home')}
              >
                <Home size={20} />
                <span>{(NAV_TRANSLATIONS[lang] || NAV_TRANSLATIONS['en']).home}</span>
              </button>

              <button
                className={`nav-item ${activeTab === 'assistant-chat' ? 'active' : ''}`}
                onClick={() => handleNavigate('assistant-chat')}
              >
                <HeartPulse size={20} />
                <span>{(NAV_TRANSLATIONS[lang] || NAV_TRANSLATIONS['en']).assistant}</span>
              </button>

              <button
                className={`nav-item ${activeTab === 'phcs' ? 'active' : ''}`}
                onClick={() => handleNavigate('phcs')}
              >
                <MapPin size={20} />
                <span>{(NAV_TRANSLATIONS[lang] || NAV_TRANSLATIONS['en']).nearby}</span>
              </button>

              <button
                className={`nav-item ${activeTab === 'appointments' || activeTab === 'book' ? 'active' : ''}`}
                onClick={() => handleNavigate('appointments')}
              >
                <Calendar size={20} />
                <span>{(NAV_TRANSLATIONS[lang] || NAV_TRANSLATIONS['en']).bookings}</span>
              </button>

              <button
                className={`nav-item ${activeTab === 'records' ? 'active' : ''}`}
                onClick={() => handleNavigate('records')}
              >
                <FileText size={20} />
                <span>{(NAV_TRANSLATIONS[lang] || NAV_TRANSLATIONS['en']).records}</span>
              </button>
            </nav>
          )}

          {/* Language Selector Modal */}
          <LanguageSelectorModal
            isOpen={isLanguageModalOpen}
            currentLang={lang}
            onSelectLanguage={(newLang) => {
              setLang(newLang);
              saveSelectedLanguage(newLang);
            }}
            onClose={() => setIsLanguageModalOpen(false)}
          />

          {/* Emergency Alert Modal */}
          <EmergencyModal
            isOpen={isEmergencyOpen}
            onClose={() => setIsEmergencyOpen(false)}
            reason={emergencyReason}
            onOpenPreAlert={() => handleNavigate('emergency-pre-alert')}
          />

          {/* Notification Drawer */}
          <NotificationModal
            isOpen={isNotifOpen}
            onClose={() => setIsNotifOpen(false)}
            notifications={notifications}
            onMarkAllRead={handleMarkAllRead}
            onNavigate={handleNavigate}
          />
        </div>
      </div>
    </>
  );
};
export default App;
