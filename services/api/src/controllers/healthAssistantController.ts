import { Request, Response } from 'express';
import { DataStore } from '../db/dataStore';
import { AuthRequest } from '../middleware/auth';
import {
  ChatSession,
  ChatMessage,
  HealthAssistantProfile,
  AssistantPresenceStatus,
} from '@phc-connect/types';
import { ChatSocketServer } from '../services/chatSocketServer';

export class HealthAssistantController {
  /**
   * GET /api/assistants
   * List all human health assistants with status and filtering
   */
  public static async getAllAssistants(req: Request, res: Response): Promise<void> {
    try {
      const { status, phcId, language } = req.query;

      let assistants = [...DataStore.healthAssistants];

      if (status) {
        assistants = assistants.filter((a) => a.status === (status as string).toUpperCase());
      }
      if (phcId && phcId !== 'ALL') {
        assistants = assistants.filter((a) => a.phcId === phcId);
      }
      if (language) {
        const langStr = (language as string).toLowerCase();
        assistants = assistants.filter((a) =>
          a.languages.some((l) => l.toLowerCase().includes(langStr))
        );
      }

      // Dynamically attach socket online indicator
      const enriched = assistants.map((a) => ({
        ...a,
        isSocketConnected: ChatSocketServer.isUserOnline(a.userId),
      }));

      res.status(200).json({
        success: true,
        total: enriched.length,
        onlineCount: enriched.filter((a) => a.status === 'ONLINE').length,
        assistants: enriched,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * GET /api/assistants/available
   * Get currently online human health assistants sorted by active load
   */
  public static async getAvailableAssistants(req: Request, res: Response): Promise<void> {
    try {
      const onlineAssistants = DataStore.healthAssistants
        .filter((a) => a.status === 'ONLINE')
        .sort((a, b) => a.activeChatSessionsCount - b.activeChatSessionsCount);

      res.status(200).json({
        success: true,
        count: onlineAssistants.length,
        assistants: onlineAssistants,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * PATCH /api/assistants/:id/status
   * Assistant toggles presence status (ONLINE, BUSY, OFFLINE)
   */
  public static async updateStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const assistantId = req.params.id;
      const { status } = req.body;

      if (!['ONLINE', 'BUSY', 'OFFLINE'].includes(status)) {
        res.status(400).json({ success: false, message: 'Invalid status value. Must be ONLINE, BUSY, or OFFLINE.' });
        return;
      }

      const assistant = DataStore.healthAssistants.find(
        (a) => a.id === assistantId || a.userId === req.user?.id
      );

      if (!assistant) {
        res.status(404).json({ success: false, message: 'Health Assistant profile not found.' });
        return;
      }

      assistant.status = status as AssistantPresenceStatus;

      // Broadcast update across WebSocket
      ChatSocketServer.broadcast({
        type: 'ASSISTANT_STATUS_UPDATE',
        senderId: assistant.userId,
        senderName: assistant.fullName,
        status: assistant.status,
      });

      res.status(200).json({
        success: true,
        message: `Status updated to ${status}`,
        assistant,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * POST /api/assistants/route
   * Smart routing: Connects a patient or ASHA worker to the best available online human health assistant
   */
  public static async routeToAssistant(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      const { assistantId, phcId, reason } = req.body;

      // Find Patient profile
      let patient = DataStore.patients.find((p) => p.userId === user?.id || p.id === user?.patientId);
      if (!patient) {
        patient = DataStore.patients[0];
      }

      let selectedAssistant: HealthAssistantProfile | undefined;

      // Case 1: Specific assistant requested
      if (assistantId) {
        selectedAssistant = DataStore.healthAssistants.find((a) => a.id === assistantId);
      }

      // Case 2: Auto-routing to online assistant with lowest load
      if (!selectedAssistant) {
        let candidates = DataStore.healthAssistants.filter((a) => a.status === 'ONLINE');
        if (phcId && phcId !== 'ALL') {
          const phcMatches = candidates.filter((a) => a.phcId === phcId);
          if (phcMatches.length > 0) candidates = phcMatches;
        }

        if (candidates.length > 0) {
          // Sort by active sessions count
          candidates.sort((a, b) => a.activeChatSessionsCount - b.activeChatSessionsCount);
          selectedAssistant = candidates[0];
        } else {
          // Fallback to first available or busy assistant
          selectedAssistant = DataStore.healthAssistants[0];
        }
      }

      if (!selectedAssistant) {
        res.status(404).json({ success: false, message: 'No health assistant found.' });
        return;
      }

      // Check for existing active session between this patient and assistant
      let session = DataStore.chatSessions.find(
        (s) =>
          (s.patientUserId === patient!.userId || s.patientId === patient!.id) &&
          s.assistantId === selectedAssistant!.id &&
          s.status === 'ACTIVE'
      );

      const now = new Date().toISOString();

      if (!session) {
        const count = DataStore.chatSessions.length + 1;
        const sessionId = `chat-ses-${Date.now()}-${count}`;

        session = {
          id: sessionId,
          patientId: patient.id,
          patientUserId: patient.userId,
          patientName: patient.fullName,
          patientPhone: patient.phone,
          patientAge: patient.age,
          patientGender: patient.gender,
          assistantId: selectedAssistant.id,
          assistantUserId: selectedAssistant.userId,
          assistantName: selectedAssistant.fullName,
          assistantRole: selectedAssistant.designation,
          phcId: selectedAssistant.phcId,
          phcName: selectedAssistant.phcName || 'Central Urban PHC',
          status: 'ACTIVE',
          lastMessage: reason ? `Consultation requested: ${reason}` : 'Session started with Health Assistant',
          lastMessageAt: now,
          unreadCountPatient: 0,
          unreadCountAssistant: 1,
          callState: {
            status: 'IDLE',
          },
          createdAt: now,
          updatedAt: now,
        };

        DataStore.chatSessions.unshift(session);
        selectedAssistant.activeChatSessionsCount += 1;

        // Auto welcome message from system / assistant
        const welcomeMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          sessionId: session.id,
          senderId: selectedAssistant.userId,
          senderName: selectedAssistant.fullName,
          senderRole: 'HEALTH_ASSISTANT',
          recipientId: patient.userId,
          text: `Namaste ${patient.fullName}! I am ${selectedAssistant.fullName}, ${selectedAssistant.designation} at ${session.phcName}. How can I assist you with your health today?`,
          status: 'SENT',
          timestamp: now,
        };
        DataStore.chatMessages.push(welcomeMessage);
      }

      // Fetch messages for session
      const messages = DataStore.chatMessages.filter((m) => m.sessionId === session!.id);

      res.status(200).json({
        success: true,
        session,
        assistant: selectedAssistant,
        isOnline: selectedAssistant.status === 'ONLINE',
        messages,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * GET /api/assistants/chat/sessions
   * Get list of chat sessions for current user (with role filtering)
   */
  public static async getChatSessions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      let sessions: ChatSession[] = [];

      if (user?.role === 'PATIENT') {
        const patient = DataStore.patients.find((p) => p.userId === user.id || p.id === user.patientId);
        sessions = DataStore.chatSessions.filter(
          (s) => s.patientUserId === user.id || (patient && s.patientId === patient.id)
        );
      } else if (user?.role === 'HEALTH_ASSISTANT') {
        const assistant = DataStore.healthAssistants.find((a) => a.userId === user.id || a.id === user.assistantId);
        sessions = DataStore.chatSessions.filter(
          (s) => s.assistantUserId === user.id || (assistant && s.assistantId === assistant.id)
        );
      } else {
        // Staff (Doctors, Admins, Receptionists) can audit sessions for their PHC or all
        if (user?.phcId && user.phcId !== 'ALL') {
          sessions = DataStore.chatSessions.filter((s) => s.phcId === user.phcId);
        } else {
          sessions = [...DataStore.chatSessions];
        }
      }

      // Sort by recent message
      sessions.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

      res.status(200).json({
        success: true,
        count: sessions.length,
        sessions,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * GET /api/assistants/chat/sessions/:sessionId
   * Get specific session details and full message history with RBAC validation
   */
  public static async getSessionDetails(req: AuthRequest, res: Response): Promise<void> {
    try {
      const sessionId = req.params.sessionId;
      const user = req.user;

      const session = DataStore.chatSessions.find((s) => s.id === sessionId);
      if (!session) {
        res.status(404).json({ success: false, message: 'Chat session not found.' });
        return;
      }

      // RBAC Security Check: Only participants or authorized clinical staff (DOCTOR, ADMIN, RECEPTIONIST)
      const isParticipant =
        session.patientUserId === user?.id ||
        session.patientId === user?.patientId ||
        session.assistantUserId === user?.id ||
        session.assistantId === user?.assistantId;

      const isStaff = ['DOCTOR', 'ADMIN', 'RECEPTIONIST'].includes(user?.role || '');

      if (!isParticipant && !isStaff) {
        res.status(403).json({
          success: false,
          message: 'Access Denied: You are not authorized to view this health consultation transcript.',
        });
        return;
      }

      const messages = DataStore.chatMessages
        .filter((m) => m.sessionId === sessionId)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      const assistant = DataStore.healthAssistants.find((a) => a.id === session.assistantId);
      const patient = DataStore.patients.find((p) => p.id === session.patientId);

      res.status(200).json({
        success: true,
        session,
        assistant,
        patient,
        messages,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * POST /api/assistants/chat/sessions/:sessionId/messages
   * Send a chat message with optional image attachment
   */
  public static async sendMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const sessionId = req.params.sessionId;
      const user = req.user;
      const { text, attachment } = req.body;

      if (!text && !attachment) {
        res.status(400).json({ success: false, message: 'Message text or attachment is required.' });
        return;
      }

      const session = DataStore.chatSessions.find((s) => s.id === sessionId);
      if (!session) {
        res.status(404).json({ success: false, message: 'Chat session not found.' });
        return;
      }

      // Participant check
      const isPatient = session.patientUserId === user?.id || session.patientId === user?.patientId;
      const recipientId = isPatient ? session.assistantUserId : session.patientUserId;
      const senderRole = user?.role || (isPatient ? 'PATIENT' : 'HEALTH_ASSISTANT');
      const senderName = user?.fullName || (isPatient ? session.patientName : session.assistantName);

      const now = new Date().toISOString();
      const newMessage: ChatMessage = {
        id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        sessionId,
        senderId: user?.id || 'unknown-user',
        senderName,
        senderRole,
        recipientId,
        text: text || '',
        attachment: attachment || null,
        status: 'SENT',
        timestamp: now,
      };

      DataStore.chatMessages.push(newMessage);

      // Update session
      session.lastMessage = text || (attachment ? `📷 ${attachment.name}` : 'New message');
      session.lastMessageAt = now;
      session.updatedAt = now;

      if (isPatient) {
        session.unreadCountAssistant += 1;
      } else {
        session.unreadCountPatient += 1;
      }

      // Real-time broadcast via WebSocket
      ChatSocketServer.sendToUser(recipientId, {
        type: 'MESSAGE_RECEIVED',
        sessionId,
        message: newMessage,
      });

      res.status(201).json({
        success: true,
        message: newMessage,
        session,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * PATCH /api/assistants/chat/sessions/:sessionId/read
   * Mark all messages in a session as read
   */
  public static async markAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const sessionId = req.params.sessionId;
      const user = req.user;

      const session = DataStore.chatSessions.find((s) => s.id === sessionId);
      if (!session) {
        res.status(404).json({ success: false, message: 'Chat session not found.' });
        return;
      }

      const now = new Date().toISOString();
      DataStore.chatMessages
        .filter((m) => m.sessionId === sessionId && m.recipientId === user?.id && m.status !== 'READ')
        .forEach((m) => {
          m.status = 'READ';
          m.readAt = now;
        });

      if (user?.role === 'PATIENT') {
        session.unreadCountPatient = 0;
      } else {
        session.unreadCountAssistant = 0;
      }

      const otherUserId = user?.id === session.patientUserId ? session.assistantUserId : session.patientUserId;
      ChatSocketServer.sendToUser(otherUserId, {
        type: 'MESSAGE_READ',
        sessionId,
        senderId: user?.id,
      });

      res.status(200).json({ success: true, message: 'Messages marked as read.' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * POST /api/assistants/chat/upload
   * Handle image/file attachment upload
   */
  public static async uploadAttachment(req: Request, res: Response): Promise<void> {
    try {
      const { dataUrl, fileName, fileType } = req.body;

      if (!dataUrl) {
        res.status(400).json({ success: false, message: 'Attachment data is required.' });
        return;
      }

      const name = fileName || `health_attachment_${Date.now()}.jpg`;
      const isImage = !fileType || fileType.startsWith('image/') || name.endsWith('.jpg') || name.endsWith('.png');

      const attachment = {
        url: dataUrl,
        name,
        type: isImage ? ('IMAGE' as const) : ('FILE' as const),
        sizeBytes: Math.round((dataUrl.length * 3) / 4),
      };

      res.status(200).json({
        success: true,
        attachment,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * PATCH /api/assistants/chat/sessions/:sessionId/close
   * Close and resolve a chat consultation session
   */
  public static async closeSession(req: AuthRequest, res: Response): Promise<void> {
    try {
      const sessionId = req.params.sessionId;
      const { resolutionNotes } = req.body;

      const session = DataStore.chatSessions.find((s) => s.id === sessionId);
      if (!session) {
        res.status(404).json({ success: false, message: 'Chat session not found.' });
        return;
      }

      session.status = 'RESOLVED';
      session.resolutionNotes = resolutionNotes || 'Consultation completed successfully by Health Assistant.';
      session.updatedAt = new Date().toISOString();

      const assistant = DataStore.healthAssistants.find((a) => a.id === session.assistantId);
      if (assistant && assistant.activeChatSessionsCount > 0) {
        assistant.activeChatSessionsCount -= 1;
      }

      res.status(200).json({
        success: true,
        message: 'Session resolved and archived successfully.',
        session,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * POST /api/assistants/chat/sessions/:sessionId/escalate-doctor
   * Escalate active session to an on-duty Doctor, adding Doctor as participant
   */
  public static async escalateToDoctor(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      const { sessionId } = req.params;
      const { doctorId, reason = 'Clinical review required', priority = 'HIGH' } = req.body;

      const session = DataStore.chatSessions.find((s) => s.id === sessionId);
      if (!session) {
        res.status(404).json({ success: false, message: 'Chat session not found.' });
        return;
      }

      // Find target doctor
      let doctor = DataStore.doctors.find((d) => d.id === doctorId || d.userId === doctorId);
      if (!doctor) {
        // Fallback to first available doctor in PHC
        doctor = DataStore.doctors.find((d) => d.status === 'AVAILABLE') || DataStore.doctors[0];
      }

      if (!doctor) {
        res.status(404).json({ success: false, message: 'No available doctor found to escalate.' });
        return;
      }

      const now = new Date().toISOString();
      const staffId = user?.assistantId || user?.doctorId || user?.id || session.assistantId;
      const staffName = user?.fullName || session.assistantName;

      // Update session escalation properties
      session.escalatedDoctorId = doctor.id;
      session.escalatedDoctorName = doctor.fullName;
      session.updatedAt = now;

      // Add doctor to participants list if not already present
      if (!session.participants) {
        session.participants = [];
      }
      if (!session.participants.some((p) => p.id === doctor!.userId || p.id === doctor!.id)) {
        session.participants.push({
          id: doctor.userId,
          name: doctor.fullName,
          role: 'DOCTOR',
          designation: doctor.specialization,
          joinedAt: now,
        });
      }

      // Update active ticket or create escalation ticket
      let ticket = session.activeTicketId ? DataStore.supportTickets.find((t) => t.id === session.activeTicketId) : null;
      if (!ticket) {
        const ticketSeq = DataStore.supportTickets.length + 1;
        ticket = {
          id: `tkt-${Date.now()}`,
          ticketNumber: `TKT-2026-${ticketSeq.toString().padStart(4, '0')}`,
          patientId: session.patientId,
          patientName: session.patientName,
          patientPhone: session.patientPhone,
          patientAge: session.patientAge,
          patientGender: session.patientGender,
          creatorId: staffId,
          creatorName: staffName,
          creatorRole: 'HEALTH_ASSISTANT',
          assignedStaffId: doctor.id,
          assignedStaffName: doctor.fullName,
          assignedStaffRole: 'DOCTOR',
          escalatedDoctorId: doctor.id,
          escalatedDoctorName: doctor.fullName,
          escalatedDoctorSpecialization: doctor.specialization,
          sessionId: session.id,
          category: 'EMERGENCY_TRIAGE',
          subject: `Doctor Escalation: ${reason}`,
          priority: priority as any,
          status: 'ESCALATED',
          tags: ['Doctor Escalation', 'Tele-Consult', doctor.specialization],
          notes: `Escalated by ${session.assistantName}. Reason: ${reason}`,
          phcId: session.phcId,
          phcName: session.phcName,
          actionLogs: [],
          createdAt: now,
          updatedAt: now,
        };
        DataStore.supportTickets.unshift(ticket);
        session.activeTicketId = ticket.id;
      } else {
        ticket.status = 'ESCALATED';
        ticket.escalatedDoctorId = doctor.id;
        ticket.escalatedDoctorName = doctor.fullName;
        ticket.escalatedDoctorSpecialization = doctor.specialization;
        ticket.assignedStaffId = doctor.id;
        ticket.assignedStaffName = doctor.fullName;
        ticket.assignedStaffRole = 'DOCTOR';
        ticket.updatedAt = now;
      }

      ticket.actionLogs.unshift({
        id: `act-${Date.now()}`,
        timestamp: now,
        actorId: staffId,
        actorName: staffName,
        actorRole: 'HEALTH_ASSISTANT',
        action: 'ESCALATED_TO_DOCTOR',
        details: `Session escalated to ${doctor.fullName} (${doctor.specialization}). Reason: ${reason}`,
      });

      // Post system announcement message to the chat
      const sysMessage: ChatMessage = {
        id: `msg-sys-${Date.now()}`,
        sessionId: session.id,
        senderId: 'system',
        senderName: 'Clinical Triage System',
        senderRole: 'ADMIN',
        recipientId: session.patientUserId,
        text: `⚠️ Tele-Care consultation escalated to ${doctor.fullName} (${doctor.specialization}). ${doctor.fullName} has joined the conversation.`,
        status: 'SENT',
        timestamp: now,
      };
      DataStore.chatMessages.push(sysMessage);
      session.lastMessage = sysMessage.text;
      session.lastMessageAt = now;

      // Broadcast WebSocket events to session room
      ChatSocketServer.broadcastToSession(sessionId, {
        type: 'DOCTOR_ESCALATED',
        sessionId,
        doctor: {
          id: doctor.id,
          name: doctor.fullName,
          specialization: doctor.specialization,
          role: 'DOCTOR',
        },
        message: sysMessage,
        ticket,
        timestamp: now,
      });

      res.status(200).json({
        success: true,
        message: `Successfully escalated to ${doctor.fullName}. Doctor has joined the room.`,
        session,
        doctor: {
          id: doctor.id,
          name: doctor.fullName,
          specialization: doctor.specialization,
        },
        ticket,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to escalate to doctor.' });
    }
  }
}
