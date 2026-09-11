import { Response } from 'express';
import { DataStore } from '../db/dataStore';
import { AuthRequest } from '../middleware/auth';
import { MedicalRecord, PrescriptionItem, ReferralType } from '@phc-connect/types';

export class ConsultationController {
  public static async recordConsultation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        appointmentId,
        patientId,
        doctorId,
        phcId,
        chiefComplaints,
        clinicalAssessment,
        diagnosis,
        vitals,
        prescriptions,
        recommendedTests,
        followUpDate,
        referralType,
        referralDetails,
        doctorNotes,
      } = req.body;

      if (!patientId || !clinicalAssessment || !diagnosis) {
        res.status(400).json({
          success: false,
          message: 'Patient ID, clinical assessment, and diagnosis are mandatory.',
        });
        return;
      }

      const patient = DataStore.patients.find((p) => p.id === patientId || p.patientId === patientId);
      const doctor = DataStore.doctors.find((d) => d.id === doctorId || d.doctorId === doctorId) || DataStore.doctors[0];
      const phc = DataStore.phcs.find((p) => p.id === phcId) || DataStore.phcs.find((p) => p.id === doctor?.phcId) || DataStore.phcs[0];

      const recordCount = DataStore.medicalRecords.length + 1;
      const recordNumber = `REC-2026-${recordCount.toString().padStart(4, '0')}`;
      const recordId = `rec-${Date.now()}`;

      const newRecord: MedicalRecord = {
        id: recordId,
        recordNumber,
        patientId: patient?.id || patientId,
        patientName: patient?.fullName || 'Patient',
        doctorId: doctor.id,
        doctorName: doctor.fullName,
        doctorSpecialization: doctor.specialization,
        phcId: phc.id,
        phcName: phc.name,
        appointmentId,
        visitDate: new Date().toISOString().split('T')[0],
        chiefComplaints: Array.isArray(chiefComplaints) ? chiefComplaints : chiefComplaints ? [chiefComplaints] : ['General Outpatient Symptoms'],
        clinicalAssessment,
        diagnosis: Array.isArray(diagnosis) ? diagnosis : diagnosis ? [diagnosis] : ['Clinical Observation'],
        vitals: vitals || {
          bp: '120/80 mmHg',
          temperature: '98.6 F',
          pulse: '72 bpm',
          spO2: '99%',
        },
        prescriptions: (prescriptions || []) as PrescriptionItem[],
        recommendedTests: Array.isArray(recommendedTests) ? recommendedTests : recommendedTests ? [recommendedTests] : [],
        followUpDate: followUpDate || null,
        referralType: (referralType as ReferralType) || 'Patient Treated',
        referralDetails: referralDetails || null,
        doctorNotes: doctorNotes || 'Patient evaluated and counseled on compliance and rest.',
        createdAt: new Date().toISOString(),
      };

      DataStore.medicalRecords.unshift(newRecord);

      // Update appointment status if appointmentId was provided
      if (appointmentId) {
        const aptIndex = DataStore.appointments.findIndex((a) => a.id === appointmentId);
        if (aptIndex !== -1) {
          DataStore.appointments[aptIndex].status = 'Completed';
          DataStore.appointments[aptIndex].consultationNotes = clinicalAssessment;
          DataStore.appointments[aptIndex].updatedAt = new Date().toISOString();
        }
      }

      // Create Patient Notification
      DataStore.notifications.unshift({
        id: `notif-${Date.now()}`,
        patientId: patient?.id,
        title: 'New Clinical Record & Prescription Available',
        message: `Dr. ${doctor.fullName} has recorded your medical notes and prescription. You can view it now in your Medical Records.`,
        type: 'APPOINTMENT_CONFIRMED',
        read: false,
        createdAt: new Date().toISOString(),
      });

      res.status(201).json({
        success: true,
        message: 'Consultation recorded successfully.',
        medicalRecord: newRecord,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getRecordById(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const record = DataStore.medicalRecords.find((r) => r.id === id || r.recordNumber === id);

    if (!record) {
      res.status(404).json({ success: false, message: 'Medical record not found.' });
      return;
    }

    res.status(200).json({ success: true, record });
  }
}
