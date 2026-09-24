import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Phone,
  Navigation,
  Clock,
  Stethoscope,
  Pill,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { PHC, DoctorProfile, AppLanguage, resolveTranslationObject } from '@phc-connect/types';
import { apiClient } from '../services/api';

interface Props {
  onNavigate: (tab: string, extra?: any) => void;
  lang: AppLanguage;
}

export const PHCMapScreen: React.FC<Props> = ({ onNavigate, lang }) => {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPHC, setSelectedPHC] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const t = resolveTranslationObject(lang, {
    en: {
      title: 'Nearby Health Centres (PHCs)',
      subtitle: 'Distance, available doctors & medicine availability from your location',
      search: 'Search by PHC name or area...',
      all: 'All Nearby',
      withDocs: 'Doctors Available',
      emergency: '24x7 Emergency',
      kmAway: 'km away',
      availDocs: 'Doctors On Duty',
      bookApt: 'Book Appointment',
      directions: 'Get Directions',
    },
    hi: {
      title: 'नजदीकी प्राथमिक स्वास्थ्य केंद्र (PHCs)',
      subtitle: 'दूरी, उपलब्ध डॉक्टर और दवाओं का स्टॉक देखें',
      search: 'पीएचसी नाम या क्षेत्र खोजें...',
      all: 'सभी नजदीकी',
      withDocs: 'डॉक्टर उपलब्ध हैं',
      emergency: '24x7 आपातकालीन',
      kmAway: 'किमी दूर',
      availDocs: 'ड्यूटी पर डॉक्टर',
      bookApt: 'अपॉइंटमेंट लें',
      directions: 'रास्ता देखें',
    },
    kn: {
      title: 'ಹತ್ತಿರದ ಆರೋಗ್ಯ ಕೇಂದ್ರಗಳು (PHCs)',
      subtitle: 'ನಿಮ್ಮ ಸ್ಥಳದಿಂದ ದೂರ, ಲಭ್ಯವಿರುವ ವೈದ್ಯರು ಮತ್ತು ಔಷಧ ಲಭ್ಯತೆ',
      search: 'ಪಿಹೆಚ್‌ಸಿ ಹೆಸರು ಅಥವಾ ಪ್ರದೇಶ ಹುಡುಕಿ...',
      all: 'ಎಲ್ಲಾ ಕೇಂದ್ರಗಳು',
      withDocs: 'ವೈದ್ಯರು ಲಭ್ಯವಿದ್ದಾರೆ',
      emergency: '24x7 ತುರ್ತು ಸೇವೆ',
      kmAway: 'ಕಿ.ಮೀ ದೂರದಲ್ಲಿದೆ',
      availDocs: 'ಡ್ಯೂಟಿಯಲ್ಲಿರುವ ವೈದ್ಯರು',
      bookApt: 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬುಕ್ ಮಾಡಿ',
      directions: 'ಮಾರ್ಗ ಪಡೆಯಿರಿ',
    },
  });

  useEffect(() => {
    loadNearbyPHCs();
  }, []);

  const loadNearbyPHCs = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/phcs/nearby', { lat: 28.6139, lon: 77.209 });
      if (res.success && res.recommendations) {
        setRecommendations(res.recommendations);
        if (res.recommendations.length > 0) {
          setSelectedPHC(res.recommendations[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = recommendations.filter((item) => {
    const phc: PHC = item.phc;
    const matchesSearch =
      phc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phc.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phc.address.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'emergency') return phc.emergencyServices;
    if (filterType === 'availableDocs') return item.availableDoctorsCount > 0;
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

      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            placeholder="Search by PHC name or area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
        <button
          onClick={() => setFilterType('all')}
          style={{
            background: filterType === 'all' ? '#1976d2' : '#f1f5f9',
            color: filterType === 'all' ? '#ffffff' : '#475569',
            border: 'none',
            borderRadius: '9999px',
            padding: '6px 12px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          All Nearby ({recommendations.length})
        </button>
        <button
          onClick={() => setFilterType('availableDocs')}
          style={{
            background: filterType === 'availableDocs' ? '#00897b' : '#f1f5f9',
            color: filterType === 'availableDocs' ? '#ffffff' : '#475569',
            border: 'none',
            borderRadius: '9999px',
            padding: '6px 12px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Doctors On Duty
        </button>
        <button
          onClick={() => setFilterType('emergency')}
          style={{
            background: filterType === 'emergency' ? '#d32f2f' : '#f1f5f9',
            color: filterType === 'emergency' ? '#ffffff' : '#475569',
            border: 'none',
            borderRadius: '9999px',
            padding: '6px 12px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          24/7 Emergency
        </button>
      </div>

      {/* Interactive Map Visual Mockup */}
      <div style={{
        height: '160px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, #cbd5e1, #94a3b8)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.25,
          backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }} />

        {/* Mock Map Pins */}
        {recommendations.slice(0, 4).map((item, idx) => (
          <div
            key={idx}
            onClick={() => setSelectedPHC(item)}
            style={{
              position: 'absolute',
              top: `${30 + (idx % 2) * 50}px`,
              left: `${30 + idx * 80}px`,
              background: selectedPHC?.phc.id === item.phc.id ? '#1976d2' : '#ffffff',
              color: selectedPHC?.phc.id === item.phc.id ? '#ffffff' : '#1e293b',
              padding: '6px 10px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 800,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transform: selectedPHC?.phc.id === item.phc.id ? 'scale(1.1)' : 'scale(1)',
              transition: 'all 0.2s ease',
            }}
          >
            <MapPin size={14} color={selectedPHC?.phc.id === item.phc.id ? '#ffffff' : '#1976d2'} />
            {item.distanceKm} km
          </div>
        ))}
      </div>

      {/* PHC Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.map((item) => {
          const phc: PHC = item.phc;
          const isSelected = selectedPHC?.phc.id === phc.id;

          return (
            <div
              key={phc.id}
              className="card"
              style={{
                border: isSelected ? '2px solid #1976d2' : '1px solid #e2e8f0',
                background: isSelected ? '#ffffff' : '#ffffff',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{
                      background: '#e3f2fd',
                      color: '#1976d2',
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '4px',
                    }}>
                      {phc.type}
                    </span>
                    {phc.emergencyServices && (
                      <span style={{
                        background: '#fee2e2',
                        color: '#dc2626',
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}>
                        24x7 Emergency
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b' }}>
                    {phc.name}
                  </h3>
                  <p style={{ fontSize: '12px', color: '#64748b' }}>
                    {phc.address}
                  </p>
                </div>

                <div style={{
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  color: '#0284c7',
                  borderRadius: '10px',
                  padding: '6px 10px',
                  textAlign: 'center',
                }}>
                  <strong style={{ fontSize: '14px', fontWeight: 800, display: 'block' }}>
                    {item.distanceKm} km
                  </strong>
                  <span style={{ fontSize: '9px', fontWeight: 600 }}>away</span>
                </div>
              </div>

              {/* Status Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '10px 0' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: item.availableDoctorsCount > 0 ? '#00796b' : '#64748b',
                  background: item.availableDoctorsCount > 0 ? '#e0f2f1' : '#f1f5f9',
                  padding: '4px 8px',
                  borderRadius: '6px',
                }}>
                  <Stethoscope size={13} />
                  {item.availableDoctorsCount} Doctor(s) Available
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#2e7d32',
                  background: '#e8f5e9',
                  padding: '4px 8px',
                  borderRadius: '6px',
                }}>
                  <Pill size={13} />
                  Medicines In Stock
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  color: '#475569',
                  background: '#f8fafc',
                  padding: '4px 8px',
                  borderRadius: '6px',
                }}>
                  <Clock size={13} />
                  Est. Wait: {item.estimatedWaitMinutes} mins
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '10px' }}>
                <a
                  href={`tel:${phc.phone}`}
                  style={{
                    background: '#f8fafc',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    padding: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <Phone size={13} /> Call
                </a>

                <a
                  href={`https://maps.google.com/?q=${phc.latitude},${phc.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: '#f8fafc',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    padding: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <Navigation size={13} /> Map
                </a>

                <button
                  onClick={() => onNavigate('book', { phcId: phc.id, phcName: phc.name })}
                  style={{
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
                    gap: '4px',
                  }}
                >
                  <Calendar size={13} /> Book
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
