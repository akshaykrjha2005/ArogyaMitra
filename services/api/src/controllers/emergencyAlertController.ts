import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { DataStore } from '../db/dataStore';
import {
  EmergencyPreAlert,
  EmergencyAuditEntry,
  EmergencyAlertStatus,
  EmergencySeverityLevel,
  EmergencyTransportMode,
  EmergencyVitals,
} from '@phc-connect/types';

export class EmergencyAlertController {
  /**
   * Helper: Calculate ETA string and remaining minutes
   */
  private static calculateLiveETA(alert: EmergencyPreAlert): {
    remainingMinutes: number;
    estimatedArrivalTimeFormatted: string;
    isOverdue: boolean;
  } {
    const departure = new Date(alert.departureTime).getTime();
    const estArrivalTimestamp = departure + alert.estimatedArrivalMinutes * 60 * 1000;
    const now = Date.now();
    const remainingMs = estArrivalTimestamp - now;
    const remainingMinutes = Math.max(0, Math.round(remainingMs / (60 * 1000)));
    const isOverdue = remainingMs < 0 && alert.status !== 'ARRIVED' && alert.status !== 'HANDED_OVER';

    const arrivalDate = new Date(estArrivalTimestamp);
    const estimatedArrivalTimeFormatted = arrivalDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    return {
      remainingMinutes,
      estimatedArrivalTimeFormatted,
      isOverdue,
    };
  }

  /**
   * 1. GET /api/emergency-alerts - List alerts with filters
   */
  public static async getAllAlerts(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        facilityId,
        status,
        severity,
        ashaWorkerId,
        activeOnly,
        search,
      } = req.query;

      let alerts = [...DataStore.emergencyPreAlerts];

      if (facilityId) {
        alerts = alerts.filter((a) => a.targetFacilityId === facilityId);
      }

      if (status && status !== 'ALL') {
        if (status === 'ACTIVE') {
          alerts = alerts.filter(
            (a) => a.status === 'ALERT_RAISED' || a.status === 'ACKNOWLEDGED' || a.status === 'IN_TRANSIT'
          );
        } else {
          alerts = alerts.filter((a) => a.status === status);
        }
      }

      if (activeOnly === 'true') {
        alerts = alerts.filter(
          (a) => a.status === 'ALERT_RAISED' || a.status === 'ACKNOWLEDGED' || a.status === 'IN_TRANSIT'
        );
      }

      if (severity && severity !== 'ALL') {
        alerts = alerts.filter((a) => a.severity === severity);
      }

      if (ashaWorkerId) {
        alerts = alerts.filter((a) => a.ashaWorkerId === ashaWorkerId);
      }

      if (search) {
        const q = String(search).toLowerCase();
        alerts = alerts.filter(
          (a) =>
            a.patientName.toLowerCase().includes(q) ||
            a.alertNumber.toLowerCase().includes(q) ||
            a.ashaWorkerName.toLowerCase().includes(q) ||
            a.sourceLocation.toLowerCase().includes(q) ||
            a.targetFacilityName.toLowerCase().includes(q) ||
            a.chiefComplaints.some((c) => c.toLowerCase().includes(q))
        );
      }

