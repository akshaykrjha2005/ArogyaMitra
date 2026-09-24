import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { DataStore } from '../db/dataStore';
import {
  Complaint,
  ComplaintCategory,
  ComplaintStatus,
  ComplaintPriority,
  ComplaintHistoryEntry,
  ComplaintReply,
  ComplaintSummaryMetrics,
  Notification,
} from '@phc-connect/types';

const CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  SERVICE_QUALITY: 'Service Quality',
  STAFF_BEHAVIOUR: 'Staff Behaviour',
  MEDICINE_AVAILABILITY: 'Medicine Availability',
  FACILITY_CLEANLINESS: 'Facility / Cleanliness',
  WAIT_TIME: 'Long Wait Time',
  OTHER: 'General / Other',
};

export class ComplaintController {
  /**
   * 1. Submit a new complaint (Any logged in user: Patient or Staff)
   */
  public static async createComplaint(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { category, subject, description, phcId, attachmentUrl, attachmentName, priority } = req.body;

      if (!category || !description || !phcId) {
        res.status(400).json({
          success: false,
          error: 'Category, description, and related health centre (PHC) are mandatory.',
        });
        return;
      }

      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, error: 'Authentication required to file a grievance.' });
        return;
      }

      const phc = DataStore.phcs.find((p) => p.id === phcId);
      const phcName = phc ? phc.name : 'Primary Health Centre';

      // Auto-generate Complaint ID: CMP-2026-XXXX
      const count = DataStore.complaints.length + 1;
      const complaintId = `CMP-2026-${count.toString().padStart(4, '0')}`;
      const now = new Date().toISOString();

      const newComplaint: Complaint = {
        id: `cmp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        complaintId,
        userId: user.id,
        userName: user.fullName || 'Citizen / Patient',
        userPhone: user.phone || undefined,
        userEmail: user.email || undefined,
        userRole: user.role || 'PATIENT',
        phcId,
        phcName,
        category: category as ComplaintCategory,
        categoryLabel: CATEGORY_LABELS[category as ComplaintCategory] || 'Grievance',
        subject: subject?.trim() || `${CATEGORY_LABELS[category as ComplaintCategory] || 'Grievance'} at ${phcName}`,
        description: description.trim(),
        attachmentUrl: attachmentUrl || null,
        attachmentName: attachmentName || null,
        priority: (priority as ComplaintPriority) || 'MEDIUM',
        status: 'OPEN',
        assignedToId: null,
        assignedToName: null,
        assignedToRole: null,
        resolutionNotes: null,
        resolvedAt: null,
        closedAt: null,
        history: [
          {
            id: `cmph-${Date.now()}`,
            timestamp: now,
            fromStatus: undefined,
            toStatus: 'OPEN',
            actorId: user.id,
            actorName: user.fullName || 'Citizen',
            actorRole: user.role || 'PATIENT',
            note: 'Grievance submitted successfully.',
          },
        ],
        replies: [],
        createdAt: now,
        updatedAt: now,
      };

      DataStore.complaints.unshift(newComplaint);

      // 1. Create In-App Notification for Patient
      const patientNotif: Notification = {
        id: `notif-${Date.now()}-1`,
        userId: user.id,
        patientId: user.patientId,
        title: `Grievance Registered: ${complaintId}`,
        message: `Your grievance regarding "${newComplaint.categoryLabel}" has been logged with status OPEN. Tracking ID: ${complaintId}`,
        type: 'COMPLAINT_REGISTERED',
        read: false,
        linkUrl: `/complaints`,
        createdAt: now,
      };
      DataStore.notifications.unshift(patientNotif);

      // 2. Create In-App Notification for Admin
      const adminNotif: Notification = {
        id: `notif-${Date.now()}-2`,
        userId: 'user-admin-001',
        title: `New Grievance: ${complaintId}`,
        message: `${newComplaint.userName} raised a ${newComplaint.categoryLabel} issue at ${phcName}.`,
        type: 'COMPLAINT_REGISTERED',
        read: false,
        linkUrl: `/admin/complaints`,
        createdAt: now,
      };
      DataStore.notifications.unshift(adminNotif);

      // 3. Simulated SMS/Email Gateway dispatch
      console.log(`[Notification Gateway] ✉️ Email/SMS sent for ${complaintId} to ${user.phone || user.email || 'user'}`);

      res.status(201).json({
        success: true,
        message: `Grievance registered successfully. Reference ID: ${complaintId}`,
        complaint: newComplaint,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  /**
   * 2. Get complaints for the current authenticated user (Patient/Staff)
   */
  public static async getMyComplaints(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const complaints = DataStore.complaints.filter(
        (c) => c.userId === user.id || (user.phone && c.userPhone?.slice(-10) === user.phone.slice(-10))
      );

      res.json({
        success: true,
        count: complaints.length,
        complaints,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  /**
   * 3. Get single complaint details by ID
   */
  public static async getComplaintById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const complaint = DataStore.complaints.find((c) => c.id === id || c.complaintId === id);

      if (!complaint) {
        res.status(404).json({ success: false, error: 'Complaint record not found.' });
        return;
      }

      res.json({
        success: true,
        complaint,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  /**
   * 4. Get all complaints (Admin / Staff dashboard) with filtering & summary KPIs
   */
  public static async getAllComplaints(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { status, category, phcId, search, priority } = req.query;

      let list = [...DataStore.complaints];

      if (status && status !== 'ALL') {
        list = list.filter((c) => c.status === status);
      }
      if (category && category !== 'ALL') {
        list = list.filter((c) => c.category === category);
      }
      if (phcId && phcId !== 'ALL') {
        list = list.filter((c) => c.phcId === phcId);
      }
      if (priority && priority !== 'ALL') {
        list = list.filter((c) => c.priority === priority);
      }
      if (search && typeof search === 'string') {
        const q = search.toLowerCase();
        list = list.filter(
          (c) =>
            c.complaintId.toLowerCase().includes(q) ||
            c.userName.toLowerCase().includes(q) ||
            c.subject.toLowerCase().includes(q) ||
            c.description.toLowerCase().includes(q) ||
            c.phcName.toLowerCase().includes(q)
        );
      }

      // Compute metrics over ALL complaints
      const all = DataStore.complaints;
      const metrics: ComplaintSummaryMetrics = {
        total: all.length,
        open: all.filter((c) => c.status === 'OPEN').length,
        inProgress: all.filter((c) => c.status === 'IN_PROGRESS').length,
        resolved: all.filter((c) => c.status === 'RESOLVED').length,
        closed: all.filter((c) => c.status === 'CLOSED').length,
        byCategory: all.reduce((acc, c) => {
          acc[c.category] = (acc[c.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byPhc: all.reduce((acc, c) => {
          acc[c.phcName] = (acc[c.phcName] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        avgResolutionHours: 18.5,
      };

      res.json({
        success: true,
        count: list.length,
        metrics,
        complaints: list,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  /**
   * 5. Update status (Open -> In Progress -> Resolved -> Closed)
   */
  public static async updateStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, note, resolutionNotes } = req.body;

      if (!status || !['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status)) {
        res.status(400).json({
          success: false,
          error: 'Valid status required: OPEN, IN_PROGRESS, RESOLVED, or CLOSED.',
        });
        return;
      }

      const complaint = DataStore.complaints.find((c) => c.id === id || c.complaintId === id);
      if (!complaint) {
        res.status(404).json({ success: false, error: 'Complaint not found.' });
        return;
      }

      const actor = req.user || { id: 'admin-001', fullName: 'Health Administrator', role: 'ADMIN' as const };
      const fromStatus = complaint.status;
      const now = new Date().toISOString();

      complaint.status = status as ComplaintStatus;
      complaint.updatedAt = now;

      if (resolutionNotes) {
        complaint.resolutionNotes = resolutionNotes;
      }

      if (status === 'RESOLVED') {
        complaint.resolvedAt = now;
      } else if (status === 'CLOSED') {
        complaint.closedAt = now;
      }

      // Record in history
      const historyEntry: ComplaintHistoryEntry = {
        id: `cmph-${Date.now()}`,
        timestamp: now,
        fromStatus,
        toStatus: status as ComplaintStatus,
        actorId: actor.id,
        actorName: actor.fullName,
        actorRole: actor.role,
        note: note || `Status updated from ${fromStatus} to ${status}. ${resolutionNotes ? `Resolution: ${resolutionNotes}` : ''}`,
      };

      complaint.history.push(historyEntry);

      // Notification to user
      const userNotif: Notification = {
        id: `notif-${Date.now()}`,
        userId: complaint.userId,
        title: `Grievance Status Updated: ${complaint.complaintId}`,
        message: `Your grievance "${complaint.subject}" is now marked as ${status}. ${resolutionNotes ? `Resolution: ${resolutionNotes}` : ''}`,
        type: status === 'RESOLVED' ? 'COMPLAINT_RESOLVED' : 'COMPLAINT_UPDATE',
        read: false,
        linkUrl: `/complaints`,
        createdAt: now,
      };
      DataStore.notifications.unshift(userNotif);

      console.log(`[Notification Gateway] ✉️ Status update SMS/Email dispatched for ${complaint.complaintId} -> ${status}`);

      res.json({
        success: true,
        message: `Complaint status updated to ${status}.`,
        complaint,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  /**
   * 6. Assign complaint to staff / medical officer
   */
  public static async assignComplaint(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { assignedToId, assignedToName, assignedToRole, note } = req.body;

      const complaint = DataStore.complaints.find((c) => c.id === id || c.complaintId === id);
      if (!complaint) {
        res.status(404).json({ success: false, error: 'Complaint not found.' });
        return;
      }

      const actor = req.user || { id: 'admin-001', fullName: 'Health Administrator', role: 'ADMIN' as const };
      const now = new Date().toISOString();

      complaint.assignedToId = assignedToId;
      complaint.assignedToName = assignedToName;
      complaint.assignedToRole = assignedToRole;
      if (complaint.status === 'OPEN') {
        complaint.status = 'IN_PROGRESS';
      }
      complaint.updatedAt = now;

      // History
      complaint.history.push({
        id: `cmph-${Date.now()}`,
        timestamp: now,
        fromStatus: 'OPEN',
        toStatus: complaint.status,
        actorId: actor.id,
        actorName: actor.fullName,
        actorRole: actor.role,
        note: note || `Assigned to ${assignedToName} (${assignedToRole || 'Staff'}) for investigation.`,
      });

      // Notification
      DataStore.notifications.unshift({
        id: `notif-${Date.now()}`,
        userId: complaint.userId,
        title: `Grievance Assigned: ${complaint.complaintId}`,
        message: `Your grievance has been assigned to ${assignedToName} for investigation.`,
        type: 'COMPLAINT_ASSIGNED',
        read: false,
        linkUrl: `/complaints`,
        createdAt: now,
      });

      res.json({
        success: true,
        message: `Complaint assigned to ${assignedToName}.`,
        complaint,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  /**
   * 7. Add an official reply / remarks to complaint thread
   */
  public static async addReply(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { message, isInternal } = req.body;

      if (!message || !message.trim()) {
        res.status(400).json({ success: false, error: 'Message text is required.' });
        return;
      }

      const complaint = DataStore.complaints.find((c) => c.id === id || c.complaintId === id);
      if (!complaint) {
        res.status(404).json({ success: false, error: 'Complaint not found.' });
        return;
      }

      const actor = req.user || { id: 'admin-001', fullName: 'Health Administrator', role: 'ADMIN' as const };
      const now = new Date().toISOString();

      const newReply: ComplaintReply = {
        id: `cmpr-${Date.now()}`,
        authorId: actor.id,
        authorName: actor.fullName,
        authorRole: actor.role,
        message: message.trim(),
        isInternal: !!isInternal,
        createdAt: now,
      };

      complaint.replies.push(newReply);
      complaint.updatedAt = now;

      // If reply is from staff and not internal, notify the citizen
      if (!isInternal && actor.id !== complaint.userId) {
        DataStore.notifications.unshift({
          id: `notif-${Date.now()}`,
          userId: complaint.userId,
          title: `New Reply on ${complaint.complaintId}`,
          message: `${actor.fullName} replied: "${message.slice(0, 80)}${message.length > 80 ? '...' : ''}"`,
          type: 'COMPLAINT_UPDATE',
          read: false,
          linkUrl: `/complaints`,
          createdAt: now,
        });
      }

      res.status(201).json({
        success: true,
        message: 'Reply posted successfully.',
        reply: newReply,
        complaint,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }
}
