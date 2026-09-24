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
  Phone,
  MessageSquare,
  Activity,
  AlertCircle,
  History,
  Tent,
} from 'lucide-react';
import { PatientProfile, Appointment, PHC, AppLanguage, resolveTranslationObject } from '@phc-connect/types';
import { apiClient } from '../services/api';

interface Props {
  patient: PatientProfile | null;
  onNavigate: (tab: string, extra?: any) => void;
  onOpenEmergency: () => void;
  lang: AppLanguage;
}

export const HomeScreen: React.FC<Props> = ({ patient, onNavigate, onOpenEmergency, lang }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [nearbyPHCs, setNearbyPHCs] = useState<PHC[]>([]);
  const [loading, setLoading] = useState(true);

  const t = resolveTranslationObject(lang, {
    en: {
      greeting: `Hello, ${patient?.fullName?.split(' ')[0] || 'Patient'} 👋`,
      question: 'How are you feeling today?',
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
      complaints: 'Grievances / Complaints',
      complaintsDesc: 'File & track citizen complaints',
      callServices: 'Call & Helplines',
      callServicesDesc: 'Direct dial & request callback',
      careTimeline: 'Care Timeline & History',
      careTimelineDesc: 'Calls, chats, tickets & visits',
      socialAwareness: 'Health Awareness & Drives',
      socialAwarenessDesc: 'Vaccination drives, posters, reels & alerts',
      healthCamps: 'Free Health Camps',
      healthCampsDesc: 'Eye, dental, maternal & NCD screening camps',
      followUpTracking: 'Referral Follow-up',
      followUpTrackingDesc: 'ASHA visits, hospital status & timeline',
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
      complaints: 'शिकायत व निवारण',
      complaintsDesc: 'शिकायत दर्ज करें व स्थिति देखें',
      callServices: 'कॉल व हेल्पलाइन',
      callServicesDesc: 'सीधा डायल व कॉल-बैक अनुरोध',
      careTimeline: 'देखभाल समयरेखा व इतिहास',
      careTimelineDesc: 'कॉल, चैट, टिकट व डॉक्टर परामर्श',
      socialAwareness: 'स्वास्थ्य जागरूकता व अभियान',
      socialAwarenessDesc: 'टीकाकरण अभियान, पोस्टर, वीडियो व अलर्ट',
      healthCamps: 'मुफ्त स्वास्थ्य शिविर',
      healthCampsDesc: 'नेत्र, दंत, मातृ एवं गैर-संचारी रोग जांच शिविर',
      followUpTracking: 'रेफरल फॉलो-अप ट्रैकिंग',
      followUpTrackingDesc: 'आशा विजिट, अस्पताल स्थिति व समयरेखा',
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
      complaints: 'ದೂರು ಮತ್ತು ಪರಿಹಾರ',
      complaintsDesc: 'ದೂರು ಸಲ್ಲಿಸಿ ಮತ್ತು ಸ್ಥಿತಿ ನೋಡಿ',
      callServices: 'ಕರೆ ಮತ್ತು ಸಹಾಯವಾಣಿ',
      callServicesDesc: 'ನೇರ ಕರೆ ಮತ್ತು ಕಾಲ್-ಬ್ಯಾಕ್ ವಿನಂತಿ',
      careTimeline: 'ಆರೋಗ್ಯ ಇತಿಹಾಸ ಮತ್ತು ಟೈಮ್‌ಲೈನ್',
      careTimelineDesc: 'ಕರೆಗಳು, ಚಾಟ್‌ಗಳು ಮತ್ತು ವೈದ್ಯರ ಭೇಟಿ',
      healthCamps: 'ಉಚಿತ ಆರೋಗ್ಯ ಶಿಬಿರಗಳು',
      healthCampsDesc: 'ಕಣ್ಣು, ದಂತ, ತಾಯಿ ಮತ್ತು ಮಗು ತಪಾಸಣೆ ಶಿಬಿರಗಳು',
      activeAptTitle: 'ನಿಮ್ಮ ಸಕ್ರಿಯ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್',
      tokenBadge: 'ಟೋಕನ್ #',
      viewAll: 'ಎಲ್ಲವನ್ನೂ ವೀಕ್ಷಿಸಿ',
      emergencyStrip: 'ತುರ್ತು ವೈದ್ಯಕೀಯ ನೆರವು (108 / 112)',
      advisoryTitle: 'ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಸಲಹೆ',
      advisoryDesc: 'ಮಳೆಗಾಲದ ಮುನ್ನೆಚ್ಚರಿಕೆ: ಎಲ್ಲಾ ಪಿಹೆಚ್‌ಸಿ ಕೇಂದ್ರಗಳಲ್ಲಿ ಉಚಿತ ಡೆಂಗ್ಯೂ ತಪಾಸಣೆ ಮತ್ತು ಒಆರ್‌ಎಸ್ (ORS) ಲಭ್ಯವಿದೆ.',
    },
  });

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


      {/* Real-Time Human Health Assistant Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f766e, #0d9488)',
          borderRadius: '16px',
          padding: '16px',
          color: '#ffffff',
          boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '3px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 700,
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }} />
            <span>Human Health Worker • Real-Time</span>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#ccfbf1' }}>
            ⚡ Avg wait &lt; 1 min
          </span>
        </div>

        <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 4px 0' }}>
          Talk to Health Assistant (ASHA / ANM / CHO)
        </h3>
        <p style={{ fontSize: '12px', color: '#ccfbf1', margin: '0 0 12px 0', lineHeight: 1.4 }}>
          Connect with real human healthcare staff for maternal advice, lab reports, medicine queries & WebRTC audio calls.
        </p>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => onNavigate('assistant-chat')}
            style={{
              flex: 1,
              background: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: 800,
              color: '#0f766e',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <MessageSquare size={14} />
            <span>Start Live Chat</span>
          </button>

          <button
            onClick={() => onNavigate('assistant-chat', { autoCall: true })}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              borderRadius: '10px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <Phone size={14} />
            <span>Call</span>
          </button>
        </div>
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

          <div className="quick-card" onClick={() => onNavigate('complaints')}>
            <div className="quick-icon-wrapper" style={{ background: '#e0f2f1' }}>
              <AlertCircle size={20} color="#0f766e" />
            </div>
            <div>
              <h4>{t.complaints}</h4>
              <p>{t.complaintsDesc}</p>
            </div>
          </div>

          <div className="quick-card" onClick={() => onNavigate('calls')}>
            <div className="quick-icon-wrapper" style={{ background: '#ccfbf1' }}>
              <PhoneCall size={20} color="#0f766e" />
            </div>
            <div>
              <h4>{t.callServices}</h4>
              <p>{t.callServicesDesc}</p>
            </div>
          </div>

          <div className="quick-card" onClick={() => onNavigate('timeline')}>
            <div className="quick-icon-wrapper" style={{ background: '#f0fdfa' }}>
              <History size={20} color="#0d9488" />
            </div>
            <div>
              <h4>{t.careTimeline}</h4>
              <p>{t.careTimelineDesc}</p>
            </div>
          </div>

          <div className="quick-card" onClick={() => onNavigate('awareness')}>
            <div className="quick-icon-wrapper" style={{ background: 'linear-gradient(135deg, #ccfbf1, #e0f2fe)' }}>
              <Sparkles size={20} color="#0f766e" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h4>{t.socialAwareness}</h4>
                <span style={{ fontSize: '9px', background: '#fee2e2', color: '#b91c1c', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                  DRIVES
                </span>
              </div>
              <p>{t.socialAwarenessDesc}</p>
            </div>
          </div>

          <div className="quick-card" onClick={() => onNavigate('camps')}>
            <div className="quick-icon-wrapper" style={{ background: 'linear-gradient(135deg, #e0f2fe, #ccfbf1)' }}>
              <Tent size={20} color="#0f766e" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h4>{t.healthCamps}</h4>
                <span style={{ fontSize: '9px', background: '#dcfce7', color: '#166534', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                  FREE
                </span>
              </div>
              <p>{t.healthCampsDesc}</p>
            </div>
          </div>

          <div className="quick-card" onClick={() => onNavigate('followups')}>
            <div className="quick-icon-wrapper" style={{ background: 'linear-gradient(135deg, #e0f2fe, #f0fdf4)' }}>
              <HeartPulse size={20} color="#0284c7" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h4>{t.followUpTracking}</h4>
                <span style={{ fontSize: '9px', background: '#e0f2fe', color: '#0369a1', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                  ASHA
                </span>
              </div>
              <p>{t.followUpTrackingDesc}</p>
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
