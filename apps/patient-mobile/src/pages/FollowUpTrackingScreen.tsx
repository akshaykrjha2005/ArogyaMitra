import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  Calendar,
  Clock,
  MapPin,
  Phone,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Pill,
  ArrowLeft,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Stethoscope,
  Building2,
  Bell,
  ArrowRight,
  Activity,
  User,
  ShieldCheck,
} from 'lucide-react';
import {
  PatientFollowUpEntry,
  FollowUpTimelineEvent,
  PatientProfile,
  AppLanguage,
  PatientConditionState,
  MedicationAdherenceLevel,
  resolveTranslationObject,
} from '@phc-connect/types';
import { apiClient } from '../services/api';

interface FollowUpTrackingScreenProps {
  patient?: PatientProfile | null;
  onNavigate?: (tab: string, extra?: any) => void;
  onBack?: () => void;
  lang?: AppLanguage;
  initialPatientId?: string;
}

export const FollowUpTrackingScreen: React.FC<FollowUpTrackingScreenProps> = ({
  patient,
  onNavigate,
  onBack,
  lang = 'en',
  initialPatientId,
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'log' | 'cases'>('timeline');
  const [followUps, setFollowUps] = useState<PatientFollowUpEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<PatientFollowUpEntry | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [villageFilter, setVillageFilter] = useState<string>('ALL');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State for ASHA Field Log
  const [targetFollowUpId, setTargetFollowUpId] = useState<string>('');
  const [visitDate, setVisitDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [conditionUpdate, setConditionUpdate] = useState<PatientConditionState>('STABLE');
  const [vitalBp, setVitalBp] = useState<string>('120/80');
  const [vitalPulse, setVitalPulse] = useState<number>(76);
  const [vitalSpo2, setVitalSpo2] = useState<number>(98);
  const [vitalSugar, setVitalSugar] = useState<number>(110);
  const [adherenceRate, setAdherenceRate] = useState<MedicationAdherenceLevel>('FULL');
  const [medicinesVerified, setMedicinesVerified] = useState<string>('');
  const [nextVisitDate, setNextVisitDate] = useState<string>(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [ashaNotes, setAshaNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const t = resolveTranslationObject(lang, {
    en: {
      title: 'Follow-up & Referral Tracking',
      subtitle: 'Shared continuity between ASHA and Higher PHC',
      tabTimeline: 'Care Timeline',
      tabLog: 'Log ASHA Visit',
      tabCases: 'All Active Cases',
      pending: 'Pending Visit',
      overdue: 'Overdue Visit',
      completed: 'Completed',
      dueDate: 'Scheduled Due:',
      visitedDate: 'Visited On:',
      nextVisit: 'Next Checkup:',
      vitals: 'Latest Vitals',
      adherence: 'Med Adherence:',
      medicines: 'Prescribed Medicines',
      referralRoute: 'Referral Route',
      hospitalStatus: 'Hospital Treatment Status',
      ashaWorker: 'ASHA Worker',
      submitLog: 'Submit Follow-up Record',
      logSuccess: 'Follow-up visit successfully logged and synced with Higher PHC!',
      filterVillage: 'Filter Village',
      filterStatus: 'Filter Status',
      noRecords: 'No referral follow-up records found.',
      back: 'Back',
      remindAsha: 'Send Due Reminders',
    },
    hi: {
      title: 'फॉलो-अप और रेफरल ट्रैकिंग',
      subtitle: 'आशा कार्यकर्ता और उच्च स्वास्थ्य केंद्र की संयुक्त देखभाल',
      tabTimeline: 'देखभाल समयरेखा',
      tabLog: 'आशा विजिट दर्ज करें',
      tabCases: 'सभी सक्रिय मामले',
      pending: 'लंबित विजिट',
      overdue: 'अतिदेय विजिट (ओवरड्यू)',
      completed: 'पूर्ण',
      dueDate: 'नियत तिथि:',
      visitedDate: 'विजिट तिथि:',
      nextVisit: 'अगली जांच तिथि:',
      vitals: 'ताज़ा वाइटल्स',
      adherence: 'दवा सेवन नियमितता:',
      medicines: 'निर्धारित दवाएं',
      referralRoute: 'रेफरल मार्ग',
      hospitalStatus: 'अस्पताल उपचार स्थिति',
      ashaWorker: 'आशा कार्यकर्ता',
      submitLog: 'फॉलो-अप रिकॉर्ड सहेजें',
      logSuccess: 'फॉलो-अप विजिट सफलतापूर्वक दर्ज की गई व रिकॉर्ड अपडेट हुआ!',
      filterVillage: 'गांव चुनें',
      filterStatus: 'स्थिति चुनें',
      noRecords: 'कोई फॉलो-अप रिकॉर्ड नहीं मिला।',
      back: 'पीछे',
      remindAsha: 'अनुस्मारक भेजें',
    },
  });

  const loadFollowUps = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/follow-ups', {
        status: statusFilter,
        village: villageFilter,
      });

      if (res?.success && res.followUps) {
        setFollowUps(res.followUps);
        if (res.followUps.length > 0) {
          // If initialPatientId or patient?.id is available, find matching
          const match = initialPatientId || patient?.id
            ? res.followUps.find((f: PatientFollowUpEntry) => f.patientId === (initialPatientId || patient?.id))
            : null;
          setSelectedEntry(match || res.followUps[0]);
          setTargetFollowUpId(match?.id || res.followUps[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load follow-ups:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFollowUps();
  }, [statusFilter, villageFilter]);

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetFollowUpId) return;

    setIsSubmitting(true);
    try {
      const medsArray = medicinesVerified
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean);

      const payload = {
        id: targetFollowUpId,
        followUpDate: visitDate,
        conditionUpdate,
        vitals: {
          bp: vitalBp,
          pulse: Number(vitalPulse) || 76,
          spO2: Number(vitalSpo2) || 98,
          bloodSugar: Number(vitalSugar) || 110,
        },
        medicinesTaken: medsArray,
        adherenceRate,
        nextVisitDate: nextVisitDate || undefined,
        notes: ashaNotes,
      };

      const res = await apiClient.post('/follow-ups', payload);
      if (res?.success) {
        setSuccessMsg(t.logSuccess);
        setTimeout(() => setSuccessMsg(null), 4000);
        setAshaNotes('');
        loadFollowUps();
        setActiveTab('timeline');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const uniqueVillages = Array.from(new Set(followUps.map((f) => f.patientVillage).filter(Boolean)));

  return (
    <div className="mobile-screen-container" style={{ padding: '16px', paddingBottom: '90px', color: '#ffffff' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              color: '#ffffff',
              padding: '8px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
            {t.title}
          </h1>
          <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0 0' }}>
            {t.subtitle}
          </p>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div
          style={{
            backgroundColor: '#059669',
            color: '#ffffff',
            padding: '12px 14px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tab Switcher */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '6px',
          backgroundColor: '#0f172a',
          padding: '4px',
          borderRadius: '12px',
          marginBottom: '16px',
        }}
      >
        <button
          onClick={() => setActiveTab('timeline')}
          style={{
            backgroundColor: activeTab === 'timeline' ? '#0284c7' : 'transparent',
            border: 'none',
            color: activeTab === 'timeline' ? '#ffffff' : '#94a3b8',
            padding: '8px 4px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          {t.tabTimeline}
        </button>

        <button
          onClick={() => setActiveTab('log')}
          style={{
            backgroundColor: activeTab === 'log' ? '#0d9488' : 'transparent',
            border: 'none',
            color: activeTab === 'log' ? '#ffffff' : '#94a3b8',
            padding: '8px 4px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          {t.tabLog}
        </button>

        <button
          onClick={() => setActiveTab('cases')}
          style={{
            backgroundColor: activeTab === 'cases' ? '#6366f1' : 'transparent',
            border: 'none',
            color: activeTab === 'cases' ? '#ffffff' : '#94a3b8',
            padding: '8px 4px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          {t.tabCases}
        </button>
      </div>

      {/* TAB 1: Patient Care Timeline */}
      {activeTab === 'timeline' && (
        <div>
          {/* Patient Selector Dropdown if multiple cases */}
          {followUps.length > 1 && (
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Select Active Patient Referral:
              </label>
              <select
                value={selectedEntry?.id || ''}
                onChange={(e) => {
                  const match = followUps.find((f) => f.id === e.target.value);
                  if (match) setSelectedEntry(match);
                }}
                style={{
                  width: '100%',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  color: '#ffffff',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  fontSize: '13px',
                }}
              >
                {followUps.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.patientName} ({f.condition}) - {f.patientVillage} [{f.status}]
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedEntry ? (
            <div>
              {/* Selected Patient Card */}
              <div
                style={{
                  backgroundColor: '#1e293b',
                  border: selectedEntry.status === 'OVERDUE' ? '1px solid #ef4444' : '1px solid #334155',
                  borderRadius: '14px',
                  padding: '16px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                      {selectedEntry.patientName}
                    </h2>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {selectedEntry.patientAge}y, {selectedEntry.patientGender} • {selectedEntry.patientVillage}
                    </span>
                  </div>

                  <span
                    style={{
                      backgroundColor:
                        selectedEntry.status === 'OVERDUE'
                          ? '#ef444425'
                          : selectedEntry.status === 'COMPLETED'
                          ? '#10b98125'
                          : '#f59e0b25',
                      color:
                        selectedEntry.status === 'OVERDUE'
                          ? '#f87171'
                          : selectedEntry.status === 'COMPLETED'
                          ? '#34d399'
                          : '#fbbf24',
                      border: `1px solid ${
                        selectedEntry.status === 'OVERDUE'
                          ? '#ef4444'
                          : selectedEntry.status === 'COMPLETED'
                          ? '#10b981'
                          : '#f59e0b'
                      }`,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                    }}
                  >
                    {selectedEntry.status}
                  </span>
                </div>

                {/* Condition & Route */}
                <div style={{ marginTop: '10px', fontSize: '12px' }}>
                  <div style={{ color: '#fbbf24', fontWeight: 700 }}>
                    🎯 {selectedEntry.condition}
                  </div>
                  <div style={{ color: '#94a3b8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{selectedEntry.referringPhcName}</span>
                    <ArrowRight size={12} color="#38bdf8" />
                    <span style={{ color: '#38bdf8' }}>{selectedEntry.higherPhcName}</span>
                  </div>
                </div>

                {/* Key Dates Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '8px',
                    backgroundColor: '#0f172a',
                    padding: '10px',
                    borderRadius: '10px',
                    marginTop: '12px',
                    fontSize: '11px',
                  }}
                >
                  <div>
                    <span style={{ color: '#64748b' }}>{t.dueDate} </span>
                    <strong style={{ color: selectedEntry.status === 'OVERDUE' ? '#f87171' : '#ffffff' }}>
                      {selectedEntry.scheduledDueDate}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>{t.nextVisit} </span>
                    <strong style={{ color: '#38bdf8' }}>
                      {selectedEntry.nextVisitDate || 'Scheduled after visit'}
                    </strong>
                  </div>
                </div>

                {/* Latest Vitals */}
                {selectedEntry.vitals && (
                  <div style={{ marginTop: '12px' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>{t.vitals}</span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginTop: '4px' }}>
                      <div style={{ backgroundColor: '#0f172a', padding: '4px 6px', borderRadius: '6px', fontSize: '10px' }}>
                        BP: <strong style={{ color: '#ffffff' }}>{selectedEntry.vitals.bp}</strong>
                      </div>
                      <div style={{ backgroundColor: '#0f172a', padding: '4px 6px', borderRadius: '6px', fontSize: '10px' }}>
                        Pulse: <strong style={{ color: '#ffffff' }}>{selectedEntry.vitals.pulse}</strong>
                      </div>
                      <div style={{ backgroundColor: '#0f172a', padding: '4px 6px', borderRadius: '6px', fontSize: '10px' }}>
                        SpO2: <strong style={{ color: '#ffffff' }}>{selectedEntry.vitals.spO2}%</strong>
                      </div>
                      <div style={{ backgroundColor: '#0f172a', padding: '4px 6px', borderRadius: '6px', fontSize: '10px' }}>
                        Sugar: <strong style={{ color: '#ffffff' }}>{selectedEntry.vitals.bloodSugar}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Vertical Care Timeline */}
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', marginBottom: '12px' }}>
                Chronological Care Timeline
              </h3>

              <div style={{ position: 'relative', paddingLeft: '20px' }}>
                <div
                  style={{
                    position: 'absolute',
                    top: '8px',
                    bottom: '8px',
                    left: '6px',
                    width: '2px',
                    backgroundColor: '#334155',
                  }}
                />

                {selectedEntry.timeline?.map((evt, idx) => {
                  const isDoctor = evt.role === 'DOCTOR';
                  const isAsha = evt.role === 'HEALTH_ASSISTANT';
                  const dotColor = isDoctor ? '#38bdf8' : isAsha ? '#10b981' : '#f59e0b';

                  return (
                    <div key={evt.id || idx} style={{ position: 'relative', marginBottom: '16px' }}>
                      <div
                        style={{
                          position: 'absolute',
                          left: '-20px',
                          top: '4px',
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          backgroundColor: '#1e293b',
                          border: `3px solid ${dotColor}`,
                        }}
                      />

                      <div
                        style={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '10px',
                          padding: '10px 12px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                            {evt.title}
                          </span>
                          <span style={{ fontSize: '10px', color: '#64748b' }}>
                            {new Date(evt.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p style={{ fontSize: '11px', color: '#cbd5e1', margin: '4px 0 6px 0' }}>
                          {evt.description}
                        </p>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                          <span style={{ color: dotColor, fontWeight: 700 }}>
                            {isDoctor ? '👨‍⚕️ Higher PHC Specialist' : isAsha ? '👩‍⚕️ ASHA Worker' : '🤖 System Alert'}
                          </span>
                          {' • '}
                          {evt.performedBy}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
              <p>{t.noRecords}</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ASHA Field Follow-up Log Form */}
      {activeTab === 'log' && (
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', margin: '0 0 12px 0' }}>
            {t.tabLog} (Home Visit)
          </h2>

          <form onSubmit={handleLogSubmit}>
            {/* Select Target Referral */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Select Patient Record *
              </label>
              <select
                value={targetFollowUpId}
                onChange={(e) => {
                  setTargetFollowUpId(e.target.value);
                  const sel = followUps.find((f) => f.id === e.target.value);
                  if (sel) {
                    setMedicinesVerified(sel.medicinesTaken ? sel.medicinesTaken.join(', ') : '');
                  }
                }}
                required
                style={{
                  width: '100%',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  color: '#ffffff',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              >
                <option value="">-- Choose Patient --</option>
                {followUps.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.patientName} - {f.patientVillage} ({f.condition})
                  </option>
                ))}
              </select>
            </div>

            {/* Visit Date & Condition */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Visit Date
                </label>
                <input
                  type="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    color: '#ffffff',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Condition Update
                </label>
                <select
                  value={conditionUpdate}
                  onChange={(e) => setConditionUpdate(e.target.value as any)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    color: '#ffffff',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                >
                  <option value="IMPROVED">🟢 Improved</option>
                  <option value="STABLE">🔵 Stable</option>
                  <option value="DETERIORATING">🟠 Deteriorating</option>
                  <option value="CRITICAL">🔴 Critical</option>
                  <option value="RECOVERED">🌟 Recovered</option>
                </select>
              </div>
            </div>

            {/* Vitals */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Recorded Vitals
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                <div>
                  <span style={{ fontSize: '9px', color: '#94a3b8' }}>BP</span>
                  <input
                    type="text"
                    value={vitalBp}
                    onChange={(e) => setVitalBp(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      color: '#ffffff',
                      padding: '4px 6px',
                      borderRadius: '6px',
                      fontSize: '11px',
                    }}
                  />
                </div>
                <div>
                  <span style={{ fontSize: '9px', color: '#94a3b8' }}>Pulse</span>
                  <input
                    type="number"
                    value={vitalPulse}
                    onChange={(e) => setVitalPulse(Number(e.target.value))}
                    style={{
                      width: '100%',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      color: '#ffffff',
                      padding: '4px 6px',
                      borderRadius: '6px',
                      fontSize: '11px',
                    }}
                  />
                </div>
                <div>
                  <span style={{ fontSize: '9px', color: '#94a3b8' }}>SpO2%</span>
                  <input
                    type="number"
                    value={vitalSpo2}
                    onChange={(e) => setVitalSpo2(Number(e.target.value))}
                    style={{
                      width: '100%',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      color: '#ffffff',
                      padding: '4px 6px',
                      borderRadius: '6px',
                      fontSize: '11px',
                    }}
                  />
                </div>
                <div>
                  <span style={{ fontSize: '9px', color: '#94a3b8' }}>Sugar</span>
                  <input
                    type="number"
                    value={vitalSugar}
                    onChange={(e) => setVitalSugar(Number(e.target.value))}
                    style={{
                      width: '100%',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      color: '#ffffff',
                      padding: '4px 6px',
                      borderRadius: '6px',
                      fontSize: '11px',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Adherence & Next Visit */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Medicine Adherence
                </label>
                <select
                  value={adherenceRate}
                  onChange={(e) => setAdherenceRate(e.target.value as any)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    color: '#ffffff',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                >
                  <option value="FULL">✅ Full Doses</option>
                  <option value="PARTIAL">⚠️ Partial</option>
                  <option value="NON_ADHERENT">❌ Non-Adherent</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Next Visit Date
                </label>
                <input
                  type="date"
                  value={nextVisitDate}
                  onChange={(e) => setNextVisitDate(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    color: '#ffffff',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </div>
            </div>

            {/* Medicines verified */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Medicines Checked at Home
              </label>
              <input
                type="text"
                value={medicinesVerified}
                onChange={(e) => setMedicinesVerified(e.target.value)}
                placeholder="e.g. Tab Aspirin 75mg, Tab Metformin 500mg"
                style={{
                  width: '100%',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  color: '#ffffff',
                  padding: '6px 8px',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
            </div>

            {/* Notes */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Field Notes & Patient Symptoms
              </label>
              <textarea
                rows={2}
                value={ashaNotes}
                onChange={(e) => setAshaNotes(e.target.value)}
                placeholder="Observed condition, diet advice, family feedback..."
                style={{
                  width: '100%',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  color: '#ffffff',
                  padding: '6px 8px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  resize: 'vertical',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #0d9488, #059669)',
                border: 'none',
                color: '#ffffff',
                padding: '10px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {isSubmitting ? 'Saving...' : t.submitLog}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: All Active Cases */}
      {activeTab === 'cases' && (
        <div>
          {/* Quick Filter row */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', overflowX: 'auto', paddingBottom: '4px' }}>
            {['ALL', 'OVERDUE', 'PENDING', 'COMPLETED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  backgroundColor: statusFilter === st ? '#0284c7' : '#1e293b',
                  border: '1px solid #334155',
                  color: statusFilter === st ? '#ffffff' : '#94a3b8',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {st}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {followUps.map((entry) => (
              <div
                key={entry.id}
                onClick={() => {
                  setSelectedEntry(entry);
                  setActiveTab('timeline');
                }}
                style={{
                  backgroundColor: '#1e293b',
                  border: entry.status === 'OVERDUE' ? '1px solid #ef4444' : '1px solid #334155',
                  borderRadius: '12px',
                  padding: '12px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                    {entry.patientName}
                  </h4>
                  <span
                    style={{
                      backgroundColor:
                        entry.status === 'OVERDUE'
                          ? '#ef444425'
                          : entry.status === 'COMPLETED'
                          ? '#10b98125'
                          : '#f59e0b25',
                      color:
                        entry.status === 'OVERDUE'
                          ? '#f87171'
                          : entry.status === 'COMPLETED'
                          ? '#34d399'
                          : '#fbbf24',
                      padding: '2px 6px',
                      borderRadius: '8px',
                      fontSize: '9px',
                      fontWeight: 800,
                    }}
                  >
                    {entry.status}
                  </span>
                </div>

                <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '4px' }}>
                  <span style={{ color: '#fbbf24' }}>{entry.condition}</span> • {entry.patientVillage}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '10px', color: '#94a3b8' }}>
                  <span>Due: {entry.scheduledDueDate}</span>
                  <span style={{ color: '#38bdf8' }}>Tap to view timeline ➔</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default FollowUpTrackingScreen;
