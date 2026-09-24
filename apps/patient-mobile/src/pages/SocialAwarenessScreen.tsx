import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Share2,
  Copy,
  Check,
  Play,
  FileText,
  Image as ImageIcon,
  Video,
  AlertTriangle,
  Volume2,
  VolumeX,
  ChevronRight,
  Search,
  X,
  Download,
  Calendar,
  Eye,
  Heart,
  ExternalLink,
  ShieldCheck,
  Clock,
  ArrowLeft,
  Filter,
  MessageCircle,
  HelpCircle,
  Tag,
  Radio,
} from 'lucide-react';
import {
  AwarenessItem,
  AwarenessContentType,
  AwarenessCategory,
  AppLanguage,
  resolveTranslationObject,
} from '@phc-connect/types';
import { apiClient } from '../services/api';

interface Props {
  onNavigate: (tab: string, extra?: any) => void;
  lang: AppLanguage;
  initialCategory?: string;
  initialType?: string;
}

const CATEGORY_CONFIG: Record<
  AwarenessCategory,
  { labelEn: string; labelHi: string; icon: string; color: string; bg: string }
> = {
  VACCINATION_DRIVE: {
    labelEn: 'Vaccination Drives',
    labelHi: 'टीकाकरण अभियान',
    icon: '💉',
    color: '#0284c7',
    bg: '#e0f2fe',
  },
  SEASONAL_DISEASE: {
    labelEn: 'Seasonal & Fevers',
    labelHi: 'मौसमी बीमारियां व बुखार',
    icon: '🦟',
    color: '#ea580c',
    bg: '#ffedd5',
  },
  HYGIENE_NUTRITION: {
    labelEn: 'Hygiene & Sanitation',
    labelHi: 'स्वच्छता व पोषण',
    icon: '🧼',
    color: '#059669',
    bg: '#d1fae5',
  },
  MATERNAL_CHILD_HEALTH: {
    labelEn: 'Maternal & Child Care',
    labelHi: 'मातृत्व एवं शिशु देखभाल',
    icon: '👶',
    color: '#db2777',
    bg: '#fce7f3',
  },
  CHRONIC_NCD: {
    labelEn: 'BP & Diabetes Care',
    labelHi: 'बीपी व शुगर नियंत्रण',
    icon: '❤️',
    color: '#7c3aed',
    bg: '#ede9fe',
  },
  EMERGENCY_SCHEMES: {
    labelEn: 'Govt Schemes & Ayushman',
    labelHi: 'सरकारी योजनाएं व आयुष्मान',
    icon: '🏥',
    color: '#2563eb',
    bg: '#dbeafe',
  },
};

