import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Building2,
  User,
  UserCheck,
  Send,
  X,
  Paperclip,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  Eye,
  SlidersHorizontal,
  ArrowUpDown,
  FileSpreadsheet,
  Phone,
  Mail,
  Calendar,
  Layers,
  Sparkles,
  AlertCircle,
  Tag,
  Lock,
} from 'lucide-react';
import {
  Complaint,
  ComplaintCategory,
  ComplaintStatus,
  ComplaintPriority,
  ComplaintSummaryMetrics,
  DoctorProfile,
  PharmacistProfile,
  ReceptionistProfile,
  PHC,
  UserRole,
} from '@phc-connect/types';
import { apiClient } from '../services/api';

interface Props {
  currentRole?: UserRole;
}

const CATEGORY_ICONS: Record<ComplaintCategory, string> = {
  SERVICE_QUALITY: '🩺',
  STAFF_BEHAVIOUR: '👨‍⚕️',
  MEDICINE_AVAILABILITY: '💊',
  FACILITY_CLEANLINESS: '🏥',
  WAIT_TIME: '⏱️',
  OTHER: '📝',
};

const CATEGORY_NAMES: Record<ComplaintCategory, string> = {
  SERVICE_QUALITY: 'Service Quality',
  STAFF_BEHAVIOUR: 'Staff Behaviour',
  MEDICINE_AVAILABILITY: 'Medicine Availability',
  FACILITY_CLEANLINESS: 'Facility / Cleanliness',
  WAIT_TIME: 'Long Wait Time',
  OTHER: 'General / Other',
};