      // Sort: Active/Critical alerts first, then newest
      alerts.sort((a, b) => {
        const activeOrder: Record<EmergencyAlertStatus, number> = {
          ALERT_RAISED: 1,
          ACKNOWLEDGED: 2,
          IN_TRANSIT: 3,
          ARRIVED: 4,
          HANDED_OVER: 5,
          CANCELLED: 6,
        };
        const orderDiff = activeOrder[a.status] - activeOrder[b.status];
        if (orderDiff !== 0) return orderDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      // Enrich with live ETA
      const enrichedAlerts = alerts.map((alert) => {
        const liveEta = EmergencyAlertController.calculateLiveETA(alert);
        return {
          ...alert,
          liveEta,
        };
      });

      res.status(200).json({
        success: true,
        count: enrichedAlerts.length,
        alerts: enrichedAlerts,
      });
    } catch (error: any) {
      console.error('Error fetching emergency alerts:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch emergency alerts' });
    }
  }

  /**
   * 2. GET /api/emergency-alerts/:id - Single alert details with full timeline
   */
  public static async getAlertById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const alert = DataStore.emergencyPreAlerts.find(
        (a) => a.id === id || a.alertNumber === id
      );

      if (!alert) {
        res.status(404).json({ success: false, message: 'Emergency alert not found' });
        return;
      }

      const liveEta = EmergencyAlertController.calculateLiveETA(alert);
      const targetPHC = DataStore.phcs.find((p) => p.id === alert.targetFacilityId);

      res.status(200).json({
        success: true,
        alert: {
          ...alert,
          liveEta,
          targetPHC,
        },
      });
    } catch (error: any) {
      console.error('Error fetching emergency alert detail:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch emergency alert' });
    }
  }

  /**
   * 3. POST /api/emergency-alerts - ASHA worker raises an emergency pre-alert
   */
  public static async raiseEmergencyAlert(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        patientId,
        patientName,
        patientAge,
        patientGender,
        patientPhone,
        patientAbhaId,
        ashaWorkerId,
        ashaWorkerName,
        ashaWorkerPhone,
        sourceLocation,
        sourcePincode,
        targetFacilityId,
        chiefComplaints,
        symptomsDescription,
        vitals,
        severity,
        transportMode,
        ambulanceVehicleNumber,
        ambulanceContact,
        estimatedArrivalMinutes,
      } = req.body;

      if (!patientName || !targetFacilityId || !chiefComplaints || !sourceLocation) {
        res.status(400).json({
          success: false,
          message: 'Missing required emergency alert fields (patientName, targetFacilityId, chiefComplaints, sourceLocation)',
        });
        return;
      }

      const targetPHC = DataStore.phcs.find((p) => p.id === targetFacilityId) || DataStore.phcs[0];

      // Auto-escalate severity based on vital red flags if not already CRITICAL
      let calculatedSeverity: EmergencySeverityLevel = (severity as EmergencySeverityLevel) || 'SEVERE';
      const parsedVitals: EmergencyVitals = vitals || {};

      if (
        (parsedVitals.spO2 && parsedVitals.spO2 < 90) ||
        (parsedVitals.pulse && (parsedVitals.pulse > 130 || parsedVitals.pulse < 45)) ||
        (parsedVitals.gcsScore && parsedVitals.gcsScore < 12)
      ) {
        calculatedSeverity = 'CRITICAL';
      }

      const now = new Date();
      const seq = DataStore.emergencyPreAlerts.length + 1;
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const alertNumber = `EPA-${dateStr}-${String(seq).padStart(3, '0')}`;

      const estMins = Number(estimatedArrivalMinutes) || 15;
      const departureTime = now.toISOString();
      const estArrivalDate = new Date(now.getTime() + estMins * 60 * 1000);
      const estimatedArrivalTime = estArrivalDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      const workerId = ashaWorkerId || req.user?.assistantId || req.user?.id || 'asst-001';
      const workerName = ashaWorkerName || req.user?.fullName || 'ASHA Facilitator';
      const workerPhone = ashaWorkerPhone || req.user?.phone || '+91 98765 43230';

      const initialTimeline: EmergencyAuditEntry[] = [
        {
          id: `ae-${Date.now()}-1`,
          status: 'ALERT_RAISED',
          action: 'Emergency Pre-Alert Dispatched by ASHA Worker',
          performedBy: workerName,
          role: (req.user?.role as any) || 'HEALTH_ASSISTANT',
          timestamp: departureTime,
          notes: `Alert raised from ${sourceLocation} with ETA ${estMins} mins via ${transportMode || 'AMBULANCE_108'}. Severity: ${calculatedSeverity}.`,
          details: {
            vitals: parsedVitals,
            chiefComplaints,
          },
        },
      ];

      const newAlert: EmergencyPreAlert = {
        id: `alert-${Date.now()}`,
        alertNumber,
        patientId: patientId || null,
        patientName,
        patientAge: Number(patientAge) || 40,
        patientGender: patientGender || 'MALE',
        patientPhone: patientPhone || '',
        patientAbhaId: patientAbhaId || '',
        ashaWorkerId: workerId,
        ashaWorkerName: workerName,
        ashaWorkerPhone: workerPhone,
        sourceLocation,
        sourcePincode: sourcePincode || targetPHC.pincode,
        targetFacilityId: targetPHC.id,
        targetFacilityName: targetPHC.name,
        targetFacilityType: targetPHC.type,
        chiefComplaints: Array.isArray(chiefComplaints) ? chiefComplaints : [String(chiefComplaints)],
        symptomsDescription: symptomsDescription || 'Emergency incoming transfer requested.',
        vitals: parsedVitals,
        severity: calculatedSeverity,
        transportMode: (transportMode as EmergencyTransportMode) || 'AMBULANCE_108',
        ambulanceVehicleNumber: ambulanceVehicleNumber || (transportMode === 'AMBULANCE_108' ? 'DL-01-EM-108' : undefined),
        ambulanceContact: ambulanceContact || (transportMode === 'AMBULANCE_108' ? '108' : undefined),
        departureTime,
        estimatedArrivalMinutes: estMins,
        estimatedArrivalTime,
        status: 'ALERT_RAISED',
        acknowledgedByDoctorId: null,
        acknowledgedByDoctorName: null,
        acknowledgedAt: null,
        doctorPreparationInstructions: [],
        doctorPreparationNotes: null,
        bedAssigned: null,
        teamAssigned: null,
        arrivedAt: null,
        handedOverAt: null,
        handoverNotes: null,
        attendingPhysicianName: null,
        metrics: {
          responseTimeMinutes: null,
          transitTimeMinutes: null,
          totalDurationMinutes: null,
        },
        timeline: initialTimeline,
        deliveryStatus: {
          pushSent: true,
          smsSent: true,
          emailSent: true,
          broadcastAt: departureTime,
        },
        createdAt: departureTime,
        updatedAt: departureTime,
      };

      DataStore.emergencyPreAlerts.unshift(newAlert);

      // Dispatch real-time notifications to facility doctors and staff
      const targetDoctors = DataStore.doctors.filter(
        (d) => d.phcId === targetPHC.id || d.phcName === targetPHC.name
      );

      for (const doc of targetDoctors) {
        DataStore.notifications.unshift({
          id: `notif-${Date.now()}-${doc.id}`,
          userId: doc.userId,
          title: `🚨 EMERGENCY PRE-ALERT: ${patientName} (${calculatedSeverity})`,
          message: `Incoming ${calculatedSeverity} case from ${sourceLocation}. Live ETA: ${estMins} min. Complaints: ${newAlert.chiefComplaints.join(', ')}.`,
          type: 'EMERGENCY_PRE_ALERT',
          read: false,
          linkUrl: `/emergency-alerts/${newAlert.id}`,
          createdAt: departureTime,
        });
      }

      res.status(201).json({
        success: true,
        message: `Emergency pre-alert ${alertNumber} broadcasted successfully to ${targetPHC.name}`,
        alert: newAlert,
      });
    } catch (error: any) {
      console.error('Error raising emergency pre-alert:', error);
      res.status(500).json({ success: false, message: 'Failed to dispatch emergency pre-alert' });
    }
  }

  /**
   * 4. POST /api/emergency-alerts/:id/acknowledge - Doctor acknowledges & sends preparation instructions
   */
  public static async acknowledgeAlert(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const alert = DataStore.emergencyPreAlerts.find(
        (a) => a.id === id || a.alertNumber === id
      );

      if (!alert) {
        res.status(404).json({ success: false, message: 'Emergency alert not found' });
        return;
      }

      const {
        doctorPreparationInstructions,
        doctorPreparationNotes,
        bedAssigned,
        teamAssigned,
      } = req.body;

      const now = new Date();
      const ackTimestamp = now.toISOString();

      // Calculate Response Time (Raised -> Acknowledged)
      const raisedTime = new Date(alert.createdAt).getTime();
      const responseTimeMinutes = Math.max(1, Math.round((now.getTime() - raisedTime) / (60 * 1000)));

      const doctorId = req.user?.doctorId || req.user?.id || 'doc-001';
      const doctorName = req.user?.fullName || 'Dr. On-Duty Emergency Physician';

      const defaultInstructions = [
        'Keep High-Flow Oxygen & Suction apparatus ready',
        'Prepare 2 large-bore IV access lines (16G/18G)',
        'Alert on-duty emergency nursing staff and order bedside ECG/Monitor',
      ];

      const instructions = Array.isArray(doctorPreparationInstructions) && doctorPreparationInstructions.length > 0
        ? doctorPreparationInstructions
        : defaultInstructions;

      alert.status = 'ACKNOWLEDGED';
      alert.acknowledgedByDoctorId = doctorId;
      alert.acknowledgedByDoctorName = doctorName;
      alert.acknowledgedAt = ackTimestamp;
      alert.doctorPreparationInstructions = instructions;
      alert.doctorPreparationNotes = doctorPreparationNotes || `Triage team activated by ${doctorName}.`;
      alert.bedAssigned = bedAssigned || 'Emergency Bay Bed 1 (Red Zone)';
      alert.teamAssigned = teamAssigned || 'Emergency Rapid Response Team';
      alert.metrics.responseTimeMinutes = responseTimeMinutes;
      alert.updatedAt = ackTimestamp;

      // Add audit entry
      const auditEntry: EmergencyAuditEntry = {
        id: `ae-${Date.now()}-ack`,
        status: 'ACKNOWLEDGED',
        action: `Doctor Acknowledged & Triage Instructions Dispatched`,
        performedBy: doctorName,
        role: (req.user?.role as any) || 'DOCTOR',
        timestamp: ackTimestamp,
        notes: `Bed assigned: ${alert.bedAssigned}. Instructions: ${instructions.join('; ')}`,
        details: {
          instructions,
          responseTimeMinutes,
        },
      };

      alert.timeline.push(auditEntry);

      // Send instructions notification to ASHA worker so they can deliver en-route care
      DataStore.notifications.unshift({
        id: `notif-prep-${Date.now()}`,
        userId: `user-${alert.ashaWorkerId}`,
        title: `✅ Doctor Prepared: ${doctorName} Acknowledged`,
        message: `Doctor instructions for ${alert.patientName}: ${instructions.slice(0, 2).join(', ')}. Bed: ${alert.bedAssigned}.`,
        type: 'EMERGENCY_PREP_INSTRUCTIONS',
        read: false,
        linkUrl: `/emergency-alerts/${alert.id}`,
        createdAt: ackTimestamp,
      });

      res.status(200).json({
        success: true,
        message: `Emergency pre-alert acknowledged. Instructions sent to ASHA worker ${alert.ashaWorkerName}.`,
        alert,
        responseTimeMinutes,
      });
    } catch (error: any) {
      console.error('Error acknowledging emergency alert:', error);
      res.status(500).json({ success: false, message: 'Failed to acknowledge emergency alert' });
    }
  }

  /**
   * 5. PATCH /api/emergency-alerts/:id/status - Update transit/arrival status
   * Transitions: ALERT_RAISED -> ACKNOWLEDGED -> IN_TRANSIT -> ARRIVED -> HANDED_OVER
   */
  public static async updateAlertStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const alert = DataStore.emergencyPreAlerts.find(
        (a) => a.id === id || a.alertNumber === id
      );

      if (!alert) {
        res.status(404).json({ success: false, message: 'Emergency alert not found' });
        return;
      }

      const {
        status,
        notes,
        currentLocation,
        handoverNotes,
        attendingPhysicianName,
      } = req.body;

      if (!status) {
        res.status(400).json({ success: false, message: 'New status is required' });
        return;
      }

      const now = new Date();
      const timestamp = now.toISOString();
      const performerName = req.user?.fullName || 'Medical Staff';
      const performerRole = (req.user?.role as any) || 'STAFF';

      alert.status = status as EmergencyAlertStatus;
      alert.updatedAt = timestamp;

      if (status === 'IN_TRANSIT') {
        alert.timeline.push({
          id: `ae-${Date.now()}-transit`,
          status: 'IN_TRANSIT',
          action: 'Patient in Transit to Facility',
          performedBy: performerName,
          role: performerRole,
          timestamp,
          notes: notes || `Transport in progress${currentLocation ? ` near ${currentLocation}` : ''}.`,
        });
      } else if (status === 'ARRIVED') {
        alert.arrivedAt = timestamp;
        const depTime = new Date(alert.departureTime).getTime();
        const transitMins = Math.max(1, Math.round((now.getTime() - depTime) / (60 * 1000)));
        alert.metrics.transitTimeMinutes = transitMins;

        alert.timeline.push({
          id: `ae-${Date.now()}-arrived`,
          status: 'ARRIVED',
          action: 'Patient Arrived at Emergency Casualty Receiving Area',
          performedBy: performerName,
          role: performerRole,
          timestamp,
          notes: notes || `Patient received at casualty triage in ${transitMins} minutes.`,
        });
      } else if (status === 'HANDED_OVER') {
        alert.handedOverAt = timestamp;
        alert.handoverNotes = handoverNotes || notes || 'Clinical handover completed to emergency attending team.';
        alert.attendingPhysicianName = attendingPhysicianName || alert.acknowledgedByDoctorName || performerName;

        const raisedTime = new Date(alert.createdAt).getTime();
        const totalDurationMins = Math.max(1, Math.round((now.getTime() - raisedTime) / (60 * 1000)));
        alert.metrics.totalDurationMinutes = totalDurationMins;

        alert.timeline.push({
          id: `ae-${Date.now()}-handover`,
          status: 'HANDED_OVER',
          action: 'Clinical Handover Concluded & Patient Admitted',
          performedBy: performerName,
          role: performerRole,
          timestamp,
          notes: alert.handoverNotes,
          details: {
            totalDurationMinutes: totalDurationMins,
            attendingPhysician: alert.attendingPhysicianName,
          },
        });
      } else if (status === 'CANCELLED') {
        alert.timeline.push({
          id: `ae-${Date.now()}-cancel`,
          status: 'CANCELLED',
          action: 'Emergency Pre-Alert Cancelled',
          performedBy: performerName,
          role: performerRole,
          timestamp,
          notes: notes || 'Alert cancelled by originator.',
        });
      }

      res.status(200).json({
        success: true,
        message: `Alert status updated to ${status}`,
        alert,
      });
    } catch (error: any) {
      console.error('Error updating alert status:', error);
      res.status(500).json({ success: false, message: 'Failed to update alert status' });
    }
  }

  /**
   * 6. POST /api/emergency-alerts/:id/instructions - Add/Update doctor instructions
   */
  public static async updateInstructions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const alert = DataStore.emergencyPreAlerts.find(
        (a) => a.id === id || a.alertNumber === id
      );

      if (!alert) {
        res.status(404).json({ success: false, message: 'Emergency alert not found' });
        return;
      }

      const { instructions, notes } = req.body;

      if (Array.isArray(instructions)) {
        alert.doctorPreparationInstructions = instructions;
      }
      if (notes) {
        alert.doctorPreparationNotes = notes;
      }

      alert.updatedAt = new Date().toISOString();

      res.status(200).json({
        success: true,
        message: 'Doctor instructions updated',
        instructions: alert.doctorPreparationInstructions,
        notes: alert.doctorPreparationNotes,
      });
    } catch (error: any) {
      console.error('Error updating instructions:', error);
      res.status(500).json({ success: false, message: 'Failed to update instructions' });
    }
  }

  /**
   * 7. GET /api/emergency-alerts/active/facility/:facilityId - Live incoming alerts for doctor dashboard
   */
  public static async getActiveFacilityAlerts(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { facilityId } = req.params;

      const activeAlerts = DataStore.emergencyPreAlerts
        .filter(
          (a) =>
            a.targetFacilityId === facilityId &&
            (a.status === 'ALERT_RAISED' || a.status === 'ACKNOWLEDGED' || a.status === 'IN_TRANSIT')
        )
        .map((alert) => ({
          ...alert,
          liveEta: EmergencyAlertController.calculateLiveETA(alert),
        }));

      res.status(200).json({
        success: true,
        count: activeAlerts.length,
        hasCriticalAlert: activeAlerts.some((a) => a.severity === 'CRITICAL'),
        alerts: activeAlerts,
      });
    } catch (error: any) {
      console.error('Error fetching active facility alerts:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch active facility alerts' });
    }
  }

  /**
   * 8. GET /api/emergency-alerts/analytics/metrics - Emergency KPIs
   */
  public static async getMetrics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const alerts = DataStore.emergencyPreAlerts;

      const totalAlerts = alerts.length;
      const activeIncomingAlerts = alerts.filter(
        (a) => a.status === 'ALERT_RAISED' || a.status === 'ACKNOWLEDGED' || a.status === 'IN_TRANSIT'
      ).length;
      const criticalCases = alerts.filter((a) => a.severity === 'CRITICAL').length;
      const handedOverCount = alerts.filter((a) => a.status === 'HANDED_OVER').length;

      const responseTimes = alerts
        .map((a) => a.metrics?.responseTimeMinutes)
        .filter((t): t is number => typeof t === 'number');

      const transitTimes = alerts
        .map((a) => a.metrics?.transitTimeMinutes)
        .filter((t): t is number => typeof t === 'number');

      const avgResponseTimeMinutes =
        responseTimes.length > 0
          ? Math.round((responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) * 10) / 10
          : 0;

      const avgTransitTimeMinutes =
        transitTimes.length > 0
          ? Math.round((transitTimes.reduce((a, b) => a + b, 0) / transitTimes.length) * 10) / 10
          : 0;

      res.status(200).json({
        success: true,
        metrics: {
          totalAlerts,
          activeIncomingAlerts,
          criticalCases,
          handedOverCount,
          avgResponseTimeMinutes,
          avgTransitTimeMinutes,
        },
      });
    } catch (error: any) {
      console.error('Error fetching emergency metrics:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch metrics' });
    }
  }
}
