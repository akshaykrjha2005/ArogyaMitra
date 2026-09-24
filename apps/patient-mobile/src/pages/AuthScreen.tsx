import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Phone,
  Lock,
  HeartPulse,
  AlertCircle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  KeyRound,
  UserCheck,
  Edit3,
} from 'lucide-react';
import { apiClient } from '../services/api';
import { PatientProfile, AppLanguage } from '@phc-connect/types';

interface Props {
  onSuccess: (patient: PatientProfile) => void;
  onBrowsePublicAwareness?: () => void;
  lang: AppLanguage;
}

const DEMO_PATIENTS = [
  { name: 'Aakash Jha', phone: '+91 98765 43210', id: 'PHC-PAT-2026-0001', area: 'Karol Bagh, Delhi' },
  { name: 'Sunita Devi', phone: '+91 98765 43211', id: 'PHC-PAT-2026-0002', area: 'Rohini, Delhi' },
  { name: 'Mohan Lal', phone: '+91 98765 43212', id: 'PHC-PAT-2026-0003', area: 'Najafgarh, Delhi' },
  { name: 'Pooja Sharma', phone: '+91 98765 43213', id: 'PHC-PAT-2026-0004', area: 'Narela, Delhi' },
];

export const AuthScreen: React.FC<Props> = ({ onSuccess, onBrowsePublicAwareness, lang }) => {
  // Mode: login vs register
  const [isRegister, setIsRegister] = useState(false);
  // Step: 1 = Input Phone/Details, 2 = Enter & Verify OTP
  const [authStep, setAuthStep] = useState<1 | 2>(1);

  // Form State
  const [phone, setPhone] = useState('+91 98765 43210');
  const [fullName, setFullName] = useState('Aakash Jha');
  const [age, setAge] = useState('24');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [address, setAddress] = useState('Sector 4, Karol Bagh, Delhi');
  const [emergencyName, setEmergencyName] = useState('Rajesh Jha');
  const [emergencyPhone, setEmergencyPhone] = useState('+91 98999 10001');
  const [emergencyRelation, setEmergencyRelation] = useState('Father');
  const [bloodGroup, setBloodGroup] = useState('O+ve');
  const [allergies, setAllergies] = useState('Penicillin');
  const [chronicConditions, setChronicConditions] = useState('Mild Bronchial Asthma');
  const [medications, setMedications] = useState('Salbutamol Inhaler SOS');

  // OTP State
  const [enteredOtp, setEnteredOtp] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState<number>(30);
  const [canResend, setCanResend] = useState<boolean>(false);

  // Status State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Countdown timer for Resend OTP
  useEffect(() => {
    let interval: any = null;
    if (authStep === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [authStep, resendTimer]);

  const t = {
    en: {
      title: 'ArogyaMitra',
      subtitle: 'Smart Primary Healthcare Platform',
      loginTab: 'Mobile OTP Login',
      regTab: 'New Patient Registration',
      quickDemo: 'Quick Demo Access (1-Click Fill)',
      phoneLabel: 'Mobile Phone Number',
      nameLabel: 'Full Legal Name',
      ageLabel: 'Age',
      genderLabel: 'Gender',
      addrLabel: 'Residential Address / Village',
      bloodLabel: 'Blood Group',
      emgName: 'Emergency Contact Name',
      emgPhone: 'Emergency Phone Number',
      emgRel: 'Relation',
      allergiesLabel: 'Known Drug / Food Allergies',
      chronicLabel: 'Existing Chronic Conditions',
      medsLabel: 'Current Daily Medications',
      sendOtpBtn: 'Send 6-Digit OTP 📲',
      verifyOtpBtn: 'Verify OTP & Log In 🩺',
      registerOtpBtn: 'Verify OTP & Create Digital Health ID ✨',
      otpTitle: 'Enter Verification Code',
      otpSubtitle: 'We have sent a 6-digit OTP code to',
      smsBanner: 'Simulated SMS Alert',
      smsCodeText: 'Your ArogyaMitra verification code is',
      autoFillBtn: 'Tap to Auto-fill Code',
      resendIn: 'Resend OTP in',
      resendNow: 'Resend OTP',
      editPhone: 'Change Mobile Number',
      disclaimer: 'Your medical health records are securely encrypted and comply with Digital Health Mission standards.',
    },
    hi: {
      title: 'आरोग्यमित्र',
      subtitle: 'स्मार्ट प्राथमिक स्वास्थ्य सेवा मंच',
      loginTab: 'मोबाइल ओटीपी लॉगिन',
      regTab: 'नया मरीज पंजीकरण',
      quickDemo: 'त्वरित डेमो मरीज (1-क्लिक चयन)',
      phoneLabel: 'मोबाइल नंबर',
      nameLabel: 'पूरा नाम',
      ageLabel: 'उम्र',
      genderLabel: 'लिंग',
      addrLabel: 'घर का पता / गांव',
      bloodLabel: 'रक्त समूह',
      emgName: 'आपातकालीन संपर्क नाम',
      emgPhone: 'आपातकालीन फोन नंबर',
      emgRel: 'संबंध',
      allergiesLabel: 'दवा या भोजन से एलर्जी',
      chronicLabel: 'मौजूदा पुरानी बीमारियां',
      medsLabel: 'वर्तमान में ली जाने वाली दवाएं',
      sendOtpBtn: '6-अंकों का ओटीपी भेजें 📲',
      verifyOtpBtn: 'ओटीपी सत्यापित करें और आगे बढ़ें 🩺',
      registerOtpBtn: 'ओटीपी सत्यापित करें और पंजीकरण पूरा करें ✨',
      otpTitle: 'सत्यापन कोड दर्ज करें',
      otpSubtitle: 'हमने 6-अंकों का ओटीपी कोड इस नंबर पर भेजा है:',
      smsBanner: 'सिम्युलेटेड एसएमएस अलर्ट',
      smsCodeText: 'आपका आरोग्यमित्र सत्यापन कोड है:',
      autoFillBtn: 'कोड स्वतः भरने के लिए टैप करें',
      resendIn: 'ओटीपी पुनः भेजें:',
      resendNow: 'ओटीपी पुनः भेजें',
      editPhone: 'मोबाइल नंबर बदलें',
      disclaimer: 'आपका स्वास्थ्य डेटा राष्ट्रीय डिजिटल स्वास्थ्य मानकों के अनुसार सुरक्षित है।',
    },
    kn: {
      title: 'ಆರೋಗ್ಯಮಿತ್ರ',
      subtitle: 'ಸ್ಮಾರ್ಟ್ ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಸೇವಾ ಒಡನಾಡಿ',
      loginTab: 'ಮೊಬೈಲ್ ಒಟಿಪಿ ಲಾಗಿನ್',
      regTab: 'ಹೊಸ ರೋಗಿ ನೋಂದಣಿ',
      quickDemo: 'ಡೆಮೊ ರೋಗಿ ಖಾತೆಗಳು (1-ಕ್ಲಿಕ್)',
      phoneLabel: 'ಮೊಬೈಲ್ ದೂರವಾಣಿ ಸಂಖ್ಯೆ',
      nameLabel: 'ಪೂರ್ಣ ಕಾನೂನುಬದ್ಧ ಹೆಸರು',
      ageLabel: 'ವಯಸ್ಸು',
      genderLabel: 'ಲಿಂಗ',
      addrLabel: 'ವಾಸಸ್ಥಳದ ವಿಳಾಸ / ಗ್ರಾಮ',
      bloodLabel: 'ರಕ್ತದ ಗುಂಪು',
      emgName: 'ತುರ್ತು ಸಂಪರ್ಕ ವ್ಯಕ್ತಿಯ ಹೆಸರು',
      emgPhone: 'ತುರ್ತು ಫೋನ್ ಸಂಖ್ಯೆ',
      emgRel: 'ಸಂಬಂಧ',
      allergiesLabel: 'ಔಷಧ ಅಥವಾ ಆಹಾರದ ಅಲರ್ಜಿಗಳು',
      chronicLabel: 'ಹಳೆಯ ದೀರ್ಘಕಾಲಿಕ ಕಾಯಿಲೆಗಳು',
      medsLabel: 'ಪ್ರಸ್ತುತ ತೆಗೆದುಕೊಳ್ಳುತ್ತಿರುವ ಔಷಧಿಗಳು',
      sendOtpBtn: '6-ಅಂಕಿಯ ಒಟಿಪಿ ಕಳುಹಿಸಿ 📲',
      verifyOtpBtn: 'ಒಟಿಪಿ ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಲಾಗಿನ್ ಮಾಡಿ 🩺',
      registerOtpBtn: 'ಒಟಿಪಿ ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಡಿಜಿಟಲ್ ಐಡಿ ರಚಿಸಿ ✨',
      otpTitle: 'ಪರಿಶೀಲನಾ ಕೋಡ್ ನಮೂದಿಸಿ',
      otpSubtitle: 'ನಾವು ಈ ಸಂಖ್ಯೆಗೆ 6-ಅಂಕಿಯ ಒಟಿಪಿ ಕೋಡ್ ಕಳುಹಿಸಿದ್ದೇವೆ:',
      smsBanner: 'ಎಸ್‌ಎಂಎಸ್ ಎಚ್ಚರಿಕೆ',
      smsCodeText: 'ನಿಮ್ಮ ಆರೋಗ್ಯಮಿತ್ರ ಪರಿಶೀಲನಾ ಕೋಡ್:',
      autoFillBtn: 'ಸ್ವಯಂ ಭರ್ತಿಗೆ ಸ್ಪರ್ಶಿಸಿ',
      resendIn: 'ಮತ್ತೆ ಒಟಿಪಿ ಕಳುಹಿಸಲು:',
      resendNow: 'ಮತ್ತೆ ಒಟಿಪಿ ಕಳುಹಿಸಿ',
      editPhone: 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಬದಲಾಯಿಸಿ',
      disclaimer: 'ನಿಮ್ಮ ಆರೋಗ್ಯ ದಾಖಲೆಗಳನ್ನು ಡಿಜಿಟಲ್ ಹೆಲ್ತ್ ಮಿಷನ್ ಮಾನದಂಡಗಳ ಪ್ರಕಾರ ಸುರಕ್ಷಿತವಾಗಿ ಎನ್‌ಕ್ರಿಪ್ಟ್ ಮಾಡಲಾಗಿದೆ.',
    },
  }[lang];

  // Quick select a demo patient
  const handleSelectDemo = (demo: (typeof DEMO_PATIENTS)[0]) => {
    setPhone(demo.phone);
    setFullName(demo.name);
    setError('');
  };

  // Step 1: Send OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.trim().length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const registrationData = isRegister
        ? {
            fullName,
            age: Number(age) || 25,
            gender,
            address,
            emergencyContactName: emergencyName,
            emergencyContactPhone: emergencyPhone,
            emergencyContactRelation: emergencyRelation,
            bloodGroup,
            allergies: allergies ? allergies.split(',').map((s) => s.trim()) : [],
            existingConditions: chronicConditions ? chronicConditions.split(',').map((s) => s.trim()) : [],
            currentMedications: medications ? medications.split(',').map((s) => s.trim()) : [],
          }
        : null;

      const res = await apiClient.post('/auth/send-otp', {
        phone: phone.trim(),
        isRegistration: isRegister,
        registrationData,
      });

      if (res.success) {
        setSimulatedOtp(res.otp || '482910');
        setAuthStep(2);
        setResendTimer(30);
        setCanResend(false);
        setEnteredOtp('');
        setSuccessMsg(res.message || `OTP sent to ${phone}`);
      } else {
        setError(res.message || 'Failed to send OTP. Please check the mobile number.');
      }
    } catch (err: any) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredOtp || enteredOtp.trim().length < 4) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const registrationData = isRegister
        ? {
            fullName,
            age: Number(age) || 25,
            gender,
            address,
            emergencyContactName: emergencyName,
            emergencyContactPhone: emergencyPhone,
            emergencyContactRelation: emergencyRelation,
            bloodGroup,
            allergies: allergies ? allergies.split(',').map((s) => s.trim()) : [],
            existingConditions: chronicConditions ? chronicConditions.split(',').map((s) => s.trim()) : [],
            currentMedications: medications ? medications.split(',').map((s) => s.trim()) : [],
          }
        : null;

      const res = await apiClient.post('/auth/verify-otp', {
        phone: phone.trim(),
        otp: enteredOtp.trim(),
        registrationData,
      });

      if (res.success && res.patient) {
        localStorage.setItem('phc_patient_token', res.token);
        localStorage.setItem('phc_patient_profile', JSON.stringify(res.patient));
        onSuccess(res.patient);
      } else {
        setError(res.message || 'Invalid verification code. Please try again.');
      }
    } catch (err: any) {
      setError('Verification failed. Please check network connection.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (!canResend) return;
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.post('/auth/send-otp', {
        phone: phone.trim(),
        isRegistration: isRegister,
      });
      if (res.success) {
        setSimulatedOtp(res.otp || '482910');
        setResendTimer(30);
        setCanResend(false);
        setSuccessMsg(`New OTP sent to ${phone}`);
      } else {
        setError(res.message || 'Failed to resend OTP.');
      }
    } catch (err) {
      setError('Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px 18px', maxWidth: '440px', margin: '0 auto' }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            background: 'linear-gradient(135deg, #1976d2, #00897b)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            margin: '0 auto 12px',
            boxShadow: '0 8px 20px rgba(25, 118, 210, 0.3)',
          }}
        >
          <HeartPulse size={30} />
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1976d2', letterSpacing: '-0.5px' }}>
          {t.title}
        </h2>
        <p style={{ fontSize: '12px', fontWeight: 600, color: '#00897b', marginTop: '2px' }}>
          {t.subtitle}
        </p>
      </div>

      {/* Mode Switch Tabs (Only in Step 1) */}
      {authStep === 1 && (
        <div
          style={{
            display: 'flex',
            background: '#e2e8f0',
            borderRadius: '14px',
            padding: '4px',
            marginBottom: '16px',
          }}
        >
          <button
            onClick={() => {
              setIsRegister(false);
              setError('');
            }}
            style={{
              flex: 1,
              padding: '9px',
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
            onClick={() => {
              setIsRegister(true);
              setError('');
            }}
            style={{
              flex: 1,
              padding: '9px',
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
      )}

      {/* Quick Demo Patients Pills (In Login Mode, Step 1) */}
      {authStep === 1 && !isRegister && (
        <div style={{ marginBottom: '18px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#64748b',
              display: 'block',
              marginBottom: '6px',
            }}
          >
            {t.quickDemo}
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {DEMO_PATIENTS.map((demo) => {
              const isSelected = phone.includes(demo.phone.slice(-10));
              return (
                <button
                  key={demo.id}
                  type="button"
                  onClick={() => handleSelectDemo(demo)}
                  style={{
                    background: isSelected ? '#eff6ff' : '#f8fafc',
                    border: `1px solid ${isSelected ? '#3b82f6' : '#e2e8f0'}`,
                    borderRadius: '10px',
                    padding: '8px 10px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <strong style={{ fontSize: '12px', color: isSelected ? '#1976d2' : '#1e293b', display: 'block' }}>
                    {demo.name}
                  </strong>
                  <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>
                    {demo.phone}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Error Message Box */}
      {error && (
        <div
          style={{
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
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* ================= STEP 1: PHONE & REGISTRATION FORM ================= */}
      {authStep === 1 && (
        <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              {t.phoneLabel}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="tel"
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
              <Phone
                size={16}
                color="#64748b"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
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
                  placeholder="e.g. Ramesh Chandra"
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    {t.ageLabel}
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    required
                    min="1"
                    max="120"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    {t.genderLabel}
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '10px 10px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      background: 'white',
                      outline: 'none',
                    }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    {t.bloodLabel}
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 10px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      background: 'white',
                      outline: 'none',
                    }}
                  >
                    <option value="O+ve">O+ve</option>
                    <option value="O-ve">O-ve</option>
                    <option value="A+ve">A+ve</option>
                    <option value="A-ve">A-ve</option>
                    <option value="B+ve">B+ve</option>
                    <option value="B-ve">B-ve</option>
                    <option value="AB+ve">AB+ve</option>
                    <option value="AB-ve">AB-ve</option>
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
                  placeholder="Street / Sector, Village, District"
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

              {/* Emergency Contact */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '14px',
                }}
              >
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
                      type="tel"
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
                  {t.allergiesLabel}
                </label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="e.g. Penicillin, Sulfa, Dust (or None)"
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
                  placeholder="e.g. Diabetes, Hypertension, Asthma (or None)"
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
              background: 'linear-gradient(135deg, #1976d2, #0d47a1)',
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
            {loading ? (
              'Sending OTP Code...'
            ) : (
              <>
                {t.sendOtpBtn} <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      )}

      {/* ================= STEP 2: INTERACTIVE OTP VERIFICATION SCREEN ================= */}
      {authStep === 2 && (
        <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Back / Edit Phone button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => {
                setAuthStep(1);
                setError('');
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#1976d2',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: 0,
              }}
            >
              <Edit3 size={14} /> {t.editPhone}
            </button>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Step 2 of 2</span>
          </div>

          {/* OTP Instruction Card */}
          <div
            style={{
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '14px',
              padding: '16px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: '#e0f2fe',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px',
              }}
            >
              <KeyRound size={22} />
            </div>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0369a1' }}>
              {t.otpTitle}
            </h3>
            <p style={{ fontSize: '12px', color: '#0c4a6e', marginTop: '2px' }}>
              {t.otpSubtitle} <strong style={{ color: '#0284c7' }}>{phone}</strong>
            </p>
          </div>

          {/* Simulated SMS Alert Card (For seamless testing & demonstration) */}
          {simulatedOtp && (
            <div
              style={{
                background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                border: '1px dashed #86efac',
                borderRadius: '14px',
                padding: '14px',
                boxShadow: '0 2px 8px rgba(34, 197, 94, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#166534', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  💬 {t.smsBanner}
                </span>
                <span style={{ fontSize: '10px', background: '#bbf7d0', color: '#14532d', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                  Just Now
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#14532d', margin: '4px 0 8px' }}>
                {t.smsCodeText} <strong style={{ fontSize: '16px', letterSpacing: '2px', color: '#15803d', fontFamily: 'monospace' }}>{simulatedOtp}</strong>
              </p>
              <button
                type="button"
                onClick={() => setEnteredOtp(simulatedOtp)}
                style={{
                  background: '#15803d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                {t.autoFillBtn}
              </button>
            </div>
          )}

          {/* 6-Digit OTP Entry Field */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '8px', textAlign: 'center' }}>
              Enter 6-Digit OTP
            </label>
            <input
              type="text"
              maxLength={6}
              value={enteredOtp}
              onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
              autoFocus
              required
              placeholder="• • • • • •"
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '14px',
                border: '2px solid #3b82f6',
                fontSize: '24px',
                fontWeight: 800,
                textAlign: 'center',
                letterSpacing: '12px',
                fontFamily: 'monospace',
                color: '#1e293b',
                background: '#ffffff',
                outline: 'none',
                boxShadow: '0 2px 10px rgba(59, 130, 246, 0.15)',
              }}
            />
          </div>

          {/* Countdown & Resend Section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
            <span style={{ color: '#64748b' }}>
              {!canResend ? (
                <span>
                  {t.resendIn} <strong style={{ color: '#1976d2' }}>{resendTimer}s</strong>
                </span>
              ) : (
                <span style={{ color: '#10b981', fontWeight: 700 }}>OTP expired or not received?</span>
              )}
            </span>
            <button
              type="button"
              disabled={!canResend || loading}
              onClick={handleResendOtp}
              style={{
                background: 'transparent',
                border: 'none',
                color: canResend ? '#1976d2' : '#94a3b8',
                fontWeight: 700,
                cursor: canResend ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <RotateCcw size={13} /> {t.resendNow}
            </button>
          </div>

          {/* Action Submit Button */}
          <button
            type="submit"
            disabled={loading || enteredOtp.length < 4}
            style={{
              background: 'linear-gradient(135deg, #16a34a, #0d9488)',
              color: 'white',
              border: 'none',
              padding: '14px',
              borderRadius: '14px',
              fontSize: '14px',
              fontWeight: 800,
              cursor: enteredOtp.length >= 4 ? 'pointer' : 'not-allowed',
              boxShadow: '0 4px 14px rgba(22, 163, 74, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: enteredOtp.length >= 4 ? 1 : 0.7,
            }}
          >
            {loading ? (
              'Verifying Code...'
            ) : (
              <>
                <CheckCircle2 size={18} />
                {isRegister ? t.registerOtpBtn : t.verifyOtpBtn}
              </>
            )}
          </button>
        </form>
      )}

      {/* Public Health Awareness Portal Quick Link */}
      {onBrowsePublicAwareness && (
        <div
          onClick={onBrowsePublicAwareness}
          style={{
            marginTop: '20px',
            background: 'linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%)',
            border: '1px solid #99f6e4',
            borderRadius: '14px',
            padding: '12px 16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(13, 148, 136, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>📢</span>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f766e' }}>
                {lang === 'hi' ? 'सार्वजनिक स्वास्थ्य जागरूकता पोर्टल' : 'Public Health Awareness Portal'}
              </div>
              <div style={{ fontSize: '11px', color: '#0369a1', marginTop: '1px' }}>
                {lang === 'hi'
                  ? 'टीकाकरण अभियान, डेंगू रोकथाम व स्वास्थ्य गाइड देखें'
                  : 'Vaccination drives, disease alerts & health posters'}
              </div>
            </div>
          </div>
          <ArrowRight size={16} color="#0f766e" />
        </div>
      )}

      {/* Security Disclaimer */}
      <p style={{ fontSize: '10px', color: '#64748b', textAlign: 'center', lineHeight: '1.4', marginTop: '16px' }}>
        {t.disclaimer}
      </p>
    </div>
  );
};
