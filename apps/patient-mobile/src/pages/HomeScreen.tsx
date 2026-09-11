import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  MapPin,
  Stethoscope,
  Pill,
  Calendar,
  FileText,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  AlertTriangle,
  PhoneCall,
  Activity,
} from 'lucide-react';
import { PatientProfile, Appointment, PHC } from '@phc-connect/types';
import { apiClient } from '../services/api';

interface Props {
  patient: PatientProfile | null;
  onNavigate: (tab: string, extra?: any) => void;
  onOpenEmergency: () => void;
  lang: 'en' | 'hi' | 'kn';
}

export const HomeScreen: React.FC<Props> = ({ patient, onNavigate, onOpenEmergency, lang }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [nearbyPHCs, setNearbyPHCs] = useState<PHC[]>([]);
  const [loading, setLoading] = useState(true);

  const t = {
    en: {
      greeting: `Hello, ${patient?.fullName?.split(' ')[0] || 'Patient'} 👋`,
      question: 'How are you feeling today?',
      triageCardTitle: 'AI Symptom Assessment & Triage',
      triageCardDesc: 'Describe your symptoms, upload photos of rashes or wounds, and receive immediate preliminary triage guidance.',
      triageBtn: 'Start Assessment Now',
      quickActions: 'Quick Health Services',
      findPHC: 'Nearby PHCs',
      findPHCDesc: 'Find closest health centre & directions',
      findDoc: 'Find Doctor',
      findDocDesc: 'Check live doctor availability',
      checkMeds: 'Medicine Stock',
      checkMedsDesc: 'Verify medicine availability at PHC',
      bookApt: 'Book Appointment',
      bookAptDesc: 'Select doctor & instant slot',
      myApt: 'My Appointments',
      myAptDesc: 'View tokens & active queues',
      myRecords: 'Medical Records',
      myRecordsDesc: 'Doctor prescriptions & history',
      activeAptTitle: 'Your Active Appointment',
      tokenBadge: 'Token #',
      viewAll: 'View All',
      emergencyStrip: 'Emergency Medical Help (108 / 112)',
      advisoryTitle: 'Primary Health Advisory',
      advisoryDesc: 'Monsoon season: Free dengue screening and ORS packets available at all Delhi PHCs.',
    },
    hi: {
      greeting: `नमस्ते, ${patient?.fullName?.split(' ')[0] || 'मरीज'} 👋`,
      question: 'आज आप कैसा महसूस कर रहे हैं?',
      triageCardTitle: 'एआई लक्षण मूल्यांकन और ट्राइएज',
      triageCardDesc: 'अपने लक्षण बताएं, घाव या दाने की फोटो अपलोड करें और तुरंत उचित चिकित्सा मार्गदर्शन प्राप्त करें।',
      triageBtn: 'मूल्यांकन शुरू करें',
      quickActions: 'स्वास्थ्य सेवाएं',
      findPHC: 'नजदीकी पीएचसी',
      findPHCDesc: 'निकटतम स्वास्थ्य केंद्र खोजें',
      findDoc: 'डॉक्टर खोजें',
      findDocDesc: 'उपलब्ध डॉक्टरों की स्थिति देखें',
      checkMeds: 'दवा की उपलब्धता',
      checkMedsDesc: 'पीएचसी पर दवाओं का स्टॉक जांचें',
      bookApt: 'अपॉइंटमेंट बुक करें',
      bookAptDesc: 'डॉक्टर और समय चुनें',
      myApt: 'मेरी अपॉइंटमेंट्स',
      myAptDesc: 'टोकन और स्थिति देखें',
      myRecords: 'मेडिकल रिकॉर्ड',
      myRecordsDesc: 'पर्चे और जांच रिपोर्ट',
      activeAptTitle: 'आपकी सक्रिय अपॉइंटमेंट',
      tokenBadge: 'टोकन #',
      viewAll: 'सभी देखें',
      emergencyStrip: 'आपातकालीन चिकित्सा सहायता (108 / 112)',
      advisoryTitle: 'प्राथमिक स्वास्थ्य सलाह',
      advisoryDesc: 'मानसून मौसम: सभी पीएचसी केंद्रों पर मुफ्त डेंगू जांच और ओआरएस पैकेट उपलब्ध हैं।',
    },
    kn: {
      greeting: `ನಮಸ್ಕಾರ, ${patient?.fullName?.split(' ')[0] || 'ರೋಗಿ'} 👋`,
      question: 'ಇಂದು ನಿಮ್ಮ ಆರೋಗ್ಯ ಹೇಗಿದೆ?',
      triageCardTitle: 'ಎಐ ರೋಗಲಕ್ಷಣ ಮೌಲ್ಯಮಾಪನ ಮತ್ತು ಟ್ರಯೇಜ್',
      triageCardDesc: 'ನಿಮ್ಮ ರೋಗಲಕ್ಷಣಗಳನ್ನು ವಿವರಿಸಿ, ಗಾಯ ಅಥವಾ ದದ್ದುಗಳ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ ಮತ್ತು ತಕ್ಷಣ ಪ್ರಾಥಮಿಕ ಸಲಹೆ ಪಡೆಯಿರಿ.',
      triageBtn: 'ಮೌಲ್ಯಮಾಪನ ಪ್ರಾರಂಭಿಸಿ',
      quickActions: 'ತ್ವರಿತ ಆರೋಗ್ಯ ಸೇವೆಗಳು',
      findPHC: 'ಹತ್ತಿರದ ಪಿಹೆಚ್‌ಸಿ (PHC)',
      findPHCDesc: 'ಹತ್ತಿರದ ಆರೋಗ್ಯ ಕೇಂದ್ರ ಮತ್ತು ಮಾರ್ಗ',
      findDoc: 'ವೈದ್ಯರನ್ನು ಹುಡುಕಿ',
      findDocDesc: 'ಲಭ್ಯವಿರುವ ವೈದ್ಯರ ವಿವರಗಳನ್ನು ನೋಡಿ',
      checkMeds: 'ಔಷಧಿ ದಾಸ್ತಾನು',
      checkMedsDesc: 'ಪಿಹೆಚ್‌ಸಿಯಲ್ಲಿ ಔಷಧ ಲಭ್ಯತೆ ಪರಿಶೀಲಿಸಿ',
      bookApt: 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬುಕ್ ಮಾಡಿ',
      bookAptDesc: 'ವೈದ್ಯರು ಮತ್ತು ಸಮಯ ಆಯ್ಕೆಮಾಡಿ',
      myApt: 'ನನ್ನ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳು',
      myAptDesc: 'ಟೋಕನ್ ಮತ್ತು ಸರತಿ ಸಾಲು ವೀಕ್ಷಿಸಿ',
      myRecords: 'ವೈದ್ಯಕೀಯ ದಾಖಲೆಗಳು',
      myRecordsDesc: 'ವೈದ್ಯರ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಮತ್ತು ಇತಿಹಾಸ',
      activeAptTitle: 'ನಿಮ್ಮ ಸಕ್ರಿಯ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್',
      tokenBadge: 'ಟೋಕನ್ #',
      viewAll: 'ಎಲ್ಲವನ್ನೂ ವೀಕ್ಷಿಸಿ',
      emergencyStrip: 'ತುರ್ತು ವೈದ್ಯಕೀಯ ನೆರವು (108 / 112)',
      advisoryTitle: 'ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಸಲಹೆ',
      advisoryDesc: 'ಮಳೆಗಾಲದ ಮುನ್ನೆಚ್ಚರಿಕೆ: ಎಲ್ಲಾ ಪಿಹೆಚ್‌ಸಿ ಕೇಂದ್ರಗಳಲ್ಲಿ ಉಚಿತ ಡೆಂಗ್ಯೂ ತಪಾಸಣೆ ಮತ್ತು ಒಆರ್‌ಎಸ್ (ORS) ಲಭ್ಯವಿದೆ.',
    },
  }[lang];

  useEffect(() => {
    loadHomeData();
  }, [patient]);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      const [aptRes, phcRes] = await Promise.all([
        apiClient.get('/appointments', { patientId: patient?.id || 'pat-0001' }),
        apiClient.get('/phcs/nearby', { lat: patient?.latitude || 28.6139, lon: patient?.longitude || 77.209 }),
      ]);

      if (aptRes.success) {
        setAppointments(aptRes.appointments || []);
      }
      if (phcRes.success && phcRes.recommendations) {
        setNearbyPHCs(phcRes.recommendations.map((r: any) => r.phc).slice(0, 2));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const activeAppointment = appointments.find((a) => a.status !== 'Completed' && a.status !== 'Cancelled');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Patient Header Greeting */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>{t.greeting}</h2>
          <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>{t.question}</p>
        </div>
        <div style={{
          background: '#e0f2f1',
          color: '#00796b',
          padding: '4px 10px',
          borderRadius: '9999px',
          fontSize: '11px',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          <Activity size={14} />
          {patient?.patientId || 'PHC-PAT-2026-0001'}
        </div>
      </div>

      {/* Emergency Strip */}
      <div
        onClick={onOpenEmergency}
        style={{
          background: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: '14px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={18} color="#dc2626" />
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#b91c1c' }}>
            {t.emergencyStrip}
          </span>
        </div>
        <PhoneCall size={16} color="#dc2626" />
      </div>

      {/* AI Symptom Assessment Hero Banner */}
      <div className="triage-banner">
        <div className="banner-pill">
          <Sparkles size={13} />
          <span>AI Clinical Triage</span>
        </div>
        <h2>{t.triageCardTitle}</h2>
        <p>{t.triageCardDesc}</p>
        <button
          className="btn-start-triage"
          onClick={() => onNavigate('symptoms')}
        >
          <HeartPulse size={16} />
          {t.triageBtn}
        </button>
      </div>

      {/* Active Appointment Preview Card */}
      {activeAppointment && (
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, #ffffff, #f0f7ff)',
            border: '1px solid #bfdbfe',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#1976d2', textTransform: 'uppercase' }}>
              {t.activeAptTitle}
            </span>
            <span className="badge badge-medium">
              {activeAppointment.status}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>
                {activeAppointment.doctorName}
              </h4>
              <p style={{ fontSize: '12px', color: '#64748b' }}>
                {activeAppointment.phcName}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', fontSize: '11px', color: '#475569' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Calendar size={13} color="#1976d2" /> {activeAppointment.date}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Clock size={13} color="#1976d2" /> {activeAppointment.timeSlot}
                </span>
              </div>
            </div>
            <div style={{
              background: '#1976d2',
              color: 'white',
              borderRadius: '12px',
              padding: '8px 12px',
              textAlign: 'center',
            }}>
              <span style={{ fontSize: '10px', display: 'block', opacity: 0.85 }}>Token</span>
              <strong style={{ fontSize: '18px', fontWeight: 800 }}>#{activeAppointment.tokenNumber}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Quick Services Grid */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>{t.quickActions}</h3>
        </div>

        <div className="quick-grid">
          <div className="quick-card" onClick={() => onNavigate('phcs')}>
            <div className="quick-icon-wrapper" style={{ background: '#e3f2fd' }}>
              <MapPin size={20} color="#1976d2" />
            </div>
            <div>
              <h4>{t.findPHC}</h4>
              <p>{t.findPHCDesc}</p>
            </div>
          </div>

          <div className="quick-card" onClick={() => onNavigate('doctors')}>
            <div className="quick-icon-wrapper" style={{ background: '#e0f2f1' }}>
              <Stethoscope size={20} color="#00897b" />
            </div>
            <div>
              <h4>{t.findDoc}</h4>
              <p>{t.findDocDesc}</p>
            </div>
          </div>

          <div className="quick-card" onClick={() => onNavigate('medicines')}>
            <div className="quick-icon-wrapper" style={{ background: '#fff3e0' }}>
              <Pill size={20} color="#f57c00" />
            </div>
            <div>
              <h4>{t.checkMeds}</h4>
              <p>{t.checkMedsDesc}</p>
            </div>
          </div>

          <div className="quick-card" onClick={() => onNavigate('book')}>
            <div className="quick-icon-wrapper" style={{ background: '#ede7f6' }}>
              <Calendar size={20} color="#673ab7" />
            </div>
            <div>
              <h4>{t.bookApt}</h4>
              <p>{t.bookAptDesc}</p>
            </div>
          </div>

          <div className="quick-card" onClick={() => onNavigate('appointments')}>
            <div className="quick-icon-wrapper" style={{ background: '#fce4ec' }}>
              <Clock size={20} color="#d81b60" />
            </div>
            <div>
              <h4>{t.myApt}</h4>
              <p>{t.myAptDesc}</p>
            </div>
          </div>

          <div className="quick-card" onClick={() => onNavigate('records')}>
            <div className="quick-icon-wrapper" style={{ background: '#e8f5e9' }}>
              <FileText size={20} color="#2e7d32" />
            </div>
            <div>
              <h4>{t.myRecords}</h4>
              <p>{t.myRecordsDesc}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Advisory Banner */}
      <div style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '14px',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          background: '#dbeafe',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <AlertTriangle size={18} color="#1d4ed8" />
        </div>
        <div>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '2px' }}>
            {t.advisoryTitle}
          </h4>
          <p style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.4' }}>
            {t.advisoryDesc}
          </p>
        </div>
      </div>
    </div>
  );
};
