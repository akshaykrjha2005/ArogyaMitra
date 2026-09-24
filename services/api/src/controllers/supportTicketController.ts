import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { DataStore } from '../db/dataStore';
import {
  OnCallSupportTicket,
  SupportTicketStatus,
  SupportTicketPriority,
  SupportTicketCategory,
  TicketActionLog,
} from '@phc-connect/types';
import { ChatSocketServer } from '../services/chatSocketServer';

export class SupportTicketController {
  /**
   * Create a new on-call support ticket linked to a patient and active session
   * POST /api/support/tickets
   */
  public static createTicket(req: AuthRequest, res: Response): void {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required.' });
        return;
      }

      const {
        patientId,
        sessionId,
        category = 'GENERAL_CONSULTATION',
        subject,
        priority = 'MEDIUM',
        tags = [],
        notes = '',
        sharedCareNotes = '',
        assignedStaffId,
        assignedStaffName,
        assignedStaffRole,
      } = req.body;

      if (!patientId || !subject) {
        res.status(400).json({ success: false, message: 'patientId and subject are required.' });
        return;
      }

      const patient = DataStore.patients.find((p) => p.id === patientId || p.userId === patientId);
      const ticketSeq = DataStore.supportTickets.length + 1;
      const ticketNumber = `TKT-2026-${ticketSeq.toString().padStart(4, '0')}`;
      const now = new Date().toISOString();
      const staffId = user.assistantId || user.doctorId || user.patientId || user.id;
      const staffName = user.fullName || 'Health Staff';

      const newTicket: OnCallSupportTicket = {
        id: `tkt-${Date.now()}`,
        ticketNumber,
        patientId: patient?.id || patientId,
        patientName: patient?.fullName || req.body.patientName || 'Patient',
        patientPhone: patient?.phone || req.body.patientPhone,
        patientAge: patient?.age,
        patientGender: patient?.gender,
        creatorId: staffId,
        creatorName: staffName,
        creatorRole: user.role,
        assignedStaffId: assignedStaffId || staffId,
        assignedStaffName: assignedStaffName || staffName,
        assignedStaffRole: assignedStaffRole || user.role,
        sessionId: sessionId || null,
        category: category as SupportTicketCategory,
        subject: subject.trim(),
        priority: priority as SupportTicketPriority,
        status: 'OPEN',
        tags: Array.isArray(tags) ? tags : [],
        notes: notes.trim(),
        sharedCareNotes: sharedCareNotes.trim() || null,
        phcId: user.phcId || 'phc-001',
        phcName: 'Central Urban PHC - Karol Bagh',
        actionLogs: [
          {
            id: `act-${Date.now()}`,
            timestamp: now,
            actorId: staffId,
            actorName: staffName,
            actorRole: user.role,
            action: 'TICKET_CREATED',
            details: `Ticket ${ticketNumber} created during on-call session. Subject: ${subject}`,
          },
        ],
        createdAt: now,
        updatedAt: now,
      };

      DataStore.supportTickets.unshift(newTicket);

      // If linked to chat session, update session's activeTicketId
      if (sessionId) {
        const session = DataStore.chatSessions.find((s) => s.id === sessionId);
        if (session) {
          session.activeTicketId = newTicket.id;
          session.updatedAt = now;
        }

        // Broadcast ticket update via WebSocket
        ChatSocketServer.broadcastToSession(sessionId, {
          type: 'TICKET_UPDATED',
          sessionId,
          ticket: newTicket,
          timestamp: now,
        });
      }

      res.status(201).json({
        success: true,
        message: `Support ticket ${ticketNumber} opened successfully.`,
        ticket: newTicket,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to create support ticket.' });
    }
  }

