import React, { useState, useEffect } from 'react';
import {
  Siren,
  AlertTriangle,
  Clock,
  MapPin,
  Phone,
  Truck,
  HeartPulse,
  Activity,
  CheckCircle2,
  Stethoscope,
  Send,
  Plus,
  RefreshCw,
  ChevronRight,
  ShieldAlert,
  ArrowLeft,
  FileText,
} from 'lucide-react';
import {
  EmergencyPreAlert,
  EmergencyAlertStatus,
  EmergencySeverityLevel,
  EmergencyTransportMode,
  EmergencyVitals,
  PHC,
  AppLanguage,
} from '@phc-connect/types';
import { apiClient } from '../services/api';

interface EmergencyPreAlertScreenProps {
  onBack?: () => void;
  lang?: AppLanguage;
  currentPatientId?: string;
  currentPatientName?: string;
}

export const EmergencyPreAlertScreen: React.FC<EmergencyPreAlertScreenProps> = ({
  onBack,
  lang = 'en',
  currentPatientId,
  currentPatientName,
}) => {
  const [activeTab, setActiveTab] = useState<'raise' | 'tracking'>('tracking');
  const [alerts, setAlerts] = useState<EmergencyPreAlert[]>([]);
  const [phcs, setPhcs] = useState<PHC[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [patientName, setPatientName] = useState<string>(currentPatientName || '');
  const [patientAge, setPatientAge] = useState<string>('35');
  const [patientGender, setPatientGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [patientPhone, setPatientPhone] = useState<string>('+91 ');
  const [sourceLocation, setSourceLocation] = useState<string>('Sub-Centre Village Camp');
  const [targetFacilityId, setTargetFacilityId] = useState<string>('phc-001');
  const [chiefComplaints, setChiefComplaints] = useState<string>('Severe Chest Pain, Low SpO2');
  const [symptomsDesc, setSymptomsDesc] = useState<string>('Patient sweating profusely, breathlessness.');
  const [transportMode, setTransportMode] = useState<EmergencyTransportMode>('AMBULANCE_108');
  const [vehicleNumber, setVehicleNumber] = useState<string>('DL-01-EM-108');
  const [etaMins, setEtaMins] = useState<string>('15');
  const [severity, setSeverity] = useState<EmergencySeverityLevel>('CRITICAL');

  // Vitals State
  const [vitalBp, setVitalBp] = useState<string>('90/60');
  const [vitalPulse, setVitalPulse] = useState<string>('120');
  const [vitalSpo2, setVitalSpo2] = useState<string>('88');
  const [vitalTemp, setVitalTemp] = useState<string>('98.6');

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData(false);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const [alertsRes, phcsRes] = await Promise.all([
        apiClient.get('/emergency-alerts'),
        apiClient.get('/phcs'),
      ]);

      if (alertsRes.success && alertsRes.alerts) {
        setAlerts(alertsRes.alerts);
        // If there's an active alert, default to tracking tab
        const hasActive = alertsRes.alerts.some(
          (a: EmergencyPreAlert) =>
            a.status === 'ALERT_RAISED' || a.status === 'ACKNOWLEDGED' || a.status === 'IN_TRANSIT'
        );
        if (hasActive && activeTab === 'tracking') {
          setActiveTab('tracking');
        }
      }
      if (phcsRes.success && phcsRes.phcs) {
        setPhcs(phcsRes.phcs);
      }
    } catch (err) {
      console.error('Failed to load emergency alerts:', err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const handleRaiseAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      alert('Please enter patient name');
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage(null);
    try {
      const parsedVitals: EmergencyVitals = {
        bp: vitalBp || undefined,
        pulse: vitalPulse ? Number(vitalPulse) : undefined,
        spO2: vitalSpo2 ? Number(vitalSpo2) : undefined,
        temperature: vitalTemp ? Number(vitalTemp) : undefined,
      };

      const res = await apiClient.post('/emergency-alerts', {
        patientId: currentPatientId || undefined,
        patientName,
        patientAge: Number(patientAge) || 30,
        patientGender,
        patientPhone,
        sourceLocation,
        targetFacilityId,
        chiefComplaints: chiefComplaints.split(',').map((c) => c.trim()),
        symptomsDescription: symptomsDesc,
        vitals: parsedVitals,
        severity,
        transportMode,
        ambulanceVehicleNumber: vehicleNumber,
        estimatedArrivalMinutes: Number(etaMins) || 15,
      });

      if (res.success) {
        setSuccessMessage(`Emergency Alert ${res.alert?.alertNumber || ''} Broadcasted to Doctor!`);
        setActiveTab('tracking');
        await loadData(false);
      }
    } catch (err) {
      console.error('Error raising emergency pre-alert:', err);
      alert('Failed to broadcast emergency pre-alert');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeAlerts = alerts.filter(
    (a) => a.status === 'ALERT_RAISED' || a.status === 'ACKNOWLEDGED' || a.status === 'IN_TRANSIT'
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-red-900 p-4 sticky top-0 z-30 border-b border-red-800/40 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="p-2 bg-red-600/30 border border-red-500/40 rounded-xl text-red-400">
            <Siren className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-1.5">
              Emergency Pre-Alert
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/30 text-red-300 font-mono">
                ASHA SOS
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              Inbound casualty alert to PHC/CHC Casualty Desk
            </p>
          </div>
        </div>

        <button
          onClick={() => loadData(true)}
          className="p-2 bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition"
          title="Refresh live status"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-900 border-b border-slate-800 p-1.5">
        <button
          onClick={() => setActiveTab('tracking')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
            activeTab === 'tracking'
              ? 'bg-red-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Active Tracking ({activeAlerts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('raise')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
            activeTab === 'raise'
              ? 'bg-red-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Raise New Alert</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="m-4 p-3 bg-emerald-950/80 border border-emerald-600/60 rounded-xl text-emerald-300 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Quick SOS Call Buttons */}
      <div className="p-4 grid grid-cols-2 gap-2">
        <a
          href="tel:108"
          className="flex items-center justify-center gap-2 py-2.5 px-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-red-950 transition text-center"
        >
          <Phone className="w-4 h-4" />
          <span>Call 108 Ambulance</span>
        </a>
        <a
          href="tel:112"
          className="flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs border border-slate-700 transition text-center"
        >
          <ShieldAlert className="w-4 h-4 text-yellow-400" />
          <span>Call 112 Emergency</span>
        </a>
      </div>

      {/* TAB 1: Live Tracking Screen */}
      {activeTab === 'tracking' && (
        <div className="p-4 space-y-4">
          {activeAlerts.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-base font-bold text-white">No In-Transit Emergency Cases</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                No active emergency pre-alerts en-route at this time. Click "Raise New Alert" to notify the PHC casualty team.
              </p>
              <button
                onClick={() => setActiveTab('raise')}
                className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-xl shadow mt-2"
              >
                Raise Emergency Alert
              </button>
            </div>
          ) : (
            activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-slate-900 border border-red-800/60 rounded-2xl overflow-hidden shadow-xl space-y-3"
              >
                {/* Alert Top Strip */}
                <div className="bg-gradient-to-r from-red-950 to-slate-900 p-3.5 border-b border-red-800/40 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-red-400 font-bold tracking-wider uppercase">
                      {alert.alertNumber}
                    </span>
                    <h3 className="text-base font-bold text-white mt-0.5">
                      {alert.patientName} ({alert.patientAge}y • {alert.patientGender})
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-600 text-white inline-flex items-center gap-1 animate-pulse">
                      <AlertTriangle className="w-3 h-3" />
                      {alert.severity}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">
                      ETA ~{alert.liveEta?.remainingMinutes || alert.estimatedArrivalMinutes} min
                    </p>
                  </div>
                </div>

                {/* Status Progression Lifecycle */}
                <div className="px-4 py-2 bg-slate-950/70 border-b border-slate-800/80">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
                    <span className={alert.status === 'ALERT_RAISED' ? 'text-red-400 font-bold' : ''}>
                      1. Alert Raised
                    </span>
                    <span className={alert.status === 'ACKNOWLEDGED' ? 'text-blue-400 font-bold' : ''}>
                      2. Acknowledged
                    </span>
                    <span className={alert.status === 'IN_TRANSIT' ? 'text-amber-400 font-bold' : ''}>
                      3. In Transit
                    </span>
                    <span className={alert.status === 'ARRIVED' ? 'text-emerald-400 font-bold' : ''}>
                      4. Arrived
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                    <div
                      className="bg-red-500 h-full transition-all duration-500"
                      style={{
                        width:
                          alert.status === 'ALERT_RAISED'
                            ? '25%'
                            : alert.status === 'ACKNOWLEDGED'
                            ? '50%'
                            : alert.status === 'IN_TRANSIT'
                            ? '75%'
                            : alert.status === 'ARRIVED'
                            ? '90%'
                            : '100%',
                      }}
                    />
                  </div>
                </div>

                {/* Vitals Mini Badge */}
                <div className="px-4 grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-400 block font-medium">BP</span>
                    <span className="font-bold text-white text-xs">{alert.vitals.bp || '--'}</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-400 block font-medium">SpO2</span>
                    <span className="font-bold text-red-400 text-xs">
                      {alert.vitals.spO2 ? `${alert.vitals.spO2}%` : '--'}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-400 block font-medium">Pulse</span>
                    <span className="font-bold text-white text-xs">{alert.vitals.pulse || '--'}</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-400 block font-medium">Temp</span>
                    <span className="font-bold text-white text-xs">{alert.vitals.temperature || '--'}°</span>
                  </div>
                </div>

                {/* Doctor's Preparation Instructions (Crucial for ASHA) */}
                {alert.doctorPreparationInstructions && alert.doctorPreparationInstructions.length > 0 ? (
                  <div className="mx-4 p-3 bg-blue-950/40 border border-blue-600/50 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs text-blue-300 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Stethoscope className="w-4 h-4 text-blue-400" />
                        Doctor Instructions ({alert.acknowledgedByDoctorName || 'Duty Doctor'})
                      </span>
                      <span className="text-[10px] font-mono text-blue-400 bg-blue-900/50 px-2 py-0.5 rounded">
                        {alert.bedAssigned || 'Red Bay'}
                      </span>
                    </div>

                    <ul className="space-y-1 text-xs text-slate-200">
                      {alert.doctorPreparationInstructions.map((inst, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-blue-400 font-bold">✓</span>
                          <span>{inst}</span>
                        </li>
                      ))}
                    </ul>

                    {alert.doctorPreparationNotes && (
                      <p className="text-[11px] text-slate-300 italic bg-blue-950/60 p-2 rounded-lg border border-blue-800/40">
                        "{alert.doctorPreparationNotes}"
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mx-4 p-3 bg-red-950/30 border border-dashed border-red-700/50 rounded-xl flex items-center gap-2 text-xs text-red-300">
                    <Clock className="w-4 h-4 text-red-400 animate-spin" />
                    <span>Awaiting Doctor Acknowledgment & Preparation Protocols...</span>
                  </div>
                )}

                {/* Target PHC & Ambulance Info */}
                <div className="px-4 py-3 bg-slate-950 border-t border-slate-800/80 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-red-400" />
                      Destination: <strong className="text-white">{alert.targetFacilityName}</strong>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>Transport: {alert.transportMode.replace('_', ' ')} ({alert.ambulanceVehicleNumber})</span>
                    <span>ASHA: {alert.ashaWorkerName}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: Raise New Alert Form */}
      {activeTab === 'raise' && (
        <form onSubmit={handleRaiseAlert} className="p-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <Siren className="w-4 h-4 text-red-500" />
              Patient Identification
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Patient Name *
              </label>
              <input
                type="text"
                required
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. Rameshwar Prasad"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Age *</label>
                <input
                  type="number"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Gender *</label>
                <select
                  value={patientGender}
                  onChange={(e: any) => setPatientGender(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Pickup Village / Sub-Centre *
              </label>
              <input
                type="text"
                required
                value={sourceLocation}
                onChange={(e) => setSourceLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>
          </div>

          {/* Vitals Assessment */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <HeartPulse className="w-4 h-4 text-red-400" />
              On-Scene Vitals
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Blood Pressure</label>
                <input
                  type="text"
                  value={vitalBp}
                  onChange={(e) => setVitalBp(e.target.value)}
                  placeholder="88/56"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white text-center font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">SpO2 Oxygen %</label>
                <input
                  type="number"
                  value={vitalSpo2}
                  onChange={(e) => setVitalSpo2(e.target.value)}
                  placeholder="88"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-red-400 text-center font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Pulse (bpm)</label>
                <input
                  type="number"
                  value={vitalPulse}
                  onChange={(e) => setVitalPulse(e.target.value)}
                  placeholder="120"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white text-center font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Temperature (°F)</label>
                <input
                  type="text"
                  value={vitalTemp}
                  onChange={(e) => setVitalTemp(e.target.value)}
                  placeholder="98.6"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white text-center font-bold"
                />
              </div>
            </div>
          </div>

          {/* Clinical Symptoms & Destination */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <Truck className="w-4 h-4 text-sky-400" />
              Transfer & Target Facility
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Destination PHC / CHC *
              </label>
              <select
                value={targetFacilityId}
                onChange={(e) => setTargetFacilityId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              >
                {phcs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Chief Emergency Complaints *
              </label>
              <input
                type="text"
                required
                value={chiefComplaints}
                onChange={(e) => setChiefComplaints(e.target.value)}
                placeholder="Severe chest pain, breathlessness, vomiting"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Severity *</label>
                <select
                  value={severity}
                  onChange={(e: any) => setSeverity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-bold"
                >
                  <option value="CRITICAL">🔴 Critical (Immediate)</option>
                  <option value="SEVERE">🟠 Severe (Urgent)</option>
                  <option value="MODERATE">🟡 Moderate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Estimated Arrival (min) *
                </label>
                <input
                  type="number"
                  required
                  value={etaMins}
                  onChange={(e) => setEtaMins(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-bold"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl shadow-xl shadow-red-950 transition flex items-center justify-center gap-2 text-sm"
          >
            <Siren className="w-5 h-5 animate-pulse" />
            <span>{isSubmitting ? 'Broadcasting Alert...' : 'Broadcast Emergency Pre-Alert'}</span>
          </button>
        </form>
      )}
    </div>
  );
};
