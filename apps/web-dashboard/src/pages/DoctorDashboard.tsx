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
  Ticket,
  PhoneCall,
  MessageSquare,
} from 'lucide-react';
import { DoctorProfile, DoctorAvailabilityStatus, Appointment, MedicalRecord, PrescriptionItem, ReferralType, PatientProfile, OnCallSupportTicket } from '@phc-connect/types';
import { apiClient } from '../services/api';
import { DoctorScheduleView } from './DoctorScheduleView';
import { DoctorEHRView } from './DoctorEHRView';
import { PrescriptionPreviewModal } from '../components/PrescriptionPreviewModal';
import { PrescriptionData, PrescriptionPDFGenerator } from '../utils/prescriptionPdfGenerator';
import { Download, Printer, Eye } from 'lucide-react';

interface Props {
  doctorId: string;
  activeTab?: 'opd' | 'schedule' | 'ehr';
  onSelectTab?: (tab: 'opd' | 'schedule' | 'ehr') => void;
}

export const DoctorDashboard: React.FC<Props> = ({ doctorId, activeTab = 'opd', onSelectTab }) => {
  const [selectedEHRId, setSelectedEHRId] = useState<string | undefined>(undefined);
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [queueMetrics, setQueueMetrics] = useState<any>({
    totalToday: 0,
    waitingCount: 0,
    inConsultationCount: 0,
    completedCount: 0,
  });
  const [waitingPatients, setWaitingPatients] = useState<Appointment[]>([]);
  const [inConsultation, setInConsultation] = useState<Appointment[]>([]);
  const [escalatedTickets, setEscalatedTickets] = useState<OnCallSupportTicket[]>([]);
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
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [currentPrescriptionData, setCurrentPrescriptionData] = useState<PrescriptionData | null>(null);

  useEffect(() => {
    loadDoctorData();
  }, [doctorId]);

  const loadDoctorData = async () => {
    try {
      const [docRes, queueRes, ticketsRes] = await Promise.all([
        apiClient.get(`/doctors/${doctorId}`),
        apiClient.get(`/doctors/${doctorId}/queue`),
        apiClient.get('/support-tickets', { status: 'ESCALATED' }),
      ]);

      if (docRes.success) setDoctor(docRes.doctor);
      if (ticketsRes.success && ticketsRes.tickets) {
        setEscalatedTickets(ticketsRes.tickets);
      }
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

  const handleSelectEscalatedTicket = (ticket: OnCallSupportTicket) => {
    const now = new Date().toISOString();
    const tempApt: Appointment = {
      id: `apt-esc-${ticket.id}`,
      appointmentNumber: `ESC-${ticket.ticketNumber.slice(-4)}`,
      patientId: ticket.patientId,
      patientName: ticket.patientName,
      patientAge: ticket.patientAge || 25,
      patientGender: (ticket.patientGender as any) || 'Female',
      patientPhone: ticket.patientPhone || '',
      doctorId: doctorId,
      doctorName: doctor?.fullName || 'Doctor',
      doctorSpecialization: doctor?.specialization || 'General Medicine',
      phcId: doctor?.phcId || ticket.phcId || 'phc-001',
      phcName: doctor?.phcName || ticket.phcName || 'Central Urban PHC',
      tokenNumber: 99,
      date: now.split('T')[0],
      timeSlot: 'Tele-Escalation',
      status: 'In Consultation',
      reasonForVisit: `${ticket.subject} (Escalated by ${ticket.assignedStaffName || ticket.creatorName}): ${ticket.notes}`,
      symptoms: ticket.tags,
      criticalityLevel: ticket.priority === 'CRITICAL' || ticket.priority === 'HIGH' ? 'HIGH' : 'MEDIUM',
      createdAt: now,
      updatedAt: now,
    };
    selectPatientForConsultation(tempApt);
    setChiefComplaints(`${ticket.subject} - ${ticket.notes}`);
  };

  const constructCurrentPrescriptionData = (recordNumber?: string, consultationDate?: string): PrescriptionData => {
    return {
      recordNumber: recordNumber || `OPD-${Date.now().toString().slice(-4)}`,
      consultationDate: consultationDate || new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      patient: {
        fullName: activeAppointment?.patientName || 'Aakash Jha',
        patientId: activeAppointment?.patientId || 'PHC-PAT-2026-0001',
        age: activeAppointment?.patientAge || 24,
        gender: activeAppointment?.patientGender || 'Male',
        phone: activeAppointment?.patientPhone || '+91 98765 43210',
        allergies: patientDetails?.patient?.allergies || (activeAppointment?.patientName?.includes('Aakash') ? ['Penicillin'] : []),
        existingConditions: patientDetails?.patient?.existingConditions || (activeAppointment?.patientName?.includes('Aakash') ? ['Mild Bronchial Asthma'] : []),
      },
      doctor: {
        fullName: doctor?.fullName || 'Dr. Rajesh Verma',
        doctorId: doctor?.doctorId || 'DOC-001',
        specialization: doctor?.specialization || 'General Medicine (MBBS, MD)',
        qualification: doctor?.qualification || 'MBBS, MD',
        registrationNumber: doctor?.registrationNumber || 'MCI-DEL-2018-8842',
        roomNumber: doctor?.roomNumber || 'Room 104',
        phcName: doctor?.phcName || 'Central Urban Primary Health Centre (Karol Bagh)',
        phcAddress: 'Opposite Metro Pillar 114, Karol Bagh, New Delhi - 110005',
      },
      vitals: {
        bp,
        temperature: temp,
        pulse,
        spO2,
        weight,
      },
      diagnosis: diagnosis ? diagnosis.split(',').map((s) => s.trim()) : ['Acute Clinical Evaluation'],
      clinicalAssessment,
      recommendedTests: recommendedTests ? recommendedTests.split(',').map((s) => s.trim()) : [],
      prescriptions,
      referralType,
      followUpDate: followUpDate || null,
      doctorNotes,
    };
  };

  const handleManualPDFPreview = () => {
    const data = constructCurrentPrescriptionData();
    setCurrentPrescriptionData(data);
    PrescriptionPDFGenerator.generate(data, true);
    setPreviewModalOpen(true);
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
        const pData = constructCurrentPrescriptionData(res.medicalRecord?.recordNumber, res.medicalRecord?.createdAt);
        setCurrentPrescriptionData(pData);
        setSuccessNotice(`Consultation recorded & Prescription #${res.medicalRecord?.recordNumber || 'NEW'} issued!`);
        
        // Auto generate & download PDF
        PrescriptionPDFGenerator.generate(pData, true);
        setPreviewModalOpen(true);

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

      {/* Tab Routing */}
      {activeTab === 'schedule' && (
        <DoctorScheduleView
          doctorId={doctorId}
          onStartConsultation={(apt) => {
            selectPatientForConsultation(apt);
            onSelectTab?.('opd');
          }}
          onViewEHR={(patientId) => {
            setSelectedEHRId(patientId);
            onSelectTab?.('ehr');
          }}
        />
      )}

      {activeTab === 'ehr' && (
        <DoctorEHRView
          preSelectedPatientId={selectedEHRId}
          onStartConsultation={(patient) => {
            const now = new Date().toISOString();
            const tempApt: Appointment = {
              id: `apt-${Date.now()}`,
              appointmentNumber: `OPD-${Date.now().toString().slice(-4)}`,
              patientId: patient.id,
              patientName: patient.fullName,
              patientAge: patient.age,
              patientGender: patient.gender,
              patientPhone: patient.phone,
              doctorId: doctorId,
              doctorName: doctor?.fullName || 'Doctor',
              doctorSpecialization: doctor?.specialization || 'General Medicine',
              phcId: doctor?.phcId || 'phc-001',
              phcName: doctor?.phcName || 'Central Urban PHC - Karol Bagh',
              tokenNumber: waitingPatients.length + 1,
              date: now.split('T')[0],
              timeSlot: 'Walk-in (Immediate)',
              status: 'In Consultation',
              reasonForVisit: patient.existingConditions?.join(', ') || 'Clinical Evaluation',
              symptoms: [],
              criticalityLevel: 'LOW',
              createdAt: now,
              updatedAt: now,
            };
            selectPatientForConsultation(tempApt);
            onSelectTab?.('opd');
          }}
        />
      )}

      {activeTab === 'opd' && (
        <>
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

          {/* Queue & OPD Consultation Console */}
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', alignItems: 'start' }}>
            {/* Left Column: Live Queue & Tele-Care Escalations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Tele-Care Escalations Box */}
              {escalatedTickets.length > 0 && (
                <div
                  style={{
                    background: '#faf5ff',
                    border: '1px solid #e9d5ff',
                    borderRadius: '16px',
                    padding: '16px',
                    boxShadow: '0 2px 8px rgba(124, 58, 237, 0.06)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Ticket size={16} color="#7c3aed" />
                      <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#581c87', margin: 0 }}>
                        On-Call Escalations ({escalatedTickets.length})
                      </h4>
                    </div>
                    <span style={{ fontSize: '10px', background: '#f3e8ff', color: '#7c3aed', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                      URGENT
                    </span>
                  </div>

                  <p style={{ fontSize: '11px', color: '#6b21a8', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                    Health assistants & ASHA workers escalated these tele-consultations for doctor intervention:
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {escalatedTickets.map((tkt) => (
                      <div
                        key={tkt.id}
                        onClick={() => handleSelectEscalatedTicket(tkt)}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #d8b4fe',
                          borderRadius: '10px',
                          padding: '10px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                          <strong style={{ fontSize: '12px', color: '#0f172a' }}>{tkt.patientName}</strong>
                          <span
                            style={{
                              fontSize: '9px',
                              fontWeight: 800,
                              background: tkt.priority === 'CRITICAL' || tkt.priority === 'HIGH' ? '#fee2e2' : '#fef3c7',
                              color: tkt.priority === 'CRITICAL' || tkt.priority === 'HIGH' ? '#991b1b' : '#92400e',
                              padding: '1px 5px',
                              borderRadius: '4px',
                            }}
                          >
                            {tkt.priority}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#6b21a8', fontWeight: 600 }}>
                          {tkt.subject}
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                          By {tkt.assignedStaffName || tkt.creatorName} ({tkt.assignedStaffRole || tkt.creatorRole})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Live OPD Queue Card */}
              <div className="dash-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                    Patient Queue ({waitingPatients.length + inConsultation.length})
                  </h3>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Real-time</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {inConsultation.map((apt) => (
                  <div
                    key={apt.id}
                    onClick={() => selectPatientForConsultation(apt)}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: activeAppointment?.id === apt.id ? '2px solid #0284c7' : '1px solid #bae6fd',
                      background: '#f0f9ff',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#0284c7' }}>
                        Token #{apt.tokenNumber || 1}
                      </span>
                      <span style={{ fontSize: '10px', background: '#fee2e2', color: '#b91c1c', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                        In Consultation
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                      {apt.patientName}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      {apt.patientAge} Yrs • {apt.patientGender} • {apt.timeSlot}
                    </div>
                    {apt.reasonForVisit && (
                      <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px', background: 'white', padding: '4px 6px', borderRadius: '4px' }}>
                        Reason: {apt.reasonForVisit}
                      </div>
                    )}
                  </div>
                ))}

                {waitingPatients.map((apt) => (
                  <div
                    key={apt.id}
                    onClick={() => selectPatientForConsultation(apt)}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: activeAppointment?.id === apt.id ? '2px solid #0284c7' : '1px solid #e2e8f0',
                      background: activeAppointment?.id === apt.id ? '#f8fafc' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#0284c7' }}>
                        Token #{apt.tokenNumber || 2}
                      </span>
                      <span style={{ fontSize: '10px', background: '#ecfdf5', color: '#059669', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                        {apt.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                      {apt.patientName}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      {apt.patientAge} Yrs • {apt.patientGender} • {apt.timeSlot}
                    </div>
                    {apt.reasonForVisit && (
                      <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px', background: '#f8fafc', padding: '4px 6px', borderRadius: '4px' }}>
                        Reason: {apt.reasonForVisit}
                      </div>
                    )}
                  </div>
                ))}

                {waitingPatients.length === 0 && inConsultation.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94a3b8', fontSize: '13px' }}>
                    No patients currently in the OPD queue.
                  </div>
                )}
              </div>
            </div>
          </div>

            {/* Right Column: Active Consultation Room */}
            <div className="dash-card">
              {activeAppointment ? (
                <form onSubmit={handleSubmitConsultation} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Patient Banner */}
                  <div style={{
                    background: '#f8fafc',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                          {activeAppointment.patientName}
                        </h3>
                        <span style={{ fontSize: '11px', background: '#e0f2fe', color: '#0369a1', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                          {patientDetails?.patient?.patientId || 'PHC-PAT-2026-0001'}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        {activeAppointment.patientAge} Years • {activeAppointment.patientGender} • Phone: {activeAppointment.patientPhone}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {patientDetails?.patient?.allergies?.map((al: string, i: number) => (
                        <span key={i} style={{ fontSize: '11px', background: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: '6px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={12} /> Allergy: {al}
                        </span>
                      ))}
                      {patientDetails?.patient?.existingConditions?.map((c: string, i: number) => (
                        <span key={i} style={{ fontSize: '11px', background: '#eff6ff', color: '#1d4ed8', padding: '3px 8px', borderRadius: '6px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          ● {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Vitals Recording Strip */}
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#334155', marginBottom: '10px' }}>
                      Patient Vitals
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>BP</label>
                        <input
                          type="text"
                          value={bp}
                          onChange={(e) => setBp(e.target.value)}
                          style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Temp</label>
                        <input
                          type="text"
                          value={temp}
                          onChange={(e) => setTemp(e.target.value)}
                          style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Pulse</label>
                        <input
                          type="text"
                          value={pulse}
                          onChange={(e) => setPulse(e.target.value)}
                          style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>SpO2</label>
                        <input
                          type="text"
                          value={spO2}
                          onChange={(e) => setSpO2(e.target.value)}
                          style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Weight</label>
                        <input
                          type="text"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                        />
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
                        placeholder="e.g. CBC, Serum Creatinine, Chest X-Ray"
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
                      placeholder="Enter detailed clinical findings, chest auscultation, abdomen palpation..."
                      value={clinicalAssessment}
                      onChange={(e) => setClinicalAssessment(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', resize: 'vertical' }}
                    />
                  </div>

                  {/* Digital Prescription Form */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Pill size={14} /> Digital Prescription Generator
                      </h4>
                      <button
                        type="button"
                        onClick={handleAddPrescription}
                        style={{
                          background: '#f0f9ff',
                          border: '1px solid #bae6fd',
                          color: '#0284c7',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Plus size={12} /> Add Medicine
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {prescriptions.map((item, idx) => (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1fr 2fr auto', gap: '8px', alignItems: 'center', background: '#f8fafc', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <input
                            type="text"
                            placeholder="Medicine Name"
                            value={item.medicineName}
                            onChange={(e) => handlePrescriptionChange(idx, 'medicineName', e.target.value)}
                            style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                          />
                          <input
                            type="text"
                            placeholder="Dosage"
                            value={item.dosage}
                            onChange={(e) => handlePrescriptionChange(idx, 'dosage', e.target.value)}
                            style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                          />
                          <input
                            type="text"
                            placeholder="Frequency"
                            value={item.frequency}
                            onChange={(e) => handlePrescriptionChange(idx, 'frequency', e.target.value)}
                            style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                          />
                          <input
                            type="text"
                            placeholder="Duration"
                            value={item.duration}
                            onChange={(e) => handlePrescriptionChange(idx, 'duration', e.target.value)}
                            style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                          />
                          <input
                            type="text"
                            placeholder="Instructions"
                            value={item.instructions}
                            onChange={(e) => handlePrescriptionChange(idx, 'instructions', e.target.value)}
                            style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px' }}>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-primary"
                      style={{
                        padding: '14px',
                        justifyContent: 'center',
                        fontSize: '14px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <Send size={16} />
                      {submitting ? 'Submitting EHR...' : 'Complete Consultation & Generate Prescription'}
                    </button>

                    <button
                      type="button"
                      onClick={handleManualPDFPreview}
                      style={{
                        padding: '14px 20px',
                        fontSize: '14px',
                        fontWeight: 700,
                        borderRadius: '12px',
                        border: '1px solid #00796b',
                        background: '#e0f2f1',
                        color: '#00796b',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Download size={16} /> Download PDF
                    </button>
                  </div>
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
        </>
      )}

      {/* Prescription PDF Preview Modal */}
      <PrescriptionPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        data={currentPrescriptionData}
      />
    </div>
  );
};
