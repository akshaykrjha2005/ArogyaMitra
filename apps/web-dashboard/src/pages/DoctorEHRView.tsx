import React, { useState, useEffect } from 'react';
import {
  Search,
  Users,
  FileText,
  Activity,
  HeartPulse,
  AlertTriangle,
  Calendar,
  Pill,
  Stethoscope,
  Phone,
  User,
  ShieldAlert,
  ChevronRight,
  Plus,
  RefreshCw,
  Printer,
  Download,
} from 'lucide-react';
import { PatientProfile, MedicalRecord, Appointment } from '@phc-connect/types';
import { apiClient } from '../services/api';
import { PrescriptionPDFGenerator, PrescriptionData } from '../utils/prescriptionPdfGenerator';

interface Props {
  onStartConsultation: (patient: PatientProfile) => void;
  preSelectedPatientId?: string;
}

export const DoctorEHRView: React.FC<Props> = ({
  onStartConsultation,
  preSelectedPatientId,
}) => {
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loadingPatients, setLoadingPatients] = useState<boolean>(true);
  const [loadingRecords, setLoadingRecords] = useState<boolean>(false);

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    if (preSelectedPatientId && patients.length > 0) {
      const found = patients.find(
        (p) => p.id === preSelectedPatientId || p.patientId === preSelectedPatientId
      );
      if (found) {
        selectPatient(found);
      }
    }
  }, [preSelectedPatientId, patients]);

  const loadPatients = async () => {
    setLoadingPatients(true);
    try {
      const res = await apiClient.get('/patients');
      if (res.success && res.patients) {
        setPatients(res.patients);
        if (!selectedPatient && res.patients.length > 0) {
          selectPatient(res.patients[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load patients:', err);
    } finally {
      setLoadingPatients(false);
    }
  };

  const selectPatient = async (patient: PatientProfile) => {
    setSelectedPatient(patient);
    setLoadingRecords(true);
    try {
      const [recordsRes, aptsRes] = await Promise.all([
        apiClient.get(`/patients/${patient.id}/records`),
        apiClient.get('/appointments', { patientId: patient.id }),
      ]);

      if (recordsRes.success && recordsRes.records) {
        setMedicalRecords(recordsRes.records);
      } else {
        setMedicalRecords([]);
      }

      if (aptsRes.success && aptsRes.appointments) {
        setAppointments(aptsRes.appointments);
      } else {
        setAppointments([]);
      }
    } catch (err) {
      console.error('Failed to load patient records:', err);
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleDownloadRecordPDF = (rec: MedicalRecord) => {
    if (!selectedPatient) return;
    const pData: PrescriptionData = {
      recordNumber: rec.recordNumber,
      consultationDate: new Date(rec.visitDate || rec.createdAt).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      patient: {
        fullName: selectedPatient.fullName,
        patientId: selectedPatient.patientId,
        age: selectedPatient.age,
        gender: selectedPatient.gender,
        phone: selectedPatient.phone,
        allergies: selectedPatient.allergies,
        existingConditions: selectedPatient.existingConditions,
      },
      doctor: {
        fullName: rec.doctorName || 'Dr. Rajesh Verma',
        doctorId: rec.doctorId || 'DOC-001',
        specialization: rec.doctorSpecialization || 'General Medicine',
        qualification: 'MBBS, MD',
        registrationNumber: 'MCI-DEL-2018-8842',
        roomNumber: 'Room 104',
        phcName: rec.phcName || 'Central Urban Primary Health Centre (Karol Bagh)',
        phcAddress: 'Opposite Metro Pillar 114, Karol Bagh, New Delhi - 110005',
      },
      vitals: {
        bp: rec.vitals?.bp,
        temperature: rec.vitals?.temperature,
        pulse: rec.vitals?.pulse,
        spO2: rec.vitals?.spO2,
        weight: rec.vitals?.weight,
      },
      diagnosis: Array.isArray(rec.diagnosis) ? rec.diagnosis : [rec.diagnosis || 'Clinical Evaluation'],
      clinicalAssessment: rec.clinicalAssessment,
      recommendedTests: rec.recommendedTests || [],
      prescriptions: rec.prescriptions || [],
      referralType: rec.referralType,
      followUpDate: rec.followUpDate,
      doctorNotes: rec.doctorNotes,
    };
    PrescriptionPDFGenerator.generate(pData, true);
  };

  const filteredPatients = patients.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.fullName.toLowerCase().includes(q) ||
      p.patientId.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      (p.bloodGroup && p.bloodGroup.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
          borderRadius: '16px',
          padding: '22px 26px',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 8px 24px rgba(5, 150, 105, 0.2)',
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              color: '#a7f3d0',
              marginBottom: '4px',
            }}
          >
            <Users size={14} /> Electronic Health Records (EHR)
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>
            Patient Longitudinal Clinical History
          </h2>
          <p
            style={{
              margin: '4px 0 0 0',
              fontSize: '13px',
              color: '#d1fae5',
              opacity: 0.9,
            }}
          >
            Unified view of diagnostics, past consultations, digital prescriptions, and vital trends.
          </p>
        </div>

        <button
          onClick={loadPatients}
          title="Refresh patient list"
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            color: '#ffffff',
            padding: '8px 16px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
          }}
        >
          <RefreshCw size={14} /> Refresh Directory
        </button>
      </div>

      {/* Main 2-Column Split: Directory & EHR Deep Dive */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '320px 1fr',
          gap: '20px',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Patient Directory Search */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 240px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={16}
                color="#94a3b8"
                style={{ position: 'absolute', left: '12px', top: '10px' }}
              />
              <input
                type="text"
                placeholder="Search patient name, ID, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 34px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
            </div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#64748b',
                marginTop: '10px',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>PATIENTS ENROLLED</span>
              <span>{filteredPatients.length} records</span>
            </div>
          </div>

          {/* Patient Scroll List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {loadingPatients ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                <RefreshCw size={20} className="spin" />
                <div style={{ fontSize: '12px', marginTop: '8px' }}>Loading directory...</div>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '13px' }}>
                No patients match the search.
              </div>
            ) : (
              filteredPatients.map((p) => {
                const isSelected = selectedPatient?.id === p.id;
                const initials = p.fullName
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((w) => w[0].toUpperCase())
                  .join('');

                return (
                  <div
                    key={p.id}
                    onClick={() => selectPatient(p)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      background: isSelected ? '#ecfdf5' : '#ffffff',
                      border: isSelected ? '1px solid #a7f3d0' : '1px solid transparent',
                      marginBottom: '6px',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        background: isSelected ? '#059669' : '#f1f5f9',
                        color: isSelected ? '#ffffff' : '#475569',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '13px',
                        flexShrink: 0,
                      }}
                    >
                      {initials || 'PT'}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 800,
                          color: isSelected ? '#065f46' : '#0f172a',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {p.fullName}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        {p.patientId} • {p.age} Yrs ({p.gender[0]})
                      </div>
                    </div>

                    <ChevronRight size={16} color={isSelected ? '#059669' : '#cbd5e1'} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Complete EHR Profile */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {selectedPatient ? (
            <>
              {/* Patient Banner */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  padding: '20px 24px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #059669, #0284c7)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        fontWeight: 800,
                      }}
                    >
                      {selectedPatient.fullName[0]}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                          {selectedPatient.fullName}
                        </h3>
                        <span
                          style={{
                            background: '#dbeafe',
                            color: '#1e40af',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 800,
                          }}
                        >
                          {selectedPatient.patientId}
                        </span>
                        {selectedPatient.bloodGroup && (
                          <span
                            style={{
                              background: '#fee2e2',
                              color: '#991b1b',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 800,
                            }}
                          >
                            🩸 {selectedPatient.bloodGroup}
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#64748b',
                          marginTop: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span>
                          <strong>Age:</strong> {selectedPatient.age} Yrs • {selectedPatient.gender}
                        </span>
                        <span>
                          <strong>Phone:</strong> {selectedPatient.phone}
                        </span>
                        <span>
                          <strong>Emergency:</strong> {selectedPatient.emergencyContactName} (
                          {selectedPatient.emergencyContactPhone})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Start Consultation Quick CTA */}
                  <button
                    onClick={() => onStartConsultation(selectedPatient)}
                    style={{
                      background: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      padding: '10px 18px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
                    }}
                  >
                    <Stethoscope size={16} />
                    Start OPD Consultation
                  </button>
                </div>

                {/* Allergies & Chronic Conditions Tag Row */}
                <div
                  style={{
                    display: 'flex',
                    gap: '10px',
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: '1px solid #f1f5f9',
                    flexWrap: 'wrap',
                  }}
                >
                  {selectedPatient.allergies && selectedPatient.allergies.length > 0 && (
                    <div
                      style={{
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        color: '#991b1b',
                        padding: '4px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <AlertTriangle size={14} color="#dc2626" />
                      Allergies: {selectedPatient.allergies.join(', ')}
                    </div>
                  )}

                  {selectedPatient.existingConditions &&
                    selectedPatient.existingConditions.length > 0 && (
                      <div
                        style={{
                          background: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          color: '#1e40af',
                          padding: '4px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <HeartPulse size={14} color="#2563eb" />
                        Conditions: {selectedPatient.existingConditions.join(', ')}
                      </div>
                    )}
                </div>
              </div>

              {/* Consultation Records & Prescriptions Timeline */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  padding: '20px 24px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Clinical Consultations & Diagnosis History ({medicalRecords.length})
                  </h4>
                </div>

                {loadingRecords ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    <RefreshCw size={24} className="spin" />
                    <div style={{ fontSize: '13px', marginTop: '8px' }}>
                      Retrieving medical history...
                    </div>
                  </div>
                ) : medicalRecords.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '40px 20px',
                      background: '#f8fafc',
                      borderRadius: '12px',
                      border: '1px dashed #cbd5e1',
                    }}
                  >
                    <FileText size={36} color="#94a3b8" style={{ marginBottom: '8px' }} />
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>
                      No prior clinical consultation records found
                    </div>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 12px 0' }}>
                      This patient has not had an OPD consultation recorded yet.
                    </p>
                    <button
                      onClick={() => onStartConsultation(selectedPatient)}
                      style={{
                        background: '#059669',
                        color: '#ffffff',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '10px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Record First Consultation
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {medicalRecords.map((rec) => (
                      <div
                        key={rec.id}
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '14px',
                          padding: '18px',
                          background: '#f8fafc',
                        }}
                      >
                        {/* Record Header */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: '1px solid #e2e8f0',
                            paddingBottom: '12px',
                            marginBottom: '12px',
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                              Visit with {rec.doctorName}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                              {rec.doctorSpecialization} • {rec.phcName || 'Central Urban PHC'}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '12px', fontWeight: 800, color: '#0284c7' }}>
                                {new Date(rec.visitDate || rec.createdAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </div>
                              <span style={{ fontSize: '10px', color: '#64748b' }}>
                                {rec.recordNumber}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDownloadRecordPDF(rec)}
                              style={{
                                background: '#e0f2f1',
                                color: '#00796b',
                                border: '1px solid #00796b',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <Download size={13} /> PDF
                            </button>
                          </div>
                        </div>

                        {/* Vitals Summary Strip */}
                        {rec.vitals && (
                          <div
                            style={{
                              display: 'flex',
                              gap: '12px',
                              background: '#ffffff',
                              padding: '10px 14px',
                              borderRadius: '10px',
                              border: '1px solid #e2e8f0',
                              marginBottom: '12px',
                              flexWrap: 'wrap',
                              fontSize: '11px',
                            }}
                          >
                            <span>
                              <strong>BP:</strong> {rec.vitals.bp || '120/80'}
                            </span>
                            <span>
                              <strong>Pulse:</strong> {rec.vitals.pulse || '72 bpm'}
                            </span>
                            <span>
                              <strong>Temp:</strong> {rec.vitals.temperature || '98.6 F'}
                            </span>
                            <span>
                              <strong>SpO2:</strong> {rec.vitals.spO2 || '99%'}
                            </span>
                            <span>
                              <strong>Weight:</strong> {rec.vitals.weight || '65 kg'}
                            </span>
                          </div>
                        )}

                        {/* Diagnosis & Clinical Findings */}
                        <div style={{ marginBottom: '12px' }}>
                          <div
                            style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              color: '#64748b',
                              textTransform: 'uppercase',
                            }}
                          >
                            Provisional Diagnosis & Findings
                          </div>
                          <div
                            style={{
                              fontSize: '13px',
                              fontWeight: 700,
                              color: '#0f172a',
                              marginTop: '2px',
                            }}
                          >
                            {Array.isArray(rec.diagnosis) ? rec.diagnosis.join(', ') : (rec.diagnosis || 'Clinical Evaluation')}
                          </div>
                          {rec.clinicalAssessment && (
                            <p
                              style={{
                                fontSize: '12px',
                                color: '#475569',
                                margin: '4px 0 0 0',
                                fontStyle: 'italic',
                              }}
                            >
                              "{rec.clinicalAssessment}"
                            </p>
                          )}
                        </div>

                        {/* Prescribed Medications */}
                        {rec.prescriptions && rec.prescriptions.length > 0 && (
                          <div>
                            <div
                              style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                color: '#059669',
                                textTransform: 'uppercase',
                                marginBottom: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <Pill size={12} /> Prescribed Medicines
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {rec.prescriptions.map((med, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    background: '#ffffff',
                                    padding: '6px 10px',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '12px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                  }}
                                >
                                  <div>
                                    <strong>{med.medicineName}</strong> ({med.dosage})
                                    <div style={{ fontSize: '10px', color: '#64748b' }}>
                                      {med.frequency} • Duration: {med.duration}
                                    </div>
                                  </div>
                                  <span
                                    style={{
                                      fontSize: '10px',
                                      color: '#059669',
                                      background: '#d1fae5',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      fontWeight: 700,
                                    }}
                                  >
                                    Dispensed
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '60px 20px',
                textAlign: 'center',
                border: '1px dashed #cbd5e1',
              }}
            >
              <Users size={44} color="#94a3b8" style={{ marginBottom: '12px' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>
                Select a patient from the directory
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '400px', margin: '6px auto 0' }}>
                Choose a patient on the left to inspect their complete longitudinal medical history.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
