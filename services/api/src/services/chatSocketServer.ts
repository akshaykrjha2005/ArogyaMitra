import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import {
  ChatMessage,
  ChatSession,
  WebRTCSignalingPayload,
  AssistantPresenceStatus,
  UserRole,
  CallLogEntry,
} from '@phc-connect/types';
import { DataStore } from '../db/dataStore';
import { JWT_SECRET } from '../middleware/auth';

interface ClientMeta {
  userId: string;
  role: UserRole;
  fullName: string;
  assistantId?: string;
  patientId?: string;
}

export class ChatSocketServer {
  private static wss: WebSocketServer | null = null;
  private static userSockets: Map<string, Set<WebSocket>> = new Map();
  private static socketMeta: Map<WebSocket, ClientMeta> = new Map();

  public static initialize(server: HttpServer): void {
    if (this.wss) return;

    this.wss = new WebSocketServer({
      server,
      path: '/ws/chat',
    });

    console.log('[ChatSocketServer] 🔌 WebSocket Server initialized on /ws/chat');

    this.wss.on('connection', (ws: WebSocket, req) => {
      console.log(`[ChatSocketServer] 🔗 New connection from ${req.socket.remoteAddress}`);

      // Try authenticating from URL query params (e.g., /ws/chat?token=xyz)
      const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
      const token = url.searchParams.get('token');

      if (token) {
        this.authenticateClient(ws, token);
      }

      ws.on('message', (data: Buffer | string) => {
        try {
          const payload: WebRTCSignalingPayload = JSON.parse(data.toString());
          this.handleIncomingEvent(ws, payload);
        } catch (err: any) {
          console.error('[ChatSocketServer] ⚠️ Failed to parse message:', err.message);
        }
      });

      ws.on('close', () => {
        const meta = this.socketMeta.get(ws);
        if (meta) {
          console.log(`[ChatSocketServer] ❌ Disconnected: ${meta.fullName} (${meta.userId})`);
          const userSet = this.userSockets.get(meta.userId);
          if (userSet) {
            userSet.delete(ws);
            if (userSet.size === 0) {
              this.userSockets.delete(meta.userId);
            }
          }
          this.socketMeta.delete(ws);
        }
      });

      ws.on('error', (error) => {
        console.error('[ChatSocketServer] Socket error:', error);
      });
    });
  }

