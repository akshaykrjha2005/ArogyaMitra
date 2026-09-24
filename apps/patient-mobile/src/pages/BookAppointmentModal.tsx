import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle2, Stethoscope, MapPin, ArrowLeft, Sparkles } from 'lucide-react';
import { PatientProfile, DoctorProfile, PHC, Appointment, AppLanguage, resolveTranslationObject } from '@phc-connect/types';
import { apiClient } from '../services/api';

interface Props {
  patient: PatientProfile | null;
  initialData?: {
    doctorId?: string;
    doctorName?: string;
    phcId?: string;
    phcName?: string;
  };
  onSuccess: (appointment: Appointment) => void;
  onCancel: () => void;
  lang: AppLanguage;
}

export const BookAppointmentModal: React.FC<Props> = ({
  patient,
  initialData,
  onSuccess,
  onCancel,
  lang,
}) => {
  const [phcs, setPhcs] = useState<PHC[]>([]);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [selectedPhcId, setSelectedPhcId] = useState<string>(initialData?.phcId || 'phc-001');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(initialData?.doctorId || 'doc-001');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState<string>('10:00 AM');
  const [reason, setReason] = useState<string>('General Clinical Consultation and Health Checkup');
  const [loading, setLoading] = useState(false);
  const [confirmedApt, setConfirmedApt] = useState<Appointment | null>(null);

  const t = resolveTranslationObject(lang, {
    en: {
      title: 'Schedule Doctor Appointment',
      subtitle: 'Instant OPD queue token generation',
      selectPHC: 'Select Primary Health Centre',
      selectDoc: 'Select Doctor / Specialist',
      selectDate: 'Select Date',
      selectTime: 'Available Time Slot',
      reasonLabel: 'Reason for Visit / Symptoms',
      confirmBtn: 'Confirm & Generate OPD Token',
      confirmedTitle: 'Appointment Confirmed!',
      confirmedSub: 'Your OPD consultation token has been generated.',
      tokenLabel: 'Your Queue Token Number',
    },
    hi: {
      title: 'डॉक्टर अपॉइंटमेंट बुक करें',
      subtitle: 'तुरंत ओपीडी टोकन नंबर प्राप्त करें',
      selectPHC: 'प्राथमिक स्वास्थ्य केंद्र चुनें',
      selectDoc: 'डॉक्टर / विशेषज्ञ चुनें',
      selectDate: 'तारीख चुनें',
      selectTime: 'उपलब्ध समय चुनें',
      reasonLabel: 'परामर्श का कारण / लक्षण',
      confirmBtn: 'पुष्टि करें और ओपीडी टोकन बनाएं',
      confirmedTitle: 'अपॉइंटमेंट की पुष्टि हो गई!',
      confirmedSub: 'आपका ओपीडी परामर्श टोकन बन गया है।',
      tokenLabel: 'आपका टोकन नंबर',
    },
    kn: {
      title: 'ವೈದ್ಯರ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬುಕ್ ಮಾಡಿ',
      subtitle: 'ತಕ್ಷಣದ ಒಪಿಡಿ (OPD) ಟೋಕನ್ ಪಡೆಯಿರಿ',
      selectPHC: 'ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಕೇಂದ್ರ ಆಯ್ಕೆಮಾಡಿ',
      selectDoc: 'ವೈದ್ಯರು / ತಜ್ಞರನ್ನು ಆಯ್ಕೆಮಾಡಿ',
      selectDate: 'ದಿನಾಂಕ ಆಯ್ಕೆಮಾಡಿ',
      selectTime: 'ಲಭ್ಯವಿರುವ ಸಮಯದ ಸ್ಲಾಟ್',
      reasonLabel: 'ಭೇಟಿಯ ಕಾರಣ / ಲಕ್ಷಣಗಳು',
      confirmBtn: 'ಖಚಿತಪಡಿಸಿ ಮತ್ತು ಒಪಿಡಿ ಟೋಕನ್ ರಚಿಸಿ',
      confirmedTitle: 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಖಚಿತವಾಗಿದೆ!',
      confirmedSub: 'ನಿಮ್ಮ ಒಪಿಡಿ ಸಮಾಲೋಚನೆ ಟೋಕನ್ ರಚಿಸಲಾಗಿದೆ.',
      tokenLabel: 'ನಿಮ್ಮ ಸರತಿ ಟೋಕನ್ ಸಂಖ್ಯೆ',
    },
  });

  const dates = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      full: d.toISOString().split('T')[0],
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      isToday: i === 0,
    };
  });

  const slots = [
    '09:00 AM',
    '09:30 AM',
    '10:00 AM',
    '10:30 AM',
    '11:00 AM',
    '11:30 AM',
    '12:00 PM',
    '02:00 PM',
    '02:30 PM',
    '03:00 PM',
  ];

  useEffect(() => {
    loadMetaData();
  }, []);

  const loadMetaData = async () => {
    try {
      const [phcRes, docRes] = await Promise.all([
        apiClient.get('/phcs'),
        apiClient.get('/doctors'),
      ]);
      if (phcRes.success) setPhcs(phcRes.phcs);
      if (docRes.success) setDoctors(docRes.doctors);
    } catch (err) {
      console.error(err);
    }
  };

  const availableDoctorsAtPhc = doctors.filter((d) => d.phcId === selectedPhcId);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await apiClient.post('/appointments', {
        patientId: patient?.id || 'pat-0001',
        doctorId: selectedDoctorId,
        phcId: selectedPhcId,
        date: selectedDate,
        timeSlot: selectedSlot,
        reasonForVisit: reason,
        symptoms: ['General Consultation'],
        criticalityLevel: 'LOW',
      });

      if (res.success && res.appointment) {
        setConfirmedApt(res.appointment);
        setTimeout(() => {
          onSuccess(res.appointment);
        }, 1800);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (confirmedApt) {
    return (
      <div style={{ textAlign: 'center', padding: '30px 16px' }}>
        <div style={{
          width: '72px',
          height: '72px',
          background: '#e8f5e9',
          color: '#2e7d32',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <CheckCircle2 size={42} />
        </div>

        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b', marginBottom: '6px' }}>
          Appointment Confirmed!
        </h2>
        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>
          Your OPD consultation token has been generated.
        </p>

        <div style={{
          background: 'linear-gradient(135deg, #1976d2, #1565c0)',
          color: 'white',
          borderRadius: '16px',
          padding: '18px',
          marginBottom: '20px',
        }}>
          <span style={{ fontSize: '11px', opacity: 0.9 }}>Your Queue Token Number</span>
          <h3 style={{ fontSize: '32px', fontWeight: 800, margin: '4px 0' }}>
            #{confirmedApt.tokenNumber}
          </h3>
          <p style={{ fontSize: '13px', fontWeight: 700 }}>
            {confirmedApt.doctorName}
          </p>
          <p style={{ fontSize: '11px', opacity: 0.85 }}>
            {confirmedApt.phcName} • {confirmedApt.date} at {confirmedApt.timeSlot}
          </p>
        </div>

        <p style={{ fontSize: '11px', color: '#475569' }}>
          Redirecting to your appointments summary...
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={20} color="#1e293b" />
        </button>
        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#1e293b' }}>
            Book PHC Appointment
          </h2>
          <p style={{ fontSize: '11px', color: '#64748b' }}>
            Instant digital slot & token allocation
          </p>
        </div>
      </div>

      <form onSubmit={handleBooking} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* PHC Selector */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
            Select Primary Health Centre
          </label>
          <select
            value={selectedPhcId}
            onChange={(e) => {
              setSelectedPhcId(e.target.value);
              const docs = doctors.filter((d) => d.phcId === e.target.value);
              if (docs.length > 0) setSelectedDoctorId(docs[0].id);
            }}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              background: 'white',
              outline: 'none',
            }}
          >
            {phcs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.type})
              </option>
            ))}
          </select>
        </div>

        {/* Doctor Selector */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
            Select Doctor / Specialist
          </label>
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              background: 'white',
              outline: 'none',
            }}
          >
            {availableDoctorsAtPhc.length > 0 ? (
              availableDoctorsAtPhc.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName} ({d.specialization}) - {d.status}
                </option>
              ))
            ) : (
              <option value="">No doctors listed for this centre</option>
            )}
          </select>
        </div>

        {/* Date Selector */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
            Select Appointment Date
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
            {dates.map((d) => {
              const isSelected = selectedDate === d.full;
              return (
                <button
                  type="button"
                  key={d.full}
                  onClick={() => setSelectedDate(d.full)}
                  style={{
                    padding: '8px 4px',
                    borderRadius: '12px',
                    border: `1px solid ${isSelected ? '#1976d2' : '#cbd5e1'}`,
                    background: isSelected ? '#e3f2fd' : '#ffffff',
                    color: isSelected ? '#1976d2' : '#334155',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                  }}
                >
                  <span style={{ fontSize: '10px', fontWeight: 600 }}>{d.isToday ? 'Today' : d.day}</span>
                  <strong style={{ fontSize: '15px', fontWeight: 800 }}>{d.date}</strong>
                  <span style={{ fontSize: '9px', opacity: 0.8 }}>{d.month}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Slot Selector */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
            Select Preferred Time Slot
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {slots.map((slot) => {
              const isSelected = selectedSlot === slot;
              return (
                <button
                  type="button"
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  style={{
                    padding: '8px',
                    borderRadius: '10px',
                    border: `1px solid ${isSelected ? '#1976d2' : '#e2e8f0'}`,
                    background: isSelected ? '#1976d2' : '#f8fafc',
                    color: isSelected ? '#ffffff' : '#334155',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </div>

        {/* Reason for Visit */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
            Chief Complaint / Reason for Visit
          </label>
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              fontSize: '12px',
              outline: 'none',
              resize: 'none',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            background: 'linear-gradient(135deg, #1976d2, #1565c0)',
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
            marginTop: '6px',
          }}
        >
          <Sparkles size={16} />
          {loading ? 'Booking Slot...' : 'Confirm Appointment Booking'}
        </button>
      </form>
    </div>
  );
};
