import React, { useState, useEffect, useRef } from 'react';
import {
  HeartPulse,
  MessageSquare,
  Phone,
  PhoneCall,
  PhoneOff,
  Send,
  Image as ImageIcon,
  Check,
  CheckCheck,
  Clock,
  User,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  AlertCircle,
  X,
  Search,
  Filter,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Calendar,
  Building2,
  Activity,
  FileText,
  UserCheck,
  ChevronRight,
  ExternalLink,
  Plus,
  Stethoscope,
  Pill,
  Tag,
  CheckCircle,
  ListPlus,
  Share2,
  History,
  UserPlus,
  ArrowUpRight,
  Edit3,
  Save,
  Trash2,
  AlertTriangle,
  Info,
  Sliders,
  ChevronDown,
} from 'lucide-react';
import {
  HealthAssistantProfile,
  ChatSession,
  ChatMessage,
  PatientProfile,
  AssistantPresenceStatus,
  UserRole,
  OnCallSupportTicket,
  SharedCareNote,
  QuickReplyTemplate,
  PatientTimelineEvent,
  SupportTicketCategory,
  SupportTicketPriority,
  DoctorProfile,
} from '@phc-connect/types';
import { apiClient } from '../services/api';
import { staffChatSocket } from '../services/chatSocket';
import { staffWebRtcCall, StaffCallState } from '../utils/webrtcClient';

interface HealthAssistantDashboardProps {
  assistantId?: string;
  currentRole?: UserRole;
  phcId?: string;
}

