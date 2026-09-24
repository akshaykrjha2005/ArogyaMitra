import React, { useState, useEffect } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneForwarded,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Building2,
  UserCheck,
  Search,
  Filter,
  ArrowRight,
  Send,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  PhoneMissed,
  Calendar,
  Check,
  Copy,
  RefreshCw,
} from 'lucide-react';
import {
  PatientProfile,
  AppLanguage,
  HelplineContact,
  HelplineCategory,
  CallbackRequest,
  CallbackRequestStatus,
  resolveTranslationObject,
} from '@phc-connect/types';
import { apiClient } from '../services/api';

interface CallServicesScreenProps {
  patient: PatientProfile | null;
  onNavigate?: (tab: string, extra?: any) => void;
  lang?: AppLanguage;
  initialTab?: 'directory' | 'request' | 'my-requests';
}

const CATEGORY_LABELS: Record<HelplineCategory, { label: string; icon: string; color: string; bg: string }> = {
  EMERGENCY: { label: 'Emergency 24x7', icon: '🚨', color: '#dc2626', bg: '#fef2f2' },
  HEALTH_HELPLINE: { label: 'Health Advisory', icon: '🩺', color: '#0284c7', bg: '#f0f9ff' },
  MENTAL_HEALTH: { label: 'Mental Health', icon: '🧠', color: '#7c3aed', bg: '#f5f3ff' },
  MATERNAL_CHILD: { label: 'Maternal & Child', icon: '👶', color: '#db2777', bg: '#fdf2f8' },
  PHC_DIRECT: { label: 'PHC Direct Line', icon: '🏥', color: '#059669', bg: '#ecfdf5' },
  HEALTH_ASSISTANT: { label: 'ASHA / Health Assistant', icon: '👩‍⚕️', color: '#d97706', bg: '#fffbeb' },
  AMBULANCE: { label: 'Ambulance Dispatch', icon: '🚑', color: '#e11d48', bg: '#fff1f2' },
};

const PREFERRED_TIME_OPTIONS = [
  'Immediate / ASAP',
  'Morning (09:00 AM - 12:00 PM)',
  'Afternoon (12:00 PM - 03:00 PM)',
  'Evening (03:00 PM - 06:00 PM)',
  'Night (06:00 PM - 09:00 PM)',
];

const CALLBACK_REASONS = [
  'OPD Doctor Consultation Inquiry',
  'Lab Test Reports / Diagnostic Result Review',
  'Medicine Stock Refill & Pharmacy Query',
  'ASHA / ANM Home Visit Request',
  'Post-Discharge Care / Dressing Clarification',
  'Vaccination / Child Immunization Schedule',
  'Maternal Health & Antenatal Checkup Query',
  'General Health Guidance & Triage Advice',
  'Other Medical Assistance',
];

