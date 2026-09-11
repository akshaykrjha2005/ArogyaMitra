import { Request, Response } from 'express';
import { DataStore } from '../db/dataStore';
import { generateToken, AuthRequest } from '../middleware/auth';
import { PatientProfile } from '@phc-connect/types';

export class AuthController {
  public static async registerPatient(req: Request, res: Response): Promise<void> {
    try {
      const {
        fullName,
        age,
        gender,
        phone,
        email,
        address,
        latitude,
        longitude,
        emergencyContactName,
        emergencyContactPhone,
        emergencyContactRelation,
        bloodGroup,
        allergies,
        existingConditions,
        currentMedications,
        medicalHistoryNotes,
      } = req.body;

      if (!fullName || !phone) {
        res.status(400).json({ success: false, message: 'Name and phone are required.' });
        return;
      }

      // Check if user exists
      let existingUser = DataStore.users.find((u) => u.phone === phone);
      if (existingUser) {
        const patient = DataStore.patients.find((p) => p.userId === existingUser?.id);
        const token = generateToken({
          id: existingUser.id,
          phone: existingUser.phone,
          role: 'PATIENT',
          patientId: patient?.id,
          fullName: existingUser.fullName,
        });
        res.status(200).json({
          success: true,
          message: 'Existing patient found. Logged in successfully.',
          token,
          patient,
          user: existingUser,
        });
        return;
      }

      // Generate Unique Patient ID
      const count = DataStore.patients.length + 1;
      const patientIdCode = `PHC-PAT-2026-${count.toString().padStart(4, '0')}`;
      const userId = `user-pat-${Date.now()}`;
      const patId = `pat-${Date.now()}`;

      const newUser = {
        id: userId,
        fullName,
        phone,
        email: email || null,
        role: 'PATIENT' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const newPatient: PatientProfile = {
        id: patId,
        userId,
        patientId: patientIdCode,
        fullName,
        age: Number(age) || 30,
        gender: gender || 'Other',
        phone,
        email: email || null,
        address: address || 'Local Resident, Delhi',
        latitude: latitude ? Number(latitude) : 28.6139,
        longitude: longitude ? Number(longitude) : 77.209,
        emergencyContactName: emergencyContactName || 'Family Member',
        emergencyContactPhone: emergencyContactPhone || phone,
        emergencyContactRelation: emergencyContactRelation || 'Relative',
        bloodGroup: bloodGroup || 'O+ve',
        allergies: Array.isArray(allergies) ? allergies : allergies ? [allergies] : [],
        existingConditions: Array.isArray(existingConditions) ? existingConditions : existingConditions ? [existingConditions] : [],
        currentMedications: Array.isArray(currentMedications) ? currentMedications : currentMedications ? [currentMedications] : [],
        medicalHistoryNotes: medicalHistoryNotes || 'Registered via PHC Connect Patient Onboarding',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      DataStore.users.push(newUser);
      DataStore.patients.push(newPatient);

      const token = generateToken({
        id: userId,
        phone,
        role: 'PATIENT',
        patientId: patId,
        fullName,
      });

      res.status(201).json({
        success: true,
        message: 'Patient registered successfully.',
        token,
        patient: newPatient,
        user: newUser,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, phone, role } = req.body;

      let user = null;
      if (phone) {
        user = DataStore.users.find((u) => u.phone === phone);
      } else if (email) {
        user = DataStore.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      }

      if (!user) {
        // Fallback default role-based demo accounts
        if (role === 'DOCTOR') {
          user = DataStore.users.find((u) => u.role === 'DOCTOR');
        } else if (role === 'PHARMACIST') {
          user = DataStore.users.find((u) => u.role === 'PHARMACIST');
        } else if (role === 'ADMIN') {
          user = DataStore.users.find((u) => u.role === 'ADMIN');
        } else {
          user = DataStore.users.find((u) => u.role === 'PATIENT');
        }
      }

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found.' });
        return;
      }

      let profile: any = null;
      let extraPayload: any = {};

      if (user.role === 'PATIENT') {
        profile = DataStore.patients.find((p) => p.userId === user?.id) || DataStore.patients[0];
        extraPayload = { patientId: profile?.id };
      } else if (user.role === 'DOCTOR') {
        profile = DataStore.doctors.find((d) => d.userId === user?.id) || DataStore.doctors[0];
        extraPayload = { doctorId: profile?.id, phcId: profile?.phcId };
      } else if (user.role === 'PHARMACIST') {
        profile = DataStore.pharmacists.find((p) => p.userId === user?.id) || DataStore.pharmacists[0];
        extraPayload = { pharmacistId: profile?.id, phcId: profile?.phcId };
      } else if (user.role === 'ADMIN') {
        profile = DataStore.admins.find((a) => a.userId === user?.id) || DataStore.admins[0];
        extraPayload = { adminId: profile?.id, phcId: profile?.phcId };
      }

      const token = generateToken({
        id: user.id,
        role: user.role,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        ...extraPayload,
      });

      res.status(200).json({
        success: true,
        message: `Welcome back, ${user.fullName}`,
        token,
        user,
        profile,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async verifyOtp(req: Request, res: Response): Promise<void> {
    const { phone, otp } = req.body;
    // Simulate OTP verification (e.g. 123456 or any 6-digit code)
    if (!phone) {
      res.status(400).json({ success: false, message: 'Phone number is required.' });
      return;
    }

    let user = DataStore.users.find((u) => u.phone === phone);
    let patient = null;

    if (!user) {
      // Auto-register new patient
      const count = DataStore.patients.length + 1;
      const patientIdCode = `PHC-PAT-2026-${count.toString().padStart(4, '0')}`;
      const userId = `user-pat-${Date.now()}`;
      const patId = `pat-${Date.now()}`;

      user = {
        id: userId,
        fullName: 'New Patient',
        phone,
        role: 'PATIENT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      patient = {
        id: patId,
        userId,
        patientId: patientIdCode,
        fullName: 'New Patient',
        age: 28,
        gender: 'Other' as const,
        phone,
        address: 'Delhi NCR',
        emergencyContactName: 'Family Member',
        emergencyContactPhone: phone,
        emergencyContactRelation: 'Relative',
        allergies: [],
        existingConditions: [],
        currentMedications: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      DataStore.users.push(user);
      DataStore.patients.push(patient);
    } else {
      patient = DataStore.patients.find((p) => p.userId === user?.id);
    }

    const token = generateToken({
      id: user.id,
      role: user.role,
      fullName: user.fullName,
      phone: user.phone,
      patientId: patient?.id,
    });

    res.status(200).json({
      success: true,
      message: 'Phone verified successfully.',
      token,
      user,
      patient,
    });
  }

  public static async getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user?.id;
    const user = DataStore.users.find((u) => u.id === userId) || DataStore.users[0];
    let profile = null;

    if (user.role === 'PATIENT') {
      profile = DataStore.patients.find((p) => p.userId === user.id) || DataStore.patients[0];
    } else if (user.role === 'DOCTOR') {
      profile = DataStore.doctors.find((d) => d.userId === user.id) || DataStore.doctors[0];
    } else if (user.role === 'PHARMACIST') {
      profile = DataStore.pharmacists.find((p) => p.userId === user.id) || DataStore.pharmacists[0];
    } else if (user.role === 'ADMIN') {
      profile = DataStore.admins.find((a) => a.userId === user.id) || DataStore.admins[0];
    }

    res.status(200).json({
      success: true,
      user,
      profile,
    });
  }
}
