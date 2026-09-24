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
  X,
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
    <div style={{ minHeight: '100vh', background: '#090d16', color: '#f1f5f9', paddingBottom: '80px', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Top Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #7f1d1d 0%, #0f172a 60%, #881337 100%)',
          padding: '16px',
          position: 'sticky',
          top: 0,
          zIndex: 30,
          borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                padding: '8px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.25)',
              border: '1px solid #f87171',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fca5a5',
            }}
          >
            <Siren size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h1 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                Emergency Pre-Alert
              </h1>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.4)',
                  color: '#fecaca',
                  border: '1px solid #f87171',
                }}
              >
                ASHA SOS
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
              Inbound casualty broadcast to PHC Casualty
            </p>
          </div>
        </div>

        <button
          onClick={() => loadData(true)}
          style={{
            padding: '8px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            color: '#cbd5e1',
            cursor: 'pointer',
          }}
          title="Refresh live status"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', background: '#0f172a', borderBottom: '1px solid #1e293b', padding: '6px' }}>
        <button
          onClick={() => setActiveTab('tracking')}
          style={{
            flex: 1,
            padding: '8px',
            fontSize: '12px',
            fontWeight: 800,
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            background: activeTab === 'tracking' ? '#dc2626' : 'transparent',
            color: activeTab === 'tracking' ? '#ffffff' : '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
          }}
        >
          <Clock size={14} />
          <span>Active Tracking ({activeAlerts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('raise')}
          style={{
            flex: 1,
            padding: '8px',
            fontSize: '12px',
            fontWeight: 800,
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            background: activeTab === 'raise' ? '#dc2626' : 'transparent',
            color: activeTab === 'raise' ? '#ffffff' : '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
          }}
        >
          <Plus size={14} />
          <span>Raise New Alert</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div
          style={{
            margin: '16px',
            padding: '12px 16px',
            background: 'rgba(5, 150, 105, 0.2)',
            border: '1px solid #059669',
            borderRadius: '12px',
            color: '#6ee7b7',
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} color="#34d399" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} style={{ background: 'none', border: 'none', color: '#6ee7b7', cursor: 'pointer' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Quick SOS Call Buttons */}
      <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <a
          href="tel:108"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: '#ffffff',
            fontWeight: 800,
            borderRadius: '12px',
            fontSize: '12px',
            textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)',
          }}
        >
          <Phone size={15} />
          <span>Call 108 Ambulance</span>
        </a>
        <a
          href="tel:112"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px',
            background: '#1e293b',
            color: '#f8fafc',
            fontWeight: 800,
            borderRadius: '12px',
            fontSize: '12px',
            textDecoration: 'none',
            border: '1px solid #334155',
          }}
        >
          <ShieldAlert size={15} color="#facc15" />
          <span>Call 112 SOS</span>
        </a>
      </div>

      {/* TAB 1: Live Tracking Screen */}
      {activeTab === 'tracking' && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {activeAlerts.length === 0 ? (
            <div
              style={{
                background: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '16px',
                padding: '40px 20px',
                textAlign: 'center',
              }}
            >
              <CheckCircle2 size={40} color="#10b981" style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', margin: '0 0 6px 0' }}>
                No In-Transit Emergency Cases
              </h3>
              <p style={{ fontSize: '12px', color: '#94a3b8', maxWidth: '300px', margin: '0 auto 16px auto' }}>
                No active emergency pre-alerts en-route at this time. Click "Raise New Alert" to notify the PHC casualty team.
              </p>
              <button
                onClick={() => setActiveTab('raise')}
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#dc2626',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                + Raise Emergency Pre-Alert
              </button>
            </div>
          ) : (
            activeAlerts.map((alert) => (
              <div
                key={alert.id}
                style={{
                  background: '#0f172a',
                  border: '1.5px solid #7f1d1d',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {/* Top Alert Strip */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, #7f1d1d 0%, #1e1b4b 100%)',
                    padding: '14px 16px',
                    borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#fca5a5', fontWeight: 800, letterSpacing: '0.5px' }}>
                      {alert.alertNumber}
                    </span>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: '2px 0 0 0' }}>
                      {alert.patientName} ({alert.patientAge}y • {alert.patientGender})
                    </h3>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: 800,
                        background: '#dc2626',
                        color: '#ffffff',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <AlertTriangle size={11} />
                      {alert.severity}
                    </span>
                    <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: '#cbd5e1', fontWeight: 700 }}>
                      ETA ~{alert.liveEta?.remainingMinutes ?? alert.estimatedArrivalMinutes} min
                    </p>
                  </div>
                </div>

                {/* Status Progression Bar */}
                <div style={{ padding: '0 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                    <span style={{ color: alert.status === 'ALERT_RAISED' ? '#f87171' : undefined }}>1. Alert Raised</span>
                    <span style={{ color: alert.status === 'ACKNOWLEDGED' ? '#60a5fa' : undefined }}>2. Doctor Prepared</span>
                    <span style={{ color: alert.status === 'IN_TRANSIT' ? '#fbbf24' : undefined }}>3. In-Transit</span>
                    <span style={{ color: alert.status === 'ARRIVED' ? '#34d399' : undefined }}>4. Arrived</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        background: 'linear-gradient(90deg, #ef4444, #f59e0b, #10b981)',
                        width:
                          alert.status === 'ALERT_RAISED'
                            ? '25%'
                            : alert.status === 'ACKNOWLEDGED'
                            ? '50%'
                            : alert.status === 'IN_TRANSIT'
                            ? '75%'
                            : '100%',
                        transition: 'all 0.4s ease',
                      }}
                    />
                  </div>
                </div>

                {/* Vitals Telemetry */}
                <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', textAlign: 'center' }}>
                  <div style={{ background: '#090d16', padding: '8px 4px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                    <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block', fontWeight: 700 }}>BP</span>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff' }}>{alert.vitals.bp || '--'}</span>
                  </div>
                  <div style={{ background: '#090d16', padding: '8px 4px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                    <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block', fontWeight: 700 }}>SpO2</span>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: alert.vitals.spO2 && alert.vitals.spO2 < 92 ? '#f87171' : '#34d399' }}>
                      {alert.vitals.spO2 ? `${alert.vitals.spO2}%` : '--'}
                    </span>
                  </div>
                  <div style={{ background: '#090d16', padding: '8px 4px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                    <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block', fontWeight: 700 }}>Pulse</span>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff' }}>{alert.vitals.pulse || '--'}</span>
                  </div>
                  <div style={{ background: '#090d16', padding: '8px 4px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                    <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block', fontWeight: 700 }}>Temp</span>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff' }}>{alert.vitals.temperature ? `${alert.vitals.temperature}°` : '--'}</span>
                  </div>
                </div>

                {/* Doctor Triage Preparation Instructions */}
                {alert.doctorPreparationInstructions && alert.doctorPreparationInstructions.length > 0 ? (
                  <div style={{ margin: '0 16px', background: 'rgba(30, 58, 138, 0.3)', border: '1px solid #3b82f6', borderRadius: '12px', padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Stethoscope size={13} />
                        Doctor Orders ({alert.acknowledgedByDoctorName || 'Duty Physician'})
                      </span>
                      <span style={{ fontSize: '10px', color: '#bfdbfe', background: '#1e3a8a', padding: '2px 6px', borderRadius: '4px' }}>
                        {alert.bedAssigned || 'Red Bay'}
                      </span>
                    </div>

                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {alert.doctorPreparationInstructions.map((inst, idx) => (
                        <li key={idx} style={{ fontWeight: 600 }}>{inst}</li>
                      ))}
                    </ul>

                    {alert.doctorPreparationNotes && (
                      <div style={{ marginTop: '6px', fontSize: '11px', color: '#cbd5e1', fontStyle: 'italic', borderTop: '1px dashed #3b82f6', paddingTop: '4px' }}>
                        Note: {alert.doctorPreparationNotes}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ margin: '0 16px', background: 'rgba(127, 29, 29, 0.25)', border: '1px dashed #ef4444', borderRadius: '10px', padding: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#fca5a5' }}>
                    <Clock size={14} className="animate-spin" />
                    <span>Awaiting Doctor Acknowledgment & Preparation Protocols...</span>
                  </div>
                )}

                {/* Target Facility Footer */}
                <div style={{ padding: '12px 16px', background: '#090d16', borderTop: '1px solid #1e293b', fontSize: '11px', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} color="#f87171" />
                    Destination: <strong style={{ color: '#ffffff' }}>{alert.targetFacilityName}</strong>
                  </span>
                  <span>ASHA: {alert.ashaWorkerName}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: Raise New Alert Form */}
      {activeTab === 'raise' && (
        <form onSubmit={handleRaiseAlert} style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Patient Identification Card */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid #1e293b', paddingBottom: '8px' }}>
              <Siren size={15} color="#ef4444" />
              <span>1. Patient Details</span>
            </h3>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
                Patient Full Name *
              </label>
              <input
                type="text"
                required
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. Rameshwar Prasad"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  background: '#090d16',
                  fontSize: '12px',
                  color: '#ffffff',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>Age *</label>
                <input
                  type="number"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                    background: '#090d16',
                    fontSize: '12px',
                    color: '#ffffff',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>Gender *</label>
                <select
                  value={patientGender}
                  onChange={(e: any) => setPatientGender(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                    background: '#090d16',
                    fontSize: '12px',
                    color: '#ffffff',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
                Pickup Location / Sub-Centre *
              </label>
              <input
                type="text"
                required
                value={sourceLocation}
                onChange={(e) => setSourceLocation(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  background: '#090d16',
                  fontSize: '12px',
                  color: '#ffffff',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Vitals Telemetry Card */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid #1e293b', paddingBottom: '8px' }}>
              <HeartPulse size={15} color="#ef4444" />
              <span>2. Field Vitals</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '3px' }}>Blood Pressure</label>
                <input
                  type="text"
                  value={vitalBp}
                  onChange={(e) => setVitalBp(e.target.value)}
                  placeholder="88/56"
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                    background: '#090d16',
                    fontSize: '12px',
                    color: '#ffffff',
                    textAlign: 'center',
                    fontWeight: 700,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '3px' }}>SpO2 (%)</label>
                <input
                  type="number"
                  value={vitalSpo2}
                  onChange={(e) => setVitalSpo2(e.target.value)}
                  placeholder="88"
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                    background: '#090d16',
                    fontSize: '12px',
                    color: '#f87171',
                    textAlign: 'center',
                    fontWeight: 700,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '3px' }}>Pulse (bpm)</label>
                <input
                  type="number"
                  value={vitalPulse}
                  onChange={(e) => setVitalPulse(e.target.value)}
                  placeholder="120"
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                    background: '#090d16',
                    fontSize: '12px',
                    color: '#ffffff',
                    textAlign: 'center',
                    fontWeight: 700,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '3px' }}>Temperature (°F)</label>
                <input
                  type="text"
                  value={vitalTemp}
                  onChange={(e) => setVitalTemp(e.target.value)}
                  placeholder="98.6"
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                    background: '#090d16',
                    fontSize: '12px',
                    color: '#ffffff',
                    textAlign: 'center',
                    fontWeight: 700,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Transfer & Destination Card */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid #1e293b', paddingBottom: '8px' }}>
              <Truck size={15} color="#38bdf8" />
              <span>3. Target PHC & Urgency</span>
            </h3>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
                Destination PHC / CHC *
              </label>
              <select
                value={targetFacilityId}
                onChange={(e) => setTargetFacilityId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  background: '#090d16',
                  fontSize: '12px',
                  color: '#ffffff',
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

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
                Chief Complaints *
              </label>
              <input
                type="text"
                required
                value={chiefComplaints}
                onChange={(e) => setChiefComplaints(e.target.value)}
                placeholder="e.g. Severe Chest Pain, Breathlessness"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  background: '#090d16',
                  fontSize: '12px',
                  color: '#ffffff',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>Severity *</label>
                <select
                  value={severity}
                  onChange={(e: any) => setSeverity(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                    background: '#090d16',
                    fontSize: '12px',
                    color: '#ffffff',
                    fontWeight: 700,
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="CRITICAL">🔴 Critical</option>
                  <option value="SEVERE">🟠 Severe</option>
                  <option value="MODERATE">🟡 Moderate</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>ETA (Minutes) *</label>
                <input
                  type="number"
                  required
                  value={etaMins}
                  onChange={(e) => setEtaMins(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                    background: '#090d16',
                    fontSize: '12px',
                    color: '#ffffff',
                    fontWeight: 700,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '14px',
              border: 'none',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 800,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 18px rgba(220, 38, 38, 0.45)',
            }}
          >
            <Siren size={18} />
            <span>{isSubmitting ? 'Broadcasting Emergency SOS...' : '🚨 Broadcast Emergency Pre-Alert'}</span>
          </button>
        </form>
      )}
    </div>
  );
};
