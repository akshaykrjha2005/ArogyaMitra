import { WebRTCSignalingPayload, WebRTCSignalingType, ChatMessage, AssistantPresenceStatus } from '@phc-connect/types';

export type SocketEventListener = (payload: WebRTCSignalingPayload) => void;

class ChatSocketClient {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<SocketEventListener>> = new Map();
  private reconnectTimer: any = null;
  private isConnected: boolean = false;
  private token: string | null = null;

  public connect(token?: string) {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.token = token || localStorage.getItem('phc_patient_token') || '';

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use host from window.location, default to port 5000 if running frontend on 3000
    const host = window.location.hostname;
    const wsUrl = `${protocol}//${host}:5000/ws/chat?token=${encodeURIComponent(this.token)}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[ChatSocketClient] 🟢 Connected to real-time chat server');
        this.isConnected = true;
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
        this.emit('AUTH', { status: 'ONLINE' });
      };

      this.ws.onmessage = (event) => {
        try {
          const payload: WebRTCSignalingPayload = JSON.parse(event.data);
          this.notifyListeners(payload.type, payload);
          this.notifyListeners('*', payload);
        } catch (e) {
          console.error('[ChatSocketClient] Failed to parse message:', e);
        }
      };

      this.ws.onclose = () => {
        console.log('[ChatSocketClient] 🔴 Disconnected. Attempting reconnection...');
        this.isConnected = false;
        this.ws = null;
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.warn('[ChatSocketClient] Socket error:', error);
      };
    } catch (err) {
      console.error('[ChatSocketClient] Connection failed:', err);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect(this.token || undefined);
    }, 3000);
  }

  public subscribe(eventType: WebRTCSignalingType | '*', listener: SocketEventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);

    return () => {
      const set = this.listeners.get(eventType);
      if (set) {
        set.delete(listener);
      }
    };
  }

  private notifyListeners(eventType: string, payload: WebRTCSignalingPayload) {
    const set = this.listeners.get(eventType);
    if (set) {
      set.forEach((listener) => {
        try {
          listener(payload);
        } catch (e) {
          console.error('[ChatSocketClient] Error in event listener:', e);
        }
      });
    }
  }

  public emit(type: WebRTCSignalingType, payload: Partial<WebRTCSignalingPayload>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message: WebRTCSignalingPayload = {
        type,
        ...payload,
      };
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('[ChatSocketClient] Cannot emit, socket not connected:', type);
    }
  }

  public sendMessage(sessionId: string, recipientId: string, text: string, attachment?: any) {
    this.emit('SEND_MESSAGE', {
      sessionId,
      recipientId,
      message: {
        id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        sessionId,
        senderId: '',
        senderName: '',
        senderRole: 'PATIENT',
        recipientId,
        text,
        attachment,
        status: 'SENT',
        timestamp: new Date().toISOString(),
      },
    });
  }

  public markAsRead(sessionId: string) {
    this.emit('MESSAGE_READ', { sessionId });
  }

  public sendTyping(sessionId: string, isTyping: boolean) {
    this.emit('TYPING', { sessionId, isTyping });
  }

  public updateStatus(status: AssistantPresenceStatus) {
    this.emit('ASSISTANT_STATUS_UPDATE', { status });
  }

  public disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  public getStatus(): boolean {
    return this.isConnected;
  }
}

export const chatSocket = new ChatSocketClient();
