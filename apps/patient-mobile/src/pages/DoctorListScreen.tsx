import React, { useState, useEffect } from 'react';
import { Stethoscope, Clock, MapPin, Calendar, Search, Star, Award, CheckCircle2 } from 'lucide-react';
import { DoctorProfile, AppLanguage, resolveTranslationObject } from '@phc-connect/types';
import { apiClient } from '../services/api';

interface Props {
  onNavigate: (tab: string, extra?: any) => void;
  lang: AppLanguage;
}

export const DoctorListScreen: React.FC<Props> = ({ onNavigate, lang }) => {
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [search, setSearch] = useState('');
  const [specFilter, setSpecFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const t = resolveTranslationObject(lang, {
    en: {
      title: 'PHC Doctors & Specialists',
      subtitle: 'Check real-time duty status and schedule appointments',
      search: 'Search doctor or specialization...',
      all: 'All Doctors',
      bookBtn: 'Book Appointment',
      yrsExp: 'yrs exp',
    },
    hi: {
      title: 'पीएचसी डॉक्टर और विशेषज्ञ',
      subtitle: 'उपलब्ध डॉक्टरों की स्थिति देखें और अपॉइंटमेंट लें',
      search: 'डॉक्टर या विशेषज्ञता खोजें...',
      all: 'सभी डॉक्टर',
      bookBtn: 'अपॉइंटमेंट बुक करें',
      yrsExp: 'वर्ष अनुभव',
    },
    kn: {
      title: 'ಪಿಹೆಚ್‌ಸಿ ವೈದ್ಯರು ಮತ್ತು ತಜ್ಞರು',
      subtitle: 'ನೈಜ-ಸಮಯದ ಲಭ್ಯತೆ ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ನಿಗದಿಪಡಿಸಿ',
      search: 'ವೈದ್ಯರು ಅಥವಾ ತಜ್ಞತೆ ಹುಡುಕಿ...',
      all: 'ಎಲ್ಲಾ ವೈದ್ಯರು',
      bookBtn: 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬುಕ್ ಮಾಡಿ',
      yrsExp: 'ವರ್ಷಗಳ ಅನುಭವ',
    },
  });

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/doctors');
      if (res.success && res.doctors) {
        setDoctors(res.doctors);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const specializations = ['all', 'General Medicine', 'Pediatrics', 'Gynecology & Obstetrics', 'Dermatology & Skin', 'Emergency Medicine', 'Family Medicine'];

  const filtered = doctors.filter((doc) => {
    const matchesSearch =
      doc.fullName.toLowerCase().includes(search.toLowerCase()) ||
      doc.specialization.toLowerCase().includes(search.toLowerCase()) ||
      (doc.phcName && doc.phcName.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (specFilter !== 'all' && !doc.specialization.toLowerCase().includes(specFilter.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>
          {t.title}
        </h2>
        <p style={{ fontSize: '12px', color: '#64748b' }}>
          {t.subtitle}
        </p>
      </div>

      {/* Search Input */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder={t.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px 10px 36px',
            borderRadius: '12px',
            border: '1px solid #cbd5e1',
            fontSize: '13px',
            outline: 'none',
            background: '#ffffff',
          }}
        />
        <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
      </div>

      {/* Specialization Filter Pills */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
        {specializations.map((spec) => (
          <button
            key={spec}
            onClick={() => setSpecFilter(spec)}
            style={{
              background: specFilter === spec ? '#1976d2' : '#f1f5f9',
              color: specFilter === spec ? '#ffffff' : '#475569',
              border: 'none',
              borderRadius: '9999px',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {spec === 'all' ? t.all : spec}
          </button>
        ))}
      </div>

      {/* Doctor Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.map((doc) => {
          const isAvailable = doc.status === 'AVAILABLE';

          return (
            <div key={doc.id} className="card">
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #1976d2, #26a69a)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '18px',
                  flexShrink: 0,
                  boxShadow: '0 4px 10px rgba(25, 118, 210, 0.2)',
                }}>
                  {doc.fullName.replace('Dr. ', '').charAt(0)}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b' }}>
                        {doc.fullName}
                      </h3>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: '#1976d2' }}>
                        {doc.specialization}
                      </p>
                    </div>

                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        fontSize: '10px',
                        fontWeight: 800,
                        background: isAvailable ? '#e0f2f1' : doc.status === 'BUSY' ? '#fff3e0' : '#f1f5f9',
                        color: isAvailable ? '#00796b' : doc.status === 'BUSY' ? '#e65100' : '#64748b',
                        border: `1px solid ${isAvailable ? '#80cbc4' : '#fed7aa'}`,
                      }}
                    >
                      ● {doc.status}
                    </span>
                  </div>

                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: '#64748b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Award size={13} color="#64748b" />
                      <span>{doc.qualification} • {doc.yearsOfExperience} yrs exp</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} color="#64748b" />
                      <span>{doc.phcName || 'Primary Health Centre'} • {doc.roomNumber}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={13} color="#64748b" />
                      <span>{doc.workingHours}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate('book', { doctorId: doc.id, doctorName: doc.fullName, phcId: doc.phcId, phcName: doc.phcName })}
                    style={{
                      width: '100%',
                      background: '#1976d2',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '8px',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      marginTop: '12px',
                    }}
                  >
                    <Calendar size={14} /> Book Appointment with {doc.fullName.split(' ')[1]}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