  /**
   * Authenticate a socket connection with JWT
   */
  public static authenticateClient(ws: WebSocket, token: string): boolean {
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const meta: ClientMeta = {
        userId: decoded.id,
        role: decoded.role,
        fullName: decoded.fullName || 'User',
        assistantId: decoded.assistantId,
        patientId: decoded.patientId,
      };

      this.socketMeta.set(ws, meta);

      if (!this.userSockets.has(meta.userId)) {
        this.userSockets.set(meta.userId, new Set());
      }
      this.userSockets.get(meta.userId)!.add(ws);

      console.log(`[ChatSocketServer] ✅ Authenticated: ${meta.fullName} [${meta.role}] (${meta.userId})`);

      // Acknowledge auth
      this.sendToSocket(ws, {
        type: 'AUTH',
        senderId: meta.userId,
        senderName: meta.fullName,
        senderRole: meta.role,
        status: 'ONLINE',
      });

      return true;
    } catch (e: any) {
      console.warn('[ChatSocketServer] 🔒 Auth failed for token:', e.message);
      return false;
    }
  }

  /**
   * Handle incoming WebSocket signaling events
   */
  private static handleIncomingEvent(ws: WebSocket, payload: WebRTCSignalingPayload): void {
    const meta = this.socketMeta.get(ws);

    // Auth handshake message fallback
    if (payload.type === 'AUTH') {
      const token = (payload as any).token;
      if (token) {
        this.authenticateClient(ws, token);
      }
      return;
    }

    if (!meta) {
      console.warn('[ChatSocketServer] ⛔ Rejecting event from unauthenticated socket:', payload.type);
      return;
    }

    switch (payload.type) {
      // 1. Send Message
      case 'SEND_MESSAGE': {
        const msg = payload.message;
        if (!msg) return;

        const session = DataStore.chatSessions.find((s) => s.id === msg.sessionId);
        if (!session) return;

        const fullMessage: ChatMessage = {
          id: msg.id || `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          sessionId: msg.sessionId,
          senderId: meta.userId,
          senderName: meta.fullName,
          senderRole: meta.role,
          recipientId: msg.recipientId,
          text: msg.text,
          attachment: msg.attachment || null,
          status: 'SENT',
          timestamp: new Date().toISOString(),
        };

        DataStore.chatMessages.push(fullMessage);

        // Update session
        session.lastMessage = fullMessage.text || (fullMessage.attachment ? `📷 Attachment: ${fullMessage.attachment.name}` : 'New message');
        session.lastMessageAt = fullMessage.timestamp;
        session.updatedAt = fullMessage.timestamp;

        if (meta.role === 'PATIENT') {
          session.unreadCountAssistant += 1;
        } else {
          session.unreadCountPatient += 1;
        }

        // Broadcast to recipient and sender
        this.sendToUser(fullMessage.recipientId, {
          type: 'MESSAGE_RECEIVED',
          sessionId: fullMessage.sessionId,
          message: fullMessage,
        });

        this.sendToUser(meta.userId, {
          type: 'MESSAGE_RECEIVED',
          sessionId: fullMessage.sessionId,
          message: fullMessage,
        });
        break;
      }

      // 2. Mark Messages as Read
      case 'MESSAGE_READ': {
        const sessionId = payload.sessionId;
        if (!sessionId) return;

        const session = DataStore.chatSessions.find((s) => s.id === sessionId);
        if (session) {
          const now = new Date().toISOString();
          DataStore.chatMessages
            .filter((m) => m.sessionId === sessionId && m.recipientId === meta.userId && m.status !== 'READ')
            .forEach((m) => {
              m.status = 'READ';
              m.readAt = now;
            });

          if (meta.role === 'PATIENT') {
            session.unreadCountPatient = 0;
          } else {
            session.unreadCountAssistant = 0;
          }

          // Notify the other participant
          const otherUserId = meta.userId === session.patientUserId ? session.assistantUserId : session.patientUserId;
          this.sendToUser(otherUserId, {
            type: 'MESSAGE_READ',
            sessionId,
            senderId: meta.userId,
          });
        }
        break;
      }

      // 3. Typing Indicator
      case 'TYPING': {
        const sessionId = payload.sessionId;
        if (!sessionId) return;
        const session = DataStore.chatSessions.find((s) => s.id === sessionId);
        if (session) {
          const otherUserId = meta.userId === session.patientUserId ? session.assistantUserId : session.patientUserId;
          this.sendToUser(otherUserId, {
            type: 'TYPING',
            sessionId,
            senderId: meta.userId,
            senderName: meta.fullName,
            isTyping: payload.isTyping ?? true,
          });
        }
        break;
      }

      // 4. Assistant Status Update
      case 'ASSISTANT_STATUS_UPDATE': {
        const newStatus: AssistantPresenceStatus = payload.status || 'ONLINE';
        const assistant = DataStore.healthAssistants.find((a) => a.userId === meta.userId || a.id === meta.assistantId);
        if (assistant) {
          assistant.status = newStatus;
          console.log(`[ChatSocketServer] 🔄 Assistant ${assistant.fullName} status updated to: ${newStatus}`);

          // Broadcast status update to all connected clients
          this.broadcast({
            type: 'ASSISTANT_STATUS_UPDATE',
            senderId: meta.userId,
            senderName: assistant.fullName,
            status: newStatus,
          });
        }
        break;
      }

      // 5. Shared Care Notes Real-Time Sync
      case 'SHARED_NOTE_UPDATE': {
        const sessionId = payload.sessionId;
        if (sessionId && payload.sharedNote) {
          this.broadcastToSession(sessionId, {
            type: 'SHARED_NOTE_UPDATE',
            sessionId,
            sharedNote: payload.sharedNote,
            senderId: meta.userId,
            senderName: meta.fullName,
            timestamp: new Date().toISOString(),
          });
        }
        break;
      }

      // 6. Support Ticket Real-Time Sync
      case 'TICKET_UPDATED': {
        const sessionId = payload.sessionId;
        if (sessionId && payload.ticket) {
          this.broadcastToSession(sessionId, {
            type: 'TICKET_UPDATED',
            sessionId,
            ticket: payload.ticket,
            senderId: meta.userId,
            senderName: meta.fullName,
            timestamp: new Date().toISOString(),
          });
        }
        break;
      }

      // 7. Doctor Escalation
      case 'DOCTOR_ESCALATED': {
        const sessionId = payload.sessionId;
        if (sessionId) {
          this.broadcastToSession(sessionId, {
            type: 'DOCTOR_ESCALATED',
            sessionId,
            doctor: payload.doctor,
            message: payload.message,
            ticket: payload.ticket,
            senderId: meta.userId,
            senderName: meta.fullName,
            timestamp: new Date().toISOString(),
          });
        }
        break;
      }

      // 8. WebRTC Call Signaling Events
      case 'CALL_INITIATE': {
        const sessionId = payload.sessionId;
        const session = DataStore.chatSessions.find((s) => s.id === sessionId);
        const recipientId = payload.recipientId || (session ? (meta.userId === session.patientUserId ? session.assistantUserId : session.patientUserId) : undefined);

        if (session) {
          session.callState = {
            status: 'RINGING',
            callerId: meta.userId,
            callerName: meta.fullName,
            callerRole: meta.role,
            receiverId: recipientId,
            receiverName: session.assistantUserId === recipientId ? session.assistantName : session.patientName,
            startedAt: new Date().toISOString(),
          };
        }

        if (recipientId) {
          console.log(`[ChatSocketServer] 📞 Call initiated from ${meta.fullName} -> ${recipientId}`);
          this.sendToUser(recipientId, {
            type: 'CALL_INITIATE',
            sessionId,
            senderId: meta.userId,
            senderName: meta.fullName,
            senderRole: meta.role,
            recipientId,
          });
        }
        break;
      }

      case 'CALL_RINGING': {
        if (payload.recipientId) {
          this.sendToUser(payload.recipientId, {
            type: 'CALL_RINGING',
            sessionId: payload.sessionId,
            senderId: meta.userId,
          });
        }
        break;
      }

      case 'CALL_ACCEPT': {
        const sessionId = payload.sessionId;
        const session = DataStore.chatSessions.find((s) => s.id === sessionId);
        if (session) {
          session.callState.status = 'IN_CALL';
          session.callState.startedAt = new Date().toISOString();
        }

        if (payload.recipientId) {
          console.log(`[ChatSocketServer] 📞 Call ACCEPTED by ${meta.fullName} -> ${payload.recipientId}`);
          this.sendToUser(payload.recipientId, {
            type: 'CALL_ACCEPT',
            sessionId,
            senderId: meta.userId,
            senderName: meta.fullName,
          });
        }
        break;
      }

      case 'CALL_REJECT': {
        const sessionId = payload.sessionId;
        const session = DataStore.chatSessions.find((s) => s.id === sessionId);
        if (session) {
          session.callState.status = 'REJECTED';
        }

        if (payload.recipientId) {
          console.log(`[ChatSocketServer] 📞 Call REJECTED by ${meta.fullName} -> ${payload.recipientId}`);
          this.sendToUser(payload.recipientId, {
            type: 'CALL_REJECT',
            sessionId,
            senderId: meta.userId,
            reason: payload.reason || 'Assistant is currently busy with another urgent case.',
          });
        }
        break;
      }

      case 'CALL_OFFER':
      case 'CALL_ANSWER':
      case 'ICE_CANDIDATE': {
        if (payload.recipientId) {
          this.sendToUser(payload.recipientId, {
            ...payload,
            senderId: meta.userId,
          });
        }
        break;
      }

      case 'CALL_END': {
        const sessionId = payload.sessionId;
        const session = DataStore.chatSessions.find((s) => s.id === sessionId);
        let duration = 0;

        if (session) {
          if (session.callState.startedAt) {
            duration = Math.max(1, Math.floor((Date.now() - new Date(session.callState.startedAt).getTime()) / 1000));
          }
          session.callState.status = 'ENDED';
          session.callState.durationSeconds = duration;

          // Record in DataStore.callLogs
          const callLog: CallLogEntry = {
            id: `call-log-${Date.now()}`,
            callSessionId: `CALL-WEBRTC-${sessionId}`,
            callerName: session.callState.callerName || meta.fullName,
            callerPhone: session.patientPhone || '+91 98765 43210',
            receiverName: session.callState.receiverName || 'Health Assistant',
            receiverPhone: '+91 98112 34567',
            receiverRole: session.assistantRole || 'Health Assistant',
            direction: 'INBOUND',
            purpose: 'Human Health Assistant Real-time Audio Triage',
            outcome: duration > 0 ? 'CONNECTED' : 'NO_ANSWER',
            durationSeconds: duration,
            notes: `WebRTC Voice Consultation session completed. Duration: ${duration}s.`,
            phcId: session.phcId,
            timestamp: new Date().toISOString(),
          };
          DataStore.callLogs.unshift(callLog);
        }

        const recipientId = payload.recipientId || (session ? (meta.userId === session.patientUserId ? session.assistantUserId : session.patientUserId) : undefined);
        if (recipientId) {
          console.log(`[ChatSocketServer] 📞 Call ENDED between ${meta.fullName} and ${recipientId} (${duration}s)`);
          this.sendToUser(recipientId, {
            type: 'CALL_END',
            sessionId,
            senderId: meta.userId,
          });
        }
        break;
      }
    }
  }

  /**
   * Broadcast message to all active sockets for a specific userId
   */
  public static sendToUser(userId: string, payload: WebRTCSignalingPayload): void {
    const sockets = this.userSockets.get(userId);
    if (!sockets || sockets.size === 0) return;

    const data = JSON.stringify(payload);
    for (const ws of sockets) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    }
  }

  /**
   * Broadcast message to a single socket
   */
  public static sendToSocket(ws: WebSocket, payload: WebRTCSignalingPayload): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  public static broadcast(payload: WebRTCSignalingPayload): void {
    if (!this.wss) return;
    const data = JSON.stringify(payload);
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  /**
   * Broadcast message to all participants of a specific chat session
   */
  public static broadcastToSession(sessionId: string, payload: WebRTCSignalingPayload): void {
    const session = DataStore.chatSessions.find((s) => s.id === sessionId);
    if (!session) return;

    const userIds = new Set<string>();
    if (session.patientUserId) userIds.add(session.patientUserId);
    if (session.assistantUserId) userIds.add(session.assistantUserId);
    if (session.participants) {
      session.participants.forEach((p) => userIds.add(p.id));
    }

    for (const uid of userIds) {
      this.sendToUser(uid, payload);
    }
  }

  /**
   * Check if a specific assistant/user is currently online via WebSocket
   */
  public static isUserOnline(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return !!sockets && sockets.size > 0;
  }
}
