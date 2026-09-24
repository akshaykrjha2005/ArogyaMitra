import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { DataStore } from '../db/dataStore';
import {
  CallbackRequest,
  CallbackRequestStatus,
  CallLogEntry,
  CallLogOutcome,
  CallLogDirection,
  HelplineCategory,
  TelephonyCallInitiateRequest,
  Notification,
} from '@phc-connect/types';
import { TelephonyService } from '../services/telephonyService';

export class CallController {
  /**
   * 1. Get categorized Helplines, PHC direct lines, and Health Assistants
   * Public or Authenticated
   */
  public static async getHelplines(req: Request, res: Response): Promise<void> {
    try {
      const { category, phcId } = req.query;

      let contacts = [...DataStore.helplineContacts];

      if (category) {
        contacts = contacts.filter((c) => c.category === (category as HelplineCategory));
      }

      if (phcId) {
        contacts = contacts.filter((c) => !c.phcId || c.phcId === phcId);
      }

      res.json({
        success: true,
        count: contacts.length,
        contacts,
      });
    } catch (error: any) {
      console.error('[CallController.getHelplines] Error:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve helpline directory.' });
    }
  }

  /**
   * 2. Request a Callback (Patient or Citizen)
   * Public or Authenticated
   */
  public static async requestCallback(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, phone, reason, preferredTime, phcId } = req.body;

      if (!name || !phone || !reason) {
        res.status(400).json({
          success: false,
          error: 'Name, phone number, and callback reason are required.',
        });
        return;
      }

      // Check user session if available
      const user = req.user;
      const patientId = user?.patientId || req.body.patientId || null;

      // Find target PHC
      const selectedPhcId = phcId || 'phc-001';
      const targetPhc = DataStore.phcs.find((p) => p.id === selectedPhcId);
      const phcName = targetPhc ? targetPhc.name : 'Primary Health Centre';

      // Generate unique Request ID: CB-2026-XXXX
      const count = DataStore.callbackRequests.length + 1;
      const requestId = `CB-2026-${count.toString().padStart(4, '0')}`;
      const now = new Date().toISOString();

      const newRequest: CallbackRequest = {
        id: `cb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        requestId,
        patientId,
        name: name.trim(),
        phone: phone.trim(),
        reason: reason.trim(),
        preferredTime: preferredTime || 'Immediate / ASAP',
        phcId: selectedPhcId,
        phcName,
        status: 'Pending',
        assignedStaffId: null,
        assignedStaffName: null,
        notes: null,
        callAttempts: 0,
        lastAttemptAt: null,
        createdAt: now,
        updatedAt: now,
      };

      DataStore.callbackRequests.unshift(newRequest);

      // Create notification for staff
      const staffNotification: Notification = {
        id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId: 'user-rec-001',
        title: 'New Patient Callback Request',
        message: `Callback requested by ${newRequest.name} (${newRequest.phone}). Preferred: ${newRequest.preferredTime}. Reason: ${newRequest.reason}`,
        type: 'APPOINTMENT_REMINDER',
        read: false,
        createdAt: now,
        linkUrl: `/dashboard/calls`,
      };
      DataStore.notifications.unshift(staffNotification);

      // If user is authenticated patient, send acknowledgement notification
      if (user) {
        const patientNotif: Notification = {
          id: `notif-${Date.now() + 1}-${Math.floor(Math.random() * 1000)}`,
          userId: user.id,
          title: 'Callback Request Received',
          message: `Your callback request (${requestId}) for ${phcName} has been received. Our health team will contact you shortly.`,
          type: 'APPOINTMENT_REMINDER',
          read: false,
          createdAt: now,
        };
        DataStore.notifications.unshift(patientNotif);
      }

      res.status(201).json({
        success: true,
        message: 'Callback request submitted successfully. Health desk will contact you soon.',
        callbackRequest: newRequest,
      });
    } catch (error: any) {
      console.error('[CallController.requestCallback] Error:', error);
      res.status(500).json({ success: false, error: 'Failed to submit callback request.' });
    }
  }

  /**
   * 3. Get Staff Callback Queue (Staff / Admin)
   */
  public static async getCallbackQueue(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { status, phcId, search } = req.query;

      let queue = [...DataStore.callbackRequests];

      if (status && status !== 'ALL') {
        queue = queue.filter((r) => r.status.toUpperCase() === (status as string).toUpperCase());
      }

      if (phcId && phcId !== 'ALL') {
        queue = queue.filter((r) => r.phcId === phcId);
      }

      if (search) {
        const q = (search as string).toLowerCase();
        queue = queue.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            r.phone.toLowerCase().includes(q) ||
            r.reason.toLowerCase().includes(q) ||
            r.requestId.toLowerCase().includes(q)
        );
      }

      // Sort pending first, then by createdAt desc
      queue.sort((a, b) => {
        if (a.status === 'Pending' && b.status !== 'Pending') return -1;
        if (a.status !== 'Pending' && b.status === 'Pending') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      // Metrics calculation
      const metrics = {
        total: DataStore.callbackRequests.length,
        pending: DataStore.callbackRequests.filter((r) => r.status === 'Pending').length,
        called: DataStore.callbackRequests.filter((r) => r.status === 'Called').length,
        missed: DataStore.callbackRequests.filter((r) => r.status === 'Missed').length,
        completed: DataStore.callbackRequests.filter((r) => r.status === 'Completed').length,
      };

      res.json({
        success: true,
        count: queue.length,
        metrics,
        requests: queue,
      });
    } catch (error: any) {
      console.error('[CallController.getCallbackQueue] Error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch callback queue.' });
    }
  }

  /**
   * 4. Get Current Patient's Callback Requests
   */
  public static async getMyCallbacks(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const patientId = user.patientId;
      const userPhone = user.phone;

      const myRequests = DataStore.callbackRequests.filter(
        (r) => (patientId && r.patientId === patientId) || (userPhone && r.phone === userPhone)
      );

      res.json({
        success: true,
        count: myRequests.length,
        requests: myRequests,
      });
    } catch (error: any) {
      console.error('[CallController.getMyCallbacks] Error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch user callback requests.' });
    }
  }

  /**
   * 5. Get Single Callback Request Details
   */
  public static async getCallbackById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const request = DataStore.callbackRequests.find((r) => r.id === id || r.requestId === id);

      if (!request) {
        res.status(404).json({ success: false, error: 'Callback request not found.' });
        return;
      }

      res.json({ success: true, request });
    } catch (error: any) {
      console.error('[CallController.getCallbackById] Error:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve callback request.' });
    }
  }

  /**
   * 6. Update Callback Status & Add Notes (Staff / Admin)
   */
  public static async updateCallbackStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, notes, incrementAttempt } = req.body;

      const request = DataStore.callbackRequests.find((r) => r.id === id || r.requestId === id);
      if (!request) {
        res.status(404).json({ success: false, error: 'Callback request not found.' });
        return;
      }

      const user = req.user;
      const now = new Date().toISOString();

      if (status) {
        request.status = status as CallbackRequestStatus;
      }

      if (notes !== undefined) {
        request.notes = notes;
      }

      if (user) {
        request.assignedStaffId = user.id;
        request.assignedStaffName = user.fullName;
      }

      if (incrementAttempt) {
        request.callAttempts = (request.callAttempts || 0) + 1;
        request.lastAttemptAt = now;
      }

      request.updatedAt = now;

      res.json({
        success: true,
        message: `Callback request status updated to ${request.status}.`,
        request,
      });
    } catch (error: any) {
      console.error('[CallController.updateCallbackStatus] Error:', error);
      res.status(500).json({ success: false, error: 'Failed to update callback request.' });
    }
  }

  /**
   * 7. Initiate Telephony Call via Pluggable Provider
   */
  public static async initiateCall(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { toPhone, toName, purpose, callbackRequestId, phcId, fromRole } = req.body;

      if (!toPhone || !toName) {
        res.status(400).json({
          success: false,
          error: 'Destination phone number and recipient name are required.',
        });
        return;
      }

      const user = req.user;
      const callerInfo = {
        callerName: user ? `${user.fullName} (${user.role})` : 'PHC Telephony Desk',
        callerPhone: user?.phone || '+91 11 2572 4012',
        callerRole: user?.role || 'RECEPTIONIST',
      };

      const initiateReq: TelephonyCallInitiateRequest = {
        toPhone,
        toName,
        purpose: purpose || 'Health Service Consultation & Callback',
        callbackRequestId,
        phcId: phcId || 'phc-001',
        fromRole: fromRole || 'PHC Reception Staff',
      };

      const session = await TelephonyService.initiateCall(initiateReq, callerInfo);

      // If tied to a callback request, automatically update attempt stats
      if (callbackRequestId) {
        const cb = DataStore.callbackRequests.find((c) => c.id === callbackRequestId || c.requestId === callbackRequestId);
        if (cb) {
          cb.callAttempts = (cb.callAttempts || 0) + 1;
          cb.lastAttemptAt = new Date().toISOString();
          if (cb.status === 'Pending') {
            cb.status = 'Called';
          }
          cb.updatedAt = new Date().toISOString();
        }
      }

      res.json({
        success: true,
        message: `Call successfully dispatched via ${session.provider}.`,
        session,
      });
    } catch (error: any) {
      console.error('[CallController.initiateCall] Error:', error);
      res.status(500).json({ success: false, error: 'Failed to initiate outbound call.' });
    }
  }

  /**
   * 8. Get Status of Active Call Session
   */
  public static async getCallSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const session = await TelephonyService.getCallStatus(sessionId);

      if (!session) {
        res.status(404).json({ success: false, error: 'Call session not found or has expired.' });
        return;
      }

      res.json({ success: true, session });
    } catch (error: any) {
      console.error('[CallController.getCallSession] Error:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve call session.' });
    }
  }

  /**
   * 9. Hang Up / Terminate Call Session
   */
  public static async hangupCall(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const success = await TelephonyService.hangupCall(sessionId);

      res.json({
        success,
        message: success ? 'Call session ended.' : 'Session could not be terminated or not found.',
      });
    } catch (error: any) {
      console.error('[CallController.hangupCall] Error:', error);
      res.status(500).json({ success: false, error: 'Failed to terminate call.' });
    }
  }

  /**
   * 10. Get Call Logs History (Staff / Admin)
   */
  public static async getCallLogs(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { outcome, direction, search, phcId, limit } = req.query;

      let logs = [...DataStore.callLogs];

      if (outcome && outcome !== 'ALL') {
        logs = logs.filter((l) => l.outcome === (outcome as CallLogOutcome));
      }

      if (direction && direction !== 'ALL') {
        logs = logs.filter((l) => l.direction === (direction as CallLogDirection));
      }

      if (phcId && phcId !== 'ALL') {
        logs = logs.filter((l) => l.phcId === phcId);
      }

      if (search) {
        const q = (search as string).toLowerCase();
        logs = logs.filter(
          (l) =>
            l.callerName.toLowerCase().includes(q) ||
            l.callerPhone.toLowerCase().includes(q) ||
            l.receiverName.toLowerCase().includes(q) ||
            l.receiverPhone.toLowerCase().includes(q) ||
            l.purpose.toLowerCase().includes(q)
        );
      }

      // Sort newest first
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      if (limit) {
        logs = logs.slice(0, parseInt(limit as string, 10));
      }

      // Compute call stats
      const totalSeconds = DataStore.callLogs.reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0);
      const avgDuration = DataStore.callLogs.length > 0 ? Math.round(totalSeconds / DataStore.callLogs.length) : 0;

      const metrics = {
        totalCalls: DataStore.callLogs.length,
        connectedCalls: DataStore.callLogs.filter((l) => l.outcome === 'CONNECTED' || l.outcome === 'CALLBACK_RESOLVED').length,
        busyOrMissed: DataStore.callLogs.filter((l) => l.outcome === 'BUSY' || l.outcome === 'NO_ANSWER' || l.outcome === 'FAILED').length,
        totalDurationSeconds: totalSeconds,
        avgDurationSeconds: avgDuration,
      };

      res.json({
        success: true,
        count: logs.length,
        metrics,
        logs,
      });
    } catch (error: any) {
      console.error('[CallController.getCallLogs] Error:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve call logs.' });
    }
  }

  /**
   * 11. Manually or Automatically Record Call Log Entry
   */
  public static async recordCallLog(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        callerName,
        callerPhone,
        receiverName,
        receiverPhone,
        receiverRole,
        direction,
        purpose,
        outcome,
        durationSeconds,
        notes,
        callbackRequestId,
        phcId,
      } = req.body;

      if (!callerPhone || !receiverPhone || !purpose || !outcome) {
        res.status(400).json({
          success: false,
          error: 'Caller phone, receiver phone, purpose, and call outcome are required.',
        });
        return;
      }

      const now = new Date().toISOString();

      const newLog: CallLogEntry = {
        id: `call-log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        callSessionId: req.body.callSessionId || `MANUAL-${Date.now()}`,
        callerName: callerName || 'PHC Staff',
        callerPhone,
        receiverName: receiverName || 'Patient / Citizen',
        receiverPhone,
        receiverRole: receiverRole || 'Citizen',
        direction: (direction as CallLogDirection) || 'OUTBOUND',
        purpose,
        outcome: (outcome as CallLogOutcome) || 'CONNECTED',
        durationSeconds: durationSeconds ? parseInt(durationSeconds, 10) : 0,
        notes: notes || null,
        callbackRequestId: callbackRequestId || null,
        phcId: phcId || 'phc-001',
        timestamp: now,
      };

      DataStore.callLogs.unshift(newLog);

      // If outcome was CALLBACK_RESOLVED and callbackRequestId is provided, mark callback as Completed
      if (outcome === 'CALLBACK_RESOLVED' && callbackRequestId) {
        const cb = DataStore.callbackRequests.find((c) => c.id === callbackRequestId || c.requestId === callbackRequestId);
        if (cb) {
          cb.status = 'Completed';
          cb.notes = `${cb.notes || ''} [Resolved via Call on ${new Date().toLocaleTimeString()} - Notes: ${notes || 'Call completed successfully.'}]`;
          cb.updatedAt = now;
        }
      }

      res.status(201).json({
        success: true,
        message: 'Call log entry recorded successfully.',
        log: newLog,
      });
    } catch (error: any) {
      console.error('[CallController.recordCallLog] Error:', error);
      res.status(500).json({ success: false, error: 'Failed to record call log entry.' });
    }
  }
}
