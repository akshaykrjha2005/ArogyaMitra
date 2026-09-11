import React, { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Stethoscope,
  Pill,
  Plus,
  Trash2,
  FileText,
  Activity,
  HeartPulse,
  Send,
  Sparkles,
} from 'lucide-react';
import { DoctorProfile, DoctorAvailabilityStatus, Appointment, MedicalRecord, PrescriptionItem, ReferralType } from '@phc-connect/types';
import { apiClient } from '../services/api';

interface Props {
  doctorId: string;
}

export const DoctorDashboard: React.FC<Props> = ({ doctorId }) => {
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [queueMetrics, setQueueMetrics] = useState<any>({
    totalToday: 0,
    waitingCount: 0,
    inConsultationCount: 0,
    completedCount: 0,
  });
  const [waitingPatients, setWaitingPatients] = useState<Appointment[]>([]);
  const [inConsultation, setInConsultation] = useState<Appointment[]>([]);
  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);
  const [patientDetails, setPatientDetails] = useState<any>(null);

  // Consultation Form State
  const [chiefComplaints, setChiefComplaints] = useState('');
  const [clinicalAssessment, setClinicalAssessment] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [bp, setBp] = useState('120/80 mmHg');
  const [temp, setTemp] = useState('98.6 F');
  const [pulse, setPulse] = useState('72 bpm');
  const [spO2, setSpO2] = useState('99%');
  const [weight, setWeight] = useState('65 kg');
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([
    {
      medicineName: 'Paracetamol Tablets IP 500mg',
      genericName: 'Paracetamol',
      dosage: '500mg',
      frequency: '1-0-1 (Twice daily after meals)',
      duration: '3 days',
      instructions: 'Take with warm water after meals',
    },
  ]);
  const [recommendedTests, setRecommendedTests] = useState('Complete Blood Count (CBC)');
  const [followUpDate, setFollowUpDate] = useState('');
  const [referralType, setReferralType] = useState<ReferralType>('Patient Treated');
  const [referralDetails, setReferralDetails] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('Patient advised adequate hydration and rest.');
  const [submitting, setSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState('');

  useEffect(() => {
    loadDoctorData();
  }, [doctorId]);

  const loadDoctorData = async () => {
    try {
      const [docRes, queueRes] = await Promise.all([
        apiClient.get(`/doctors/${doctorId}`),
        apiClient.get(`/doctors/${doctorId}/queue`),
      ]);

      if (docRes.success) setDoctor(docRes.doctor);
      if (queueRes.success) {
        setQueueMetrics(queueRes.metrics);
        setWaitingPatients(queueRes.waitingPatients || []);
        setInConsultation(queueRes.inConsultation || []);

        if (queueRes.inConsultation && queueRes.inConsultation.length > 0) {
          selectPatientForConsultation(queueRes.inConsultation[0]);
        } else if (queueRes.waitingPatients && queueRes.waitingPatients.length > 0) {
          selectPatientForConsultation(queueRes.waitingPatients[0]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (newStatus: DoctorAvailabilityStatus) => {
    try {
      const res = await apiClient.patch(`/doctors/${doctorId}/availability`, { status: newStatus });
      if (res.success && res.doctor) {
        setDoctor(res.doctor);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectPatientForConsultation = async (apt: Appointment) => {
    setActiveAppointment(apt);
    setChiefComplaints(apt.reasonForVisit || 'General Clinical Symptoms');

    try {
      const res = await apiClient.get(`/doctors/patient/${apt.patientId}`);
      if (res.success) {
        setPatientDetails(res);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPrescription = () => {
    setPrescriptions([
      ...prescriptions,
      {
        medicineName: 'Amoxicillin Capsules 500mg',
        genericName: 'Amoxicillin',
        dosage: '500mg',
        frequency: '1-0-1',
        duration: '5 days',
        instructions: 'Complete full course',
      },
    ]);
  };

  const handleRemovePrescription = (index: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  const handlePrescriptionChange = (index: number, field: keyof PrescriptionItem, val: string) => {
    const updated = [...prescriptions];
    updated[index] = { ...updated[index], [field]: val };
    setPrescriptions(updated);
  };

  const handleSubmitConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAppointment || !doctor) return;
    setSubmitting(true);

    try {
      const res = await apiClient.post('/doctor/consultation', {
        appointmentId: activeAppointment.id,
        patientId: activeAppointment.patientId,
        doctorId: doctor.id,
        phcId: doctor.phcId,
        chiefComplaints: chiefComplaints.split(',').map((s) => s.trim()),
        clinicalAssessment,
        diagnosis: diagnosis.split(',').map((s) => s.trim()),
        vitals: { bp, temperature: temp, pulse, spO2, weight },
        prescriptions,
        recommendedTests: recommendedTests ? recommendedTests.split(',').map((s) => s.trim()) : [],
        followUpDate: followUpDate || null,
        referralType,
        referralDetails,
        doctorNotes,
      });

      if (res.success) {
        setSuccessNotice(`Consultation recorded & Prescription #${res.medicalRecord.recordNumber} issued!`);
        setTimeout(() => setSuccessNotice(''), 4000);
        loadDoctorData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Doctor Header & Duty Switcher */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '20px 24px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #1976d2, #00897b)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            fontWeight: 800,
          }}>
            {doctor?.fullName?.replace('Dr. ', '').charAt(0) || 'D'}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>
                {doctor?.fullName || 'Dr. Rajesh Verma'}
              </h2>
              <span style={{ fontSize: '11px', background: '#e3f2fd', color: '#1976d2', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                {doctor?.doctorId}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              {doctor?.specialization} • {doctor?.qualification} • {doctor?.phcName || 'Karol Bagh PHC'} ({doctor?.roomNumber})
            </p>
          </div>
        </div>

        {/* Attendance Availability Status Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>
            Live Duty Status:
          </span>
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '10px', padding: '4px', gap: '4px' }}>
            {(['AVAILABLE', 'BUSY', 'OFFLINE', 'ON LEAVE'] as DoctorAvailabilityStatus[]).map((st) => {
              const isActive = doctor?.status === st;
              let activeColor = '#00796b';
              if (st === 'BUSY') activeColor = '#e65100';
              if (st === 'OFFLINE' || st === 'ON LEAVE') activeColor = '#64748b';

              return (
                <button
                  key={st}
                  onClick={() => handleStatusChange(st)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    background: isActive ? '#ffffff' : 'transparent',
                    color: isActive ? activeColor : '#64748b',
                    boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  ● {st}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="stat-grid">
        <div className="stat-card">
          <div>
            <span className="stat-label">Total Appointments Today</span>
            <div className="stat-val">{queueMetrics.totalToday}</div>
          </div>
          <div className="stat-icon" style={{ background: '#e3f2fd', color: '#1976d2' }}>
            <Calendar size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <span className="stat-label">Waiting in Queue</span>
            <div className="stat-val" style={{ color: '#d97706' }}>{queueMetrics.waitingCount}</div>
          </div>
          <div className="stat-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
            <Clock size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <span className="stat-label">In Active Consultation</span>
            <div className="stat-val" style={{ color: '#00897b' }}>{queueMetrics.inConsultationCount}</div>
          </div>
          <div className="stat-icon" style={{ background: '#e0f2f1', color: '#00897b' }}>
            <Stethoscope size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <span className="stat-label">Completed Consultations</span>
            <div className="stat-val" style={{ color: '#16a34a' }}>{queueMetrics.completedCount}</div>
          </div>
          <div className="stat-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
            <CheckCircle2 size={22} />
          </div>
        </div>
      </div>

      {successNotice && (
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '12px',
          padding: '12px 18px',
          color: '#15803d',
          fontWeight: 700,
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <CheckCircle2 size={18} />
          {successNotice}
        </div>
      )}

      {/* Main Clinical Workstation: 2 Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
        {/* Left Column: Waiting Queue */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          maxHeight: 'calc(100vh - 320px)',
          overflowY: 'auto',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>
              Patient Queue ({waitingPatients.length + inConsultation.length})
            </h3>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Real-time</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {waitingPatients.length === 0 && inConsultation.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94a3b8' }}>
                <Users size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                <p style={{ fontSize: '12px' }}>No patients currently waiting.</p>
              </div>
            ) : (
              [...inConsultation, ...waitingPatients].map((apt) => {
                const isSelected = activeAppointment?.id === apt.id;
                return (
                  <div
                    key={apt.id}
                    onClick={() => selectPatientForConsultation(apt)}
                    style={{
                      background: isSelected ? '#eff6ff' : '#f8fafc',
                      border: `1px solid ${isSelected ? '#3b82f6' : '#e2e8f0'}`,
                      borderRadius: '12px',
                      padding: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#1976d2' }}>
                        Token #{apt.tokenNumber}
                      </span>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: apt.status === 'In Consultation' ? '#ffebee' : '#e0f2f1',
                        color: apt.status === 'In Consultation' ? '#d32f2f' : '#00796b',
                      }}>
                        {apt.status}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>
                      {apt.patientName}
                    </h4>
                    <p style={{ fontSize: '11px', color: '#64748b' }}>
                      {apt.patientAge} Yrs • {apt.patientGender} • {apt.timeSlot}
                    </p>
                    <p style={{ fontSize: '11px', color: '#475569', marginTop: '4px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      <strong>Reason:</strong> {apt.reasonForVisit}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Patient Consultation Workstation */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}>
          {activeAppointment ? (
            <form onSubmit={handleSubmitConsultation} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Patient Banner */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>
                      {activeAppointment.patientName}
                    </h3>
                    <span style={{ fontSize: '11px', background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                      {patientDetails?.patient?.patientId || 'PHC-PAT-2026-0001'}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    {activeAppointment.patientAge} Years • {activeAppointment.patientGender} • Phone: {activeAppointment.patientPhone}
                  </p>
                </div>

                {/* Patient Known Allergies & Chronic Conditions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {patientDetails?.patient?.allergies?.length > 0 && (
                    <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 700 }}>
                      ⚠️ Allergy: {patientDetails.patient.allergies.join(', ')}
                    </div>
                  )}
                  {patientDetails?.patient?.existingConditions?.length > 0 && (
                    <div style={{ background: '#eff6ff', color: '#1d4ed8', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 700 }}>
                      ● {patientDetails.patient.existingConditions.join(', ')}
                    </div>
                  )}
                </div>
              </div>

              {/* AI Symptom Triage Report Box if Available */}
              {patientDetails?.recentAssessments && patientDetails.recentAssessments.length > 0 && (
                <div style={{
                  background: '#f0fdfa',
                  border: '1px solid #99f6e4',
                  borderRadius: '12px',
                  padding: '14px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <Sparkles size={15} color="#0d9488" />
                    <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#0f766e' }}>
                      AI Pre-Consultation Symptom Assessment (Risk Level: {patientDetails.recentAssessments[0].riskLevel})
                    </h4>
                  </div>
                  <p style={{ fontSize: '12px', color: '#134e4a', lineHeight: '1.4' }}>
                    {patientDetails.recentAssessments[0].explanation}
                  </p>
                </div>
              )}

              {/* Vitals Recording Strip */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>
                  Patient Vitals
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>BP</label>
                    <input type="text" value={bp} onChange={(e) => setBp(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>Temp</label>
                    <input type="text" value={temp} onChange={(e) => setTemp(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>Pulse</label>
                    <input type="text" value={pulse} onChange={(e) => setPulse(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>SpO2</label>
                    <input type="text" value={spO2} onChange={(e) => setSpO2(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>Weight</label>
                    <input type="text" value={weight} onChange={(e) => setWeight(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                  </div>
                </div>
              </div>

              {/* Diagnosis & Clinical Findings */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Clinical Diagnosis / Provisional ICD (comma-separated)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acute Viral Bronchitis, Type 2 DM"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Recommended Lab / Diagnostic Tests
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CBC, Blood Sugar Fasting, Chest X-Ray"
                    value={recommendedTests}
                    onChange={(e) => setRecommendedTests(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Clinical Assessment & Examination Notes
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Enter detailed clinical findings, chest auscultation, abdomen palpation..."
                  value={clinicalAssessment}
                  onChange={(e) => setClinicalAssessment(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', resize: 'none' }}
                />
              </div>

              {/* Prescription Composer */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Pill size={16} color="#1976d2" />
                    <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>
                      Digital Prescription Generator
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddPrescription}
                    style={{
                      background: '#e3f2fd',
                      color: '#1976d2',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Plus size={13} /> Add Medicine
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {prescriptions.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1.5fr 1fr 2fr auto',
                        gap: '8px',
                        alignItems: 'center',
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Medicine Name"
                        value={item.medicineName}
                        onChange={(e) => handlePrescriptionChange(idx, 'medicineName', e.target.value)}
                        style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11px' }}
                      />
                      <input
                        type="text"
                        placeholder="Dosage (500mg)"
                        value={item.dosage}
                        onChange={(e) => handlePrescriptionChange(idx, 'dosage', e.target.value)}
                        style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11px' }}
                      />
                      <input
                        type="text"
                        placeholder="Frequency (1-0-1)"
                        value={item.frequency}
                        onChange={(e) => handlePrescriptionChange(idx, 'frequency', e.target.value)}
                        style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11px' }}
                      />
                      <input
                        type="text"
                        placeholder="Duration (5 days)"
                        value={item.duration}
                        onChange={(e) => handlePrescriptionChange(idx, 'duration', e.target.value)}
                        style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11px' }}
                      />
                      <input
                        type="text"
                        placeholder="Instructions"
                        value={item.instructions}
                        onChange={(e) => handlePrescriptionChange(idx, 'instructions', e.target.value)}
                        style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11px' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePrescription(idx)}
                        style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Referral & Disposition */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Clinical Referral / Disposition
                  </label>
                  <select
                    value={referralType}
                    onChange={(e) => setReferralType(e.target.value as ReferralType)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', background: 'white' }}
                  >
                    <option value="Patient Treated">Patient Treated (Routine Discharge)</option>
                    <option value="Follow-up Required">Follow-up Required</option>
                    <option value="Referred to Specialist">Referred to Specialist / Higher Centre</option>
                    <option value="Emergency Referral">Emergency Referral (Trauma / Resuscitation)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Follow-Up Date (if applicable)
                  </label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', background: 'white' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary"
                style={{
                  padding: '14px',
                  justifyContent: 'center',
                  fontSize: '14px',
                  borderRadius: '12px',
                }}
              >
                <Send size={16} />
                {submitting ? 'Submitting EHR...' : 'Complete Consultation & Generate Prescription'}
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
              <Stethoscope size={48} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>No Active Consultation</h3>
              <p style={{ fontSize: '13px' }}>Select a patient from the queue on the left to start examining.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
