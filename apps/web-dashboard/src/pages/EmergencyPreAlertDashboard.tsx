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
        ? [PRESET_INSTRUCTIONS[0], PRESET_INSTRUCTIONS[1], PRESET_INSTRUCTIONS[2]]
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
        setSelectedAlertForAck(null);
        await loadData(false);
      }
    } catch (err) {
      console.error('Failed to acknowledge emergency alert:', err);
      alert('Failed to acknowledge emergency alert');
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
        await loadData(false);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update status');
    }
  };

  const handleRaiseAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim()) {
      alert('Please enter patient name');
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
        chiefComplaints: newChiefComplaints.split(',').map((c) => c.trim()),
        symptomsDescription: newSymptomsDesc,
        vitals: parsedVitals,
        severity: newSeverity,
        transportMode: newTransportMode,
        ambulanceVehicleNumber: newVehicleNumber,
        estimatedArrivalMinutes: Number(newEtaMins) || 15,
      });

      if (res.success) {
        setIsRaiseModalOpen(false);
        // Reset form
        setNewPatientName('');
        setNewChiefComplaints('Severe Chest Pain, Breathlessness');
        await loadData(false);
      }
    } catch (err) {
      console.error('Failed to raise emergency pre-alert:', err);
      alert('Failed to dispatch emergency pre-alert');
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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-red-950 via-slate-900 to-red-900 p-6 rounded-2xl border border-red-800/40 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600/30 border border-red-500/40 rounded-xl text-red-400 animate-pulse">
              <Siren className="w-7 h-7 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Emergency Pre-Alert & Casualty Triage
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-500/30 text-red-300 border border-red-500/40 font-mono">
                  LIVE ETA
                </span>
              </h1>
              <p className="text-slate-300 text-sm">
                Real-time inbound casualty pre-notifications from ASHA workers, triage preparation protocols, and live ETA tracking.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => loadData(true)}
            className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition flex items-center gap-2 text-sm"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setIsRaiseModalOpen(true)}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl shadow-lg shadow-red-600/30 hover:shadow-red-600/50 transition flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Raise Pre-Alert (ASHA)</span>
          </button>
        </div>
      </div>

      {/* Critical Broadcast Banner if active critical case exists */}
      {activeCriticalAlerts.length > 0 && (
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 p-4 rounded-xl text-white shadow-lg shadow-red-900/30 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-yellow-200" />
            <div>
              <p className="font-bold text-sm tracking-wide uppercase">
                🚨 CRITICAL INCOMING CASUALTY ALERT ({activeCriticalAlerts.length} Active Case{activeCriticalAlerts.length > 1 ? 's' : ''})
              </p>
              <p className="text-xs text-red-100">
                {activeCriticalAlerts[0].patientName} ({activeCriticalAlerts[0].patientAge}y {activeCriticalAlerts[0].patientGender}) – ETA ~
                {activeCriticalAlerts[0].liveEta?.remainingMinutes || 10} mins ({activeCriticalAlerts[0].sourceLocation}) – {activeCriticalAlerts[0].chiefComplaints[0]}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleOpenAcknowledge(activeCriticalAlerts[0])}
            className="px-3.5 py-1.5 bg-white text-red-700 font-bold rounded-lg text-xs hover:bg-red-50 transition shadow"
          >
            {activeCriticalAlerts[0].status === 'ALERT_RAISED' ? 'Acknowledge Now' : 'View Protocol'}
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Emergency Alerts</span>
            <Radio className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{metrics?.totalAlerts || alerts.length}</p>
          <span className="text-[11px] text-emerald-400 font-medium">ASHA Outreach Network</span>
        </div>

        <div className="bg-slate-900/90 border border-red-900/40 p-4 rounded-xl">
          <div className="flex items-center justify-between text-red-400 text-xs font-medium">
            <span>Active Inbound Cases</span>
            <Siren className="w-4 h-4 text-red-400 animate-pulse" />
          </div>
          <p className="text-2xl font-bold text-red-400 mt-2">{metrics?.activeIncomingAlerts || 0}</p>
          <span className="text-[11px] text-red-300 font-medium">{metrics?.criticalCases || 0} Critical Priority</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Avg. Triage Response</span>
            <Timer className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-2">{metrics?.avgResponseTimeMinutes || 3} min</p>
          <span className="text-[11px] text-slate-400">Raised ➔ Doctor Prepared</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Avg. Transit Duration</span>
            <Truck className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-bold text-sky-400 mt-2">{metrics?.avgTransitTimeMinutes || 18} min</p>
          <span className="text-[11px] text-slate-400">108 Ambulance / Transport</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs text-slate-400 font-medium px-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          {['ACTIVE', 'ALL', 'ALERT_RAISED', 'ACKNOWLEDGED', 'IN_TRANSIT', 'ARRIVED', 'HANDED_OVER'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                statusFilter === st
                  ? 'bg-red-600 text-white font-semibold shadow'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {st === 'ACTIVE'
                ? '⚡ Active Incoming'
                : st === 'ALERT_RAISED'
                ? 'Alert Raised'
                : st === 'ACKNOWLEDGED'
                ? 'Acknowledged'
                : st === 'IN_TRANSIT'
                ? 'In Transit'
                : st === 'ARRIVED'
                ? 'Arrived'
                : st === 'HANDED_OVER'
                ? 'Handed Over'
                : 'All Cases'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient, complaint, ASHA..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500"
            />
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-300 px-3 py-1.5 focus:outline-none focus:border-red-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">🔴 Critical Only</option>
            <option value="SEVERE">🟠 Severe Only</option>
            <option value="MODERATE">🟡 Moderate Only</option>
          </select>
        </div>
      </div>

      {/* Alerts Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 space-y-3 bg-slate-900/40 rounded-2xl border border-slate-800">
          <RefreshCw className="w-8 h-8 text-red-500 animate-spin" />
          <p className="text-slate-400 text-sm">Syncing live emergency inbound pre-alerts...</p>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 space-y-3 bg-slate-900/40 rounded-2xl border border-slate-800 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500/80" />
          <p className="text-slate-200 font-semibold text-lg">No Active Incoming Emergency Alerts</p>
          <p className="text-slate-400 text-xs max-w-md">
            All registered emergency alerts have concluded or no cases match the selected filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredAlerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL';
            const isSevere = alert.severity === 'SEVERE';
            const isActive =
              alert.status === 'ALERT_RAISED' || alert.status === 'ACKNOWLEDGED' || alert.status === 'IN_TRANSIT';

            return (
              <div
                key={alert.id}
                className={`bg-slate-900/90 rounded-2xl border transition-all duration-200 overflow-hidden shadow-lg flex flex-col justify-between ${
                  isCritical
                    ? 'border-red-600/60 shadow-red-950/40'
                    : isSevere
                    ? 'border-amber-600/40'
                    : 'border-slate-800'
                }`}
              >
                {/* Card Top Header */}
                <div
                  className={`px-5 py-3.5 flex items-center justify-between border-b ${
                    isCritical
                      ? 'bg-red-950/50 border-red-900/50'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wide flex items-center gap-1.5 ${
                        isCritical
                          ? 'bg-red-600 text-white animate-pulse'
                          : isSevere
                          ? 'bg-amber-600 text-white'
                          : 'bg-yellow-600 text-slate-900'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {alert.severity}
                    </span>

                    <span className="font-mono text-xs text-slate-400 font-medium">
                      {alert.alertNumber}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Live ETA Badge */}
                    {isActive && alert.liveEta && (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500/20 border border-red-500/40 text-red-300 rounded-full text-xs font-semibold">
                        <Clock className="w-3.5 h-3.5 text-red-400 animate-spin" />
                        <span>ETA: {alert.liveEta.remainingMinutes} min</span>
                      </div>
                    )}

                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold uppercase ${
                        alert.status === 'ALERT_RAISED'
                          ? 'bg-red-900/60 text-red-300 border border-red-700/50'
                          : alert.status === 'ACKNOWLEDGED'
                          ? 'bg-blue-900/60 text-blue-300 border border-blue-700/50'
                          : alert.status === 'IN_TRANSIT'
                          ? 'bg-amber-900/60 text-amber-300 border border-amber-700/50'
                          : alert.status === 'ARRIVED'
                          ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {alert.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Patient & Clinical Overview */}
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        {alert.patientName}
                        <span className="text-xs font-normal text-slate-400">
                          ({alert.patientAge}y • {alert.patientGender})
                        </span>
                      </h3>
                      <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-red-400" />
                          {alert.sourceLocation}
                        </span>
                        {alert.patientPhone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-500" />
                            {alert.patientPhone}
                          </span>
                        )}
                        {alert.patientAbhaId && (
                          <span className="text-slate-500 font-mono">
                            ABHA: {alert.patientAbhaId}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1.5 text-xs text-sky-400 justify-end font-medium">
                        <Truck className="w-4 h-4 text-sky-400" />
                        <span>{alert.transportMode.replace('_', ' ')}</span>
                      </div>
                      {alert.ambulanceVehicleNumber && (
                        <p className="text-[11px] font-mono text-slate-400">
                          {alert.ambulanceVehicleNumber}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Vitals Grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                    <div className="text-center p-1.5 rounded-lg bg-slate-900/60">
                      <span className="text-[10px] text-slate-400 block font-medium">BP (mmHg)</span>
                      <span
                        className={`text-xs font-bold ${
                          alert.vitals.bp?.startsWith('8') || (alert.vitals.bp && parseInt(alert.vitals.bp) > 160)
                            ? 'text-red-400 font-extrabold'
                            : 'text-white'
                        }`}
                      >
                        {alert.vitals.bp || '--/--'}
                      </span>
                    </div>

                    <div className="text-center p-1.5 rounded-lg bg-slate-900/60">
                      <span className="text-[10px] text-slate-400 block font-medium">Pulse (bpm)</span>
                      <span
                        className={`text-xs font-bold ${
                          alert.vitals.pulse && (alert.vitals.pulse > 120 || alert.vitals.pulse < 50)
                            ? 'text-red-400 font-extrabold'
                            : 'text-white'
                        }`}
                      >
                        {alert.vitals.pulse ? `${alert.vitals.pulse}` : '--'}
                      </span>
                    </div>

                    <div className="text-center p-1.5 rounded-lg bg-slate-900/60">
                      <span className="text-[10px] text-slate-400 block font-medium">SpO2 (%)</span>
                      <span
                        className={`text-xs font-bold ${
                          alert.vitals.spO2 && alert.vitals.spO2 < 92
                            ? 'text-red-400 font-extrabold'
                            : 'text-emerald-400'
                        }`}
                      >
                        {alert.vitals.spO2 ? `${alert.vitals.spO2}%` : '--%'}
                      </span>
                    </div>

                    <div className="text-center p-1.5 rounded-lg bg-slate-900/60">
                      <span className="text-[10px] text-slate-400 block font-medium">Temp (°F)</span>
                      <span className="text-xs font-bold text-white">
                        {alert.vitals.temperature ? `${alert.vitals.temperature}°` : '--'}
                      </span>
                    </div>

                    <div className="text-center p-1.5 rounded-lg bg-slate-900/60">
                      <span className="text-[10px] text-slate-400 block font-medium">Glucose</span>
                      <span className="text-xs font-bold text-white">
                        {alert.vitals.bloodSugar ? `${alert.vitals.bloodSugar}` : '--'}
                      </span>
                    </div>

                    <div className="text-center p-1.5 rounded-lg bg-slate-900/60">
                      <span className="text-[10px] text-slate-400 block font-medium">GCS Score</span>
                      <span
                        className={`text-xs font-bold ${
                          alert.vitals.gcsScore && alert.vitals.gcsScore < 13
                            ? 'text-amber-400 font-extrabold'
                            : 'text-white'
                        }`}
                      >
                        {alert.vitals.gcsScore ? `${alert.vitals.gcsScore}/15` : '--'}
                      </span>
                    </div>
                  </div>

                  {/* Chief Complaints & Symptoms */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap gap-1.5">
                      {alert.chiefComplaints.map((cc, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 bg-red-950/40 text-red-300 border border-red-800/40 rounded-md text-xs font-medium"
                        >
                          {cc}
                        </span>
                      ))}
                    </div>
                    {alert.symptomsDescription && (
                      <p className="text-xs text-slate-300 line-clamp-2 italic bg-slate-950/40 p-2 rounded-lg border border-slate-800/40">
                        "{alert.symptomsDescription}"
                      </p>
                    )}
                  </div>

                  {/* Doctor Preparation Instructions Box */}
                  {alert.doctorPreparationInstructions && alert.doctorPreparationInstructions.length > 0 ? (
                    <div className="bg-blue-950/30 border border-blue-800/40 p-3 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-blue-300 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-blue-400" />
                          Doctor Prepared by {alert.acknowledgedByDoctorName || 'Duty Doctor'}
                        </span>
                        <span className="text-[11px] font-mono text-blue-400">
                          {alert.bedAssigned || 'Red Bay'}
                        </span>
                      </div>
                      <ul className="space-y-1 text-xs text-slate-300">
                        {alert.doctorPreparationInstructions.slice(0, 3).map((inst, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-blue-400 font-bold">•</span>
                            <span>{inst}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : alert.status === 'ALERT_RAISED' ? (
                    <div className="bg-red-950/40 border border-dashed border-red-700/60 p-3 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-red-300">
                        <Siren className="w-4 h-4 text-red-400 animate-pulse" />
                        <span>Awaiting Doctor Acknowledgment & Bay Preparation</span>
                      </div>
                      <button
                        onClick={() => handleOpenAcknowledge(alert)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg text-xs shadow transition"
                      >
                        Acknowledge & Prepare
                      </button>
                    </div>
                  ) : null}

                  {/* ASHA Info Row */}
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        ASHA: <strong className="text-slate-200">{alert.ashaWorkerName}</strong>
                      </span>
                      {alert.ashaWorkerPhone && (
                        <a
                          href={`tel:${alert.ashaWorkerPhone}`}
                          className="text-sky-400 hover:underline ml-1"
                        >
                          ({alert.ashaWorkerPhone})
                        </a>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedAlertForTimeline(alert)}
                      className="text-slate-400 hover:text-slate-200 flex items-center gap-1 text-[11px] underline"
                    >
                      Audit Trail ({alert.timeline.length})
                    </button>
                  </div>
                </div>

                {/* Card Actions Bottom Footer */}
                <div className="px-5 py-3 bg-slate-950/80 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-500">
                    Raised: {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {alert.metrics.responseTimeMinutes && (
                      <span className="ml-2 text-amber-400 font-medium">
                        (Ack in {alert.metrics.responseTimeMinutes}m)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {alert.status === 'ALERT_RAISED' && (
                      <button
                        onClick={() => handleOpenAcknowledge(alert)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold shadow transition"
                      >
                        Acknowledge
                      </button>
                    )}

                    {alert.status === 'ACKNOWLEDGED' && (
                      <>
                        <button
                          onClick={() => handleOpenAcknowledge(alert)}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"
                        >
                          Edit Protocol
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(alert.id, 'IN_TRANSIT')}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow transition flex items-center gap-1"
                        >
                          <Truck className="w-3 h-3" />
                          Mark In-Transit
                        </button>
                      </>
                    )}

                    {alert.status === 'IN_TRANSIT' && (
                      <button
                        onClick={() => handleUpdateStatus(alert.id, 'ARRIVED')}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Mark Arrived at Casualty
                      </button>
                    )}

                    {alert.status === 'ARRIVED' && (
                      <button
                        onClick={() => handleUpdateStatus(alert.id, 'HANDED_OVER')}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow transition flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Complete Handover & Admit
                      </button>
                    )}

                    {alert.status === 'HANDED_OVER' && (
                      <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Handover Complete
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Doctor Acknowledgment & Preparation Instructions */}
      {selectedAlertForAck && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-red-400" />
                  Doctor Triage Acknowledgment & Preparation
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Patient: <strong className="text-white">{selectedAlertForAck.patientName}</strong> ({selectedAlertForAck.patientAge}y) •{' '}
                  <span className="text-red-400 font-semibold">{selectedAlertForAck.severity}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedAlertForAck(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Quick Bed & Team Assignment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Assign Emergency Bed / Bay
                </label>
                <input
                  type="text"
                  value={bedAssigned}
                  onChange={(e) => setBedAssigned(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
                  placeholder="e.g. Emergency Red Bay Bed 1"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Assign Triage / Response Team
                </label>
                <input
                  type="text"
                  value={teamAssigned}
                  onChange={(e) => setTeamAssigned(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
                  placeholder="e.g. Trauma & Resuscitation Team Alpha"
                />
              </div>
            </div>

            {/* Preparation Checklist */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-200">
                Select Preparation Instructions (Sent instantly to ASHA & Nursing team):
              </label>
              <div className="space-y-2 max-h-56 overflow-y-auto p-1 bg-slate-950/60 rounded-xl border border-slate-800">
                {PRESET_INSTRUCTIONS.map((inst, index) => {
                  const isChecked = selectedInstructions.includes(inst);
                  return (
                    <div
                      key={index}
                      onClick={() => toggleInstruction(inst)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-start gap-2.5 transition ${
                        isChecked
                          ? 'bg-blue-950/40 border-blue-600/60 text-white'
                          : 'bg-slate-900/40 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                      )}
                      <span>{inst}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Instruction Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                placeholder="Add custom clinical instruction..."
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomInstruction();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddCustomInstruction}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700"
              >
                Add
              </button>
            </div>

            {/* Doctor Clinical Notes */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Attending Physician Notes / Instructions for En-Route ASHA Worker
              </label>
              <textarea
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Keep patient head elevated. Administer oxygen. Monitor pulse every 5 minutes."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedAlertForAck(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitAcknowledge}
                disabled={isSubmitting}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-red-600/30 transition flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Dispatching...' : 'Acknowledge & Dispatch Instructions'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Full Audit Trail & Timeline */}
      {selectedAlertForTimeline && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-sky-400" />
                  Emergency Audit Trail ({selectedAlertForTimeline.alertNumber})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Patient: {selectedAlertForTimeline.patientName} • Facility: {selectedAlertForTimeline.targetFacilityName}
                </p>
              </div>
              <button
                onClick={() => setSelectedAlertForTimeline(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-3 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Response Time</span>
                <span className="text-sm font-bold text-amber-400">
                  {selectedAlertForTimeline.metrics.responseTimeMinutes !== null
                    ? `${selectedAlertForTimeline.metrics.responseTimeMinutes} min`
                    : 'Pending'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Transit Time</span>
                <span className="text-sm font-bold text-sky-400">
                  {selectedAlertForTimeline.metrics.transitTimeMinutes !== null
                    ? `${selectedAlertForTimeline.metrics.transitTimeMinutes} min`
                    : 'In Progress'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Total Duration</span>
                <span className="text-sm font-bold text-emerald-400">
                  {selectedAlertForTimeline.metrics.totalDurationMinutes !== null
                    ? `${selectedAlertForTimeline.metrics.totalDurationMinutes} min`
                    : 'Active'}
                </span>
              </div>
            </div>

            {/* Timeline Events */}
            <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {selectedAlertForTimeline.timeline.map((entry, idx) => (
                <div key={entry.id || idx} className="relative">
                  <div className="absolute -left-[22px] top-1 w-3 h-3 rounded-full bg-red-500 border-2 border-slate-900" />
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{entry.action}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      By <strong className="text-slate-300">{entry.performedBy}</strong> ({entry.role})
                    </p>
                    {entry.notes && (
                      <p className="text-xs text-slate-300 bg-slate-950/70 p-2 rounded-lg border border-slate-800 mt-1">
                        {entry.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedAlertForTimeline(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
              >
                Close Audit Trail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Raise Emergency Pre-Alert (ASHA Worker Workflow) */}
      {isRaiseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleRaiseAlert}
            className="bg-slate-900 border border-red-800/60 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Siren className="w-5 h-5 text-red-500 animate-pulse" />
                  Raise Emergency Pre-Alert (ASHA Worker)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Broadcasts instant alert to target PHC/CHC medical officers, emergency nursing staff, and casualty triage.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRaiseModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Patient Identifiers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Patient Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  placeholder="e.g. Rameshwar Prasad"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Age & Gender *
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={newPatientAge}
                    onChange={(e) => setNewPatientAge(e.target.value)}
                    className="w-16 px-2 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  />
                  <select
                    value={newPatientGender}
                    onChange={(e: any) => setNewPatientGender(e.target.value)}
                    className="flex-1 px-2 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Location & Target PHC */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Source Sub-Centre / Village *
                </label>
                <input
                  type="text"
                  required
                  value={newSourceLocation}
                  onChange={(e) => setNewSourceLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Destination Target PHC/CHC *
                </label>
                <select
                  value={newTargetFacilityId}
                  onChange={(e) => setNewTargetFacilityId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
                >
                  {phcs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.type})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Vitals Input Grid */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-200">
                Patient Vitals on Scene:
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">BP (mmHg)</span>
                  <input
                    type="text"
                    value={vitalBp}
                    onChange={(e) => setVitalBp(e.target.value)}
                    placeholder="88/56"
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white text-center"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Pulse (bpm)</span>
                  <input
                    type="number"
                    value={vitalPulse}
                    onChange={(e) => setVitalPulse(e.target.value)}
                    placeholder="120"
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white text-center"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">SpO2 (%)</span>
                  <input
                    type="number"
                    value={vitalSpo2}
                    onChange={(e) => setVitalSpo2(e.target.value)}
                    placeholder="89"
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white text-center"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Temp (°F)</span>
                  <input
                    type="text"
                    value={vitalTemp}
                    onChange={(e) => setVitalTemp(e.target.value)}
                    placeholder="98.6"
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white text-center"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Glucose</span>
                  <input
                    type="number"
                    value={vitalSugar}
                    onChange={(e) => setVitalSugar(e.target.value)}
                    placeholder="130"
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white text-center"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">GCS (3-15)</span>
                  <input
                    type="number"
                    value={vitalGcs}
                    onChange={(e) => setVitalGcs(e.target.value)}
                    placeholder="14"
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white text-center"
                  />
                </div>
              </div>
            </div>

            {/* Complaints & Severity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Chief Complaints (comma separated) *
                </label>
                <input
                  type="text"
                  required
                  value={newChiefComplaints}
                  onChange={(e) => setNewChiefComplaints(e.target.value)}
                  placeholder="e.g. Chest Pain, Cold Sweating, Dyspnea"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Emergency Severity Level *
                </label>
                <select
                  value={newSeverity}
                  onChange={(e: any) => setNewSeverity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
                >
                  <option value="CRITICAL">🔴 CRITICAL (Immediate Life Threat)</option>
                  <option value="SEVERE">🟠 SEVERE (Urgent Intervention)</option>
                  <option value="MODERATE">🟡 MODERATE (Potentially Serious)</option>
                </select>
              </div>
            </div>

            {/* Transport & ETA */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Transport Mode
                </label>
                <select
                  value={newTransportMode}
                  onChange={(e: any) => setNewTransportMode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                >
                  <option value="AMBULANCE_108">108 Ambulance</option>
                  <option value="PRIVATE_VEHICLE">Private Vehicle</option>
                  <option value="AUTO_RICKSHAW">Auto Rickshaw</option>
                  <option value="COMMUNITY_TRANSPORT">Community Transport</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Vehicle / Ambulance No.
                </label>
                <input
                  type="text"
                  value={newVehicleNumber}
                  onChange={(e) => setNewVehicleNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Estimated Arrival (mins) *
                </label>
                <input
                  type="number"
                  required
                  value={newEtaMins}
                  onChange={(e) => setNewEtaMins(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>
            </div>

            {/* Clinical Symptoms Description */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Detailed Clinical Presentation / Notes
              </label>
              <textarea
                value={newSymptomsDesc}
                onChange={(e) => setNewSymptomsDesc(e.target.value)}
                rows={2}
                placeholder="Describe current patient condition, consciousness level, visible bleeding, or known allergies..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsRaiseModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-red-600/30 transition flex items-center gap-2"
              >
                <Siren className="w-4 h-4" />
                <span>{isSubmitting ? 'Broadcasting...' : 'Broadcast Emergency Pre-Alert'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
