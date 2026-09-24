import { Request, Response } from 'express';
import { DataStore } from '../db/dataStore';
import { AuthRequest } from '../middleware/auth';
import {
  HealthCamp,
  HealthCampRegistration,
  HealthCampOutcome,
  HealthCampType,
  HealthCampStatus,
  CampRegistrationStatus,
  HealthCampAnalytics,
} from '@phc-connect/types';

export class HealthCampController {
  /**
   * 1. GET /api/camps - Browse and search camps with rich filters
   */
  public static async getAllCamps(req: Request, res: Response): Promise<void> {
    try {
      const {
        type,
        status,
        phcId,
        location,
        upcomingOnly,
        assignedAssistantId,
        assignedDoctorId,
        search,
      } = req.query;

      let camps = [...DataStore.healthCamps];

      if (type && type !== 'ALL') {
        camps = camps.filter((c) => c.type === type);
      }

      if (status && status !== 'ALL') {
        camps = camps.filter((c) => c.status === status);
      }

      if (upcomingOnly === 'true') {
        camps = camps.filter((c) => c.status === 'UPCOMING' || c.status === 'ONGOING');
      }

      if (phcId) {
        camps = camps.filter((c) => c.phcId === phcId);
      }

      if (assignedAssistantId) {
        camps = camps.filter((c) => c.assignedAssistantId === assignedAssistantId);
      }

      if (assignedDoctorId) {
        camps = camps.filter((c) => c.assignedDoctorId === assignedDoctorId);
      }

      if (location) {
        const locLower = String(location).toLowerCase();
        camps = camps.filter(
          (c) =>
            c.venue.toLowerCase().includes(locLower) ||
            c.address.toLowerCase().includes(locLower) ||
            c.phcName.toLowerCase().includes(locLower)
        );
      }

      if (search) {
        const query = String(search).toLowerCase();
        camps = camps.filter(
          (c) =>
            c.title.toLowerCase().includes(query) ||
            c.description.toLowerCase().includes(query) ||
            c.venue.toLowerCase().includes(query) ||
            c.servicesOffered.some((s) => s.toLowerCase().includes(query)) ||
            (c.assignedAssistantName && c.assignedAssistantName.toLowerCase().includes(query)) ||
            (c.assignedDoctorName && c.assignedDoctorName.toLowerCase().includes(query))
        );
      }

      // Sort by startDate (upcoming/ongoing first, then completed)
      camps.sort((a, b) => {
        if (a.status === 'UPCOMING' && b.status !== 'UPCOMING') return -1;
        if (a.status !== 'UPCOMING' && b.status === 'UPCOMING') return 1;
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      });

      res.status(200).json({
        success: true,
        camps,
        count: camps.length,
      });
    } catch (error: any) {
      console.error('Error fetching health camps:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve health camps' });
    }
  }

  /**
   * 2. GET /api/camps/:id - Get detailed camp info including linked health assistant & capacity stats
   */
  public static async getCampById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const camp = DataStore.healthCamps.find((c) => c.id === id || c.campId === id);

      if (!camp) {
        res.status(404).json({ success: false, message: 'Health camp not found' });
        return;
      }

      const assignedAssistant = camp.assignedAssistantId
        ? DataStore.healthAssistants.find((a) => a.id === camp.assignedAssistantId)
        : null;

      const assignedDoctor = camp.assignedDoctorId
        ? DataStore.doctors.find((d) => d.id === camp.assignedDoctorId)
        : null;

      const registrations = DataStore.campRegistrations.filter((r) => r.campId === camp.id);
      const remainingSpots = Math.max(0, camp.capacity - camp.registeredCount);

      res.status(200).json({
        success: true,
        camp,
        assignedAssistant,
        assignedDoctor,
        registeredCount: camp.registeredCount,
        capacity: camp.capacity,
        remainingSpots,
        isFull: camp.registeredCount >= camp.capacity,
        registrationsCount: registrations.length,
      });
    } catch (error: any) {
      console.error('Error fetching camp details:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve camp details' });
    }
  }

  /**
   * 3. POST /api/camps - Create a new health camp (Staff, ASHA, Doctor, Admin)
   */
  public static async createCamp(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        title,
        description,
        type,
        startDate,
        endDate,
        time,
        venue,
        address,
        pincode,
        phcId,
        capacity,
        assignedAssistantId,
        assignedDoctorId,
        servicesOffered,
        eligibility,
        bannerImage,
        contactPhone,
      } = req.body;

      if (!title || !type || !startDate || !venue || !capacity) {
        res.status(400).json({
          success: false,
          message: 'Title, camp type, start date, venue, and capacity are required fields',
        });
        return;
      }

      const phc = DataStore.phcs.find((p) => p.id === phcId) || DataStore.phcs[0];

      let assignedAssistantName: string | undefined = undefined;
      let assignedAssistantRole: string | undefined = undefined;
      if (assignedAssistantId) {
        const assistant = DataStore.healthAssistants.find((a) => a.id === assignedAssistantId);
        if (assistant) {
          assignedAssistantName = assistant.fullName;
          assignedAssistantRole = assistant.designation;
        }
      }

      let assignedDoctorName: string | undefined = undefined;
      let assignedDoctorSpeciality: string | undefined = undefined;
      if (assignedDoctorId) {
        const doctor = DataStore.doctors.find((d) => d.id === assignedDoctorId);
        if (doctor) {
          assignedDoctorName = doctor.fullName;
          assignedDoctorSpeciality = doctor.specialization;
        }
      }

      const campCount = DataStore.healthCamps.length + 1;
      const newCamp: HealthCamp = {
        id: `camp-${Date.now()}`,
        campId: `CAMP-2026-${campCount.toString().padStart(3, '0')}`,
        title,
        description: description || `Community Health Camp for ${title}`,
        type: type as HealthCampType,
        status: 'UPCOMING',
        startDate,
        endDate: endDate || startDate,
        time: time || '09:00 AM - 03:00 PM',
        venue,
        address: address || venue,
        pincode: pincode || phc.pincode,
        phcId: phc.id,
        phcName: phc.name,
        latitude: phc.latitude,
        longitude: phc.longitude,
        capacity: Number(capacity),
        registeredCount: 0,
        assignedAssistantId: assignedAssistantId || null,
        assignedAssistantName: assignedAssistantName || null,
        assignedAssistantRole: assignedAssistantRole || null,
        assignedDoctorId: assignedDoctorId || null,
        assignedDoctorName: assignedDoctorName || null,
        assignedDoctorSpeciality: assignedDoctorSpeciality || null,
        organizerRole: (req.user?.role as any) || 'ASHA',
        organizerName: req.user?.fullName || 'ASHA Worker',
        contactPhone: contactPhone || phc.phone,
        bannerImage:
          bannerImage ||
          'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&auto=format&fit=crop&q=80',
        servicesOffered: Array.isArray(servicesOffered)
          ? servicesOffered
          : typeof servicesOffered === 'string'
          ? servicesOffered.split(',').map((s: string) => s.trim())
          : ['General Screening & Checkup', 'Free Medication Dispensation'],
        eligibility: eligibility || 'Open to all local residents',
        outcome: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      DataStore.healthCamps.unshift(newCamp);

      res.status(201).json({
        success: true,
        message: 'Health camp created successfully',
        camp: newCamp,
      });
    } catch (error: any) {
      console.error('Error creating health camp:', error);
      res.status(500).json({ success: false, message: 'Failed to create health camp' });
    }
  }

  /**
   * 4. PUT /api/camps/:id - Update health camp details
   */
  public static async updateCamp(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const campIndex = DataStore.healthCamps.findIndex((c) => c.id === id || c.campId === id);

      if (campIndex === -1) {
        res.status(404).json({ success: false, message: 'Health camp not found' });
        return;
      }

      const existing = DataStore.healthCamps[campIndex];
      const updates = req.body;

      if (updates.assignedAssistantId && updates.assignedAssistantId !== existing.assignedAssistantId) {
        const assistant = DataStore.healthAssistants.find((a) => a.id === updates.assignedAssistantId);
        if (assistant) {
          updates.assignedAssistantName = assistant.fullName;
          updates.assignedAssistantRole = assistant.designation;
        }
      }

      if (updates.assignedDoctorId && updates.assignedDoctorId !== existing.assignedDoctorId) {
        const doctor = DataStore.doctors.find((d) => d.id === updates.assignedDoctorId);
        if (doctor) {
          updates.assignedDoctorName = doctor.fullName;
          updates.assignedDoctorSpeciality = doctor.specialization;
        }
      }

      DataStore.healthCamps[campIndex] = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      res.status(200).json({
        success: true,
        message: 'Health camp updated successfully',
        camp: DataStore.healthCamps[campIndex],
      });
    } catch (error: any) {
      console.error('Error updating health camp:', error);
      res.status(500).json({ success: false, message: 'Failed to update health camp' });
    }
  }

  /**
   * 5. POST /api/camps/:id/register - Register a patient for a camp (Enforces capacity cap)
   */
  public static async registerForCamp(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const camp = DataStore.healthCamps.find((c) => c.id === id || c.campId === id);

      if (!camp) {
        res.status(404).json({ success: false, message: 'Health camp not found' });
        return;
      }

      if (camp.status === 'COMPLETED' || camp.status === 'CANCELLED') {
        res.status(400).json({
          success: false,
          message: `Cannot register for a ${camp.status.toLowerCase()} health camp`,
        });
        return;
      }

      // CAPACITY ENFORCEMENT
      if (camp.registeredCount >= camp.capacity) {
        res.status(400).json({
          success: false,
          message: `Health camp has reached maximum capacity (${camp.capacity} participants). Registrations are now closed.`,
        });
        return;
      }

      const {
        participantName,
        participantPhone,
        participantAge,
        participantGender,
        notes,
      } = req.body;

      const patientId = req.user?.patientId || req.body.patientId || null;

      // Prevent duplicate registration for the same patient in the same camp
      if (patientId) {
        const alreadyRegistered = DataStore.campRegistrations.some(
          (r) => r.campId === camp.id && r.patientId === patientId && r.status !== 'CANCELLED'
        );
        if (alreadyRegistered) {
          res.status(400).json({
            success: false,
            message: 'You are already registered for this health camp',
          });
          return;
        }
      }

      const currentCampRegistrations = DataStore.campRegistrations.filter((r) => r.campId === camp.id);
      const tokenNumber = currentCampRegistrations.length + 1;

      const registration: HealthCampRegistration = {
        id: `reg-${Date.now()}`,
        campId: camp.id,
        patientId,
        participantName: participantName || req.user?.fullName || 'Participant',
        participantPhone: participantPhone || req.user?.phone || '+91 98765 43210',
        participantAge: Number(participantAge) || 30,
        participantGender: participantGender || 'Female',
        tokenNumber,
        status: 'REGISTERED',
        attendedAt: null,
        notes: notes || null,
        reminderSent: false,
        registeredAt: new Date().toISOString(),
      };

      DataStore.campRegistrations.push(registration);
      camp.registeredCount = currentCampRegistrations.length + 1;
      camp.updatedAt = new Date().toISOString();

      // Create a confirmation notification
      if (patientId) {
        DataStore.notifications.unshift({
          id: `notif-${Date.now()}`,
          userId: req.user?.id || `user-${patientId}`,
          patientId,
          type: 'CAMP_REGISTERED',
          title: `Pass Confirmed: ${camp.title}`,
          message: `Your token #${tokenNumber} for ${camp.title} at ${camp.venue} on ${camp.startDate} (${camp.time}) is confirmed.`,
          read: false,
          linkUrl: `/camps/${camp.id}`,
          createdAt: new Date().toISOString(),
        });
      }

      res.status(201).json({
        success: true,
        message: 'Successfully registered for health camp',
        registration,
        camp: {
          id: camp.id,
          campId: camp.campId,
          title: camp.title,
          venue: camp.venue,
          startDate: camp.startDate,
          time: camp.time,
          tokenNumber,
          remainingSpots: camp.capacity - camp.registeredCount,
        },
      });
    } catch (error: any) {
      console.error('Error registering for health camp:', error);
      res.status(500).json({ success: false, message: 'Failed to complete camp registration' });
    }
  }

  /**
   * 6. GET /api/camps/:id/registrations - Organizers view registrations list
   */
  public static async getCampRegistrations(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const camp = DataStore.healthCamps.find((c) => c.id === id || c.campId === id);

      if (!camp) {
        res.status(404).json({ success: false, message: 'Health camp not found' });
        return;
      }

      const registrations = DataStore.campRegistrations.filter((r) => r.campId === camp.id);

      const attendedCount = registrations.filter((r) => r.status === 'ATTENDED').length;
      const noShowCount = registrations.filter((r) => r.status === 'NO_SHOW').length;
      const pendingCount = registrations.filter((r) => r.status === 'REGISTERED').length;

      res.status(200).json({
        success: true,
        campId: camp.id,
        campTitle: camp.title,
        capacity: camp.capacity,
        registeredCount: camp.registeredCount,
        stats: {
          total: registrations.length,
          attended: attendedCount,
          noShow: noShowCount,
          pending: pendingCount,
        },
        registrations,
      });
    } catch (error: any) {
      console.error('Error fetching registrations:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve registrations' });
    }
  }

  /**
   * 7. PATCH /api/camps/:id/registrations/:regId/attendance - Mark attendance
   */
  public static async updateAttendance(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id, regId } = req.params;
      const { status, notes } = req.body;

      const registration = DataStore.campRegistrations.find(
        (r) => r.campId === id && (r.id === regId || r.tokenNumber === Number(regId))
      );

      if (!registration) {
        res.status(404).json({ success: false, message: 'Camp registration record not found' });
        return;
      }

      registration.status = (status as CampRegistrationStatus) || 'ATTENDED';
      if (status === 'ATTENDED') {
        registration.attendedAt = new Date().toISOString();
      }
      if (notes) {
        registration.notes = notes;
      }

      res.status(200).json({
        success: true,
        message: `Attendance marked as ${registration.status}`,
        registration,
      });
    } catch (error: any) {
      console.error('Error updating attendance:', error);
      res.status(500).json({ success: false, message: 'Failed to mark attendance' });
    }
  }

  /**
   * 8. POST /api/camps/:id/outcome - Record outcomes and mark camp as COMPLETED
   */
  public static async recordOutcome(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const camp = DataStore.healthCamps.find((c) => c.id === id || c.campId === id);

      if (!camp) {
        res.status(404).json({ success: false, message: 'Health camp not found' });
        return;
      }

      const {
        peopleScreened,
        referralsMade,
        vaccinationsAdministered,
        medicinesDistributed,
        criticalCasesIdentified,
        notes,
      } = req.body;

      const outcome: HealthCampOutcome = {
        peopleScreened: Number(peopleScreened) || 0,
        referralsMade: Number(referralsMade) || 0,
        vaccinationsAdministered: vaccinationsAdministered ? Number(vaccinationsAdministered) : undefined,
        medicinesDistributed: medicinesDistributed ? Number(medicinesDistributed) : undefined,
        criticalCasesIdentified: criticalCasesIdentified ? Number(criticalCasesIdentified) : undefined,
        notes: notes || 'Camp successfully concluded with community health screening and referrals.',
        recordedAt: new Date().toISOString(),
        recordedBy: req.user?.fullName || camp.assignedAssistantName || 'Camp Coordinator',
      };

      camp.outcome = outcome;
      camp.status = 'COMPLETED';
      camp.updatedAt = new Date().toISOString();

      res.status(200).json({
        success: true,
        message: 'Camp outcome recorded successfully and status updated to COMPLETED',
        camp,
      });
    } catch (error: any) {
      console.error('Error recording outcome:', error);
      res.status(500).json({ success: false, message: 'Failed to record camp outcome' });
    }
  }

  /**
   * 9. POST /api/camps/:id/reminders - Broadcast reminders to all registered participants
   */
  public static async sendCampReminders(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const camp = DataStore.healthCamps.find((c) => c.id === id || c.campId === id);

      if (!camp) {
        res.status(404).json({ success: false, message: 'Health camp not found' });
        return;
      }

      const registrations = DataStore.campRegistrations.filter(
        (r) => r.campId === camp.id && r.status === 'REGISTERED'
      );

      let sentCount = 0;
      for (const reg of registrations) {
        reg.reminderSent = true;
        sentCount++;

        if (reg.patientId) {
          DataStore.notifications.unshift({
            id: `notif-${Date.now()}-${sentCount}`,
            userId: `user-${reg.patientId}`,
            patientId: reg.patientId,
            type: 'CAMP_REMINDER',
            title: `⏰ Reminder: ${camp.title} Tomorrow`,
            message: `Don't forget! Your health camp is scheduled for ${camp.startDate} at ${camp.venue} (${camp.time}). Token #${reg.tokenNumber}.`,
            read: false,
            linkUrl: `/camps/${camp.id}`,
            createdAt: new Date().toISOString(),
          });
        }
      }

      res.status(200).json({
        success: true,
        message: `Successfully sent camp reminders to ${sentCount} registered participants`,
        sentCount,
        campTitle: camp.title,
        venue: camp.venue,
        date: camp.startDate,
      });
    } catch (error: any) {
      console.error('Error sending reminders:', error);
      res.status(500).json({ success: false, message: 'Failed to send camp reminders' });
    }
  }

  /**
   * 10. GET /api/camps/registrations/my - Current patient's camp passes & tokens
   */
  public static async getMyRegistrations(req: AuthRequest, res: Response): Promise<void> {
    try {
      const patientId = req.user?.patientId || (req.query.patientId as string);

      if (!patientId) {
        res.status(400).json({ success: false, message: 'Patient ID required' });
        return;
      }

      const myRegs = DataStore.campRegistrations.filter((r) => r.patientId === patientId);

      const detailedRegistrations = myRegs.map((reg) => {
        const camp = DataStore.healthCamps.find((c) => c.id === reg.campId);
        return {
          registration: reg,
          camp,
        };
      });

      res.status(200).json({
        success: true,
        registrations: detailedRegistrations,
        count: detailedRegistrations.length,
      });
    } catch (error: any) {
      console.error('Error fetching patient registrations:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve registrations' });
    }
  }

  /**
   * 11. GET /api/camps/analytics - Camp metrics and health screening statistics
   */
  public static async getCampAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const totalCamps = DataStore.healthCamps.length;
      const upcomingCamps = DataStore.healthCamps.filter((c) => c.status === 'UPCOMING').length;
      const completedCamps = DataStore.healthCamps.filter((c) => c.status === 'COMPLETED').length;
      const totalRegistrations = DataStore.campRegistrations.length;

      let totalScreened = 0;
      let totalReferrals = 0;
      const campsByType: Record<HealthCampType, number> = {
        GENERAL: 0,
        EYE: 0,
        DENTAL: 0,
        VACCINATION: 0,
        MATERNAL_CHILD: 0,
        NCD_SCREENING: 0,
        AYUSH: 0,
      };

      for (const camp of DataStore.healthCamps) {
        if (campsByType[camp.type] !== undefined) {
          campsByType[camp.type]++;
        }
        if (camp.outcome) {
          totalScreened += camp.outcome.peopleScreened || 0;
          totalReferrals += camp.outcome.referralsMade || 0;
        }
      }

      const analytics: HealthCampAnalytics = {
        totalCamps,
        upcomingCamps,
        completedCamps,
        totalRegistrations,
        totalScreened,
        totalReferrals,
        campsByType,
      };

      res.status(200).json({
        success: true,
        analytics,
      });
    } catch (error: any) {
      console.error('Error calculating camp analytics:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve analytics' });
    }
  }
}
