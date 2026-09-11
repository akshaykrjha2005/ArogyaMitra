import React, { useState } from 'react';
import { ShieldCheck, UserPlus, Phone, Lock, HeartPulse, AlertCircle, Sparkles } from 'lucide-react';
import { apiClient } from '../services/api';
import { PatientProfile } from '@phc-connect/types';

interface Props {
  onSuccess: (patient: PatientProfile) => void;
  lang: 'en' | 'hi' | 'kn';
}

export const AuthScreen: React.FC<Props> = ({ onSuccess, lang }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [phone, setPhone] = useState('+91 98765 43210');
  const [fullName, setFullName] = useState('Aakash Jha');
  const [age, setAge] = useState('24');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [address, setAddress] = useState('Sector 4, Karol Bagh, Delhi');
  const [emergencyName, setEmergencyName] = useState('Rajesh Jha');
  const [emergencyPhone, setEmergencyPhone] = useState('+91 98999 10001');
  const [emergencyRelation, setEmergencyRelation] = useState('Father');
  const [allergies, setAllergies] = useState('Penicillin');
  const [chronicConditions, setChronicConditions] = useState('Mild Bronchial Asthma');
  const [medications, setMedications] = useState('Salbutamol Inhaler SOS');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const t = {
    en: {
      title: 'ArogyaMitra',
      subtitle: 'Smart Primary Healthcare Companion',
      loginTab: 'Quick Login / OTP',
      regTab: 'New Patient Registration',
      phoneLabel: 'Mobile Phone Number',
      nameLabel: 'Full Legal Name',
      ageLabel: 'Age',
      genderLabel: 'Gender',
      addrLabel: 'Residential Address / Village',
      emgName: 'Emergency Contact Name',
      emgPhone: 'Emergency Phone Number',
      emgRel: 'Relation',
      allergiesLabel: 'Known Drug / Food Allergies',
      chronicLabel: 'Existing Chronic Conditions',
      medsLabel: 'Current Daily Medications',
      loginBtn: 'Verify & Access Healthcare',
      registerBtn: 'Generate Digital Patient ID & Register',
      disclaimer: 'Your medical health records are securely encrypted and comply with Digital Health Mission standards.',
    },
    hi: {
      title: 'आरोग्यमित्र',
      subtitle: 'स्मार्ट प्राथमिक स्वास्थ्य सेवा मंच',
      loginTab: 'त्वरित लॉगिन / ओटीपी',
      regTab: 'नया मरीज पंजीकरण',
      phoneLabel: 'मोबाइल नंबर',
      nameLabel: 'पूरा नाम',
      ageLabel: 'उम्र',
      genderLabel: 'लिंग',
      addrLabel: 'घर का पता / गांव',
      emgName: 'आपातकालीन संपर्क नाम',
      emgPhone: 'आपातकालीन फोन नंबर',
      emgRel: 'संबंध',
      allergiesLabel: 'दवा या भोजन से एलर्जी',
      chronicLabel: 'मौजूदा पुरानी बीमारियां',
      medsLabel: 'वर्तमान में ली जाने वाली दवाएं',
      loginBtn: 'सत्यापित करें और आगे बढ़ें',
      registerBtn: 'डिजिटल पेशेंट आईडी बनाएं और रजिस्टर करें',
      disclaimer: 'आपका स्वास्थ्य डेटा राष्ट्रीय डिजिटल स्वास्थ्य मानकों के अनुसार सुरक्षित है।',
    },
    kn: {
      title: 'ಆರೋಗ್ಯಮಿತ್ರ',
      subtitle: 'ಸ್ಮಾರ್ಟ್ ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಸೇವಾ ಒಡನಾಡಿ',
      loginTab: 'ತ್ವರಿತ ಲಾಗಿನ್ / ಒಟಿಪಿ',
      regTab: 'ಹೊಸ ರೋಗಿ ನೋಂದಣಿ',
      phoneLabel: 'ಮೊಬೈಲ್ ದೂರವಾಣಿ ಸಂಖ್ಯೆ',
      nameLabel: 'ಪೂರ್ಣ ಕಾನೂನುಬದ್ಧ ಹೆಸರು',
      ageLabel: 'ವಯಸ್ಸು',
      genderLabel: 'ಲಿಂಗ',
      addrLabel: 'ವಾಸಸ್ಥಳದ ವಿಳಾಸ / ಗ್ರಾಮ',
      emgName: 'ತುರ್ತು ಸಂಪರ್ಕ ವ್ಯಕ್ತಿಯ ಹೆಸರು',
      emgPhone: 'ತುರ್ತು ಫೋನ್ ಸಂಖ್ಯೆ',
      emgRel: 'ಸಂಬಂಧ',
      allergiesLabel: 'ಔಷಧ ಅಥವಾ ಆಹಾರದ ಅಲರ್ಜಿಗಳು',
      chronicLabel: 'ಹಳೆಯ ದೀರ್ಘಕಾಲಿಕ ಕಾಯಿಲೆಗಳು',
      medsLabel: 'ಪ್ರಸ್ತುತ ತೆಗೆದುಕೊಳ್ಳುತ್ತಿರುವ ಔಷಧಿಗಳು',
      loginBtn: 'ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಮುಂದುವರಿಯಿರಿ',
      registerBtn: 'ಡಿಜಿಟಲ್ ರೋಗಿ ಐಡಿ ರಚಿಸಿ ಮತ್ತು ನೋಂದಾಯಿಸಿ',
      disclaimer: 'ನಿಮ್ಮ ಆರೋಗ್ಯ ದಾಖಲೆಗಳನ್ನು ಡಿಜಿಟಲ್ ಹೆಲ್ತ್ ಮಿಷನ್ ಮಾನದಂಡಗಳ ಪ್ರಕಾರ ಸುರಕ್ಷಿತವಾಗಿ ಎನ್‌ಕ್ರಿಪ್ಟ್ ಮಾಡಲಾಗಿದೆ.',
    },
  }[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegister) {
        const res = await apiClient.post('/auth/register', {
          fullName,
          phone,
          age: Number(age),
          gender,
          address,
          emergencyContactName: emergencyName,
          emergencyContactPhone: emergencyPhone,
          emergencyContactRelation: emergencyRelation,
          allergies: allergies ? allergies.split(',').map((s) => s.trim()) : [],
          existingConditions: chronicConditions ? chronicConditions.split(',').map((s) => s.trim()) : [],
          currentMedications: medications ? medications.split(',').map((s) => s.trim()) : [],
        });

        if (res.success && res.patient) {
          localStorage.setItem('phc_patient_token', res.token);
          localStorage.setItem('phc_patient_profile', JSON.stringify(res.patient));
          onSuccess(res.patient);
        } else {
          setError(res.message || 'Registration failed');
        }
      } else {
        const res = await apiClient.post('/auth/verify-otp', {
          phone,
          otp: '123456',
        });

        if (res.success && res.patient) {
          localStorage.setItem('phc_patient_token', res.token);
          localStorage.setItem('phc_patient_profile', JSON.stringify(res.patient));
          onSuccess(res.patient);
        } else {
          setError(res.message || 'Login failed');
        }
      }
    } catch (err: any) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px 18px', maxWidth: '420px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{
          width: '54px',
          height: '54px',
          background: 'linear-gradient(135deg, #1976d2, #26a69a)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          margin: '0 auto 12px',
          boxShadow: '0 8px 20px rgba(25, 118, 210, 0.3)',
        }}>
          <HeartPulse size={30} />
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1976d2', letterSpacing: '-0.5px' }}>
          {t.title}
        </h2>
        <p style={{ fontSize: '12px', fontWeight: 600, color: '#26a69a', marginTop: '2px' }}>
          {t.subtitle}
        </p>
      </div>

      <div style={{
        display: 'flex',
        background: '#e2e8f0',
        borderRadius: '12px',
        padding: '4px',
        marginBottom: '20px',
      }}>
        <button
          onClick={() => setIsRegister(false)}
          style={{
            flex: 1,
            padding: '8px',
            border: 'none',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            background: !isRegister ? '#ffffff' : 'transparent',
            color: !isRegister ? '#1976d2' : '#64748b',
            boxShadow: !isRegister ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          {t.loginTab}
        </button>
        <button
          onClick={() => setIsRegister(true)}
          style={{
            flex: 1,
            padding: '8px',
            border: 'none',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            background: isRegister ? '#ffffff' : 'transparent',
            color: isRegister ? '#1976d2' : '#64748b',
            boxShadow: isRegister ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          {t.regTab}
        </button>
      </div>

      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          padding: '10px 14px',
          color: '#dc2626',
          fontSize: '12px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
            {t.phoneLabel}
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="+91 XXXXX XXXXX"
              style={{
                width: '100%',
                padding: '12px 14px 12px 38px',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                fontWeight: 600,
                outline: 'none',
                background: '#ffffff',
              }}
            />
            <Phone size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          </div>
        </div>

        {isRegister && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                {t.nameLabel}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  {t.ageLabel}
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  {t.genderLabel}
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    background: 'white',
                    outline: 'none',
                  }}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                {t.addrLabel}
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '14px',
            }}>
              <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#1e293b', marginBottom: '10px' }}>
                Emergency Contact Details
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  type="text"
                  placeholder={t.emgName}
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder={t.emgPhone}
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                  <input
                    type="text"
                    placeholder={t.emgRel}
                    value={emergencyRelation}
                    onChange={(e) => setEmergencyRelation(e.target.value)}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                {t.allergiesLabel} (comma-separated)
              </label>
              <input
                type="text"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="e.g. Penicillin, Sulfa, Dust"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                {t.chronicLabel}
              </label>
              <input
                type="text"
                value={chronicConditions}
                onChange={(e) => setChronicConditions(e.target.value)}
                placeholder="e.g. Diabetes, Hypertension, Asthma"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                }}
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            background: 'linear-gradient(135deg, #1976d2, #115293)',
            color: 'white',
            border: 'none',
            padding: '14px',
            borderRadius: '14px',
            fontSize: '14px',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(25, 118, 210, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '8px',
          }}
        >
          {isRegister ? <Sparkles size={18} /> : <ShieldCheck size={18} />}
          {loading ? 'Processing...' : isRegister ? t.registerBtn : t.loginBtn}
        </button>

        <p style={{ fontSize: '10px', color: '#64748b', textAlign: 'center', lineHeight: '1.4', marginTop: '10px' }}>
          {t.disclaimer}
        </p>
      </form>
    </div>
  );
};
