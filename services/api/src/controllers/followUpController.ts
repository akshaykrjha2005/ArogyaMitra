import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { DataStore } from '../db/dataStore';
import {
  PatientFollowUpEntry,
  FollowUpTimelineEvent,
  FollowUpStatus,
  PatientConditionState,
  ReferralTreatmentStatus,
  MedicationAdherenceLevel,
  Notification,
} from '@phc-connect/types';

export class FollowUpController {
  /**
   * Helper: Check and update overdue status based on current date
   */
  private static updateOverdueStatus(entry: PatientFollowUpEntry): PatientFollowUpEntry {
    if (entry.status === 'COMPLETED' || entry.status === 'CANCELLED') {
      entry.isOverdue = false;
      return entry;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    if (entry.scheduledDueDate < todayStr) {
      entry.status = 'OVERDUE';
      entry.isOverdue = true;
      const diffMs = new Date(todayStr).getTime() - new Date(entry.scheduledDueDate).getTime();
      entry.daysOverdue = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    } else {
      entry.status = 'PENDING';
      entry.isOverdue = false;
      entry.daysOverdue = 0;
    }
    return entry;
  }

  /**
   * 1. GET /api/follow-ups - List follow-ups with filters
   */
  public static async getAllFollowUps(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        village,
        condition,
        category,
        status,
        treatmentStatus,
        ashaWorkerId,
        facilityId,
        search,
      } = req.query;

      let entries = DataStore.patientFollowUps.map((e) => FollowUpController.updateOverdueStatus(e));

      if (village && village !== 'ALL') {
        entries = entries.filter((e) => e.patientVillage.toLowerCase() === String(village).toLowerCase());
      }

      if (condition && condition !== 'ALL') {
        entries = entries.filter((e) => e.condition.toLowerCase().includes(String(condition).toLowerCase()));
      }

      if (category && category !== 'ALL') {
        entries = entries.filter((e) => e.category === category);
      }

      if (status && status !== 'ALL') {
        entries = entries.filter((e) => e.status === status);
      }

      if (treatmentStatus && treatmentStatus !== 'ALL') {
        entries = entries.filter((e) => e.referralTreatmentStatus === treatmentStatus);
      }

      if (ashaWorkerId) {
        entries = entries.filter((e) => e.ashaWorkerId === ashaWorkerId);
      }

      if (facilityId) {
        entries = entries.filter((e) => e.referringPhcId === facilityId || e.higherPhcId === facilityId);
      }

      if (search) {
        const q = String(search).toLowerCase();
        entries = entries.filter(
          (e) =>
            e.patientName.toLowerCase().includes(q) ||
            e.condition.toLowerCase().includes(q) ||
            e.patientVillage.toLowerCase().includes(q) ||
            e.ashaWorkerName.toLowerCase().includes(q) ||
            (e.patientAbhaId && e.patientAbhaId.toLowerCase().includes(q))
        );
      }

      // Sort: Overdue first, then by scheduled date ascending
      entries.sort((a, b) => {
        if (a.status === 'OVERDUE' && b.status !== 'OVERDUE') return -1;
        if (b.status === 'OVERDUE' && a.status !== 'OVERDUE') return 1;
        return new Date(a.scheduledDueDate).getTime() - new Date(b.scheduledDueDate).getTime();
      });

      res.status(200).json({
        success: true,
        count: entries.length,
        followUps: entries,
      });
    } catch (error: any) {
      console.error('Error fetching follow-ups:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch follow-ups' });
    }
  }

  /**
   * 2. GET /api/follow-ups/:id - Single follow-up detail
   */
  public static async getFollowUpById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const entry = DataStore.patientFollowUps.find((e) => e.id === id || e.referralId === id);

      if (!entry) {
        res.status(404).json({ success: false, message: 'Follow-up record not found' });
        return;
      }

      FollowUpController.updateOverdueStatus(entry);

      res.status(200).json({
        success: true,
        followUp: entry,
      });
    } catch (error: any) {
      console.error('Error fetching follow-up:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch follow-up detail' });
    }
  }

  /**
   * 3. GET /api/follow-ups/patient/:patientId - Full patient referral & follow-up history
   */
  public static async getPatientFollowUpHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;
      const entries = DataStore.patientFollowUps
        .filter((e) => e.patientId === patientId)
        .map((e) => FollowUpController.updateOverdueStatus(e));

      // Aggregate all timeline events across referral records
      const allTimelineEvents: FollowUpTimelineEvent[] = [];
      for (const e of entries) {
        allTimelineEvents.push(...e.timeline);
      }

      allTimelineEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      res.status(200).json({
        success: true,
        patientId,
        count: entries.length,
        followUps: entries,
        timeline: allTimelineEvents,
      });
    } catch (error: any) {
      console.error('Error fetching patient follow-up history:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch patient history' });
    }
  }

  /**
   * 4. POST /api/follow-ups - ASHA worker logs a follow-up visit
   */
  public static async logFollowUp(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        referralId,
        id,
        followUpDate,
        conditionUpdate,
        vitals,
        medicinesTaken,
        adherenceRate,
        nextVisitDate,
        notes,
      } = req.body;

      const targetId = id || referralId;
      let entry = DataStore.patientFollowUps.find((e) => e.id === targetId || e.referralId === targetId);

      if (!entry) {
        res.status(404).json({ success: false, message: 'Referral follow-up record not found' });
        return;
      }

      const now = new Date();
      const actualFollowUpDate = followUpDate || now.toISOString().slice(0, 10);
      const performerName = req.user?.fullName || entry.ashaWorkerName || 'ASHA Worker';

      entry.followUpDate = actualFollowUpDate;
      entry.conditionUpdate = (conditionUpdate as PatientConditionState) || 'STABLE';
      if (vitals) entry.vitals = vitals;
      if (Array.isArray(medicinesTaken)) entry.medicinesTaken = medicinesTaken;
      if (adherenceRate) entry.adherenceRate = adherenceRate as MedicationAdherenceLevel;
      entry.nextVisitDate = nextVisitDate || null;
      entry.notes = notes || entry.notes;
      entry.status = 'COMPLETED';
      entry.isOverdue = false;
      entry.updatedAt = now.toISOString();

      // Append to shared timeline
      const timelineEvent: FollowUpTimelineEvent = {
        id: `fup-tl-${Date.now()}`,
        type: 'ASHA_FOLLOW_UP_LOGGED',
        title: `Home Follow-up Visit Logged (${entry.conditionUpdate})`,
        description: `Condition: ${entry.conditionUpdate}. Adherence: ${entry.adherenceRate}. ${entry.notes}`,
        performedBy: performerName,
        role: (req.user?.role as any) || 'HEALTH_ASSISTANT',
        facilityName: entry.patientVillage,
        timestamp: now.toISOString(),
        notes: entry.notes,
        metadata: {
          vitals: entry.vitals,
          medicinesTaken: entry.medicinesTaken,
          nextVisitDate: entry.nextVisitDate,
        },
      };

      entry.timeline.push(timelineEvent);

      // If nextVisitDate is provided, create a chained follow-up entry for the future
      if (nextVisitDate && nextVisitDate > actualFollowUpDate) {
        const nextEntry: PatientFollowUpEntry = {
          id: `fup-${Date.now()}`,
          referralId: entry.referralId,
          patientId: entry.patientId,
          patientName: entry.patientName,
          patientAge: entry.patientAge,
          patientGender: entry.patientGender,
          patientPhone: entry.patientPhone,
          patientAbhaId: entry.patientAbhaId,
          patientVillage: entry.patientVillage,
          patientAddress: entry.patientAddress,
          ashaWorkerId: entry.ashaWorkerId,
          ashaWorkerName: entry.ashaWorkerName,
          ashaWorkerPhone: entry.ashaWorkerPhone,
          referringPhcId: entry.referringPhcId,
          referringPhcName: entry.referringPhcName,
          higherPhcId: entry.higherPhcId,
          higherPhcName: entry.higherPhcName,
          condition: entry.condition,
          category: entry.category,
          referralDate: entry.referralDate,
          referralReason: entry.referralReason,
          referralTreatmentStatus: entry.referralTreatmentStatus,
          higherPhcDoctorId: entry.higherPhcDoctorId,
          higherPhcDoctorName: entry.higherPhcDoctorName,
          higherPhcDoctorNotes: entry.higherPhcDoctorNotes,
          higherPhcUpdatedAt: entry.higherPhcUpdatedAt,
          scheduledDueDate: nextVisitDate,
          followUpDate: null,
          nextVisitDate: null,
          status: 'PENDING',
          isOverdue: false,
          conditionUpdate: entry.conditionUpdate,
          vitals: null,
          medicinesTaken: entry.medicinesTaken,
          adherenceRate: entry.adherenceRate,
          notes: `Scheduled next checkup after visit on ${actualFollowUpDate}.`,
          reminderSent: false,
          reminderSentAt: null,
          timeline: [...entry.timeline],
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };

        DataStore.patientFollowUps.push(nextEntry);
      }

      res.status(200).json({
        success: true,
        message: 'Patient follow-up successfully logged and shared record updated',
        followUp: entry,
      });
    } catch (error: any) {
      console.error('Error logging follow-up:', error);
      res.status(500).json({ success: false, message: 'Failed to log patient follow-up' });
    }
  }

  /**
   * 5. POST /api/follow-ups/referrals - Create a new referral tracking record
   */
  public static async createReferral(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        patientId,
        patientName,
        patientAge,
        patientGender,
        patientPhone,
        patientAbhaId,
        patientVillage,
        patientAddress,
        ashaWorkerId,
        ashaWorkerName,
        referringPhcId,
        referringPhcName,
        higherPhcId,
        higherPhcName,
        condition,
        category,
        referralReason,
        scheduledDueDate,
        medicinesTaken,
      } = req.body;

      if (!patientName || !condition || !higherPhcId) {
        res.status(400).json({ success: false, message: 'Missing required referral fields' });
        return;
      }

      const now = new Date();
      const referralId = `ref-${Date.now()}`;
      const entryId = `fup-${Date.now()}`;
      const dueDate = scheduledDueDate || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const initialTimeline: FollowUpTimelineEvent[] = [
        {
          id: `fup-tl-${Date.now()}-init`,
          type: 'REFERRAL_INITIATED',
          title: 'Referral Initiated to Higher Facility',
          description: `Patient referred to ${higherPhcName || 'Higher PHC/CHC'} for ${condition}. Reason: ${referralReason || 'Specialist Evaluation'}`,
          performedBy: req.user?.fullName || ashaWorkerName || 'ASHA Worker',
          role: (req.user?.role as any) || 'HEALTH_ASSISTANT',
          facilityName: referringPhcName || 'Sub-Centre',
          timestamp: now.toISOString(),
        },
      ];

      const newEntry: PatientFollowUpEntry = {
        id: entryId,
        referralId,
        patientId: patientId || `pat-${Date.now()}`,
        patientName,
        patientAge: Number(patientAge) || 35,
        patientGender: patientGender || 'MALE',
        patientPhone: patientPhone || '',
        patientAbhaId: patientAbhaId || '',
        patientVillage: patientVillage || 'Local Village',
        patientAddress: patientAddress || '',
        ashaWorkerId: ashaWorkerId || req.user?.assistantId || 'asst-001',
        ashaWorkerName: ashaWorkerName || req.user?.fullName || 'Sunita Devi',
        ashaWorkerPhone: req.user?.phone || '+91 98765 43230',
        referringPhcId: referringPhcId || 'phc-001',
        referringPhcName: referringPhcName || 'Primary Sub-Centre',
        higherPhcId,
        higherPhcName: higherPhcName || 'Central Urban PHC',
        condition,
        category: category || 'GENERAL',
        referralDate: now.toISOString(),
        referralReason: referralReason || 'Clinical referral for higher level treatment',
        referralTreatmentStatus: 'REFERRED',
        higherPhcDoctorId: null,
        higherPhcDoctorName: null,
        higherPhcDoctorNotes: null,
        higherPhcUpdatedAt: null,
        scheduledDueDate: dueDate,
        followUpDate: null,
        nextVisitDate: null,
        status: 'PENDING',
        isOverdue: false,
        conditionUpdate: 'STABLE',
        vitals: null,
        medicinesTaken: Array.isArray(medicinesTaken) ? medicinesTaken : [],
        adherenceRate: 'FULL',
        notes: 'Initial referral registered. Scheduled for first follow-up.',
        reminderSent: false,
        reminderSentAt: null,
        timeline: initialTimeline,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      DataStore.patientFollowUps.unshift(newEntry);

      res.status(201).json({
        success: true,
        message: 'Referral and follow-up tracking record initiated successfully',
        followUp: newEntry,
      });
    } catch (error: any) {
      console.error('Error creating referral:', error);
      res.status(500).json({ success: false, message: 'Failed to create referral' });
    }
  }

  /**
   * 6. PATCH /api/follow-ups/referrals/:id/treatment-status - Higher PHC updates treatment status
   */
  public static async updateTreatmentStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        referralTreatmentStatus,
        higherPhcDoctorNotes,
        doctorName,
        medicinesPrescribed,
      } = req.body;

      const entries = DataStore.patientFollowUps.filter((e) => e.referralId === id || e.id === id);

      if (entries.length === 0) {
        res.status(404).json({ success: false, message: 'Referral record not found' });
        return;
      }

      const now = new Date();
      const docName = doctorName || req.user?.fullName || 'Higher PHC Specialist';
      const docId = req.user?.doctorId || req.user?.id || 'doc-001';

      for (const entry of entries) {
        entry.referralTreatmentStatus = (referralTreatmentStatus as ReferralTreatmentStatus) || entry.referralTreatmentStatus;
        entry.higherPhcDoctorId = docId;
        entry.higherPhcDoctorName = docName;
        entry.higherPhcDoctorNotes = higherPhcDoctorNotes || entry.higherPhcDoctorNotes;
        entry.higherPhcUpdatedAt = now.toISOString();
        entry.updatedAt = now.toISOString();

        if (Array.isArray(medicinesPrescribed) && medicinesPrescribed.length > 0) {
          entry.medicinesTaken = medicinesPrescribed;
        }

        entry.timeline.push({
          id: `fup-tl-${Date.now()}-doc`,
          type: 'TREATMENT_STATUS_UPDATE',
          title: `Higher PHC Clinical Status: ${entry.referralTreatmentStatus.replace('_', ' ')}`,
          description: `Updated by ${docName}. Notes: ${higherPhcDoctorNotes || 'Clinical status reviewed.'}`,
          performedBy: docName,
          role: (req.user?.role as any) || 'DOCTOR',
          facilityName: entry.higherPhcName,
          timestamp: now.toISOString(),
          notes: higherPhcDoctorNotes,
        });

        // Notify assigned ASHA worker of hospital update
        DataStore.notifications.unshift({
          id: `notif-ref-update-${Date.now()}`,
          userId: `user-${entry.ashaWorkerId}`,
          title: `🏥 Referral Update: ${entry.patientName}`,
          message: `${entry.higherPhcName} updated treatment status to ${entry.referralTreatmentStatus.replace('_', ' ')}. Check shared notes for follow-up.`,
          type: 'COMPLAINT_UPDATE',
          read: false,
          linkUrl: `/follow-ups/${entry.id}`,
          createdAt: now.toISOString(),
        });
      }

      res.status(200).json({
        success: true,
        message: 'Shared treatment status updated across referral network',
        updatedRecordsCount: entries.length,
        referralTreatmentStatus,
      });
    } catch (error: any) {
      console.error('Error updating treatment status:', error);
      res.status(500).json({ success: false, message: 'Failed to update treatment status' });
    }
  }

  /**
   * 7. POST /api/follow-ups/reminders/trigger - Automatic reminder batch for due & overdue follow-ups
   */
  public static async triggerFollowUpReminders(req: AuthRequest, res: Response): Promise<void> {
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const dueOrOverdue = DataStore.patientFollowUps.filter(
        (e) => (e.status === 'PENDING' || e.status === 'OVERDUE') && e.scheduledDueDate <= todayStr
      );

      let triggeredCount = 0;
      const now = new Date();

      for (const entry of dueOrOverdue) {
        entry.reminderSent = true;
        entry.reminderSentAt = now.toISOString();
        triggeredCount++;

        DataStore.notifications.unshift({
          id: `notif-fup-${Date.now()}-${triggeredCount}`,
          userId: `user-${entry.ashaWorkerId}`,
          title: `⏰ Follow-up Due: ${entry.patientName} (${entry.patientVillage})`,
          message: `Scheduled follow-up for ${entry.patientName} (${entry.condition}) is due on ${entry.scheduledDueDate}. Please log condition & medication adherence.`,
          type: 'FOLLOW_UP_DUE_REMINDER',
          read: false,
          linkUrl: `/follow-ups/${entry.id}`,
          createdAt: now.toISOString(),
        });

        entry.timeline.push({
          id: `fup-tl-${Date.now()}-remind`,
          type: 'FOLLOW_UP_REMINDER_SENT',
          title: 'Automated Follow-up Reminder Dispatched',
          description: `Reminder delivered to ASHA ${entry.ashaWorkerName} for scheduled due date ${entry.scheduledDueDate}.`,
          performedBy: 'Automated Reminder Engine',
          role: 'SYSTEM',
          timestamp: now.toISOString(),
        });
      }

      res.status(200).json({
        success: true,
        message: `Successfully dispatched reminders for ${triggeredCount} due/overdue follow-ups`,
        triggeredCount,
      });
    } catch (error: any) {
      console.error('Error triggering follow-up reminders:', error);
      res.status(500).json({ success: false, message: 'Failed to trigger follow-up reminders' });
    }
  }

  public static triggerDueReminders = FollowUpController.triggerFollowUpReminders;

  /**
   * 8. GET /api/follow-ups/export/csv - Export follow-up tracking data to CSV
   */
  public static async exportCsv(req: AuthRequest, res: Response): Promise<void> {
    try {
      const entries = DataStore.patientFollowUps.map((e) => FollowUpController.updateOverdueStatus(e));

      // Header columns
      const headers = [
        'Referral_ID',
        'Patient_Name',
        'Age',
        'Gender',
        'Village',
        'Phone',
        'ABHA_ID',
        'Condition',
        'Category',
        'Referring_PHC',
        'Higher_PHC',
        'Referral_Treatment_Status',
        'Scheduled_Due_Date',
        'Follow_Up_Date',
        'Next_Visit_Date',
        'Follow_Up_Status',
        'Condition_Update',
        'Blood_Pressure',
        'Pulse',
        'SpO2',
        'Blood_Sugar',
        'Adherence_Rate',
        'ASHA_Worker',
        'ASHA_Notes',
      ];

      const rows = entries.map((e) => [
        `"${e.referralId}"`,
        `"${e.patientName.replace(/"/g, '""')}"`,
        e.patientAge,
        `"${e.patientGender}"`,
        `"${e.patientVillage.replace(/"/g, '""')}"`,
        `"${e.patientPhone || ''}"`,
        `"${e.patientAbhaId || ''}"`,
        `"${e.condition.replace(/"/g, '""')}"`,
        `"${e.category}"`,
        `"${e.referringPhcName.replace(/"/g, '""')}"`,
        `"${e.higherPhcName.replace(/"/g, '""')}"`,
        `"${e.referralTreatmentStatus}"`,
        `"${e.scheduledDueDate}"`,
        `"${e.followUpDate || ''}"`,
        `"${e.nextVisitDate || ''}"`,
        `"${e.status}"`,
        `"${e.conditionUpdate || ''}"`,
        `"${e.vitals?.bp || ''}"`,
        e.vitals?.pulse || '',
        e.vitals?.spO2 || '',
        e.vitals?.bloodSugar || '',
        `"${e.adherenceRate}"`,
        `"${e.ashaWorkerName.replace(/"/g, '""')}"`,
        `"${(e.notes || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=patient_followups_${Date.now()}.csv`);
      res.status(200).send(csvContent);
    } catch (error: any) {
      console.error('Error exporting CSV:', error);
      res.status(500).json({ success: false, message: 'Failed to export CSV' });
    }
  }

  /**
   * 9. GET /api/follow-ups/analytics/metrics - Aggregated Follow-up KPIs
   */
  public static async getMetrics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const entries = DataStore.patientFollowUps.map((e) => FollowUpController.updateOverdueStatus(e));

      const totalReferrals = entries.length;
      const pendingFollowUps = entries.filter((e) => e.status === 'PENDING').length;
      const overdueFollowUps = entries.filter((e) => e.status === 'OVERDUE').length;
      const completedFollowUps = entries.filter((e) => e.status === 'COMPLETED').length;

      const fullAdherenceCount = entries.filter((e) => e.adherenceRate === 'FULL').length;
      const adherenceRatePercent =
        totalReferrals > 0 ? Math.round((fullAdherenceCount / totalReferrals) * 100) : 100;

      const villageBreakdown: Record<string, number> = {};
      for (const e of entries) {
        const v = e.patientVillage || 'Unknown';
        villageBreakdown[v] = (villageBreakdown[v] || 0) + 1;
      }

      res.status(200).json({
        success: true,
        metrics: {
          totalReferrals,
          pendingFollowUps,
          overdueFollowUps,
          completedFollowUps,
          fullAdherenceCount,
          adherenceRatePercent,
          villageBreakdown,
        },
      });
    } catch (error: any) {
      console.error('Error fetching follow-up metrics:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch follow-up metrics' });
    }
  }
}
