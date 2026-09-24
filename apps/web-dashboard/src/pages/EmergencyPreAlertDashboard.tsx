import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Siren,
  Clock,
  MapPin,
  Phone,
  User,
  Activity,
  HeartPulse,
  Thermometer,
  Wind,
  Droplets,
  CheckCircle2,
  XCircle,
  Truck,
  Stethoscope,
  ChevronRight,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Send,
  Building2,
  FileText,
  ShieldAlert,
  ArrowRight,
  Radio,
  Timer,
  Info,
  CheckSquare,
  Square,
  Bed,
  Users,
  Eye,
  X,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import {
  EmergencyPreAlert,
  EmergencyAlertStatus,
  EmergencySeverityLevel,
  EmergencyTransportMode,
  EmergencyVitals,
  PHC,
} from '@phc-connect/types';
import { apiClient } from '../services/api';

interface EmergencyPreAlertDashboardProps {
  currentFacilityId?: string;
  userRole?: string;
  userId?: string;
  userName?: string;
}

const PRESET_INSTRUCTIONS = [
  'Keep High-Flow Oxygen (10-12 L/min) via non-rebreather mask ready in Red Bay',
  'Prepare 2 large-bore (16G/18G) IV lines with warm Normal Saline / RL',
  'Prepare calibrated 12-lead ECG machine with charged battery on standby',
  'Prepare Emergency STEMI Kit (Aspirin 300mg, Clopidogrel 300mg, Atorvastatin 80mg)',
  'Prepare Magnesium Sulfate (Pritchard regimen: 4g IV + 10g IM split) for Eclampsia',
  'Keep IV Labetalol 20mg & Hydralazine ready for acute severe hypertension',
  'Ensure bedside eFAST ultrasound machine is powered on and calibrated',
  'Prepare Crash Cart & Defibrillator pads charged in resuscitation area',
  'Crossmatch 2 units O-Negative Packed Red Blood Cells on immediate standby',
  'Alert District Hospital Cardiology Cath Lab for potential emergency primary PCI transfer',
];

const COMPLAINT_SUGGESTIONS = [
  'Severe Crushing Chest Pain',
  'Acute Dyspnea / Breathlessness',
  'Post-Partum Hemorrhage (PPH)',
  'Eclampsia / Severe Convulsions',
  'Polytrauma / Severe Road Accident',
  'Unresponsive / GCS < 8',
  'Acute Stroke / Facial Droop',
  'Anaphylactic Shock / Stridor',
];

