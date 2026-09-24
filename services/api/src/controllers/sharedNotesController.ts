import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { DataStore } from '../db/dataStore';
import { SharedCareNote } from '@phc-connect/types';
import { ChatSocketServer } from '../services/chatSocketServer';

export class SharedNotesController {
  /**
   * Get shared care notes for a chat session
   * GET /api/support/shared-notes/:sessionId
   */
  public static getSharedNotes(req: AuthRequest, res: Response): void {
    try {
      const { sessionId } = req.params;
      const note = DataStore.sharedCareNotes.find((n) => n.sessionId === sessionId);

      if (!note) {
        // Return blank default if session exists
        const session = DataStore.chatSessions.find((s) => s.id === sessionId);
        if (session) {
          res.json({
            success: true,
            note: null,
            message: 'No shared care notes created yet.',
          });
          return;
        }
        res.status(404).json({ success: false, message: 'Session not found.' });
        return;
      }

      res.json({
        success: true,
        note,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to get shared care notes.' });
    }
  }

  /**
   * Create or update shared care notes for a session
   * PUT /api/support/shared-notes/:sessionId
   */
  public static saveSharedNotes(req: AuthRequest, res: Response): void {
    try {
      const user = req.user;
      const { sessionId } = req.params;
      const {
        title = 'Patient Care & Lifestyle Instructions',
        summary = '',
        instructions = [],
        dietaryPrecautions = [],
        medicationNotes = [],
        emergencyWarning = null,
        ticketId,
      } = req.body;

      const session = DataStore.chatSessions.find((s) => s.id === sessionId);
      if (!session) {
        res.status(404).json({ success: false, message: 'Chat session not found.' });
        return;
      }

      const now = new Date().toISOString();
      let note = DataStore.sharedCareNotes.find((n) => n.sessionId === sessionId);

      const staffId = user?.assistantId || user?.doctorId || user?.id || 'system';
      const staffName = user?.fullName || 'Health Assistant';

      if (note) {
        note.title = title.trim();
        note.summary = summary.trim();
        note.instructions = Array.isArray(instructions) ? instructions : [];
        note.dietaryPrecautions = Array.isArray(dietaryPrecautions) ? dietaryPrecautions : [];
        note.medicationNotes = Array.isArray(medicationNotes) ? medicationNotes : [];
        note.emergencyWarning = emergencyWarning ? emergencyWarning.trim() : null;
        note.authorName = staffName;
        note.authorRole = user?.role || note.authorRole;
        note.updatedAt = now;
      } else {
        note = {
          id: `note-${Date.now()}`,
          sessionId,
          patientId: session.patientId,
          ticketId: ticketId || session.activeTicketId || null,
          title: title.trim(),
          summary: summary.trim(),
          authorName: staffName,
          authorRole: user?.role || 'HEALTH_ASSISTANT',
          instructions: Array.isArray(instructions) ? instructions : [],
          dietaryPrecautions: Array.isArray(dietaryPrecautions) ? dietaryPrecautions : [],
          medicationNotes: Array.isArray(medicationNotes) ? medicationNotes : [],
          emergencyWarning: emergencyWarning ? emergencyWarning.trim() : null,
          updatedAt: now,
        };
        DataStore.sharedCareNotes.unshift(note);
      }

      // Sync with session
      session.sharedNotes = note;
      session.updatedAt = now;

      // Sync with active ticket if present
      const targetTicketId = ticketId || session.activeTicketId;
      if (targetTicketId) {
        const ticket = DataStore.supportTickets.find((t) => t.id === targetTicketId);
        if (ticket) {
          ticket.sharedCareNotes = note.instructions.join('; ') || note.summary;
          ticket.updatedAt = now;
          ticket.actionLogs.unshift({
            id: `act-${Date.now()}`,
            timestamp: now,
            actorId: staffId,
            actorName: staffName,
            actorRole: user?.role || 'HEALTH_ASSISTANT',
            action: 'SHARED_NOTES_UPDATED',
            details: `Updated live care instructions for ${session.patientName}.`,
          });
        }
      }

      // Broadcast real-time update to both Patient Mobile and Staff Web
      ChatSocketServer.broadcastToSession(sessionId, {
        type: 'SHARED_NOTE_UPDATE',
        sessionId,
        sharedNote: note,
        timestamp: now,
      });

      res.json({
        success: true,
        message: 'Shared care notes saved and broadcast to patient.',
        note,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to save shared care notes.' });
    }
  }
}
