import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, CheckCircle2, XCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { Appointment, AppointmentStatus, AppLanguage, resolveTranslationObject } from '@phc-connect/types';
import { apiClient } from '../services/api';

interface Props {
  onNavigate: (tab: string, extra?: any) => void;
  lang: AppLanguage;
}

export const MyAppointmentsScreen: React.FC<Props> = ({ onNavigate, lang }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
  const [loading, setLoading] = useState(true);

  const t = resolveTranslationObject(lang, {
    en: {
      title: 'My Appointments',
      subtitle: 'Track consultation status, token numbers & live queues',
      upcoming: 'Upcoming',
      completed: 'Completed',
      cancelled: 'Cancelled',
      noApt: 'No appointments found in this section.',
      bookNew: 'Book New Appointment',
      checkInBtn: 'Check In at PHC',
      cancelBtn: 'Cancel',
      token: 'Token #',
    },
    hi: {
      title: 'मेरी अपॉइंटमेंट्स',
      subtitle: 'परामर्श स्थिति, टोकन नंबर और लाइव कतार देखें',
      upcoming: 'आगामी',
      completed: 'पूर्ण',
      cancelled: 'रद्द',
      noApt: 'इस श्रेणी में कोई अपॉइंटमेंट नहीं मिली।',
      bookNew: 'नई अपॉइंटमेंट बुक करें',
      checkInBtn: 'पीएचसी में चेक-इन करें',
      cancelBtn: 'रद्द करें',
      token: 'टोकन #',
    },
    kn: {
      title: 'ನನ್ನ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳು',
      subtitle: 'ಸಮಾಲೋಚನೆ ಸ್ಥಿತಿ, ಟೋಕನ್ ಸಂಖ್ಯೆಗಳು ಮತ್ತು ಲೈವ್ ಸರತಿ ಸಾಲು',
      upcoming: 'ಮುಂಬರುವ',
      completed: 'ಪೂರ್ಣಗೊಂಡಿದೆ',
      cancelled: 'ರದ್ದಾಗಿದೆ',
      noApt: 'ಈ ವಿಭಾಗದಲ್ಲಿ ಯಾವುದೇ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳಿಲ್ಲ.',
      bookNew: 'ಹೊಸ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬುಕ್ ಮಾಡಿ',
      checkInBtn: 'ಪಿಹೆಚ್‌ಸಿಯಲ್ಲಿ ಚೆಕ್-ಇನ್ ಮಾಡಿ',
      cancelBtn: 'ರದ್ದುಮಾಡಿ',
      token: 'ಟೋಕನ್ #',
    },
  });

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/appointments');
      if (res.success && res.appointments) {
        setAppointments(res.appointments);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (aptId: string) => {
    try {
      const res = await apiClient.patch(`/appointments/${aptId}`, { status: 'Checked In' });
      if (res.success) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === aptId ? { ...a, status: 'Checked In' } : a))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = async (aptId: string) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      const res = await apiClient.delete(`/appointments/${aptId}`);
      if (res.success) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === aptId ? { ...a, status: 'Cancelled' } : a))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const upcomingList = appointments.filter(
    (a) => a.status === 'Pending' || a.status === 'Confirmed' || a.status === 'Checked In' || a.status === 'In Consultation'
  );
  const completedList = appointments.filter((a) => a.status === 'Completed');
  const cancelledList = appointments.filter((a) => a.status === 'Cancelled');

  const currentList =
    activeTab === 'upcoming' ? upcomingList : activeTab === 'completed' ? completedList : cancelledList;

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'In Consultation':
        return <span className="badge badge-emergency">● In Consultation</span>;
      case 'Checked In':
        return <span className="badge badge-medium">● Checked In (Waiting)</span>;
      case 'Confirmed':
        return <span className="badge badge-low">● Confirmed</span>;
      case 'Completed':
        return <span className="badge badge-low">✓ Completed</span>;
      case 'Cancelled':
        return <span className="badge" style={{ background: '#f1f5f9', color: '#64748b' }}>Cancelled</span>;
      default:
        return <span className="badge badge-low">{status}</span>;
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

      {/* Tabs */}
      <div style={{
        display: 'flex',
        background: '#e2e8f0',
        borderRadius: '12px',
        padding: '4px',
      }}>
        <button
          onClick={() => setActiveTab('upcoming')}
          style={{
            flex: 1,
            padding: '8px',
            border: 'none',
            borderRadius: '10px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'upcoming' ? '#ffffff' : 'transparent',
            color: activeTab === 'upcoming' ? '#1976d2' : '#64748b',
          }}
        >
          {t.upcoming} ({upcomingList.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          style={{
            flex: 1,
            padding: '8px',
            border: 'none',
            borderRadius: '10px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'completed' ? '#ffffff' : 'transparent',
            color: activeTab === 'completed' ? '#1976d2' : '#64748b',
          }}
        >
          {t.completed} ({completedList.length})
        </button>
        <button
          onClick={() => setActiveTab('cancelled')}
          style={{
            flex: 1,
            padding: '8px',
            border: 'none',
            borderRadius: '10px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'cancelled' ? '#ffffff' : 'transparent',
            color: activeTab === 'cancelled' ? '#1976d2' : '#64748b',
          }}
        >
          {t.cancelled} ({cancelledList.length})
        </button>
      </div>

      {/* Appointment Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {currentList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
            <Calendar size={40} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
            <p style={{ fontSize: '13px', fontWeight: 600 }}>No appointments found in this tab.</p>
            {activeTab === 'upcoming' && (
              <button
                onClick={() => onNavigate('book')}
                style={{
                  marginTop: '12px',
                  background: '#1976d2',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Book An Appointment
              </button>
            )}
          </div>
        ) : (
          currentList.map((apt) => (
            <div key={apt.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#1976d2' }}>
                  {apt.appointmentNumber}
                </span>
                {getStatusBadge(apt.status)}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b' }}>
                    {apt.doctorName}
                  </h3>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#00897b' }}>
                    {apt.doctorSpecialization}
                  </p>
                  <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    {apt.phcName}
                  </p>
                </div>

                <div style={{
                  background: '#1976d2',
                  color: 'white',
                  borderRadius: '12px',
                  padding: '6px 10px',
                  textAlign: 'center',
                }}>
                  <span style={{ fontSize: '9px', display: 'block', opacity: 0.85 }}>Token</span>
                  <strong style={{ fontSize: '16px', fontWeight: 800 }}>#{apt.tokenNumber}</strong>
                </div>
              </div>

              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '10px',
                margin: '10px 0',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                color: '#475569',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={13} color="#1976d2" /> {apt.date}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={13} color="#1976d2" /> {apt.timeSlot}
                </span>
              </div>

              <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px' }}>
                <strong>Reason:</strong> {apt.reasonForVisit}
              </p>

              {/* Action buttons based on status */}
              {activeTab === 'upcoming' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  {apt.status === 'Confirmed' && (
                    <button
                      onClick={() => handleCheckIn(apt.id)}
                      style={{
                        flex: 1,
                        background: '#00897b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                      }}
                    >
                      <CheckCircle2 size={14} /> Self Check-In at PHC
                    </button>
                  )}

                  <button
                    onClick={() => handleCancel(apt.id)}
                    style={{
                      background: '#fff1f2',
                      color: '#dc2626',
                      border: '1px solid #fecdd3',
                      borderRadius: '10px',
                      padding: '8px 12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}

              {activeTab === 'completed' && (
                <button
                  onClick={() => onNavigate('records')}
                  style={{
                    width: '100%',
                    background: '#e8f5e9',
                    color: '#2e7d32',
                    border: '1px solid #c8e6c9',
                    borderRadius: '10px',
                    padding: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  View Doctor Prescription & Clinical Notes
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