export const EmergencyPreAlertDashboard: React.FC<EmergencyPreAlertDashboardProps> = ({
  currentFacilityId = 'phc-001',
  userRole = 'DOCTOR',
  userId = 'doc-001',
  userName = 'Dr. Rajesh Kumar',
}) => {
  const [alerts, setAlerts] = useState<EmergencyPreAlert[]>([]);
  const [phcs, setPhcs] = useState<PHC[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [metrics, setMetrics] = useState<any>(null);

  // Modals
  const [selectedAlertForAck, setSelectedAlertForAck] = useState<EmergencyPreAlert | null>(null);
  const [selectedAlertForTimeline, setSelectedAlertForTimeline] = useState<EmergencyPreAlert | null>(null);
  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Doctor Ack Form State
  const [selectedInstructions, setSelectedInstructions] = useState<string[]>([]);
  const [customInstruction, setCustomInstruction] = useState<string>('');
  const [doctorNotes, setDoctorNotes] = useState<string>('');
  const [bedAssigned, setBedAssigned] = useState<string>('Emergency Red Bay Bed 1');
  const [teamAssigned, setTeamAssigned] = useState<string>('Trauma & Resuscitation Team Alpha');

  // Raise Alert Form State
  const [newPatientName, setNewPatientName] = useState<string>('');
  const [newPatientAge, setNewPatientAge] = useState<string>('45');
  const [newPatientGender, setNewPatientGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [newPatientPhone, setNewPatientPhone] = useState<string>('+91 ');
  const [newPatientAbha, setNewPatientAbha] = useState<string>('');
  const [newSourceLocation, setNewSourceLocation] = useState<string>('Rampur Village Sub-Centre, Ward 2');
  const [newTargetFacilityId, setNewTargetFacilityId] = useState<string>(currentFacilityId);
  const [newChiefComplaints, setNewChiefComplaints] = useState<string>('Severe Chest Pain, Breathlessness');
  const [newSymptomsDesc, setNewSymptomsDesc] = useState<string>('Acute onset retrosternal heaviness with sweating.');
  const [newTransportMode, setNewTransportMode] = useState<EmergencyTransportMode>('AMBULANCE_108');
  const [newVehicleNumber, setNewVehicleNumber] = useState<string>('DL-01-EM-1082');
  const [newEtaMins, setNewEtaMins] = useState<string>('15');
  const [newSeverity, setNewSeverity] = useState<EmergencySeverityLevel>('CRITICAL');

  // Vitals State for Raise Form
  const [vitalBp, setVitalBp] = useState<string>('88/56');
  const [vitalPulse, setVitalPulse] = useState<string>('124');
  const [vitalSpo2, setVitalSpo2] = useState<string>('89');
  const [vitalTemp, setVitalTemp] = useState<string>('98.6');
  const [vitalSugar, setVitalSugar] = useState<string>('130');
  const [vitalGcs, setVitalGcs] = useState<string>('14');

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData(false);
    }, 10000); // Live poll every 10 seconds for real-time ETA updates
    return () => clearInterval(interval);
  }, [statusFilter, severityFilter]);

  const loadData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const [alertsRes, metricsRes, phcsRes] = await Promise.all([
        apiClient.get('/emergency-alerts', {
          status: statusFilter,
          severity: severityFilter,
        }),
        apiClient.get('/emergency-alerts/analytics/metrics'),
        apiClient.get('/phcs'),
      ]);

      if (alertsRes.success && alertsRes.alerts) {
        setAlerts(alertsRes.alerts);
      }
      if (metricsRes.success && metricsRes.metrics) {
        setMetrics(metricsRes.metrics);
      }
      if (phcsRes.success && phcsRes.phcs) {
        setPhcs(phcsRes.phcs);
      }
    } catch (err) {
      console.error('Failed to load emergency data:', err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const handleOpenAcknowledge = (alert: EmergencyPreAlert) => {
    setSelectedAlertForAck(alert);
    setSelectedInstructions(
      alert.severity === 'CRITICAL'
        ? [PRESET_INSTRUCTIONS[0], PRESET_INSTRUCTIONS[1], PRESET_INSTRUCTIONS[2], PRESET_INSTRUCTIONS[3]]
        : [PRESET_INSTRUCTIONS[0], PRESET_INSTRUCTIONS[1]]
    );
    setBedAssigned(alert.bedAssigned || 'Emergency Red Bay Bed 1');
    setTeamAssigned(alert.teamAssigned || 'Trauma & Resuscitation Team Alpha');
    setDoctorNotes('');
  };

  const toggleInstruction = (inst: string) => {
    setSelectedInstructions((prev) =>
      prev.includes(inst) ? prev.filter((i) => i !== inst) : [...prev, inst]
    );
  };

  const handleAddCustomInstruction = () => {
    if (customInstruction.trim() && !selectedInstructions.includes(customInstruction.trim())) {
      setSelectedInstructions((prev) => [...prev, customInstruction.trim()]);
      setCustomInstruction('');
    }
  };

  const handleSubmitAcknowledge = async () => {
    if (!selectedAlertForAck) return;
    setIsSubmitting(true);
    try {
      const res = await apiClient.post(`/emergency-alerts/${selectedAlertForAck.id}/acknowledge`, {
        doctorPreparationInstructions: selectedInstructions,
        doctorPreparationNotes: doctorNotes,
        bedAssigned,
        teamAssigned,
      });

      if (res.success) {
        showToast(`Triage instructions transmitted for ${selectedAlertForAck.patientName}!`, 'success');
        setSelectedAlertForAck(null);
        await loadData(false);
      } else {
        showToast(res.message || 'Failed to acknowledge alert', 'error');
      }
    } catch (err) {
      console.error('Failed to acknowledge emergency alert:', err);
      showToast('Failed to acknowledge emergency alert', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (alertId: string, nextStatus: EmergencyAlertStatus, notes?: string) => {
    try {
      const res = await apiClient.patch(`/emergency-alerts/${alertId}/status`, {
        status: nextStatus,
        notes: notes || `Status transitioned to ${nextStatus}`,
      });
      if (res.success) {
        showToast(`Case status updated to ${nextStatus.replace(/_/g, ' ')}`, 'success');
        await loadData(false);
      } else {
        showToast(res.message || 'Failed to update status', 'error');
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      showToast('Failed to update status', 'error');
    }
  };

  const handleAddSuggestedComplaint = (item: string) => {
    if (!newChiefComplaints.includes(item)) {
      setNewChiefComplaints((prev) => (prev ? `${prev}, ${item}` : item));
    }
  };

  const handleRaiseAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim()) {
      showToast('Please enter patient full name', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedVitals: EmergencyVitals = {
        bp: vitalBp || undefined,
        pulse: vitalPulse ? Number(vitalPulse) : undefined,
        spO2: vitalSpo2 ? Number(vitalSpo2) : undefined,
        temperature: vitalTemp ? Number(vitalTemp) : undefined,
        bloodSugar: vitalSugar ? Number(vitalSugar) : undefined,
        gcsScore: vitalGcs ? Number(vitalGcs) : undefined,
      };

      const res = await apiClient.post('/emergency-alerts', {
        patientName: newPatientName,
        patientAge: Number(newPatientAge) || 30,
        patientGender: newPatientGender,
        patientPhone: newPatientPhone,
        patientAbhaId: newPatientAbha,
        sourceLocation: newSourceLocation,
        targetFacilityId: newTargetFacilityId,
        chiefComplaints: newChiefComplaints.split(',').map((c) => c.trim()).filter(Boolean),
        symptomsDescription: newSymptomsDesc,
        vitals: parsedVitals,
        severity: newSeverity,
        transportMode: newTransportMode,
        ambulanceVehicleNumber: newVehicleNumber,
        estimatedArrivalMinutes: Number(newEtaMins) || 15,
      });

      if (res.success) {
        showToast(`🚨 Emergency Pre-Alert ${res.alert?.alertNumber || ''} Broadcasted Successfully!`, 'success');
        setIsRaiseModalOpen(false);
        // Reset form
        setNewPatientName('');
        setNewChiefComplaints('Severe Chest Pain, Breathlessness');
        await loadData(false);
      } else {
        showToast(res.message || 'Failed to dispatch pre-alert', 'error');
      }
    } catch (err) {
      console.error('Failed to raise emergency pre-alert:', err);
      showToast('Failed to dispatch emergency pre-alert', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.patientName.toLowerCase().includes(q) ||
      a.alertNumber.toLowerCase().includes(q) ||
      a.ashaWorkerName.toLowerCase().includes(q) ||
      a.sourceLocation.toLowerCase().includes(q) ||
      a.chiefComplaints.some((c) => c.toLowerCase().includes(q))
    );
  });

  const activeCriticalAlerts = alerts.filter(
    (a) =>
      a.severity === 'CRITICAL' &&
      (a.status === 'ALERT_RAISED' || a.status === 'ACKNOWLEDGED' || a.status === 'IN_TRANSIT')
  );

  return (
    <div style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 99999,
            backgroundColor:
              toastMessage.type === 'success'
                ? '#059669'
                : toastMessage.type === 'error'
                ? '#dc2626'
                : '#0284c7',
            color: '#ffffff',
            padding: '14px 22px',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontWeight: 700,
            fontSize: '14px',
            animation: 'fadeInUp 0.3s ease',
          }}
        >
          {toastMessage.type === 'success' && <CheckCircle2 size={20} />}
          {toastMessage.type === 'error' && <AlertTriangle size={20} />}
          {toastMessage.type === 'info' && <Radio size={20} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #7f1d1d 0%, #1e1b4b 50%, #881337 100%)',
          borderRadius: '20px',
          padding: '24px 30px',
          color: '#ffffff',
          boxShadow: '0 10px 30px -5px rgba(220, 38, 38, 0.3)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          marginBottom: '24px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 1 }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: 'rgba(239, 68, 68, 0.25)',
              border: '1.5px solid rgba(248, 113, 113, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fca5a5',
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)',
            }}
          >
            <Siren size={28} className="animate-pulse-slow" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#ffffff', letterSpacing: '-0.5px' }}>
                Emergency Pre-Alert & Casualty Triage
              </h1>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: '20px',
                  background: 'rgba(239, 68, 68, 0.3)',
                  border: '1px solid rgba(248, 113, 113, 0.6)',
                  color: '#fecaca',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  letterSpacing: '0.5px',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    boxShadow: '0 0 8px #ef4444',
                  }}
                  className="animate-live-dot"
                />
                LIVE ETA TELEMETRY
              </span>
            </div>
            <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#cbd5e1', fontWeight: 500 }}>
              Real-time inbound casualty pre-notifications from ASHA outreach, doctor preparation orders & bed allocation.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', zIndex: 1 }}>
          <button
            onClick={() => loadData(true)}
            style={{
              padding: '10px 16px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(15, 23, 42, 0.6)',
              color: '#f1f5f9',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s ease',
            }}
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setIsRaiseModalOpen(true)}
            style={{
              padding: '11px 20px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 6px 20px rgba(220, 38, 38, 0.45)',
              transition: 'all 0.2s ease',
            }}
          >
            <Plus size={16} strokeWidth={3} />
            <span>Raise Pre-Alert (ASHA / Field)</span>
          </button>
        </div>
      </div>

      {/* Critical Broadcast Banner (when active critical cases exist) */}
      {activeCriticalAlerts.length > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)',
            borderRadius: '16px',
            padding: '16px 22px',
            color: '#ffffff',
            boxShadow: '0 8px 24px rgba(220, 38, 38, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            marginBottom: '24px',
            border: '1px solid rgba(254, 202, 202, 0.4)',
          }}
          className="animate-pulse-slow"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fef08a',
              }}
            >
              <ShieldAlert size={24} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.6px', textTransform: 'uppercase', color: '#fef08a' }}>
                🚨 CRITICAL INCOMING CASUALTY ALERT ({activeCriticalAlerts.length} Active Case{activeCriticalAlerts.length > 1 ? 's' : ''})
              </div>
              <div style={{ fontSize: '13px', color: '#ffffff', marginTop: '2px', fontWeight: 600 }}>
                {activeCriticalAlerts[0].patientName} ({activeCriticalAlerts[0].patientAge}y {activeCriticalAlerts[0].patientGender}) — ETA ~
                <strong style={{ color: '#fef08a', fontSize: '14px' }}> {activeCriticalAlerts[0].liveEta?.remainingMinutes || 10} mins </strong> 
                ({activeCriticalAlerts[0].sourceLocation}) — {activeCriticalAlerts[0].chiefComplaints[0]}
              </div>
            </div>
          </div>

          <button
            onClick={() => handleOpenAcknowledge(activeCriticalAlerts[0])}
            style={{
              padding: '9px 18px',
              borderRadius: '10px',
              border: 'none',
              background: '#ffffff',
              color: '#991b1b',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.15s ease',
            }}
          >
            {activeCriticalAlerts[0].status === 'ALERT_RAISED' ? '⚡ Acknowledge & Prepare Bay' : '📋 View Protocol'}
          </button>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {/* Card 1 */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '18px 20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Total Emergency Alerts</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Radio size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', margin: '8px 0 2px 0' }}>
            {metrics?.totalAlerts || alerts.length}
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669' }}>ASHA Outreach Network</span>
        </div>

        {/* Card 2 */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '18px 20px',
            border: '1px solid #fecaca',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.08)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626' }}>Active Inbound Cases</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Siren size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#dc2626', margin: '8px 0 2px 0' }}>
            {metrics?.activeIncomingAlerts || activeCriticalAlerts.length}
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#b91c1c' }}>
            {metrics?.criticalCases || activeCriticalAlerts.length} Critical Priority Cases
          </span>
        </div>

        {/* Card 3 */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '18px 20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Avg. Triage Response</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Timer size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#d97706', margin: '8px 0 2px 0' }}>
            {metrics?.avgResponseTimeMinutes || 3} min
          </div>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Raised ➔ Doctor Prepared</span>
        </div>

        {/* Card 4 */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '18px 20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Avg. Transit Duration</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f0f9ff', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Truck size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#0284c7', margin: '8px 0 2px 0' }}>
            {metrics?.avgTransitTimeMinutes || 18} min
          </div>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>108 Ambulance Network</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '14px 18px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginRight: '4px' }}>
            <Filter size={14} /> Filter Status:
          </span>
          {[
            { id: 'ACTIVE', label: '⚡ Active Incoming' },
            { id: 'ALL', label: 'All Cases' },
            { id: 'ALERT_RAISED', label: 'Alert Raised' },
            { id: 'ACKNOWLEDGED', label: 'Acknowledged' },
            { id: 'IN_TRANSIT', label: 'In Transit' },
            { id: 'ARRIVED', label: 'Arrived' },
            { id: 'HANDED_OVER', label: 'Handed Over' },
          ].map((st) => {
            const isActive = statusFilter === st.id;
            return (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: isActive ? '#dc2626' : '#f1f5f9',
                  color: isActive ? '#ffffff' : '#475569',
                  boxShadow: isActive ? '0 2px 8px rgba(220, 38, 38, 0.35)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {st.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1', maxWidth: '420px', minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '10px' }} />
            <input
              type="text"
              placeholder="Search patient, alert no, ASHA..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                color: '#0f172a',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '12px',
              fontWeight: 600,
              color: '#334155',
              background: '#ffffff',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">🔴 Critical Only</option>
            <option value="SEVERE">🟠 Severe Only</option>
            <option value="MODERATE">🟡 Moderate Only</option>
          </select>
        </div>
      </div>

      {/* Emergency Alerts Grid */}
      {isLoading ? (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '60px 20px',
            textAlign: 'center',
            border: '1px solid #e2e8f0',
          }}
        >
          <RefreshCw size={36} color="#dc2626" className="animate-spin" style={{ margin: '0 auto 16px auto' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Syncing Emergency Casualty Feed...</h3>
          <p style={{ fontSize: '13px', color: '#64748b' }}>Connecting to live ASHA sub-centre network & ambulance telemetry.</p>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '60px 20px',
            textAlign: 'center',
            border: '1px solid #e2e8f0',
          }}
        >
          <CheckCircle2 size={44} color="#059669" style={{ margin: '0 auto 16px auto' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
            No Active Inbound Alerts
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '460px', margin: '0 auto 20px auto' }}>
            All emergency pre-notifications are acknowledged or no cases match the selected status filter.
          </p>
          <button
            onClick={() => setIsRaiseModalOpen(true)}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              background: '#dc2626',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            + Raise New Field Emergency Alert
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(580px, 1fr))',
            gap: '20px',
          }}
        >
          {filteredAlerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL';
            const isSevere = alert.severity === 'SEVERE';
            const isActive =
              alert.status === 'ALERT_RAISED' || alert.status === 'ACKNOWLEDGED' || alert.status === 'IN_TRANSIT';

            const severityBorderColor = isCritical ? '#dc2626' : isSevere ? '#f59e0b' : '#3b82f6';

            return (
              <div
                key={alert.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '20px',
                  border: `1.5px solid ${isCritical ? '#fecaca' : '#e2e8f0'}`,
                  borderLeft: `6px solid ${severityBorderColor}`,
                  boxShadow: isCritical ? '0 10px 25px -5px rgba(220, 38, 38, 0.15)' : '0 4px 16px rgba(0, 0, 0, 0.05)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Card Header */}
                <div
                  style={{
                    padding: '16px 20px',
                    background: isCritical ? '#fef2f2' : '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 800,
                        letterSpacing: '0.4px',
                        textTransform: 'uppercase',
                        background: isCritical ? '#dc2626' : isSevere ? '#d97706' : '#2563eb',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <AlertTriangle size={13} />
                      {alert.severity}
                    </span>

                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#475569',
                        background: '#ffffff',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                      }}
                    >
                      {alert.alertNumber}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Live ETA Badge */}
                    {isActive && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          background: '#fee2e2',
                          border: '1px solid #fca5a5',
                          color: '#dc2626',
                          fontSize: '12px',
                          fontWeight: 800,
                        }}
                      >
                        <Clock size={13} className="animate-spin" />
                        <span>ETA: {alert.liveEta?.remainingMinutes ?? alert.estimatedArrivalMinutes} min</span>
                      </div>
                    )}

                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        background:
                          alert.status === 'ALERT_RAISED'
                            ? '#fee2e2'
                            : alert.status === 'ACKNOWLEDGED'
                            ? '#dbeafe'
                            : alert.status === 'IN_TRANSIT'
                            ? '#fef3c7'
                            : alert.status === 'ARRIVED'
                            ? '#dcfce7'
                            : '#f1f5f9',
                        color:
                          alert.status === 'ALERT_RAISED'
                            ? '#dc2626'
                            : alert.status === 'ACKNOWLEDGED'
                            ? '#1d4ed8'
                            : alert.status === 'IN_TRANSIT'
                            ? '#b45309'
                            : alert.status === 'ARRIVED'
                            ? '#15803d'
                            : '#475569',
                        border: '1px solid currentColor',
                      }}
                    >
                      {alert.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Patient Information & Transport Row */}
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {alert.patientName}
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px' }}>
                          {alert.patientAge}y • {alert.patientGender}
                        </span>
                      </h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#64748b' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={14} color="#dc2626" />
                          <strong>{alert.sourceLocation}</strong>
                        </span>
                        {alert.patientPhone && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Phone size={13} color="#64748b" />
                            <a href={`tel:${alert.patientPhone}`} style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 600 }}>
                              {alert.patientPhone}
                            </a>
                          </span>
                        )}
                        {alert.patientAbhaId && (
                          <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#475569', background: '#f8fafc', padding: '2px 6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                            ABHA: {alert.patientAbhaId}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '8px', background: '#f0f9ff', color: '#0369a1', fontSize: '12px', fontWeight: 700 }}>
                        <Truck size={14} />
                        <span>{alert.transportMode.replace(/_/g, ' ')}</span>
                      </div>
                      {alert.ambulanceVehicleNumber && (
                        <div style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: '#64748b', marginTop: '4px' }}>
                          {alert.ambulanceVehicleNumber}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 6-Vitals Telemetry Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(6, 1fr)',
                      gap: '8px',
                      background: '#0f172a',
                      borderRadius: '14px',
                      padding: '12px',
                      color: '#ffffff',
                    }}
                  >
                    {/* BP */}
                    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '8px 4px' }}>
                      <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', fontWeight: 700 }}>BP (mmHg)</span>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 800,
                          color: alert.vitals.bp?.startsWith('8') || (alert.vitals.bp && parseInt(alert.vitals.bp) > 160) ? '#f87171' : '#f8fafc',
                        }}
                      >
                        {alert.vitals.bp || '--/--'}
                      </span>
                    </div>

                    {/* Pulse */}
                    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '8px 4px' }}>
                      <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', fontWeight: 700 }}>Pulse (bpm)</span>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 800,
                          color: alert.vitals.pulse && (alert.vitals.pulse > 120 || alert.vitals.pulse < 50) ? '#f87171' : '#f8fafc',
                        }}
                      >
                        {alert.vitals.pulse || '--'}
                      </span>
                    </div>

                    {/* SpO2 */}
                    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '8px 4px' }}>
                      <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', fontWeight: 700 }}>SpO2 (%)</span>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 800,
                          color: alert.vitals.spO2 && alert.vitals.spO2 < 92 ? '#f87171' : '#34d399',
                        }}
                      >
                        {alert.vitals.spO2 ? `${alert.vitals.spO2}%` : '--'}
                      </span>
                    </div>

                    {/* Temp */}
                    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '8px 4px' }}>
                      <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', fontWeight: 700 }}>Temp (°F)</span>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>
                        {alert.vitals.temperature ? `${alert.vitals.temperature}°` : '--'}
                      </span>
                    </div>

                    {/* Glucose */}
                    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '8px 4px' }}>
                      <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', fontWeight: 700 }}>Glucose</span>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>
                        {alert.vitals.bloodSugar || '--'}
                      </span>
                    </div>

                    {/* GCS */}
                    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '8px 4px' }}>
                      <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', fontWeight: 700 }}>GCS</span>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 800,
                          color: alert.vitals.gcsScore && alert.vitals.gcsScore < 13 ? '#fbbf24' : '#f8fafc',
                        }}
                      >
                        {alert.vitals.gcsScore ? `${alert.vitals.gcsScore}/15` : '--'}
                      </span>
                    </div>
                  </div>

                  {/* Chief Complaints & Symptoms Narrative */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {alert.chiefComplaints.map((cc, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: '3px 10px',
                            borderRadius: '6px',
                            background: '#fee2e2',
                            color: '#991b1b',
                            fontSize: '11px',
                            fontWeight: 700,
                            border: '1px solid #fca5a5',
                          }}
                        >
                          {cc}
                        </span>
                      ))}
                    </div>

                    {alert.symptomsDescription && (
                      <div
                        style={{
                          background: '#f8fafc',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                          color: '#334155',
                          fontStyle: 'italic',
                        }}
                      >
                        "{alert.symptomsDescription}"
                      </div>
                    )}
                  </div>

                  {/* Doctor Triage Protocol Box */}
                  {alert.doctorPreparationInstructions && alert.doctorPreparationInstructions.length > 0 ? (
                    <div
                      style={{
                        background: '#eff6ff',
                        borderRadius: '12px',
                        padding: '14px',
                        border: '1px solid #bfdbfe',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#1e40af' }}>
                          <Stethoscope size={15} color="#2563eb" />
                          <span>Prepared by {alert.acknowledgedByDoctorName || 'Duty Physician'}</span>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#1d4ed8', background: '#dbeafe', padding: '2px 8px', borderRadius: '4px' }}>
                          {alert.bedAssigned || 'Red Bay Resuscitation Bed 1'}
                        </span>
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#1e3a8a', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {alert.doctorPreparationInstructions.slice(0, 3).map((inst, i) => (
                          <li key={i} style={{ fontWeight: 600 }}>{inst}</li>
                        ))}
                      </ul>
                      {alert.doctorPreparationNotes && (
                        <div style={{ marginTop: '8px', fontSize: '11px', color: '#475569', fontStyle: 'italic', borderTop: '1px dashed #cbd5e1', paddingTop: '6px' }}>
                          Physician Note: {alert.doctorPreparationNotes}
                        </div>
                      )}
                    </div>
                  ) : alert.status === 'ALERT_RAISED' ? (
                    <div
                      style={{
                        background: '#fff1f2',
                        border: '1.5px dashed #f43f5e',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, color: '#be123c' }}>
                        <Siren size={18} color="#e11d48" className="animate-pulse-slow" />
                        <span>Awaiting Casualty Doctor Acknowledgment & Bay Preparation</span>
                      </div>
                      <button
                        onClick={() => handleOpenAcknowledge(alert)}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#e11d48',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(225, 29, 72, 0.3)',
                        }}
                      >
                        Acknowledge & Prepare
                      </button>
                    </div>
                  ) : null}

                  {/* ASHA Info Row */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      color: '#64748b',
                      borderTop: '1px solid #f1f5f9',
                      paddingTop: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={14} color="#94a3b8" />
                      <span>
                        Field ASHA: <strong style={{ color: '#0f172a' }}>{alert.ashaWorkerName}</strong>
                      </span>
                      {alert.ashaWorkerPhone && (
                        <a href={`tel:${alert.ashaWorkerPhone}`} style={{ color: '#0284c7', textDecoration: 'none', marginLeft: '4px', fontWeight: 600 }}>
                          ({alert.ashaWorkerPhone})
                        </a>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedAlertForTimeline(alert)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        fontSize: '11px',
                        fontWeight: 700,
                        textDecoration: 'underline',
                        cursor: 'pointer',
                      }}
                    >
                      Audit Trail ({alert.timeline.length})
                    </button>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div
                  style={{
                    padding: '14px 20px',
                    background: '#f8fafc',
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px',
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                    Raised: {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {alert.metrics.responseTimeMinutes && (
                      <span style={{ marginLeft: '6px', color: '#d97706', fontWeight: 700 }}>
                        (Ack in {alert.metrics.responseTimeMinutes}m)
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {alert.status === 'ALERT_RAISED' && (
                      <button
                        onClick={() => handleOpenAcknowledge(alert)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#dc2626',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)',
                        }}
                      >
                        Doctor Acknowledge
                      </button>
                    )}

                    {alert.status === 'ACKNOWLEDGED' && (
                      <>
                        <button
                          onClick={() => handleOpenAcknowledge(alert)}
                          style={{
                            padding: '7px 12px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#334155',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Edit Protocol
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(alert.id, 'IN_TRANSIT')}
                          style={{
                            padding: '7px 14px',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#d97706',
                            color: '#ffffff',
                            fontSize: '12px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            boxShadow: '0 2px 8px rgba(217, 119, 6, 0.3)',
                          }}
                        >
                          <Truck size={14} />
                          Mark In-Transit
                        </button>
                      </>
                    )}

                    {alert.status === 'IN_TRANSIT' && (
                      <button
                        onClick={() => handleUpdateStatus(alert.id, 'ARRIVED')}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#059669',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)',
                        }}
                      >
                        <CheckCircle2 size={14} />
                        Mark Arrived at Casualty
                      </button>
                    )}

                    {alert.status === 'ARRIVED' && (
                      <button
                        onClick={() => handleUpdateStatus(alert.id, 'HANDED_OVER')}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#2563eb',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                        }}
                      >
                        <CheckCircle2 size={14} />
                        Complete Handover & Admit
                      </button>
                    )}

                    {alert.status === 'HANDED_OVER' && (
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={15} /> Handover Complete
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PROPER MODAL 1: Doctor Triage Acknowledgment & Preparation Instructions Form */}
      {/* ========================================================================= */}
      {selectedAlertForAck && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                color: '#ffffff',
                borderBottom: '1px solid #334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Stethoscope size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                    Doctor Casualty Triage Preparation
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                    Patient: <strong style={{ color: '#ffffff' }}>{selectedAlertForAck.patientName}</strong> ({selectedAlertForAck.patientAge}y) •{' '}
                    <span style={{ color: '#f87171', fontWeight: 700 }}>{selectedAlertForAck.severity}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedAlertForAck(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Bed & Team Assignment */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Assigned Emergency Bay / Bed *
                  </label>
                  <input
                    type="text"
                    value={bedAssigned}
                    onChange={(e) => setBedAssigned(e.target.value)}
                    placeholder="e.g. Emergency Red Bay Bed 1"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      color: '#0f172a',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Assigned Triage / Resuscitation Team *
                  </label>
                  <input
                    type="text"
                    value={teamAssigned}
                    onChange={(e) => setTeamAssigned(e.target.value)}
                    placeholder="e.g. Trauma & Resuscitation Team Alpha"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      color: '#0f172a',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Preset Preparation Directives Checklist */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                  Select Immediate Clinical Preparation Directives:
                </label>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 10px 0' }}>
                  These standing emergency directives are dispatched instantly to casualty nurses and field paramedics.
                </p>

                <div
                  style={{
                    maxHeight: '220px',
                    overflowY: 'auto',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '8px',
                    background: '#f8fafc',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  {PRESET_INSTRUCTIONS.map((inst, index) => {
                    const isChecked = selectedInstructions.includes(inst);
                    return (
                      <div
                        key={index}
                        onClick={() => toggleInstruction(inst)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${isChecked ? '#93c5fd' : '#e2e8f0'}`,
                          background: isChecked ? '#eff6ff' : '#ffffff',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {isChecked ? (
                          <CheckSquare size={16} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
                        ) : (
                          <Square size={16} color="#94a3b8" style={{ flexShrink: 0, marginTop: '2px' }} />
                        )}
                        <span style={{ fontWeight: isChecked ? 700 : 500, color: isChecked ? '#1e40af' : '#334155' }}>
                          {inst}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add Custom Clinical Instruction */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Add Custom Clinical Directive:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={customInstruction}
                    onChange={(e) => setCustomInstruction(e.target.value)}
                    placeholder="e.g. Keep ready 1 ampoule IV Calcium Gluconate 10% on crash cart..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomInstruction();
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      color: '#0f172a',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomInstruction}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '10px',
                      border: 'none',
                      background: '#0f172a',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Physician Notes for En-Route ASHA Worker */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Physician Instructions for En-Route Field ASHA / Paramedic:
                </label>
                <textarea
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Maintain airway patent, position patient left lateral, monitor SpO2 continuously every 3 minutes..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div
              style={{
                padding: '16px 24px',
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                borderRadius: '0 0 20px 20px',
              }}
            >
              <button
                onClick={() => setSelectedAlertForAck(null)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitAcknowledge}
                disabled={isSubmitting}
                style={{
                  padding: '10px 22px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)',
                }}
              >
                <Send size={15} />
                <span>{isSubmitting ? 'Transmitting Orders...' : 'Confirm & Transmit Triage Orders'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PROPER MODAL 2: Raise Emergency Pre-Alert Form (ASHA Worker / Sub-Centre) */}
      {/* ========================================================================= */}
      {isRaiseModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <form
            onSubmit={handleRaiseAlert}
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '720px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
              border: '1px solid #fecaca',
              display: 'flex',
              flexDirection: 'column',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.2)', color: '#fef08a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Siren size={24} className="animate-pulse-slow" />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                    Raise Emergency Pre-Alert (ASHA / Field SOS)
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#fecaca' }}>
                    Instant casualty notification to PHC/CHC Medical Officers & Resuscitation Team.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsRaiseModalOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Section 1: Patient Identity */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={15} color="#dc2626" />
                  <span>1. Patient Identity & Contact</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Patient Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newPatientName}
                      onChange={(e) => setNewPatientName(e.target.value)}
                      placeholder="e.g. Rameshwar Prasad"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        color: '#0f172a',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Age (Years) *
                    </label>
                    <input
                      type="number"
                      required
                      value={newPatientAge}
                      onChange={(e) => setNewPatientAge(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        color: '#0f172a',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Gender *
                    </label>
                    <select
                      value={newPatientGender}
                      onChange={(e: any) => setNewPatientGender(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        color: '#0f172a',
                        background: '#ffffff',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Contact Phone No.
                    </label>
                    <input
                      type="text"
                      value={newPatientPhone}
                      onChange={(e) => setNewPatientPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        color: '#0f172a',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      ABHA ID (Ayushman Bharat)
                    </label>
                    <input
                      type="text"
                      value={newPatientAbha}
                      onChange={(e) => setNewPatientAbha(e.target.value)}
                      placeholder="91-4521-8890-1234"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        color: '#0f172a',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Origin & Destination Facility */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={15} color="#0284c7" />
                  <span>2. Origin Location & Target PHC Destination</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Source Sub-Centre / Village *
                    </label>
                    <input
                      type="text"
                      required
                      value={newSourceLocation}
                      onChange={(e) => setNewSourceLocation(e.target.value)}
                      placeholder="e.g. Rampur Village Sub-Centre, Ward 4"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        color: '#0f172a',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Target Receiving Facility *
                    </label>
                    <select
                      value={newTargetFacilityId}
                      onChange={(e) => setNewTargetFacilityId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        color: '#0f172a',
                        background: '#ffffff',
                        boxSizing: 'border-box',
                      }}
                    >
                      {phcs.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.type})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Transport & Live ETA */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Truck size={15} color="#d97706" />
                  <span>3. Transport Mode & Live ETA</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Transport Mode
                    </label>
                    <select
                      value={newTransportMode}
                      onChange={(e: any) => setNewTransportMode(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        color: '#0f172a',
                        background: '#ffffff',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="AMBULANCE_108">108 Ambulance</option>
                      <option value="PRIVATE_VEHICLE">Private Vehicle / Auto</option>
                      <option value="AUTO_RICKSHAW">Auto Rickshaw</option>
                      <option value="COMMUNITY_TRANSPORT">Community Transport</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Vehicle / Ambulance No.
                    </label>
                    <input
                      type="text"
                      value={newVehicleNumber}
                      onChange={(e) => setNewVehicleNumber(e.target.value)}
                      placeholder="DL-01-EM-1082"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        color: '#0f172a',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Estimated Arrival (Mins) *
                    </label>
                    <input
                      type="number"
                      required
                      value={newEtaMins}
                      onChange={(e) => setNewEtaMins(e.target.value)}
                      placeholder="15"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        color: '#0f172a',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Vitals Measurement on Field */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <HeartPulse size={15} color="#dc2626" />
                  <span>4. Patient Telemetry & Field Vitals</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#64748b', marginBottom: '3px', textAlign: 'center' }}>
                      BP (mmHg)
                    </label>
                    <input
                      type="text"
                      value={vitalBp}
                      onChange={(e) => setVitalBp(e.target.value)}
                      placeholder="88/56"
                      style={{
                        width: '100%',
                        padding: '8px 4px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12px',
                        fontWeight: 700,
                        textAlign: 'center',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#64748b', marginBottom: '3px', textAlign: 'center' }}>
                      Pulse (bpm)
                    </label>
                    <input
                      type="number"
                      value={vitalPulse}
                      onChange={(e) => setVitalPulse(e.target.value)}
                      placeholder="124"
                      style={{
                        width: '100%',
                        padding: '8px 4px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12px',
                        fontWeight: 700,
                        textAlign: 'center',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#64748b', marginBottom: '3px', textAlign: 'center' }}>
                      SpO2 (%)
                    </label>
                    <input
                      type="number"
                      value={vitalSpo2}
                      onChange={(e) => setVitalSpo2(e.target.value)}
                      placeholder="89"
                      style={{
                        width: '100%',
                        padding: '8px 4px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12px',
                        fontWeight: 700,
                        textAlign: 'center',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#64748b', marginBottom: '3px', textAlign: 'center' }}>
                      Temp (°F)
                    </label>
                    <input
                      type="text"
                      value={vitalTemp}
                      onChange={(e) => setVitalTemp(e.target.value)}
                      placeholder="98.6"
                      style={{
                        width: '100%',
                        padding: '8px 4px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12px',
                        fontWeight: 700,
                        textAlign: 'center',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#64748b', marginBottom: '3px', textAlign: 'center' }}>
                      Sugar (mg/dL)
                    </label>
                    <input
                      type="number"
                      value={vitalSugar}
                      onChange={(e) => setVitalSugar(e.target.value)}
                      placeholder="130"
                      style={{
                        width: '100%',
                        padding: '8px 4px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12px',
                        fontWeight: 700,
                        textAlign: 'center',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#64748b', marginBottom: '3px', textAlign: 'center' }}>
                      GCS (3-15)
                    </label>
                    <input
                      type="number"
                      value={vitalGcs}
                      onChange={(e) => setVitalGcs(e.target.value)}
                      placeholder="14"
                      style={{
                        width: '100%',
                        padding: '8px 4px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12px',
                        fontWeight: 700,
                        textAlign: 'center',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Section 5: Clinical Urgency & Chief Complaints */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={15} color="#dc2626" />
                  <span>5. Clinical Urgency & Chief Presentation</span>
                </div>

                {/* Severity Selection Cards */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    Emergency Triage Severity Level *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    {[
                      { id: 'CRITICAL', label: '🔴 CRITICAL', desc: 'Immediate Life Threat' },
                      { id: 'SEVERE', label: '🟠 SEVERE', desc: 'Urgent Resuscitation' },
                      { id: 'MODERATE', label: '🟡 MODERATE', desc: 'Serious Condition' },
                    ].map((sev) => {
                      const isSelected = newSeverity === sev.id;
                      return (
                        <div
                          key={sev.id}
                          onClick={() => setNewSeverity(sev.id as EmergencySeverityLevel)}
                          style={{
                            padding: '10px',
                            borderRadius: '10px',
                            border: `2px solid ${
                              isSelected
                                ? sev.id === 'CRITICAL'
                                  ? '#dc2626'
                                  : sev.id === 'SEVERE'
                                  ? '#d97706'
                                  : '#2563eb'
                                : '#e2e8f0'
                            }`,
                            background: isSelected ? (sev.id === 'CRITICAL' ? '#fef2f2' : sev.id === 'SEVERE' ? '#fffbeb' : '#eff6ff') : '#ffffff',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>{sev.label}</div>
                          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>{sev.desc}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Chief Complaints Input with Quick Suggestions */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Chief Complaints (Comma separated) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newChiefComplaints}
                    onChange={(e) => setNewChiefComplaints(e.target.value)}
                    placeholder="e.g. Severe Chest Pain, Breathlessness, Cold Clammy Skin"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      color: '#0f172a',
                      boxSizing: 'border-box',
                      marginBottom: '6px',
                    }}
                  />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, alignSelf: 'center', marginRight: '4px' }}>
                      Quick Add:
                    </span>
                    {COMPLAINT_SUGGESTIONS.map((item, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleAddSuggestedComplaint(item)}
                        style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          fontSize: '10px',
                          fontWeight: 600,
                          color: '#475569',
                          cursor: 'pointer',
                        }}
                      >
                        + {item}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Detailed Presentation */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Detailed Clinical Presentation / Notes
                  </label>
                  <textarea
                    value={newSymptomsDesc}
                    onChange={(e) => setNewSymptomsDesc(e.target.value)}
                    rows={2}
                    placeholder="Describe patient condition, consciousness level, visible bleeding, or suspected diagnosis..."
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      color: '#0f172a',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div
              style={{
                padding: '16px 24px',
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                borderRadius: '0 0 20px 20px',
              }}
            >
              <button
                type="button"
                onClick={() => setIsRaiseModalOpen(false)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '10px 24px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(220, 38, 38, 0.45)',
                }}
              >
                <Siren size={16} />
                <span>{isSubmitting ? 'Broadcasting Emergency SOS...' : '🚨 Broadcast Emergency Pre-Alert'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PROPER MODAL 3: Audit Trail & Timeline Modal */}
      {/* ========================================================================= */}
      {selectedAlertForTimeline && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                background: '#0f172a',
                color: '#ffffff',
                borderBottom: '1px solid #334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                    Emergency Case Audit Trail ({selectedAlertForTimeline.alertNumber})
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                    Patient: {selectedAlertForTimeline.patientName} • {selectedAlertForTimeline.targetFacilityName}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedAlertForTimeline(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Metrics Breakdown */}
            <div style={{ padding: '20px 24px 0 24px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '10px',
                  background: '#f8fafc',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  textAlign: 'center',
                }}
              >
                <div>
                  <span style={{ fontSize: '10px', color: '#64748b', display: 'block', fontWeight: 700 }}>Response Time</span>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: '#d97706' }}>
                    {selectedAlertForTimeline.metrics.responseTimeMinutes !== null
                      ? `${selectedAlertForTimeline.metrics.responseTimeMinutes} min`
                      : 'Pending'}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#64748b', display: 'block', fontWeight: 700 }}>Transit Time</span>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: '#0284c7' }}>
                    {selectedAlertForTimeline.metrics.transitTimeMinutes !== null
                      ? `${selectedAlertForTimeline.metrics.transitTimeMinutes} min`
                      : 'In Progress'}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#64748b', display: 'block', fontWeight: 700 }}>Total Duration</span>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: '#059669' }}>
                    {selectedAlertForTimeline.metrics.totalDurationMinutes !== null
                      ? `${selectedAlertForTimeline.metrics.totalDurationMinutes} min`
                      : 'Active'}
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline Events List */}
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {selectedAlertForTimeline.timeline.map((entry, idx) => (
                <div key={entry.id || idx} style={{ display: 'flex', gap: '12px', position: 'relative' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: idx === 0 ? '#059669' : '#dc2626',
                        boxShadow: '0 0 6px rgba(220, 38, 38, 0.5)',
                        marginTop: '4px',
                      }}
                    />
                    {idx < selectedAlertForTimeline.timeline.length - 1 && (
                      <div style={{ width: '2px', flex: 1, background: '#e2e8f0', margin: '4px 0' }} />
                    )}
                  </div>

                  <div style={{ flex: 1, paddingBottom: idx < selectedAlertForTimeline.timeline.length - 1 ? '12px' : '0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>{entry.action}</span>
                      <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#64748b' }}>
                        {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      By <strong style={{ color: '#334155' }}>{entry.performedBy}</strong> ({entry.role})
                    </div>
                    {entry.notes && (
                      <div style={{ marginTop: '6px', fontSize: '12px', color: '#334155', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        {entry.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Actions Footer */}
            <div
              style={{
                padding: '16px 24px',
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'flex-end',
                borderRadius: '0 0 20px 20px',
              }}
            >
              <button
                onClick={() => setSelectedAlertForTimeline(null)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Close Audit Trail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
