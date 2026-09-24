import React from 'react';
import { User, HeartPulse, ShieldCheck, AlertCircle, Phone, MapPin, Activity, LogOut, QrCode } from 'lucide-react';
import { PatientProfile, AppLanguage } from '@phc-connect/types';

interface Props {
  patient: PatientProfile | null;
  onLogout: () => void;
  lang: AppLanguage;
}

export const PatientProfileScreen: React.FC<Props> = ({ patient, onLogout, lang }) => {
  if (!patient) return null;

  const t = {
    en: {
      title: 'Digital Health Profile',
      subtitle: 'Unique Patient ID & registered clinical baseline',
      cardTag: 'National Health Mission • ArogyaMitra',
      ageYears: 'Years',
      bloodGroup: 'Blood Group',
      emergencyContact: 'Emergency Contact',
      medicalBaseline: 'Clinical Baseline & History',
      allergies: 'Known Allergies',
      conditions: 'Existing Conditions',
      meds: 'Current Medications',
      logoutBtn: 'Sign Out of Patient Account',
    },
    hi: {
      title: 'डिजिटल स्वास्थ्य प्रोफ़ाइल',
      subtitle: 'विशिष्ट रोगी आईडी और पंजीकृत स्वास्थ्य जानकारी',
      cardTag: 'राष्ट्रीय स्वास्थ्य मिशन • आरोग्यमित्र',
      ageYears: 'वर्ष',
      bloodGroup: 'रक्त समूह',
      emergencyContact: 'आपातकालीन संपर्क',
      medicalBaseline: 'चिकित्सीय इतिहास और स्वास्थ्य विवरण',
      allergies: 'एलर्जी',
      conditions: 'पुरानी बीमारियां',
      meds: 'वर्तमान दवाएं',
      logoutBtn: 'खाते से लॉग आउट करें',
    },
    kn: {
      title: 'ಡಿಜಿಟಲ್ ಆರೋಗ್ಯ ಪ್ರೊಫೈಲ್',
      subtitle: 'ವಿಶಿಷ್ಟ ರೋಗಿ ಐಡಿ ಮತ್ತು ನೋಂದಾಯಿತ ಕ್ಲಿನಿಕಲ್ ಮಾಹಿತಿ',
      cardTag: 'ರಾಷ್ಟ್ರೀಯ ಆರೋಗ್ಯ ಅಭಿಯಾನ • ಆರೋಗ್ಯಮಿತ್ರ',
      ageYears: 'ವರ್ಷಗಳು',
      bloodGroup: 'ರಕ್ತದ ಗುಂಪು',
      emergencyContact: 'ತುರ್ತು ಸಂಪರ್ಕ',
      medicalBaseline: 'ಕ್ಲಿನಿಕಲ್ ಇತಿಹಾಸ ಮತ್ತು ಆರೋಗ್ಯ ವಿವರ',
      allergies: 'ತಿಳಿದಿರುವ ಅಲರ್ಜಿಗಳು',
      conditions: 'ಹಳೆಯ ಕಾಯಿಲೆಗಳು',
      meds: 'ಪ್ರಸ್ತುತ ಔಷಧಿಗಳು',
      logoutBtn: 'ಖಾತೆಯಿಂದ ಲಾಗ್ ಔಟ್ ಮಾಡಿ',
    },
  }[lang];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>
          {t.title}
        </h2>
        <p style={{ fontSize: '12px', color: '#64748b' }}>
          {t.subtitle}
        </p>
      </div>

      {/* Digital Patient ID Card */}
      <div style={{
        background: 'linear-gradient(135deg, #1976d2, #0d47a1)',
        color: 'white',
        borderRadius: '20px',
        padding: '20px',
        boxShadow: '0 10px 25px rgba(25, 118, 210, 0.35)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          right: '-15px',
          bottom: '-15px',
          width: '120px',
          height: '120px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.85 }}>
              National Health Mission • ArogyaMitra
            </span>
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginTop: '2px' }}>
              {patient.fullName}
            </h3>
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '6px',
            borderRadius: '10px',
          }}>
            <QrCode size={28} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '12px' }}>
          <div>
            <span style={{ fontSize: '10px', opacity: 0.8, display: 'block' }}>Patient ID Code</span>
            <strong style={{ fontSize: '16px', letterSpacing: '0.5px' }}>
              {patient.patientId}
            </strong>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '10px', opacity: 0.8, display: 'block' }}>Demographics</span>
            <strong style={{ fontSize: '13px' }}>
              {patient.age} Yrs • {patient.gender} • {patient.bloodGroup || 'O+ve'}
            </strong>
          </div>
        </div>
      </div>

      {/* Emergency Contact Box */}
      <div className="card">
        <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <AlertCircle size={16} /> Emergency Contact
        </h4>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
          <div>
            <strong style={{ color: '#1e293b' }}>{patient.emergencyContactName}</strong>
            <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>
              Relation: {patient.emergencyContactRelation}
            </span>
          </div>
          <a
            href={`tel:${patient.emergencyContactPhone}`}
            style={{
              background: '#fee2e2',
              color: '#dc2626',
              padding: '6px 12px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 800,
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Phone size={13} /> {patient.emergencyContactPhone}
          </a>
        </div>
      </div>

      {/* Medical Baseline */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>
          Clinical Profile & Allergies
        </h4>

        <div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>
            Known Allergies:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {patient.allergies.length > 0 ? (
              patient.allergies.map((a, i) => (
                <span key={i} style={{ background: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                  ⚠️ {a}
                </span>
              ))
            ) : (
              <span style={{ fontSize: '11px', color: '#10b981' }}>No known drug/food allergies recorded</span>
            )}
          </div>
        </div>

        <div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>
            Chronic Conditions:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {patient.existingConditions.length > 0 ? (
              patient.existingConditions.map((c, i) => (
                <span key={i} style={{ background: '#eff6ff', color: '#1d4ed8', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                  ● {c}
                </span>
              ))
            ) : (
              <span style={{ fontSize: '11px', color: '#64748b' }}>None</span>
            )}
          </div>
        </div>

        <div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>
            Current Medications:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {patient.currentMedications.length > 0 ? (
              patient.currentMedications.map((m, i) => (
                <span key={i} style={{ background: '#f0fdf4', color: '#15803d', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                  💊 {m}
                </span>
              ))
            ) : (
              <span style={{ fontSize: '11px', color: '#64748b' }}>None</span>
            )}
          </div>
        </div>

        <div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>
            Address:
          </span>
          <p style={{ fontSize: '12px', color: '#1e293b' }}>{patient.address}</p>
        </div>
      </div>

      <button
        onClick={onLogout}
        style={{
          background: '#f8fafc',
          color: '#dc2626',
          border: '1px solid #fee2e2',
          padding: '12px',
          borderRadius: '12px',
          fontSize: '13px',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
        }}
      >
        <LogOut size={16} /> Switch Account / Logout
      </button>
    </div>
  );
};
