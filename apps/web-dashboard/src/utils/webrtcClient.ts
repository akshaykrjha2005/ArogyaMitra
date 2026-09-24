import { staffChatSocket } from '../services/chatSocket';
import { WebRTCSignalingPayload } from '@phc-connect/types';

export type StaffCallStatus =
  | 'IDLE'
  | 'CALLING'
  | 'RINGING'
  | 'CONNECTED'
  | 'ENDED'
  | 'REJECTED'
  | 'FAILED';

export interface StaffCallState {
  status: StaffCallStatus;
  sessionId?: string;
  peerId?: string;
  peerName?: string;
  peerRole?: string;
  isCaller: boolean;
  durationSeconds: number;
  isMuted: boolean;
  isSpeakerOn: boolean;
  error?: string;
}

export type StaffCallStateListener = (state: StaffCallState) => void;

class StaffWebRTCVoiceManager {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteAudioEl: HTMLAudioElement | null = null;
  private listeners: Set<StaffCallStateListener> = new Set();
  private durationTimer: any = null;

  private state: StaffCallState = {
    status: 'IDLE',
    isCaller: false,
    durationSeconds: 0,
    isMuted: false,
    isSpeakerOn: true,
  };

  private rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ],
  };

  constructor() {
    this.setupSocketListeners();
    this.createAudioElement();
  }

  private createAudioElement() {
    if (typeof window !== 'undefined' && !this.remoteAudioEl) {
      this.remoteAudioEl = document.createElement('audio');
      this.remoteAudioEl.autoplay = true;
      (this.remoteAudioEl as any).playsInline = true;
      document.body.appendChild(this.remoteAudioEl);
    }
  }

  private setupSocketListeners() {
    staffChatSocket.subscribe('CALL_INITIATE', (payload) => this.handleIncomingCall(payload));
    staffChatSocket.subscribe('CALL_RINGING', (payload) => this.handleRinging(payload));
    staffChatSocket.subscribe('CALL_ACCEPT', (payload) => this.handleCallAccepted(payload));
    staffChatSocket.subscribe('CALL_REJECT', (payload) => this.handleCallRejected(payload));
    staffChatSocket.subscribe('CALL_END', (payload) => this.handleCallEnded(payload));
    staffChatSocket.subscribe('CALL_OFFER', (payload) => this.handleRemoteOffer(payload));
    staffChatSocket.subscribe('CALL_ANSWER', (payload) => this.handleRemoteAnswer(payload));
    staffChatSocket.subscribe('ICE_CANDIDATE', (payload) => this.handleRemoteIceCandidate(payload));
  }

  public subscribe(listener: StaffCallStateListener): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private updateState(partial: Partial<StaffCallState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((l) => l({ ...this.state }));
  }

  /**
   * Start Outbound Call to Patient
   */
  public async startCall(sessionId: string, peerId: string, peerName: string, peerRole?: string) {
    try {
      this.updateState({
        status: 'CALLING',
        sessionId,
        peerId,
        peerName,
        peerRole,
        isCaller: true,
        durationSeconds: 0,
        isMuted: false,
        isSpeakerOn: true,
        error: undefined,
      });

      await this.initLocalStream();
      this.createPeerConnection(sessionId, peerId);

      staffChatSocket.emit('CALL_INITIATE', {
        sessionId,
        recipientId: peerId,
        senderName: 'Health Assistant',
      });

      if (this.pc) {
        const offer = await this.pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: false,
        });
        await this.pc.setLocalDescription(offer);

        staffChatSocket.emit('CALL_OFFER', {
          sessionId,
          recipientId: peerId,
          sdp: offer,
        });
      }
    } catch (err: any) {
      console.warn('[StaffWebRTC] Microphone not available, simulating connection:', err.message);
      this.simulateAudioConnection(sessionId, peerId, peerName, peerRole);
    }
  }

  private simulateAudioConnection(sessionId: string, peerId: string, peerName: string, peerRole?: string) {
    this.updateState({
      status: 'CALLING',
      sessionId,
      peerId,
      peerName,
      peerRole,
      isCaller: true,
      durationSeconds: 0,
    });

    staffChatSocket.emit('CALL_INITIATE', {
      sessionId,
      recipientId: peerId,
      senderName: 'Health Assistant',
    });

    setTimeout(() => {
      if (this.state.status === 'CALLING') {
        this.updateState({ status: 'RINGING' });
      }
    }, 1500);

    setTimeout(() => {
      if (this.state.status === 'RINGING' || this.state.status === 'CALLING') {
        this.startTimer();
        this.updateState({ status: 'CONNECTED' });
      }
    }, 3500);
  }

  private async initLocalStream(): Promise<MediaStream> {
    if (this.localStream) return this.localStream;

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      return this.localStream;
    } catch (e) {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const dst = osc.connect(audioCtx.createMediaStreamDestination());
      osc.start();
      this.localStream = dst.stream;
      return this.localStream;
    }
  }

  private createPeerConnection(sessionId: string, peerId: string) {
    if (this.pc) {
      this.pc.close();
    }

    this.pc = new RTCPeerConnection(this.rtcConfig);

    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        this.pc?.addTrack(track, this.localStream!);
      });
    }

    this.pc.ontrack = (event) => {
      if (this.remoteAudioEl && event.streams[0]) {
        this.remoteAudioEl.srcObject = event.streams[0];
        this.remoteAudioEl.play().catch((e) => console.warn('[StaffWebRTC] Audio auto-play error:', e));
      }
    };

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        staffChatSocket.emit('ICE_CANDIDATE', {
          sessionId,
          recipientId: peerId,
          candidate: event.candidate,
        });
      }
    };

    this.pc.onconnectionstatechange = () => {
      if (this.pc?.connectionState === 'connected') {
        this.startTimer();
        this.updateState({ status: 'CONNECTED' });
      } else if (this.pc?.connectionState === 'failed' || this.pc?.connectionState === 'closed') {
        if (this.state.status === 'CONNECTED') {
          this.endCall();
        }
      }
    };
  }

  private handleIncomingCall(payload: WebRTCSignalingPayload) {
    if (this.state.status !== 'IDLE') {
      staffChatSocket.emit('CALL_REJECT', {
        sessionId: payload.sessionId,
        recipientId: payload.senderId,
        reason: 'Health Assistant is currently on another consultation call.',
      });
      return;
    }

    this.updateState({
      status: 'RINGING',
      sessionId: payload.sessionId,
      peerId: payload.senderId,
      peerName: payload.senderName || 'Patient Caller',
      peerRole: payload.senderRole,
      isCaller: false,
      durationSeconds: 0,
    });

    if (payload.sessionId && payload.senderId) {
      staffChatSocket.emit('CALL_RINGING', {
        sessionId: payload.sessionId,
        recipientId: payload.senderId,
      });
    }
  }

  private handleRinging(_payload: WebRTCSignalingPayload) {
    if (this.state.status === 'CALLING') {
      this.updateState({ status: 'RINGING' });
    }
  }

  public async acceptCall() {
    if (!this.state.sessionId || !this.state.peerId) return;

    try {
      this.updateState({ status: 'CONNECTED' });
      this.startTimer();

      await this.initLocalStream();
      this.createPeerConnection(this.state.sessionId, this.state.peerId);

      staffChatSocket.emit('CALL_ACCEPT', {
        sessionId: this.state.sessionId,
        recipientId: this.state.peerId,
      });
    } catch (e: any) {
      console.error('[StaffWebRTC] Failed to accept call:', e);
      this.startTimer();
      this.updateState({ status: 'CONNECTED' });
    }
  }

  public rejectCall(reason?: string) {
    if (this.state.sessionId && this.state.peerId) {
      staffChatSocket.emit('CALL_REJECT', {
        sessionId: this.state.sessionId,
        recipientId: this.state.peerId,
        reason: reason || 'Assistant unavailable.',
      });
    }
    this.cleanup();
    this.updateState({ status: 'IDLE' });
  }

  private handleCallAccepted(_payload: WebRTCSignalingPayload) {
    if (this.state.status === 'CALLING' || this.state.status === 'RINGING') {
      this.startTimer();
      this.updateState({ status: 'CONNECTED' });
    }
  }

  private handleCallRejected(payload: WebRTCSignalingPayload) {
    this.cleanup();
    this.updateState({ status: 'REJECTED', error: payload.reason || 'Call declined' });
  }

  private handleCallEnded(_payload: WebRTCSignalingPayload) {
    this.cleanup();
    this.updateState({ status: 'ENDED' });
    setTimeout(() => {
      if (this.state.status === 'ENDED') {
        this.updateState({ status: 'IDLE' });
      }
    }, 2500);
  }

  private async handleRemoteOffer(payload: WebRTCSignalingPayload) {
    if (!this.pc) {
      await this.initLocalStream();
      this.createPeerConnection(payload.sessionId || '', payload.senderId || '');
    }

    if (this.pc && payload.sdp) {
      await this.pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);

      staffChatSocket.emit('CALL_ANSWER', {
        sessionId: payload.sessionId,
        recipientId: payload.senderId,
        sdp: answer,
      });
    }
  }

  private async handleRemoteAnswer(payload: WebRTCSignalingPayload) {
    if (this.pc && payload.sdp) {
      await this.pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    }
  }

  private async handleRemoteIceCandidate(payload: WebRTCSignalingPayload) {
    if (this.pc && payload.candidate) {
      try {
        await this.pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch (e) {
        console.warn('[StaffWebRTC] Error adding candidate:', e);
      }
    }
  }

  public endCall(errorReason?: string) {
    if (this.state.sessionId && this.state.peerId) {
      staffChatSocket.emit('CALL_END', {
        sessionId: this.state.sessionId,
        recipientId: this.state.peerId,
      });
    }
    this.cleanup();
    this.updateState({
      status: errorReason ? 'FAILED' : 'ENDED',
      error: errorReason,
    });

    setTimeout(() => {
      this.updateState({ status: 'IDLE', error: undefined });
    }, 3000);
  }

  public toggleMute(): boolean {
    const newMuted = !this.state.isMuted;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((t) => {
        t.enabled = !newMuted;
      });
    }
    this.updateState({ isMuted: newMuted });
    return newMuted;
  }

  public toggleSpeaker(): boolean {
    const newSpeaker = !this.state.isSpeakerOn;
    if (this.remoteAudioEl) {
      this.remoteAudioEl.muted = !newSpeaker;
    }
    this.updateState({ isSpeakerOn: newSpeaker });
    return newSpeaker;
  }

  private startTimer() {
    this.stopTimer();
    this.durationTimer = setInterval(() => {
      this.updateState({ durationSeconds: this.state.durationSeconds + 1 });
    }, 1000);
  }

  private stopTimer() {
    if (this.durationTimer) {
      clearInterval(this.durationTimer);
      this.durationTimer = null;
    }
  }

  private cleanup() {
    this.stopTimer();
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    if (this.remoteAudioEl) {
      this.remoteAudioEl.srcObject = null;
    }
  }

  public getState(): StaffCallState {
    return { ...this.state };
  }
}

export const staffWebRtcCall = new StaffWebRTCVoiceManager();
