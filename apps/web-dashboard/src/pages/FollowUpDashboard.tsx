import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  Clock,
  MapPin,
  Phone,
  User,
  Activity,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
  Pill,
  Download,
  Bell,
  Search,
  Filter,
  RefreshCw,
  Plus,
  ArrowRight,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Stethoscope,
  Building2,
  TrendingUp,
  X,
  Thermometer,
  Wind,
  Droplets,
  AlertCircle,
  HelpCircle,
  Check,
} from 'lucide-react';
import {
  PatientFollowUpEntry,
  FollowUpTimelineEvent,
  FollowUpStatus,
  PatientConditionState,
  ReferralTreatmentStatus,
  MedicationAdherenceLevel,
  FollowUpAnalyticsMetrics,
  PHC,
} from '@phc-connect/types';
import { apiClient } from '../services/api';

interface FollowUpDashboardProps {
  currentFacilityId?: string;
  userRole?: string;
  userId?: string;
  userName?: string;
}

export const FollowUpDashboard: React.FC<FollowUpDashboardProps> = ({
  currentFacilityId = 'phc-001',
  userRole = 'DOCTOR',
  userId = 'doc-001',
  userName = 'Dr. Rajesh Kumar',
}) => {
  const [followUps, setFollowUps] = useState<PatientFollowUpEntry[]>([]);
  const [metrics, setMetrics] = useState<FollowUpAnalyticsMetrics | null>(null);
  const [phcs, setPhcs] = useState<PHC[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [villageFilter, setVillageFilter] = useState<string>('ALL');
  const [conditionFilter, setConditionFilter] = useState<string>('ALL');
  const [treatmentStatusFilter, setTreatmentStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [selectedForLog, setSelectedForLog] = useState<PatientFollowUpEntry | null>(null);
  const [selectedForTreatment, setSelectedForTreatment] = useState<PatientFollowUpEntry | null>(null);
  const [selectedForTimeline, setSelectedForTimeline] = useState<PatientFollowUpEntry | null>(null);
  const [showNewReferralModal, setShowNewReferralModal] = useState<boolean>(false);

  // Toast / notification
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Form states for ASHA Follow-up Log
  const [logDate, setLogDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [logCondition, setLogCondition] = useState<PatientConditionState>('STABLE');
  const [logBp, setLogBp] = useState<string>('120/80');
  const [logPulse, setLogPulse] = useState<number>(76);
  const [logSpO2, setLogSpO2] = useState<number>(98);
  const [logSugar, setLogSugar] = useState<number>(110);
  const [logAdherence, setLogAdherence] = useState<MedicationAdherenceLevel>('FULL');
  const [logMedicines, setLogMedicines] = useState<string>('');
  const [logNextVisitDate, setLogNextVisitDate] = useState<string>('');
  const [logNotes, setLogNotes] = useState<string>('');

  // Form states for Higher PHC Treatment Update
  const [docTreatmentStatus, setDocTreatmentStatus] = useState<ReferralTreatmentStatus>('UNDER_TREATMENT');
  const [docNotes, setDocNotes] = useState<string>('');
  const [docMedicines, setDocMedicines] = useState<string>('');
  const [docName, setDocName] = useState<string>(userName);

  // Form states for New Referral Creation
  const [newPatientName, setNewPatientName] = useState<string>('');
  const [newPatientAge, setNewPatientAge] = useState<number>(45);
  const [newPatientGender, setNewPatientGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('FEMALE');
  const [newPatientPhone, setNewPatientPhone] = useState<string>('+91 98765 ');
  const [newPatientAbha, setNewPatientAbha] = useState<string>('91-4567-8901-2345');
  const [newPatientVillage, setNewPatientVillage] = useState<string>('Rampur Village');
  const [newHigherPhcId, setNewHigherPhcId] = useState<string>('phc-002');
  const [newHigherPhcName, setNewHigherPhcName] = useState<string>('District Hospital - Rohini (Higher CHC)');
  const [newCondition, setNewCondition] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('GENERAL');
  const [newReason, setNewReason] = useState<string>('');
  const [newDueDate, setNewDueDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [followUpsRes, metricsRes, phcsRes] = await Promise.all([
        apiClient.get('/follow-ups', {
          village: villageFilter,
          condition: conditionFilter,
          status: statusFilter,
          treatmentStatus: treatmentStatusFilter,
          search: searchQuery,
        }),
        apiClient.get('/follow-ups/analytics/metrics'),
        apiClient.get('/phcs'),
      ]);

      if (followUpsRes?.success && followUpsRes.followUps) {
        setFollowUps(followUpsRes.followUps);
      }
      if (metricsRes?.success && metricsRes.metrics) {
        setMetrics(metricsRes.metrics);
      }
      if (phcsRes?.success && phcsRes.phcs) {
        setPhcs(phcsRes.phcs);
      }
    } catch (err) {
      console.error('Failed to load follow-up data:', err);
      showToast('Failed to load follow-up records', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, villageFilter, conditionFilter, treatmentStatusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  // Trigger Automatic Due Reminders
  const handleTriggerReminders = async () => {
    try {
      const res = await apiClient.post('/follow-ups/reminders/trigger', {});
      if (res?.success) {
        showToast(res.message || 'Automated reminders sent successfully', 'success');
        fetchData();
      } else {
        showToast(res?.message || 'Failed to dispatch reminders', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error dispatching reminders', 'error');
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    window.open('/api/follow-ups/export/csv', '_blank');
    showToast('Follow-up dataset CSV export initiated', 'info');
  };

  // Open Log Follow-up Modal
  const openLogModal = (entry: PatientFollowUpEntry) => {
    setSelectedForLog(entry);
    setLogDate(new Date().toISOString().slice(0, 10));
    setLogCondition(entry.conditionUpdate || 'STABLE');
    setLogBp(entry.vitals?.bp || '120/80');
    setLogPulse(entry.vitals?.pulse || 76);
    setLogSpO2(entry.vitals?.spO2 || 98);
    setLogSugar(entry.vitals?.bloodSugar || 110);
    setLogAdherence(entry.adherenceRate || 'FULL');
    setLogMedicines(entry.medicinesTaken ? entry.medicinesTaken.join(', ') : '');
    setLogNextVisitDate(
      entry.nextVisitDate ||
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    );
    setLogNotes(entry.notes || '');
  };

  // Submit ASHA Follow-up Log
  const handleSaveFollowUpLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForLog) return;

    try {
      const medsArray = logMedicines
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean);

      const payload = {
        id: selectedForLog.id,
        referralId: selectedForLog.referralId,
        followUpDate: logDate,
        conditionUpdate: logCondition,
        vitals: {
          bp: logBp,
          pulse: Number(logPulse) || 76,
          spO2: Number(logSpO2) || 98,
          bloodSugar: Number(logSugar) || 110,
        },
        medicinesTaken: medsArray,
        adherenceRate: logAdherence,
        nextVisitDate: logNextVisitDate || undefined,
        notes: logNotes,
      };

      const res = await apiClient.post('/follow-ups', payload);
      if (res?.success) {
        showToast(`Follow-up visit for ${selectedForLog.patientName} successfully recorded!`, 'success');
        setSelectedForLog(null);
        fetchData();
      } else {
        showToast(res?.message || 'Failed to save follow-up record', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error saving follow-up log', 'error');
    }
  };

  // Open Treatment Status Modal (Higher PHC)
  const openTreatmentModal = (entry: PatientFollowUpEntry) => {
    setSelectedForTreatment(entry);
    setDocTreatmentStatus(entry.referralTreatmentStatus);
    setDocNotes(entry.higherPhcDoctorNotes || '');
    setDocMedicines(entry.medicinesTaken ? entry.medicinesTaken.join(', ') : '');
    setDocName(userName);
  };

  // Submit Higher PHC Treatment Update
  const handleSaveTreatmentStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForTreatment) return;

    try {
      const medsArray = docMedicines
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean);

      const payload = {
        referralTreatmentStatus: docTreatmentStatus,
        higherPhcDoctorNotes: docNotes,
        doctorName: docName,
        medicinesPrescribed: medsArray,
      };

      const res = await apiClient.patch(
        `/follow-ups/referrals/${selectedForTreatment.referralId}/treatment-status`,
        payload
      );

      if (res?.success) {
        showToast(
          `Higher PHC Treatment Status updated to ${docTreatmentStatus.replace('_', ' ')}!`,
          'success'
        );
        setSelectedForTreatment(null);
        fetchData();
      } else {
        showToast(res?.message || 'Failed to update treatment status', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error updating treatment status', 'error');
    }
  };

  // Submit New Referral Creation
  const handleCreateReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName || !newCondition) {
      showToast('Please enter patient name and condition', 'error');
      return;
    }

    try {
      const targetPhc = phcs.find((p) => p.id === newHigherPhcId);
      const payload = {
        patientName: newPatientName,
        patientAge: newPatientAge,
        patientGender: newPatientGender,
        patientPhone: newPatientPhone,
        patientAbhaId: newPatientAbha,
        patientVillage: newPatientVillage,
        patientAddress: `${newPatientVillage}, Rural Sector`,
        referringPhcId: currentFacilityId,
        referringPhcName: 'Primary Sub-Centre / Village Health Post',
        higherPhcId: newHigherPhcId,
        higherPhcName: targetPhc?.name || newHigherPhcName,
        condition: newCondition,
        category: newCategory,
        referralReason: newReason || 'Specialized diagnostic assessment & treatment escalation',
        scheduledDueDate: newDueDate,
        medicinesTaken: [],
      };

      const res = await apiClient.post('/follow-ups/referrals', payload);
      if (res?.success) {
        showToast(`Referral for ${newPatientName} registered and tracking started!`, 'success');
        setShowNewReferralModal(false);
        // Reset form
        setNewPatientName('');
        setNewCondition('');
        setNewReason('');
        fetchData();
      } else {
        showToast(res?.message || 'Failed to register referral', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error creating referral', 'error');
    }
  };

  // Unique villages from dataset
  const uniqueVillages = Array.from(
    new Set(followUps.map((f) => f.patientVillage).filter(Boolean))
  );

  return (
    <div className="followup-dashboard" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor:
              toastMessage.type === 'success'
                ? '#059669'
                : toastMessage.type === 'error'
                ? '#dc2626'
                : '#0284c7',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 600,
            fontSize: '14px',
            animation: 'fadeInUp 0.3s ease',
          }}
        >
          {toastMessage.type === 'success' && <CheckCircle2 size={18} />}
          {toastMessage.type === 'error' && <AlertTriangle size={18} />}
          {toastMessage.type === 'info' && <Bell size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0d9488, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 14px rgba(13, 148, 136, 0.3)',
              }}
            >
              <HeartPulse size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.5px' }}>
                Patient Follow-up & Referral Tracking
              </h1>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                Shared care continuity between Sub-Centres (ASHA) and Higher PHCs/CHCs with automated reminders
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleTriggerReminders}
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              color: '#38bdf8',
              padding: '8px 14px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            title="Dispatch due follow-up notifications to ASHA workers"
          >
            <Bell size={16} />
            <span>Send Due Reminders</span>
          </button>

          <button
            onClick={handleExportCsv}
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              color: '#10b981',
              padding: '8px 14px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            title="Download CSV report of all patient follow-ups"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowNewReferralModal(true)}
            style={{
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              border: 'none',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
            }}
          >
            <Plus size={16} />
            <span>New Referral Tracking</span>
          </button>

          <button
            onClick={fetchData}
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              color: '#94a3b8',
              padding: '8px 12px',
              borderRadius: '10px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
            }}
            title="Refresh records"
          >
            <RefreshCw size={16} className={isLoading ? 'spin-icon' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {/* Total Referrals */}
        <div
          style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '14px',
            padding: '16px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              Total Referrals
            </span>
            <Building2 size={18} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', marginTop: '8px' }}>
            {metrics?.totalReferrals ?? followUps.length}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Sub-Centre ➔ Higher PHC active records
          </div>
        </div>

        {/* Pending Follow-ups */}
        <div
          style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '14px',
            padding: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>
              Pending Follow-ups
            </span>
            <Clock size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#fbbf24', marginTop: '8px' }}>
            {metrics?.pendingFollowUps ?? followUps.filter((f) => f.status === 'PENDING').length}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
            Scheduled for home visit by ASHA
          </div>
        </div>

        {/* Overdue Follow-ups */}
        <div
          style={{
            backgroundColor: '#2a1215',
            border: '1px solid #ef4444',
            borderRadius: '14px',
            padding: '16px',
            boxShadow: '0 0 15px rgba(239, 68, 68, 0.15)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#f87171', textTransform: 'uppercase' }}>
              Overdue Follow-ups
            </span>
            <AlertTriangle size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#f87171', marginTop: '8px' }}>
            {metrics?.overdueFollowUps ?? followUps.filter((f) => f.status === 'OVERDUE').length}
          </div>
          <div style={{ fontSize: '11px', color: '#fca5a5', marginTop: '4px' }}>
            Passed scheduled due date — action required
          </div>
        </div>

        {/* Completed Follow-ups */}
        <div
          style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '14px',
            padding: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>
              Completed Visits
            </span>
            <CheckCircle2 size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#34d399', marginTop: '8px' }}>
            {metrics?.completedFollowUps ?? followUps.filter((f) => f.status === 'COMPLETED').length}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
            Condition & vitals logged at home
          </div>
        </div>

        {/* Medication Adherence */}
        <div
          style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '14px',
            padding: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#a855f7', textTransform: 'uppercase' }}>
              Full Adherence
            </span>
            <Pill size={18} color="#a855f7" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#c084fc', marginTop: '8px' }}>
            {metrics?.adherenceRatePercent ?? 85}%
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
            Patients compliant with prescribed regimen
          </div>
        </div>
      </div>

      {/* Filter and Search Controls Bar */}
      <div
        style={{
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '14px',
          padding: '16px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'All Cases', count: followUps.length },
            {
              id: 'OVERDUE',
              label: '⚠️ Overdue',
              count: followUps.filter((f) => f.status === 'OVERDUE').length,
              color: '#ef4444',
            },
            {
              id: 'PENDING',
              label: '⏳ Pending',
              count: followUps.filter((f) => f.status === 'PENDING').length,
              color: '#f59e0b',
            },
            {
              id: 'COMPLETED',
              label: '✅ Completed',
              count: followUps.filter((f) => f.status === 'COMPLETED').length,
              color: '#10b981',
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              style={{
                backgroundColor: statusFilter === tab.id ? (tab.color ? `${tab.color}25` : '#38bdf820') : '#0f172a',
                border: `1px solid ${statusFilter === tab.id ? (tab.color || '#38bdf8') : '#334155'}`,
                color: statusFilter === tab.id ? (tab.color || '#38bdf8') : '#94a3b8',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  backgroundColor: statusFilter === tab.id ? (tab.color || '#38bdf8') : '#334155',
                  color: statusFilter === tab.id ? '#ffffff' : '#94a3b8',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontSize: '10px',
                  fontWeight: 800,
                }}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Dropdown Filters & Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
          {/* Village Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={14} color="#64748b" />
            <select
              value={villageFilter}
              onChange={(e) => setVillageFilter(e.target.value)}
              style={{
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                color: '#e2e8f0',
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '12px',
                outline: 'none',
              }}
            >
              <option value="ALL">All Villages</option>
              {uniqueVillages.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Treatment Status Filter */}
          <select
            value={treatmentStatusFilter}
            onChange={(e) => setTreatmentStatusFilter(e.target.value)}
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              color: '#e2e8f0',
              padding: '6px 10px',
              borderRadius: '8px',
              fontSize: '12px',
              outline: 'none',
            }}
          >
            <option value="ALL">All Hospital Statuses</option>
            <option value="REFERRED">Referred</option>
            <option value="CONSULTATION_COMPLETED">Consultation Done</option>
            <option value="UNDER_TREATMENT">Under Treatment</option>
            <option value="ADMITTED">Admitted</option>
            <option value="DISCHARGED">Discharged</option>
            <option value="COMPLETED">Completed</option>
          </select>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
            <Search size={14} color="#64748b" style={{ position: 'absolute', left: '10px' }} />
            <input
              type="text"
              placeholder="Search patient, ABHA, condition..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                color: '#ffffff',
                padding: '6px 10px 6px 30px',
                borderRadius: '8px',
                fontSize: '12px',
                width: '220px',
                outline: 'none',
              }}
            />
          </form>
        </div>
      </div>

      {/* Main List of Follow-up Records */}
      {isLoading ? (
        <div
          style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '14px',
            padding: '48px',
            textAlign: 'center',
            color: '#94a3b8',
          }}
        >
          <RefreshCw size={28} className="spin-icon" style={{ margin: '0 auto 12px auto', color: '#38bdf8' }} />
          <p>Loading follow-up tracking records...</p>
        </div>
      ) : followUps.length === 0 ? (
        <div
          style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '14px',
            padding: '48px',
            textAlign: 'center',
            color: '#94a3b8',
          }}
        >
          <HeartPulse size={40} color="#64748b" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '16px', color: '#ffffff', margin: '0 0 6px 0' }}>No Follow-up Records Found</h3>
          <p style={{ fontSize: '13px', margin: 0 }}>
            Try clearing search filters or create a new referral tracking record.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {followUps.map((entry) => {
            const isOverdue = entry.status === 'OVERDUE';
            const isCompleted = entry.status === 'COMPLETED';

            const conditionBadgeColor =
              entry.conditionUpdate === 'IMPROVED' || entry.conditionUpdate === 'RECOVERED'
                ? '#10b981'
                : entry.conditionUpdate === 'DETERIORATING'
                ? '#f59e0b'
                : entry.conditionUpdate === 'CRITICAL'
                ? '#ef4444'
                : '#38bdf8';

            const treatmentStatusColor =
              entry.referralTreatmentStatus === 'DISCHARGED' || entry.referralTreatmentStatus === 'COMPLETED'
                ? '#10b981'
                : entry.referralTreatmentStatus === 'ADMITTED'
                ? '#ef4444'
                : entry.referralTreatmentStatus === 'UNDER_TREATMENT'
                ? '#8b5cf6'
                : '#0284c7';

            return (
              <div
                key={entry.id}
                style={{
                  backgroundColor: '#1e293b',
                  border: isOverdue ? '1px solid #ef4444' : isCompleted ? '1px solid #10b98140' : '1px solid #334155',
                  borderRadius: '14px',
                  padding: '18px 20px',
                  boxShadow: isOverdue ? '0 4px 20px rgba(239, 68, 68, 0.12)' : '0 4px 12px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
              >
                {/* Top Status Header */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    borderBottom: '1px solid #334155',
                    paddingBottom: '12px',
                    marginBottom: '14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    {/* Status Badge */}
                    <span
                      style={{
                        backgroundColor: isOverdue ? '#ef444420' : isCompleted ? '#10b98120' : '#f59e0b20',
                        color: isOverdue ? '#f87171' : isCompleted ? '#34d399' : '#fbbf24',
                        border: `1px solid ${isOverdue ? '#ef4444' : isCompleted ? '#10b981' : '#f59e0b'}`,
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {isOverdue && <span className="pulsing-red-dot" />}
                      {isOverdue
                        ? `OVERDUE (${entry.daysOverdue || 1} DAYS)`
                        : isCompleted
                        ? 'VISIT COMPLETED'
                        : 'PENDING VISIT'}
                    </span>

                    {/* Hospital Treatment Status Badge */}
                    <span
                      style={{
                        backgroundColor: `${treatmentStatusColor}20`,
                        color: treatmentStatusColor,
                        border: `1px solid ${treatmentStatusColor}60`,
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 700,
                      }}
                    >
                      🏥 Higher PHC: {entry.referralTreatmentStatus.replace(/_/g, ' ')}
                    </span>

                    {/* Patient Condition Update Badge */}
                    <span
                      style={{
                        backgroundColor: `${conditionBadgeColor}20`,
                        color: conditionBadgeColor,
                        border: `1px solid ${conditionBadgeColor}60`,
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 700,
                      }}
                    >
                      Condition: {entry.conditionUpdate}
                    </span>

                    {entry.reminderSent && (
                      <span
                        style={{
                          backgroundColor: '#0284c720',
                          color: '#38bdf8',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '10px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Bell size={10} /> Reminder Sent
                      </span>
                    )}
                  </div>

                  {/* Scheduled & Due Date Meta */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Calendar size={13} color="#64748b" />
                      <span>Due: </span>
                      <strong style={{ color: isOverdue ? '#f87171' : '#ffffff' }}>{entry.scheduledDueDate}</strong>
                    </div>

                    {entry.followUpDate && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <CheckCircle2 size={13} color="#10b981" />
                        <span>Visited: </span>
                        <strong style={{ color: '#ffffff' }}>{entry.followUpDate}</strong>
                      </div>
                    )}

                    {entry.nextVisitDate && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Clock size={13} color="#38bdf8" />
                        <span>Next Visit: </span>
                        <strong style={{ color: '#38bdf8' }}>{entry.nextVisitDate}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Patient & Facility Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '16px',
                    marginBottom: '14px',
                  }}
                >
                  {/* Column 1: Patient Details */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                        {entry.patientName}
                      </h3>
                      <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>
                        ({entry.patientAge}y, {entry.patientGender})
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', fontSize: '12px', color: '#cbd5e1' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} color="#0284c7" /> {entry.patientVillage}
                      </span>
                      {entry.patientPhone && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={12} color="#10b981" /> {entry.patientPhone}
                        </span>
                      )}
                    </div>

                    {entry.patientAbhaId && (
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                        ABHA ID: <code style={{ color: '#38bdf8' }}>{entry.patientAbhaId}</code>
                      </div>
                    )}

                    <div style={{ marginTop: '8px' }}>
                      <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                        Referral Condition / Diagnosis:
                      </div>
                      <div style={{ fontSize: '13px', color: '#fbbf24', fontWeight: 700, marginTop: '2px' }}>
                        {entry.condition}
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Referral Route & ASHA Assigned */}
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                      Care Continuum Route:
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '12px',
                        color: '#ffffff',
                        fontWeight: 600,
                        marginTop: '4px',
                      }}
                    >
                      <span style={{ color: '#94a3b8' }}>{entry.referringPhcName}</span>
                      <ArrowRight size={14} color="#38bdf8" />
                      <span style={{ color: '#38bdf8' }}>{entry.higherPhcName}</span>
                    </div>

                    <div style={{ marginTop: '10px', fontSize: '12px', color: '#cbd5e1' }}>
                      <span style={{ color: '#94a3b8' }}>Assigned ASHA: </span>
                      <strong style={{ color: '#ffffff' }}>{entry.ashaWorkerName}</strong>
                      {entry.ashaWorkerPhone && (
                        <span style={{ color: '#64748b', marginLeft: '6px' }}>({entry.ashaWorkerPhone})</span>
                      )}
                    </div>

                    {entry.higherPhcDoctorName && (
                      <div style={{ marginTop: '4px', fontSize: '12px', color: '#cbd5e1' }}>
                        <span style={{ color: '#94a3b8' }}>Higher PHC Doctor: </span>
                        <strong style={{ color: '#38bdf8' }}>{entry.higherPhcDoctorName}</strong>
                      </div>
                    )}
                  </div>

                  {/* Column 3: Vitals & Medication Adherence */}
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                      Latest Vitals & Adherence:
                    </div>

                    {entry.vitals ? (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, 1fr)',
                          gap: '6px',
                          marginTop: '6px',
                        }}
                      >
                        <div
                          style={{
                            backgroundColor: '#0f172a',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                          }}
                        >
                          <span style={{ color: '#64748b' }}>BP: </span>
                          <strong style={{ color: '#ffffff' }}>{entry.vitals.bp || 'N/A'}</strong>
                        </div>
                        <div
                          style={{
                            backgroundColor: '#0f172a',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                          }}
                        >
                          <span style={{ color: '#64748b' }}>Pulse: </span>
                          <strong style={{ color: '#ffffff' }}>{entry.vitals.pulse || 'N/A'} bpm</strong>
                        </div>
                        <div
                          style={{
                            backgroundColor: '#0f172a',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                          }}
                        >
                          <span style={{ color: '#64748b' }}>SpO2: </span>
                          <strong style={{ color: '#ffffff' }}>{entry.vitals.spO2 || 'N/A'}%</strong>
                        </div>
                        <div
                          style={{
                            backgroundColor: '#0f172a',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                          }}
                        >
                          <span style={{ color: '#64748b' }}>Sugar: </span>
                          <strong style={{ color: '#ffffff' }}>{entry.vitals.bloodSugar || 'N/A'} mg/dL</strong>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', fontStyle: 'italic' }}>
                        No vitals logged yet for this cycle
                      </div>
                    )}

                    <div style={{ marginTop: '8px', fontSize: '12px' }}>
                      <span style={{ color: '#94a3b8' }}>Med Adherence: </span>
                      <strong
                        style={{
                          color:
                            entry.adherenceRate === 'FULL'
                              ? '#10b981'
                              : entry.adherenceRate === 'PARTIAL'
                              ? '#f59e0b'
                              : '#ef4444',
                        }}
                      >
                        {entry.adherenceRate || 'NOT_LOGGED'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Medicines & Clinical Notes Summary */}
                {(entry.medicinesTaken?.length > 0 || entry.notes || entry.higherPhcDoctorNotes) && (
                  <div
                    style={{
                      backgroundColor: '#0f172a',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      marginBottom: '14px',
                      fontSize: '12px',
                    }}
                  >
                    {entry.medicinesTaken && entry.medicinesTaken.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        <span style={{ color: '#94a3b8', fontWeight: 600 }}>Prescribed Medicines:</span>
                        {entry.medicinesTaken.map((m, idx) => (
                          <span
                            key={idx}
                            style={{
                              backgroundColor: '#1e293b',
                              border: '1px solid #334155',
                              color: '#38bdf8',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                            }}
                          >
                            💊 {m}
                          </span>
                        ))}
                      </div>
                    )}

                    {entry.notes && (
                      <div style={{ color: '#cbd5e1', marginTop: '4px' }}>
                        <strong style={{ color: '#0d9488' }}>ASHA Notes: </strong>
                        {entry.notes}
                      </div>
                    )}

                    {entry.higherPhcDoctorNotes && (
                      <div style={{ color: '#cbd5e1', marginTop: '4px' }}>
                        <strong style={{ color: '#38bdf8' }}>Hospital Specialist Notes: </strong>
                        {entry.higherPhcDoctorNotes}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons Row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px',
                    borderTop: '1px solid #334155',
                    paddingTop: '12px',
                  }}
                >
                  <button
                    onClick={() => setSelectedForTimeline(entry)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#38bdf8',
                      fontSize: '12px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    <Activity size={14} />
                    <span>View Full Referral Timeline ({entry.timeline?.length || 0} events)</span>
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Log ASHA Visit Button */}
                    <button
                      onClick={() => openLogModal(entry)}
                      style={{
                        background: 'linear-gradient(135deg, #0d9488, #059669)',
                        border: 'none',
                        color: '#ffffff',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(13, 148, 136, 0.25)',
                      }}
                    >
                      <FileText size={14} />
                      <span>Log Follow-up Visit (ASHA)</span>
                    </button>

                    {/* Doctor / Higher PHC Update Button */}
                    <button
                      onClick={() => openTreatmentModal(entry)}
                      style={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #38bdf8',
                        color: '#38bdf8',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      <Stethoscope size={14} />
                      <span>Update Hospital Treatment</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Log ASHA Follow-up Visit */}
      {selectedForLog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '16px',
              maxWidth: '620px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #0d9488, #059669)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                  }}
                >
                  <FileText size={18} />
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    Log Patient Follow-up Visit
                  </h2>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {selectedForLog.patientName} • {selectedForLog.condition} • {selectedForLog.patientVillage}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedForLog(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveFollowUpLog}>
              {/* Row 1: Visit Date & Condition State */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                    Follow-up Visit Date
                  </label>
                  <input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      color: '#ffffff',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                    Patient Condition Update
                  </label>
                  <select
                    value={logCondition}
                    onChange={(e) => setLogCondition(e.target.value as PatientConditionState)}
                    style={{
                      width: '100%',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      color: '#ffffff',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  >
                    <option value="IMPROVED">🟢 Improved (Health better)</option>
                    <option value="STABLE">🔵 Stable (No change / steady)</option>
                    <option value="DETERIORATING">🟠 Deteriorating (Worsening symptoms)</option>
                    <option value="CRITICAL">🔴 Critical (Needs emergency escalation)</option>
                    <option value="RECOVERED">🌟 Fully Recovered</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Vitals */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                  Recorded Vitals at Home Visit
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>BP (mmHg)</span>
                    <input
                      type="text"
                      placeholder="120/80"
                      value={logBp}
                      onChange={(e) => setLogBp(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        color: '#ffffff',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>Pulse (bpm)</span>
                    <input
                      type="number"
                      placeholder="76"
                      value={logPulse}
                      onChange={(e) => setLogPulse(Number(e.target.value))}
                      style={{
                        width: '100%',
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        color: '#ffffff',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>SpO2 (%)</span>
                    <input
                      type="number"
                      placeholder="98"
                      value={logSpO2}
                      onChange={(e) => setLogSpO2(Number(e.target.value))}
                      style={{
                        width: '100%',
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        color: '#ffffff',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>Sugar (mg/dL)</span>
                    <input
                      type="number"
                      placeholder="110"
                      value={logSugar}
                      onChange={(e) => setLogSugar(Number(e.target.value))}
                      style={{
                        width: '100%',
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        color: '#ffffff',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Medicines Taken & Adherence */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                    Medication Adherence
                  </label>
                  <select
                    value={logAdherence}
                    onChange={(e) => setLogAdherence(e.target.value as MedicationAdherenceLevel)}
                    style={{
                      width: '100%',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      color: '#ffffff',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  >
                    <option value="FULL">✅ Full (Taking all doses properly)</option>
                    <option value="PARTIAL">⚠️ Partial (Missed doses / irregular)</option>
                    <option value="NON_ADHERENT">❌ Non-Adherent (Stopped medicines)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                    Next Follow-up Visit Date
                  </label>
                  <input
                    type="date"
                    value={logNextVisitDate}
                    onChange={(e) => setLogNextVisitDate(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      color: '#ffffff',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                </div>
              </div>

              {/* Medicines List Input */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                  Medicines Verified at Home (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tab Metformin 500mg, Tab Telmisartan 40mg, Aspirin 75mg"
                  value={logMedicines}
                  onChange={(e) => setLogMedicines(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    color: '#ffffff',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                />
              </div>

              {/* Detailed Notes */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                  ASHA Visit Notes & Observations
                </label>
                <textarea
                  rows={3}
                  placeholder="Record symptoms observed, diet advice given, patient complaints, family support..."
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    color: '#ffffff',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Footer Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedForLog(null)}
                  style={{
                    backgroundColor: '#334155',
                    border: 'none',
                    color: '#ffffff',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #0d9488, #059669)',
                    border: 'none',
                    color: '#ffffff',
                    padding: '8px 20px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)',
                  }}
                >
                  Save & Update Shared Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Higher PHC Treatment Status Update */}
      {selectedForTreatment && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #38bdf8',
              borderRadius: '16px',
              maxWidth: '580px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                  }}
                >
                  <Stethoscope size={18} />
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    Update Higher PHC Treatment Status
                  </h2>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Shared Record: {selectedForTreatment.patientName} • {selectedForTreatment.higherPhcName}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedForTreatment(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTreatmentStatus}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                  Referral Treatment Stage
                </label>
                <select
                  value={docTreatmentStatus}
                  onChange={(e) => setDocTreatmentStatus(e.target.value as ReferralTreatmentStatus)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    color: '#ffffff',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                >
                  <option value="REFERRED">Referred (Pending Hospital Intake)</option>
                  <option value="CONSULTATION_COMPLETED">Consultation Completed (OPD Specialist)</option>
                  <option value="UNDER_TREATMENT">Under Treatment (Active Regimen)</option>
                  <option value="ADMITTED">Admitted to Inpatient Ward / ICU</option>
                  <option value="DISCHARGED">Discharged (Referred Back for Home Care)</option>
                  <option value="COMPLETED">Completed (Treatment Cycle Concluded)</option>
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                  Specialist Doctor Name
                </label>
                <input
                  type="text"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    color: '#ffffff',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                  Updated Prescribed Medications
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tab Aspirin 75mg OD, Tab Atorvastatin 20mg HS, Tab Metoprolol 25mg"
                  value={docMedicines}
                  onChange={(e) => setDocMedicines(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    color: '#ffffff',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                  Specialist Clinical Notes / Discharge Advice
                </label>
                <textarea
                  rows={3}
                  placeholder="Instructions for ASHA worker and local Sub-Centre during home follow-ups..."
                  value={docNotes}
                  onChange={(e) => setDocNotes(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    color: '#ffffff',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedForTreatment(null)}
                  style={{
                    backgroundColor: '#334155',
                    border: 'none',
                    color: '#ffffff',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                    border: 'none',
                    color: '#ffffff',
                    padding: '8px 20px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Broadcast Update to ASHA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Shared Referral & Follow-up Timeline Drawer */}
      {selectedForTimeline && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '16px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                  }}
                >
                  <Activity size={18} />
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    Unified Care & Referral Timeline
                  </h2>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {selectedForTimeline.patientName} • Referral ID: {selectedForTimeline.referralId}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedForTimeline(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Patient Header Summary */}
            <div
              style={{
                backgroundColor: '#0f172a',
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '20px',
                fontSize: '12px',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
              }}
            >
              <div>
                <span style={{ color: '#64748b' }}>Condition: </span>
                <strong style={{ color: '#fbbf24' }}>{selectedForTimeline.condition}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Village: </span>
                <strong style={{ color: '#ffffff' }}>{selectedForTimeline.patientVillage}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Hospital Status: </span>
                <strong style={{ color: '#38bdf8' }}>{selectedForTimeline.referralTreatmentStatus}</strong>
              </div>
            </div>

            {/* Chronological Timeline Events */}
            <div style={{ position: 'relative', paddingLeft: '24px' }}>
              {/* Vertical line */}
              <div
                style={{
                  position: 'absolute',
                  top: '8px',
                  bottom: '8px',
                  left: '7px',
                  width: '2px',
                  backgroundColor: '#334155',
                }}
              />

              {selectedForTimeline.timeline?.map((event, idx) => {
                const isDoc = event.role === 'DOCTOR';
                const isAsha = event.role === 'HEALTH_ASSISTANT';
                const isSystem = event.role === 'SYSTEM';

                const dotBg = isDoc ? '#38bdf8' : isAsha ? '#10b981' : isSystem ? '#f59e0b' : '#94a3b8';

                return (
                  <div key={event.id || idx} style={{ position: 'relative', marginBottom: '20px' }}>
                    {/* Event Dot */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '-24px',
                        top: '4px',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: '#1e293b',
                        border: `3px solid ${dotBg}`,
                      }}
                    />

                    {/* Event Card */}
                    <div
                      style={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '10px',
                        padding: '12px 14px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                          {event.title}
                        </h4>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          {new Date(event.timestamp).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <p style={{ fontSize: '12px', color: '#cbd5e1', margin: '4px 0 6px 0' }}>
                        {event.description}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#94a3b8' }}>
                        <span style={{ color: dotBg, fontWeight: 700 }}>
                          {isDoc ? '👨‍⚕️ Higher PHC' : isAsha ? '👩‍⚕️ ASHA Worker' : '🤖 System'}
                        </span>
                        <span>•</span>
                        <span>{event.performedBy}</span>
                        {event.facilityName && (
                          <>
                            <span>•</span>
                            <span>{event.facilityName}</span>
                          </>
                        )}
                      </div>

                      {/* Attached Vitals if any */}
                      {event.metadata?.vitals && (
                        <div
                          style={{
                            marginTop: '8px',
                            paddingTop: '8px',
                            borderTop: '1px dashed #334155',
                            display: 'flex',
                            gap: '12px',
                            fontSize: '11px',
                            color: '#38bdf8',
                          }}
                        >
                          {event.metadata.vitals.bp && <span>BP: {event.metadata.vitals.bp}</span>}
                          {event.metadata.vitals.pulse && <span>Pulse: {event.metadata.vitals.pulse} bpm</span>}
                          {event.metadata.vitals.spO2 && <span>SpO2: {event.metadata.vitals.spO2}%</span>}
                          {event.metadata.vitals.bloodSugar && <span>Sugar: {event.metadata.vitals.bloodSugar}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ textAlign: 'right', marginTop: '16px' }}>
              <button
                onClick={() => setSelectedForTimeline(null)}
                style={{
                  backgroundColor: '#334155',
                  border: 'none',
                  color: '#ffffff',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Create New Referral Tracking Record */}
      {showNewReferralModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '16px',
              maxWidth: '640px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                  }}
                >
                  <Plus size={18} />
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    Create New Referral Tracking Record
                  </h2>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Track patient referral to higher facility & schedule ASHA follow-ups
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowNewReferralModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateReferral}>
              {/* Patient Name & Age */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                    Patient Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sarita Devi"
                    value={newPatientName}
                    onChange={(e) => setNewPatientName(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      color: '#ffffff',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                    Age
                  </label>
                  <input
                    type="number"
                    value={newPatientAge}
                    onChange={(e) => setNewPatientAge(Number(e.target.value))}
                    style={{
                      width: '100%',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      color: '#ffffff',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                    Gender
                  </label>
                  <select
                    value={newPatientGender}
                    onChange={(e) => setNewPatientGender(e.target.value as any)}
                    style={{
                      width: '100%',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      color: '#ffffff',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  >
                    <option value="FEMALE">Female</option>
                    <option value="MALE">Male</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              {/* Village & Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                    Patient Village *
                  </label>
                  <input
                    type="text"
                    value={newPatientVillage}
                    onChange={(e) => setNewPatientVillage(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      color: '#ffffff',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={newPatientPhone}
                    onChange={(e) => setNewPatientPhone(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      color: '#ffffff',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                </div>
              </div>

              {/* Higher PHC Facility */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                  Target Higher PHC / CHC Facility *
                </label>
                <select
                  value={newHigherPhcId}
                  onChange={(e) => {
                    setNewHigherPhcId(e.target.value);
                    const sel = phcs.find((p) => p.id === e.target.value);
                    if (sel) setNewHigherPhcName(sel.name);
                  }}
                  style={{
                    width: '100%',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    color: '#ffffff',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                >
                  {phcs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.type}) - {p.district}
                    </option>
                  ))}
                </select>
              </div>

              {/* Diagnosis Condition & First Follow-up Due Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                    Condition / Diagnosis *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Uncontrolled Hypertension & Angina"
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      color: '#ffffff',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                    First Due Date
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      color: '#ffffff',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                </div>
              </div>

              {/* Reason for Referral */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                  Referral Clinical Reason
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Escalation for cardiologist assessment, 2D Echo, and medication adjustment..."
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    color: '#ffffff',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowNewReferralModal(false)}
                  style={{
                    backgroundColor: '#334155',
                    border: 'none',
                    color: '#ffffff',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                    border: 'none',
                    color: '#ffffff',
                    padding: '8px 20px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Register & Start Tracking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default FollowUpDashboard;
