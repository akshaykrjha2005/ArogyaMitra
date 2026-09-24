import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Clock,
  Calendar,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  MessageSquare,
  Ticket,
  Stethoscope,
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  RefreshCw,
  User,
  CheckCircle2,
  AlertCircle,
  FileText,
  Tag,
  Share2,
  ArrowRight,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import {
  PatientProfile,
  PatientTimelineEvent,
  TimelineEventType,
  AppLanguage,
  resolveTranslationObject,
} from '@phc-connect/types';
import { apiClient } from '../services/api';

interface PatientTimelineScreenProps {
  patient: PatientProfile;
  onNavigate: (tab: string, extra?: any) => void;
  lang?: AppLanguage;
  initialFilter?: string;
}

export const PatientTimelineScreen: React.FC<PatientTimelineScreenProps> = ({
  patient,
  onNavigate,
  lang = 'en',
  initialFilter = 'ALL',
}) => {
  const [events, setEvents] = useState<PatientTimelineEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedFilter, setSelectedFilter] = useState<string>(initialFilter);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const t = resolveTranslationObject(lang, {
    en: {
      title: 'Care Timeline & History',
      subtitle: 'Complete chronological record of all calls, chats, tickets & visits',
      filterAll: 'All Activity',
      filterCalls: 'Voice Calls',
      filterChats: 'Assistant Chats',
      filterTickets: 'Support Tickets',
      filterConsults: 'Doctor Visits',
      filterCheckups: 'Vitals & Triage',
      filterGrievance: 'Grievances',
      searchPlaceholder: 'Search notes, diagnosis, staff name...',
      emptyTitle: 'No Timeline Events Found',
      emptySubtitle: 'No past activities match your selected filter.',
      refresh: 'Refresh',
      statsTotal: 'Total Records',
      statsCalls: 'Calls & Chats',
      statsTickets: 'Support Tickets',
      statsVisits: 'Doctor Visits',
      viewDetails: 'View Details',
      hideDetails: 'Hide Details',
      openChat: 'Open Live Chat',
      viewRecords: 'View Medical Record',
      actorRole: 'Attended by',
      notes: 'Notes / Advice',
      resolutionSummary: 'Resolution Summary',
      vitalsSummary: 'Vitals Recorded',
      prescriptions: 'Prescriptions',
    },
    hi: {
      title: 'देखभाल समयरेखा और इतिहास',
      subtitle: 'सभी कॉल, चैट, सपोर्ट टिकट और डॉक्टर परामर्श का संपूर्ण विवरण',
      filterAll: 'सभी गतिविधियां',
      filterCalls: 'वॉइस कॉल',
      filterChats: 'सहायक चैट',
      filterTickets: 'सपोर्ट टिकट',
      filterConsults: 'डॉक्टर परामर्श',
      filterCheckups: 'वाइटल्स व जांच',
      filterGrievance: 'शिकायतें',
      searchPlaceholder: 'नोट्स, निदान या स्वास्थ्य कर्मी खोजें...',
      emptyTitle: 'कोई गतिविधि नहीं मिली',
      emptySubtitle: 'चुने गए फ़िल्टर के अनुसार कोई रिकॉर्ड उपलब्ध नहीं है।',
      refresh: 'ताज़ा करें',
      statsTotal: 'कुल रिकॉर्ड्स',
      statsCalls: 'कॉल व चैट',
      statsTickets: 'सपोर्ट टिकट',
      statsVisits: 'डॉक्टर परामर्श',
      viewDetails: 'विवरण देखें',
      hideDetails: 'विवरण छुपाएं',
      openChat: 'चैट खोलें',
      viewRecords: 'दवा पर्चा देखें',
      actorRole: 'स्वास्थ्य कर्मी',
      notes: 'सलाह व नोट्स',
      resolutionSummary: 'समाधान सारांश',
      vitalsSummary: 'दर्ज किए गए वाइटल्स',
      prescriptions: 'दवाइयां',
    },
    kn: {
      title: 'ಆರೋಗ್ಯ ಇತಿಹಾಸ ಮತ್ತು ಟೈಮ್‌ಲೈನ್',
      subtitle: 'ಎಲ್ಲಾ ಕರೆಗಳು, ಚಾಟ್‌ಗಳು, ಟಿಕೆಟ್‌ಗಳು ಮತ್ತು ವೈದ್ಯರ ಭೇಟಿಗಳ ಸಂಪೂರ್ಣ ದಾಖಲೆ',
      filterAll: 'ಎಲ್ಲಾ ಚಟುವಟಿಕೆಗಳು',
      filterCalls: 'ಧ್ವನಿ ಕರೆಗಳು',
      filterChats: 'ಸಹಾಯಕ ಚಾಟ್',
      filterTickets: 'ಬೆಂಬಲ ಟಿಕೆಟ್‌ಗಳು',
      filterConsults: 'ವೈದ್ಯರ ಭೇಟಿ',
      filterCheckups: 'ಆರೋಗ್ಯ ತಪಾಸಣೆ',
      filterGrievance: 'ದೂರುಗಳು',
      searchPlaceholder: 'ಟಿಪ್ಪಣಿಗಳು, ರೋಗನಿರ್ಣಯ ಅಥವಾ ಸಿಬ್ಬಂದಿ ಹೆಸರು ಹುಡುಕಿ...',
      emptyTitle: 'ಯಾವುದೇ ಇತಿಹಾಸ ಕಂಡುಬಂದಿಲ್ಲ',
      emptySubtitle: 'ಆಯ್ಕೆಮಾಡಿದ ಫಿಲ್ಟರ್‌ಗೆ ಯಾವುದೇ ದಾಖಲೆಗಳು ಲಭ್ಯವಿಲ್ಲ.',
      refresh: 'ತಾಜಾಗೊಳಿಸಿ',
      statsTotal: 'ಒಟ್ಟು ದಾಖಲೆಗಳು',
      statsCalls: 'ಕರೆ ಮತ್ತು ಚಾಟ್',
      statsTickets: 'ಬೆಂಬಲ ಟಿಕೆಟ್',
      statsVisits: 'ವೈದ್ಯರ ಭೇಟಿ',
      viewDetails: 'ವಿವರಗಳನ್ನು ನೋಡಿ',
      hideDetails: 'ವಿವರ ಮರೆಮಾಡಿ',
      openChat: 'ಚಾಟ್ ತೆರೆಯಿರಿ',
      viewRecords: 'ರೆಕಾರ್ಡ್ ನೋಡಿ',
      actorRole: 'ಹಾಜರಾದ ಸಿಬ್ಬಂದಿ',
      notes: 'ಟಿಪ್ಪಣಿಗಳು ಮತ್ತು ಸಲಹೆ',
      resolutionSummary: 'ಪರಿಹಾರ ಸಾರಾಂಶ',
      vitalsSummary: 'ದಾಖಲಾದ ತಪಾಸಣೆ',
      prescriptions: 'ಔಷಧಿಗಳು',
    },
  });

  const loadTimeline = async (isRef: boolean = false) => {
    try {
      if (isRef) setRefreshing(true);
      else setLoading(true);

      const patientId = patient?.id || 'pat-0001';
      const res = await apiClient.get(`/patients/${patientId}/timeline`);

      if (res.success && res.timeline) {
        setEvents(res.timeline);
      }
    } catch (err) {
      console.error('Failed to load patient timeline:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTimeline();
  }, [patient?.id]);

  const toggleExpand = (id: string) => {
    setExpandedEventId((prev) => (prev === id ? null : id));
  };

  // Filter events
  const filteredEvents = events.filter((ev) => {
    // Type filter
    if (selectedFilter === 'VOICE_CALL' && ev.type !== 'VOICE_CALL') return false;
    if (selectedFilter === 'CHAT_SESSION' && ev.type !== 'CHAT_SESSION') return false;
    if (selectedFilter === 'SUPPORT_TICKET' && ev.type !== 'SUPPORT_TICKET') return false;
    if (selectedFilter === 'OPD_APPOINTMENT' && ev.type !== 'OPD_APPOINTMENT') return false;
    if (selectedFilter === 'PRE_CHECKUP' && ev.type !== 'PRE_CHECKUP') return false;
    if (selectedFilter === 'COMPLAINT_LOG' && ev.type !== 'COMPLAINT_LOG') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = ev.title.toLowerCase().includes(q);
      const matchDesc = ev.description?.toLowerCase().includes(q);
      const matchActor = ev.actorName?.toLowerCase().includes(q);
      const matchTags = ev.metadata?.tags?.some((t: string) => t.toLowerCase().includes(q));
      const matchNotes = ev.metadata?.doctorNotes?.toLowerCase().includes(q) || ev.metadata?.notes?.toLowerCase().includes(q);
      const matchDiagnosis = ev.metadata?.diagnosis?.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchActor || matchTags || matchNotes || matchDiagnosis;
    }

    return true;
  });

  const getEventIcon = (type: TimelineEventType) => {
    switch (type) {
      case 'VOICE_CALL':
        return <Phone size={18} color="#059669" />;
      case 'CHAT_SESSION':
      case 'CHAT_MESSAGE':
        return <MessageSquare size={18} color="#0284c7" />;
      case 'SUPPORT_TICKET':
        return <Ticket size={18} color="#d97706" />;
      case 'OPD_APPOINTMENT':
      case 'DOCTOR_ESCALATION':
        return <Stethoscope size={18} color="#7c3aed" />;
      case 'PRE_CHECKUP':
        return <Activity size={18} color="#e11d48" />;
      case 'COMPLAINT_LOG':
        return <AlertTriangle size={18} color="#dc2626" />;
      case 'SHARED_NOTE_UPDATE':
        return <FileText size={18} color="#0d9488" />;
      case 'PRESCRIPTION':
        return <FileText size={18} color="#16a34a" />;
      default:
        return <Clock size={18} color="#64748b" />;
    }
  };

  const getEventBadgeClass = (status?: string) => {
    switch (status) {
      case 'RESOLVED':
      case 'COMPLETED':
      case 'ANSWERED':
        return 'badge-status-green';
      case 'OPEN':
      case 'PENDING':
      case 'IN_PROGRESS':
        return 'badge-status-yellow';
      case 'ESCALATED':
      case 'CRITICAL':
      case 'HIGH':
        return 'badge-status-red';
      case 'MISSED':
      case 'CANCELLED':
        return 'badge-status-gray';
      default:
        return 'badge-status-blue';
    }
  };

  const formatEventDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return {
        date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      };
    } catch {
      return { date: 'Recent', time: '' };
    }
  };

  // Metrics
  const totalCallsChats = events.filter((e) => e.type === 'VOICE_CALL' || e.type === 'CHAT_SESSION').length;
  const totalTickets = events.filter((e) => e.type === 'SUPPORT_TICKET').length;
  const totalVisits = events.filter((e) => e.type === 'OPD_APPOINTMENT' || e.type === 'DOCTOR_ESCALATION').length;

  return (
    <div className="patient-timeline-view" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8fafc' }}>
      {/* Header Bar */}
      <div
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 30,
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => onNavigate('home')}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {t.title}
            </h2>
            <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
              {patient.fullName} • ID #{patient.patientId || patient.id || 'PHC-PAT-2026-0042'}
            </p>
          </div>
        </div>

        <button
          onClick={() => loadTimeline(true)}
          disabled={refreshing}
          style={{
            background: '#f0fdfa',
            border: '1px solid #99f6e4',
            borderRadius: '20px',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 700,
            color: '#0f766e',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={13} className={refreshing ? 'spin-icon' : ''} />
          <span>{t.refresh}</span>
        </button>
      </div>

      {/* Scrollable Container */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {/* Stats Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #0f766e, #0d9488)',
              borderRadius: '14px',
              padding: '12px',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(13, 148, 136, 0.18)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.9, fontSize: '11px', fontWeight: 600 }}>
              <MessageSquare size={13} />
              <span>{t.statsCalls}</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px' }}>{totalCallsChats}</div>
          </div>

          <div
            style={{
              background: 'linear-gradient(135deg, #d97706, #b45309)',
              borderRadius: '14px',
              padding: '12px',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(217, 119, 6, 0.18)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.9, fontSize: '11px', fontWeight: 600 }}>
              <Ticket size={13} />
              <span>{t.statsTickets}</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px' }}>{totalTickets}</div>
          </div>

          <div
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
              borderRadius: '14px',
              padding: '12px',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(124, 58, 237, 0.18)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.9, fontSize: '11px', fontWeight: 600 }}>
              <Stethoscope size={13} />
              <span>{t.statsVisits}</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px' }}>{totalVisits}</div>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', marginBottom: '14px' }}>
          <Search
            size={16}
            color="#94a3b8"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px 12px 10px 38px',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              background: '#ffffff',
              outline: 'none',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '8px',
            marginBottom: '16px',
            scrollbarWidth: 'none',
          }}
        >
          {[
            { id: 'ALL', label: t.filterAll },
            { id: 'VOICE_CALL', label: t.filterCalls },
            { id: 'CHAT_SESSION', label: t.filterChats },
            { id: 'SUPPORT_TICKET', label: t.filterTickets },
            { id: 'OPD_APPOINTMENT', label: t.filterConsults },
            { id: 'PRE_CHECKUP', label: t.filterCheckups },
            { id: 'COMPLAINT_LOG', label: t.filterGrievance },
          ].map((flt) => {
            const isActive = selectedFilter === flt.id;
            return (
              <button
                key={flt.id}
                onClick={() => setSelectedFilter(flt.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: isActive ? '1px solid #0d9488' : '1px solid #e2e8f0',
                  background: isActive ? '#0d9488' : '#ffffff',
                  color: isActive ? '#ffffff' : '#475569',
                  fontSize: '12px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 2px 6px rgba(13, 148, 136, 0.2)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {flt.label}
              </button>
            );
          })}
        </div>

        {/* Timeline Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
            <RefreshCw size={24} className="spin-icon" style={{ margin: '0 auto 12px auto', color: '#0d9488' }} />
            <p style={{ fontSize: '13px', fontWeight: 600 }}>Aggregating care timeline across calls, chats & PHC records...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredEvents.length === 0 && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '36px 20px',
              textAlign: 'center',
              border: '1px dashed #cbd5e1',
              margin: '20px 0',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto',
              }}
            >
              <Clock size={24} color="#94a3b8" />
            </div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', margin: '0 0 4px 0' }}>
              {t.emptyTitle}
            </h4>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px 0' }}>
              {t.emptySubtitle}
            </p>
            {selectedFilter !== 'ALL' && (
              <button
                onClick={() => setSelectedFilter('ALL')}
                style={{
                  background: '#f0fdfa',
                  border: '1px solid #99f6e4',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#0f766e',
                  cursor: 'pointer',
                }}
              >
                Show All Activity
              </button>
            )}
          </div>
        )}

        {/* Timeline Events Feed */}
        {!loading && filteredEvents.length > 0 && (
          <div style={{ position: 'relative', paddingLeft: '28px', marginBottom: '24px' }}>
            {/* Continuous Vertical Guide Line */}
            <div
              style={{
                position: 'absolute',
                left: '11px',
                top: '12px',
                bottom: '12px',
                width: '2px',
                background: '#e2e8f0',
                zIndex: 1,
              }}
            />

            {filteredEvents.map((ev, index) => {
              const { date, time } = formatEventDate(ev.timestamp);
              const isExpanded = expandedEventId === ev.id;

              return (
                <div key={ev.id} style={{ position: 'relative', marginBottom: '20px', zIndex: 2 }}>
                  {/* Timeline Dot Icon */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '-28px',
                      top: '10px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      border: '2px solid #cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                      zIndex: 3,
                    }}
                  >
                    {getEventIcon(ev.type)}
                  </div>

                  {/* Event Card */}
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: '14px',
                      border: '1px solid #e2e8f0',
                      padding: '14px',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {/* Top Row: Date & Status Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                        <Calendar size={12} color="#0d9488" />
                        <span>{date}</span>
                        {time && <span>• {time}</span>}
                      </div>

                      {(ev.badgeText || ev.metadata?.status) && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background:
                              (ev.badgeText || ev.metadata?.status) === 'RESOLVED' || (ev.badgeText || ev.metadata?.status) === 'COMPLETED' || (ev.badgeText || ev.metadata?.status) === 'ANSWERED'
                                ? '#dcfce7'
                                : (ev.badgeText || ev.metadata?.status) === 'ESCALATED' || (ev.badgeText || ev.metadata?.status) === 'CRITICAL' || (ev.badgeText || ev.metadata?.status) === 'HIGH'
                                ? '#fee2e2'
                                : '#fef3c7',
                            color:
                              (ev.badgeText || ev.metadata?.status) === 'RESOLVED' || (ev.badgeText || ev.metadata?.status) === 'COMPLETED' || (ev.badgeText || ev.metadata?.status) === 'ANSWERED'
                                ? '#166534'
                                : (ev.badgeText || ev.metadata?.status) === 'ESCALATED' || (ev.badgeText || ev.metadata?.status) === 'CRITICAL' || (ev.badgeText || ev.metadata?.status) === 'HIGH'
                                ? '#991b1b'
                                : '#92400e',
                          }}
                        >
                          {ev.badgeText || ev.metadata?.status}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
                      {ev.title}
                    </h3>

                    {/* Description */}
                    {ev.description && (
                      <p style={{ fontSize: '12px', color: '#475569', margin: '0 0 10px 0', lineHeight: '1.45' }}>
                        {ev.description}
                      </p>
                    )}

                    {/* Attended by / Staff info */}
                    {ev.actorName && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#f8fafc',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          color: '#334155',
                          marginBottom: '10px',
                        }}
                      >
                        <User size={13} color="#0f766e" />
                        <span style={{ fontWeight: 600 }}>{t.actorRole}:</span>
                        <strong>{ev.actorName}</strong>
                        {ev.actorRole && (
                          <span style={{ color: '#64748b' }}>({ev.actorRole})</span>
                        )}
                      </div>
                    )}

                    {/* Tags preview if support ticket */}
                    {ev.metadata?.tags && ev.metadata.tags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
                        {ev.metadata.tags.map((tg: string, i: number) => (
                          <span
                            key={i}
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              background: '#f1f5f9',
                              color: '#475569',
                              padding: '2px 7px',
                              borderRadius: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}
                          >
                            <Tag size={10} /> {tg}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Expandable Extra Details */}
                    {isExpanded && (
                      <div
                        style={{
                          marginTop: '10px',
                          paddingTop: '10px',
                          borderTop: '1px dashed #e2e8f0',
                          fontSize: '12px',
                          color: '#334155',
                        }}
                      >
                        {/* Resolution Summary */}
                        {ev.metadata?.resolutionSummary && (
                          <div style={{ marginBottom: '8px', background: '#f0fdf4', padding: '8px 10px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                            <strong style={{ color: '#166534', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                              <CheckCircle2 size={13} /> {t.resolutionSummary}:
                            </strong>
                            <p style={{ margin: 0, color: '#14532d', fontSize: '11px' }}>
                              {ev.metadata.resolutionSummary}
                            </p>
                          </div>
                        )}

                        {/* Vitals */}
                        {ev.metadata?.vitals && (
                          <div style={{ marginBottom: '8px', background: '#fff1f2', padding: '8px 10px', borderRadius: '8px', border: '1px solid #fecdd3' }}>
                            <strong style={{ color: '#9f1239', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                              <Activity size={13} /> {t.vitalsSummary}:
                            </strong>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '11px', color: '#881337' }}>
                              {ev.metadata.vitals.bpSystolic && (
                                <span>BP: <strong>{ev.metadata.vitals.bpSystolic}/{ev.metadata.vitals.bpDiastolic} mmHg</strong></span>
                              )}
                              {ev.metadata.vitals.bodyTemperature && (
                                <span>Temp: <strong>{ev.metadata.vitals.bodyTemperature} °F</strong></span>
                              )}
                              {ev.metadata.bmi && (
                                <span>BMI: <strong>{ev.metadata.bmi} ({ev.metadata.bmiCategory})</strong></span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Doctor Diagnosis & Prescriptions */}
                        {ev.metadata?.diagnosis && (
                          <div style={{ marginBottom: '8px', background: '#faf5ff', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e9d5ff' }}>
                            <strong style={{ color: '#6b21a8', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                              <Stethoscope size={13} /> Clinical Diagnosis:
                            </strong>
                            <p style={{ margin: 0, color: '#581c87', fontSize: '11px', fontWeight: 600 }}>
                              {ev.metadata.diagnosis}
                            </p>
                            {ev.metadata.prescriptionsCount !== undefined && (
                              <p style={{ margin: '4px 0 0 0', color: '#6b21a8', fontSize: '11px' }}>
                                Prescribed Medicines: <strong>{ev.metadata.prescriptionsCount} items</strong>
                              </p>
                            )}
                          </div>
                        )}

                        {/* Call Duration / Outcome */}
                        {ev.metadata?.durationSeconds !== undefined && (
                          <div style={{ marginBottom: '8px', fontSize: '11px', color: '#64748b' }}>
                            Call Duration: <strong>{Math.floor(ev.metadata.durationSeconds / 60)}m {ev.metadata.durationSeconds % 60}s</strong>
                            {ev.metadata.outcome && <span> • Outcome: <strong>{ev.metadata.outcome}</strong></span>}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                          {ev.type === 'CHAT_SESSION' && (
                            <button
                              onClick={() => onNavigate('assistant-chat', { assistantId: ev.metadata?.actorId || ev.linkId })}
                              style={{
                                flex: 1,
                                background: '#0d9488',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '6px 10px',
                                fontSize: '11px',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px',
                                cursor: 'pointer',
                              }}
                            >
                              <MessageSquare size={13} /> {t.openChat}
                            </button>
                          )}

                          {(ev.type === 'OPD_APPOINTMENT' || ev.type === 'PRESCRIPTION') && (
                            <button
                              onClick={() => onNavigate('records')}
                              style={{
                                flex: 1,
                                background: '#7c3aed',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '6px 10px',
                                fontSize: '11px',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px',
                                cursor: 'pointer',
                              }}
                            >
                              <FileText size={13} /> {t.viewRecords}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Toggle Expand Button */}
                    <button
                      onClick={() => toggleExpand(ev.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: '4px 0 0 0',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#0d9488',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      <span>{isExpanded ? t.hideDetails : t.viewDetails}</span>
                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
