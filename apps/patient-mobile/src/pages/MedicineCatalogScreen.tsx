import React, { useState, useEffect } from 'react';
import { Pill, Search, CheckCircle2, XCircle, MapPin, Building2, Filter } from 'lucide-react';
import { apiClient } from '../services/api';

interface Props {
  onNavigate: (tab: string, extra?: any) => void;
  lang: 'en' | 'hi' | 'kn';
}

export const MedicineCatalogScreen: React.FC<Props> = ({ onNavigate, lang }) => {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const t = {
    en: {
      title: 'Medicine Availability Directory',
      subtitle: 'Check real-time medicine stock status across nearby PHC dispensaries',
      search: 'Search by medicine name (e.g. Paracetamol, Metformin)...',
      all: 'All Categories',
      inStock: 'In Stock',
      lowStock: 'Low Stock',
      outOfStock: 'Out of Stock',
      phcLocations: 'Available at PHCs',
    },
    hi: {
      title: 'दवा उपलब्धता निर्देशिका',
      subtitle: 'नजदीकी पीएचसी औषधालयों में दवाओं का लाइव स्टॉक देखें',
      search: 'दवा का नाम खोजें (जैसे पैरासिटामोल, मेटफॉर्मिन)...',
      all: 'सभी श्रेणियां',
      inStock: 'उपलब्ध',
      lowStock: 'सीमित स्टॉक',
      outOfStock: 'स्टॉक में नहीं',
      phcLocations: 'पीएचसी में उपलब्ध',
    },
    kn: {
      title: 'ಔಷಧ ಲಭ್ಯತೆ ಕೋಶ',
      subtitle: 'ಹತ್ತಿರದ ಪಿಹೆಚ್‌ಸಿ ಔಷಧಾಲಯಗಳಲ್ಲಿ ನೈಜ-ಸಮಯದ ಔಷಧ ದಾಸ್ತಾನು ಪರಿಶೀಲಿಸಿ',
      search: 'ಔಷಧದ ಹೆಸರು ಹುಡುಕಿ (ಉದಾ: ಪ್ಯಾರಾಸಿಟಮಾಲ್, ಮೆಟ್‌ಫಾರ್ಮಿನ್)...',
      all: 'ಎಲ್ಲಾ ವರ್ಗಗಳು',
      inStock: 'ದಾಸ್ತಾನಿನಲ್ಲಿದೆ',
      lowStock: 'ಕಡಿಮೆ ದಾಸ್ತಾನು',
      outOfStock: 'ದಾಸ್ತಾನು ಮುಗಿದಿದೆ',
      phcLocations: 'ಲಭ್ಯವಿರುವ ಪಿಹೆಚ್‌ಸಿಗಳು',
    },
  }[lang];

  useEffect(() => {
    loadMedicines();
  }, []);

  const loadMedicines = async () => {
    try {
      setLoading(true);
      const [medRes, catRes] = await Promise.all([
        apiClient.get('/medicines/availability'),
        apiClient.get('/medicines/categories'),
      ]);

      if (medRes.success && medRes.medicines) {
        setMedicines(medRes.medicines);
      }
      if (catRes.success && catRes.categories) {
        setCategories(['all', ...catRes.categories]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = medicines.filter((med) => {
    const matchesSearch =
      med.name.toLowerCase().includes(search.toLowerCase()) ||
      med.genericName.toLowerCase().includes(search.toLowerCase()) ||
      med.category.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedCategory !== 'all' && med.category !== selectedCategory) return false;
    return true;
  });

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

      {/* Search Bar */}
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

      {/* Categories Horizontal Scroll */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              background: selectedCategory === cat ? '#1976d2' : '#f1f5f9',
              color: selectedCategory === cat ? '#ffffff' : '#475569',
              border: 'none',
              borderRadius: '9999px',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {cat === 'all' ? 'All Medicines' : cat}
          </button>
        ))}
      </div>

      {/* Medicine Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.map((med) => (
          <div key={med.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
              <div>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: '#00796b',
                  background: '#e0f2f1',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  display: 'inline-block',
                  marginBottom: '4px',
                }}>
                  {med.category}
                </span>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>
                  {med.name}
                </h3>
                <p style={{ fontSize: '11px', color: '#64748b' }}>
                  Generic: {med.genericName} • {med.strength} ({med.form})
                </p>
              </div>

              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: med.overallStatus.includes('Available') ? '#2e7d32' : '#c62828',
                  background: med.overallStatus.includes('Available') ? '#e8f5e9' : '#ffebee',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  whiteSpace: 'nowrap',
                }}
              >
                {med.overallStatus}
              </span>
            </div>

            {/* PHC Breakdown */}
            <div style={{ marginTop: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Availability by PHC:
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '4px' }}>
                {med.phcAvailability.map((phcAv: any) => (
                  <div
                    key={phcAv.phcId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '11px',
                      background: '#f8fafc',
                      padding: '6px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    <span style={{ color: '#334155', fontWeight: 600 }}>{phcAv.phcName}</span>
                    <span style={{
                      fontWeight: 700,
                      color: phcAv.isAvailable ? '#16a34a' : '#dc2626',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}>
                      {phcAv.isAvailable ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {phcAv.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
