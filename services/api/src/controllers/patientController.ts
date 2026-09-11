import { Response } from 'express';
import { DataStore } from '../db/dataStore';
import { AuthRequest } from '../middleware/auth';

export class PatientController {
  public static async getProfile(req: AuthRequest, res: Response): Promise<void> {
    const patientId = req.params.id || req.user?.patientId || 'pat-0001';
    const patient = DataStore.patients.find((p) => p.id === patientId || p.patientId === patientId);

    if (!patient) {
      res.status(404).json({ success: false, message: 'Patient profile not found.' });
      return;
    }

    res.status(200).json({ success: true, patient });
  }

  public static async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    const patientId = req.params.id || req.user?.patientId || 'pat-0001';
    const index = DataStore.patients.findIndex((p) => p.id === patientId || p.patientId === patientId);

    if (index === -1) {
      res.status(404).json({ success: false, message: 'Patient not found.' });
      return;
    }

    DataStore.patients[index] = {
      ...DataStore.patients[index],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    res.status(200).json({ success: true, patient: DataStore.patients[index] });
  }

  public static async getMedicalRecords(req: AuthRequest, res: Response): Promise<void> {
    const patientId = req.params.id || req.user?.patientId || 'pat-0001';
    const records = DataStore.medicalRecords.filter((r) => r.patientId === patientId);
    res.status(200).json({ success: true, records });
  }

  public static async getAppointments(req: AuthRequest, res: Response): Promise<void> {
    const patientId = req.params.id || req.user?.patientId || 'pat-0001';
    const appointments = DataStore.appointments.filter((a) => a.patientId === patientId);
    res.status(200).json({ success: true, appointments });
  }

  public static async getAllPatients(req: AuthRequest, res: Response): Promise<void> {
    const search = (req.query.search as string || '').toLowerCase();
    let patients = DataStore.patients;

    if (search) {
      patients = patients.filter(
        (p) =>
          p.fullName.toLowerCase().includes(search) ||
          p.patientId.toLowerCase().includes(search) ||
          p.phone.includes(search)
      );
    }

    res.status(200).json({ success: true, patients, total: patients.length });
  }
}
