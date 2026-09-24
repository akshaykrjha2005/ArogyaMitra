import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, Search, ChevronDown, X } from 'lucide-react';
import { AppLanguage, ALL_INDIAN_LANGUAGES, IndianLanguageMeta } from '@phc-connect/types';

interface Props {
  currentLang: AppLanguage;
  onSelectLanguage: (lang: AppLanguage) => void;
  compact?: boolean;
}

export const LanguageSelector: React.FC<Props> = ({
  currentLang,
  onSelectLanguage,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  const activeMeta = ALL_INDIAN_LANGUAGES.find((l) => l.code === currentLang) || ALL_INDIAN_LANGUAGES[0];

  const filteredLanguages = ALL_INDIAN_LANGUAGES.filter((item: IndianLanguageMeta) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.nativeName.toLowerCase().includes(q) ||
      item.region.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q)
    );
  });

  // Close when clicking outside modal
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        // Handled by backdrop
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '7px',
          padding: compact ? '6px 10px' : '7px 12px',
          borderRadius: '9999px',
          border: '1px solid #cbd5e1',
          background: '#ffffff',
          color: '#334155',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#0d9488';
          e.currentTarget.style.color = '#0d9488';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#cbd5e1';
          e.currentTarget.style.color = '#334155';
        }}
        title="Change application language (All 22 Official Indian Languages Supported)"
      >
        <Globe size={15} style={{ color: '#0d9488' }} />
        <span>{activeMeta.nativeName} ({activeMeta.name})</span>
        <ChevronDown size={13} style={{ opacity: 0.6 }} />
      </button>

      {/* Language Modal */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '16px',
            animation: 'fadeIn 0.15s ease-out',
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            ref={modalRef}
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: '16px 20px',
                background: 'linear-gradient(135deg, #0f766e, #0d9488)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Globe size={18} color="#ffffff" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
                    Choose Language / भाषा चुनें
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11px', opacity: 0.9 }}>
                    All 22 Official Scheduled Indian Languages & Regional Dialects
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Search Filter */}
            <div style={{ padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search
                  size={16}
                  style={{ position: 'absolute', left: '12px', color: '#94a3b8', pointerEvents: 'none' }}
                />
                <input
                  type="text"
                  placeholder="Filter by language or state (e.g. বাংলা, Tamil, Marathi, Punjabi, Gujarati)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    background: '#ffffff',
                    fontFamily: 'inherit',
                  }}
                  autoFocus
                />
              </div>
            </div>

            {/* Languages Grid */}
            <div
              style={{
                padding: '16px',
                overflowY: 'auto',
                flex: 1,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: '8px',
              }}
            >
              {filteredLanguages.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', padding: '30px 10px', textAlign: 'center', color: '#64748b' }}>
                  <p style={{ margin: 0, fontWeight: 600 }}>No language found for "{searchTerm}"</p>
                </div>
              ) : (
                filteredLanguages.map((item) => {
                  const isSelected = currentLang === item.code;
                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => {
                        onSelectLanguage(item.code);
                        setIsOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: isSelected ? '2px solid #0d9488' : '1px solid #e2e8f0',
                        background: isSelected ? '#f0fdfa' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = '#0d9488';
                          e.currentTarget.style.background = '#f8fafc';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.background = '#ffffff';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span
                          style={{
                            fontSize: '15px',
                            fontWeight: 700,
                            color: isSelected ? '#0f766e' : '#1e293b',
                          }}
                        >
                          {item.nativeName}
                        </span>
                        {isSelected && (
                          <div
                            style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              background: '#0d9488',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Check size={11} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <div style={{ marginTop: '2px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                          {item.name}
                        </span>
                      </div>
                      <div style={{ marginTop: '1px' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            color: '#94a3b8',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '140px',
                            display: 'block',
                          }}
                        >
                          {item.region}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '10px 20px',
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11px',
                color: '#64748b',
              }}
            >
              <span>Selected: <strong>{activeMeta.nativeName} ({activeMeta.name})</strong></span>
              <span style={{ color: '#0f766e', fontWeight: 600 }}>Persisted permanently in browser</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