export const SocialAwarenessScreen: React.FC<Props> = ({
  onNavigate,
  lang,
  initialCategory,
  initialType,
}) => {
  const [items, setItems] = useState<AwarenessItem[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<AwarenessItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeType, setActiveType] = useState<string>(initialType || 'ALL');
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory || 'ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active Modals State
  const [selectedArticle, setSelectedArticle] = useState<AwarenessItem | null>(null);
  const [selectedInfographic, setSelectedInfographic] = useState<AwarenessItem | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<AwarenessItem | null>(null);

  // Audio Narrator State
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadAwarenessData();
  }, [activeType, activeCategory]);

  const loadAwarenessData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (activeType !== 'ALL') params.type = activeType;
      if (activeCategory !== 'ALL') params.category = activeCategory;

      const [resAll, resAlerts] = await Promise.all([
        apiClient.get('/awareness', params),
        apiClient.get('/awareness/alerts/active'),
      ]);

      if (resAll.success && resAll.items) {
        setItems(resAll.items);
      }
      if (resAlerts.success && resAlerts.alerts) {
        setActiveAlerts(resAlerts.alerts);
      }
    } catch (err) {
      console.error('Failed to load awareness content:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopyLink = (item: AwarenessItem) => {
    const url = `${window.location.origin}/awareness/${item.slug || item.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast(lang === 'hi' ? 'लिंक कॉपी हो गया!' : 'Link copied to clipboard!');
    } else {
      showToast(url);
    }
    apiClient.post(`/awareness/${item.id}/share`, {}).catch(() => {});
  };

  const handleWhatsAppShare = (item: AwarenessItem) => {
    const loc = getLocalizedContent(item);
    const url = `${window.location.origin}/awareness/${item.slug || item.id}`;
    const shareText =
      loc.shareMessage ||
      `📢 ${loc.title}\n\n${loc.summary}\n\nRead more on ArogyaMitra PHC Portal: ${url}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank');
    apiClient.post(`/awareness/${item.id}/share`, {}).catch(() => {});
  };

  const handleNativeShare = async (item: AwarenessItem) => {
    const loc = getLocalizedContent(item);
    const url = `${window.location.origin}/awareness/${item.slug || item.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: loc.title,
          text: loc.summary,
          url,
        });
        apiClient.post(`/awareness/${item.id}/share`, {}).catch(() => {});
      } catch (e) {
        // User cancelled share
      }
    } else {
      handleCopyLink(item);
    }
  };

  const handleToggleLike = async (item: AwarenessItem) => {
    const isLiked = likedMap[item.id];
    setLikedMap((prev) => ({ ...prev, [item.id]: !isLiked }));
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, likesCount: i.likesCount + (isLiked ? -1 : 1) } : i
      )
    );
    if (!isLiked) {
      apiClient.post(`/awareness/${item.id}/like`, {}).catch(() => {});
    }
  };

  const toggleAudioNarrator = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      showToast(
        lang === 'hi' ? 'ऑडियो वाचन उपलब्ध नहीं है।' : 'Text-to-speech not supported in browser.'
      );
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
      utterance.rate = 0.95;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  const getLocalizedContent = (item: AwarenessItem) => {
    if (lang === 'hi' && item.translations.hi) {
      return item.translations.hi;
    }
    return item.translations.en || item.translations.hi || (Object.values(item.translations)[0] as any);
  };

  // Filter items by search query
  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const loc = getLocalizedContent(item);
    return (
      loc.title.toLowerCase().includes(q) ||
      loc.summary.toLowerCase().includes(q) ||
      item.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  const t = resolveTranslationObject(lang, {
    en: {
      headerTitle: 'Public Health Awareness & Education',
      headerSub: 'Health campaigns, preventive guides, infographics & alerts',
      searchPlaceholder: 'Search articles, drives, vaccines, symptoms...',
      urgentDrivesTitle: 'Active Public Health Drives & Alerts',
      all: 'All Content',
      articles: 'Articles & Guides',
      infographics: 'Infographics',
      videos: 'Short Videos',
      alerts: 'Drives & Alerts',
      readArticle: 'Read Guide',
      viewInfographic: 'View Poster',
      watchVideo: 'Watch Video',
      downloadPoster: 'Download Poster',
      listenAudio: 'Listen Audio',
      keyTakeaways: 'Key Health Takeaways',
      authorBy: 'Published by',
      shareWhatsApp: 'WhatsApp',
      copyLink: 'Copy Link',
      share: 'Share',
      validUntil: 'Valid until',
      freeAtPHC: 'Free Services at PHC',
      noContent: 'No health awareness content found matching your search.',
      verifiedAdvisory: 'Official Public Health Advisory',
    },
    hi: {
      headerTitle: 'जन स्वास्थ्य जागरूकता एवं शिक्षा',
      headerSub: 'स्वास्थ्य अभियान, बचाव गाइड, इन्फोग्राफिक्स व अलर्ट',
      searchPlaceholder: 'टीकाकरण, मौसमी बीमारी, लक्षण या योजनाएं खोजें...',
      urgentDrivesTitle: 'सक्रिय स्वास्थ्य अभियान व चेतावनियां',
      all: 'सभी सामग्री',
      articles: 'लेख व गाइड',
      infographics: 'इन्फोग्राफिक्स व पोस्टर',
      videos: 'लघु वीडियो',
      alerts: 'अभियान व अलर्ट',
      readArticle: 'लेख पढ़ें',
      viewInfographic: 'पोस्टर देखें',
      watchVideo: 'वीडियो देखें',
      downloadPoster: 'पोस्टर डाउनलोड करें',
      listenAudio: 'ऑडियो सुनें',
      keyTakeaways: 'मुख्य स्वास्थ्य संदेश',
      authorBy: 'द्वारा जारी',
      shareWhatsApp: 'व्हाट्सएप',
      copyLink: 'लिंक कॉपी',
      share: 'शेयर करें',
      validUntil: 'वैधता तिथि',
      freeAtPHC: 'पीएचसी पर निःशुल्क उपलब्ध',
      noContent: 'आपकी खोज के अनुसार कोई स्वास्थ्य सामग्री नहीं मिली।',
      verifiedAdvisory: 'आधिकारिक जन स्वास्थ्य सूचना',
    },
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '30px' }}>
      {/* Toast Notice */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.95)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '24px',
            fontSize: '13px',
            fontWeight: 700,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}
        >
          <Check size={16} color="#4ade80" />
          {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f766e 0%, #0369a1 100%)',
          borderRadius: '16px',
          padding: '20px',
          color: 'white',
          boxShadow: '0 4px 16px rgba(15, 118, 110, 0.15)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '6px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={18} />
          </div>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              background: 'rgba(255, 255, 255, 0.25)',
              padding: '2px 8px',
              borderRadius: '4px',
            }}
          >
            {t.verifiedAdvisory}
          </span>
        </div>

        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px 0', lineHeight: 1.3 }}>
          {t.headerTitle}
        </h2>
        <p style={{ fontSize: '13px', opacity: 0.9, margin: 0 }}>{t.headerSub}</p>

        {/* Search Bar */}
        <div style={{ position: 'relative', marginTop: '16px' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }}
          />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 36px',
              borderRadius: '12px',
              border: 'none',
              background: '#ffffff',
              color: '#0f172a',
              fontSize: '13px',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              outline: 'none',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '10px',
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Active Urgent Vaccination Drives & Health Alerts Carousel */}
      {activeAlerts.length > 0 && (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '10px',
              paddingLeft: '4px',
            }}
          >
            <Radio size={16} color="#dc2626" className="pulse-alert-icon" />
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {t.urgentDrivesTitle} ({activeAlerts.length})
            </h3>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              overflowX: 'auto',
              paddingBottom: '6px',
              scrollbarWidth: 'none',
            }}
          >
            {activeAlerts.map((alert) => {
              const loc = getLocalizedContent(alert);
              const catMeta = CATEGORY_CONFIG[alert.category] || CATEGORY_CONFIG.VACCINATION_DRIVE;

              return (
                <div
                  key={alert.id}
                  onClick={() => setSelectedArticle(alert)}
                  style={{
                    minWidth: '280px',
                    maxWidth: '300px',
                    background: 'linear-gradient(135deg, #fff1f2 0%, #ffffff 100%)',
                    border: '1px solid #fecdd3',
                    borderRadius: '14px',
                    padding: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(225, 29, 72, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '6px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          background: '#fee2e2',
                          color: '#b91c1c',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        🚨 URGENT
                      </span>
                      {alert.validUntil && (
                        <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>
                          {t.validUntil}: {alert.validUntil.split('T')[0]}
                        </span>
                      )}
                    </div>

                    <h4
                      style={{
                        fontSize: '14px',
                        fontWeight: 800,
                        color: '#881337',
                        margin: '0 0 4px 0',
                        lineHeight: 1.3,
                      }}
                    >
                      {loc.title}
                    </h4>
                    <p
                      style={{
                        fontSize: '12px',
                        color: '#4c0519',
                        margin: 0,
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {loc.summary}
                    </p>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '10px',
                      paddingTop: '8px',
                      borderTop: '1px solid #ffe4e6',
                    }}
                  >
                    <span style={{ fontSize: '11px', color: catMeta.color, fontWeight: 700 }}>
                      {catMeta.icon} {lang === 'hi' ? catMeta.labelHi : catMeta.labelEn}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWhatsAppShare(alert);
                      }}
                      style={{
                        background: '#25d366',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      <Share2 size={12} /> {t.shareWhatsApp}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Content Type Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '4px',
          scrollbarWidth: 'none',
        }}
      >
        {[
          { id: 'ALL', label: t.all, icon: Sparkles },
          { id: 'ARTICLE', label: t.articles, icon: FileText },
          { id: 'INFOGRAPHIC', label: t.infographics, icon: ImageIcon },
          { id: 'VIDEO_SHORT', label: t.videos, icon: Video },
          { id: 'HEALTH_ALERT', label: t.alerts, icon: AlertTriangle },
        ].map((tab) => {
          const isActive = activeType === tab.id;
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveType(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 700,
                border: isActive ? '1px solid #0f766e' : '1px solid #e2e8f0',
                background: isActive ? '#0f766e' : '#ffffff',
                color: isActive ? '#ffffff' : '#475569',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? '0 2px 6px rgba(15, 118, 110, 0.2)' : 'none',
              }}
            >
              <TabIcon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Category Pills */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px',
          scrollbarWidth: 'none',
        }}
      >
        <button
          onClick={() => setActiveCategory('ALL')}
          style={{
            padding: '6px 12px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: 700,
            border: activeCategory === 'ALL' ? '1px solid #0284c7' : '1px solid #e2e8f0',
            background: activeCategory === 'ALL' ? '#f0f9ff' : '#f8fafc',
            color: activeCategory === 'ALL' ? '#0369a1' : '#64748b',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          ✨ {lang === 'hi' ? 'सभी श्रेणियां' : 'All Topics'}
        </button>

        {(Object.keys(CATEGORY_CONFIG) as AwarenessCategory[]).map((cat) => {
          const cfg = CATEGORY_CONFIG[cat];
          const isSelected = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '6px 12px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 700,
                border: isSelected ? `1px solid ${cfg.color}` : '1px solid #e2e8f0',
                background: isSelected ? cfg.bg : '#ffffff',
                color: isSelected ? cfg.color : '#475569',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>{cfg.icon}</span>
              <span>{lang === 'hi' ? cfg.labelHi : cfg.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* Awareness Feed Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 10px', color: '#94a3b8' }}>
          <Sparkles size={24} style={{ animation: 'spin 2s linear infinite', marginBottom: '8px' }} />
          <div>{lang === 'hi' ? 'स्वास्थ्य जानकारी लोड हो रही है...' : 'Loading awareness content...'}</div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            background: '#f8fafc',
            borderRadius: '16px',
            border: '1px dashed #cbd5e1',
          }}
        >
          <HelpCircle size={36} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>{t.noContent}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredItems.map((item) => {
            const loc = getLocalizedContent(item);
            const catMeta = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.VACCINATION_DRIVE;
            const isLiked = likedMap[item.id];

            return (
              <div
                key={item.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Media Banner */}
                <div
                  style={{ position: 'relative', height: '160px', background: '#e2e8f0', cursor: 'pointer' }}
                  onClick={() => {
                    if (item.type === 'INFOGRAPHIC') setSelectedInfographic(item);
                    else if (item.type === 'VIDEO_SHORT') setSelectedVideo(item);
                    else setSelectedArticle(item);
                  }}
                >
                  <img
                    src={item.coverImageUrl || item.thumbnailUrl}
                    alt={loc.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />

                  {/* Type Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      display: 'flex',
                      gap: '6px',
                    }}
                  >
                    <span
                      style={{
                        background: 'rgba(15, 23, 42, 0.85)',
                        backdropFilter: 'blur(4px)',
                        color: '#ffffff',
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {item.type === 'ARTICLE' && <FileText size={12} />}
                      {item.type === 'INFOGRAPHIC' && <ImageIcon size={12} />}
                      {item.type === 'VIDEO_SHORT' && <Video size={12} />}
                      {item.type === 'HEALTH_ALERT' && <AlertTriangle size={12} />}
                      {item.type.replace('_', ' ')}
                    </span>

                    <span
                      style={{
                        background: catMeta.bg,
                        color: catMeta.color,
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '6px',
                      }}
                    >
                      {catMeta.icon} {lang === 'hi' ? catMeta.labelHi : catMeta.labelEn}
                    </span>
                  </div>

                  {/* Video Play Overlay */}
                  {item.type === 'VIDEO_SHORT' && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'rgba(15, 118, 110, 0.9)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      }}
                    >
                      <Play size={22} fill="white" style={{ marginLeft: '3px' }} />
                    </div>
                  )}

                  {/* Read Time / Duration Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      right: '12px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      backdropFilter: 'blur(4px)',
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Clock size={10} />
                    {item.videoDurationSeconds
                      ? `${item.videoDurationSeconds}s Video`
                      : `${item.readTimeMinutes || 3} min read`}
                  </div>
                </div>

                {/* Content Body */}
                <div style={{ padding: '16px' }}>
                  <h3
                    onClick={() => {
                      if (item.type === 'INFOGRAPHIC') setSelectedInfographic(item);
                      else if (item.type === 'VIDEO_SHORT') setSelectedVideo(item);
                      else setSelectedArticle(item);
                    }}
                    style={{
                      fontSize: '16px',
                      fontWeight: 800,
                      color: '#0f172a',
                      margin: '0 0 6px 0',
                      lineHeight: 1.3,
                      cursor: 'pointer',
                    }}
                  >
                    {loc.title}
                  </h3>

                  <p
                    style={{
                      fontSize: '13px',
                      color: '#475569',
                      margin: '0 0 12px 0',
                      lineHeight: 1.5,
                    }}
                  >
                    {loc.summary}
                  </p>

                  {/* Key Takeaways Snippet */}
                  {loc.keyTakeaways && loc.keyTakeaways.length > 0 && (
                    <div
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        marginBottom: '12px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          color: '#0f766e',
                          marginBottom: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <ShieldCheck size={12} /> {t.keyTakeaways}:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#334155' }}>
                        {loc.keyTakeaways.slice(0, 2).map((pt, idx) => (
                          <li key={idx} style={{ marginBottom: '2px', lineHeight: 1.4 }}>
                            {pt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Tags */}
                  {item.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                      {item.tags.map((tg, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: '10px',
                            background: '#f1f5f9',
                            color: '#64748b',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontWeight: 600,
                          }}
                        >
                          #{tg}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer & Action Bar */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '12px',
                      borderTop: '1px solid #f1f5f9',
                    }}
                  >
                    {/* Author Attribution */}
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      <span style={{ fontWeight: 700, color: '#334155' }}>{item.authorName}</span>
                    </div>

                    {/* Action Buttons: WhatsApp / Copy Link / Read */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        onClick={() => handleToggleLike(item)}
                        style={{
                          background: isLiked ? '#fee2e2' : '#f8fafc',
                          color: isLiked ? '#ef4444' : '#64748b',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Heart size={14} fill={isLiked ? '#ef4444' : 'none'} />
                        {item.likesCount}
                      </button>

                      <button
                        onClick={() => handleWhatsAppShare(item)}
                        style={{
                          background: '#25d366',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 6px rgba(37, 211, 102, 0.2)',
                        }}
                      >
                        <MessageCircle size={14} />
                        {t.shareWhatsApp}
                      </button>

                      <button
                        onClick={() => handleCopyLink(item)}
                        style={{
                          background: '#f8fafc',
                          color: '#334155',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          padding: '6px',
                          cursor: 'pointer',
                        }}
                        title={t.copyLink}
                      >
                        <Copy size={14} />
                      </button>

                      <button
                        onClick={() => {
                          if (item.type === 'INFOGRAPHIC') setSelectedInfographic(item);
                          else if (item.type === 'VIDEO_SHORT') setSelectedVideo(item);
                          else setSelectedArticle(item);
                        }}
                        style={{
                          background: '#0f766e',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {item.type === 'INFOGRAPHIC'
                          ? t.viewInfographic
                          : item.type === 'VIDEO_SHORT'
                          ? t.watchVideo
                          : t.readArticle}
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ARTICLE READER MODAL */}
      {selectedArticle && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
          onClick={() => {
            if (isPlayingAudio) window.speechSynthesis.cancel();
            setIsPlayingAudio(false);
            setSelectedArticle(null);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '540px',
              maxHeight: '85vh',
              background: '#ffffff',
              borderRadius: '24px 24px 0 0',
              padding: '24px',
              overflowY: 'auto',
              boxShadow: '0 -4px 24px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  background: '#ccfbf1',
                  color: '#0f766e',
                  padding: '3px 10px',
                  borderRadius: '12px',
                }}
              >
                {selectedArticle.category.replace('_', ' ')}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => {
                    const loc = getLocalizedContent(selectedArticle);
                    toggleAudioNarrator(
                      loc.audioNarratorText || `${loc.title}. ${loc.summary}. ${loc.content}`
                    );
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: isPlayingAudio ? '#fee2e2' : '#f0fdf4',
                    color: isPlayingAudio ? '#dc2626' : '#16a34a',
                    border: '1px solid currentColor',
                    padding: '4px 10px',
                    borderRadius: '16px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {isPlayingAudio ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  {isPlayingAudio ? 'Stop Audio' : t.listenAudio}
                </button>

                <button
                  onClick={() => {
                    if (isPlayingAudio) window.speechSynthesis.cancel();
                    setIsPlayingAudio(false);
                    setSelectedArticle(null);
                  }}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Title & Author */}
            {(() => {
              const loc = getLocalizedContent(selectedArticle);
              return (
                <>
                  <h2
                    style={{
                      fontSize: '18px',
                      fontWeight: 800,
                      color: '#0f172a',
                      margin: '0 0 8px 0',
                      lineHeight: 1.3,
                    }}
                  >
                    {loc.title}
                  </h2>

                  <div
                    style={{
                      fontSize: '12px',
                      color: '#64748b',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>By {selectedArticle.authorName}</span> •
                    <span>{selectedArticle.phcName}</span>
                  </div>

                  {/* Cover Image */}
                  {selectedArticle.coverImageUrl && (
                    <img
                      src={selectedArticle.coverImageUrl}
                      alt={loc.title}
                      style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '12px', marginBottom: '16px' }}
                    />
                  )}

                  {/* Key Takeaways Callout */}
                  {loc.keyTakeaways && (
                    <div
                      style={{
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '12px',
                        padding: '14px',
                        marginBottom: '16px',
                      }}
                    >
                      <h4
                        style={{
                          fontSize: '13px',
                          fontWeight: 800,
                          color: '#166534',
                          margin: '0 0 6px 0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <ShieldCheck size={16} /> {t.keyTakeaways}
                      </h4>
                      <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#14532d' }}>
                        {loc.keyTakeaways.map((pt, i) => (
                          <li key={i} style={{ marginBottom: '4px', lineHeight: 1.4 }}>
                            {pt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Detailed Body Markdown / Text */}
                  <div
                    style={{
                      fontSize: '13px',
                      lineHeight: 1.6,
                      color: '#334155',
                      whiteSpace: 'pre-line',
                      marginBottom: '20px',
                    }}
                  >
                    {loc.content || loc.summary}
                  </div>

                  {/* Bottom Share Buttons */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '10px',
                      paddingTop: '16px',
                      borderTop: '1px solid #e2e8f0',
                    }}
                  >
                    <button
                      onClick={() => handleWhatsAppShare(selectedArticle)}
                      style={{
                        flex: 1,
                        background: '#25d366',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '12px',
                        fontSize: '13px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      <MessageCircle size={16} /> Share on WhatsApp
                    </button>

                    <button
                      onClick={() => handleCopyLink(selectedArticle)}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        color: '#334155',
                        borderRadius: '10px',
                        padding: '12px 18px',
                        fontSize: '13px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      <Copy size={16} /> {t.copyLink}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* INFOGRAPHIC POSTER MODAL */}
      {selectedInfographic && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(6px)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
          }}
          onClick={() => setSelectedInfographic(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '500px',
              background: '#ffffff',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 18px',
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {getLocalizedContent(selectedInfographic).title}
              </h3>
              <button
                onClick={() => setSelectedInfographic(null)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ maxHeight: '60vh', overflowY: 'auto', background: '#f8fafc' }}>
              <img
                src={selectedInfographic.mediaUrl || selectedInfographic.coverImageUrl}
                alt={getLocalizedContent(selectedInfographic).title}
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>

            <div
              style={{
                padding: '14px 18px',
                background: '#ffffff',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                gap: '10px',
              }}
            >
              <a
                href={selectedInfographic.mediaUrl || selectedInfographic.coverImageUrl}
                target="_blank"
                rel="noreferrer"
                download="health_awareness_poster.jpg"
                style={{
                  flex: 1,
                  background: '#0f766e',
                  color: 'white',
                  borderRadius: '10px',
                  padding: '10px',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  textDecoration: 'none',
                }}
              >
                <Download size={14} /> {t.downloadPoster}
              </a>

              <button
                onClick={() => handleWhatsAppShare(selectedInfographic)}
                style={{
                  background: '#25d366',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <MessageCircle size={14} /> Share
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIDEO SHORT PLAYER MODAL */}
      {selectedVideo && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
          }}
          onClick={() => setSelectedVideo(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '450px',
              background: '#0f172a',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              color: 'white',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 18px',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'white', margin: 0 }}>
                {getLocalizedContent(selectedVideo).title}
              </h3>
              <button
                onClick={() => setSelectedVideo(null)}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ position: 'relative', width: '100%', background: 'black' }}>
              <video
                src={selectedVideo.mediaUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'}
                controls
                autoPlay
                playsInline
                style={{ width: '100%', maxHeight: '55vh', display: 'block' }}
              />
            </div>

            <div style={{ padding: '14px 18px' }}>
              <p style={{ fontSize: '12px', color: '#cbd5e1', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                {getLocalizedContent(selectedVideo).summary}
              </p>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => handleWhatsAppShare(selectedVideo)}
                  style={{
                    flex: 1,
                    background: '#25d366',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                  }}
                >
                  <MessageCircle size={14} /> Share Video on WhatsApp
                </button>

                <button
                  onClick={() => handleCopyLink(selectedVideo)}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white',
                    borderRadius: '10px',
                    padding: '10px 16px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
