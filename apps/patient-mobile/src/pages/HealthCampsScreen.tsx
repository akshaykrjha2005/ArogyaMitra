import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  ArrowRight,
  Share2,
  Phone,
  Heart,
  Stethoscope,
  Sparkles,
  Ticket,
  ChevronRight,
  ShieldCheck,
  Building,
  UserCheck,
  X,
  Send,
  BellRing,
  Info,
} from 'lucide-react';
import {
  HealthCamp,
  HealthCampType,
  HealthCampStatus,
  HealthCampRegistration,
  PatientProfile,
  AppLanguage,
  resolveTranslationObject,
} from '@phc-connect/types';
import { apiClient } from '../services/api';

interface Props {
  patient: PatientProfile | null;
  onNavigate: (tab: string, extra?: any) => void;
  lang: AppLanguage;
  initialCampId?: string;
}

export const HealthCampsScreen: React.FC<Props> = ({
  patient,
  onNavigate,
  lang,
  initialCampId,
}) => {
  const [camps, setCamps] = useState<HealthCamp[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<{ registration: HealthCampRegistration; camp?: HealthCamp }[]>([]);
  const [selectedType, setSelectedType] = useState<HealthCampType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'browse' | 'my-passes'>('browse');
  const [loading, setLoading] = useState(true);
  const [selectedCamp, setSelectedCamp] = useState<HealthCamp | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [viewPassModal, setViewPassModal] = useState<{ registration: HealthCampRegistration; camp: HealthCamp } | null>(null);

  // Registration Form State
  const [regName, setRegName] = useState(patient?.fullName || '');
  const [regPhone, setRegPhone] = useState(patient?.phone || '');
  const [regAge, setRegAge] = useState(patient?.age?.toString() || '30');
  const [regGender, setRegGender] = useState<'Male' | 'Female' | 'Other'>((patient?.gender as any) || 'Female');
  const [regNotes, setRegNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [regSuccessData, setRegSuccessData] = useState<any>(null);
  const [reminderToast, setReminderToast] = useState<string | null>(null);

  const t = resolveTranslationObject(lang, {
    en: {
      screenTitle: 'Free Health Camps',
      screenSubtitle: 'Community health screening, eye checks, vaccinations & doctor consultations',
      browseTab: 'Upcoming Camps',
      myPassesTab: 'My Passes & Tokens',
      searchPlaceholder: 'Search by camp name, venue, or services...',
      allTypes: 'All Types',
      general: 'General Health',
      eye: 'Eye Screening',
      dental: 'Dental Care',
      vaccination: 'Vaccination',
      maternal: 'Maternal & Child',
      ncd: 'Diabetes & NCD',
      ayush: 'AYUSH & Wellness',
      spotsLeft: 'spots left',
      fullBadge: 'Capacity Full',
      registerBtn: 'Register for Free Pass',
      viewTokenBtn: 'View My Pass (Token #',
      assignedDoctor: 'Assigned Doctor',
      assignedAssistant: 'ASHA / Health Assistant',
      services: 'Services Offered',
      eligibility: 'Eligibility',
      venue: 'Venue & Timings',
      registerModalTitle: 'Register for Health Camp',
      fullName: 'Full Name',
      phone: 'Mobile Number',
      age: 'Age (Years)',
      gender: 'Gender',
      healthNotes: 'Specific Complaints or Symptoms (Optional)',
      confirmRegisterBtn: 'Confirm Registration & Generate Token',
      successTitle: 'Registration Confirmed!',
      successDesc: 'Your digital health camp pass with token number has been generated.',
      tokenNumber: 'Token Number',
      showAtVenue: 'Please show this token number when you arrive at the camp desk.',
      noPasses: 'You have not registered for any health camps yet.',
      browsePrompt: 'Browse upcoming community health camps and register for free screening.',
      reminderSuccess: 'Reminder set! We will notify you before the camp begins.',
      shareCamp: 'Share Camp Details',
      talkToAssistant: 'Chat with Camp Coordinator',
    },
    hi: {
      screenTitle: 'निःशुल्क स्वास्थ्य शिविर',
      screenSubtitle: 'सामुदायिक स्वास्थ्य जांच, नेत्र परीक्षण, टीकाकरण व विशेषज्ञ डॉक्टर परामर्श',
      browseTab: 'आगामी स्वास्थ्य शिविर',
      myPassesTab: 'मेरे पास व टोकन',
      searchPlaceholder: 'शिविर का नाम, स्थान या सेवा खोजें...',
      allTypes: 'सभी प्रकार',
      general: 'सामान्य स्वास्थ्य',
      eye: 'नेत्र परीक्षण',
      dental: 'दंत चिकित्सा',
      vaccination: 'टीकाकरण',
      maternal: 'मातृ एवं शिशु',
      ncd: 'डायबिटीज व बीपी',
      ayush: 'आयुष व कल्याण',
      spotsLeft: 'स्थान शेष',
      fullBadge: 'सीटें फुल',
      registerBtn: 'मुफ्त पास हेतु पंजीकरण करें',
      viewTokenBtn: 'पास देखें (टोकन #',
      assignedDoctor: 'नामित डॉक्टर',
      assignedAssistant: 'आशा / स्वास्थ्य सहायक',
      services: 'उपलब्ध स्वास्थ्य सेवाएं',
      eligibility: 'पात्रता',
      venue: 'स्थान व समय',
      registerModalTitle: 'स्वास्थ्य शिविर पंजीकरण',
      fullName: 'पूरा नाम',
      phone: 'मोबाइल नंबर',
      age: 'उम्र (वर्ष)',
      gender: 'लिंग',
      healthNotes: 'मुख्य समस्या या लक्षण (वैकल्पिक)',
      confirmRegisterBtn: 'पंजीकरण की पुष्टि करें व टोकन पाएं',
      successTitle: 'पंजीकरण सफल रहा!',
      successDesc: 'आपका डिजिटल शिविर पास और टोकन नंबर जारी कर दिया गया है।',
      tokenNumber: 'टोकन नंबर',
      showAtVenue: 'कृपया शिविर स्थल पर पहुंचने पर यह टोकन नंबर काउंटर पर दिखाएं।',
      noPasses: 'आपने अभी तक किसी स्वास्थ्य शिविर के लिए पंजीकरण नहीं कराया है।',
      browsePrompt: 'आगामी स्वास्थ्य शिविर देखें और मुफ्त जांच के लिए तुरंत रजिस्टर करें।',
      reminderSuccess: 'रिमाइंडर सेट हो गया! शिविर शुरू होने से पहले आपको सूचित किया जाएगा।',
      shareCamp: 'शिविर जानकारी साझा करें',
      talkToAssistant: 'शिविर समन्वयक से बात करें',
    },
  });

  useEffect(() => {
    loadCamps();
    if (patient) {
      loadMyRegistrations();
    }
  }, [patient]);

  const loadCamps = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/camps');
      if (res.success && res.camps) {
        setCamps(res.camps);
        if (initialCampId) {
          const target = res.camps.find((c: HealthCamp) => c.id === initialCampId || c.campId === initialCampId);
          if (target) {
            setSelectedCamp(target);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load camps:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMyRegistrations = async () => {
    try {
      const res = await apiClient.get('/camps/registrations/my', { patientId: patient?.id });
      if (res.success && res.registrations) {
        setMyRegistrations(res.registrations);
      }
    } catch (err) {
      console.error('Failed to load my camp registrations:', err);
    }
  };

  const handleOpenRegister = (camp: HealthCamp) => {
    setSelectedCamp(camp);
    setRegSuccessData(null);
    setRegName(patient?.fullName || '');
    setRegPhone(patient?.phone || '');
    setRegAge(patient?.age?.toString() || '30');
    setRegGender((patient?.gender as any) || 'Female');
    setRegNotes('');
    setIsRegisterModalOpen(true);
  };

  const handleConfirmRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCamp) return;

    try {
      setSubmitting(true);
      const res = await apiClient.post(`/camps/${selectedCamp.id}/register`, {
        patientId: patient?.id,
        participantName: regName,
        participantPhone: regPhone,
        participantAge: Number(regAge),
        participantGender: regGender,
        notes: regNotes,
      });

      if (res.success) {
        setRegSuccessData(res);
        loadCamps();
        loadMyRegistrations();
      } else {
        alert(res.message || 'Registration failed');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Error completing registration');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShareCamp = (camp: HealthCamp) => {
    const text = `🏥 Free Health Camp: ${camp.title}\n📅 Date: ${camp.startDate} (${camp.time})\n📍 Venue: ${camp.venue}, ${camp.address}\n🩺 Organized by: ${camp.phcName}\n👉 Register for free token at ArogyaMitra: http://localhost:3000`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const isUserRegisteredForCamp = (campId: string) => {
    return myRegistrations.find((r) => r.registration.campId === campId && r.registration.status !== 'CANCELLED');
  };

  const filteredCamps = camps.filter((c) => {
    const matchesType = selectedType === 'ALL' || c.type === selectedType;
    const matchesSearch =
      !searchQuery ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phcName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.servicesOffered.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const getTypeStyle = (type: HealthCampType) => {
    switch (type) {
      case 'EYE':
        return { bg: '#e0e7ff', text: '#3730a3', border: '#c7d2fe', label: t.eye };
      case 'DENTAL':
        return { bg: '#cffafe', text: '#155e75', border: '#a5f3fc', label: t.dental };
      case 'MATERNAL_CHILD':
        return { bg: '#fce7f3', text: '#9d174d', border: '#fbcfe8', label: t.maternal };
      case 'VACCINATION':
        return { bg: '#dcfce7', text: '#166534', border: '#bbf7d0', label: t.vaccination };
      case 'NCD_SCREENING':
        return { bg: '#fef3c7', text: '#92400e', border: '#fde68a', label: t.ncd };
      case 'AYUSH':
        return { bg: '#f3e8ff', text: '#6b21a8', border: '#e9d5ff', label: t.ayush };
      default:
        return { bg: '#ccfbf1', text: '#0f766e', border: '#99f6e4', label: t.general };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '30px' }}>
      {/* Toast Notification */}
      {reminderToast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#0f766e',
            color: '#ffffff',
            padding: '10px 18px',
            borderRadius: '24px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: 700,
          }}
        >
          <BellRing size={16} />
          <span>{reminderToast}</span>
        </div>
      )}

      {/* Screen Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f766e, #0d9488)',
          borderRadius: '16px',
          padding: '18px 16px',
          color: '#ffffff',
          boxShadow: '0 4px 14px rgba(13, 148, 136, 0.25)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Calendar size={18} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
              {t.screenTitle}
            </h2>
            <span style={{ fontSize: '11px', opacity: 0.9, fontWeight: 600 }}>
              {t.screenSubtitle}
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.15)',
            borderRadius: '10px',
            padding: '3px',
            marginTop: '12px',
            gap: '4px',
          }}
        >
          <button
            onClick={() => setActiveTab('browse')}
            style={{
              flex: 1,
              padding: '7px 0',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'browse' ? '#ffffff' : 'transparent',
              color: activeTab === 'browse' ? '#0f766e' : '#ffffff',
              fontWeight: 800,
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={14} />
            {t.browseTab} ({camps.length})
          </button>
          <button
            onClick={() => setActiveTab('my-passes')}
            style={{
              flex: 1,
              padding: '7px 0',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'my-passes' ? '#ffffff' : 'transparent',
              color: activeTab === 'my-passes' ? '#0f766e' : '#ffffff',
              fontWeight: 800,
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Ticket size={14} />
            {t.myPassesTab} ({myRegistrations.length})
          </button>
        </div>
      </div>

      {activeTab === 'browse' && (
        <>
          {/* Search & Category Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                padding: '8px 12px',
                gap: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <Search size={16} color="#64748b" />
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
                  fontWeight: 600,
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Category Pills (Horizontal Scroll) */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                paddingBottom: '4px',
                scrollbarWidth: 'none',
              }}
            >
              {[
                { type: 'ALL', label: t.allTypes },
                { type: 'GENERAL', label: t.general },
                { type: 'EYE', label: t.eye },
                { type: 'MATERNAL_CHILD', label: t.maternal },
                { type: 'DENTAL', label: t.dental },
                { type: 'NCD_SCREENING', label: t.ncd },
                { type: 'VACCINATION', label: t.vaccination },
              ].map((item) => (
                <button
                  key={item.type}
                  onClick={() => setSelectedType(item.type as any)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: '1px solid',
                    borderColor: selectedType === item.type ? '#0f766e' : '#e2e8f0',
                    background: selectedType === item.type ? '#0f766e' : '#ffffff',
                    color: selectedType === item.type ? '#ffffff' : '#475569',
                    fontSize: '11px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Camps List */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '13px' }}>
              Loading upcoming health camps...
            </div>
          ) : filteredCamps.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                background: '#f8fafc',
                borderRadius: '16px',
                border: '1px dashed #cbd5e1',
              }}
            >
              <Calendar size={36} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#334155', margin: '0 0 4px' }}>
                No health camps found
              </p>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                Try adjusting your search query or category filter.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredCamps.map((camp) => {
                const typeStyle = getTypeStyle(camp.type);
                const remaining = Math.max(0, camp.capacity - camp.registeredCount);
                const isFull = camp.registeredCount >= camp.capacity;
                const userReg = isUserRegisteredForCamp(camp.id);
                const percentBooked = Math.min(100, Math.round((camp.registeredCount / camp.capacity) * 100));

                return (
                  <div
                    key={camp.id}
                    style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      overflow: 'hidden',
                      transition: 'transform 0.15s ease',
                    }}
                  >
                    {/* Header Banner Strip */}
                    <div
                      style={{
                        padding: '12px 14px',
                        background: '#f8fafc',
                        borderBottom: '1px solid #f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div
                        style={{
                          background: typeStyle.bg,
                          color: typeStyle.text,
                          border: `1px solid ${typeStyle.border}`,
                          padding: '3px 10px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Sparkles size={12} />
                        {typeStyle.label}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {camp.status === 'ONGOING' && (
                          <span
                            style={{
                              background: '#fee2e2',
                              color: '#b91c1c',
                              fontSize: '10px',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '12px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: '#dc2626',
                              }}
                            />
                            LIVE NOW
                          </span>
                        )}
                        <button
                          onClick={() => handleShareCamp(camp)}
                          title="Share Camp Details"
                          style={{
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '50%',
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#475569',
                          }}
                        >
                          <Share2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                          {camp.title}
                        </h3>
                        <p style={{ fontSize: '12px', color: '#475569', margin: 0, lineHeight: 1.4 }}>
                          {camp.description}
                        </p>
                      </div>

                      {/* Date, Time & Venue */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '8px',
                          background: '#f8fafc',
                          padding: '10px',
                          borderRadius: '10px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={14} color="#0f766e" />
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>
                            {camp.startDate}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={14} color="#0f766e" />
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>
                            {camp.time}
                          </span>
                        </div>
                        <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                          <MapPin size={14} color="#ef4444" style={{ marginTop: '2px', flexShrink: 0 }} />
                          <span style={{ fontSize: '11px', fontWeight: 600, color: '#475569', lineHeight: 1.3 }}>
                            {camp.venue} ({camp.phcName})
                          </span>
                        </div>
                      </div>

                      {/* Assigned Staff & ASHA Worker Link */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          background: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          borderRadius: '10px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '50%',
                              background: '#166534',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '11px',
                            }}
                          >
                            {camp.assignedAssistantName ? camp.assignedAssistantName.charAt(0) : 'A'}
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 800, color: '#14532d' }}>
                              {camp.assignedAssistantName || 'ASHA Coordinator'}
                            </div>
                            <div style={{ fontSize: '10px', color: '#15803d', fontWeight: 600 }}>
                              {camp.assignedAssistantRole || 'Health Assistant'} • {camp.assignedDoctorName || 'PHC Doctor'}
                            </div>
                          </div>
                        </div>

                        {camp.assignedAssistantId && (
                          <button
                            onClick={() =>
                              onNavigate('assistant-chat', { assistantId: camp.assignedAssistantId })
                            }
                            title="Chat with ASHA Worker / Health Assistant"
                            style={{
                              background: '#166534',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '16px',
                              padding: '4px 8px',
                              fontSize: '10px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Phone size={10} />
                            Contact
                          </button>
                        )}
                      </div>

                      {/* Services Highlights */}
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                          {t.services}:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {camp.servicesOffered.slice(0, 3).map((srv, idx) => (
                            <span
                              key={idx}
                              style={{
                                background: '#f1f5f9',
                                color: '#475569',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '10px',
                                fontWeight: 600,
                              }}
                            >
                              ✓ {srv}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Capacity Progress Bar */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>
                          <span style={{ color: '#475569' }}>
                            Capacity: {camp.registeredCount} / {camp.capacity} Registered
                          </span>
                          <span style={{ color: isFull ? '#dc2626' : '#0f766e' }}>
                            {isFull ? t.fullBadge : `${remaining} ${t.spotsLeft}`}
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${percentBooked}%`,
                              height: '100%',
                              background: isFull ? '#ef4444' : percentBooked > 80 ? '#f59e0b' : '#0f766e',
                              borderRadius: '3px',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                      </div>

                      {/* Action Button */}
                      {userReg ? (
                        <button
                          onClick={() => setViewPassModal({ registration: userReg.registration, camp })}
                          style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '12px',
                            border: '1px solid #0f766e',
                            background: '#f0fdf4',
                            color: '#0f766e',
                            fontWeight: 800,
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                          }}
                        >
                          <CheckCircle2 size={16} color="#16a34a" />
                          {t.viewTokenBtn}{userReg.registration.tokenNumber})
                        </button>
                      ) : isFull ? (
                        <button
                          disabled
                          style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '12px',
                            border: 'none',
                            background: '#e2e8f0',
                            color: '#94a3b8',
                            fontWeight: 800,
                            fontSize: '13px',
                            cursor: 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                          }}
                        >
                          <AlertCircle size={16} />
                          {t.fullBadge}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenRegister(camp)}
                          style={{
                            width: '100%',
                            padding: '11px',
                            borderRadius: '12px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #0f766e, #0d9488)',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: '13px',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(13, 148, 136, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                          }}
                        >
                          <Ticket size={16} />
                          {t.registerBtn}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* MY PASSES & TOKENS TAB */}
      {activeTab === 'my-passes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {myRegistrations.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px dashed #cbd5e1',
              }}
            >
              <Ticket size={40} color="#0f766e" style={{ margin: '0 auto 10px', opacity: 0.7 }} />
              <p style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b', margin: '0 0 6px' }}>
                {t.noPasses}
              </p>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px' }}>
                {t.browsePrompt}
              </p>
              <button
                onClick={() => setActiveTab('browse')}
                style={{
                  background: '#0f766e',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {t.browseTab}
              </button>
            </div>
          ) : (
            myRegistrations.map((item) => {
              const reg = item.registration;
              const camp = item.camp;
              if (!camp) return null;

              return (
                <div
                  key={reg.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #0f766e',
                    boxShadow: '0 4px 12px rgba(15, 118, 110, 0.12)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #0f766e, #0d9488)',
                      padding: '12px 14px',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Ticket size={18} />
                      <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.5px' }}>
                        HEALTH CAMP E-PASS
                      </span>
                    </div>
                    <div
                      style={{
                        background: '#ffffff',
                        color: '#0f766e',
                        padding: '3px 10px',
                        borderRadius: '14px',
                        fontSize: '13px',
                        fontWeight: 900,
                      }}
                    >
                      TOKEN #{reg.tokenNumber}
                    </div>
                  </div>

                  <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                        {camp.title}
                      </h4>
                      <p style={{ fontSize: '12px', color: '#475569', margin: 0 }}>
                        Participant: <strong>{reg.participantName}</strong> ({reg.participantAge} yrs, {reg.participantGender})
                      </p>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: '#334155' }}>
                      <div>📅 Date: <strong>{camp.startDate}</strong> ({camp.time})</div>
                      <div>📍 Venue: <strong>{camp.venue}</strong></div>
                      <div>🏥 Health Centre: {camp.phcName}</div>
                      <div>🩺 Assigned Doctor: {camp.assignedDoctorName}</div>
                      <div>👩‍⚕️ ASHA Coordinator: {camp.assignedAssistantName} ({camp.contactPhone})</div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button
                        onClick={() => {
                          setReminderToast(t.reminderSuccess);
                          setTimeout(() => setReminderToast(null), 3500);
                        }}
                        style={{
                          flex: 1,
                          background: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          color: '#334155',
                          padding: '8px 0',
                          borderRadius: '10px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                        }}
                      >
                        <BellRing size={13} />
                        Set Reminder
                      </button>

                      <button
                        onClick={() => handleShareCamp(camp)}
                        style={{
                          flex: 1,
                          background: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          color: '#334155',
                          padding: '8px 0',
                          borderRadius: '10px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                        }}
                      >
                        <Share2 size={13} />
                        Share Pass
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* REGISTRATION MODAL */}
      {isRegisterModalOpen && selectedCamp && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '440px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Ticket size={20} color="#0f766e" />
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  {regSuccessData ? t.successTitle : t.registerModalTitle}
                </h3>
              </div>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '16px' }}>
              {regSuccessData ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: '#dcfce7',
                      color: '#16a34a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckCircle2 size={36} />
                  </div>

                  <div>
                    <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#14532d', margin: '0 0 6px' }}>
                      {t.tokenNumber}: #{regSuccessData.camp?.tokenNumber || regSuccessData.registration?.tokenNumber}
                    </h4>
                    <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 10px' }}>
                      {t.successDesc}
                    </p>
                    <p style={{ fontSize: '12px', color: '#0f766e', fontWeight: 700, margin: 0 }}>
                      {t.showAtVenue}
                    </p>
                  </div>

                  <div
                    style={{
                      width: '100%',
                      background: '#f8fafc',
                      padding: '12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      textAlign: 'left',
                      color: '#334155',
                    }}
                  >
                    <div><strong>Camp:</strong> {selectedCamp.title}</div>
                    <div><strong>Date:</strong> {selectedCamp.startDate} ({selectedCamp.time})</div>
                    <div><strong>Venue:</strong> {selectedCamp.venue}</div>
                  </div>

                  <button
                    onClick={() => {
                      setIsRegisterModalOpen(false);
                      setActiveTab('my-passes');
                    }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '12px',
                      border: 'none',
                      background: '#0f766e',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    View in My Passes
                  </button>
                </div>
              ) : (
                <form onSubmit={handleConfirmRegistration} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ background: '#f0fdf4', padding: '10px 12px', borderRadius: '10px', border: '1px solid #bbf7d0', fontSize: '12px', color: '#166534' }}>
                    <strong>{selectedCamp.title}</strong>
                    <div style={{ fontSize: '11px', color: '#15803d', marginTop: '2px' }}>
                      📅 {selectedCamp.startDate} • 📍 {selectedCamp.venue}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      {t.fullName} *
                    </label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                        {t.phone} *
                      </label>
                      <input
                        type="tel"
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                        {t.age} *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="120"
                        value={regAge}
                        onChange={(e) => setRegAge(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      {t.gender}
                    </label>
                    <select
                      value={regGender}
                      onChange={(e) => setRegGender(e.target.value as any)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', background: '#ffffff' }}
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      {t.healthNotes}
                    </label>
                    <textarea
                      rows={2}
                      value={regNotes}
                      onChange={(e) => setRegNotes(e.target.value)}
                      placeholder="e.g. Eye irritation since 2 weeks, routine diabetes checkup"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box', resize: 'vertical' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #0f766e, #0d9488)',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '13px',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      marginTop: '8px',
                    }}
                  >
                    {submitting ? 'Registering...' : t.confirmRegisterBtn}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW PASS MODAL */}
      {viewPassModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '400px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, #0f766e, #0d9488)',
                padding: '14px',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Ticket size={20} />
                <span style={{ fontSize: '13px', fontWeight: 800 }}>HEALTH CAMP PASS</span>
              </div>
              <button
                onClick={() => setViewPassModal(null)}
                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', textAlign: 'center' }}>
              <div
                style={{
                  background: '#f0fdf4',
                  border: '2px dashed #0f766e',
                  borderRadius: '16px',
                  padding: '16px 24px',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#15803d' }}>YOUR OFFICIAL TOKEN</div>
                <div style={{ fontSize: '36px', fontWeight: 900, color: '#0f766e', lineHeight: 1.2 }}>
                  #{viewPassModal.registration.tokenNumber}
                </div>
                <div style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>
                  {viewPassModal.registration.participantName}
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                  {viewPassModal.camp.title}
                </h4>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                  📅 {viewPassModal.camp.startDate} ({viewPassModal.camp.time})
                </p>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>
                  📍 {viewPassModal.camp.venue}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                <button
                  onClick={() => handleShareCamp(viewPassModal.camp)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1px solid #0f766e',
                    background: '#ffffff',
                    color: '#0f766e',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Share Pass
                </button>
                <button
                  onClick={() => setViewPassModal(null)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#0f766e',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