export const ComplaintsManagementDashboard: React.FC<Props> = ({ currentRole = 'ADMIN' }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [metrics, setMetrics] = useState<ComplaintSummaryMetrics | null>(null);
  const [phcs, setPhcs] = useState<PHC[]>([]);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [pharmacists, setPharmacists] = useState<PharmacistProfile[]>([]);
  const [receptionists, setReceptionists] = useState<ReceptionistProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterPhc, setFilterPhc] = useState<string>('ALL');

  // Selected Complaint for Drawer / Action Modal
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // Status Update State
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('IN_PROGRESS');
  const [statusNote, setStatusNote] = useState<string>('');
  const [resolutionSummary, setResolutionSummary] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);

  // Assignment State
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [assigneeName, setAssigneeName] = useState<string>('');
  const [assigneeRole, setAssigneeRole] = useState<UserRole>('DOCTOR');
  const [assignNote, setAssignNote] = useState<string>('');
  const [assigning, setAssigning] = useState<boolean>(false);

  // Reply Thread State
  const [replyMessage, setReplyMessage] = useState<string>('');
  const [isInternalNote, setIsInternalNote] = useState<boolean>(false);
  const [sendingReply, setSendingReply] = useState<boolean>(false);

  // Toast / Notice
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadAllData();
  }, [filterStatus, filterCategory, filterPriority, filterPhc]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterStatus !== 'ALL') params.status = filterStatus;
      if (filterCategory !== 'ALL') params.category = filterCategory;
      if (filterPriority !== 'ALL') params.priority = filterPriority;
      if (filterPhc !== 'ALL') params.phcId = filterPhc;
      if (searchQuery) params.search = searchQuery;

      const [complaintsRes, phcsRes, docsRes, pharmRes, recRes] = await Promise.all([
        apiClient.get('/complaints', params),
        apiClient.get('/phcs'),
        apiClient.get('/doctors'),
        apiClient.get('/pharmacist/overview').catch(() => ({})),
        apiClient.get('/receptionist/overview').catch(() => ({})),
      ]);

      if (complaintsRes.success) {
        setComplaints(complaintsRes.complaints || []);
        if (complaintsRes.metrics) {
          setMetrics(complaintsRes.metrics);
        }
      }
      if (phcsRes.success) {
        setPhcs(phcsRes.phcs || []);
      }
      if (docsRes.success) {
        setDoctors(docsRes.doctors || []);
      }
      if (pharmRes.success && pharmRes.pharmacist) {
        setPharmacists([pharmRes.pharmacist]);
      }
      if (recRes.success && recRes.receptionist) {
        setReceptionists([recRes.receptionist]);
      }
    } catch (err) {
      console.error('Error loading complaints dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Open Drawer and initialize state
  const handleOpenDrawer = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setNewStatus(complaint.status);
    setStatusNote('');
    setResolutionSummary(complaint.resolutionNotes || '');
    setAssigneeId(complaint.assignedToId || (doctors[0]?.id ?? ''));
    setAssigneeName(complaint.assignedToName || (doctors[0]?.fullName ?? ''));
    setAssigneeRole(complaint.assignedToRole || 'DOCTOR');
    setAssignNote('');
    setReplyMessage('');
    setIsInternalNote(false);
  };

  // 1. Submit Status Update
  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    if (newStatus === 'RESOLVED' && !resolutionSummary.trim()) {
      alert('Please provide a mandatory resolution summary note explaining the action taken.');
      return;
    }

    try {
      setUpdatingStatus(true);
      const payload: any = {
        status: newStatus,
        note: statusNote.trim() || `Status updated to ${newStatus}`,
      };
      if (newStatus === 'RESOLVED' || resolutionSummary.trim()) {
        payload.resolutionNotes = resolutionSummary.trim();
      }

      const res = await apiClient.patch(`/complaints/${selectedComplaint.id}/status`, payload);
      if (res.success && res.complaint) {
        setSelectedComplaint(res.complaint);
        setComplaints((prev) => prev.map((c) => (c.id === res.complaint.id ? res.complaint : c)));
        showToast(`Complaint ${res.complaint.complaintId} status updated to ${newStatus}. Citizen notified.`);
        loadAllData();
      } else {
        alert(res.error || 'Failed to update status.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // 2. Submit Assignment
  const handleAssignComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint || !assigneeName) return;

    try {
      setAssigning(true);
      const payload = {
        assignedToId: assigneeId,
        assignedToName: assigneeName,
        assignedToRole: assigneeRole,
        note: assignNote.trim() || `Assigned to ${assigneeName} (${assigneeRole}) for investigation.`,
      };

      const res = await apiClient.patch(`/complaints/${selectedComplaint.id}/assign`, payload);
      if (res.success && res.complaint) {
        setSelectedComplaint(res.complaint);
        setComplaints((prev) => prev.map((c) => (c.id === res.complaint.id ? res.complaint : c)));
        showToast(`Grievance ${res.complaint.complaintId} assigned to ${assigneeName}.`);
        loadAllData();
      } else {
        alert(res.error || 'Failed to assign complaint.');
      }
    } catch (err) {
      console.error(err);
      alert('Error assigning officer.');
    } finally {
      setAssigning(false);
    }
  };

  // 3. Post Reply / Remark
  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint || !replyMessage.trim()) return;

    try {
      setSendingReply(true);
      const res = await apiClient.post(`/complaints/${selectedComplaint.id}/reply`, {
        message: replyMessage.trim(),
        isInternal: isInternalNote,
      });

      if (res.success && res.reply) {
        const updated = {
          ...selectedComplaint,
          replies: [...selectedComplaint.replies, res.reply],
        };
        setSelectedComplaint(updated);
        setComplaints((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        setReplyMessage('');
        showToast(isInternalNote ? 'Internal staff note recorded.' : 'Official reply sent to citizen.');
      } else {
        alert(res.error || 'Failed to post reply.');
      }
    } catch (err) {
      console.error(err);
      alert('Error posting reply.');
    } finally {
      setSendingReply(false);
    }
  };

  const getStatusBadge = (status: ComplaintStatus) => {
    switch (status) {
      case 'OPEN':
        return {
          bg: '#fff7ed',
          color: '#c2410c',
          border: '#fdba74',
          label: 'Open',
          icon: <Clock size={12} />,
        };
      case 'IN_PROGRESS':
        return {
          bg: '#eff6ff',
          color: '#1d4ed8',
          border: '#93c5fd',
          label: 'In Progress',
          icon: <RefreshCw size={12} className="spin-slow" />,
        };
      case 'RESOLVED':
        return {
          bg: '#f0fdf4',
          color: '#15803d',
          border: '#86efac',
          label: 'Resolved',
          icon: <CheckCircle2 size={12} />,
        };
      case 'CLOSED':
        return {
          bg: '#f8fafc',
          color: '#475569',
          border: '#cbd5e1',
          label: 'Closed',
          icon: <CheckCircle2 size={12} />,
        };
      default:
        return {
          bg: '#f1f5f9',
          color: '#334155',
          border: '#cbd5e1',
          label: status,
          icon: <AlertCircle size={12} />,
        };
    }
  };

  const getPriorityBadge = (p: ComplaintPriority) => {
    switch (p) {
      case 'URGENT':
        return { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5', label: 'Urgent' };
      case 'HIGH':
        return { bg: '#ffedd5', color: '#c2410c', border: '#fdba74', label: 'High' };
      case 'MEDIUM':
        return { bg: '#fef9c3', color: '#854d0e', border: '#fde047', label: 'Medium' };
      case 'LOW':
      default:
        return { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1', label: 'Low' };
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.complaintId.toLowerCase().includes(q) ||
      c.userName.toLowerCase().includes(q) ||
      c.subject.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.phcName.toLowerCase().includes(q) ||
      (c.assignedToName && c.assignedToName.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            background: '#0f172a',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            fontWeight: 700,
            border: '1px solid rgba(255,255,255,0.1)',
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <CheckCircle2 size={18} color="#4ade80" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Header */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '20px 24px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #0f766e, #115e59)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(15, 118, 110, 0.25)',
            }}
          >
            <AlertCircle size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                Citizen Grievance Redressal & Support Terminal
              </h2>
              <span
                style={{
                  background: '#ccfbf1',
                  color: '#0f766e',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  textTransform: 'uppercase',
                }}
              >
                District MOIC Portal
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
              Audit trail, multi-department investigations, staff assignment & resolution workflows
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={loadAllData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              fontSize: '12px',
              fontWeight: 700,
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin-slow' : ''} />
            <span>Sync Live</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards Grid */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card">
          <div>
            <span className="stat-label">Total Grievances</span>
            <div className="stat-val">{metrics?.total ?? complaints.length}</div>
          </div>
          <div className="stat-icon" style={{ background: '#f1f5f9', color: '#334155' }}>
            <Layers size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <span className="stat-label">Open / Unassigned</span>
            <div className="stat-val" style={{ color: '#ea580c' }}>
              {metrics?.open ?? complaints.filter((c) => c.status === 'OPEN').length}
            </div>
          </div>
          <div className="stat-icon" style={{ background: '#fff7ed', color: '#ea580c' }}>
            <Clock size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <span className="stat-label">Under Investigation</span>
            <div className="stat-val" style={{ color: '#2563eb' }}>
              {metrics?.inProgress ?? complaints.filter((c) => c.status === 'IN_PROGRESS').length}
            </div>
          </div>
          <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <RefreshCw size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <span className="stat-label">Resolved & Closed</span>
            <div className="stat-val" style={{ color: '#16a34a' }}>
              {(metrics?.resolved ?? 0) + (metrics?.closed ?? 0) ||
                complaints.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED').length}
            </div>
          </div>
          <div className="stat-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <span className="stat-label">Avg. Resolution Time</span>
            <div className="stat-val" style={{ color: '#0f766e' }}>
              {metrics?.avgResolutionHours ?? 18.5} hrs
            </div>
          </div>
          <div className="stat-icon" style={{ background: '#e0f2f1', color: '#0f766e' }}>
            <ShieldCheck size={22} />
          </div>
        </div>
      </div>

      {/* Advanced Filter Toolbar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          padding: '14px 18px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1, minWidth: '300px' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={16}
              color="#94a3b8"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Search by Complaint ID, citizen name, health centre or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                outline: 'none',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '12px',
              background: '#ffffff',
              fontWeight: 600,
            }}
          >
            <option value="ALL">Status: All</option>
            <option value="OPEN">Status: Open / Pending</option>
            <option value="IN_PROGRESS">Status: In Progress</option>
            <option value="RESOLVED">Status: Resolved</option>
            <option value="CLOSED">Status: Closed</option>
          </select>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '12px',
              background: '#ffffff',
              fontWeight: 600,
            }}
          >
            <option value="ALL">Category: All</option>
            <option value="SERVICE_QUALITY">🩺 Service Quality</option>
            <option value="STAFF_BEHAVIOUR">👨‍⚕️ Staff Behaviour</option>
            <option value="MEDICINE_AVAILABILITY">💊 Medicine Stock</option>
            <option value="FACILITY_CLEANLINESS">🏥 Facility & Cleanliness</option>
            <option value="WAIT_TIME">⏱️ Wait Time</option>
            <option value="OTHER">📝 Other / General</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '12px',
              background: '#ffffff',
              fontWeight: 600,
            }}
          >
            <option value="ALL">Priority: All</option>
            <option value="URGENT">🔴 Urgent</option>
            <option value="HIGH">🟠 High</option>
            <option value="MEDIUM">🟡 Medium</option>
            <option value="LOW">⚪ Low</option>
          </select>

          {/* PHC Centre Filter */}
          <select
            value={filterPhc}
            onChange={(e) => setFilterPhc(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '12px',
              background: '#ffffff',
              fontWeight: 600,
            }}
          >
            <option value="ALL">PHC: All Centres</option>
            {phcs.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Reset Filters */}
          {(filterStatus !== 'ALL' || filterCategory !== 'ALL' || filterPriority !== 'ALL' || filterPhc !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setFilterStatus('ALL');
                setFilterCategory('ALL');
                setFilterPriority('ALL');
                setFilterPhc('ALL');
                setSearchQuery('');
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid #fca5a5',
                background: '#fee2e2',
                color: '#dc2626',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Complaints Registry Table */}
      <div className="table-container" style={{ background: '#ffffff', borderRadius: '16px', overflow: 'hidden' }}>
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b', margin: 0 }}>
              Grievance Registry ({filteredComplaints.length})
            </h3>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Showing {filteredComplaints.length} registered citizen feedback tickets
            </span>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={28} className="spin-slow" style={{ margin: '0 auto 10px auto', display: 'block', color: '#0f766e' }} />
            Loading complaint records...
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            <AlertCircle size={36} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#475569' }}>No grievances found matching criteria.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Grievance ID</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Citizen Details</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Category & Subject</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Health Centre</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Priority</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Assigned Officer</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Date</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.map((c) => {
                const statusMeta = getStatusBadge(c.status);
                const prioMeta = getPriorityBadge(c.priority);
                const isUrgent = c.priority === 'URGENT' || c.priority === 'HIGH';

                return (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      background: isUrgent && c.status === 'OPEN' ? '#fffbeb' : undefined,
                      transition: 'background 0.15s ease',
                    }}
                  >
                    {/* Grievance ID */}
                    <td style={{ padding: '12px 16px' }}>
                      <strong style={{ fontSize: '13px', color: '#0f766e', fontWeight: 800, letterSpacing: '0.3px' }}>
                        {c.complaintId}
                      </strong>
                    </td>

                    {/* Citizen Details */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                          {c.userName}
                        </span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          {c.userPhone || c.userEmail || 'Citizen'}
                        </span>
                      </div>
                    </td>

                    {/* Category & Subject */}
                    <td style={{ padding: '12px 16px', maxWidth: '280px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <span style={{ fontSize: '14px' }}>{CATEGORY_ICONS[c.category]}</span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#0f766e' }}>
                          {CATEGORY_NAMES[c.category]}
                        </span>
                        {c.attachmentUrl && (
                          <span title="Evidence photo attached" style={{ color: '#0284c7', display: 'inline-flex' }}>
                            <Paperclip size={12} />
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#334155',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {c.subject}
                      </div>
                    </td>

                    {/* Health Centre */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '12px', color: '#334155', fontWeight: 600 }}>
                        {c.phcName}
                      </span>
                    </td>

                    {/* Priority */}
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          background: prioMeta.bg,
                          color: prioMeta.color,
                          border: `1px solid ${prioMeta.border}`,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '10px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                        }}
                      >
                        {prioMeta.label}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          background: statusMeta.bg,
                          color: statusMeta.color,
                          border: `1px solid ${statusMeta.border}`,
                          padding: '3px 8px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {statusMeta.icon}
                        <span>{statusMeta.label}</span>
                      </span>
                    </td>

                    {/* Assigned Officer */}
                    <td style={{ padding: '12px 16px' }}>
                      {c.assignedToName ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <UserCheck size={14} color="#0f766e" />
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>
                            {c.assignedToName}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#ea580c', fontWeight: 700, background: '#fff7ed', padding: '2px 6px', borderRadius: '4px' }}>
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td style={{ padding: '12px 16px', fontSize: '11px', color: '#64748b' }}>
                      {new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleOpenDrawer(c)}
                        style={{
                          background: '#0f766e',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: '0 2px 6px rgba(15, 118, 110, 0.2)',
                        }}
                      >
                        <Eye size={13} />
                        <span>Inspect & Act</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ACTION DRAWER / MODAL: DETAILED INVESTIGATION & RESOLUTION PANEL         */}
      {/* ========================================================================= */}
      {selectedComplaint && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div
            className="modal-card"
            style={{
              maxWidth: '850px',
              width: '94%',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '24px',
              borderRadius: '20px',
              background: '#ffffff',
            }}
          >
            {/* Drawer Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '16px',
                marginBottom: '16px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '20px' }}>{CATEGORY_ICONS[selectedComplaint.category]}</span>
                  <strong style={{ fontSize: '16px', color: '#0f766e', fontWeight: 800 }}>
                    {selectedComplaint.complaintId}
                  </strong>
                  <span
                    style={{
                      background: getPriorityBadge(selectedComplaint.priority).bg,
                      color: getPriorityBadge(selectedComplaint.priority).color,
                      border: `1px solid ${getPriorityBadge(selectedComplaint.priority).border}`,
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {selectedComplaint.priority} Priority
                  </span>
                  <span
                    style={{
                      background: getStatusBadge(selectedComplaint.status).bg,
                      color: getStatusBadge(selectedComplaint.status).color,
                      border: `1px solid ${getStatusBadge(selectedComplaint.status).border}`,
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '20px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {getStatusBadge(selectedComplaint.status).icon}
                    <span>{getStatusBadge(selectedComplaint.status).label}</span>
                  </span>
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                  {selectedComplaint.subject}
                </h3>
              </div>

              <button
                onClick={() => setSelectedComplaint(null)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={18} color="#64748b" />
              </button>
            </div>

            {/* 2-Column Content Layout: Left Metadata & Description, Right Action Workflows */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
              {/* Left Column: Complaint Details, Citizen Info, Attachment, History */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Citizen Meta Card */}
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                    Complainant & Location Info
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '10px' }}>Citizen Name</span>
                      <strong style={{ color: '#1e293b' }}>{selectedComplaint.userName}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '10px' }}>Phone / Email</span>
                      <span style={{ color: '#1e293b', fontWeight: 600 }}>{selectedComplaint.userPhone || selectedComplaint.userEmail || 'N/A'}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '10px' }}>Health Centre</span>
                      <strong style={{ color: '#0f766e' }}>{selectedComplaint.phcName}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '10px' }}>Registered At</span>
                      <span style={{ color: '#1e293b', fontWeight: 600 }}>{new Date(selectedComplaint.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Grievance Description */}
                <div>
                  <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Grievance Description
                  </h4>
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      padding: '12px',
                      fontSize: '13px',
                      lineHeight: 1.5,
                      color: '#1e293b',
                    }}
                  >
                    {selectedComplaint.description}
                  </div>
                </div>

                {/* Attachment Preview (if any) */}
                {selectedComplaint.attachmentUrl && (
                  <div>
                    <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Citizen Uploaded Evidence
                    </h4>
                    <div
                      style={{
                        border: '1px solid #bfdbfe',
                        background: '#eff6ff',
                        borderRadius: '12px',
                        padding: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={selectedComplaint.attachmentUrl}
                          alt="evidence"
                          style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px' }}
                        />
                        <div>
                          <strong style={{ fontSize: '12px', color: '#1e293b', display: 'block' }}>
                            {selectedComplaint.attachmentName || 'evidence_photo.jpg'}
                          </strong>
                          <span style={{ fontSize: '11px', color: '#1d4ed8' }}>Click to view full resolution</span>
                        </div>
                      </div>

                      <a
                        href={selectedComplaint.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          background: '#1d4ed8',
                          color: '#ffffff',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <ExternalLink size={12} /> View Full
                      </a>
                    </div>
                  </div>
                )}

                {/* Status Timeline & Audit Trail */}
                <div>
                  <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Status & Action Audit History
                  </h4>
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    {selectedComplaint.history?.map((h) => (
                      <div
                        key={h.id}
                        style={{
                          borderLeft: '3px solid #0f766e',
                          paddingLeft: '10px',
                          fontSize: '11px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                          <strong style={{ color: '#0f766e' }}>
                            {h.toStatus} • {h.actorName} ({h.actorRole})
                          </strong>
                          <span style={{ color: '#94a3b8' }}>
                            {new Date(h.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p style={{ color: '#334155', margin: 0, lineHeight: 1.4 }}>
                          {h.note}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Status Transition, Assign Officer, Communication Thread */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Action Box 1: Update Status (State Machine) */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '14px',
                    padding: '16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  }}
                >
                  <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <RefreshCw size={15} color="#0f766e" /> Update Grievance Status
                  </h4>

                  <form onSubmit={handleUpdateStatus} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                        Target Status
                      </label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as ComplaintStatus)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '12px',
                          fontWeight: 700,
                          background: '#f8fafc',
                        }}
                      >
                        <option value="OPEN">OPEN (Initial Review)</option>
                        <option value="IN_PROGRESS">IN_PROGRESS (Investigation Active)</option>
                        <option value="RESOLVED">RESOLVED (Action Taken & Remedy Provided)</option>
                        <option value="CLOSED">CLOSED (Case Finalized)</option>
                      </select>
                    </div>

                    {newStatus === 'RESOLVED' && (
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#15803d', marginBottom: '4px' }}>
                          Official Resolution Summary <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <textarea
                          required
                          rows={2}
                          placeholder="Detail the remedial actions taken (e.g., medicine batch restocked, sanitation completed, roster adjusted)..."
                          value={resolutionSummary}
                          onChange={(e) => setResolutionSummary(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            border: '1px solid #86efac',
                            background: '#f0fdf4',
                            fontSize: '12px',
                            resize: 'none',
                          }}
                        />
                      </div>
                    )}

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                        Audit Trail Remarks (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Internal notes on this status change..."
                        value={statusNote}
                        onChange={(e) => setStatusNote(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '12px',
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={updatingStatus}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#0f766e',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: updatingStatus ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 6px rgba(15, 118, 110, 0.25)',
                      }}
                    >
                      {updatingStatus ? <RefreshCw size={14} className="spin-slow" /> : <CheckCircle2 size={14} />}
                      <span>Update Status & Notify Citizen</span>
                    </button>
                  </form>
                </div>

                {/* Action Box 2: Assign Officer */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '14px',
                    padding: '16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  }}
                >
                  <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <UserCheck size={15} color="#2563eb" /> Assign Medical / Facility Officer
                  </h4>

                  <form onSubmit={handleAssignComplaint} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                        Select Staff Officer
                      </label>
                      <select
                        value={assigneeId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setAssigneeId(id);
                          const doc = doctors.find((d) => d.id === id);
                          if (doc) {
                            setAssigneeName(doc.fullName);
                            setAssigneeRole('DOCTOR');
                          } else if (id === 'admin-001') {
                            setAssigneeName('Dr. Vandana Rao (Medical Officer In-Charge)');
                            setAssigneeRole('ADMIN');
                          } else if (id === 'pharm-001') {
                            setAssigneeName('Suresh Raina (Chief Pharmacist)');
                            setAssigneeRole('PHARMACIST');
                          } else if (id === 'rec-001') {
                            setAssigneeName('Pooja Sharma (Receptionist)');
                            setAssigneeRole('RECEPTIONIST');
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '12px',
                          fontWeight: 700,
                          background: '#f8fafc',
                        }}
                      >
                        <optgroup label="Administrators & MOIC">
                          <option value="admin-001">Dr. Vandana Rao (Medical Officer In-Charge)</option>
                        </optgroup>
                        <optgroup label="Doctors & Medical Specialists">
                          {doctors.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.fullName} ({d.specialization})
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Pharmacy & Facilities">
                          <option value="pharm-001">Suresh Raina (Chief Pharmacist)</option>
                          <option value="rec-001">Pooja Sharma (Front Desk Officer)</option>
                        </optgroup>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                        Assignment Directive / Instruction Note
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Investigate OPD counter delay and report back..."
                        value={assignNote}
                        onChange={(e) => setAssignNote(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '12px',
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={assigning}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#2563eb',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: assigning ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
                      }}
                    >
                      {assigning ? <RefreshCw size={14} className="spin-slow" /> : <UserCheck size={14} />}
                      <span>Assign Officer</span>
                    </button>
                  </form>
                </div>

                {/* Action Box 3: Communication & Replies */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '14px',
                    padding: '16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  }}
                >
                  <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Send size={15} color="#0f766e" /> Official Replies & Communication
                  </h4>

                  {/* Thread History */}
                  <div
                    style={{
                      maxHeight: '140px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      marginBottom: '10px',
                      padding: '8px',
                      background: '#f8fafc',
                      borderRadius: '10px',
                    }}
                  >
                    {selectedComplaint.replies && selectedComplaint.replies.length > 0 ? (
                      selectedComplaint.replies.map((r) => (
                        <div
                          key={r.id}
                          style={{
                            background: r.isInternal ? '#fffbeb' : '#ffffff',
                            border: `1px solid ${r.isInternal ? '#fde68a' : '#e2e8f0'}`,
                            borderRadius: '8px',
                            padding: '8px',
                            fontSize: '11px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <strong style={{ color: r.isInternal ? '#b45309' : '#0f766e' }}>
                              {r.authorName} ({r.authorRole}) {r.isInternal && '🔒 [INTERNAL]'}
                            </strong>
                            <span style={{ color: '#94a3b8' }}>{new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p style={{ margin: 0, color: '#334155' }}>{r.message}</p>
                        </div>
                      ))
                    ) : (
                      <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center' }}>
                        No replies posted yet.
                      </span>
                    )}
                  </div>

                  {/* Reply Form */}
                  <form onSubmit={handlePostReply} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="replyType"
                          checked={!isInternalNote}
                          onChange={() => setIsInternalNote(false)}
                        />
                        <span style={{ fontWeight: 700, color: '#0f766e' }}>Public Reply (Citizen Visible)</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="replyType"
                          checked={isInternalNote}
                          onChange={() => setIsInternalNote(true)}
                        />
                        <span style={{ fontWeight: 700, color: '#b45309' }}>🔒 Internal Note</span>
                      </label>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="text"
                        placeholder={isInternalNote ? 'Write internal investigation note...' : 'Write official reply to citizen...'}
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '12px',
                        }}
                      />
                      <button
                        type="submit"
                        disabled={sendingReply || !replyMessage.trim()}
                        style={{
                          background: isInternalNote ? '#b45309' : '#0f766e',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0 12px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: sendingReply || !replyMessage.trim() ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Send size={13} />
                        <span>Send</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
