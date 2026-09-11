import React, { useState, useEffect } from 'react';
import { FileText, Stethoscope, Pill, Calendar, Clock, Activity, ShieldCheck, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { MedicalRecord, PatientProfile } from '@phc-connect/types';
import { apiClient } from '../services/api';

interface Props {
  patient: PatientProfile | null;
  lang: 'en' | 'hi' | 'kn';
}

export const MedicalRecordsScreen: React.FC<Props> = ({ patient, lang }) => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const t = {
    en: {
      title: 'Electronic Medical Records (EHR)',
      subtitle: 'Verified clinical notes, prescriptions & lab advice by PHC doctors',
      shieldNotice: 'Doctor-verified medical entries are encrypted and read-only for patient safety.',
      noRecords: 'No medical records found yet.',
      noRecordsSub: 'Your prescriptions and clinical notes will appear here automatically after your PHC doctor consultation.',
      rxTitle: 'Prescribed Medications',
      vitalsTitle: 'Clinical Vitals at Consultation',
    },
    hi: {
      title: 'इलेक्ट्रॉनिक मेडिकल रिकॉर्ड (EHR)',
      subtitle: 'पीएचसी डॉक्टरों द्वारा सत्यापित पर्चे, जांच सलाह और नोट्स',
      shieldNotice: 'डॉक्टर द्वारा सत्यापित प्रविष्टियां मरीज सुरक्षा के लिए एन्क्रिप्टेड और सुरक्षित हैं।',
      noRecords: 'अभी तक कोई मेडिकल रिकॉर्ड नहीं मिला।',
      noRecordsSub: 'आपकी डॉक्टर परामर्श के बाद आपके पर्चे और नोट्स यहाँ दिखाई देंगे।',
      rxTitle: 'निर्धारित दवाएं',
      vitalsTitle: 'परामर्श के समय महत्वपूर्ण संकेत (Vitals)',
    },
    kn: {
      title: 'ಎಲೆಕ್ಟ್ರಾನಿಕ್ ವೈದ್ಯಕೀಯ ದಾಖಲೆಗಳು (EHR)',
      subtitle: 'ಪಿಹೆಚ್‌ಸಿ ವೈದ್ಯರು ಪರಿಶೀಲಿಸಿದ ಕ್ಲಿನಿಕಲ್ ಟಿಪ್ಪಣಿಗಳು, ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್‌ಗಳು ಮತ್ತು ಲ್ಯಾಬ್ ಸಲಹೆಗಳು',
      shieldNotice: 'ವೈದ್ಯರು ಪರಿಶೀಲಿಸಿದ ವೈದ್ಯಕೀಯ ದಾಖಲೆಗಳನ್ನು ರೋಗಿಯ ಸುರಕ್ಷತೆಗಾಗಿ ಎನ್‌ಕ್ರಿಪ್ಟ್ ಮಾಡಲಾಗಿದೆ.',
      noRecords: 'ಇನ್ನೂ ಯಾವುದೇ ವೈದ್ಯಕೀಯ ದಾಖಲೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ.',
      noRecordsSub: 'ಪಿಹೆಚ್‌ಸಿ ವೈದ್ಯರ ಸಮಾಲೋಚನೆಯ ನಂತರ ನಿಮ್ಮ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್‌ಗಳು ಇಲ್ಲಿ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಗೋಚರಿಸುತ್ತವೆ.',
      rxTitle: 'ಸೂಚಿಸಲಾದ ಔಷಧಿಗಳು',
      vitalsTitle: 'ಸಮಾಲೋಚನೆಯ ಸಮಯದಲ್ಲಿ ಕ್ಲಿನಿಕಲ್ ವೈಟಲ್ಸ್',
    },
  }[lang];

  useEffect(() => {
    loadRecords();
  }, [patient]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/patients/me/records', { patientId: patient?.id || 'pat-0001' });
      if (res.success && res.records) {
        setRecords(res.records);
        if (res.records.length > 0) {
          setExpandedId(res.records[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>
          {t.title}
        </h2>
        <p style={{ fontSize: '12px', color: '#64748b' }}>
          {t.subtitle}
        </p>
      </div>

      <div style={{
        background: '#e0f2f1',
        border: '1px solid #b2dfdb',
        borderRadius: '12px',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '11px',
        color: '#00695c',
      }}>
        <ShieldCheck size={18} />
        <span>{t.shieldNotice}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
            <FileText size={40} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
            <p style={{ fontSize: '13px', fontWeight: 600 }}>No medical records found yet.</p>
            <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
              Your prescriptions and clinical notes will appear here automatically after your PHC doctor consultation.
            </p>
          </div>
        ) : (
          records.map((rec) => {
            const isExpanded = expandedId === rec.id;

            return (
              <div
                key={rec.id}
                className="card"
                style={{
                  border: isExpanded ? '2px solid #1976d2' : '1px solid #e2e8f0',
                  padding: '16px',
                }}
              >
                {/* Header Strip */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#1976d2' }}>
                        {rec.recordNumber}
                      </span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>•</span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>{rec.visitDate}</span>
                    </div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b' }}>
                      {rec.doctorName}
                    </h3>
                    <p style={{ fontSize: '11px', color: '#00897b', fontWeight: 600 }}>
                      {rec.doctorSpecialization} • {rec.phcName}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      background: '#e8f5e9',
                      color: '#2e7d32',
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '6px',
                    }}>
                      {rec.referralType}
                    </span>
                    {isExpanded ? <ChevronUp size={18} color="#64748b" /> : <ChevronDown size={18} color="#64748b" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                    {/* Chief Complaints */}
                    <div>
                      <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                        Chief Complaints:
                      </h4>
                      <p style={{ fontSize: '12px', color: '#1e293b' }}>
                        {rec.chiefComplaints.join(', ')}
                      </p>
                    </div>

                    {/* Vitals */}
                    {rec.vitals && (
                      <div style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '10px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '6px',
                        textAlign: 'center',
                      }}>
                        <div>
                          <span style={{ fontSize: '9px', color: '#64748b', display: 'block' }}>BP</span>
                          <strong style={{ fontSize: '11px', color: '#1e293b' }}>{rec.vitals.bp || '120/80'}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '9px', color: '#64748b', display: 'block' }}>Temp</span>
                          <strong style={{ fontSize: '11px', color: '#1e293b' }}>{rec.vitals.temperature || '98.6 F'}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '9px', color: '#64748b', display: 'block' }}>Pulse</span>
                          <strong style={{ fontSize: '11px', color: '#1e293b' }}>{rec.vitals.pulse || '72 bpm'}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '9px', color: '#64748b', display: 'block' }}>SpO2</span>
                          <strong style={{ fontSize: '11px', color: '#1e293b' }}>{rec.vitals.spO2 || '99%'}</strong>
                        </div>
                      </div>
                    )}

                    {/* Clinical Assessment & Diagnosis */}
                    <div>
                      <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                        Clinical Assessment & Diagnoses:
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
                        {rec.diagnosis.map((d, i) => (
                          <span
                            key={i}
                            style={{
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              color: '#1d4ed8',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 700,
                            }}
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                      <p style={{ fontSize: '12px', color: '#334155', lineHeight: '1.4' }}>
                        {rec.clinicalAssessment}
                      </p>
                    </div>

                    {/* Prescriptions */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <Pill size={15} color="#1976d2" />
                        <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>
                          Prescribed Medications ({rec.prescriptions.length})
                        </h4>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {rec.prescriptions.map((p, idx) => (
                          <div
                            key={idx}
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              borderRadius: '10px',
                              padding: '10px',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <strong style={{ fontSize: '13px', color: '#1e293b' }}>{p.medicineName}</strong>
                                {p.genericName && (
                                  <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>
                                    ({p.genericName})
                                  </span>
                                )}
                              </div>
                              <span style={{
                                background: '#dbeafe',
                                color: '#1e40af',
                                fontSize: '10px',
                                fontWeight: 800,
                                padding: '2px 6px',
                                borderRadius: '4px',
                              }}>
                                {p.dosage}
                              </span>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '11px', color: '#475569' }}>
                              <span><strong>Frequency:</strong> {p.frequency}</span>
                              <span><strong>Duration:</strong> {p.duration}</span>
                            </div>

                            {p.instructions && (
                              <p style={{ fontSize: '11px', color: '#0284c7', marginTop: '4px', fontStyle: 'italic' }}>
                                ℹ️ {p.instructions}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recommended Tests & Follow Up */}
                    <div style={{
                      background: '#fffbeb',
                      border: '1px solid #fef3c7',
                      borderRadius: '10px',
                      padding: '10px',
                      fontSize: '11px',
                      color: '#92400e',
                    }}>
                      {rec.recommendedTests && rec.recommendedTests.length > 0 && (
                        <p style={{ marginBottom: '4px' }}>
                          <strong>Recommended Diagnostic Tests:</strong> {rec.recommendedTests.join(', ')}
                        </p>
                      )}
                      {rec.followUpDate && (
                        <p>
                          <strong>Follow-up Visit Date:</strong> {rec.followUpDate}
                        </p>
                      )}
                    </div>

                    {/* Doctor Notes */}
                    {rec.doctorNotes && (
                      <p style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
                        <strong>Doctor's Advice:</strong> {rec.doctorNotes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