  /**
   * Get all support tickets with optional filtering
   * GET /api/support/tickets
   */
  public static getTickets(req: AuthRequest, res: Response): void {
    try {
      const { status, category, priority, patientId, assignedStaffId, phcId, search } = req.query;

      let filtered = [...DataStore.supportTickets];

      if (status && status !== 'ALL') {
        filtered = filtered.filter((t) => t.status === status);
      }
      if (category && category !== 'ALL') {
        filtered = filtered.filter((t) => t.category === category);
      }
      if (priority && priority !== 'ALL') {
        filtered = filtered.filter((t) => t.priority === priority);
      }
      if (patientId) {
        filtered = filtered.filter((t) => t.patientId === patientId);
      }
      if (assignedStaffId) {
        filtered = filtered.filter((t) => t.assignedStaffId === assignedStaffId || t.escalatedDoctorId === assignedStaffId);
      }
      if (phcId) {
        filtered = filtered.filter((t) => t.phcId === phcId);
      }
      if (search && typeof search === 'string') {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            t.ticketNumber.toLowerCase().includes(q) ||
            t.patientName.toLowerCase().includes(q) ||
            t.subject.toLowerCase().includes(q) ||
            t.tags.some((tag) => tag.toLowerCase().includes(q))
        );
      }

      res.json({
        success: true,
        count: filtered.length,
        tickets: filtered,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to retrieve support tickets.' });
    }
  }

  /**
   * Get tickets for a specific patient
   * GET /api/support/tickets/patient/:patientId
   */
  public static getPatientTickets(req: AuthRequest, res: Response): void {
    try {
      const { patientId } = req.params;
      const tickets = DataStore.supportTickets.filter(
        (t) => t.patientId === patientId || t.patientPhone === patientId
      );

      res.json({
        success: true,
        count: tickets.length,
        tickets,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to retrieve patient tickets.' });
    }
  }

  /**
   * Get ticket by ID
   * GET /api/support/tickets/:id
   */
  public static getTicketById(req: AuthRequest, res: Response): void {
    try {
      const { id } = req.params;
      const ticket = DataStore.supportTickets.find((t) => t.id === id || t.ticketNumber === id);

      if (!ticket) {
        res.status(404).json({ success: false, message: 'Support ticket not found.' });
        return;
      }

      res.json({
        success: true,
        ticket,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to get ticket.' });
    }
  }

  /**
   * Update support ticket
   * PATCH /api/support/tickets/:id
   */
  public static updateTicket(req: AuthRequest, res: Response): void {
    try {
      const user = req.user;
      const { id } = req.params;
      const {
        status,
        priority,
        category,
        notes,
        tags,
        sharedCareNotes,
        resolutionSummary,
        actionNote,
      } = req.body;

      const ticket = DataStore.supportTickets.find((t) => t.id === id || t.ticketNumber === id);
      if (!ticket) {
        res.status(404).json({ success: false, message: 'Support ticket not found.' });
        return;
      }

      const now = new Date().toISOString();
      let actionTaken = 'TICKET_UPDATED';

      if (status && status !== ticket.status) {
        actionTaken = `STATUS_CHANGED_${status}`;
        ticket.status = status as SupportTicketStatus;
        if (status === 'RESOLVED' || status === 'CLOSED') {
          ticket.resolvedAt = now;
        }
      }

      if (priority) ticket.priority = priority as SupportTicketPriority;
      if (category) ticket.category = category as SupportTicketCategory;
      if (typeof notes === 'string') ticket.notes = notes.trim();
      if (Array.isArray(tags)) ticket.tags = tags;
      if (typeof sharedCareNotes === 'string') ticket.sharedCareNotes = sharedCareNotes.trim();
      if (typeof resolutionSummary === 'string') ticket.resolutionSummary = resolutionSummary.trim();

      ticket.updatedAt = now;

      // Add Action Log
      const staffId = user?.assistantId || user?.doctorId || user?.patientId || user?.id || 'system';
      const staffName = user?.fullName || 'Staff';

      const logEntry: TicketActionLog = {
        id: `act-${Date.now()}`,
        timestamp: now,
        actorId: staffId,
        actorName: staffName,
        actorRole: user?.role || 'HEALTH_ASSISTANT',
        action: actionTaken,
        details: actionNote || `Ticket modified. Status: ${ticket.status}, Priority: ${ticket.priority}`,
      };
      ticket.actionLogs.unshift(logEntry);

      // Broadcast update
      if (ticket.sessionId) {
        ChatSocketServer.broadcastToSession(ticket.sessionId, {
          type: 'TICKET_UPDATED',
          sessionId: ticket.sessionId,
          ticket,
          timestamp: now,
        });
      }

      res.json({
        success: true,
        message: 'Support ticket updated successfully.',
        ticket,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to update support ticket.' });
    }
  }

  /**
   * Resolve a support ticket with a resolution summary
   * POST /api/support/tickets/:id/resolve
   */
  public static resolveTicket(req: AuthRequest, res: Response): void {
    try {
      const user = req.user;
      const { id } = req.params;
      const { resolutionSummary, notes } = req.body;

      const ticket = DataStore.supportTickets.find((t) => t.id === id || t.ticketNumber === id);
      if (!ticket) {
        res.status(404).json({ success: false, message: 'Support ticket not found.' });
        return;
      }

      const now = new Date().toISOString();
      const staffId = user?.assistantId || user?.doctorId || user?.patientId || user?.id || 'system';
      const staffName = user?.fullName || 'Staff';

      ticket.status = 'RESOLVED';
      ticket.resolutionSummary = resolutionSummary?.trim() || 'Resolved during remote on-call consultation.';
      if (notes) ticket.notes = notes.trim();
      ticket.resolvedAt = now;
      ticket.updatedAt = now;

      ticket.actionLogs.unshift({
        id: `act-${Date.now()}`,
        timestamp: now,
        actorId: staffId,
        actorName: staffName,
        actorRole: user?.role || 'HEALTH_ASSISTANT',
        action: 'TICKET_RESOLVED',
        details: `Ticket resolved with summary: ${ticket.resolutionSummary}`,
      });

      // Update linked session if any
      if (ticket.sessionId) {
        const session = DataStore.chatSessions.find((s) => s.id === ticket.sessionId);
        if (session) {
          session.resolutionNotes = ticket.resolutionSummary;
          session.updatedAt = now;
        }

        ChatSocketServer.broadcastToSession(ticket.sessionId, {
          type: 'TICKET_UPDATED',
          sessionId: ticket.sessionId,
          ticket,
          timestamp: now,
        });
      }

      res.json({
        success: true,
        message: `Ticket ${ticket.ticketNumber} marked as RESOLVED.`,
        ticket,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to resolve ticket.' });
    }
  }

  /**
   * Get quick reply templates
   * GET /api/support/quick-replies
   */
  public static getQuickReplies(req: AuthRequest, res: Response): void {
    try {
      res.json({
        success: true,
        count: DataStore.quickReplies.length,
        quickReplies: DataStore.quickReplies,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to get quick replies.' });
    }
  }
}
