import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Camera,
  Image as ImageIcon,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  Info,
  MapPin,
  Stethoscope,
  ArrowLeft,
  RotateCcw,
} from 'lucide-react';
import { PatientProfile, SymptomAssessment, TriageRiskLevel } from '@phc-connect/types';
import { apiClient } from '../services/api';

interface Props {
  patient: PatientProfile | null;
  onNavigate: (tab: string, extra?: any) => void;
  onOpenEmergency: (reason?: string) => void;
  lang: 'en' | 'hi' | 'kn';
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  chips?: string[];
  photoUrl?: string;
  assessment?: SymptomAssessment;
  timestamp: string;
}

export const SymptomChatbotScreen: React.FC<Props> = ({
  patient,
  onNavigate,
  onOpenEmergency,
  lang,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [step, setStep] = useState<number>(0);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [duration, setDuration] = useState<string>('');
  const [severity, setSeverity] = useState<'Mild' | 'Moderate' | 'Severe' | 'Critical'>('Moderate');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const t = {
    en: {
      header: 'AI Symptom Assessment',
      subHeader: 'Conversational Clinical Triage Engine',
      intro: `Hello ${patient?.fullName?.split(' ')[0] || 'there'}! I am your AI Health Triage Assistant. Please select or type the main symptoms you are experiencing today.`,
      chipsSymptom: [
        'High Fever with Chills',
        'Persistent Dry Cough',
        'Chest Pain / Tightness',
        'Shortness of Breath / Wheezing',
        'Severe Joint & Bone Pain',
        'Burning Urination / Frequency',
        'Stomach Cramps & Vomiting',
        'Watery Diarrhea / Loose Stools',
        'Skin Rash & Itching',
        'Throbbing One-Sided Headache',
        'Excessive Thirst & Night Urination',
      ],
      qDuration: 'How long have you been experiencing these symptoms?',
      chipsDuration: ['Less than 24 hours', '1 - 3 days', '4 - 7 days', 'More than a week'],
      qSeverity: 'How severe would you describe the discomfort / pain?',
      chipsSeverity: ['Mild (Manageable at home)', 'Moderate (Affecting daily routine)', 'Severe (Intense discomfort)', 'Critical (Excruciating / Unbearable)'],
      qPhoto: 'Would you like to attach a photo of any visible symptoms (such as skin rash, swelling, wound, or throat)?',
      chipsPhoto: ['📸 Upload Rash Photo', '🩹 Upload Wound Photo', '⏭️ Skip Photo & Assess'],
      analyzing: 'Analyzing clinical patterns, cross-referencing contraindications, and evaluating triage acuity...',
      disclaimer: 'DISCLAIMER: This is an AI-assisted triage recommendation for guidance purposes only and NOT a doctor diagnosis.',
      emergencyBtn: 'Call Emergency 108 / 112',
      findPHCBtn: 'View Recommended PHCs',
      findDocBtn: 'Find Nearest Available Doctor',
      restart: 'Start New Assessment',
    },
    hi: {
      header: 'एआई लक्षण मूल्यांकन',
      subHeader: 'डिजिटल प्राथमिक स्वास्थ्य ट्राइएज',
      intro: `नमस्ते! मैं आपका एआई स्वास्थ्य सहायक हूँ। कृपया आज आपको हो रहे मुख्य लक्षणों का चयन करें या लिखें।`,
      chipsSymptom: [
        'कंपकंपी के साथ तेज बुखार',
        'लगातार सूखी खांसी',
        'सीने में दर्द या भारीपन',
        'सांस फूलना या घरघराहट',
        'जोड़ों और हड्डियों में तेज दर्द',
        'पेशाब में जलन / बार-बार पेशाब',
        'पेट दर्द और उल्टी',
        'पतले दस्त / दस्त',
        'त्वचा पर दाने और खुजली',
        'आधे सिर में तेज दर्द (माइग्रेन)',
        'अधिक प्यास और बार-बार पेशाब',
      ],
      qDuration: 'आप कितने समय से इन लक्षणों का अनुभव कर रहे हैं?',
      chipsDuration: ['24 घंटे से कम', '1 - 3 दिन', '4 - 7 दिन', 'एक सप्ताह से अधिक'],
      qSeverity: 'आपकी तकलीफ की गंभीरता कितनी है?',
      chipsSeverity: ['हल्की (घर पर सामान्य देखभाल)', 'मध्यम (दैनिक काम में रुकावट)', 'गंभीर (तेज दर्द)', 'अत्यधिक गंभीर (असहनीय)'],
      qPhoto: 'क्या आप किसी दिखाई देने वाले लक्षण (जैसे दाने, सूजन या घाव) की फोटो जोड़ना चाहते हैं?',
      chipsPhoto: ['📸 दाने की फोटो अपलोड करें', '🩹 घाव की फोटो अपलोड करें', '⏭️ फोटो छोड़ें और जांच करें'],
      analyzing: 'लक्षणों का विश्लेषण और जोखिम का मूल्यांकन किया जा रहा है...',
      disclaimer: 'अस्वीकरण: यह केवल मार्गदर्शन के लिए एआई आधारित आकलन है, यह डॉक्टर का अंतिम निदान नहीं है।',
      emergencyBtn: 'आपातकालीन 108 / 112 डायल करें',
      findPHCBtn: 'सुझाए गए नजदीकी पीएचसी देखें',
      findDocBtn: 'निकटतम उपलब्ध डॉक्टर खोजें',
      restart: 'नया मूल्यांकन शुरू करें',
    },
    kn: {
      header: 'ಎಐ ರೋಗಲಕ್ಷಣ ಮೌಲ್ಯಮಾಪನ',
      subHeader: 'ಸಂಭಾಷಣಾ ಕ್ಲಿನಿಕಲ್ ಟ್ರಯೇಜ್ ಎಂಜಿನ್',
      intro: `ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಎಐ ಆರೋಗ್ಯ ಟ್ರಯೇಜ್ ಸಹಾಯಕ. ದಯವಿಟ್ಟು ಇಂದು ನೀವು ಎದುರಿಸುತ್ತಿರುವ ಪ್ರಮುಖ ರೋಗಲಕ್ಷಣಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ.`,
      chipsSymptom: [
        'ಚಳಿಯೊಂದಿಗೆ ತೀವ್ರ ಜ್ವರ',
        'ನಿರಂತರ ಒಣ ಕೆಮ್ಮು',
        'ಎದೆ ನೋವು ಅಥವಾ ಬಿಗಿತ',
        'ಉಸಿರಾಟದ ತೊಂದರೆ / ಉಬ್ಬಸ',
        'ತೀವ್ರ ಕೀಲು ಮತ್ತು ಮೂಳೆ ನೋವು',
        'ಮೂತ್ರ ವಿಸರ್ಜನೆಯಲ್ಲಿ ಉರಿ',
        'ಹೊಟ್ಟೆ ನೋವು ಮತ್ತು ವಾಂತಿ',
        'ನೀರಿನಂತಹ ಅತಿಸಾರ',
        'ಚರ್ಮದ ದದ್ದು ಮತ್ತು ತುರಿಕೆ',
        'ಒಂದು ಬದಿಯ ತಲೆನೋವು (ಮೈಗ್ರೇನ್)',
        'ಹೆಚ್ಚಿನ ಬಾಯಾರಿಕೆ ಮತ್ತು ಪದೇ ಪದೇ ಮೂತ್ರ',
      ],
      qDuration: 'ನೀವು ಎಷ್ಟು ಸಮಯದಿಂದ ಈ ರೋಗಲಕ್ಷಣಗಳನ್ನು ಹೊಂದಿದ್ದೀರಿ?',
      chipsDuration: ['24 ಗಂಟೆಗಿಂತ ಕಡಿಮೆ', '1 - 3 ದಿನಗಳು', '4 - 7 ದಿನಗಳು', 'ಒಂದು ವಾರಕ್ಕಿಂತ ಹೆಚ್ಚು'],
      qSeverity: 'ನೋವು ಅಥವಾ ತೊಂದರೆಯ ತೀವ್ರತೆ ಎಷ್ಟಿದೆ?',
      chipsSeverity: ['ಸೌಮ್ಯ (ಮನೆಯಲ್ಲಿ ನಿರ್ವಹಿಸಬಹುದು)', 'ಮಧ್ಯಮ (ದೈನಂದಿನ ಕೆಲಸಕ್ಕೆ ಅಡ್ಡಿ)', 'ತೀವ್ರ (ಹೆಚ್ಚಿನ ಅಸ್ವಸ್ಥತೆ)', 'ಅತ್ಯಂತ ಗಂಭೀರ (ತಡೆಯಲಾಗದ ನೋವು)'],
      qPhoto: 'ಕಾಣುವ ಯಾವುದೇ ಲಕ್ಷಣಗಳ (ದದ್ದು, ಊತ, ಗಾಯ) ಫೋಟೋವನ್ನು ಲಗತ್ತಿಸಲು ಬಯಸುವಿರಾ?',
      chipsPhoto: ['📸 ದದ್ದಿನ ಫೋಟೋ ಅಪ್‌ಲೋಡ್', '🩹 ಗಾಯದ ಫೋಟೋ ಅಪ್‌ಲೋಡ್', '⏭️ ಫೋಟೋ ಬಿಟ್ಟು ಮುಂದುವರಿಯಿರಿ'],
      analyzing: 'ರೋಗಲಕ್ಷಣಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ ಮತ್ತು ಅಪಾಯದ ಮಟ್ಟವನ್ನು ಲೆಕ್ಕಹಾಕಲಾಗುತ್ತಿದೆ...',
      disclaimer: 'ಗಮನಿಸಿ: ಇದು ಕೇವಲ ಮಾರ್ಗದರ್ಶನಕ್ಕಾಗಿ ಎಐ-ನೆರವಿನ ಟ್ರಯೇಜ್ ಸಲಹೆಯಾಗಿದೆ ಮತ್ತು ವೈದ್ಯರ ಅಂತಿಮ ರೋಗನಿರ್ಣಯವಲ್ಲ.',
      emergencyBtn: 'ತುರ್ತು 108 / 112 ಕರೆ ಮಾಡಿ',
      findPHCBtn: 'ಶಿಫಾರಸು ಮಾಡಿದ ಪಿಹೆಚ್‌ಸಿಗಳನ್ನು ನೋಡಿ',
      findDocBtn: 'ಹತ್ತಿರದ ಲಭ್ಯವಿರುವ ವೈದ್ಯರನ್ನು ಹುಡುಕಿ',
      restart: 'ಹೊಸ ಮೌಲ್ಯಮಾಪನ ಪ್ರಾರಂಭಿಸಿ',
    },
  }[lang];

  useEffect(() => {
    // Initial welcome message
    setMessages([
      {
        id: 'msg-0',
        sender: 'ai',
        text: t.intro,
        chips: t.chipsSymptom,
        timestamp: new Date().toISOString(),
      },
    ]);
  }, [lang]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendText = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    handleNextDialogueStep(text);
  };

  const handleChipClick = (chip: string) => {
    handleSendText(chip);
  };

  const handleNextDialogueStep = async (userAnswer: string) => {
    if (step === 0) {
      // Symptoms entered
      const sym = [...selectedSymptoms, userAnswer];
      setSelectedSymptoms(sym);
      setStep(1);

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: t.qDuration,
            chips: t.chipsDuration,
            timestamp: new Date().toISOString(),
          },
        ]);
      }, 500);
    } else if (step === 1) {
      // Duration entered
      setDuration(userAnswer);
      setStep(2);

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: t.qSeverity,
            chips: t.chipsSeverity,
            timestamp: new Date().toISOString(),
          },
        ]);
      }, 500);
    } else if (step === 2) {
      // Severity entered
      let sev: 'Mild' | 'Moderate' | 'Severe' | 'Critical' = 'Moderate';
      if (userAnswer.includes('Mild') || userAnswer.includes('हल्की')) sev = 'Mild';
      else if (userAnswer.includes('Severe') || userAnswer.includes('गंभीर')) sev = 'Severe';
      else if (userAnswer.includes('Critical') || userAnswer.includes('अत्यधिक')) sev = 'Critical';
      setSeverity(sev);
      setStep(3);

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: t.qPhoto,
            chips: t.chipsPhoto,
            timestamp: new Date().toISOString(),
          },
        ]);
      }, 500);
    } else if (step === 3) {
      // Photo choice or skip
      let uploadedUrl: string | null = null;
      let photoDesc = '';

      if (userAnswer.includes('Rash') || userAnswer.includes('दाने')) {
        uploadedUrl = 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300';
        photoDesc = 'Erythematous macular rash on arm with itchy bumps';
      } else if (userAnswer.includes('Wound') || userAnswer.includes('घाव')) {
        uploadedUrl = 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=300';
        photoDesc = 'Superficial skin laceration with mild swelling';
      }

      setPhotoUrl(uploadedUrl);
      setStep(4);
      runFinalTriageAssessment(uploadedUrl, photoDesc);
    }
  };

  const runFinalTriageAssessment = async (photo: string | null, photoDesc: string) => {
    setLoading(true);

    try {
      const res = await apiClient.post('/symptoms/assessment', {
        patientId: patient?.id,
        symptoms: selectedSymptoms.length > 0 ? selectedSymptoms : ['General Outpatient Symptoms'],
        duration: duration || '2 days',
        severity: severity || 'Moderate',
        age: patient?.age || 28,
        existingConditions: patient?.existingConditions || [],
        allergies: patient?.allergies || [],
        currentMedications: patient?.currentMedications || [],
        uploadedPhotoUrl: photo,
        photoDescription: photoDesc,
      });

      if (res.success && res.assessment) {
        const assessment: SymptomAssessment = res.assessment;

        // If Emergency, trigger emergency modal automatically
        if (assessment.riskLevel === 'EMERGENCY') {
          onOpenEmergency(assessment.explanation);
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `ai-result-${Date.now()}`,
            sender: 'ai',
            text: `Assessment Complete. Here is your structured clinical triage breakdown:`,
            assessment,
            photoUrl: photo || undefined,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    setStep(0);
    setSelectedSymptoms([]);
    setDuration('');
    setSeverity('Moderate');
    setPhotoUrl(null);
    setMessages([
      {
        id: `msg-${Date.now()}`,
        sender: 'ai',
        text: t.intro,
        chips: t.chipsSymptom,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '8px',
        borderBottom: '1px solid #e2e8f0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => onNavigate('home')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
          >
            <ArrowLeft size={20} color="#1e293b" />
          </button>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1976d2' }}>{t.header}</h3>
            <span style={{ fontSize: '10px', color: '#64748b' }}>{t.subHeader}</span>
          </div>
        </div>

        <button
          onClick={handleRestart}
          style={{
            background: '#f1f5f9',
            border: 'none',
            borderRadius: '9999px',
            padding: '6px 10px',
            fontSize: '11px',
            fontWeight: 700,
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer',
          }}
        >
          <RotateCcw size={13} />
          {t.restart}
        </button>
      </div>

      {/* Messages List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', padding: '4px 0' }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              gap: '6px',
            }}
          >
            {/* Message Bubble */}
            <div
              style={{
                maxWidth: '88%',
                padding: '12px 16px',
                borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: msg.sender === 'user' ? 'linear-gradient(135deg, #1976d2, #1565c0)' : '#ffffff',
                color: msg.sender === 'user' ? '#ffffff' : '#1e293b',
                border: msg.sender === 'user' ? 'none' : '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                fontSize: '13px',
                lineHeight: '1.5',
              }}
            >
              {msg.text}
            </div>

            {/* Quick Reply Chips */}
            {msg.chips && step < 4 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px', maxWidth: '92%' }}>
                {msg.chips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleChipClick(chip)}
                    style={{
                      background: '#f0f7ff',
                      border: '1px solid #bfdbfe',
                      color: '#1976d2',
                      borderRadius: '9999px',
                      padding: '6px 12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* Structured Assessment Result Card */}
            {msg.assessment && (
              <div style={{
                width: '100%',
                background: '#ffffff',
                border: `2px solid ${
                  msg.assessment.riskLevel === 'EMERGENCY'
                    ? '#d32f2f'
                    : msg.assessment.riskLevel === 'HIGH'
                    ? '#ea580c'
                    : msg.assessment.riskLevel === 'MEDIUM'
                    ? '#f59e0b'
                    : '#10b981'
                }`,
                borderRadius: '18px',
                padding: '16px',
                marginTop: '8px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              }}>
                {/* Criticality Badge & Model Tag */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#0284c7', background: '#e0f2fe', padding: '2px 8px', borderRadius: '6px' }}>
                    {msg.assessment.aiModel || 'ICD-10 Clinical Triage'}
                  </span>
                  <span className={`badge badge-${msg.assessment.riskLevel.toLowerCase()}`}>
                    {msg.assessment.riskLevel === 'EMERGENCY' ? '🚨 EMERGENCY' : `${msg.assessment.riskLevel} CRITICALITY`}
                  </span>
                </div>

                {/* Emergency Red-Flags Banner if Triggered */}
                {msg.assessment.emergencyRedFlags && msg.assessment.emergencyRedFlags.length > 0 && (
                  <div
                    style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '12px',
                      padding: '12px',
                      marginBottom: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626', fontWeight: 800, fontSize: '12px' }}>
                      <AlertOctagon size={16} /> Red-Flag Symptoms Detected
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                      {msg.assessment.emergencyRedFlags.map((rf, idx) => (
                        <span key={idx} style={{ fontSize: '10px', fontWeight: 700, background: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: '4px' }}>
                          ⚠️ {rf}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendation Box */}
                <div style={{
                  background: msg.assessment.riskLevel === 'EMERGENCY' ? '#ffebee' : '#f0fdf4',
                  border: `1px solid ${msg.assessment.riskLevel === 'EMERGENCY' ? '#ffcdd2' : '#bbf7d0'}`,
                  borderRadius: '12px',
                  padding: '12px',
                  marginBottom: '14px',
                }}>
                  <strong style={{ display: 'block', fontSize: '12px', color: '#1e293b', marginBottom: '4px' }}>
                    Recommended Next Action:
                  </strong>
                  <p style={{ fontSize: '12px', color: '#334155', lineHeight: '1.4' }}>
                    {msg.assessment.recommendedAction}
                  </p>
                </div>

                {/* Clinical Explanation */}
                <div style={{ marginBottom: '14px' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
                    Clinical Rationale & Reasoning:
                  </h4>
                  <p style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.4' }}>
                    {msg.assessment.explanation}
                  </p>
                </div>

                {/* High-Precision Differential Possibilities */}
                <div style={{ marginBottom: '14px' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                    Preliminary Possibilities Considered ({msg.assessment.possibleConditions.length}):
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {msg.assessment.possibleConditions.map((cond, idx) => {
                      const confidence = cond.confidenceScore || (cond.probability === 'High' ? 88 : cond.probability === 'Moderate' ? 65 : 40);
                      return (
                        <div
                          key={idx}
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '10px 12px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>{cond.name}</span>
                              {cond.icd10Code && (
                                <span style={{ fontSize: '9px', fontWeight: 700, background: '#dbeafe', color: '#1e40af', padding: '1px 5px', borderRadius: '4px' }}>
                                  ICD: {cond.icd10Code}
                                </span>
                              )}
                            </div>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              color: confidence >= 75 ? '#dc2626' : confidence >= 50 ? '#d97706' : '#64748b',
                              background: confidence >= 75 ? '#fef2f2' : confidence >= 50 ? '#fffbeb' : '#f1f5f9',
                              padding: '2px 8px',
                              borderRadius: '6px',
                            }}>
                              {confidence}% Match
                            </span>
                          </div>

                          {/* Confidence Bar */}
                          <div style={{ height: '4px', width: '100%', background: '#e2e8f0', borderRadius: '2px', margin: '6px 0', overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${confidence}%`,
                                background: confidence >= 75 ? 'linear-gradient(90deg, #f97316, #ef4444)' : 'linear-gradient(90deg, #3b82f6, #10b981)',
                                borderRadius: '2px',
                              }}
                            />
                          </div>

                          <p style={{ fontSize: '11px', color: '#475569', margin: '4px 0 0 0', lineHeight: '1.3' }}>
                            {cond.description}
                          </p>

                          {/* Contributing Symptoms */}
                          {cond.contributingSymptoms && cond.contributingSymptoms.length > 0 && (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                              <span style={{ fontSize: '9px', fontWeight: 700, color: '#64748b' }}>Key Indicators:</span>
                              {cond.contributingSymptoms.map((sym, i) => (
                                <span key={i} style={{ fontSize: '9px', background: '#ffffff', border: '1px solid #cbd5e1', padding: '1px 5px', borderRadius: '4px', color: '#334155' }}>
                                  ✓ {sym}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recommended Diagnostic Tests Box */}
                {msg.assessment.recommendedDiagnosticTests && msg.assessment.recommendedDiagnosticTests.length > 0 && (
                  <div
                    style={{
                      background: '#f0f9ff',
                      border: '1px solid #bae6fd',
                      borderRadius: '12px',
                      padding: '12px',
                      marginBottom: '12px',
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', marginBottom: '6px' }}>
                      🧪 Recommended Tests at PHC / Diagnostic Lab:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#0c4a6e', lineHeight: '1.4' }}>
                      {msg.assessment.recommendedDiagnosticTests.map((test, idx) => (
                        <li key={idx}><strong>{test}</strong></li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Supportive Home Care Tips */}
                {msg.assessment.supportiveCareMeasures && msg.assessment.supportiveCareMeasures.length > 0 && (
                  <div
                    style={{
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '12px',
                      padding: '12px',
                      marginBottom: '12px',
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#15803d', textTransform: 'uppercase', marginBottom: '6px' }}>
                      🏡 Supportive Home Care & First-Aid:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#14532d', lineHeight: '1.4' }}>
                      {msg.assessment.supportiveCareMeasures.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Uploaded Photo Notes Preview */}
                {msg.assessment.photoAnalysisNotes && (
                  <div style={{
                    background: '#fef3c7',
                    border: '1px solid #fde68a',
                    borderRadius: '10px',
                    padding: '10px',
                    marginBottom: '14px',
                    fontSize: '11px',
                    color: '#92400e',
                  }}>
                    {msg.assessment.photoAnalysisNotes}
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {msg.assessment.riskLevel === 'EMERGENCY' ? (
                    <button
                      onClick={() => onOpenEmergency(msg.assessment?.explanation)}
                      style={{
                        background: '#d32f2f',
                        color: 'white',
                        border: 'none',
                        padding: '12px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(211, 47, 47, 0.35)',
                      }}
                    >
                      <AlertOctagon size={16} />
                      {t.emergencyBtn}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => onNavigate('phcs', { riskLevel: msg.assessment?.riskLevel })}
                        style={{
                          background: '#1976d2',
                          color: 'white',
                          border: 'none',
                          padding: '12px',
                          borderRadius: '12px',
                          fontSize: '13px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        <MapPin size={16} />
                        {t.findPHCBtn}
                      </button>
                      <button
                        onClick={() => onNavigate('doctors')}
                        style={{
                          background: '#e0f2f1',
                          color: '#00796b',
                          border: 'none',
                          padding: '10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        <Stethoscope size={15} />
                        {t.findDocBtn}
                      </button>
                    </>
                  )}
                </div>

                {/* Disclaimer */}
                <p style={{
                  fontSize: '9px',
                  color: '#94a3b8',
                  marginTop: '12px',
                  textAlign: 'center',
                  lineHeight: '1.4',
                  fontStyle: 'italic',
                }}>
                  {msg.assessment.disclaimer}
                </p>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1976d2', fontSize: '12px', padding: '10px' }}>
            <Sparkles size={16} className="animate-spin" />
            <span>{t.analyzing}</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Bar */}
      <div style={{
        display: 'flex',
        gap: '8px',
        paddingTop: '8px',
        borderTop: '1px solid #e2e8f0',
        background: '#ffffff',
      }}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendText(inputText)}
          placeholder="Describe additional symptoms or queries..."
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '12px',
            border: '1px solid #cbd5e1',
            fontSize: '13px',
            outline: 'none',
          }}
        />
        <button
          onClick={() => handleSendText(inputText)}
          disabled={!inputText.trim()}
          style={{
            background: '#1976d2',
            color: 'white',
            border: 'none',
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: inputText.trim() ? 'pointer' : 'not-allowed',
            opacity: inputText.trim() ? 1 : 0.6,
          }}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};
