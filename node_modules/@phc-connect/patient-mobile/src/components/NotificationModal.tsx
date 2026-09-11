import React from 'react';
import { X, Bell, CheckCircle2, AlertTriangle, Calendar, Pill } from 'lucide-react';
import { Notification } from '@phc-connect/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAllRead: () => void;
}

export const NotificationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
}) => {
  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'APPOINTMENT_CONFIRMED':
      case 'APPOINTMENT_REMINDER':
        return <Calendar size={18} color="#1976d2" />;
      case 'MEDICINE_AVAILABLE':
        return <Pill size={18} color="#26a69a" />;
      case 'CRITICAL_TRIAGE':
        return <AlertTriangle size={18} color="#d32f2f" />;
      default:
        return <CheckCircle2 size={18} color="#43a047" />;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      zIndex: 9000,
    }}>
      <div style={{
        background: '#ffffff',
        borderTopLeftRadius: '28px',
        borderTopRightRadius: '28px',
        maxWidth: '430px',
        width: '100%',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.2)',
        animation: 'slideUp 0.3s ease-out',
      }}>
        <div style={{
          padding: '18px 20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={20} color="#1976d2" />
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>Notifications</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={onMarkAllRead}
              style={{
                background: 'none',
                border: 'none',
                color: '#1976d2',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              style={{
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={16} color="#64748b" />
            </button>
          </div>
        </div>

        <div style={{ overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
              <Bell size={36} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
              <p style={{ fontSize: '13px', fontWeight: 600 }}>No new notifications</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                style={{
                  background: notif.read ? '#f8fafc' : '#f0f7ff',
                  border: `1px solid ${notif.read ? '#e2e8f0' : '#bfdbfe'}`,
                  borderRadius: '14px',
                  padding: '14px',
                  display: 'flex',
                  gap: '12px',
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  background: 'white',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                }}>
                  {getIcon(notif.type)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>{notif.title}</h4>
                    {!notif.read && (
                      <span style={{ width: '6px', height: '6px', background: '#1976d2', borderRadius: '50%' }} />
                    )}
                  </div>
                  <p style={{ fontSize: '12px', color: '#475569', lineHeight: '1.4' }}>{notif.message}</p>
                  <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px', display: 'inline-block' }}>
                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
