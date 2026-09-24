import { Request, Response } from 'express';
import { DataStore } from '../db/dataStore';
import { AuthRequest } from '../middleware/auth';
import { DoctorAvailabilityStatus } from '@phc-connect/types';

export class DoctorController {
  public static async getDoctorProfile(req: AuthRequest, res: Response): Promise<void> {
    const doctorId = req.params.id || req.user?.doctorId || 'doc-001';
    const doctor = DataStore.doctors.find((d) => d.id === doctorId || d.doctorId === doctorId);

    if (!doctor) {
      res.status(404).json({ success: false, message: 'Doctor not found.' });
      return;
    }

    const phc = DataStore.phcs.find((p) => p.id === doctor.phcId);

    res.status(200).json({
      success: true,
      doctor: {
        ...doctor,
        phcName: phc?.name,
      },
    });
  }

  public static async updateAvailability(req: AuthRequest, res: Response): Promise<void> {
    const doctorId = req.params.id || req.user?.doctorId || 'doc-001';
    const { status } = req.body as { status: DoctorAvailabilityStatus };

    const validStatuses: DoctorAvailabilityStatus[] = ['AVAILABLE', 'BUSY', 'OFFLINE', 'ON LEAVE'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid availability status.' });
      return;
    }

    const docIndex = DataStore.doctors.findIndex((d) => d.id === doctorId || d.doctorId === doctorId);
    if (docIndex === -1) {
      res.status(404).json({ success: false, message: 'Doctor not found.' });
      return;
    }

    DataStore.doctors[docIndex].status = status;

    res.status(200).json({
      success: true,
      message: `Doctor availability updated to ${status}`,
      doctor: DataStore.doctors[docIndex],
    });
  }

  public static async getDoctorQueue(req: AuthRequest, res: Response): Promise<void> {
    const doctorId = req.params.id || req.user?.doctorId || 'doc-001';
    const today = new Date().toISOString().split('T')[0];

    const allDoctorApts = DataStore.appointments.filter((a) => a.doctorId === doctorId);
    const todayAppointments = allDoctorApts.filter((a) => a.date === today || a.status !== 'Completed');

    const waitingPatients = todayAppointments.filter((a) => a.status === 'Checked In' || a.status === 'Pending');
    const inConsultation = todayAppointments.filter((a) => a.status === 'In Consultation');
    const completedPatients = allDoctorApts.filter((a) => a.status === 'Completed');
    const upcomingAppointments = allDoctorApts.filter((a) => a.status === 'Confirmed');

    res.status(200).json({
      success: true,
      metrics: {
        totalToday: todayAppointments.length,
        waitingCount: waitingPatients.length,
        inConsultationCount: inConsultation.length,
        completedCount: completedPatients.length,
        upcomingCount: upcomingAppointments.length,
      },
      waitingPatients,
      inConsultation,
      completedPatients,
      upcomingAppointments,
    });
  }

  public static async getAllDoctors(req: Request, res: Response): Promise<void> {
    const { phcId, specialization, status } = req.query;

    let doctors = DataStore.doctors.map((d) => {
      const phc = DataStore.phcs.find((p) => p.id === d.phcId);
      return {
        ...d,
        phcName: phc?.name || 'Primary Health Centre',
      };
    });

    if (phcId) {
      doctors = doctors.filter((d) => d.phcId === phcId);
    }
    if (specialization) {
      doctors = doctors.filter((d) =>
        d.specialization.toLowerCase().includes((specialization as string).toLowerCase())
      );
    }
    if (status) {
      doctors = doctors.filter((d) => d.status === status);
    }

    res.status(200).json({ success: true, doctors, total: doctors.length });
  }

  public static async getAvailableDoctors(req: Request, res: Response): Promise<void> {
    const available = DataStore.doctors
      .filter((d) => d.status === 'AVAILABLE')
      .map((d) => {
        const phc = DataStore.phcs.find((p) => p.id === d.phcId);
        return {
          ...d,
          phcName: phc?.name,
        };
      });

    res.status(200).json({ success: true, doctors: available, count: available.length });
  }

  public static async getPatientConsultationDetails(req: AuthRequest, res: Response): Promise<void> {
    const { patientId } = req.params;
    const patient = DataStore.patients.find((p) => p.id === patientId || p.patientId === patientId);

    if (!patient) {
      res.status(404).json({ success: false, message: 'Patient not found.' });
      return;
    }

    const previousRecords = DataStore.medicalRecords.filter((r) => r.patientId === patient.id);
    const appointments = DataStore.appointments.filter((a) => a.patientId === patient.id);

    res.status(200).json({
      success: true,
      patient,
      previousRecords,
      appointments,
    });
  }
}
