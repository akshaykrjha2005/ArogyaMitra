import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Share2,
  Phone,
  Stethoscope,
  Sparkles,
  Ticket,
  ChevronRight,
  ShieldCheck,
  Building,
  UserCheck,
  X,
  Send,
  BellRing,
  Award,
  FileSpreadsheet,
  Printer,
  Check,
  RefreshCw,
  Eye,
  Activity,
  Heart,
  TrendingUp,
  User,
  MessageSquare,
} from 'lucide-react';
import {
  HealthCamp,
  HealthCampType,
  HealthCampStatus,
  HealthCampRegistration,
  HealthCampOutcome,
  HealthCampAnalytics,
  HealthAssistantProfile,
  DoctorProfile,
  PHC,
} from '@phc-connect/types';
import { apiClient } from '../services/api';

interface Props {
  currentUser?: any;
  onNavigateTab?: (tab: string, extra?: any) => void;
}

export const HealthCampDashboard: React.FC<Props> = ({ currentUser, onNavigateTab }) => {
  const [camps, setCamps] = useState<HealthCamp[]>([]);
  const [analytics, setAnalytics] = useState<HealthCampAnalytics | null>(null);
  const [healthAssistants, setHealthAssistants] = useState<HealthAssistantProfile[]>([]);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [phcs, setPHCs] = useState<PHC[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedType, setSelectedType] = useState<HealthCampType | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<HealthCampStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeCampForRoster, setActiveCampForRoster] = useState<HealthCamp | null>(null);
  const [rosterRegistrations, setRosterRegistrations] = useState<HealthCampRegistration[]>([]);
  const [rosterStats, setRosterStats] = useState<any>(null);
  const [loadingRoster, setLoadingRoster] = useState(false);

  const [activeCampForOutcome, setActiveCampForOutcome] = useState<HealthCamp | null>(null);
  const [activeAssistantModal, setActiveAssistantModal] = useState<HealthAssistantProfile | null>(null);

  // Create Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState<HealthCampType>('GENERAL');
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [formEndDate, setFormEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [formTime, setFormTime] = useState('09:00 AM - 03:00 PM');
  const [formVenue, setFormVenue] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPHCId, setFormPHCId] = useState('');
  const [formCapacity, setFormCapacity] = useState('60');
  const [formAssistantId, setFormAssistantId] = useState('');
  const [formDoctorId, setFormDoctorId] = useState('');
  const [formServices, setFormServices] = useState('General Health Screening, Blood Pressure & Sugar Check, Free Medicine Dispensing');
  const [formEligibility, setFormEligibility] = useState('Open to all local residents');
  const [formPhone, setFormPhone] = useState('+91 98765 43210');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Outcome Form State
  const [outcomeScreened, setOutcomeScreened] = useState('50');
  const [outcomeReferrals, setOutcomeReferrals] = useState('5');
  const [outcomeVaccinations, setOutcomeVaccinations] = useState('0');
  const [outcomeMedicines, setOutcomeMedicines] = useState('45');
  const [outcomeCritical, setOutcomeCritical] = useState('0');
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [submittingOutcome, setSubmittingOutcome] = useState(false);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [campsRes, analyticsRes, asstRes, docRes, phcRes] = await Promise.all([
        apiClient.get('/camps'),
        apiClient.get('/camps/analytics'),
        apiClient.get('/assistants'),
        apiClient.get('/doctors'),
        apiClient.get('/phcs'),
      ]);

      if (campsRes.success && campsRes.camps) {
        setCamps(campsRes.camps);
      }
      if (analyticsRes.success && analyticsRes.analytics) {
        setAnalytics(analyticsRes.analytics);
      }
      if (asstRes.success && asstRes.assistants) {
        setHealthAssistants(asstRes.assistants);
        if (asstRes.assistants.length > 0) {
          setFormAssistantId(asstRes.assistants[0].id);
        }
      }
      if (docRes.success && docRes.doctors) {
        setDoctors(docRes.doctors);
        if (docRes.doctors.length > 0) {
          setFormDoctorId(docRes.doctors[0].id);
        }
      }
      if (phcRes.success && phcRes.phcs) {
        setPHCs(phcRes.phcs);
        if (phcRes.phcs.length > 0) {
          setFormPHCId(phcRes.phcs[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load health camp dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenRoster = async (camp: HealthCamp) => {
    setActiveCampForRoster(camp);
    try {
      setLoadingRoster(true);
      const res = await apiClient.get(`/camps/${camp.id}/registrations`);
      if (res.success) {
        setRosterRegistrations(res.registrations || []);
        setRosterStats(res.stats || null);
      }
    } catch (err) {
      console.error('Failed to load roster:', err);
    } finally {
      setLoadingRoster(false);
    }
  };

  const handleMarkAttendance = async (regId: string, status: 'ATTENDED' | 'NO_SHOW') => {
    if (!activeCampForRoster) return;
    try {
      const res = await apiClient.patch(`/camps/${activeCampForRoster.id}/registrations/${regId}/attendance`, {
        status,
      });
      if (res.success) {
        setRosterRegistrations((prev) =>
          prev.map((r) => (r.id === regId ? { ...r, status, attendedAt: status === 'ATTENDED' ? new Date().toISOString() : null } : r))
        );
        showToast(`Attendance updated: Participant marked as ${status}`);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update attendance');
    }
  };

  const handleSendReminders = async (camp: HealthCamp) => {
    try {
      const res = await apiClient.post(`/camps/${camp.id}/reminders`, {});
      if (res.success) {
        showToast(`⏰ Reminders broadcasted to ${res.sentCount || camp.registeredCount} participants!`);
        if (activeCampForRoster && activeCampForRoster.id === camp.id) {
          handleOpenRoster(camp);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to send reminders');
    }
  };

  const handleCreateCamp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await apiClient.post('/camps', {
        title: formTitle,
        description: formDescription,
        type: formType,
        startDate: formStartDate,
        endDate: formEndDate,
        time: formTime,
        venue: formVenue,
        address: formAddress || formVenue,
        phcId: formPHCId,
        capacity: Number(formCapacity),
        assignedAssistantId: formAssistantId,
        assignedDoctorId: formDoctorId,
        servicesOffered: formServices.split(',').map((s) => s.trim()),
        eligibility: formEligibility,
        contactPhone: formPhone,
      });

      if (res.success) {
        showToast('🎉 Health Camp created successfully!');
        setIsCreateModalOpen(false);
        setFormTitle('');
        setFormDescription('');
        setFormVenue('');
        setFormAddress('');
        loadData();
      } else {
        alert(res.message || 'Failed to create health camp');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating health camp');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCampForOutcome) return;

    try {
      setSubmittingOutcome(true);
      const res = await apiClient.post(`/camps/${activeCampForOutcome.id}/outcome`, {
        peopleScreened: Number(outcomeScreened),
        referralsMade: Number(outcomeReferrals),
        vaccinationsAdministered: Number(outcomeVaccinations),
        medicinesDistributed: Number(outcomeMedicines),
        criticalCasesIdentified: Number(outcomeCritical),
        notes: outcomeNotes,
      });

      if (res.success) {
        showToast('✅ Health Camp outcome recorded and status updated to COMPLETED');
        setActiveCampForOutcome(null);
        loadData();
      } else {
        alert(res.message || 'Failed to record outcome');
      }
    } catch (err: any) {
      alert(err.message || 'Error recording outcome');
    } finally {
      setSubmittingOutcome(false);
    }
  };

  const getTypeBadge = (type: HealthCampType) => {
    switch (type) {
      case 'EYE':
        return { bg: '#e0e7ff', text: '#3730a3', label: 'Eye Screening' };
      case 'DENTAL':
        return { bg: '#cffafe', text: '#155e75', label: 'Dental Care' };
      case 'MATERNAL_CHILD':
        return { bg: '#fce7f3', text: '#9d174d', label: 'Maternal & Child' };
      case 'VACCINATION':
        return { bg: '#dcfce7', text: '#166534', label: 'Vaccination Drive' };
      case 'NCD_SCREENING':
        return { bg: '#fef3c7', text: '#92400e', label: 'NCD & Diabetes' };
      case 'AYUSH':
        return { bg: '#f3e8ff', text: '#6b21a8', label: 'AYUSH Wellness' };
      default:
        return { bg: '#ccfbf1', text: '#0f766e', label: 'General Health' };
    }
  };

  const getStatusBadge = (status: HealthCampStatus) => {
    switch (status) {
      case 'ONGOING':
        return { bg: '#fee2e2', text: '#b91c1c', label: 'Live Ongoing' };
      case 'COMPLETED':
        return { bg: '#f1f5f9', text: '#475569', label: 'Completed' };
      case 'CANCELLED':
        return { bg: '#fef2f2', text: '#991b1b', label: 'Cancelled' };
      default:
        return { bg: '#dcfce7', text: '#166534', label: 'Upcoming' };
    }
  };

  const filteredCamps = camps.filter((c) => {
    const matchesType = selectedType === 'ALL' || c.type === selectedType;
    const matchesStatus = selectedStatus === 'ALL' || c.status === selectedStatus;
    const matchesSearch =
      !searchQuery ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phcName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.assignedAssistantName && c.assignedAssistantName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.assignedDoctorName && c.assignedDoctorName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesStatus && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            background: '#0f766e',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: 700,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)',
          borderRadius: '16px',
          padding: '24px',
          color: '#ffffff',
          boxShadow: '0 4px 20px rgba(15, 118, 110, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
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
              <Calendar size={20} color="#ffffff" />
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>
              Community Health Camp Management
            </h1>
          </div>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '13px', fontWeight: 500 }}>
            Organize outreach camps, manage registrations, track capacity caps, mark attendance & record population outcomes
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#ffffff',
              color: '#0f766e',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              transition: 'all 0.15s ease',
            }}
          >
            <Plus size={16} />
            + Create New Health Camp
          </button>
          <button
            onClick={loadData}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              border: 'none',
              padding: '10px 14px',
              borderRadius: '10px',
              cursor: 'pointer',
            }}
            title="Refresh Camps"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Analytics KPI Metric Cards */}
      {analytics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Total Camps Organized</div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', marginTop: '4px' }}>{analytics.totalCamps}</div>
            <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700, marginTop: '2px' }}>
              {analytics.upcomingCamps} Upcoming / Ongoing
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Total Registrations</div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f766e', marginTop: '4px' }}>{analytics.totalRegistrations}</div>
            <div style={{ fontSize: '11px', color: '#0d9488', fontWeight: 600, marginTop: '2px' }}>
              Citizen Passes Issued
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>People Screened</div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#2563eb', marginTop: '4px' }}>{analytics.totalScreened}</div>
            <div style={{ fontSize: '11px', color: '#1d4ed8', fontWeight: 600, marginTop: '2px' }}>
              Completed Checkups
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Specialist Referrals</div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#d97706', marginTop: '4px' }}>{analytics.totalReferrals}</div>
            <div style={{ fontSize: '11px', color: '#b45309', fontWeight: 600, marginTop: '2px' }}>
              Referred to District Civil Hospital
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '14px 18px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px' }}>
          <Search size={16} color="#64748b" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search camps by title, venue, doctor, or ASHA coordinator..."
            style={{
              border: 'none',
              outline: 'none',
              width: '100%',
              fontSize: '13px',
              fontWeight: 600,
              color: '#1e293b',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '12px',
              fontWeight: 700,
              color: '#334155',
              background: '#ffffff',
            }}
          >
            <option value="ALL">All Camp Types</option>
            <option value="GENERAL">General Health</option>
            <option value="EYE">Eye Screening</option>
            <option value="DENTAL">Dental Care</option>
            <option value="MATERNAL_CHILD">Maternal & Child</option>
            <option value="NCD_SCREENING">Diabetes & NCD</option>
            <option value="VACCINATION">Vaccination</option>
            <option value="AYUSH">AYUSH Wellness</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '12px',
              fontWeight: 700,
              color: '#334155',
              background: '#ffffff',
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="ONGOING">Live Ongoing</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Camps List / Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading health camps...</div>
      ) : filteredCamps.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '48px',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px dashed #cbd5e1',
          }}
        >
          <Calendar size={48} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#334155', margin: '0 0 4px' }}>
            No health camps match your filter criteria
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px' }}>
            Create a new community health camp or reset your filters.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            style={{
              background: '#0f766e',
              color: '#ffffff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            + Create New Health Camp
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
          {filteredCamps.map((camp) => {
            const typeBadge = getTypeBadge(camp.type);
            const statusBadge = getStatusBadge(camp.status);
            const percentFilled = Math.min(100, Math.round((camp.registeredCount / camp.capacity) * 100));
            const spotsRemaining = Math.max(0, camp.capacity - camp.registeredCount);

            return (
              <div
                key={camp.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                {/* Header Strip */}
                <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span
                        style={{
                          background: typeBadge.bg,
                          color: typeBadge.text,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 800,
                        }}
                      >
                        {typeBadge.label}
                      </span>
                      <span
                        style={{
                          background: statusBadge.bg,
                          color: statusBadge.text,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 800,
                        }}
                      >
                        {statusBadge.label}
                      </span>
                    </div>

                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>
                      {camp.campId}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px', lineHeight: 1.3 }}>
                    {camp.title}
                  </h3>
                  <p style={{ fontSize: '12px', color: '#475569', margin: 0, lineHeight: 1.4 }}>
                    {camp.description}
                  </p>
                </div>

                {/* Body Details */}
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#334155' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} color="#0f766e" />
                      <strong>Date:</strong> {camp.startDate} ({camp.time})
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <MapPin size={14} color="#ef4444" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div>
                        <strong>Venue:</strong> {camp.venue}
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{camp.phcName}</div>
                      </div>
                    </div>
                  </div>

                  {/* Assigned Staff & ASHA Pill (Linked) */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '10px',
                      padding: '8px 12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: '#166534',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '12px',
                        }}
                      >
                        {camp.assignedAssistantName ? camp.assignedAssistantName.charAt(0) : 'A'}
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#14532d' }}>
                          {camp.assignedAssistantName || 'ASHA Coordinator'}
                        </div>
                        <div style={{ fontSize: '10px', color: '#15803d', fontWeight: 600 }}>
                          {camp.assignedAssistantRole || 'Health Assistant'} • {camp.assignedDoctorName || 'Assigned Doctor'}
                        </div>
                      </div>
                    </div>

                    {camp.assignedAssistantId && (
                      <button
                        onClick={() => {
                          const asst = healthAssistants.find((a) => a.id === camp.assignedAssistantId);
                          if (asst) setActiveAssistantModal(asst);
                        }}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #bbf7d0',
                          borderRadius: '8px',
                          padding: '4px 8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#166534',
                          cursor: 'pointer',
                        }}
                      >
                        View Profile
                      </button>
                    )}
                  </div>

                  {/* Capacity Bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>
                      <span style={{ color: '#475569' }}>
                        Registrations: {camp.registeredCount} / {camp.capacity}
                      </span>
                      <span style={{ color: spotsRemaining === 0 ? '#dc2626' : '#0f766e' }}>
                        {spotsRemaining === 0 ? 'Full Capacity' : `${spotsRemaining} spots left`}
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${percentFilled}%`,
                          height: '100%',
                          background: spotsRemaining === 0 ? '#ef4444' : percentFilled > 80 ? '#f59e0b' : '#0f766e',
                          borderRadius: '3px',
                        }}
                      />
                    </div>
                  </div>

                  {/* Outcome Highlight if Completed */}
                  {camp.outcome && (
                    <div
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        fontSize: '11px',
                        color: '#334155',
                      }}
                    >
                      <div style={{ fontWeight: 800, color: '#0f766e', marginBottom: '2px' }}>
                        📊 Verified Camp Outcomes:
                      </div>
                      <div>
                        Screened: <strong>{camp.outcome.peopleScreened}</strong> • Referrals: <strong>{camp.outcome.referralsMade}</strong>
                        {camp.outcome.vaccinationsAdministered ? ` • Vaccines: ${camp.outcome.vaccinationsAdministered}` : ''}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div
                  style={{
                    padding: '12px 16px',
                    background: '#f8fafc',
                    borderTop: '1px solid #f1f5f9',
                    display: 'flex',
                    gap: '8px',
                  }}
                >
                  <button
                    onClick={() => handleOpenRoster(camp)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#0f172a',
                      fontWeight: 700,
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                    }}
                  >
                    <Users size={14} color="#0f766e" />
                    Registrations ({camp.registeredCount})
                  </button>

                  <button
                    onClick={() => handleSendReminders(camp)}
                    title="Send SMS/Push Reminders to Registered Participants"
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#334155',
                      fontWeight: 700,
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <BellRing size={14} color="#f59e0b" />
                    Remind
                  </button>

                  {camp.status !== 'COMPLETED' && (
                    <button
                      onClick={() => {
                        setActiveCampForOutcome(camp);
                        setOutcomeScreened(camp.registeredCount.toString());
                        setOutcomeReferrals('4');
                      }}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#0f766e',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      Record Outcome
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE HEALTH CAMP MODAL */}
      {isCreateModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '620px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div
              style={{
                padding: '18px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={20} color="#0f766e" />
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Create New Community Health Camp
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCamp} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Camp Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Free Eye Screening & Spectacles Camp"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Camp Type *
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', background: '#ffffff' }}
                  >
                    <option value="GENERAL">General Health</option>
                    <option value="EYE">Eye Screening</option>
                    <option value="DENTAL">Dental Care</option>
                    <option value="MATERNAL_CHILD">Maternal & Child</option>
                    <option value="NCD_SCREENING">Diabetes & NCD</option>
                    <option value="VACCINATION">Vaccination Drive</option>
                    <option value="AYUSH">AYUSH Wellness</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Participant Capacity (Cap) *
                  </label>
                  <input
                    type="number"
                    required
                    min="10"
                    max="500"
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Camp Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={(e) => {
                      setFormStartDate(e.target.value);
                      setFormEndDate(e.target.value);
                    }}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Timings *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    placeholder="09:00 AM - 03:00 PM"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Venue / Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={formVenue}
                    onChange={(e) => setFormVenue(e.target.value)}
                    placeholder="e.g. Sector 4 Community Hall, Karol Bagh"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Primary Health Centre (PHC) *
                  </label>
                  <select
                    value={formPHCId}
                    onChange={(e) => setFormPHCId(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', background: '#ffffff' }}
                  >
                    {phcs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Linked Staff Assignments */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    👩‍⚕️ Assigned Health Assistant / ASHA *
                  </label>
                  <select
                    value={formAssistantId}
                    onChange={(e) => setFormAssistantId(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', background: '#ffffff' }}
                  >
                    {healthAssistants.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.fullName} ({a.designation})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    🩺 Assigned Medical Doctor *
                  </label>
                  <select
                    value={formDoctorId}
                    onChange={(e) => setFormDoctorId(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', background: '#ffffff' }}
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.fullName} ({d.specialization})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Services Offered (Comma Separated)
                </label>
                <input
                  type="text"
                  value={formServices}
                  onChange={(e) => setFormServices(e.target.value)}
                  placeholder="e.g. Cataract Check, Slit Lamp, Free Spectacles"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Description & Camp Details
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Provide clinical details, tests available, and instructions for patients..."
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    flex: 2,
                    padding: '11px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#0f766e',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '13px',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isSubmitting ? 'Publishing...' : 'Publish & Announce Health Camp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGISTRATION ROSTER & ATTENDANCE DRAWER */}
      {activeCampForRoster && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              width: '100%',
              maxWidth: '560px',
              height: '100vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-10px 0 25px rgba(0,0,0,0.15)',
            }}
          >
            {/* Drawer Header */}
            <div
              style={{
                padding: '20px',
                borderBottom: '1px solid #e2e8f0',
                background: '#f8fafc',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#0f766e', textTransform: 'uppercase' }}>
                  Participant Roster & Attendance
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '2px 0 4px' }}>
                  {activeCampForRoster.title}
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  📅 {activeCampForRoster.startDate} • 📍 {activeCampForRoster.venue}
                </div>
              </div>
              <button
                onClick={() => setActiveCampForRoster(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Roster Summary Bar */}
            {rosterStats && (
              <div
                style={{
                  padding: '12px 20px',
                  background: '#f0fdf4',
                  borderBottom: '1px solid #bbf7d0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                }}
              >
                <div>
                  Registered: <strong>{rosterStats.total}</strong> / {activeCampForRoster.capacity}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <span style={{ color: '#16a34a', fontWeight: 700 }}>Attended: {rosterStats.attended}</span>
                  <span style={{ color: '#dc2626', fontWeight: 700 }}>No-Show: {rosterStats.noShow}</span>
                  <span style={{ color: '#0f766e', fontWeight: 700 }}>Pending: {rosterStats.pending}</span>
                </div>
              </div>
            )}

            {/* Roster Table / List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              {loadingRoster ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading roster...</div>
              ) : rosterRegistrations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No participants registered yet for this camp.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {rosterRegistrations.map((reg) => (
                    <div
                      key={reg.id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: '#ccfbf1',
                            color: '#0f766e',
                            fontWeight: 900,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '13px',
                          }}
                        >
                          #{reg.tokenNumber}
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                            {reg.participantName}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {reg.participantAge} yrs • {reg.participantGender} • 📞 {reg.participantPhone}
                          </div>
                          {reg.notes && (
                            <div style={{ fontSize: '11px', color: '#0f766e', fontStyle: 'italic', marginTop: '2px' }}>
                              Notes: {reg.notes}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Attendance Action Controls */}
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {reg.status === 'ATTENDED' ? (
                          <span
                            style={{
                              background: '#dcfce7',
                              color: '#166534',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '11px',
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Check size={13} /> Attended
                          </span>
                        ) : reg.status === 'NO_SHOW' ? (
                          <span
                            style={{
                              background: '#fee2e2',
                              color: '#b91c1c',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '11px',
                              fontWeight: 800,
                            }}
                          >
                            No-Show
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleMarkAttendance(reg.id, 'ATTENDED')}
                              style={{
                                background: '#0f766e',
                                color: '#ffffff',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Mark Present
                            </button>
                            <button
                              onClick={() => handleMarkAttendance(reg.id, 'NO_SHOW')}
                              style={{
                                background: '#f1f5f9',
                                color: '#64748b',
                                border: '1px solid #cbd5e1',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Absent
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', gap: '10px' }}>
              <button
                onClick={() => handleSendReminders(activeCampForRoster)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#334155',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <BellRing size={14} color="#f59e0b" />
                Broadcast Camp Reminder SMS/Push
              </button>
              <button
                onClick={() => setActiveCampForRoster(null)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#0f766e',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECORD OUTCOME MODAL */}
      {activeCampForOutcome && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div
              style={{
                padding: '18px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Record Camp Outcomes & Conclude Camp
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  {activeCampForOutcome.title}
                </div>
              </div>
              <button
                onClick={() => setActiveCampForOutcome(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRecordOutcome} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Total People Screened *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={outcomeScreened}
                    onChange={(e) => setOutcomeScreened(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Specialist Referrals Made *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={outcomeReferrals}
                    onChange={(e) => setOutcomeReferrals(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Vaccinations Given
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={outcomeVaccinations}
                    onChange={(e) => setOutcomeVaccinations(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Medicines Kits Distributed
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={outcomeMedicines}
                    onChange={(e) => setOutcomeMedicines(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Outcome Notes & Epidemiological Observations
                </label>
                <textarea
                  rows={3}
                  value={outcomeNotes}
                  onChange={(e) => setOutcomeNotes(e.target.value)}
                  placeholder="e.g. 5 cases of early cataract referred to Civil Hospital for surgery; High prevalence of pre-hypertension noted among seniors."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setActiveCampForOutcome(null)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOutcome}
                  style={{
                    flex: 2,
                    padding: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#0f766e',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: submittingOutcome ? 'not-allowed' : 'pointer',
                  }}
                >
                  {submittingOutcome ? 'Submitting...' : 'Save & Mark Camp as Completed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HEALTH ASSISTANT PROFILE MODAL */}
      {activeAssistantModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '420px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, #0f766e, #0d9488)',
                padding: '20px',
                color: '#ffffff',
                textAlign: 'center',
                position: 'relative',
              }}
            >
              <button
                onClick={() => setActiveAssistantModal(null)}
                style={{ position: 'absolute', top: '14px', right: '14px', background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  color: '#0f766e',
                  fontSize: '24px',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
              >
                {activeAssistantModal.fullName.charAt(0)}
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px' }}>
                {activeAssistantModal.fullName}
              </h3>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>
                {activeAssistantModal.designation} • {activeAssistantModal.assistantId}
              </div>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: '#334155' }}>
              <div>
                <strong>Primary Health Centre:</strong> {activeAssistantModal.phcName || 'Central Urban PHC'}
              </div>
              <div>
                <strong>Experience:</strong> {activeAssistantModal.yearsOfExperience} Years Community Healthcare
              </div>
              <div>
                <strong>Languages Spoken:</strong> {activeAssistantModal.languages.join(', ')}
              </div>
              <div>
                <strong>Specializations:</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                  {activeAssistantModal.specializations.map((s, i) => (
                    <span key={i} style={{ background: '#f0fdf4', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '8px' }}>
                <button
                  onClick={() => {
                    setActiveAssistantModal(null);
                    if (onNavigateTab) {
                      onNavigateTab('assistant', { assistantId: activeAssistantModal.id });
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '11px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#0f766e',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Open Live Tele-Care Workspace
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default HealthCampDashboard;
