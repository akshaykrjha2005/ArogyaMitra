import React, { useState } from 'react';
import { Globe, X, Check, Search } from 'lucide-react';
import { AppLanguage, ALL_INDIAN_LANGUAGES, IndianLanguageMeta } from '@phc-connect/types';

interface Props {
  isOpen: boolean;
  currentLang: AppLanguage;
  onSelectLanguage: (lang: AppLanguage) => void;
  onClose: () => void;
}

export const LanguageSelectorModal: React.FC<Props> = ({
  isOpen,
  currentLang,
  onSelectLanguage,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

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

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '480px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #0f766e, #0d9488)',
            color: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Globe size={20} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
                Select Language / भाषा चुनें
              </h3>
              <p style={{ margin: 0, fontSize: '11px', opacity: 0.85, marginTop: '2px' }}>
                All 22 Official Indian Languages & Regional Dialects
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Search
              size={16}
              style={{ position: 'absolute', left: '12px', color: '#94a3b8', pointerEvents: 'none' }}
            />
            <input
              type="text"
              placeholder="Search language or state (e.g. বাংলা, Tamil, Punjab, Kannada)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '10px',
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

        {/* Language Grid / List */}
        <div
          style={{
            padding: '12px 16px',
            overflowY: 'auto',
            flex: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
            gap: '8px',
          }}
        >
          {filteredLanguages.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '30px 10px', textAlign: 'center', color: '#64748b' }}>
              <p style={{ margin: 0, fontWeight: 600 }}>No language found matching "{searchTerm}"</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>Try searching by state or script name</p>
            </div>
          ) : (
            filteredLanguages.map((item) => {
              const isSelected = currentLang === item.code;
              return (
                <button
                  key={item.code}
                  onClick={() => {
                    onSelectLanguage(item.code);
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: isSelected ? '2px solid #0d9488' : '1px solid #e2e8f0',
                    background: isSelected ? '#f0fdfa' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left',
                    position: 'relative',
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
                        fontSize: '16px',
                        fontWeight: 700,
                        color: isSelected ? '#0f766e' : '#1e293b',
                      }}
                    >
                      {item.nativeName}
                    </span>
                    {isSelected && (
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: '#0d9488',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop: '3px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                      {item.name}
                    </span>
                  </div>
                  <div style={{ marginTop: '2px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        color: '#94a3b8',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '160px',
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

        {/* Modal Footer */}
        <div
          style={{
            padding: '12px 20px',
            background: '#f8fafc',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#64748b',
          }}
        >
          <span>
            Active: <strong>{ALL_INDIAN_LANGUAGES.find((l) => l.code === currentLang)?.nativeName || 'English'}</strong>
          </span>
          <span style={{ color: '#0f766e', fontWeight: 600 }}>Language will stay saved permanently</span>
        </div>
      </div>
    </div>
  );
};
