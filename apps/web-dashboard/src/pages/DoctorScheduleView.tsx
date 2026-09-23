import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Search,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  FileText,
  Filter,
  RefreshCw,
  Phone,
  Video,
  MapPin,
  ChevronRight,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { Appointment, AppointmentStatus } from '@phc-connect/types';
import { apiClient } from '../services/api';

interface Props {
  doctorId: string;
  onStartConsultation: (appointment: Appointment) => void;
  onViewEHR: (patientId: string) => void;
}

export const DoctorScheduleView: React.FC<Props> = ({
  doctorId,
  onStartConsultation,
  onViewEHR,
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [actionNotice, setActionNotice] = useState<string>('');

  useEffect(() => {
    loadAppointments();
  }, [doctorId, selectedDate]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/appointments', {
        doctorId,
      });

      if (res.success && res.appointments) {
        setAppointments(res.appointments);
      }
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (
    appointmentId: string,
    newStatus: AppointmentStatus
  ) => {
    try {
      const res = await apiClient.patch(`/appointments/${appointmentId}`, {
        status: newStatus,
      });
      if (res.success) {
        setActionNotice(`Appointment status updated to ${newStatus}`);
        setTimeout(() => setActionNotice(''), 3500);
        loadAppointments();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Filtered Appointments
  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.appointmentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.patientPhone.includes(searchQuery) ||
      (apt.tokenNumber && String(apt.tokenNumber).includes(searchQuery));

    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'WAITING'
        ? apt.status === 'Confirmed' || apt.status === 'Pending' || apt.status === 'Checked In'
        : apt.status.toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  // Metrics
  const totalCount = appointments.length;
  const waitingCount = appointments.filter(
    (a) => a.status === 'Confirmed' || a.status === 'Pending' || a.status === 'Checked In'
  ).length;
  const inConsultCount = appointments.filter(
    (a) => a.status === 'In Consultation'
  ).length;
  const completedCount = appointments.filter(
    (a) => a.status === 'Completed'
  ).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          borderRadius: '16px',
          padding: '22px 26px',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 8px 24px rgba(2, 132, 199, 0.2)',
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              color: '#bae6fd',
              marginBottom: '4px',
            }}
          >
            <CalendarIcon size={14} /> Doctor Duty Schedule & Appointments
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>
            Today's OPD Consultation Roster
          </h2>
          <p
            style={{
              margin: '4px 0 0 0',
              fontSize: '13px',
              color: '#e0f2fe',
              opacity: 0.9,
            }}
          >
            Manage scheduled patient visits, token queues, and instant OPD room handoffs.
          </p>
        </div>

        {/* Date Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#ffffff',
              padding: '8px 14px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
            }}
          >
            Today
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              background: '#ffffff',
              border: 'none',
              color: '#0f172a',
              padding: '8px 12px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 700,
              outline: 'none',
              cursor: 'pointer',
            }}
          />
          <button
            onClick={loadAppointments}
            title="Refresh Schedule"
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: '#ffffff',
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {actionNotice && (
        <div
          style={{
            background: '#ecfdf5',
            border: '1px solid #6ee7b7',
            color: '#065f46',
            padding: '12px 18px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} color="#059669" />
          {actionNotice}
        </div>
      )}

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
        }}
      >
        <div
          style={{
            background: '#ffffff',
            padding: '18px',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
              Total Booked
            </span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
              {totalCount}
            </div>
          </div>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: '#e0f2fe',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CalendarIcon size={20} />
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            padding: '18px',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#d97706', textTransform: 'uppercase' }}>
              Waiting in Queue
            </span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#b45309', marginTop: '2px' }}>
              {waitingCount}
            </div>
          </div>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Clock size={20} />
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            padding: '18px',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase' }}>
              In Consultation
            </span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#1d4ed8', marginTop: '2px' }}>
              {inConsultCount}
            </div>
          </div>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: '#dbeafe',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Stethoscope size={20} />
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            padding: '18px',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#059669', textTransform: 'uppercase' }}>
              Completed Today
            </span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#047857', marginTop: '2px' }}>
              {completedCount}
            </div>
          </div>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: '#d1fae5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          padding: '14px 18px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
          <Search
            size={16}
            color="#94a3b8"
            style={{ position: 'absolute', left: '12px', top: '12px' }}
          />
          <input
            type="text"
            placeholder="Search patient, token #, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              outline: 'none',
            }}
          />
        </div>

        {/* Status Filter Chips */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { key: 'ALL', label: 'All Patients' },
            { key: 'WAITING', label: 'Waiting / Checked In' },
            { key: 'In Consultation', label: 'In OPD Room' },
            { key: 'Completed', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                background: statusFilter === tab.key ? '#0284c7' : '#f1f5f9',
                color: statusFilter === tab.key ? '#ffffff' : '#475569',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments Grid / List */}
      {loading ? (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            padding: '60px',
            textAlign: 'center',
            color: '#64748b',
          }}
        >
          <RefreshCw size={28} className="spin" style={{ marginBottom: '12px' }} />
          <div>Loading doctor's consultation roster...</div>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            padding: '60px 20px',
            textAlign: 'center',
            border: '1px dashed #cbd5e1',
          }}
        >
          <CalendarIcon size={44} color="#94a3b8" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>
            No appointments found
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '400px', margin: '6px auto 0' }}>
            There are no patient appointments scheduled matching the selected filters.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredAppointments.map((apt) => {
            const isWaiting = apt.status === 'Confirmed' || apt.status === 'Pending' || apt.status === 'Checked In';
            const isInRoom = apt.status === 'In Consultation';
            const isDone = apt.status === 'Completed';

            return (
              <div
                key={apt.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '14px',
                  border: isInRoom
                    ? '2px solid #38bdf8'
                    : isWaiting
                    ? '1px solid #fed7aa'
                    : '1px solid #e2e8f0',
                  padding: '18px 22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                  boxShadow: isInRoom
                    ? '0 4px 18px rgba(56, 189, 248, 0.15)'
                    : '0 2px 6px rgba(0,0,0,0.02)',
                }}
              >
                {/* Left: Token & Patient Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '260px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '14px',
                      background: isInRoom
                        ? '#e0f2fe'
                        : isWaiting
                        ? '#ffedd5'
                        : '#f1f5f9',
                      color: isInRoom
                        ? '#0284c7'
                        : isWaiting
                        ? '#ea580c'
                        : '#64748b',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '11px',
                    }}
                  >
                    <span>TOKEN</span>
                    <span style={{ fontSize: '16px', lineHeight: 1 }}>
                      #{apt.tokenNumber || 1}
                    </span>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        {apt.patientName}
                      </h4>
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#64748b',
                          background: '#f1f5f9',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontWeight: 700,
                        }}
                      >
                        {apt.patientAge} Yrs • {apt.patientGender}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '12px',
                        color: '#64748b',
                        marginTop: '4px',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> {apt.timeSlot}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={12} /> {apt.patientPhone}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Center: Chief Complaint & Symptoms */}
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                    Reason for Consultation
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginTop: '2px' }}>
                    {apt.reasonForVisit || 'Routine Checkup'}
                  </div>
                  {apt.symptoms && apt.symptoms.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                      {apt.symptoms.map((sym, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '10px',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            color: '#475569',
                            fontWeight: 600,
                          }}
                        >
                          {sym}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 800,
                      background: isInRoom
                        ? '#e0f2fe'
                        : isWaiting
                        ? '#ffedd5'
                        : isDone
                        ? '#d1fae5'
                        : '#f1f5f9',
                      color: isInRoom
                        ? '#0284c7'
                        : isWaiting
                        ? '#c2410c'
                        : isDone
                        ? '#059669'
                        : '#64748b',
                    }}
                  >
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: isInRoom
                          ? '#0284c7'
                          : isWaiting
                          ? '#f97316'
                          : isDone
                          ? '#10b981'
                          : '#94a3b8',
                      }}
                    />
                    {apt.status}
                  </span>
                </div>

                {/* Right: Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => onViewEHR(apt.patientId)}
                    title="Open Complete Patient EHR History"
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      color: '#334155',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <FileText size={14} /> EHR History
                  </button>

                  {!isDone && (
                    <button
                      onClick={() => onStartConsultation(apt)}
                      style={{
                        background: isInRoom ? '#0284c7' : '#059669',
                        border: 'none',
                        color: '#ffffff',
                        padding: '8px 16px',
                        borderRadius: '10px',
                        fontSize: '12px',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      }}
                    >
                      <Stethoscope size={14} />
                      {isInRoom ? 'Resume OPD' : 'Start OPD'}
                    </button>
                  )}

                  {(apt.status === 'Confirmed' || apt.status === 'Pending') && (
                    <button
                      onClick={() => handleUpdateStatus(apt.id, 'Checked In')}
                      title="Mark as Checked In"
                      style={{
                        background: '#fef3c7',
                        border: '1px solid #fde68a',
                        color: '#b45309',
                        padding: '8px 10px',
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Check-In
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
