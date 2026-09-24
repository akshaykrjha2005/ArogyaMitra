import React, { useState, useEffect } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneForwarded,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  Building2,
  User,
  UserCheck,
  Send,
  X,
  Play,
  Square,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Plus,
  Calendar,
  Layers,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Check,
  Copy,
  FileText,
  Activity,
  SlidersHorizontal,
} from 'lucide-react';
import {
  CallbackRequest,
  CallbackRequestStatus,
  CallLogEntry,
  CallLogOutcome,
  CallLogDirection,
  HelplineContact,
  HelplineCategory,
  TelephonyCallSession,
  UserRole,
  PHC,
} from '@phc-connect/types';
import { apiClient } from '../services/api';

interface CallServicesDashboardProps {
  currentRole?: UserRole;
  phcId?: string;
}

const OUTCOME_CONFIG: Record<CallLogOutcome, { label: string; bg: string; color: string; border: string }> = {
  CONNECTED: { label: 'Connected', bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
  CALLBACK_RESOLVED: { label: 'Callback Resolved', bg: '#ccfbf1', color: '#0f766e', border: '#99f6e4' },
  BUSY: { label: 'Line Busy', bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
  NO_ANSWER: { label: 'No Answer / Ringing', bg: '#fee2e2', color: '#b91c1c', border: '#fecaca' },
  FAILED: { label: 'Call Failed', bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' },
};

export const CallServicesDashboard: React.FC<CallServicesDashboardProps> = ({
  currentRole = 'ADMIN',
  phcId = 'phc-001',
}) => {
  // Navigation Sub-Tabs
  const [activeTab, setActiveTab] = useState<'queue' | 'dialer' | 'logs' | 'directory'>('queue');

  // Callback Queue State
  const [callbackRequests, setCallbackRequests] = useState<CallbackRequest[]>([]);
  const [queueMetrics, setQueueMetrics] = useState<{
    total: number;
    pending: number;
    called: number;
    missed: number;
    completed: number;
  }>({ total: 0, pending: 0, called: 0, missed: 0, completed: 0 });
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPhc, setSelectedPhc] = useState<string>('ALL');
  const [loadingQueue, setLoadingQueue] = useState<boolean>(true);

  // Call Logs State
  const [callLogs, setCallLogs] = useState<CallLogEntry[]>([]);
  const [logMetrics, setLogMetrics] = useState<{
    totalCalls: number;
    connectedCalls: number;
    busyOrMissed: number;
    totalDurationSeconds: number;
    avgDurationSeconds: number;
  }>({ totalCalls: 0, connectedCalls: 0, busyOrMissed: 0, totalDurationSeconds: 0, avgDurationSeconds: 0 });
  const [outcomeFilter, setOutcomeFilter] = useState<string>('ALL');
  const [directionFilter, setDirectionFilter] = useState<string>('ALL');
  const [logSearchQuery, setLogSearchQuery] = useState<string>('');
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);

  // Helplines Directory State
  const [helplines, setHelplines] = useState<HelplineContact[]>([]);
  const [loadingHelplines, setLoadingHelplines] = useState<boolean>(false);

  // PHC List
  const [phcList, setPhcList] = useState<PHC[]>([]);

  // Telephony Softphone Simulator State
  const [dialerNumber, setDialerNumber] = useState<string>('');
  const [dialerName, setDialerName] = useState<string>('');
  const [dialerPurpose, setDialerPurpose] = useState<string>('Callback Resolution & Consultation');
  const [activeCallSession, setActiveCallSession] = useState<TelephonyCallSession | null>(null);
  const [linkedCallbackId, setLinkedCallbackId] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeaker, setIsSpeaker] = useState<boolean>(true);
  const [callNotes, setCallNotes] = useState<string>('');
  const [selectedOutcome, setSelectedOutcome] = useState<CallLogOutcome>('CALLBACK_RESOLVED');
  const [callStatusState, setCallStatusState] = useState<'IDLE' | 'DIALING' | 'RINGING' | 'CONNECTED' | 'ENDED'>('IDLE');

  // Status Update Modal State
  const [editingCallback, setEditingCallback] = useState<CallbackRequest | null>(null);
  const [editStatus, setEditStatus] = useState<CallbackRequestStatus>('Pending');
  const [editNotes, setEditNotes] = useState<string>('');
  const [savingStatus, setSavingStatus] = useState<boolean>(false);

  // Manual Log Modal State
  const [showManualLogModal, setShowManualLogModal] = useState<boolean>(false);
  const [manualCallerName, setManualCallerName] = useState<string>('');
  const [manualCallerPhone, setManualCallerPhone] = useState<string>('');
  const [manualReceiverName, setManualReceiverName] = useState<string>('PHC Reception Desk');
  const [manualReceiverPhone, setManualReceiverPhone] = useState<string>('+91 11 2572 4012');
  const [manualDirection, setManualDirection] = useState<CallLogDirection>('INBOUND');
  const [manualPurpose, setManualPurpose] = useState<string>('OPD Inquiry & Token Verification');
  const [manualOutcome, setManualOutcome] = useState<CallLogOutcome>('CONNECTED');
  const [manualDuration, setManualDuration] = useState<string>('120');
  const [manualNotes, setManualNotes] = useState<string>('');
  const [savingManualLog, setSavingManualLog] = useState<boolean>(false);

  // Copied alert
  const [copiedNum, setCopiedNum] = useState<string | null>(null);

  useEffect(() => {
    loadCallbackQueue();
    loadPHCs();
    loadHelplines();
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') {
      loadCallLogs();
    }
  }, [activeTab]);

  // Stopwatch timer for active call
  useEffect(() => {
    let interval: any = null;
    if (callStatusState === 'CONNECTED') {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callStatusState]);

  const loadCallbackQueue = async () => {
    try {
      setLoadingQueue(true);
      const res = await apiClient.get('/call/callbacks');
      if (res.success) {
        setCallbackRequests(res.requests || []);
        if (res.metrics) setQueueMetrics(res.metrics);
      }
    } catch (err) {
      console.error('Failed to load callback queue:', err);
    } finally {
      setLoadingQueue(false);
    }
  };

  const loadCallLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await apiClient.get('/call/logs');
      if (res.success) {
        setCallLogs(res.logs || []);
        if (res.metrics) setLogMetrics(res.metrics);
      }
    } catch (err) {
      console.error('Failed to load call logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const loadHelplines = async () => {
    try {
      setLoadingHelplines(true);
      const res = await apiClient.get('/call/helplines');
      if (res.success && res.contacts) {
        setHelplines(res.contacts);
      }
    } catch (err) {
      console.error('Failed to load helplines:', err);
    } finally {
      setLoadingHelplines(false);
    }
  };

  const loadPHCs = async () => {
    try {
      const res = await apiClient.get('/phcs');
      if (res.success && res.phcs) {
        setPhcList(res.phcs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopy = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNum(num);
    setTimeout(() => setCopiedNum(null), 2000);
  };

  // Launch click-to-dial softphone for a callback item
  const handleLaunchDialer = (cb: CallbackRequest) => {
    setDialerNumber(cb.phone);
    setDialerName(cb.name);
    setDialerPurpose(`Callback Resolution: ${cb.reason}`);
    setLinkedCallbackId(cb.id);
    setSelectedOutcome('CALLBACK_RESOLVED');
    setCallNotes(`Spoke with ${cb.name} regarding "${cb.reason}". `);
    setActiveTab('dialer');
    // Start dialing immediately
    startCall(cb.phone, cb.name, `Callback Resolution: ${cb.reason}`, cb.id);
  };

  // Start outbound call via pluggable telephony provider
  const startCall = async (phoneToCall: string, nameToCall: string, purposeText: string, cbId?: string | null) => {
    if (!phoneToCall.trim()) return;

    try {
      setCallStatusState('DIALING');
      setCallDuration(0);

      const res = await apiClient.post('/call/initiate', {
        toPhone: phoneToCall.trim(),
        toName: nameToCall.trim() || 'Patient / Citizen',
        purpose: purposeText,
        callbackRequestId: cbId || linkedCallbackId || undefined,
        phcId,
      });

      if (res.success && res.session) {
        setActiveCallSession(res.session);

        // Simulate realistic network ringing then connect
        setTimeout(() => {
          setCallStatusState('RINGING');
          setTimeout(() => {
            setCallStatusState('CONNECTED');
          }, 1400);
        }, 800);
      } else {
        alert(res.error || 'Failed to dispatch telephony call.');
        setCallStatusState('IDLE');
      }
    } catch (err: any) {
      alert(err.message || 'Error initiating telephony session.');
      setCallStatusState('IDLE');
    }
  };

  // End active call session and record duration
  const endCall = async () => {
    if (activeCallSession) {
      try {
        await apiClient.post(`/call/session/${activeCallSession.sessionId}/hangup`, {});
      } catch (e) {
        console.error(e);
      }
    }

    setCallStatusState('ENDED');

    // If tied to a callback request and outcome is resolved, mark callback completed
    if (linkedCallbackId) {
      try {
        await apiClient.patch(`/call/callbacks/${linkedCallbackId}/status`, {
          status: selectedOutcome === 'CALLBACK_RESOLVED' || selectedOutcome === 'CONNECTED' ? 'Completed' : 'Called',
          notes: callNotes.trim(),
          incrementAttempt: true,
        });
        loadCallbackQueue();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleResetDialer = () => {
    setActiveCallSession(null);
    setCallStatusState('IDLE');
    setCallDuration(0);
    setCallNotes('');
    setLinkedCallbackId(null);
  };

  // Open Quick Edit Modal
  const handleOpenEditModal = (cb: CallbackRequest) => {
    setEditingCallback(cb);
    setEditStatus(cb.status);
    setEditNotes(cb.notes || '');
  };

  const handleSaveStatus = async () => {
    if (!editingCallback) return;
    try {
      setSavingStatus(true);
      const res = await apiClient.patch(`/call/callbacks/${editingCallback.id}/status`, {
        status: editStatus,
        notes: editNotes.trim(),
        incrementAttempt: editStatus === 'Called' || editStatus === 'Missed',
      });
      if (res.success) {
        setEditingCallback(null);
        loadCallbackQueue();
      } else {
        alert(res.error || 'Failed to update callback status.');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating status.');
    } finally {
      setSavingStatus(false);
    }
  };

  // Save manual call log
  const handleSaveManualLog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingManualLog(true);
      const res = await apiClient.post('/call/logs', {
        callerName: manualCallerName.trim(),
        callerPhone: manualCallerPhone.trim(),
        receiverName: manualReceiverName.trim(),
        receiverPhone: manualReceiverPhone.trim(),
        receiverRole: manualDirection === 'INBOUND' ? 'PHC Reception Desk' : 'Patient / Citizen',
        direction: manualDirection,
        purpose: manualPurpose.trim(),
        outcome: manualOutcome,
        durationSeconds: parseInt(manualDuration, 10) || 60,
        notes: manualNotes.trim(),
        phcId,
      });

      if (res.success) {
        setShowManualLogModal(false);
        setManualCallerName('');
        setManualCallerPhone('');
        setManualNotes('');
        loadCallLogs();
      } else {
        alert(res.error || 'Failed to save call log.');
      }
    } catch (err: any) {
      alert(err.message || 'Error saving call log.');
    } finally {
      setSavingManualLog(false);
    }
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  // Filtered Queue
  const filteredQueue = callbackRequests.filter((cb) => {
    const matchesStatus = statusFilter === 'ALL' || cb.status.toUpperCase() === statusFilter.toUpperCase();
    const matchesPhc = selectedPhc === 'ALL' || cb.phcId === selectedPhc;
    const matchesSearch =
      !searchQuery.trim() ||
      cb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cb.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cb.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cb.requestId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesPhc && matchesSearch;
  });

  // Filtered Logs
  const filteredLogs = callLogs.filter((l) => {
    const matchesOutcome = outcomeFilter === 'ALL' || l.outcome === outcomeFilter;
    const matchesDirection = directionFilter === 'ALL' || l.direction === directionFilter;
    const matchesSearch =
      !logSearchQuery.trim() ||
      l.callerName.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      l.callerPhone.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      l.receiverName.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      l.receiverPhone.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      l.purpose.toLowerCase().includes(logSearchQuery.toLowerCase());
    return matchesOutcome && matchesDirection && matchesSearch;
  });

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner & Title */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '16px',
          padding: '20px 24px',
          color: '#ffffff',
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.15)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, #0d9488, #0284c7)',
                padding: '8px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PhoneCall size={22} color="#ffffff" />
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>
                Telephony & Citizen Callback Console
              </h1>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                ArogyaMitra Pluggable Telephony Engine (Mock / Twilio / Exotel Bridge)
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => {
              setDialerNumber('');
              setDialerName('');
              setDialerPurpose('Outbound Health Inquiry');
              setActiveTab('dialer');
            }}
            style={{
              background: 'linear-gradient(135deg, #0d9488, #059669)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 8px rgba(13, 148, 136, 0.3)',
            }}
          >
            <Phone size={15} />
            <span>Open Softphone Dialer</span>
          </button>

          <button
            onClick={() => setShowManualLogModal(true)}
            style={{
              background: '#334155',
              color: '#ffffff',
              border: '1px solid #475569',
              borderRadius: '10px',
              padding: '10px 14px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Plus size={15} />
            <span>Record Call Log</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}>
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Total Requests</span>
            <Layers size={16} color="#0d9488" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
            {queueMetrics.total}
          </div>
          <span style={{ fontSize: '11px', color: '#64748b' }}>All patient callback inquiries</span>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '16px', border: '1.5px solid #fef3c7', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#b45309' }}>Pending in Queue</span>
            <Clock size={16} color="#d97706" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#b45309', marginTop: '6px' }}>
            {queueMetrics.pending}
          </div>
          <span style={{ fontSize: '11px', color: '#b45309' }}>Awaiting staff callback</span>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '16px', border: '1.5px solid #e0f2fe', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#0369a1' }}>Followed Up / Called</span>
            <PhoneCall size={16} color="#0284c7" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#0369a1', marginTop: '6px' }}>
            {queueMetrics.called}
          </div>
          <span style={{ fontSize: '11px', color: '#0369a1' }}>Under active coordination</span>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '16px', border: '1.5px solid #dcfce7', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#15803d' }}>Resolved & Completed</span>
            <CheckCircle2 size={16} color="#16a34a" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#15803d', marginTop: '6px' }}>
            {queueMetrics.completed}
          </div>
          <span style={{ fontSize: '11px', color: '#15803d' }}>Successfully closed</span>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Calls Logged</span>
            <Activity size={16} color="#7c3aed" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
            {logMetrics.totalCalls || callLogs.length}
          </div>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Avg duration: {logMetrics.avgDurationSeconds || 120}s
          </span>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div
        style={{
          display: 'flex',
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '6px',
          gap: '6px',
        }}
      >
        <button
          onClick={() => setActiveTab('queue')}
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'queue' ? '#0f766e' : 'transparent',
            color: activeTab === 'queue' ? '#ffffff' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <PhoneForwarded size={16} />
          <span>Live Callback Queue</span>
          {queueMetrics.pending > 0 && (
            <span
              style={{
                background: activeTab === 'queue' ? '#ffffff' : '#f59e0b',
                color: activeTab === 'queue' ? '#0f766e' : '#ffffff',
                borderRadius: '9999px',
                padding: '2px 7px',
                fontSize: '11px',
                fontWeight: 800,
              }}
            >
              {queueMetrics.pending}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('dialer')}
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'dialer' ? '#0f766e' : 'transparent',
            color: activeTab === 'dialer' ? '#ffffff' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <PhoneCall size={16} />
          <span>Softphone & Dialer Simulator</span>
          {callStatusState === 'CONNECTED' && (
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          )}
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'logs' ? '#0f766e' : 'transparent',
            color: activeTab === 'logs' ? '#ffffff' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <FileText size={16} />
          <span>Call Logs & History</span>
        </button>

        <button
          onClick={() => setActiveTab('directory')}
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'directory' ? '#0f766e' : 'transparent',
            color: activeTab === 'directory' ? '#ffffff' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Building2 size={16} />
          <span>Helplines Directory</span>
        </button>
      </div>

      {/* TAB 1: LIVE CALLBACK QUEUE */}
      {activeTab === 'queue' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Controls & Filter Bar */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  gap: '8px',
                  width: '100%',
                  maxWidth: '360px',
                }}
              >
                <Search size={16} color="#94a3b8" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by patient, phone, reason, ID..."
                  style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '13px' }}
                />
              </div>

              {/* Status Filter Buttons */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {['ALL', 'Pending', 'Called', 'Missed', 'Completed'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: statusFilter === st ? '1.5px solid #0d9488' : '1px solid #e2e8f0',
                      background: statusFilter === st ? '#e6fffa' : '#ffffff',
                      color: statusFilter === st ? '#0d9488' : '#64748b',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                value={selectedPhc}
                onChange={(e) => setSelectedPhc(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  background: '#ffffff',
                  outline: 'none',
                }}
              >
                <option value="ALL">All Health Centres</option>
                {phcList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <button
                onClick={loadCallbackQueue}
                title="Refresh Queue"
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '7px 10px',
                  cursor: 'pointer',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                }}
              >
                <RefreshCw size={14} className={loadingQueue ? 'spin-animate' : ''} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Queue Table */}
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Request ID</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Patient / Contact</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Reason / Department</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Preferred Time</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Health Centre</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Attempts</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingQueue ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      <RefreshCw size={24} className="spin-animate" style={{ margin: '0 auto 8px', color: '#0d9488' }} />
                      <p>Loading callback requests...</p>
                    </td>
                  </tr>
                ) : filteredQueue.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 8px' }} />
                      <h4 style={{ margin: '0 0 4px', color: '#1e293b' }}>Queue is Clear!</h4>
                      <p style={{ margin: 0, fontSize: '12px' }}>No pending callback requests matching your filters.</p>
                    </td>
                  </tr>
                ) : (
                  filteredQueue.map((req) => (
                    <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontWeight: 800, color: '#0d9488', fontSize: '12px' }}>{req.requestId}</span>
                        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                          {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{req.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
                          <Phone size={11} />
                          <span>{req.phone}</span>
                          <button
                            onClick={() => handleCopy(req.phone)}
                            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
                            title="Copy number"
                          >
                            <Copy size={11} />
                          </button>
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px', maxWidth: '240px' }}>
                        <div style={{ color: '#1e293b', fontWeight: 600, lineHeight: 1.3 }}>{req.reason}</div>
                        {req.notes && (
                          <div style={{ fontSize: '11px', color: '#059669', marginTop: '3px' }}>
                            💬 {req.notes}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#475569', fontSize: '12px' }}>
                          <Clock size={13} color="#0284c7" />
                          <span>{req.preferredTime}</span>
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px', color: '#475569', fontSize: '12px' }}>
                        {req.phcName || 'Central PHC'}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            background: req.callAttempts > 0 ? '#fef3c7' : '#f1f5f9',
                            color: req.callAttempts > 0 ? '#b45309' : '#64748b',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontWeight: 700,
                            fontSize: '11px',
                          }}
                        >
                          {req.callAttempts} {req.callAttempts === 1 ? 'attempt' : 'attempts'}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background:
                              req.status === 'Pending'
                                ? '#fef3c7'
                                : req.status === 'Called'
                                ? '#e0f2fe'
                                : req.status === 'Missed'
                                ? '#fee2e2'
                                : '#dcfce7',
                            color:
                              req.status === 'Pending'
                                ? '#92400e'
                                : req.status === 'Called'
                                ? '#0369a1'
                                : req.status === 'Missed'
                                ? '#b91c1c'
                                : '#15803d',
                          }}
                        >
                          {req.status === 'Pending' && <Clock size={12} />}
                          {req.status === 'Called' && <PhoneCall size={12} />}
                          {req.status === 'Missed' && <PhoneMissed size={12} />}
                          {req.status === 'Completed' && <CheckCircle2 size={12} />}
                          <span>{req.status}</span>
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleLaunchDialer(req)}
                            title="Click-to-Dial via Telephony Softphone"
                            style={{
                              background: '#0d9488',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Phone size={12} />
                            <span>Call</span>
                          </button>

                          <button
                            onClick={() => handleOpenEditModal(req)}
                            title="Update Status / Add Notes"
                            style={{
                              background: '#f8fafc',
                              color: '#334155',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              padding: '6px 8px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: TELEPHONY SOFTPHONE & DIALER SIMULATOR */}
      {activeTab === 'dialer' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Dialer Pad & Control */}
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{ background: '#ccfbf1', padding: '6px', borderRadius: '8px' }}>
                <PhoneCall size={18} color="#0f766e" />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                ArogyaMitra Telephony Softphone
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Recipient Phone & Name */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Destination Phone Number
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="tel"
                    value={dialerNumber}
                    onChange={(e) => setDialerNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    disabled={callStatusState !== 'IDLE' && callStatusState !== 'ENDED'}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '15px',
                      fontWeight: 700,
                      letterSpacing: '0.5px',
                      outline: 'none',
                    }}
                  />
                  {dialerNumber && callStatusState === 'IDLE' && (
                    <button
                      onClick={() => setDialerNumber('')}
                      style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 12px', cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Citizen / Patient Name
                </label>
                <input
                  type="text"
                  value={dialerName}
                  onChange={(e) => setDialerName(e.target.value)}
                  placeholder="e.g. Ramesh Patel"
                  disabled={callStatusState !== 'IDLE' && callStatusState !== 'ENDED'}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Call Purpose / Case
                </label>
                <input
                  type="text"
                  value={dialerPurpose}
                  onChange={(e) => setDialerPurpose(e.target.value)}
                  placeholder="e.g. Follow-up consultation, Medicine inquiry"
                  disabled={callStatusState !== 'IDLE' && callStatusState !== 'ENDED'}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Number Keypad */}
              {callStatusState === 'IDLE' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '6px' }}>
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => setDialerNumber((prev) => prev + digit)}
                      style={{
                        padding: '12px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        fontSize: '16px',
                        fontWeight: 700,
                        color: '#1e293b',
                        cursor: 'pointer',
                        transition: 'all 0.1s ease',
                      }}
                    >
                      {digit}
                    </button>
                  ))}
                </div>
              )}

              {/* Action Button */}
              {callStatusState === 'IDLE' ? (
                <button
                  onClick={() => startCall(dialerNumber, dialerName, dialerPurpose)}
                  disabled={!dialerNumber.trim()}
                  style={{
                    background: 'linear-gradient(135deg, #0d9488, #059669)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '14px',
                    fontSize: '15px',
                    fontWeight: 800,
                    cursor: dialerNumber.trim() ? 'pointer' : 'not-allowed',
                    opacity: dialerNumber.trim() ? 1 : 0.6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '8px',
                    boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)',
                  }}
                >
                  <Phone size={18} />
                  <span>Initiate Outbound Call</span>
                </button>
              ) : callStatusState === 'ENDED' ? (
                <button
                  onClick={handleResetDialer}
                  style={{
                    background: '#0d9488',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  New Call / Reset Softphone
                </button>
              ) : null}
            </div>
          </div>

          {/* Active Call Live Simulation Panel */}
          <div
            style={{
              background: '#0f172a',
              borderRadius: '16px',
              padding: '24px',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 4px 20px rgba(15, 23, 42, 0.2)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Background Glow */}
            <div
              style={{
                position: 'absolute',
                top: '-50px',
                right: '-50px',
                width: '180px',
                height: '180px',
                background: callStatusState === 'CONNECTED' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(14, 165, 233, 0.15)',
                borderRadius: '50%',
                filter: 'blur(50px)',
              }}
            />

            <div>
              {/* Header Status Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span
                  style={{
                    background:
                      callStatusState === 'CONNECTED'
                        ? 'rgba(34, 197, 94, 0.2)'
                        : callStatusState === 'RINGING' || callStatusState === 'DIALING'
                        ? 'rgba(234, 179, 8, 0.2)'
                        : 'rgba(148, 163, 184, 0.2)',
                    color:
                      callStatusState === 'CONNECTED'
                        ? '#4ade80'
                        : callStatusState === 'RINGING' || callStatusState === 'DIALING'
                        ? '#fde047'
                        : '#94a3b8',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  ● {callStatusState === 'IDLE' ? 'Softphone Standby' : callStatusState}
                </span>

                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Provider: <strong>{activeCallSession?.provider || 'MOCK_PROVIDER'}</strong>
                </span>
              </div>

              {/* Call Visualizer */}
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div
                  style={{
                    width: '84px',
                    height: '84px',
                    borderRadius: '50%',
                    background: callStatusState === 'CONNECTED' ? 'linear-gradient(135deg, #10b981, #059669)' : '#1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    boxShadow: callStatusState === 'CONNECTED' ? '0 0 30px rgba(16, 185, 129, 0.4)' : 'none',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <PhoneCall size={38} color="#ffffff" />
                </div>

                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px', color: '#ffffff' }}>
                  {dialerName || 'Unknown Citizen'}
                </h2>
                <p style={{ fontSize: '14px', color: '#38bdf8', fontWeight: 600, margin: '0 0 10px' }}>
                  {dialerNumber || 'No active call'}
                </p>

                {callStatusState === 'CONNECTED' && (
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#4ade80', letterSpacing: '1px' }}>
                    {formatTime(callDuration)}
                  </div>
                )}
              </div>

              {/* In-Call Controls & Notes */}
              {(callStatusState === 'CONNECTED' || callStatusState === 'ENDED') && (
                <div style={{ background: '#1e293b', borderRadius: '12px', padding: '14px', marginTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        style={{
                          background: isMuted ? '#ef4444' : '#334155',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                        }}
                      >
                        {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
                        <span>{isMuted ? 'Muted' : 'Mute'}</span>
                      </button>

                      <button
                        onClick={() => setIsSpeaker(!isSpeaker)}
                        style={{
                          background: isSpeaker ? '#0284c7' : '#334155',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                        }}
                      >
                        {isSpeaker ? <Volume2 size={14} /> : <VolumeX size={14} />}
                        <span>Speaker</span>
                      </button>
                    </div>

                    <div>
                      <select
                        value={selectedOutcome}
                        onChange={(e) => setSelectedOutcome(e.target.value as CallLogOutcome)}
                        style={{
                          background: '#334155',
                          color: '#ffffff',
                          border: '1px solid #475569',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          fontSize: '12px',
                          outline: 'none',
                        }}
                      >
                        <option value="CALLBACK_RESOLVED">Callback Resolved</option>
                        <option value="CONNECTED">Connected / Regular</option>
                        <option value="BUSY">Line Busy</option>
                        <option value="NO_ANSWER">No Answer</option>
                        <option value="FAILED">Call Failed</option>
                      </select>
                    </div>
                  </div>

                  <textarea
                    rows={3}
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    placeholder="Enter call summary notes (e.g. Discussed medication dosage, scheduled appointment)..."
                    style={{
                      width: '100%',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      color: '#ffffff',
                      fontSize: '12px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              )}
            </div>

            {/* Hangup Button */}
            {callStatusState === 'CONNECTED' || callStatusState === 'RINGING' || callStatusState === 'DIALING' ? (
              <button
                onClick={endCall}
                style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px',
                  fontSize: '15px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '16px',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                }}
              >
                <Square size={16} fill="#ffffff" />
                <span>End Call & Save Call Log</span>
              </button>
            ) : (
              <div style={{ textAlign: 'center', fontSize: '11px', color: '#64748b', marginTop: '16px' }}>
                Telephony carrier link active. Ready to dial.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: COMPREHENSIVE CALL LOGS */}
      {activeTab === 'logs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Filter Bar */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  gap: '8px',
                  width: '100%',
                  maxWidth: '340px',
                }}
              >
                <Search size={16} color="#94a3b8" />
                <input
                  type="text"
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  placeholder="Search caller, receiver, purpose..."
                  style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '13px' }}
                />
              </div>

              {/* Outcome Filter */}
              <select
                value={outcomeFilter}
                onChange={(e) => setOutcomeFilter(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  background: '#ffffff',
                  outline: 'none',
                }}
              >
                <option value="ALL">All Outcomes</option>
                <option value="CONNECTED">Connected</option>
                <option value="CALLBACK_RESOLVED">Callback Resolved</option>
                <option value="BUSY">Line Busy</option>
                <option value="NO_ANSWER">No Answer</option>
                <option value="FAILED">Failed</option>
              </select>

              {/* Direction Filter */}
              <select
                value={directionFilter}
                onChange={(e) => setDirectionFilter(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  background: '#ffffff',
                  outline: 'none',
                }}
              >
                <option value="ALL">All Directions</option>
                <option value="INBOUND">Inbound ↙</option>
                <option value="OUTBOUND">Outbound ↗</option>
              </select>
            </div>

            <button
              onClick={loadCallLogs}
              style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '7px 12px',
                cursor: 'pointer',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
              }}
            >
              <RefreshCw size={14} className={loadingLogs ? 'spin-animate' : ''} />
              <span>Refresh Logs</span>
            </button>
          </div>

          {/* Logs Table */}
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Timestamp</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Direction</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Caller</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Receiver & Role</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Purpose</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Outcome</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Duration</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {loadingLogs ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      <RefreshCw size={24} className="spin-animate" style={{ margin: '0 auto 8px', color: '#0d9488' }} />
                      <p>Loading call log history...</p>
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      <FileText size={32} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                      <p>No call logs found matching your filters.</p>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const outcomeConf = OUTCOME_CONFIG[log.outcome] || OUTCOME_CONFIG.CONNECTED;
                    return (
                      <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 700, color: '#1e293b' }}>
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {new Date(log.timestamp).toLocaleDateString()}
                          </div>
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              background: log.direction === 'INBOUND' ? '#f0fdf4' : '#f0f9ff',
                              color: log.direction === 'INBOUND' ? '#16a34a' : '#0284c7',
                            }}
                          >
                            {log.direction === 'INBOUND' ? <PhoneIncoming size={12} /> : <PhoneOutgoing size={12} />}
                            <span>{log.direction}</span>
                          </span>
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{log.callerName}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{log.callerPhone}</div>
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{log.receiverName}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {log.receiverPhone} • <span style={{ color: '#0f766e' }}>{log.receiverRole}</span>
                          </div>
                        </td>

                        <td style={{ padding: '12px 16px', maxWidth: '200px' }}>
                          <span style={{ color: '#1e293b', fontWeight: 600 }}>{log.purpose}</span>
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 700,
                              background: outcomeConf.bg,
                              color: outcomeConf.color,
                              border: `1px solid ${outcomeConf.border}`,
                            }}
                          >
                            {outcomeConf.label}
                          </span>
                        </td>

                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>
                          {formatTime(log.durationSeconds)}
                        </td>

                        <td style={{ padding: '12px 16px', maxWidth: '240px', fontSize: '12px', color: '#475569' }}>
                          {log.notes || '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: HELPLINES DIRECTORY */}
      {activeTab === 'directory' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
          {helplines.map((c) => (
            <div
              key={c.id}
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span
                    style={{
                      background: '#f1f5f9',
                      color: '#475569',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                    }}
                  >
                    {c.badge || c.category}
                  </span>
                  {c.tollFree && (
                    <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>
                      Toll-Free
                    </span>
                  )}
                </div>
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                  {c.name}
                </h4>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.35 }}>
                  {c.description}
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#f8fafc',
                  padding: '8px 10px',
                  borderRadius: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#475569' }}>
                  <Clock size={12} />
                  <span>{c.availableHours}</span>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => handleCopy(c.number)}
                    style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: '#475569' }}
                    title="Copy number"
                  >
                    {copiedNum === c.number ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                  </button>

                  <a
                    href={c.telLink}
                    style={{
                      background: '#0d9488',
                      color: '#ffffff',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      textDecoration: 'none',
                      fontSize: '12px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Phone size={11} fill="#ffffff" />
                    <span>{c.number}</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QUICK STATUS EDIT MODAL */}
      {editingCallback && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '460px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#0d9488' }}>{editingCallback.requestId}</span>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '2px 0 0' }}>
                  Update Callback Status
                </h3>
              </div>
              <button
                onClick={() => setEditingCallback(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', border: '1px solid #e2e8f0' }}>
                <div><strong>Patient:</strong> {editingCallback.name} ({editingCallback.phone})</div>
                <div style={{ marginTop: '2px' }}><strong>Reason:</strong> {editingCallback.reason}</div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Queue Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as CallbackRequestStatus)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="Pending">Pending / In Queue</option>
                  <option value="Called">Called / In Progress</option>
                  <option value="Missed">Missed / Need Retry</option>
                  <option value="Completed">Completed & Resolved</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Staff Resolution Notes
                </label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Record outcome of patient interaction or reason for status change..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  onClick={handleSaveStatus}
                  disabled={savingStatus}
                  style={{
                    flex: 1,
                    background: '#0d9488',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: savingStatus ? 'not-allowed' : 'pointer',
                  }}
                >
                  {savingStatus ? 'Saving...' : 'Save & Update'}
                </button>
                <button
                  onClick={() => setEditingCallback(null)}
                  style={{
                    flex: 1,
                    background: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL CALL LOG MODAL */}
      {showManualLogModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '520px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ background: '#ccfbf1', padding: '6px', borderRadius: '8px' }}>
                  <Plus size={18} color="#0f766e" />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Record Manual Call Log Entry
                </h3>
              </div>
              <button
                onClick={() => setShowManualLogModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveManualLog} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Caller Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualCallerName}
                    onChange={(e) => setManualCallerName(e.target.value)}
                    placeholder="e.g. Ramesh Patel"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Caller Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={manualCallerPhone}
                    onChange={(e) => setManualCallerPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Direction
                  </label>
                  <select
                    value={manualDirection}
                    onChange={(e) => setManualDirection(e.target.value as CallLogDirection)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#ffffff', boxSizing: 'border-box' }}
                  >
                    <option value="INBOUND">Inbound ↙ (Patient called PHC)</option>
                    <option value="OUTBOUND">Outbound ↗ (PHC staff called Patient)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Call Outcome *
                  </label>
                  <select
                    value={manualOutcome}
                    onChange={(e) => setManualOutcome(e.target.value as CallLogOutcome)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#ffffff', boxSizing: 'border-box' }}
                  >
                    <option value="CONNECTED">Connected</option>
                    <option value="CALLBACK_RESOLVED">Callback Resolved</option>
                    <option value="BUSY">Busy</option>
                    <option value="NO_ANSWER">No Answer</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Call Purpose *
                </label>
                <input
                  type="text"
                  required
                  value={manualPurpose}
                  onChange={(e) => setManualPurpose(e.target.value)}
                  placeholder="e.g. OPD doctor schedule inquiry, Fever triage"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Approx Duration (Seconds)
                </label>
                <input
                  type="number"
                  value={manualDuration}
                  onChange={(e) => setManualDuration(e.target.value)}
                  placeholder="120"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Call Notes / Resolution Summary
                </label>
                <textarea
                  rows={2}
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="Summary of dialogue..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="submit"
                  disabled={savingManualLog}
                  style={{
                    flex: 1,
                    background: '#0d9488',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: savingManualLog ? 'not-allowed' : 'pointer',
                  }}
                >
                  {savingManualLog ? 'Saving...' : 'Save Call Log'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualLogModal(false)}
                  style={{
                    flex: 1,
                    background: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default CallServicesDashboard;
