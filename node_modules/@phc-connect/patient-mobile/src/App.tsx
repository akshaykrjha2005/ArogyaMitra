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
} from 'lucide-react';
import { PatientProfile, Notification, AppLanguage } from '@phc-connect/types';
import { apiClient } from './services/api';
import { HomeScreen } from './pages/HomeScreen';
import { SymptomChatbotScreen } from './pages/SymptomChatbotScreen';
import { PHCMapScreen } from './pages/PHCMapScreen';
import { DoctorListScreen } from './pages/DoctorListScreen';
import { BookAppointmentModal } from './pages/BookAppointmentModal';
import { MyAppointmentsScreen } from './pages/MyAppointmentsScreen';
import { MedicalRecordsScreen } from './pages/MedicalRecordsScreen';
import { MedicineCatalogScreen } from './pages/MedicineCatalogScreen';
import { PatientProfileScreen } from './pages/PatientProfileScreen';
import { AuthScreen } from './pages/AuthScreen';
import { EmergencyModal } from './components/EmergencyModal';
import { NotificationModal } from './components/NotificationModal';

const navLabels: Record<AppLanguage, { home: string; triage: string; nearby: string; bookings: string; records: string }> = {
  en: { home: 'Home', triage: 'Triage', nearby: 'Nearby', bookings: 'Bookings', records: 'Records' },
  hi: { home: 'होम', triage: 'जांच', nearby: 'नजदीकी', bookings: 'बुकिंग', records: 'रिकॉर्ड्स' },
  kn: { home: 'ಮುಖಪುಟ', triage: 'ತಪಾಸಣೆ', nearby: 'ಹತ್ತಿರದ', bookings: 'ಬುಕಿಂಗ್', records: 'ದಾಖಲೆಗಳು' },
};

export const App: React.FC = () => {
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [activeTab, setActiveTab] = useState<string>('home');
  const [navigationExtra, setNavigationExtra] = useState<any>(null);
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(true);
  const [lang, setLang] = useState<AppLanguage>('en');
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
    } else {
      // Default to demo patient 1
      loadDefaultPatient();
    }

    loadNotifications();

    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const loadDefaultPatient = async () => {
    try {
      const res = await apiClient.get('/patients/pat-0001');
      if (res.success && res.patient) {
        setPatient(res.patient);
        localStorage.setItem('phc_patient_profile', JSON.stringify(res.patient));
      }
    } catch (e) {
      console.error(e);
    }
  };

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
              <div className="lang-switcher-pill">
                <button
                  className={`lang-option ${lang === 'en' ? 'active' : ''}`}
                  onClick={() => setLang('en')}
                  title="English"
                >
                  EN
                </button>
                <button
                  className={`lang-option ${lang === 'hi' ? 'active' : ''}`}
                  onClick={() => setLang('hi')}
                  title="हिन्दी (Hindi)"
                >
                  हिन्दी
                </button>
                <button
                  className={`lang-option ${lang === 'kn' ? 'active' : ''}`}
                  onClick={() => setLang('kn')}
                  title="ಕನ್ನಡ (Kannada)"
                >
                  ಕನ್ನಡ
                </button>
              </div>

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
              <AuthScreen
                lang={lang}
                onSuccess={(newPat) => {
                  setPatient(newPat);
                  setActiveTab('home');
                }}
              />
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

                {activeTab === 'symptoms' && (
                  <SymptomChatbotScreen
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
                <span>{navLabels[lang].home}</span>
              </button>

              <button
                className={`nav-item ${activeTab === 'symptoms' ? 'active' : ''}`}
                onClick={() => handleNavigate('symptoms')}
              >
                <HeartPulse size={20} />
                <span>{navLabels[lang].triage}</span>
              </button>

              <button
                className={`nav-item ${activeTab === 'phcs' ? 'active' : ''}`}
                onClick={() => handleNavigate('phcs')}
              >
                <MapPin size={20} />
                <span>{navLabels[lang].nearby}</span>
              </button>

              <button
                className={`nav-item ${activeTab === 'appointments' || activeTab === 'book' ? 'active' : ''}`}
                onClick={() => handleNavigate('appointments')}
              >
                <Calendar size={20} />
                <span>{navLabels[lang].bookings}</span>
              </button>

              <button
                className={`nav-item ${activeTab === 'records' ? 'active' : ''}`}
                onClick={() => handleNavigate('records')}
              >
                <FileText size={20} />
                <span>{navLabels[lang].records}</span>
              </button>
            </nav>
          )}

          {/* Emergency Alert Modal */}
          <EmergencyModal
            isOpen={isEmergencyOpen}
            onClose={() => setIsEmergencyOpen(false)}
            reason={emergencyReason}
          />

          {/* Notification Drawer */}
          <NotificationModal
            isOpen={isNotifOpen}
            onClose={() => setIsNotifOpen(false)}
            notifications={notifications}
            onMarkAllRead={handleMarkAllRead}
          />
        </div>
      </div>
    </>
  );
};
export default App;
