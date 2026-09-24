import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { DataStore } from '../db/dataStore';
import { PatientTimelineEvent } from '@phc-connect/types';

export class TimelineController {
  /**
   * Get unified communication & action timeline for a patient
   * GET /api/patients/:id/timeline
   */
  public static getPatientTimeline(req: AuthRequest, res: Response): void {
    try {
      const { id } = req.params;
      const { type } = req.query;

      const patient = DataStore.patients.find((p) => p.id === id || p.userId === id || p.phone === id);
      if (!patient) {
        res.status(404).json({ success: false, message: 'Patient not found.' });
        return;
      }

      const patientId = patient.id;
      const patientUserId = patient.userId;
      const patientPhone = patient.phone;

      const events: PatientTimelineEvent[] = [];

      // 1. Support Tickets
      const tickets = DataStore.supportTickets.filter(
        (t) => t.patientId === patientId || t.patientPhone === patientPhone
      );
      tickets.forEach((t) => {
        // Ticket Created Event
        events.push({
          id: `evt-tkt-create-${t.id}`,
          patientId,
          type: 'SUPPORT_TICKET',
          title: `Support Ticket Opened: ${t.ticketNumber}`,
          description: `${t.subject} • Priority: ${t.priority} • Tags: ${t.tags.join(', ')}`,
          timestamp: t.createdAt,
          actorName: t.creatorName,
          actorRole: t.creatorRole,
          badgeText: t.status,
          badgeVariant: t.status === 'RESOLVED' ? 'success' : t.status === 'ESCALATED' ? 'warning' : 'info',
          metadata: {
            ticketId: t.id,
            ticketNumber: t.ticketNumber,
            category: t.category,
            priority: t.priority,
            notes: t.notes,
            tags: t.tags,
            sharedCareNotes: t.sharedCareNotes,
          },
          linkId: t.id,
        });

        // Escalation Event if escalated
        if (t.escalatedDoctorId) {
          const escLog = t.actionLogs.find((l) => l.action.includes('ESCALATED'));
          events.push({
            id: `evt-tkt-esc-${t.id}`,
            patientId,
            type: 'DOCTOR_ESCALATION',
            title: `Escalated to Doctor: ${t.escalatedDoctorName || 'Medical Officer'}`,
            description: `Session escalated for clinical review (${t.escalatedDoctorSpecialization || 'Clinical Review'}). Details: ${t.notes}`,
            timestamp: escLog?.timestamp || t.updatedAt,
            actorName: escLog?.actorName || t.creatorName,
            actorRole: 'HEALTH_ASSISTANT',
            badgeText: 'Doctor Escalation',
            badgeVariant: 'purple',
            metadata: {
              ticketId: t.id,
              doctorId: t.escalatedDoctorId,
              doctorName: t.escalatedDoctorName,
            },
            linkId: t.id,
          });
        }

        // Ticket Resolved Event if resolved
        if (t.status === 'RESOLVED' && t.resolvedAt) {
          events.push({
            id: `evt-tkt-res-${t.id}`,
            patientId,
            type: 'SUPPORT_TICKET',
            title: `Support Ticket Resolved: ${t.ticketNumber}`,
            description: t.resolutionSummary || 'Resolved during remote on-call consultation.',
            timestamp: t.resolvedAt,
            actorName: t.assignedStaffName,
            actorRole: t.assignedStaffRole,
            badgeText: 'RESOLVED',
            badgeVariant: 'success',
            metadata: {
              ticketId: t.id,
              resolutionSummary: t.resolutionSummary,
            },
            linkId: t.id,
          });
        }
      });

      // 2. Shared Care Notes
      const notes = DataStore.sharedCareNotes.filter((n) => n.patientId === patientId);
      notes.forEach((n) => {
        events.push({
          id: `evt-note-${n.id}`,
          patientId,
          type: 'SHARED_NOTE_UPDATE',
          title: `Care & Lifestyle Advisory: ${n.title}`,
          description: `${n.summary} • Instructions: ${n.instructions.slice(0, 2).join('; ')}`,
          timestamp: n.updatedAt,
          actorName: n.authorName,
          actorRole: n.authorRole,
          badgeText: 'Shared Care Note',
          badgeVariant: 'emerald',
          metadata: {
            noteId: n.id,
            sessionId: n.sessionId,
            instructions: n.instructions,
            dietaryPrecautions: n.dietaryPrecautions,
            medicationNotes: n.medicationNotes,
            emergencyWarning: n.emergencyWarning,
          },
          linkId: n.sessionId,
        });
      });

      // 3. Voice Calls (Inbound, Outbound, WebRTC)
      const calls = DataStore.callLogs.filter(
        (c) =>
          c.callerPhone === patientPhone ||
          c.receiverPhone === patientPhone ||
          c.callerName.toLowerCase().includes(patient.fullName.toLowerCase()) ||
          c.receiverName.toLowerCase().includes(patient.fullName.toLowerCase())
      );
      calls.forEach((c) => {
        const mins = Math.floor(c.durationSeconds / 60);
        const secs = c.durationSeconds % 60;
        const durationFormatted = `${mins}m ${secs}s`;

        events.push({
          id: `evt-call-${c.id}`,
          patientId,
          type: 'VOICE_CALL',
          title: `${c.direction === 'INBOUND' ? 'Incoming Voice Call' : 'Outbound Telephony Call'}: ${c.receiverRole}`,
          description: `${c.purpose} • Duration: ${durationFormatted} • Outcome: ${c.outcome}`,
          timestamp: c.timestamp,
          actorName: c.direction === 'INBOUND' ? c.callerName : c.receiverName,
          actorRole: (c.direction === 'INBOUND' ? 'PATIENT' : 'HEALTH_ASSISTANT') as any,
          badgeText: c.outcome,
          badgeVariant: c.outcome === 'CONNECTED' ? 'success' : c.outcome === 'BUSY' ? 'warning' : 'danger',
          metadata: {
            callSessionId: c.callSessionId,
            durationSeconds: c.durationSeconds,
            durationFormatted,
            direction: c.direction,
            outcome: c.outcome,
            purpose: c.purpose,
          },
          linkId: c.id,
        });
      });

      // 4. Chat Sessions
      const sessions = DataStore.chatSessions.filter((s) => s.patientId === patientId);
      sessions.forEach((s) => {
        events.push({
          id: `evt-chat-${s.id}`,
          patientId,
          type: 'CHAT_SESSION',
          title: `Health Assistant Tele-Care Session`,
          description: `With ${s.assistantName} (${s.assistantRole}). Last update: "${s.lastMessage || 'Consultation started'}"`,
          timestamp: s.createdAt,
          actorName: s.assistantName,
          actorRole: 'HEALTH_ASSISTANT',
          badgeText: s.status,
          badgeVariant: s.status === 'ACTIVE' ? 'primary' : 'info',
          metadata: {
            sessionId: s.id,
            assistantId: s.assistantId,
            assistantName: s.assistantName,
            status: s.status,
          },
          linkId: s.id,
        });
      });

      // 5. Pre-Consultation Vitals & BMI
      const preConsults = DataStore.preConsultations.filter(
        (pc) => pc.patientId === patientId || pc.patientPhone === patientPhone
      );
      preConsults.forEach((pc) => {
        const bpText = pc.vitals.bpFormatted || (pc.vitals.bpSystolic ? `${pc.vitals.bpSystolic}/${pc.vitals.bpDiastolic} mmHg` : 'Not recorded');
        const bmiVal = pc.measurements.bmi || 'N/A';
        const bmiCat = pc.measurements.bmiCategory || 'Normal';

        events.push({
          id: `evt-pc-${pc.id}`,
          patientId,
          type: 'PRE_CHECKUP',
          title: `Pre-Consultation Vitals Recorded (${pc.checkupNumber})`,
          description: `BP: ${bpText} • Pulse: ${pc.vitals.pulseRate || '--'} bpm • BMI: ${bmiVal} (${bmiCat}) • Temp: ${pc.vitals.bodyTemperature || '--'}°C`,
          timestamp: pc.createdAt,
          actorName: pc.receptionistName,
          actorRole: 'RECEPTIONIST',
          badgeText: `BMI ${bmiVal}`,
          badgeVariant: bmiCat === 'Normal' ? 'success' : 'warning',
          metadata: {
            checkupId: pc.id,
            vitals: pc.vitals,
            measurements: pc.measurements,
          },
          linkId: pc.id,
        });
      });

      // 6. Medical Records / Doctor Consultations
      const records = DataStore.medicalRecords.filter((r) => r.patientId === patientId);
      records.forEach((r) => {
        const diagText = Array.isArray(r.diagnosis) ? r.diagnosis.join(', ') : 'General consultation';
        const complaintsText = Array.isArray(r.chiefComplaints) ? r.chiefComplaints.join(', ') : 'None';

        events.push({
          id: `evt-rec-${r.id}`,
          patientId,
          type: 'OPD_APPOINTMENT',
          title: `Clinical OPD Consultation: ${r.doctorName}`,
          description: `Diagnosis: ${diagText} • Symptoms: ${complaintsText} • Notes: ${r.doctorNotes || 'None'}`,
          timestamp: r.visitDate || r.createdAt || new Date().toISOString(),
          actorName: r.doctorName,
          actorRole: 'DOCTOR',
          badgeText: 'OPD Consult',
          badgeVariant: 'primary',
          metadata: {
            recordId: r.id,
            diagnosis: r.diagnosis,
            prescriptions: r.prescriptions,
            recommendedTests: r.recommendedTests,
          },
          linkId: r.id,
        });
      });

      // 7. Grievances / Complaints
      const complaints = DataStore.complaints.filter(
        (cp) => cp.userId === patientUserId || cp.userPhone === patientPhone
      );
      complaints.forEach((cp) => {
        events.push({
          id: `evt-cmp-${cp.id}`,
          patientId,
          type: 'COMPLAINT_LOG',
          title: `Grievance / Feedback Filed: ${cp.id}`,
          description: `${cp.subject} • Category: ${cp.category} • Priority: ${cp.priority}`,
          timestamp: cp.createdAt,
          actorName: cp.userName,
          actorRole: 'PATIENT',
          badgeText: cp.status,
          badgeVariant: cp.status === 'RESOLVED' ? 'success' : 'warning',
          metadata: {
            complaintId: cp.id,
            category: cp.category,
            status: cp.status,
          },
          linkId: cp.id,
        });
      });

      // Sort all events descending by timestamp
      events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Filter by type if requested
      let result = events;
      if (type && type !== 'ALL') {
        result = events.filter((e) => e.type === type);
      }

      res.json({
        success: true,
        patient: {
          id: patient.id,
          patientId: patient.patientId,
          name: patient.fullName,
          phone: patient.phone,
          age: patient.age,
          gender: patient.gender,
          bloodGroup: patient.bloodGroup,
        },
        totalEvents: result.length,
        timeline: result,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to construct patient timeline.' });
    }
  }
}
