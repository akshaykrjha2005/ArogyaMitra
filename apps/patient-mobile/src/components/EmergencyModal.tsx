import React from 'react';
import { AlertOctagon, PhoneCall, Navigation, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
}

export const EmergencyModal: React.FC<Props> = ({ isOpen, onClose, reason }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px',
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        maxWidth: '380px',
        width: '100%',
        padding: '24px',
        border: '3px solid #d32f2f',
        boxShadow: '0 20px 50px rgba(211, 47, 47, 0.4)',
        textAlign: 'center',
        position: 'relative',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            background: '#f1f5f9',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={18} color="#475569" />
        </button>

        <div style={{
          width: '64px',
          height: '64px',
          background: '#ffebee',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <AlertOctagon size={36} color="#d32f2f" />
        </div>

        <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#d32f2f', marginBottom: '8px' }}>
          EMERGENCY ALERT
        </h3>

        <p style={{ fontSize: '13px', color: '#334155', lineHeight: '1.5', marginBottom: '16px' }}>
          {reason || 'High-acuity warning symptoms detected. Immediate emergency medical intervention is required.'}
        </p>

        <div style={{
          background: '#fff1f2',
          border: '1px solid #fecdd3',
          borderRadius: '12px',
          padding: '12px',
          marginBottom: '20px',
          textAlign: 'left',
          fontSize: '12px',
          color: '#9f1239',
        }}>
          <strong>Do not wait for standard OPD.</strong> Dial Emergency Ambulance immediately or proceed to the nearest Trauma Facility / District Hospital.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <a
            href="tel:108"
            style={{
              background: '#d32f2f',
              color: 'white',
              textDecoration: 'none',
              padding: '14px',
              borderRadius: '14px',
              fontWeight: 800,
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(211, 47, 47, 0.4)',
            }}
          >
            <PhoneCall size={20} />
            Call Emergency 108 / 112
          </a>

          <button
            onClick={onClose}
            style={{
              background: '#f8fafc',
              color: '#475569',
              border: '1px solid #e2e8f0',
              padding: '12px',
              borderRadius: '14px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Find Nearest Emergency PHC
          </button>
        </div>
      </div>
    </div>
  );
};
