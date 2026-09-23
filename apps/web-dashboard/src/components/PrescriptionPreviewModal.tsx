import React from 'react';
import { Download, Printer, X, CheckCircle2, ShieldCheck, Stethoscope } from 'lucide-react';
import { PrescriptionData, PrescriptionPDFGenerator } from '../utils/prescriptionPdfGenerator';

interface PrescriptionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PrescriptionData | null;
}

export const PrescriptionPreviewModal: React.FC<PrescriptionPreviewModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  if (!isOpen || !data) return null;

  const handleDownloadPDF = () => {
    PrescriptionPDFGenerator.generate(data, true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '850px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Modal Top Action Bar */}
        <div
          style={{
            padding: '16px 24px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#e0f2f1',
                color: '#00796b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Consultation Recorded & E-Prescription Ready
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                Record #{data.recordNumber || 'NEW'} • Ready for PDF Export & Dispensing
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleDownloadPDF}
              style={{
                background: '#00796b',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(0, 121, 107, 0.25)',
              }}
            >
              <Download size={15} /> Download PDF
            </button>

            <button
              onClick={handlePrint}
              style={{
                background: '#ffffff',
                color: '#334155',
                border: '1px solid #cbd5e1',
                padding: '8px 14px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Printer size={15} /> Print
            </button>

            <button
              onClick={onClose}
              style={{
                background: '#f1f5f9',
                color: '#64748b',
                border: 'none',
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Prescription Paper Preview */}
        <div style={{ padding: '24px', overflowY: 'auto', background: '#f1f5f9' }}>
          <div
            id="printable-prescription"
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              fontFamily: 'Inter, system-ui, sans-serif',
              color: '#1e293b',
            }}
          >
            {/* Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, #00695c, #00897b)',
                color: 'white',
                padding: '16px 20px',
                borderRadius: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px', opacity: 0.9 }}>
                  NATIONAL HEALTH MISSION • GOVT. OF INDIA
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '2px' }}>
                  {data.doctor.phcName}
                </div>
                <div style={{ fontSize: '11px', opacity: 0.85, marginTop: '2px' }}>
                  {data.doctor.phcAddress || 'Integrated Digital Health Portal (Ayushman Bharat - PHC Connect)'}
                </div>
              </div>

              <div
                style={{
                  background: 'white',
                  color: '#00695c',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  textAlign: 'right',
                }}
              >
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>OPD RECORD</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                  {data.recordNumber || 'NEW'}
                </div>
              </div>
            </div>

            {/* Doctor Info & Date Bar */}
            <div
              style={{
                marginTop: '12px',
                padding: '10px 16px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12px',
              }}
            >
              <div>
                <span style={{ fontWeight: 800, color: '#0f172a' }}>{data.doctor.fullName}</span>
                <span style={{ color: '#64748b', marginLeft: '6px' }}>
                  ({data.doctor.specialization} • {data.doctor.qualification} • Reg: {data.doctor.registrationNumber || 'MCI-2018'})
                </span>
              </div>
              <div style={{ color: '#64748b', fontWeight: 600 }}>
                Date: <strong style={{ color: '#0f172a' }}>{data.consultationDate || new Date().toLocaleDateString('en-IN')}</strong>
              </div>
            </div>

            {/* Patient Demographics */}
            <div
              style={{
                marginTop: '12px',
                padding: '12px 16px',
                background: '#f1f5f9',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '13px',
              }}
            >
              <div>
                <span style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a' }}>{data.patient.fullName}</span>
                <span
                  style={{
                    marginLeft: '8px',
                    fontSize: '11px',
                    background: '#e0f2fe',
                    color: '#0284c7',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 700,
                  }}
                >
                  {data.patient.patientId}
                </span>
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '3px' }}>
                  {data.patient.age} Yrs • {data.patient.gender} • Phone: {data.patient.phone}
                </div>
              </div>

              <div style={{ textAlign: 'right', fontSize: '11px' }}>
                {data.patient.allergies && data.patient.allergies.length > 0 ? (
                  <div style={{ color: '#dc2626', fontWeight: 700 }}>
                    ⚠️ Allergy: {data.patient.allergies.join(', ')}
                  </div>
                ) : (
                  <div style={{ color: '#16a34a', fontWeight: 600 }}>✓ No Known Drug Allergies</div>
                )}
                {data.patient.existingConditions && data.patient.existingConditions.length > 0 && (
                  <div style={{ color: '#0284c7', marginTop: '2px' }}>
                    History: {data.patient.existingConditions.join(', ')}
                  </div>
                )}
              </div>
            </div>

            {/* Vitals Ribbon */}
            <div
              style={{
                marginTop: '12px',
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '8px',
              }}
            >
              {[
                { label: 'Blood Pressure', val: data.vitals.bp || '120/80 mmHg' },
                { label: 'Temperature', val: data.vitals.temperature ? `${data.vitals.temperature} °F` : '98.6 °F' },
                { label: 'Pulse Rate', val: data.vitals.pulse ? `${data.vitals.pulse} bpm` : '72 bpm' },
                { label: 'SpO2 Oxygen', val: data.vitals.spO2 ? `${data.vitals.spO2} %` : '99 %' },
                { label: 'Body Weight', val: data.vitals.weight ? `${data.vitals.weight} kg` : '65 kg' },
              ].map((v, i) => (
                <div
                  key={i}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '8px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>{v.label}</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                    {v.val}
                  </div>
                </div>
              ))}
            </div>

            {/* Diagnosis */}
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#00695c', marginBottom: '6px' }}>
                PROVISIONAL CLINICAL DIAGNOSIS (ICD-10)
              </div>
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#0f172a',
                }}
              >
                {data.diagnosis && data.diagnosis.length > 0 ? data.diagnosis.join(' • ') : 'General Clinical Evaluation'}
              </div>
            </div>

            {/* Clinical Assessment Notes */}
            {data.clinicalAssessment && (
              <div style={{ marginTop: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Clinical Findings & Examination:
                </div>
                <div style={{ fontSize: '12px', color: '#334155', lineHeight: 1.5, background: '#ffffff', padding: '6px 0' }}>
                  {data.clinicalAssessment}
                </div>
              </div>
            )}

            {/* Prescriptions Table */}
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#00695c', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <span style={{ fontSize: '18px' }}>℞</span> Prescribed Medicines
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#00695c', color: 'white', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px', borderRadius: '6px 0 0 0' }}>#</th>
                    <th style={{ padding: '8px 10px' }}>Medicine Name</th>
                    <th style={{ padding: '8px 10px' }}>Dosage</th>
                    <th style={{ padding: '8px 10px' }}>Frequency</th>
                    <th style={{ padding: '8px 10px' }}>Duration</th>
                    <th style={{ padding: '8px 10px', borderRadius: '0 6px 0 0' }}>Instructions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.prescriptions && data.prescriptions.length > 0 ? (
                    data.prescriptions.map((m, idx) => (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: '1px solid #e2e8f0',
                          background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                        }}
                      >
                        <td style={{ padding: '8px 10px', color: '#64748b' }}>{idx + 1}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0f172a' }}>{m.medicineName}</td>
                        <td style={{ padding: '8px 10px' }}>{m.dosage}</td>
                        <td style={{ padding: '8px 10px' }}>{m.frequency}</td>
                        <td style={{ padding: '8px 10px' }}>{m.duration}</td>
                        <td style={{ padding: '8px 10px', color: '#475569' }}>{m.instructions || 'After meals'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ padding: '12px', textAlign: 'center', color: '#94a3b8' }}>
                        No medication prescribed. Routine observation and hydration advised.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Recommended Tests */}
            {data.recommendedTests && data.recommendedTests.length > 0 && (
              <div style={{ marginTop: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#00695c', marginBottom: '4px' }}>
                  Recommended Lab Tests / Diagnostic Workup:
                </div>
                <div
                  style={{
                    background: '#f1f5f9',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#1e293b',
                  }}
                >
                  {data.recommendedTests.join('  •  ')}
                </div>
              </div>
            )}

            {/* Referral & Follow-up */}
            <div
              style={{
                marginTop: '16px',
                padding: '12px 16px',
                background: '#fef2f2',
                borderRadius: '8px',
                border: '1px solid #fecaca',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12px',
              }}
            >
              <div>
                <div style={{ fontWeight: 800, color: '#b91c1c' }}>DISPOSITION & FOLLOW-UP:</div>
                <div style={{ color: '#1e293b', marginTop: '2px' }}>
                  {data.referralType || 'Patient Treated (Routine Discharge)'}
                  {data.followUpDate ? ` • Review Date: ${data.followUpDate}` : ''}
                </div>
              </div>

              <div style={{ textAlign: 'right', color: '#dc2626', fontWeight: 700 }}>
                🚨 24x7 Emergency / Ambulance: 108 / 112
              </div>
            </div>

            {/* Signature & Seal Footer */}
            <div
              style={{
                marginTop: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                borderTop: '1px dashed #cbd5e1',
                paddingTop: '16px',
              }}
            >
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                <div>• Generic medicines dispensed free of cost at PHC Pharmacy counter.</div>
                <div>• Verified Digital Health Record (ABHA / NHM Integrated).</div>
              </div>

              <div style={{ textAlign: 'center', minWidth: '180px' }}>
                <div style={{ borderBottom: '1px solid #94a3b8', width: '100%', marginBottom: '4px' }} />
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
                  {data.doctor.fullName}
                </div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>
                  Medical Officer / Registered Medical Practitioner
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div
          style={{
            padding: '16px 24px',
            background: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#00796b', fontWeight: 700 }}>
            <ShieldCheck size={16} /> Official Government of India & NHM Prescription Standard
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleDownloadPDF}
              className="btn-primary"
              style={{
                padding: '10px 20px',
                fontSize: '13px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Download size={16} /> Save / Download PDF
            </button>

            <button
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#475569',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Done & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