export const HealthAssistantDashboard: React.FC<HealthAssistantDashboardProps> = ({
  assistantId = 'asst-001',
  currentRole = 'HEALTH_ASSISTANT',
  phcId = 'phc-001',
}) => {
  const [profile, setProfile] = useState<HealthAssistantProfile | null>(null);
  const [presence, setPresence] = useState<AssistantPresenceStatus>('ONLINE');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [activePatient, setActivePatient] = useState<PatientProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ACTIVE');
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [isTypingPeer, setIsTypingPeer] = useState<boolean>(false);

  // Right Panel Tabs
  const [rightPanelTab, setRightPanelTab] = useState<'dossier' | 'ticket' | 'sharedNotes' | 'timeline'>('dossier');

  // Support Tickets State
  const [activeTicket, setActiveTicket] = useState<OnCallSupportTicket | null>(null);
  const [patientTickets, setPatientTickets] = useState<OnCallSupportTicket[]>([]);
  const [showNewTicketModal, setShowNewTicketModal] = useState<boolean>(false);
  const [newTicketSubject, setNewTicketSubject] = useState<string>('');
  const [newTicketCategory, setNewTicketCategory] = useState<SupportTicketCategory>('GENERAL_CONSULTATION');
  const [newTicketPriority, setNewTicketPriority] = useState<SupportTicketPriority>('MEDIUM');
  const [newTicketTags, setNewTicketTags] = useState<string[]>(['Tele-Care', 'Follow-up']);
  const [tagInput, setTagInput] = useState<string>('');
  const [newTicketNotes, setNewTicketNotes] = useState<string>('');
  const [showResolveTicketModal, setShowResolveTicketModal] = useState<boolean>(false);
  const [ticketResolutionSummary, setTicketResolutionSummary] = useState<string>('');

  // Shared Care Notes State
  const [sharedNotes, setSharedNotes] = useState<SharedCareNote | null>(null);
  const [notesTitle, setNotesTitle] = useState<string>('Patient Care & Lifestyle Instructions');
  const [notesSummary, setNotesSummary] = useState<string>('');
  const [instructionsList, setInstructionsList] = useState<string[]>([]);
  const [newInstructionInput, setNewInstructionInput] = useState<string>('');
  const [dietaryList, setDietaryList] = useState<string[]>([]);
  const [newDietInput, setNewDietInput] = useState<string>('');
  const [medicationNotesList, setMedicationNotesList] = useState<string[]>([]);
  const [newMedInput, setNewMedInput] = useState<string>('');
  const [emergencyWarningText, setEmergencyWarningText] = useState<string>('');
  const [savingNotes, setSavingNotes] = useState<boolean>(false);
  const [notesSaveSuccess, setNotesSaveSuccess] = useState<boolean>(false);

  // Quick Replies State
  const [quickReplies, setQuickReplies] = useState<QuickReplyTemplate[]>([]);
  const [selectedQRCategory, setSelectedQRCategory] = useState<string>('ALL');
  const [showQuickReplyDrawer, setShowQuickReplyDrawer] = useState<boolean>(false);

  // Doctor Escalation State
  const [showEscalateModal, setShowEscalateModal] = useState<boolean>(false);
  const [availableDoctors, setAvailableDoctors] = useState<DoctorProfile[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [escalationReason, setEscalationReason] = useState<string>('Complex clinical symptoms requiring Medical Officer review');
  const [escalationPriority, setEscalationPriority] = useState<SupportTicketPriority>('HIGH');
  const [escalating, setEscalating] = useState<boolean>(false);

  // Patient Timeline State
  const [patientTimeline, setPatientTimeline] = useState<PatientTimelineEvent[]>([]);
  const [timelineFilter, setTimelineFilter] = useState<string>('ALL');
  const [loadingTimeline, setLoadingTimeline] = useState<boolean>(false);

  // Image Attachment & Lightbox
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string; file?: File } | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // WebRTC Call State
  const [callState, setCallState] = useState<StaffCallState>(staffWebRtcCall.getState());
  const [showResolutionModal, setShowResolutionModal] = useState<boolean>(false);
  const [resolutionNotes, setResolutionNotes] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<any>(null);

  useEffect(() => {
    staffChatSocket.connect();

    // Listen to real-time events
    const unsubMsg = staffChatSocket.subscribe('MESSAGE_RECEIVED', (payload) => {
      if (payload.message) {
        if (payload.sessionId === activeSession?.id) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.message?.id)) return prev;
            return [...prev, payload.message!];
          });
          staffChatSocket.markAsRead(activeSession.id);
        }

        setSessions((prev) =>
          prev.map((s) =>
            s.id === payload.sessionId
              ? {
                  ...s,
                  lastMessage: payload.message?.text || 'New message',
                  lastMessageAt: payload.message?.timestamp || new Date().toISOString(),
                  unreadCountAssistant: s.id === activeSession?.id ? 0 : s.unreadCountAssistant + 1,
                }
              : s
          )
        );
      }
    });

    const unsubRead = staffChatSocket.subscribe('MESSAGE_READ', (payload) => {
      if (payload.sessionId === activeSession?.id) {
        setMessages((prev) =>
          prev.map((m) => (m.senderRole === 'HEALTH_ASSISTANT' ? { ...m, status: 'READ' } : m))
        );
      }
    });

    const unsubTyping = staffChatSocket.subscribe('TYPING', (payload) => {
      if (payload.sessionId === activeSession?.id) {
        setIsTypingPeer(!!payload.isTyping);
      }
    });

    const unsubCall = staffWebRtcCall.subscribe((state) => {
      setCallState(state);
    });

    const unsubNotes = staffChatSocket.subscribe('SHARED_NOTE_UPDATE', (payload) => {
      if (payload.sessionId === activeSession?.id && payload.sharedNote) {
        setSharedNotes(payload.sharedNote);
        setNotesTitle(payload.sharedNote.title || 'Patient Care & Lifestyle Instructions');
        setNotesSummary(payload.sharedNote.summary || '');
        setInstructionsList(payload.sharedNote.instructions || []);
        setDietaryList(payload.sharedNote.dietaryPrecautions || []);
        setMedicationNotesList(payload.sharedNote.medicationNotes || []);
        setEmergencyWarningText(payload.sharedNote.emergencyWarning || '');
      }
    });

    const unsubTicket = staffChatSocket.subscribe('TICKET_UPDATED', (payload) => {
      if (payload.ticket && (payload.sessionId === activeSession?.id || payload.ticket.patientId === activePatient?.id)) {
        setActiveTicket(payload.ticket);
        setPatientTickets((prev) => {
          const idx = prev.findIndex((t) => t.id === payload.ticket!.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = payload.ticket!;
            return next;
          }
          return [payload.ticket!, ...prev];
        });
      }
    });

    const unsubEscalate = staffChatSocket.subscribe('DOCTOR_ESCALATED', (payload) => {
      if (payload.sessionId === activeSession?.id) {
        if (payload.message) {
          setMessages((prev) => [...prev, payload.message!]);
        }
        if (payload.ticket) {
          setActiveTicket(payload.ticket);
        }
      }
    });

    loadDashboardData();
    loadQuickReplies();
    loadDoctors();

    return () => {
      unsubMsg();
      unsubRead();
      unsubTyping();
      unsubCall();
      unsubNotes();
      unsubTicket();
      unsubEscalate();
    };
  }, [activeSession?.id, activePatient?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTypingPeer]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const asstRes = await apiClient.get('/assistants');
      if (asstRes.success && asstRes.assistants) {
        const found = asstRes.assistants.find((a: any) => a.id === assistantId || a.id === 'asst-001');
        if (found) {
          setProfile(found);
          setPresence(found.status);
        }
      }

      const sessRes = await apiClient.get('/assistants/chat/sessions');
      if (sessRes.success && sessRes.sessions) {
        setSessions(sessRes.sessions);
        if (sessRes.sessions.length > 0 && !activeSession) {
          selectSession(sessRes.sessions[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load assistant dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadQuickReplies = async () => {
    try {
      const res = await apiClient.get('/support/quick-replies');
      if (res.success && res.quickReplies) {
        setQuickReplies(res.quickReplies);
      }
    } catch (e) {
      console.error('Failed to fetch quick replies:', e);
    }
  };

  const loadDoctors = async () => {
    try {
      const res = await apiClient.get('/doctors');
      if (res.success && res.doctors) {
        setAvailableDoctors(res.doctors);
        if (res.doctors.length > 0) {
          setSelectedDoctorId(res.doctors[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to fetch doctors:', e);
    }
  };

  const selectSession = async (sess: ChatSession) => {
    try {
      setActiveSession(sess);
      const res = await apiClient.get(`/assistants/chat/sessions/${sess.id}`);
      if (res.success) {
        setMessages(res.messages || []);
        const patientData = res.patient || null;
        setActivePatient(patientData);
        staffChatSocket.markAsRead(sess.id);

        setSessions((prev) =>
          prev.map((s) => (s.id === sess.id ? { ...s, unreadCountAssistant: 0 } : s))
        );

        // Load linked ticket and shared care notes
        if (patientData) {
          loadPatientTicketsAndNotes(sess.id, patientData.id);
        }
      }
    } catch (e) {
      console.error('Failed to fetch session messages:', e);
    }
  };

  const loadPatientTicketsAndNotes = async (sessionId: string, patientId: string) => {
    try {
      // 1. Fetch tickets
      const tktRes = await apiClient.get(`/support/tickets/patient/${patientId}`);
      if (tktRes.success && tktRes.tickets) {
        setPatientTickets(tktRes.tickets);
        const linked = tktRes.tickets.find((t: OnCallSupportTicket) => t.sessionId === sessionId) || tktRes.tickets[0] || null;
        setActiveTicket(linked);
      }

      // 2. Fetch shared notes
      const notesRes = await apiClient.get(`/support/shared-notes/${sessionId}`);
      if (notesRes.success && notesRes.note) {
        const n = notesRes.note;
        setSharedNotes(n);
        setNotesTitle(n.title || 'Patient Care & Lifestyle Instructions');
        setNotesSummary(n.summary || '');
        setInstructionsList(n.instructions || []);
        setDietaryList(n.dietaryPrecautions || []);
        setMedicationNotesList(n.medicationNotes || []);
        setEmergencyWarningText(n.emergencyWarning || '');
      } else {
        setSharedNotes(null);
        setNotesTitle('Patient Care & Lifestyle Instructions');
        setNotesSummary('');
        setInstructionsList(['Follow daily prescribed medication schedule.', 'Maintain clean hydration and rest.']);
        setDietaryList(['Avoid white sugar and oily street snacks.', 'Include boiled vegetables and whole grains.']);
        setMedicationNotesList([]);
        setEmergencyWarningText('');
      }

      // 3. Load timeline if tab is active
      if (rightPanelTab === 'timeline') {
        loadTimeline(patientId);
      }
    } catch (e) {
      console.error('Failed to load tickets/notes:', e);
    }
  };

  const loadTimeline = async (patientId?: string) => {
    const targetId = patientId || activePatient?.id;
    if (!targetId) return;

    try {
      setLoadingTimeline(true);
      const res = await apiClient.get(`/patients/${targetId}/timeline`);
      if (res.success && res.timeline) {
        setPatientTimeline(res.timeline);
      }
    } catch (e) {
      console.error('Failed to load timeline:', e);
    } finally {
      setLoadingTimeline(false);
    }
  };

  const handlePresenceChange = async (newStatus: AssistantPresenceStatus) => {
    try {
      setPresence(newStatus);
      if (profile) {
        await apiClient.patch(`/assistants/${profile.id}/status`, { status: newStatus });
        staffChatSocket.updatePresence(newStatus);
      }
    } catch (e) {
      console.error('Failed to update presence:', e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (activeSession) {
      staffChatSocket.sendTyping(activeSession.id, true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        staffChatSocket.sendTyping(activeSession.id, false);
      }, 1500);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setSelectedImage({
        url: dataUrl,
        name: file.name,
        file,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend !== undefined ? textToSend : inputText.trim();
    if ((!text && !selectedImage) || !activeSession || !profile) return;

    try {
      setSending(true);
      let attachmentPayload = null;

      if (selectedImage) {
        attachmentPayload = {
          url: selectedImage.url,
          name: selectedImage.name,
          type: 'IMAGE',
          sizeBytes: selectedImage.file?.size || 120000,
        };
      }

      const res = await apiClient.post(`/assistants/chat/sessions/${activeSession.id}/messages`, {
        text: text || 'Photo attachment',
        attachment: attachmentPayload,
      });

      if (res.success && res.message) {
        setMessages((prev) => [...prev, res.message]);
        setInputText('');
        setSelectedImage(null);

        // Broadcast to WebSocket
        staffChatSocket.sendMessage(activeSession.id, res.message, activeSession.patientUserId);

        // Update local session preview
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSession.id
              ? {
                  ...s,
                  lastMessage: text || '📷 Photo attachment',
                  lastMessageAt: new Date().toISOString(),
                }
              : s
          )
        );
      }
    } catch (e) {
      console.error('Failed to send message:', e);
    } finally {
      setSending(false);
    }
  };

  const handleSaveSharedNotes = async () => {
    if (!activeSession) return;
    try {
      setSavingNotes(true);
      const payload = {
        title: notesTitle,
        summary: notesSummary,
        instructions: instructionsList.filter((i) => i.trim().length > 0),
        dietaryPrecautions: dietaryList.filter((d) => d.trim().length > 0),
        medicationNotes: medicationNotesList.filter((m) => m.trim().length > 0),
        emergencyWarning: emergencyWarningText.trim() || null,
        ticketId: activeTicket?.id,
      };

      const res = await apiClient.put(`/support/shared-notes/${activeSession.id}`, payload);
      if (res.success && res.note) {
        setSharedNotes(res.note);
        setNotesSaveSuccess(true);
        setTimeout(() => setNotesSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error('Failed to save shared notes:', e);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleCreateSupportTicket = async () => {
    if (!activePatient || !newTicketSubject.trim()) return;

    try {
      const payload = {
        patientId: activePatient.id,
        patientName: activePatient.fullName,
        patientPhone: activePatient.phone,
        sessionId: activeSession?.id,
        category: newTicketCategory,
        subject: newTicketSubject.trim(),
        priority: newTicketPriority,
        tags: newTicketTags,
        notes: newTicketNotes.trim(),
        sharedCareNotes: instructionsList.join('; '),
      };

      const res = await apiClient.post('/support/tickets', payload);
      if (res.success && res.ticket) {
        setActiveTicket(res.ticket);
        setPatientTickets((prev) => [res.ticket, ...prev]);
        setShowNewTicketModal(false);
        setNewTicketSubject('');
        setNewTicketNotes('');
        setRightPanelTab('ticket');
      }
    } catch (e) {
      console.error('Failed to create ticket:', e);
    }
  };

  const handleResolveTicket = async () => {
    if (!activeTicket) return;

    try {
      const res = await apiClient.post(`/support/tickets/${activeTicket.id}/resolve`, {
        resolutionSummary: ticketResolutionSummary.trim() || 'Resolved during remote on-call consultation.',
      });

      if (res.success && res.ticket) {
        setActiveTicket(res.ticket);
        setPatientTickets((prev) =>
          prev.map((t) => (t.id === res.ticket.id ? res.ticket : t))
        );
        setShowResolveTicketModal(false);
        setTicketResolutionSummary('');
      }
    } catch (e) {
      console.error('Failed to resolve ticket:', e);
    }
  };

  const handleEscalateToDoctor = async () => {
    if (!activeSession) return;

    try {
      setEscalating(true);
      const res = await apiClient.post(`/assistants/chat/sessions/${activeSession.id}/escalate-doctor`, {
        doctorId: selectedDoctorId,
        reason: escalationReason,
        priority: escalationPriority,
      });

      if (res.success) {
        setShowEscalateModal(false);
        if (res.ticket) {
          setActiveTicket(res.ticket);
          setPatientTickets((prev) => [res.ticket, ...prev.filter((t) => t.id !== res.ticket.id)]);
        }
      }
    } catch (e) {
      console.error('Failed to escalate to doctor:', e);
    } finally {
      setEscalating(false);
    }
  };

  const handleStartCall = () => {
    if (!activeSession || !profile) return;
    staffWebRtcCall.startCall(activeSession.id, profile.fullName, activeSession.patientUserId);
  };

  const handleEndCall = () => {
    staffWebRtcCall.endCall();
  };

  const handleCloseSession = async () => {
    if (!activeSession) return;
    try {
      const res = await apiClient.patch(`/assistants/chat/sessions/${activeSession.id}/close`, {
        resolutionNotes,
      });
      if (res.success) {
        setShowResolutionModal(false);
        setResolutionNotes('');
        setSessions((prev) =>
          prev.map((s) => (s.id === activeSession.id ? { ...s, status: 'RESOLVED' } : s))
        );
        setActiveSession((prev) => (prev ? { ...prev, status: 'RESOLVED' } : null));
      }
    } catch (e) {
      console.error('Failed to close session:', e);
    }
  };

  const filteredSessions = sessions.filter((s) => {
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && s.status === 'ACTIVE') ||
      (statusFilter === 'RESOLVED' && s.status === 'RESOLVED');

    const matchesSearch =
      s.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.patientPhone && s.patientPhone.includes(searchQuery)) ||
      (s.lastMessage && s.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  const filteredQuickReplies = quickReplies.filter((qr) =>
    selectedQRCategory === 'ALL' ? true : qr.category === selectedQRCategory
  );

  return (
    <div className="health-assistant-dashboard" style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      {/* Top Presence & Quick Bar */}
      <div
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0d9488, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 10px rgba(13, 148, 136, 0.25)',
            }}
          >
            <HeartPulse size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {profile?.fullName || 'Senior ASHA Facilitator'}
              </h2>
              <span
                style={{
                  background: '#f0fdfa',
                  color: '#0f766e',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid #ccfbf1',
                }}
              >
                {profile?.designation || 'Health Assistant'}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              {profile?.phcName || 'Central Urban PHC - Karol Bagh'} • Languages: {profile?.languages.join(', ') || 'Hindi, English'}
            </div>
          </div>
        </div>

        {/* Presence Selector & Workspace Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: '8px', padding: '3px' }}>
            <button
              onClick={() => handlePresenceChange('ONLINE')}
              style={{
                background: presence === 'ONLINE' ? '#ffffff' : 'transparent',
                color: presence === 'ONLINE' ? '#16a34a' : '#64748b',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: presence === 'ONLINE' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
              <span>Available</span>
            </button>
            <button
              onClick={() => handlePresenceChange('BUSY')}
              style={{
                background: presence === 'BUSY' ? '#ffffff' : 'transparent',
                color: presence === 'BUSY' ? '#ea580c' : '#64748b',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: presence === 'BUSY' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f97316' }} />
              <span>In Consultation</span>
            </button>
            <button
              onClick={() => handlePresenceChange('OFFLINE')}
              style={{
                background: presence === 'OFFLINE' ? '#ffffff' : 'transparent',
                color: presence === 'OFFLINE' ? '#64748b' : '#94a3b8',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: presence === 'OFFLINE' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8' }} />
              <span>Off Duty</span>
            </button>
          </div>

          <button
            onClick={() => loadDashboardData()}
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '6px 10px',
              color: '#64748b',
              cursor: 'pointer',
            }}
            title="Refresh active tele-care queue"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* 3-Column Main Interface */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '320px 1fr 380px', overflow: 'hidden' }}>
        {/* Left Column: Tele-Care Queue & Presets */}
        <div
          style={{
            background: '#ffffff',
            borderRight: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Search & Filter Header */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search patient, phone, symptoms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 32px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                  outline: 'none',
                  background: '#f8fafc',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setStatusFilter('ACTIVE')}
                style={{
                  flex: 1,
                  background: statusFilter === 'ACTIVE' ? '#ccfbf1' : '#f1f5f9',
                  color: statusFilter === 'ACTIVE' ? '#0f766e' : '#64748b',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '5px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Active ({sessions.filter((s) => s.status === 'ACTIVE').length})
              </button>
              <button
                onClick={() => setStatusFilter('RESOLVED')}
                style={{
                  flex: 1,
                  background: statusFilter === 'RESOLVED' ? '#ccfbf1' : '#f1f5f9',
                  color: statusFilter === 'RESOLVED' ? '#0f766e' : '#64748b',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '5px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Resolved ({sessions.filter((s) => s.status === 'RESOLVED').length})
              </button>
              <button
                onClick={() => setStatusFilter('ALL')}
                style={{
                  background: statusFilter === 'ALL' ? '#ccfbf1' : '#f1f5f9',
                  color: statusFilter === 'ALL' ? '#0f766e' : '#64748b',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '5px 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                All
              </button>
            </div>
          </div>

          {/* Sessions List Scrollable */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {filteredSessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 14px', color: '#94a3b8' }}>
                <MessageSquare size={32} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                <p style={{ fontSize: '12px', margin: 0 }}>No consultations found</p>
              </div>
            ) : (
              filteredSessions.map((sess) => {
                const isSelected = sess.id === activeSession?.id;
                return (
                  <div
                    key={sess.id}
                    onClick={() => selectSession(sess)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      marginBottom: '6px',
                      cursor: 'pointer',
                      background: isSelected ? '#f0fdfa' : '#ffffff',
                      border: isSelected ? '1.5px solid #0d9488' : '1px solid #f1f5f9',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3px' }}>
                      <strong style={{ fontSize: '13px', color: '#0f172a' }}>{sess.patientName}</strong>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                        {new Date(sess.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                      {sess.patientAge ? `${sess.patientAge}y • ${sess.patientGender}` : 'Citizen'} • {sess.patientPhone}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#475569',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '210px',
                        }}
                      >
                        {sess.lastMessage}
                      </span>
                      {sess.unreadCountAssistant > 0 && (
                        <span
                          style={{
                            background: '#0d9488',
                            color: '#ffffff',
                            borderRadius: '50%',
                            width: '18px',
                            height: '18px',
                            fontSize: '10px',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {sess.unreadCountAssistant}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Center Column: Active Conversation Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8fafc' }}>
          {activeSession ? (
            <>
              {/* Active Conversation Top Bar */}
              <div
                style={{
                  background: '#ffffff',
                  borderBottom: '1px solid #e2e8f0',
                  padding: '10px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      {activeSession.patientName}
                    </h3>
                    <span
                      style={{
                        background: activeSession.status === 'ACTIVE' ? '#dcfce7' : '#f1f5f9',
                        color: activeSession.status === 'ACTIVE' ? '#15803d' : '#64748b',
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '6px',
                      }}
                    >
                      {activeSession.status}
                    </span>

                    {activeSession.escalatedDoctorId && (
                      <span
                        style={{
                          background: '#f3e8ff',
                          color: '#7e22ce',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <Stethoscope size={11} />
                        <span>Doctor Joined: {activeSession.escalatedDoctorName}</span>
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    Phone: {activeSession.patientPhone} • PHC: {activeSession.phcName}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* WebRTC Voice Call Trigger */}
                  <button
                    onClick={handleStartCall}
                    style={{
                      background: 'linear-gradient(135deg, #0d9488, #059669)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '7px 12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(13, 148, 136, 0.2)',
                    }}
                  >
                    <Phone size={14} />
                    <span>Voice Call</span>
                  </button>

                  {/* Escalate to Doctor Button */}
                  <button
                    onClick={() => setShowEscalateModal(true)}
                    style={{
                      background: '#ede9fe',
                      color: '#6d28d9',
                      border: '1px solid #ddd6fe',
                      borderRadius: '8px',
                      padding: '7px 12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer',
                    }}
                  >
                    <UserPlus size={14} />
                    <span>Escalate to Doctor</span>
                  </button>

                  {/* Quick-Reply Library Drawer Toggle */}
                  <button
                    onClick={() => setShowQuickReplyDrawer(!showQuickReplyDrawer)}
                    style={{
                      background: showQuickReplyDrawer ? '#ccfbf1' : '#f1f5f9',
                      color: showQuickReplyDrawer ? '#0f766e' : '#475569',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '7px 10px',
                      fontSize: '12px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                    }}
                    title="Open Quick Reply Templates"
                  >
                    <Sparkles size={14} color="#0d9488" />
                    <span>Templates</span>
                  </button>

                  {/* Resolve & Close Button */}
                  {activeSession.status === 'ACTIVE' && (
                    <button
                      onClick={() => setShowResolutionModal(true)}
                      style={{
                        background: '#f1f5f9',
                        color: '#0f766e',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '7px 10px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Resolve Session
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Reply Drawer (if open) */}
              {showQuickReplyDrawer && (
                <div
                  style={{
                    background: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    padding: '10px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '4px', overflowX: 'auto' }}>
                      {['ALL', 'Intake', 'Symptom Check', 'Medications', 'Home Care', 'Escalation', 'Emergency', 'Follow-up'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedQRCategory(cat)}
                          style={{
                            background: selectedQRCategory === cat ? '#0d9488' : '#ffffff',
                            color: selectedQRCategory === cat ? '#ffffff' : '#64748b',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '3px 8px',
                            fontSize: '10px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setShowQuickReplyDrawer(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                      <X size={14} />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                    {filteredQuickReplies.map((qr) => (
                      <div
                        key={qr.id}
                        onClick={() => {
                          setInputText(qr.text);
                          setShowQuickReplyDrawer(false);
                        }}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '6px 8px',
                          cursor: 'pointer',
                          fontSize: '11px',
                        }}
                      >
                        <strong style={{ display: 'block', color: '#0f766e', fontSize: '11px', marginBottom: '2px' }}>
                          {qr.title}
                        </strong>
                        <span style={{ color: '#64748b', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {qr.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages Feed */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {messages.map((m) => {
                  const isPatient = m.senderRole === 'PATIENT';
                  const isDoctor = m.senderRole === 'DOCTOR';
                  const isSystem = m.senderId === 'system' || m.senderRole === 'ADMIN';

                  if (isSystem) {
                    return (
                      <div key={m.id} style={{ display: 'flex', justifyContent: 'center', margin: '6px 0' }}>
                        <div
                          style={{
                            background: '#fef3c7',
                            border: '1px solid #fde68a',
                            color: '#92400e',
                            borderRadius: '16px',
                            padding: '6px 14px',
                            fontSize: '11px',
                            fontWeight: 600,
                            textAlign: 'center',
                            maxWidth: '85%',
                          }}
                        >
                          {m.text}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isPatient ? 'flex-start' : 'flex-end',
                      }}
                    >
                      <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '2px', padding: '0 4px' }}>
                        {isPatient ? m.senderName : isDoctor ? `🩺 ${m.senderName} (Doctor)` : `👩‍⚕️ ${m.senderName}`}
                      </div>

                      <div
                        style={{
                          maxWidth: '75%',
                          padding: '10px 14px',
                          borderRadius: '14px',
                          background: isPatient ? '#ffffff' : isDoctor ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'linear-gradient(135deg, #0d9488, #0f766e)',
                          color: isPatient ? '#0f172a' : '#ffffff',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.04)',
                          border: isPatient ? '1px solid #e2e8f0' : 'none',
                        }}
                      >
                        {m.attachment && (
                          <div style={{ marginBottom: '6px', cursor: 'pointer' }} onClick={() => setLightboxImage(m.attachment!.url)}>
                            <img
                              src={m.attachment.url}
                              alt={m.attachment.name}
                              style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px' }}
                            />
                            <span style={{ fontSize: '10px', opacity: 0.8, display: 'block', marginTop: '2px' }}>
                              📎 {m.attachment.name}
                            </span>
                          </div>
                        )}

                        <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>{m.text}</p>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: '4px',
                            marginTop: '4px',
                            fontSize: '9px',
                            opacity: isPatient ? 0.6 : 0.85,
                          }}
                        >
                          <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {!isPatient && (
                            <span>{m.status === 'READ' ? <CheckCheck size={12} color="#38bdf8" /> : <Check size={12} />}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isTypingPeer && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
                      {activeSession.patientName} is typing...
                    </span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Selected Image Preview */}
              {selectedImage && (
                <div
                  style={{
                    background: '#f1f5f9',
                    padding: '6px 14px',
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img src={selectedImage.url} alt="Upload preview" style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover' }} />
                    <span style={{ fontSize: '11px', fontWeight: 600 }}>{selectedImage.name}</span>
                  </div>
                  <button onClick={() => setSelectedImage(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Chat Input Bar */}
              <div
                style={{
                  background: '#ffffff',
                  borderTop: '1px solid #e2e8f0',
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  style={{ display: 'none' }}
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0d9488',
                    cursor: 'pointer',
                  }}
                  title="Attach report or clinical photo"
                >
                  <ImageIcon size={18} />
                </button>

                <textarea
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={`Write message to ${activeSession.patientName}...`}
                  rows={1}
                  style={{
                    flex: 1,
                    border: '1px solid #cbd5e1',
                    borderRadius: '20px',
                    padding: '8px 14px',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'none',
                    fontFamily: 'inherit',
                  }}
                />

                <button
                  onClick={() => handleSendMessage()}
                  disabled={(!inputText.trim() && !selectedImage) || sending}
                  style={{
                    background: (!inputText.trim() && !selectedImage) || sending ? '#cbd5e1' : '#0d9488',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: (!inputText.trim() && !selectedImage) || sending ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Send size={16} />
                </button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              <HeartPulse size={48} style={{ opacity: 0.4, marginBottom: '10px' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Select a patient consultation from the left queue</h3>
            </div>
          )}
        </div>

        {/* Right Column: Multi-Tab Support Console */}
        <div
          style={{
            background: '#ffffff',
            borderLeft: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Tab Navigation Header */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <button
              onClick={() => setRightPanelTab('dossier')}
              style={{
                flex: 1,
                padding: '10px 4px',
                fontSize: '11px',
                fontWeight: 700,
                border: 'none',
                background: rightPanelTab === 'dossier' ? '#ffffff' : 'transparent',
                color: rightPanelTab === 'dossier' ? '#0d9488' : '#64748b',
                borderBottom: rightPanelTab === 'dossier' ? '2px solid #0d9488' : 'none',
                cursor: 'pointer',
              }}
            >
              Dossier
            </button>
            <button
              onClick={() => setRightPanelTab('ticket')}
              style={{
                flex: 1,
                padding: '10px 4px',
                fontSize: '11px',
                fontWeight: 700,
                border: 'none',
                background: rightPanelTab === 'ticket' ? '#ffffff' : 'transparent',
                color: rightPanelTab === 'ticket' ? '#0d9488' : '#64748b',
                borderBottom: rightPanelTab === 'ticket' ? '2px solid #0d9488' : 'none',
                cursor: 'pointer',
              }}
            >
              Ticket {activeTicket && `(${activeTicket.status})`}
            </button>
            <button
              onClick={() => setRightPanelTab('sharedNotes')}
              style={{
                flex: 1,
                padding: '10px 4px',
                fontSize: '11px',
                fontWeight: 700,
                border: 'none',
                background: rightPanelTab === 'sharedNotes' ? '#ffffff' : 'transparent',
                color: rightPanelTab === 'sharedNotes' ? '#0d9488' : '#64748b',
                borderBottom: rightPanelTab === 'sharedNotes' ? '2px solid #0d9488' : 'none',
                cursor: 'pointer',
              }}
            >
              Care Notes
            </button>
            <button
              onClick={() => {
                setRightPanelTab('timeline');
                loadTimeline();
              }}
              style={{
                flex: 1,
                padding: '10px 4px',
                fontSize: '11px',
                fontWeight: 700,
                border: 'none',
                background: rightPanelTab === 'timeline' ? '#ffffff' : 'transparent',
                color: rightPanelTab === 'timeline' ? '#0d9488' : '#64748b',
                borderBottom: rightPanelTab === 'timeline' ? '2px solid #0d9488' : 'none',
                cursor: 'pointer',
              }}
            >
              Timeline
            </button>
          </div>

          {/* Tab Content Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
            {/* TAB 1: PATIENT DOSSIER */}
            {rightPanelTab === 'dossier' && (
              <div>
                {activePatient ? (
                  <div>
                    <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                      <strong style={{ fontSize: '13px', color: '#0f172a' }}>{activePatient.fullName}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        ID: {activePatient.patientId} • Blood: {activePatient.bloodGroup || 'O+ve'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
                        Emergency Contact: {activePatient.emergencyContactName} ({activePatient.emergencyContactPhone})
                      </div>
                    </div>

                    {/* Vitals */}
                    <div style={{ marginBottom: '12px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                        Recent Clinical Vitals
                      </span>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '4px' }}>
                        <div style={{ background: '#f1f5f9', padding: '6px 8px', borderRadius: '6px', textAlign: 'center' }}>
                          <span style={{ fontSize: '9px', color: '#64748b' }}>Blood Pressure</span>
                          <strong style={{ fontSize: '12px', display: 'block', color: '#0f172a' }}>122/80</strong>
                        </div>
                        <div style={{ background: '#f1f5f9', padding: '6px 8px', borderRadius: '6px', textAlign: 'center' }}>
                          <span style={{ fontSize: '9px', color: '#64748b' }}>Pulse Rate</span>
                          <strong style={{ fontSize: '12px', display: 'block', color: '#0f172a' }}>76 bpm</strong>
                        </div>
                        <div style={{ background: '#f1f5f9', padding: '6px 8px', borderRadius: '6px', textAlign: 'center' }}>
                          <span style={{ fontSize: '9px', color: '#64748b' }}>Blood Sugar</span>
                          <strong style={{ fontSize: '12px', display: 'block', color: '#0f766e' }}>118 mg/dL</strong>
                        </div>
                        <div style={{ background: '#f1f5f9', padding: '6px 8px', borderRadius: '6px', textAlign: 'center' }}>
                          <span style={{ fontSize: '9px', color: '#64748b' }}>SpO2</span>
                          <strong style={{ fontSize: '12px', display: 'block', color: '#0f172a' }}>99%</strong>
                        </div>
                      </div>
                    </div>

                    {/* Chronic Conditions */}
                    <div style={{ marginBottom: '12px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                        Existing Conditions
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                        {(activePatient.existingConditions?.length ? activePatient.existingConditions : ['Type 2 Diabetes (Mild)']).map((c, i) => (
                          <span key={i} style={{ background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '8px', fontSize: '10px', fontWeight: 600 }}>
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Active Medications */}
                    <div style={{ marginBottom: '14px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                        Active Prescriptions
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                        {(activePatient.currentMedications?.length ? activePatient.currentMedications : ['Metformin 500mg (1-0-1)', 'Amlodipine 5mg (1-0-0)']).map((m, i) => (
                          <div key={i} style={{ background: '#eff6ff', padding: '5px 8px', borderRadius: '6px', fontSize: '11px', color: '#1e40af', fontWeight: 600 }}>
                            💊 {m}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Button to Open Ticket */}
                    <button
                      onClick={() => {
                        if (activeTicket) {
                          setRightPanelTab('ticket');
                        } else {
                          setShowNewTicketModal(true);
                        }
                      }}
                      style={{
                        width: '100%',
                        background: '#0d9488',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <ListPlus size={14} />
                      <span>{activeTicket ? 'View Support Ticket' : 'Open On-Call Ticket'}</span>
                    </button>
                  </div>
                ) : (
                  <p style={{ color: '#94a3b8', fontSize: '12px', textAlign: 'center' }}>No patient selected</p>
                )}
              </div>
            )}

            {/* TAB 2: ON-CALL SUPPORT TICKET */}
            {rightPanelTab === 'ticket' && (
              <div>
                {activeTicket ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f766e' }}>
                        {activeTicket.ticketNumber}
                      </span>
                      <span
                        style={{
                          background: activeTicket.status === 'RESOLVED' ? '#dcfce7' : activeTicket.status === 'ESCALATED' ? '#f3e8ff' : '#eff6ff',
                          color: activeTicket.status === 'RESOLVED' ? '#15803d' : activeTicket.status === 'ESCALATED' ? '#7e22ce' : '#1d4ed8',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '10px',
                        }}
                      >
                        {activeTicket.status}
                      </span>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <strong style={{ fontSize: '12px', color: '#0f172a' }}>{activeTicket.subject}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        Category: {activeTicket.category} • Priority: {activeTicket.priority}
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                        Clinical Tags
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                        {activeTicket.tags.map((t, idx) => (
                          <span key={idx} style={{ background: '#ccfbf1', color: '#0f766e', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 700 }}>
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Clinical Notes */}
                    <div>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                        Observations & Consultation Notes
                      </span>
                      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px', fontSize: '11px', color: '#334155', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                        {activeTicket.notes || 'No detailed observations recorded.'}
                      </div>
                    </div>

                    {/* Resolution Summary (if resolved) */}
                    {activeTicket.resolutionSummary && (
                      <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '8px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#065f46', textTransform: 'uppercase' }}>
                          Resolution Summary
                        </span>
                        <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#047857' }}>
                          {activeTicket.resolutionSummary}
                        </p>
                      </div>
                    )}

                    {/* Audit Action Log */}
                    <div>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                        Action Audit Trail
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                        {activeTicket.actionLogs.map((log) => (
                          <div key={log.id} style={{ background: '#f8fafc', padding: '6px 8px', borderRadius: '6px', fontSize: '10px', borderLeft: '2px solid #0d9488' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                              <strong>{log.actorName}</strong>
                              <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div style={{ color: '#0f172a', marginTop: '1px' }}>{log.details}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    {activeTicket.status !== 'RESOLVED' && activeTicket.status !== 'CLOSED' && (
                      <button
                        onClick={() => setShowResolveTicketModal(true)}
                        style={{
                          background: '#16a34a',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          marginTop: '6px',
                        }}
                      >
                        <CheckCircle size={14} />
                        <span>Resolve Support Ticket</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <p style={{ fontSize: '12px', color: '#64748b' }}>No active ticket linked to this consultation.</p>
                    <button
                      onClick={() => setShowNewTicketModal(true)}
                      style={{
                        background: '#0d9488',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '7px 14px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      + Open Support Ticket
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: SHARED CARE NOTES */}
            {rightPanelTab === 'sharedNotes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#0f766e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Share2 size={13} />
                    <span>Live Patient Care Advisory</span>
                  </span>
                  {notesSaveSuccess && (
                    <span style={{ fontSize: '10px', color: '#16a34a', fontWeight: 700 }}>
                      ✓ Synced to Patient Mobile
                    </span>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>Plan Title</label>
                  <input
                    type="text"
                    value={notesTitle}
                    onChange={(e) => setNotesTitle(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>

                {/* Instructions List */}
                <div>
                  <label style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>Key Patient Instructions</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
                    {instructionsList.map((inst, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontSize: '11px' }}>
                        <span style={{ flex: 1 }}>• {inst}</span>
                        <button
                          onClick={() => setInstructionsList(instructionsList.filter((_, i) => i !== idx))}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                      <input
                        type="text"
                        placeholder="Add instruction..."
                        value={newInstructionInput}
                        onChange={(e) => setNewInstructionInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newInstructionInput.trim()) {
                            setInstructionsList([...instructionsList, newInstructionInput.trim()]);
                            setNewInstructionInput('');
                          }
                        }}
                        style={{ flex: 1, padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11px' }}
                      />
                      <button
                        onClick={() => {
                          if (newInstructionInput.trim()) {
                            setInstructionsList([...instructionsList, newInstructionInput.trim()]);
                            setNewInstructionInput('');
                          }
                        }}
                        style={{ background: '#0d9488', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '0 8px', fontSize: '11px', cursor: 'pointer' }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Dietary Precautions */}
                <div>
                  <label style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>Dietary & Lifestyle Advice</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
                    {dietaryList.map((diet, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fef3c7', padding: '4px 8px', borderRadius: '6px', fontSize: '11px' }}>
                        <span style={{ flex: 1 }}>🥗 {diet}</span>
                        <button
                          onClick={() => setDietaryList(dietaryList.filter((_, i) => i !== idx))}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#b45309' }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input
                        type="text"
                        placeholder="Add dietary tip..."
                        value={newDietInput}
                        onChange={(e) => setNewDietInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newDietInput.trim()) {
                            setDietaryList([...dietaryList, newDietInput.trim()]);
                            setNewDietInput('');
                          }
                        }}
                        style={{ flex: 1, padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11px' }}
                      />
                      <button
                        onClick={() => {
                          if (newDietInput.trim()) {
                            setDietaryList([...dietaryList, newDietInput.trim()]);
                            setNewDietInput('');
                          }
                        }}
                        style={{ background: '#0d9488', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '0 8px', fontSize: '11px', cursor: 'pointer' }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Emergency Red-Flag Warning */}
                <div>
                  <label style={{ fontSize: '10px', fontWeight: 700, color: '#b91c1c' }}>Emergency Warning (Red Flags)</label>
                  <textarea
                    rows={2}
                    value={emergencyWarningText}
                    onChange={(e) => setEmergencyWarningText(e.target.value)}
                    placeholder="E.g. If chest pain or severe dizziness occurs, call 108 immediately."
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fff5f5', fontSize: '11px' }}
                  />
                </div>

                <button
                  onClick={handleSaveSharedNotes}
                  disabled={savingNotes}
                  style={{
                    background: 'linear-gradient(135deg, #0d9488, #059669)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: savingNotes ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Save size={14} />
                  <span>{savingNotes ? 'Saving & Broadcasting...' : 'Save & Sync to Patient Mobile'}</span>
                </button>
              </div>
            )}

            {/* TAB 4: PATIENT TIMELINE */}
            {rightPanelTab === 'timeline' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#0f766e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <History size={13} />
                    <span>Patient Journey Timeline</span>
                  </span>
                  <button
                    onClick={() => loadTimeline()}
                    style={{ background: 'transparent', border: 'none', color: '#0d9488', fontSize: '11px', cursor: 'pointer' }}
                  >
                    Refresh
                  </button>
                </div>

                {/* Filter Pills */}
                <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', marginBottom: '8px' }}>
                  {['ALL', 'VOICE_CALL', 'SUPPORT_TICKET', 'DOCTOR_ESCALATION', 'OPD_APPOINTMENT', 'PRE_CHECKUP'].map((flt) => (
                    <button
                      key={flt}
                      onClick={() => setTimelineFilter(flt)}
                      style={{
                        background: timelineFilter === flt ? '#0d9488' : '#f1f5f9',
                        color: timelineFilter === flt ? '#ffffff' : '#64748b',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '2px 6px',
                        fontSize: '9px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {flt.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                {loadingTimeline ? (
                  <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '11px' }}>Loading timeline...</p>
                ) : patientTimeline.filter((e) => timelineFilter === 'ALL' || e.type === timelineFilter).length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '11px' }}>No events recorded for this patient.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {patientTimeline
                      .filter((e) => timelineFilter === 'ALL' || e.type === timelineFilter)
                      .map((item) => (
                        <div
                          key={item.id}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '8px 10px',
                            borderLeft: `3px solid ${
                              item.badgeVariant === 'purple'
                                ? '#7c3aed'
                                : item.badgeVariant === 'success'
                                ? '#16a34a'
                                : item.badgeVariant === 'warning'
                                ? '#d97706'
                                : item.badgeVariant === 'danger'
                                ? '#dc2626'
                                : '#0d9488'
                            }`,
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <strong style={{ fontSize: '11px', color: '#0f172a' }}>{item.title}</strong>
                            {item.badgeText && (
                              <span
                                style={{
                                  background: '#f1f5f9',
                                  color: '#475569',
                                  fontSize: '9px',
                                  fontWeight: 700,
                                  padding: '1px 5px',
                                  borderRadius: '6px',
                                }}
                              >
                                {item.badgeText}
                              </span>
                            )}
                          </div>

                          <p style={{ fontSize: '11px', color: '#475569', margin: '2px 0' }}>{item.description}</p>

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#94a3b8', marginTop: '4px' }}>
                            <span>By {item.actorName}</span>
                            <span>{new Date(item.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: Open New Support Ticket */}
      {showNewTicketModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', width: '480px', maxWidth: '90vw' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                Open On-Call Support Ticket
              </h3>
              <button onClick={() => setShowNewTicketModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>Subject / Issue</label>
                <input
                  type="text"
                  placeholder="E.g. Fasting Blood Glucose Review & Dosage Counseling"
                  value={newTicketSubject}
                  onChange={(e) => setNewTicketSubject(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>Category</label>
                  <select
                    value={newTicketCategory}
                    onChange={(e) => setNewTicketCategory(e.target.value as SupportTicketCategory)}
                    style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  >
                    <option value="GENERAL_CONSULTATION">General Consultation</option>
                    <option value="SYMPTOM_ASSESSMENT">Symptom Assessment</option>
                    <option value="MEDICATION_INQUIRY">Medication Inquiry</option>
                    <option value="MATERNAL_CHILD_HEALTH">Maternal & Child Health</option>
                    <option value="CHRONIC_CARE_NCD">Chronic Care & NCD</option>
                    <option value="EMERGENCY_TRIAGE">Emergency Triage</option>
                    <option value="LAB_REPORT_REVIEW">Lab Report Review</option>
                    <option value="POST_OPD_FOLLOWUP">Post-OPD Followup</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>Priority</label>
                  <select
                    value={newTicketPriority}
                    onChange={(e) => setNewTicketPriority(e.target.value as SupportTicketPriority)}
                    style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>Tags</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '4px' }}>
                  {newTicketTags.map((t, idx) => (
                    <span key={idx} style={{ background: '#ccfbf1', color: '#0f766e', padding: '2px 6px', borderRadius: '8px', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                      #{t}
                      <button
                        onClick={() => setNewTicketTags(newTicketTags.filter((_, i) => i !== idx))}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#0f766e' }}
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input
                    type="text"
                    placeholder="Add tag (e.g. Fever, Diabetes)..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tagInput.trim()) {
                        setNewTicketTags([...newTicketTags, tagInput.trim()]);
                        setTagInput('');
                      }
                    }}
                    style={{ flex: 1, padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11px' }}
                  />
                  <button
                    onClick={() => {
                      if (tagInput.trim()) {
                        setNewTicketTags([...newTicketTags, tagInput.trim()]);
                        setTagInput('');
                      }
                    }}
                    style={{ background: '#0d9488', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '0 8px', fontSize: '11px', cursor: 'pointer' }}
                  >
                    Add
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>Clinical Observations</label>
                <textarea
                  rows={3}
                  value={newTicketNotes}
                  onChange={(e) => setNewTicketNotes(e.target.value)}
                  placeholder="Record patient symptoms, vital trends, and actions taken during this call..."
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  onClick={() => setShowNewTicketModal(false)}
                  style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '7px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSupportTicket}
                  disabled={!newTicketSubject.trim()}
                  style={{ background: '#0d9488', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '7px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Create Support Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Escalate to Doctor */}
      {showEscalateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', width: '460px', maxWidth: '90vw' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#6d28d9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <UserPlus size={16} />
                <span>Escalate to PHC Medical Officer</span>
              </h3>
              <button onClick={() => setShowEscalateModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>Select On-Duty Doctor</label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                >
                  {availableDoctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.fullName} ({doc.specialization}) - {doc.status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>Escalation Reason</label>
                <textarea
                  rows={3}
                  value={escalationReason}
                  onChange={(e) => setEscalationReason(e.target.value)}
                  placeholder="Explain why clinical physician oversight is required..."
                  style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />
              </div>

              <div style={{ background: '#f5f3ff', padding: '10px', borderRadius: '8px', border: '1px solid #ddd6fe', fontSize: '11px', color: '#5b21b6' }}>
                ℹ️ Escalating will immediately add the doctor to this 3-way consultation session, post a system join notice, and alert the doctor's dashboard.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  onClick={() => setShowEscalateModal(false)}
                  style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '7px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleEscalateToDoctor}
                  disabled={escalating}
                  style={{ background: '#6d28d9', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '7px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  {escalating ? 'Escalating...' : 'Confirm Escalation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Resolve Support Ticket */}
      {showResolveTicketModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', width: '450px', maxWidth: '90vw' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#15803d' }}>
                Resolve Support Ticket
              </h3>
              <button onClick={() => setShowResolveTicketModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>Resolution Summary</label>
                <textarea
                  rows={3}
                  value={ticketResolutionSummary}
                  onChange={(e) => setTicketResolutionSummary(e.target.value)}
                  placeholder="E.g. Fasting glucose report verified. Diet plan shared and patient agreed to 30 min daily morning walk."
                  style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  onClick={() => setShowResolveTicketModal(false)}
                  style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '7px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleResolveTicket}
                  style={{ background: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '7px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Mark as Resolved
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Resolve Chat Session */}
      {showResolutionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', width: '450px', maxWidth: '90vw' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 10px 0', color: '#0f172a' }}>
              Archive & Resolve Consultation Session
            </h3>
            <textarea
              rows={3}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Summary of tele-care resolution..."
              style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', marginBottom: '10px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setShowResolutionModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '7px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleCloseSession} style={{ background: '#0d9488', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '7px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                Resolve Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            cursor: 'zoom-out',
          }}
        >
          <img src={lightboxImage} alt="Fullscreen preview" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '8px' }} />
        </div>
      )}
    </div>
  );
};
