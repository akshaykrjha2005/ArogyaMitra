import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Phone,
  PhoneOff,
  PhoneCall,
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
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  FileText,
  Calendar,
  Building2,
  Activity,
  HeartPulse,
  Ticket,
  CheckCircle2,
  History,
  Tag,
  Plus,
  Stethoscope,
} from 'lucide-react';
import {
  PatientProfile,
  HealthAssistantProfile,
  ChatSession,
  ChatMessage,
  SharedCareNote,
  OnCallSupportTicket,
  AppLanguage,
} from '@phc-connect/types';
import { apiClient } from '../services/api';
import { chatSocket } from '../services/chatSocket';
import { webrtcCall, CallState } from '../utils/webrtcClient';

interface HealthAssistantChatScreenProps {
  patient: PatientProfile;
  onNavigate: (tab: string, extra?: any) => void;
  lang?: AppLanguage;
  initialAssistantId?: string;
}

export const HealthAssistantChatScreen: React.FC<HealthAssistantChatScreenProps> = ({
  patient,
  onNavigate,
  lang = 'en',
  initialAssistantId,
}) => {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [currentAssistant, setCurrentAssistant] = useState<HealthAssistantProfile | null>(null);
  const [allAssistants, setAllAssistants] = useState<HealthAssistantProfile[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [isTypingPeer, setIsTypingPeer] = useState<boolean>(false);
  const [showAssistantSheet, setShowAssistantSheet] = useState<boolean>(false);
  const [showHistorySheet, setShowHistorySheet] = useState<boolean>(false);
  const [pastSessions, setPastSessions] = useState<ChatSession[]>([]);

  // On-Call Support & Live Shared Care Notes State
  const [sharedNotes, setSharedNotes] = useState<SharedCareNote | null>(null);
  const [showSharedNotesSheet, setShowSharedNotesSheet] = useState<boolean>(false);
  const [activeTicket, setActiveTicket] = useState<OnCallSupportTicket | null>(null);
  const [escalatedDoctor, setEscalatedDoctor] = useState<{ id: string; name: string; designation?: string } | null>(null);
  const [newPatientNoteInput, setNewPatientNoteInput] = useState<string>('');
  const [savingNote, setSavingNote] = useState<boolean>(false);

  // Image Attachment State
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string; file?: File } | null>(null);
  const [previewLightbox, setPreviewLightbox] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // WebRTC Call State
  const [callState, setCallState] = useState<CallState>(webrtcCall.getState());
  const [showCallbackSuccess, setShowCallbackSuccess] = useState<boolean>(false);
  const [callbackReason, setCallbackReason] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Connect socket and load session
  useEffect(() => {
    chatSocket.connect();

    // Subscribe to real-time events
    const unsubMessage = chatSocket.subscribe('MESSAGE_RECEIVED', (payload) => {
      if (payload.message && payload.sessionId === session?.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.message?.id)) return prev;
          return [...prev, payload.message!];
        });
        chatSocket.markAsRead(session.id);
      }
    });

    const unsubRead = chatSocket.subscribe('MESSAGE_READ', (payload) => {
      if (payload.sessionId === session?.id) {
        setMessages((prev) =>
          prev.map((m) => (m.senderId === patient.userId ? { ...m, status: 'READ' } : m))
        );
      }
    });

    const unsubTyping = chatSocket.subscribe('TYPING', (payload) => {
      if (payload.sessionId === session?.id) {
        setIsTypingPeer(!!payload.isTyping);
      }
    });

    const unsubStatus = chatSocket.subscribe('ASSISTANT_STATUS_UPDATE', (payload) => {
      if (payload.status) {
        setAllAssistants((prev) =>
          prev.map((a) => (a.userId === payload.senderId ? { ...a, status: payload.status! } : a))
        );
        if (currentAssistant && currentAssistant.userId === payload.senderId) {
          setCurrentAssistant((prev) => (prev ? { ...prev, status: payload.status! } : null));
        }
      }
    });

    // Real-time Shared Care Note update from staff
    const unsubSharedNote = chatSocket.subscribe('SHARED_NOTE_UPDATE', (payload) => {
      if (payload.sessionId === session?.id && (payload.sharedNote || (payload as any).notes)) {
        setSharedNotes(payload.sharedNote || (payload as any).notes);
      }
    });

    // Real-time Doctor Escalation join
    const unsubDoctorEscalated = chatSocket.subscribe('DOCTOR_ESCALATED', (payload) => {
      const doc = payload.doctor || (payload as any).metadata?.doctor;
      if (payload.sessionId === session?.id && doc) {
        setEscalatedDoctor({
          id: doc.id,
          name: doc.name || (doc as any).fullName,
          designation: doc.specialization || (doc as any).designation || 'Medical Officer',
        });
      }
    });

    // Real-time Ticket update
    const unsubTicket = chatSocket.subscribe('TICKET_UPDATED', (payload) => {
      const tkt = payload.ticket || (payload as any).metadata?.ticket;
      if (tkt) {
        setActiveTicket(tkt);
      }
    });

    const unsubCall = webrtcCall.subscribe((state) => {
      setCallState(state);
    });

    loadInitialData();

    return () => {
      unsubMessage();
      unsubRead();
      unsubTyping();
      unsubStatus();
      unsubSharedNote();
      unsubDoctorEscalated();
      unsubTicket();
      unsubCall();
    };
  }, [session?.id, patient.userId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTypingPeer]);

  const loadSharedNotes = async (sessId: string) => {
    try {
      const res = await apiClient.get(`/assistants/chat/sessions/${sessId}/notes`);
      if (res.success && res.notes) {
        setSharedNotes(res.notes);
      }
    } catch (err) {
      console.error('Failed to load shared care notes:', err);
    }
  };

  const handleSavePatientSharedNote = async () => {
    if (!session || !newPatientNoteInput.trim()) return;
    try {
      setSavingNote(true);
      const existingSummary = sharedNotes?.summary || '';
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const updatedSummary = existingSummary
        ? `${existingSummary}\n• [Patient Note ${timeStr}] ${newPatientNoteInput.trim()}`
        : `• [Patient Note ${timeStr}] ${newPatientNoteInput.trim()}`;

      const res = await apiClient.put(`/assistants/chat/sessions/${session.id}/notes`, {
        title: sharedNotes?.title || 'Shared Care & Advice Plan',
        summary: updatedSummary,
        instructions: sharedNotes?.instructions || [],
        dietaryPrecautions: sharedNotes?.dietaryPrecautions || [],
        medicationNotes: sharedNotes?.medicationNotes || [],
        emergencyWarning: sharedNotes?.emergencyWarning || null,
      });

      if (res.success && res.notes) {
        setSharedNotes(res.notes);
        setNewPatientNoteInput('');
      }
    } catch (err) {
      console.error('Failed to save patient note:', err);
    } finally {
      setSavingNote(false);
    }
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // 1. Fetch available assistants
      const asstRes = await apiClient.get('/assistants');
      if (asstRes.success && asstRes.assistants) {
        setAllAssistants(asstRes.assistants);
      }

      // 2. Auto-route to assistant or find session
      const routeRes = await apiClient.post('/assistants/route', {
        assistantId: initialAssistantId,
        phcId: 'phc-001',
      });

      if (routeRes.success && routeRes.session) {
        setSession(routeRes.session);
        setCurrentAssistant(routeRes.assistant);
        setMessages(routeRes.messages || []);
        chatSocket.markAsRead(routeRes.session.id);
        if (routeRes.session.escalatedDoctorId) {
          setEscalatedDoctor({
            id: routeRes.session.escalatedDoctorId,
            name: routeRes.session.escalatedDoctorName || 'Medical Officer',
            designation: 'Assigned PHC Doctor',
          });
        }
        loadSharedNotes(routeRes.session.id);
      }

      // 3. Load user past sessions
      const sessRes = await apiClient.get('/assistants/chat/sessions');
      if (sessRes.success && sessRes.sessions) {
        setPastSessions(sessRes.sessions);
      }
    } catch (e) {
      console.error('Failed to load chat data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchAssistant = async (assistant: HealthAssistantProfile) => {
    try {
      setLoading(true);
      setShowAssistantSheet(false);
      const res = await apiClient.post('/assistants/route', {
        assistantId: assistant.id,
      });

      if (res.success && res.session) {
        setSession(res.session);
        setCurrentAssistant(res.assistant);
        setMessages(res.messages || []);
        chatSocket.markAsRead(res.session.id);
        loadSharedNotes(res.session.id);
      }
    } catch (e) {
      console.error('Failed to switch assistant:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPastSession = async (sess: ChatSession) => {
    try {
      setLoading(true);
      setShowHistorySheet(false);
      const res = await apiClient.get(`/assistants/chat/sessions/${sess.id}`);
      if (res.success && res.session) {
        setSession(res.session);
        setCurrentAssistant(res.assistant || null);
        setMessages(res.messages || []);
        chatSocket.markAsRead(sess.id);
        loadSharedNotes(sess.id);
      }
    } catch (e) {
      console.error('Failed to open past session:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);

    if (session) {
      chatSocket.sendTyping(session.id, true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        chatSocket.sendTyping(session.id, false);
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
    if ((!text && !selectedImage) || !session || !currentAssistant) return;

    try {
      setSending(true);
      let attachmentPayload = null;

      if (selectedImage) {
        attachmentPayload = {
          url: selectedImage.url,
          name: selectedImage.name,
          type: 'IMAGE',
          sizeBytes: selectedImage.file?.size || 150000,
        };
      }

      // Optimistic message update
      const tempId = `msg-tmp-${Date.now()}`;
      const optimisticMsg: ChatMessage = {
        id: tempId,
        sessionId: session.id,
        senderId: patient.userId,
        senderName: patient.fullName,
        senderRole: 'PATIENT',
        recipientId: currentAssistant.userId,
        text: text || '',
        attachment: attachmentPayload as any,
        status: 'SENT',
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, optimisticMsg]);
      setInputText('');
      setSelectedImage(null);

      // Dispatch through REST & WebSocket
      const res = await apiClient.post(`/assistants/chat/sessions/${session.id}/messages`, {
        text,
        attachment: attachmentPayload,
      });

      if (res.success && res.message) {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? res.message : m)));
      }
    } catch (e) {
      console.error('Failed to send message:', e);
    } finally {
      setSending(false);
    }
  };

  const handleStartCall = () => {
    if (!session || !currentAssistant) return;
    webrtcCall.startCall(
      session.id,
      currentAssistant.userId,
      currentAssistant.fullName,
      currentAssistant.designation
    );
  };

  const handleRequestFallbackCallback = async () => {
    try {
      const res = await apiClient.post('/call/callbacks', {
        name: patient.fullName,
        phone: patient.phone,
        reason: callbackReason || `Assistance request with ${currentAssistant?.fullName || 'ASHA Worker'} regarding maternal care & prescription query`,
        preferredTime: 'Immediate / Next Available Slot',
        phcId: currentAssistant?.phcId || 'phc-001',
      });

      if (res.success) {
        setShowCallbackSuccess(true);
        webrtcCall.endCall();
      }
    } catch (e) {
      console.error('Failed to request callback:', e);
    }
  };

  const formatCallTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatMessageTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const onlineAssistantsCount = allAssistants.filter((a) => a.status === 'ONLINE').length;

  return (
    <div className="health-assistant-chat-view" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8fafc' }}>
      {/* Top Navigation Header */}
      <div
        className="chat-header-bar"
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
          <button
            onClick={() => onNavigate('home')}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={18} />
          </button>

          {/* Assistant Info & Switcher Trigger */}
          <div
            onClick={() => setShowAssistantSheet(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              flex: 1,
              minWidth: 0,
            }}
            title="Click to view all available human health assistants"
          >
            <div style={{ position: 'relative' }}>
              <img
                src={
                  currentAssistant?.avatarUrl ||
                  'https://images.unsplash.com/photo-1594824813593-a9d949ec3643?w=150&auto=format&fit=crop&q=80'
                }
                alt={currentAssistant?.fullName || 'Health Assistant'}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #0d9488',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background:
                    currentAssistant?.status === 'ONLINE'
                      ? '#10b981'
                      : currentAssistant?.status === 'BUSY'
                      ? '#f59e0b'
                      : '#94a3b8',
                  border: '2px solid #ffffff',
                }}
              />
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <h3
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#0f172a',
                    margin: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {currentAssistant?.fullName || 'Human Health Worker'}
                </h3>
                <ChevronDown size={14} color="#64748b" />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    color: currentAssistant?.status === 'ONLINE' ? '#0f766e' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                >
                  {currentAssistant?.status === 'ONLINE'
                    ? '🟢 Online • Human Assistant'
                    : currentAssistant?.status === 'BUSY'
                    ? '🟡 Busy with patient'
                    : '⚪ Offline'}
                </span>
                <span style={{ fontSize: '9px', color: '#94a3b8' }}>•</span>
                <span style={{ fontSize: '10px', color: '#475569', fontWeight: 500 }}>
                  {currentAssistant?.role === 'ASHA_FACILITATOR' ? 'ASHA Facilitator' : 'Community Nurse'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Care Notes Button */}
          <button
            onClick={() => setShowSharedNotesSheet(true)}
            style={{
              background: sharedNotes ? '#f0fdfa' : '#f8fafc',
              border: sharedNotes ? '1px solid #99f6e4' : '1px solid #e2e8f0',
              borderRadius: '20px',
              padding: '5px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 700,
              color: sharedNotes ? '#0f766e' : '#475569',
              cursor: 'pointer',
            }}
            title="View Live Shared Care Notes & Advice"
          >
            <FileText size={13} color={sharedNotes ? '#0d9488' : '#64748b'} />
            <span>Notes</span>
            {sharedNotes && (
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0d9488' }} />
            )}
          </button>

          {/* Timeline Button */}
          <button
            onClick={() => onNavigate('timeline')}
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '20px',
              padding: '5px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 600,
              color: '#475569',
              cursor: 'pointer',
            }}
            title="View Care Timeline"
          >
            <History size={13} />
            <span>Timeline</span>
          </button>

          {/* WebRTC Audio Call Button */}
          <button
            onClick={handleStartCall}
            style={{
              background: 'linear-gradient(135deg, #0d9488, #059669)',
              border: 'none',
              borderRadius: '20px',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#ffffff',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(13, 148, 136, 0.25)',
              transition: 'transform 0.15s ease',
            }}
            title="Start direct WebRTC voice call with health worker"
          >
            <Phone size={14} />
            <span>Call</span>
          </button>
        </div>
      </div>

      {/* Human Health Assistant Verified Banner */}
      <div
        style={{
          background: '#f0fdfa',
          borderBottom: '1px solid #ccfbf1',
          padding: '6px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: '#0f766e',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={14} color="#0d9488" />
          <span>
            <strong>Verified Human Staff:</strong> You are talking to real health workers at{' '}
            {currentAssistant?.phcName || 'PHC Karol Bagh'}.
          </span>
        </div>
        <span
          onClick={() => setShowAssistantSheet(true)}
          style={{
            fontSize: '10px',
            fontWeight: 700,
            textDecoration: 'underline',
            cursor: 'pointer',
          }}
        >
          {onlineAssistantsCount} Online Now
        </span>
      </div>

      {/* Doctor Escalation Active Banner */}
      {(escalatedDoctor || session?.escalatedDoctorId) && (
        <div
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
            color: '#ffffff',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            boxShadow: '0 2px 4px rgba(124, 58, 237, 0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Stethoscope size={14} color="#ffffff" />
            </div>
            <div>
              <span style={{ fontWeight: 800 }}>
                Doctor Joined: {escalatedDoctor?.name || session?.escalatedDoctorName || 'Dr. Anita Desai'}
              </span>
              <div style={{ fontSize: '10px', opacity: 0.9 }}>
                Multi-party tele-consultation escalated for immediate medical review.
              </div>
            </div>
          </div>
          <span
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '9px',
              fontWeight: 700,
            }}
          >
            ACTIVE 3-WAY
          </span>
        </div>
      )}

      {/* Shared Care Notes Pill Banner */}
      {sharedNotes && (
        <div
          onClick={() => setShowSharedNotesSheet(true)}
          style={{
            background: '#fffbeb',
            borderBottom: '1px solid #fef3c7',
            padding: '6px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#92400e',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={13} color="#d97706" />
            <span>
              <strong>Care Plan Synced:</strong> {sharedNotes.title || sharedNotes.summary || 'Clinical advice & notes updated by staff'}
            </span>
          </div>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#b45309', textDecoration: 'underline' }}>
            View Plan →
          </span>
        </div>
      )}

      {/* Active Ticket Banner */}
      {activeTicket && (
        <div
          style={{
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            padding: '5px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '10px',
            color: '#475569',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Ticket size={12} color="#0d9488" />
            <span>
              Ticket #{activeTicket.ticketNumber}: <strong>{activeTicket.subject}</strong>
            </span>
          </div>
          <span
            style={{
              fontSize: '9px',
              fontWeight: 800,
              padding: '1px 6px',
              borderRadius: '8px',
              background: activeTicket.status === 'RESOLVED' ? '#dcfce7' : '#fef3c7',
              color: activeTicket.status === 'RESOLVED' ? '#15803d' : '#b45309',
            }}
          >
            {activeTicket.status}
          </span>
        </div>
      )}

      {/* Main Message Stream */}
      <div
        className="chat-message-feed"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Intro Card */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '12px',
            border: '1px solid #e2e8f0',
            textAlign: 'center',
            margin: '0 auto 8px auto',
            maxWidth: '340px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 6px auto',
              color: '#059669',
            }}
          >
            <HeartPulse size={22} />
          </div>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: '0 0 2px 0' }}>
            {currentAssistant?.fullName} ({currentAssistant?.role === 'ASHA_FACILITATOR' ? 'ASHA' : 'CHO'})
          </h4>
          <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 6px 0', lineHeight: 1.4 }}>
            {currentAssistant?.designation} • {currentAssistant?.yearsOfExperience} yrs exp • Speaks{' '}
            {currentAssistant?.languages.join(', ')}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
            {currentAssistant?.specializations.slice(0, 3).map((s, idx) => (
              <span
                key={idx}
                style={{
                  background: '#f1f5f9',
                  borderRadius: '10px',
                  padding: '2px 6px',
                  fontSize: '9px',
                  fontWeight: 600,
                  color: '#334155',
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Date Separator */}
        <div
          style={{
            textAlign: 'center',
            margin: '4px 0',
          }}
        >
          <span
            style={{
              background: '#e2e8f0',
              borderRadius: '10px',
              padding: '2px 8px',
              fontSize: '10px',
              fontWeight: 600,
              color: '#475569',
            }}
          >
            Today's Tele-Consultation
          </span>
        </div>

        {/* Messages List */}
        {messages.map((msg) => {
          const isMe = msg.senderId === patient.userId || msg.senderRole === 'PATIENT';

          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isMe ? 'flex-end' : 'flex-start',
              }}
            >
              {/* Sender Name label for assistant */}
              {!isMe && (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#0f766e',
                    marginBottom: '2px',
                    marginLeft: '4px',
                  }}
                >
                  {msg.senderName} ({currentAssistant?.role === 'ASHA_FACILITATOR' ? 'ASHA' : 'Health Worker'})
                </span>
              )}

              <div
                style={{
                  maxWidth: '82%',
                  padding: msg.attachment ? '6px 6px 6px 6px' : '9px 12px',
                  borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                  background: isMe
                    ? 'linear-gradient(135deg, #0d9488, #0f766e)'
                    : '#ffffff',
                  color: isMe ? '#ffffff' : '#1e293b',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                  border: isMe ? 'none' : '1px solid #e2e8f0',
                  wordBreak: 'break-word',
                }}
              >
                {/* Image Attachment Preview */}
                {msg.attachment && (
                  <div style={{ marginBottom: msg.text ? '6px' : '0' }}>
                    <img
                      src={msg.attachment.url}
                      alt={msg.attachment.name}
                      onClick={() => setPreviewLightbox(msg.attachment!.url)}
                      style={{
                        width: '100%',
                        maxHeight: '180px',
                        borderRadius: '10px',
                        objectFit: 'cover',
                        cursor: 'pointer',
                        display: 'block',
                      }}
                    />
                    <div
                      style={{
                        fontSize: '9px',
                        marginTop: '3px',
                        padding: '0 4px',
                        color: isMe ? 'rgba(255,255,255,0.85)' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>{msg.attachment.name}</span>
                      <span>📷 Tap to enlarge</span>
                    </div>
                  </div>
                )}

                {/* Text content */}
                {msg.text && (
                  <p
                    style={{
                      fontSize: '13px',
                      lineHeight: 1.45,
                      margin: 0,
                      padding: msg.attachment ? '4px 6px' : '0',
                    }}
                  >
                    {msg.text}
                  </p>
                )}

                {/* Meta: Timestamp and Read Status */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '4px',
                    marginTop: '3px',
                    padding: msg.attachment ? '0 4px 2px 0' : '0',
                    fontSize: '9px',
                    color: isMe ? 'rgba(255,255,255,0.75)' : '#94a3b8',
                  }}
                >
                  <span>{formatMessageTime(msg.timestamp)}</span>
                  {isMe && (
                    <span>
                      {msg.status === 'READ' ? (
                        <CheckCheck size={12} color="#38bdf8" />
                      ) : msg.status === 'DELIVERED' ? (
                        <CheckCheck size={12} color="rgba(255,255,255,0.75)" />
                      ) : (
                        <Check size={12} color="rgba(255,255,255,0.6)" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Live Typing Indicator */}
        {isTypingPeer && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '4px 0' }}>
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span style={{ fontSize: '11px', color: '#0f766e', fontWeight: 600 }}>
                {currentAssistant?.fullName} is typing
              </span>
              <span className="dot-pulse" style={{ display: 'flex', gap: '2px' }}>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#0d9488' }} />
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#0d9488' }} />
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#0d9488' }} />
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestion Chips */}
      <div
        style={{
          background: '#ffffff',
          padding: '6px 12px',
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
        }}
      >
        <button
          onClick={() => handleSendMessage('Can you please review my lab test report and blood sugar?')}
          style={{
            background: '#f0fdfa',
            border: '1px solid #99f6e4',
            borderRadius: '14px',
            padding: '4px 10px',
            fontSize: '11px',
            color: '#0f766e',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          🩸 Review Lab Report
        </button>
        <button
          onClick={() => handleSendMessage('When should I visit the PHC for child immunization vaccination?')}
          style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '14px',
            padding: '4px 10px',
            fontSize: '11px',
            color: '#1d4ed8',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          💉 Vaccine Schedule
        </button>
        <button
          onClick={() => handleSendMessage('Can I schedule a home visit by an ASHA worker for elderly care?')}
          style={{
            background: '#fef3c7',
            border: '1px solid #fde68a',
            borderRadius: '14px',
            padding: '4px 10px',
            fontSize: '11px',
            color: '#92400e',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          🏡 ASHA Home Visit
        </button>
      </div>

      {/* Selected Image Preview before Sending */}
      {selectedImage && (
        <div
          style={{
            background: '#f1f5f9',
            borderTop: '1px solid #e2e8f0',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src={selectedImage.url}
              alt="Preview"
              style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }}
            />
            <div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#1e293b' }}>
                {selectedImage.name}
              </span>
              <div style={{ fontSize: '10px', color: '#64748b' }}>Ready to attach with message</div>
            </div>
          </div>
          <button
            onClick={() => setSelectedImage(null)}
            style={{
              background: '#e2e8f0',
              border: 'none',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Chat Input Bar */}
      <div
        className="chat-input-bar"
        style={{
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          style={{ display: 'none' }}
        />

        {/* Attach Photo Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            background: '#f1f5f9',
            border: 'none',
            borderRadius: '50%',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0d9488',
            cursor: 'pointer',
          }}
          title="Attach prescription or medical report photo"
        >
          <ImageIcon size={20} />
        </button>

        {/* Text Input Area */}
        <textarea
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder={`Type message to ${currentAssistant?.fullName || 'Health Worker'}...`}
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
            maxHeight: '80px',
          }}
        />

        {/* Send Button */}
        <button
          onClick={() => handleSendMessage()}
          disabled={(!inputText.trim() && !selectedImage) || sending}
          style={{
            background:
              (!inputText.trim() && !selectedImage) || sending
                ? '#cbd5e1'
                : 'linear-gradient(135deg, #0d9488, #059669)',
            border: 'none',
            borderRadius: '50%',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            cursor: (!inputText.trim() && !selectedImage) || sending ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <Send size={16} />
        </button>
      </div>

      {/* Available Assistants Selection Modal Sheet */}
      {showAssistantSheet && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
          onClick={() => setShowAssistantSheet(false)}
        >
          <div
            style={{
              background: '#ffffff',
              width: '100%',
              maxWidth: '460px',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              padding: '18px',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Available Human Health Assistants
                </h3>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Choose an available ASHA facilitator, ANM, or CHO worker
                </span>
              </div>
              <button
                onClick={() => setShowAssistantSheet(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {allAssistants.map((asst) => (
                <div
                  key={asst.id}
                  onClick={() => handleSwitchAssistant(asst)}
                  style={{
                    border: currentAssistant?.id === asst.id ? '2px solid #0d9488' : '1px solid #e2e8f0',
                    background: currentAssistant?.id === asst.id ? '#f0fdfa' : '#ffffff',
                    borderRadius: '12px',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ position: 'relative' }}>
                      <img
                        src={asst.avatarUrl}
                        alt={asst.fullName}
                        style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: asst.status === 'ONLINE' ? '#10b981' : asst.status === 'BUSY' ? '#f59e0b' : '#94a3b8',
                          border: '2px solid #ffffff',
                        }}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong style={{ fontSize: '13px', color: '#0f172a' }}>{asst.fullName}</strong>
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '6px',
                            background: asst.status === 'ONLINE' ? '#dcfce7' : asst.status === 'BUSY' ? '#fef3c7' : '#f1f5f9',
                            color: asst.status === 'ONLINE' ? '#15803d' : asst.status === 'BUSY' ? '#b45309' : '#64748b',
                          }}
                        >
                          {asst.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {asst.designation} • {asst.phcName}
                      </div>
                      <div style={{ fontSize: '10px', color: '#0f766e', marginTop: '2px' }}>
                        Languages: {asst.languages.join(', ')} • Rating: ⭐ {asst.rating}
                      </div>
                    </div>
                  </div>

                  <ChevronRight size={16} color="#94a3b8" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Past Chat Sessions History Sheet */}
      {showHistorySheet && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
          onClick={() => setShowHistorySheet(false)}
        >
          <div
            style={{
              background: '#ffffff',
              width: '100%',
              maxWidth: '460px',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              padding: '18px',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Past Consultations
                </h3>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  View archived conversations with health workers
                </span>
              </div>
              <button
                onClick={() => setShowHistorySheet(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {pastSessions.map((sess) => (
                <div
                  key={sess.id}
                  onClick={() => handleOpenPastSession(sess)}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '10px',
                    cursor: 'pointer',
                    background: sess.id === session?.id ? '#f0fdfa' : '#ffffff',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '12px', color: '#0f172a' }}>{sess.assistantName}</strong>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>
                      {new Date(sess.lastMessageAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#475569', margin: '4px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {sess.lastMessage}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Live Shared Care Notes & Advice Sheet */}
      {showSharedNotesSheet && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
          onClick={() => setShowSharedNotesSheet(false)}
        >
          <div
            style={{
              background: '#ffffff',
              width: '100%',
              maxWidth: '460px',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              padding: '18px',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={18} color="#0d9488" />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Shared Care Plan & Advice
                  </h3>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Live synchronized between you and healthcare staff
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowSharedNotesSheet(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Care Advice / Summary Card */}
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#166534', marginBottom: '4px' }}>
                <CheckCircle2 size={14} />
                <span>{sharedNotes?.title || 'Primary Care Plan & Instructions'}</span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#14532d', lineHeight: 1.45 }}>
                {sharedNotes?.summary || 'Follow standard hydration, take prescribed medications on schedule, and report any severe fever or blood pressure spikes.'}
              </p>
            </div>

            {/* Care Instructions List */}
            {sharedNotes?.instructions && sharedNotes.instructions.length > 0 && (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '12px', marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e40af', marginBottom: '6px' }}>
                  📋 Step-by-Step Instructions
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {sharedNotes.instructions.map((ins, i) => (
                    <div key={i} style={{ fontSize: '12px', color: '#1e3a8a', display: 'flex', gap: '6px' }}>
                      <span>•</span>
                      <span>{ins}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dietary Precautions */}
            {sharedNotes?.dietaryPrecautions && sharedNotes.dietaryPrecautions.length > 0 && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '12px', marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#92400e', marginBottom: '4px' }}>
                  🥗 Dietary Recommendations
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {sharedNotes.dietaryPrecautions.map((d, i) => (
                    <div key={i} style={{ fontSize: '12px', color: '#78350f', display: 'flex', gap: '6px' }}>
                      <span>•</span>
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Emergency Warning */}
            {sharedNotes?.emergencyWarning && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '12px', marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#991b1b', marginBottom: '4px' }}>
                  🚨 Warning Signs to Watch
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#7f1d1d', lineHeight: 1.45 }}>
                  {sharedNotes.emergencyWarning}
                </p>
              </div>
            )}

            {/* Append Patient Note / Query */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                Add your own note / symptom update for the health worker:
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="e.g. Took morning BP: 122/82 mmHg..."
                  value={newPatientNoteInput}
                  onChange={(e) => setNewPatientNoteInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSavePatientSharedNote();
                    }
                  }}
                  style={{
                    flex: 1,
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleSavePatientSharedNote}
                  disabled={!newPatientNoteInput.trim() || savingNote}
                  style={{
                    background: '#0d9488',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: !newPatientNoteInput.trim() || savingNote ? 'not-allowed' : 'pointer',
                    opacity: !newPatientNoteInput.trim() || savingNote ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Plus size={14} />
                  <span>Sync</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {previewLightbox && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 110,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setPreviewLightbox(null)}
        >
          <img
            src={previewLightbox}
            alt="Report Lightbox"
            style={{
              maxWidth: '90%',
              maxHeight: '80%',
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            }}
          />
          <button
            onClick={() => setPreviewLightbox(null)}
            style={{
              marginTop: '16px',
              background: '#ffffff',
              border: 'none',
              borderRadius: '20px',
              padding: '8px 20px',
              fontSize: '13px',
              fontWeight: 700,
              color: '#0f172a',
              cursor: 'pointer',
            }}
          >
            Close Preview
          </button>
        </div>
      )}

      {/* Real-time WebRTC Calling Modal Overlay */}
      {callState.status !== 'IDLE' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95), rgba(15, 118, 110, 0.95))',
            zIndex: 120,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '40px 20px',
            color: '#ffffff',
          }}
        >
          {/* Call Header */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.15)',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 600,
                marginBottom: '16px',
              }}
            >
              <ShieldCheck size={14} color="#5eead4" />
              <span>ArogyaMitra Tele-Health Voice Link (WebRTC)</span>
            </div>

            <div style={{ position: 'relative', width: '90px', height: '90px', margin: '0 auto 16px auto' }}>
              <img
                src={
                  currentAssistant?.avatarUrl ||
                  'https://images.unsplash.com/photo-1594824813593-a9d949ec3643?w=150&auto=format&fit=crop&q=80'
                }
                alt={callState.peerName}
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid #5eead4',
                  boxShadow: '0 0 20px rgba(94, 234, 212, 0.5)',
                }}
              />
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px 0' }}>
              {callState.peerName || currentAssistant?.fullName}
            </h2>
            <div style={{ fontSize: '13px', color: '#99f6e4', fontWeight: 500 }}>
              {currentAssistant?.designation || 'Health Assistant'} • {currentAssistant?.phcName}
            </div>

            {/* Status Label */}
            <div style={{ marginTop: '12px', fontSize: '15px', fontWeight: 700, color: '#f0fdfa' }}>
              {callState.status === 'CALLING' && 'Connecting audio stream...'}
              {callState.status === 'RINGING' && 'Ringing...'}
              {callState.status === 'CONNECTED' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                  <span>Call Active • {formatCallTime(callState.durationSeconds)}</span>
                </div>
              )}
              {callState.status === 'REJECTED' && 'Assistant Unavailable / Busy'}
              {callState.status === 'ENDED' && 'Call Ended'}
              {callState.status === 'FAILED' && 'Connection Issue'}
            </div>
          </div>

          {/* Connected Audio Waveform Animation */}
          {callState.status === 'CONNECTED' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '40px' }}>
              {[18, 32, 14, 28, 40, 24, 36, 16, 30, 20].map((h, i) => (
                <div
                  key={i}
                  style={{
                    width: '4px',
                    height: `${h}px`,
                    background: '#5eead4',
                    borderRadius: '4px',
                    animation: `pulse 1s infinite alternate ${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Assistant Busy or Call Failed: Fallback to Callback Request */}
          {(callState.status === 'REJECTED' || callState.status === 'FAILED' || callState.error) && (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '16px',
                width: '100%',
                maxWidth: '340px',
                textAlign: 'center',
              }}
            >
              <AlertCircle size={24} color="#fcd34d" style={{ margin: '0 auto 6px auto' }} />
              <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 4px 0' }}>
                Health Assistant is currently busy
              </h4>
              <p style={{ fontSize: '11px', color: '#e2e8f0', margin: '0 0 12px 0' }}>
                {callState.error || 'All health workers are attending to urgent field duties. Request an instant callback.'}
              </p>

              <button
                onClick={handleRequestFallbackCallback}
                style={{
                  background: '#f59e0b',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '10px 18px',
                  fontSize: '13px',
                  fontWeight: 800,
                  color: '#ffffff',
                  cursor: 'pointer',
                  width: '100%',
                  boxShadow: '0 2px 6px rgba(245, 158, 11, 0.4)',
                }}
              >
                📞 Request Immediate Callback
              </button>
            </div>
          )}

          {/* Call Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {callState.status === 'CONNECTED' && (
              <>
                {/* Mute Mic */}
                <button
                  onClick={() => webrtcCall.toggleMute()}
                  style={{
                    background: callState.isMuted ? '#ef4444' : 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '56px',
                    height: '56px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    cursor: 'pointer',
                  }}
                  title={callState.isMuted ? 'Unmute microphone' : 'Mute microphone'}
                >
                  {callState.isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                </button>

                {/* Speaker Toggle */}
                <button
                  onClick={() => webrtcCall.toggleSpeaker()}
                  style={{
                    background: callState.isSpeakerOn ? '#0d9488' : 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '56px',
                    height: '56px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    cursor: 'pointer',
                  }}
                  title="Toggle speaker"
                >
                  {callState.isSpeakerOn ? <Volume2 size={24} /> : <VolumeX size={24} />}
                </button>
              </>
            )}

            {/* End Call Button */}
            <button
              onClick={() => webrtcCall.endCall()}
              style={{
                background: '#ef4444',
                border: 'none',
                borderRadius: '50%',
                width: '64px',
                height: '64px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.5)',
              }}
              title="End Voice Call"
            >
              <PhoneOff size={28} />
            </button>
          </div>
        </div>
      )}

      {/* Callback Success Toast */}
      {showCallbackSuccess && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#065f46',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '24px',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 130,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}
        >
          <CheckCheck size={18} color="#34d399" />
          <span>Callback requested! Health assistant will call you shortly on {patient.phone}.</span>
          <button
            onClick={() => setShowCallbackSuccess(false)}
            style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