export const CallServicesScreen: React.FC<CallServicesScreenProps> = ({
  patient,
  onNavigate,
  lang = 'en',
  initialTab = 'directory',
}) => {
  const [activeTab, setActiveTab] = useState<'directory' | 'request' | 'my-requests'>(initialTab);
  const [contacts, setContacts] = useState<HelplineContact[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  // Request Callback Form State
  const [formName, setFormName] = useState<string>(patient?.fullName || '');
  const [formPhone, setFormPhone] = useState<string>(patient?.phone || '');
  const [formReason, setFormReason] = useState<string>('OPD Doctor Consultation Inquiry');
  const [customReason, setCustomReason] = useState<string>('');
  const [formTime, setFormTime] = useState<string>('Immediate / ASAP');
  const [formPhcId, setFormPhcId] = useState<string>('phc-001');
  const [phcList, setPhcList] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<CallbackRequest | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // My Requests State
  const [myRequests, setMyRequests] = useState<CallbackRequest[]>([]);
  const [loadingMyRequests, setLoadingMyRequests] = useState<boolean>(false);

  // Translations
  const t = resolveTranslationObject(lang, {
    en: {
      title: 'Call Services & Helplines',
      subtitle: 'Instant direct dial, emergency ambulance & dedicated callback desk',
      speedDial: 'Quick Emergency Speed Dial (One-Touch)',
      tabDirectory: 'Helplines Directory',
      tabRequest: 'Request a Callback',
      tabMyRequests: 'My Callback Requests',
      searchPlaceholder: 'Search helplines, PHC, ASHA worker...',
      allCategories: 'All Contacts',
      tollFree: 'Toll-Free 24x7',
      callNow: 'Direct Call',
      copied: 'Number Copied!',
      requestTitle: 'Request a Health Desk Callback',
      requestSubtitle: 'Our PHC medical officer or health assistant will call you at your preferred time.',
      nameLabel: 'Your Full Name',
      phoneLabel: 'Contact Mobile Number',
      reasonLabel: 'Purpose / Department',
      customReasonLabel: 'Additional Details (Optional)',
      timeLabel: 'Preferred Callback Time',
      phcLabel: 'Related Primary Health Centre (PHC)',
      submitBtn: 'Submit Callback Request',
      successTitle: 'Callback Request Registered!',
      successMsg: 'Our medical desk has queued your request and will call you on',
      trackBtn: 'View in My Requests',
      newRequestBtn: 'Book Another Callback',
      noRequests: 'No callback requests found.',
      noRequestsDesc: 'Need medical advice or OPD assistance? Submit a callback request above.',
      attempts: 'Attempts',
      statusPending: 'Queued / Pending',
      statusCalled: 'Agent Called',
      statusMissed: 'Missed Call',
      statusCompleted: 'Resolved & Completed',
    },
    hi: {
      title: 'कॉल सेवाएं और हेल्पलाइन',
      subtitle: 'आपातकालीन एम्बुलेंस, पीएचसी और स्वास्थ्य सहायक संपर्क',
      speedDial: 'आपातकालीन त्वरित डायल (एक स्पर्श)',
      tabDirectory: 'हेल्पलाइन डायरेक्टरी',
      tabRequest: 'कॉल-बैक अनुरोध करें',
      tabMyRequests: 'मेरे कॉल-बैक अनुरोध',
      searchPlaceholder: 'हेल्पलाइन, पीएचसी, आशा कार्यकर्ता खोजें...',
      allCategories: 'सभी संपर्क',
      tollFree: 'टोल-फ्री 24x7',
      callNow: 'कॉल करें',
      copied: 'नंबर कॉपी किया गया!',
      requestTitle: 'स्वास्थ्य सहायता के लिए कॉल-बैक मांगें',
      requestSubtitle: 'हमारे पीएचसी स्वास्थ्य अधिकारी या सहायक आपको आपके पसंदीदा समय पर कॉल करेंगे।',
      nameLabel: 'आपका पूरा नाम',
      phoneLabel: 'संपर्क मोबाइल नंबर',
      reasonLabel: 'कारण / विभाग',
      customReasonLabel: 'अतिरिक्त विवरण (वैकल्पिक)',
      timeLabel: 'कॉल-बैक का पसंदीदा समय',
      phcLabel: 'संबंधित प्राथमिक स्वास्थ्य केंद्र (PHC)',
      submitBtn: 'कॉल-बैक अनुरोध सबमिट करें',
      successTitle: 'कॉल-बैक अनुरोध दर्ज हुआ!',
      successMsg: 'हमारे स्वास्थ्य डेस्क ने आपका अनुरोध कतार में रखा है और जल्द ही संपर्क करेगा:',
      trackBtn: 'मेरे अनुरोध देखें',
      newRequestBtn: 'दूसरा अनुरोध दर्ज करें',
      noRequests: 'कोई कॉल-बैक अनुरोध नहीं मिला।',
      noRequestsDesc: 'चिकित्सा सलाह या ओपीडी सहायता के लिए ऊपर नया अनुरोध भेजें।',
      attempts: 'प्रयास',
      statusPending: 'प्रतीक्षारत / पेंडिंग',
      statusCalled: 'कॉल किया गया',
      statusMissed: 'मिस्ड कॉल',
      statusCompleted: 'सम्पन्न / पूर्ण',
    },
    kn: {
      title: 'ಕರೆ ಸೇವೆಗಳು ಮತ್ತು ಸಹಾಯವಾಣಿ',
      subtitle: 'ತುರ್ತು ಆಂಬ್ಯುಲೆನ್ಸ್, ಪಿಹೆಚ್‌ಸಿ ಮತ್ತು ಆರೋಗ್ಯ ಸಹಾಯಕರ ಸಂಪರ್ಕ',
      speedDial: 'ತುರ್ತು ತ್ವರಿತ ಕರೆ (ಒನ್-ಟಚ್)',
      tabDirectory: 'ಸಹಾಯವಾಣಿ ಮಾಹಿತಿ',
      tabRequest: 'ಕಾಲ್-ಬ್ಯಾಕ್ ವಿನಂತಿಸಿ',
      tabMyRequests: 'ನನ್ನ ವಿನಂತಿಗಳು',
      searchPlaceholder: 'ಸಹಾಯವಾಣಿ, ಪಿಹೆಚ್‌ಸಿ ಹುಡುಕಿ...',
      allCategories: 'ಎಲ್ಲಾ ಸಂಪರ್ಕಗಳು',
      tollFree: 'ಉಚಿತ ಕರೆ 24x7',
      callNow: 'ಈಗಲೇ ಕರೆ ಮಾಡಿ',
      copied: 'ಸಂಖ್ಯೆ ನಕಲಿಸಲಾಗಿದೆ!',
      requestTitle: 'ಆರೋಗ್ಯ ಕಾಲ್-ಬ್ಯಾಕ್ ವಿನಂತಿ',
      requestSubtitle: 'ನಮ್ಮ ವೈದ್ಯಾಧಿಕಾರಿ ಅಥವಾ ಆರೋಗ್ಯ ಸಹಾಯಕರು ನಿಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸುತ್ತಾರೆ.',
      nameLabel: 'ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರು',
      phoneLabel: 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ',
      reasonLabel: 'ಕಾರಣ / ಇಲಾಖೆ',
      customReasonLabel: 'ಹೆಚ್ಚುವರಿ ವಿವರ',
      timeLabel: 'ಅನುಕೂಲಕರ ಸಮಯ',
      phcLabel: 'ಸಂಬಂಧಿಸಿದ ಆರೋಗ್ಯ ಕೇಂದ್ರ',
      submitBtn: 'ವಿನಂತಿ ಸಲ್ಲಿಸಿ',
      successTitle: 'ವಿನಂತಿ ಯಶಸ್ವಿಯಾಗಿದೆ!',
      successMsg: 'ನಮ್ಮ ವೈದ್ಯಕೀಯ ತಂಡವು ಶೀಘ್ರದಲ್ಲೇ ನಿಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸುತ್ತದೆ:',
      trackBtn: 'ವಿನಂತಿಗಳನ್ನು ವೀಕ್ಷಿಸಿ',
      newRequestBtn: 'ಮತ್ತೊಂದು ವಿನಂತಿ ಸಲ್ಲಿಸಿ',
      noRequests: 'ಯಾವುದೇ ವಿನಂತಿಗಳಿಲ್ಲ.',
      noRequestsDesc: 'ಸಹಾಯ ಬೇಕಿದ್ದಲ್ಲಿ ಮೇಲೆ ಕಾಲ್-ಬ್ಯಾಕ್ ವಿನಂತಿ ಸಲ್ಲಿಸಿ.',
      attempts: 'ಪ್ರಯತ್ನಗಳು',
      statusPending: 'ಪ್ರಕ್ರಿಯೆಯಲ್ಲಿದೆ',
      statusCalled: 'ಕರೆ ಮಾಡಲಾಗಿದೆ',
      statusMissed: 'ಮಿಸ್ಡ್ ಕಾಲ್',
      statusCompleted: 'ಪೂರ್ಣಗೊಂಡಿದೆ',
    },
  });

  useEffect(() => {
    loadHelplines();
    loadPHCs();
    if (patient) {
      loadMyRequests();
    }
  }, [patient]);

  const loadHelplines = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/call/helplines');
      if (res.success && res.contacts) {
        setContacts(res.contacts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadPHCs = async () => {
    try {
      const res = await apiClient.get('/phcs');
      if (res.success && res.phcs) {
        setPhcList(res.phcs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadMyRequests = async () => {
    try {
      setLoadingMyRequests(true);
      const res = await apiClient.get('/call/callbacks/my');
      if (res.success && res.requests) {
        setMyRequests(res.requests);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMyRequests(false);
    }
  };

  const handleCopyNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(num);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  const handleSubmitCallback = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim() || !formPhone.trim()) {
      setFormError('Please enter your full name and valid 10-digit mobile number.');
      return;
    }

    try {
      setSubmitting(true);
      const finalReason = customReason.trim()
        ? `${formReason}: ${customReason.trim()}`
        : formReason;

      const res = await apiClient.post('/call/callbacks', {
        name: formName.trim(),
        phone: formPhone.trim(),
        reason: finalReason,
        preferredTime: formTime,
        phcId: formPhcId,
        patientId: patient?.id || null,
      });

      if (res.success && res.callbackRequest) {
        setSubmitSuccess(res.callbackRequest);
        setMyRequests((prev) => [res.callbackRequest, ...prev]);
        setCustomReason('');
      } else {
        setFormError(res.error || 'Failed to submit callback request.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Network error while submitting callback request.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter contacts
  const filteredContacts = contacts.filter((c) => {
    const matchesCategory = selectedCategory === 'ALL' || c.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Status helper
  const getStatusBadge = (status: CallbackRequestStatus) => {
    switch (status) {
      case 'Pending':
        return {
          label: t.statusPending,
          bg: '#fef3c7',
          color: '#92400e',
          border: '#fde68a',
          icon: <Clock size={13} />,
        };
      case 'Called':
        return {
          label: t.statusCalled,
          bg: '#e0f2fe',
          color: '#0369a1',
          border: '#bae6fd',
          icon: <PhoneCall size={13} />,
        };
      case 'Missed':
        return {
          label: t.statusMissed,
          bg: '#fee2e2',
          color: '#b91c1c',
          border: '#fecaca',
          icon: <PhoneMissed size={13} />,
        };
      case 'Completed':
        return {
          label: t.statusCompleted,
          bg: '#dcfce7',
          color: '#15803d',
          border: '#bbf7d0',
          icon: <CheckCircle2 size={13} />,
        };
      default:
        return {
          label: status,
          bg: '#f1f5f9',
          color: '#475569',
          border: '#e2e8f0',
          icon: <Clock size={13} />,
        };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '24px' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
          borderRadius: '16px',
          padding: '18px 16px',
          color: '#ffffff',
          boxShadow: '0 4px 14px rgba(13, 148, 136, 0.25)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <PhoneCall size={20} color="#a7f3d0" />
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>{t.title}</h2>
          </div>
          <p style={{ fontSize: '12px', opacity: 0.92, margin: 0, lineHeight: 1.4 }}>
            {t.subtitle}
          </p>
        </div>
        <div
          style={{
            position: 'absolute',
            right: '-12px',
            bottom: '-16px',
            fontSize: '80px',
            opacity: 0.15,
            userSelect: 'none',
          }}
        >
          📞
        </div>
      </div>

      {/* Real-time Human Health Assistant Voice & Chat Link */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f766e, #0d9488)',
          borderRadius: '14px',
          padding: '14px',
          color: '#ffffff',
          boxShadow: '0 2px 8px rgba(13, 148, 136, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(255, 255, 255, 0.2)', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 700, marginBottom: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }} />
            <span>Real-time Human Staff • WebRTC</span>
          </div>
          <h4 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 2px 0' }}>
            Talk to Human Health Worker
          </h4>
          <p style={{ fontSize: '11px', color: '#ccfbf1', margin: 0 }}>
            Real-time chat & peer-to-peer audio call with ASHA & CHO assistants.
          </p>
        </div>

        <button
          onClick={() => onNavigate?.('assistant-chat')}
          style={{
            background: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            padding: '8px 14px',
            fontSize: '12px',
            fontWeight: 800,
            color: '#0f766e',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          Open Chat & Call
        </button>
      </div>

      {/* Speed Dial Emergency Bar (One-Touch tel: Links) */}
      <div style={{ background: '#ffffff', borderRadius: '14px', padding: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
          <ShieldAlert size={16} color="#dc2626" />
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            {t.speedDial}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
          {[
            { num: '108', label: 'Ambulance', desc: 'Emergency 24x7', bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' },
            { num: '112', label: 'Universal', desc: 'Police/Med/Fire', bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
            { num: '104', label: 'Health Adv.', desc: 'Medical Advice', bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' },
            { num: '14416', label: 'Tele-MANAS', desc: 'Mental Health', bg: '#f3e8ff', text: '#6b21a8', border: '#d8b4fe' },
          ].map((item) => (
            <a
              key={item.num}
              href={`tel:${item.num}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: item.bg,
                border: `1.5px solid ${item.border}`,
                borderRadius: '10px',
                padding: '10px 4px',
                textDecoration: 'none',
                color: item.text,
                textAlign: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '2px' }}>
                <Phone size={13} fill={item.text} color={item.text} />
                <span style={{ fontSize: '15px', fontWeight: 800 }}>{item.num}</span>
              </div>
              <span style={{ fontSize: '10px', fontWeight: 700 }}>{item.label}</span>
              <span style={{ fontSize: '9px', opacity: 0.8, marginTop: '1px' }}>{item.desc}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Main Navigation Segmented Tabs */}
      <div
        style={{
          display: 'flex',
          background: '#f1f5f9',
          borderRadius: '12px',
          padding: '4px',
          gap: '4px',
        }}
      >
        <button
          style={{
            flex: 1,
            padding: '9px 6px',
            borderRadius: '9px',
            border: 'none',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'directory' ? '#ffffff' : 'transparent',
            color: activeTab === 'directory' ? '#0f766e' : '#64748b',
            boxShadow: activeTab === 'directory' ? '0 2px 5px rgba(0,0,0,0.08)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            transition: 'all 0.15s ease',
          }}
          onClick={() => setActiveTab('directory')}
        >
          <Phone size={14} />
          <span>{t.tabDirectory}</span>
        </button>

        <button
          style={{
            flex: 1,
            padding: '9px 6px',
            borderRadius: '9px',
            border: 'none',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'request' ? '#ffffff' : 'transparent',
            color: activeTab === 'request' ? '#0f766e' : '#64748b',
            boxShadow: activeTab === 'request' ? '0 2px 5px rgba(0,0,0,0.08)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            transition: 'all 0.15s ease',
          }}
          onClick={() => {
            setActiveTab('request');
            setSubmitSuccess(null);
          }}
        >
          <PhoneForwarded size={14} />
          <span>{t.tabRequest}</span>
        </button>

        <button
          style={{
            flex: 1,
            padding: '9px 6px',
            borderRadius: '9px',
            border: 'none',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'my-requests' ? '#ffffff' : 'transparent',
            color: activeTab === 'my-requests' ? '#0f766e' : '#64748b',
            boxShadow: activeTab === 'my-requests' ? '0 2px 5px rgba(0,0,0,0.08)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            transition: 'all 0.15s ease',
            position: 'relative',
          }}
          onClick={() => {
            setActiveTab('my-requests');
            loadMyRequests();
          }}
        >
          <Clock size={14} />
          <span>{t.tabMyRequests}</span>
          {myRequests.length > 0 && (
            <span
              style={{
                background: '#0d9488',
                color: '#ffffff',
                borderRadius: '9999px',
                padding: '1px 5px',
                fontSize: '10px',
                fontWeight: 800,
                marginLeft: '2px',
              }}
            >
              {myRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: HELPLINE DIRECTORY */}
      {activeTab === 'directory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Search and Filters */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                padding: '8px 12px',
                gap: '8px',
              }}
            >
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                style={{
                  border: 'none',
                  outline: 'none',
                  width: '100%',
                  fontSize: '13px',
                  color: '#1e293b',
                  background: 'transparent',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '12px' }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Category Chips Scroll */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              paddingBottom: '4px',
              scrollbarWidth: 'none',
            }}
          >
            <button
              onClick={() => setSelectedCategory('ALL')}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                border: selectedCategory === 'ALL' ? '1.5px solid #0d9488' : '1px solid #e2e8f0',
                background: selectedCategory === 'ALL' ? '#e6fffa' : '#ffffff',
                color: selectedCategory === 'ALL' ? '#0d9488' : '#64748b',
                fontSize: '11px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
            >
              ⭐ {t.allCategories}
            </button>
            {Object.entries(CATEGORY_LABELS).map(([catKey, catMeta]) => (
              <button
                key={catKey}
                onClick={() => setSelectedCategory(catKey)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: selectedCategory === catKey ? `1.5px solid ${catMeta.color}` : '1px solid #e2e8f0',
                  background: selectedCategory === catKey ? catMeta.bg : '#ffffff',
                  color: selectedCategory === catKey ? catMeta.color : '#64748b',
                  fontSize: '11px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                }}
              >
                {catMeta.icon} {catMeta.label}
              </button>
            ))}
          </div>

          {/* Contacts List */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
              <RefreshCw size={24} className="spin-animate" style={{ margin: '0 auto 8px', color: '#0d9488' }} />
              <p style={{ fontSize: '13px' }}>Loading directory contacts...</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div style={{ background: '#ffffff', borderRadius: '12px', padding: '30px', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
              <HelpCircle size={32} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
              <h4 style={{ fontSize: '14px', color: '#334155', margin: '0 0 4px' }}>No contacts match your filter</h4>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Try clearing search keywords or selecting All Contacts.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredContacts.map((contact) => {
                const meta = CATEGORY_LABELS[contact.category] || CATEGORY_LABELS.HEALTH_HELPLINE;
                return (
                  <div
                    key={contact.id}
                    style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      padding: '14px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <span
                            style={{
                              background: meta.bg,
                              color: meta.color,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '10px',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                            }}
                          >
                            {meta.icon} {contact.badge || meta.label}
                          </span>
                          {contact.tollFree && (
                            <span
                              style={{
                                background: '#ecfdf5',
                                color: '#059669',
                                padding: '2px 6px',
                                borderRadius: '6px',
                                fontSize: '10px',
                                fontWeight: 700,
                              }}
                            >
                              Free
                            </span>
                          )}
                        </div>
                        <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: '0 0 3px' }}>
                          {contact.name}
                        </h3>
                        <p style={{ fontSize: '11px', color: '#64748b', margin: 0, lineHeight: 1.35 }}>
                          {contact.description}
                        </p>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#f8fafc',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid #f1f5f9',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={13} color="#64748b" />
                        <span style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>
                          {contact.availableHours}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        {/* Copy Button */}
                        <button
                          onClick={() => handleCopyNumber(contact.number)}
                          title="Copy number"
                          style={{
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            padding: '6px 8px',
                            cursor: 'pointer',
                            color: copiedNumber === contact.number ? '#059669' : '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                          }}
                        >
                          {copiedNumber === contact.number ? <Check size={12} /> : <Copy size={12} />}
                        </button>

                        {/* Direct Mobile Tel: Link */}
                        <a
                          href={contact.telLink}
                          style={{
                            background: 'linear-gradient(135deg, #0d9488, #059669)',
                            color: '#ffffff',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            textDecoration: 'none',
                            fontSize: '12px',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            boxShadow: '0 2px 6px rgba(13, 148, 136, 0.3)',
                          }}
                        >
                          <Phone size={13} fill="#ffffff" />
                          <span>{contact.number}</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REQUEST A CALLBACK FORM */}
      {activeTab === 'request' && (
        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          {submitSuccess ? (
            <div style={{ textAlign: 'center', padding: '20px 8px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  background: '#dcfce7',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                  color: '#15803d',
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                {t.successTitle}
              </h3>
              <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 16px', lineHeight: 1.4 }}>
                {t.successMsg} <strong>{submitSuccess.phone}</strong> during <strong>{submitSuccess.preferredTime}</strong>.
              </p>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '12px',
                  marginBottom: '20px',
                  textAlign: 'left',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>Request ID:</span>
                  <strong style={{ color: '#0d9488' }}>{submitSuccess.requestId}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>Health Centre:</span>
                  <strong style={{ color: '#1e293b' }}>{submitSuccess.phcName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Status:</span>
                  <span style={{ color: '#b45309', fontWeight: 700 }}>⏳ {submitSuccess.status}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    setActiveTab('my-requests');
                    loadMyRequests();
                  }}
                  style={{
                    flex: 1,
                    background: '#0d9488',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {t.trackBtn}
                </button>
                <button
                  onClick={() => setSubmitSuccess(null)}
                  style={{
                    flex: 1,
                    background: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {t.newRequestBtn}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitCallback} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: '0 0 3px' }}>
                  {t.requestTitle}
                </h3>
                <p style={{ fontSize: '11px', color: '#64748b', margin: 0, lineHeight: 1.35 }}>
                  {t.requestSubtitle}
                </p>
              </div>

              {formError && (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#dc2626',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <AlertCircle size={14} />
                  <span>{formError}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  {t.nameLabel} *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Ramesh Patel"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Contact Phone */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  {t.phoneLabel} *
                </label>
                <input
                  type="tel"
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Purpose / Reason */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  {t.reasonLabel} *
                </label>
                <select
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    background: '#ffffff',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  {CALLBACK_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Reason / Details */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  {t.customReasonLabel}
                </label>
                <textarea
                  rows={2}
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Briefly describe what you'd like to ask or discuss with the medical officer..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Preferred Time Slot */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  {t.timeLabel} *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                  {PREFERRED_TIME_OPTIONS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setFormTime(slot)}
                      style={{
                        padding: '8px 6px',
                        borderRadius: '6px',
                        border: formTime === slot ? '1.5px solid #0d9488' : '1px solid #e2e8f0',
                        background: formTime === slot ? '#e6fffa' : '#f8fafc',
                        color: formTime === slot ? '#0f766e' : '#475569',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target PHC */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  {t.phcLabel}
                </label>
                <select
                  value={formPhcId}
                  onChange={(e) => setFormPhcId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    background: '#ffffff',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  {phcList.length > 0 ? (
                    phcList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.district})
                      </option>
                    ))
                  ) : (
                    <option value="phc-001">Central Urban PHC - Karol Bagh</option>
                  )}
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  background: 'linear-gradient(135deg, #0d9488, #0284c7)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '6px',
                  boxShadow: '0 3px 10px rgba(13, 148, 136, 0.3)',
                }}
              >
                {submitting ? (
                  <>
                    <RefreshCw size={16} className="spin-animate" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>{t.submitBtn}</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* TAB 3: MY REQUESTS */}
      {activeTab === 'my-requests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>
              {t.tabMyRequests} ({myRequests.length})
            </span>
            <button
              onClick={loadMyRequests}
              style={{
                background: 'none',
                border: 'none',
                color: '#0d9488',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <RefreshCw size={12} />
              <span>Refresh</span>
            </button>
          </div>

          {loadingMyRequests ? (
            <div style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
              <RefreshCw size={24} className="spin-animate" style={{ margin: '0 auto 8px', color: '#0d9488' }} />
              <p style={{ fontSize: '13px' }}>Loading your requests...</p>
            </div>
          ) : myRequests.length === 0 ? (
            <div style={{ background: '#ffffff', borderRadius: '14px', padding: '32px 16px', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
              <PhoneMissed size={36} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
              <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#334155', margin: '0 0 4px' }}>
                {t.noRequests}
              </h4>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px', lineHeight: 1.4 }}>
                {t.noRequestsDesc}
              </p>
              <button
                onClick={() => setActiveTab('request')}
                style={{
                  background: '#0d9488',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 16px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                + {t.tabRequest}
              </button>
            </div>
          ) : (
            myRequests.map((req) => {
              const badge = getStatusBadge(req.status);
              return (
                <div
                  key={req.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '12px',
                    padding: '14px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          color: '#0d9488',
                          background: '#e6fffa',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {req.requestId}
                      </span>
                      <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', margin: '6px 0 2px' }}>
                        {req.reason}
                      </h4>
                      <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
                        🏥 {req.phcName || 'Primary Health Centre'}
                      </p>
                    </div>

                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {badge.icon}
                      <span>{badge.label}</span>
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#f8fafc',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: '#475569',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} color="#64748b" />
                      <span>Preferred: <strong>{req.preferredTime}</strong></span>
                    </div>

                    <div>
                      <span>{t.attempts}: <strong>{req.callAttempts || 0}</strong></span>
                    </div>
                  </div>

                  {req.notes && (
                    <div
                      style={{
                        background: '#f0fdf4',
                        borderLeft: '3px solid #16a34a',
                        padding: '8px 10px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: '#166534',
                      }}
                    >
                      <strong>Staff Note:</strong> {req.notes}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#94a3b8' }}>
                    <span>Requested on {new Date(req.createdAt).toLocaleString()}</span>
                    {req.lastAttemptAt && (
                      <span>Last attempt: {new Date(req.lastAttemptAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
export default CallServicesScreen;
