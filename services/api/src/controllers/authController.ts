import { Request, Response } from 'express';
import { DataStore } from '../db/dataStore';
import { generateToken, AuthRequest } from '../middleware/auth';
import { PatientProfile } from '@phc-connect/types';

// In-memory OTP Store for phone verification
interface StoredOtp {
  otp: string;
  phone: string;
  normalizedPhone: string;
  expiresAt: number;
  registrationData?: any;
}

const otpStore = new Map<string, StoredOtp>();

export class AuthController {
  /**
   * Normalize phone number to 10-digit standard for reliable matching
   * e.g. "+91 98765 43210", "9876543210", "+919876543210" -> "9876543210"
   */
  public static normalizePhone(phone?: string | null): string {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length >= 10) {
      return digits.slice(-10);
    }
    return digits;
  }

  /**
   * POST /api/auth/send-otp
   * Request 6-digit OTP sent to a mobile phone number
   */
  public static async sendOtp(req: Request, res: Response): Promise<void> {
    try {
      const { phone, isRegistration, registrationData } = req.body;

      if (!phone || !phone.trim()) {
        res.status(400).json({ success: false, message: 'Mobile phone number is required.' });
        return;
      }

      const normalized = AuthController.normalizePhone(phone);
      if (normalized.length < 10) {
        res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number.' });
        return;
      }

      // Check if user already exists
      const existingUser = DataStore.users.find(
        (u) => AuthController.normalizePhone(u.phone) === normalized
      );

      // Generate 6-digit OTP (e.g. 482910)
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

      otpStore.set(normalized, {
        otp: generatedOtp,
        phone,
        normalizedPhone: normalized,
        expiresAt,
        registrationData: registrationData || null,
      });

      console.log(`[AUTH] 📲 Generated OTP for ${phone} (${normalized}): ${generatedOtp}`);

      res.status(200).json({
        success: true,
        message: `OTP sent successfully to ${phone}`,
        otp: generatedOtp, // Included in response for seamless development & simulated SMS toast
        normalizedPhone: normalized,
        userExists: !!existingUser,
        existingUserName: existingUser?.fullName || null,
        isRegistration: !!isRegistration,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to generate OTP' });
    }
  }

  /**
   * POST /api/auth/verify-otp
   * Verify the entered 6-digit OTP code and complete login/registration
   */
  public static async verifyOtp(req: Request, res: Response): Promise<void> {
    try {
      const { phone, otp, registrationData } = req.body;

      if (!phone) {
        res.status(400).json({ success: false, message: 'Phone number is required.' });
        return;
      }

      if (!otp) {
        res.status(400).json({ success: false, message: 'Please enter the 6-digit OTP code.' });
        return;
      }

      const normalized = AuthController.normalizePhone(phone);
      const stored = otpStore.get(normalized);

      // Verify OTP against stored OTP, or accept master bypass code "123456" / "999999" for testing
      const isValidOtp =
        (stored && stored.otp === otp.trim() && stored.expiresAt > Date.now()) ||
        otp.trim() === '123456' ||
        otp.trim() === '999999' ||
        (stored && stored.otp === otp.trim());

      if (!isValidOtp) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP code. Please enter the correct 6-digit code or request a new OTP.',
        });
        return;
      }

      // Clear consumed OTP
      otpStore.delete(normalized);

      // Find user by normalized phone
      let user = DataStore.users.find(
        (u) => AuthController.normalizePhone(u.phone) === normalized
      );
      let patient = null;

      // Extract registration payload if passed in request or stored during sendOtp
      const regData = registrationData || stored?.registrationData || null;

      if (!user) {
        // Create new patient
        const count = DataStore.patients.length + 1;
        const patientIdCode = `PHC-PAT-2026-${count.toString().padStart(4, '0')}`;
        const userId = `user-pat-${Date.now()}`;
        const patId = `pat-${Date.now()}`;

        const fullName = regData?.fullName || 'Registered Patient';
        const formattedPhone = phone.startsWith('+91') ? phone : `+91 ${phone.replace(/\s+/g, '')}`;

        user = {
          id: userId,
          fullName,
          phone: formattedPhone,
          email: regData?.email || null,
          role: 'PATIENT' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        patient = {
          id: patId,
          userId,
          patientId: patientIdCode,
          fullName,
          age: Number(regData?.age) || 28,
          gender: (regData?.gender as any) || 'Other',
          phone: formattedPhone,
          email: regData?.email || null,
          address: regData?.address || 'Delhi NCR',
          latitude: regData?.latitude ? Number(regData.latitude) : 28.6139,
          longitude: regData?.longitude ? Number(regData.longitude) : 77.209,
          emergencyContactName: regData?.emergencyContactName || 'Family Member',
          emergencyContactPhone: regData?.emergencyContactPhone || formattedPhone,
          emergencyContactRelation: regData?.emergencyContactRelation || 'Relative',
          bloodGroup: regData?.bloodGroup || 'O+ve',
          allergies: Array.isArray(regData?.allergies)
            ? regData.allergies
            : regData?.allergies
            ? [regData.allergies]
            : [],
          existingConditions: Array.isArray(regData?.existingConditions)
            ? regData.existingConditions
            : regData?.existingConditions
            ? [regData.existingConditions]
            : [],
          currentMedications: Array.isArray(regData?.currentMedications)
            ? regData.currentMedications
            : regData?.currentMedications
            ? [regData.currentMedications]
            : [],
          medicalHistoryNotes: regData?.medicalHistoryNotes || 'Registered via ArogyaMitra Mobile OTP Verification',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        DataStore.users.push(user);
        DataStore.patients.push(patient);
      } else {
        // Existing user: check if they have a patient profile
        patient = DataStore.patients.find((p) => p.userId === user?.id);

        // If regData has updated name/details, update them
        if (regData && patient) {
          if (regData.fullName) {
            user.fullName = regData.fullName;
            patient.fullName = regData.fullName;
          }
          if (regData.age) patient.age = Number(regData.age);
          if (regData.gender) patient.gender = regData.gender;
          if (regData.address) patient.address = regData.address;
          if (regData.emergencyContactName) patient.emergencyContactName = regData.emergencyContactName;
          if (regData.emergencyContactPhone) patient.emergencyContactPhone = regData.emergencyContactPhone;
          if (regData.emergencyContactRelation) patient.emergencyContactRelation = regData.emergencyContactRelation;
          if (regData.allergies) patient.allergies = Array.isArray(regData.allergies) ? regData.allergies : [regData.allergies];
          if (regData.existingConditions) patient.existingConditions = Array.isArray(regData.existingConditions) ? regData.existingConditions : [regData.existingConditions];
          if (regData.currentMedications) patient.currentMedications = Array.isArray(regData.currentMedications) ? regData.currentMedications : [regData.currentMedications];
          patient.updatedAt = new Date().toISOString();
        }
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
        message: 'Phone verified successfully. Welcome to ArogyaMitra!',
        token,
        user,
        patient,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'OTP verification failed' });
    }
  }

  /**
   * POST /api/auth/register
   * Direct patient registration
   */
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

      const normalized = AuthController.normalizePhone(phone);

      // Check if user exists
      let existingUser = DataStore.users.find(
        (u) => AuthController.normalizePhone(u.phone) === normalized
      );

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
          message: 'Existing patient found with this mobile number. Logged in successfully.',
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
      const formattedPhone = phone.startsWith('+91') ? phone : `+91 ${phone.replace(/\s+/g, '')}`;

      const newUser = {
        id: userId,
        fullName,
        phone: formattedPhone,
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
        phone: formattedPhone,
        email: email || null,
        address: address || 'Local Resident, Delhi',
        latitude: latitude ? Number(latitude) : 28.6139,
        longitude: longitude ? Number(longitude) : 77.209,
        emergencyContactName: emergencyContactName || 'Family Member',
        emergencyContactPhone: emergencyContactPhone || formattedPhone,
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
        phone: formattedPhone,
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

  /**
   * POST /api/auth/login
   * Staff and general credential login
   */
  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, phone, role, receptionistId, username } = req.body;

      let user = null;
      // Search by receptionistId / username if provided
      const searchId = receptionistId || username;
      if (searchId) {
        const matchedRec = DataStore.receptionists.find(
          (r) => r.receptionistId.toLowerCase() === searchId.toLowerCase().trim() ||
                 r.email.toLowerCase() === searchId.toLowerCase().trim() ||
                 r.id.toLowerCase() === searchId.toLowerCase().trim()
        );
        if (matchedRec) {
          user = DataStore.users.find((u) => u.id === matchedRec.userId);
        }
      }

      if (!user && phone) {
        const normalized = AuthController.normalizePhone(phone);
        user = DataStore.users.find(
          (u) => AuthController.normalizePhone(u.phone) === normalized
        );
      } else if (!user && email) {
        user = DataStore.users.find((u) => u.email?.toLowerCase() === email.toLowerCase().trim());
      }

      if (!user) {
        // Fallback default role-based demo accounts
        if (role === 'DOCTOR') {
          user = DataStore.users.find((u) => u.role === 'DOCTOR');
        } else if (role === 'PHARMACIST') {
          user = DataStore.users.find((u) => u.role === 'PHARMACIST');
        } else if (role === 'ADMIN') {
          user = DataStore.users.find((u) => u.role === 'ADMIN');
        } else if (role === 'RECEPTIONIST') {
          user = DataStore.users.find((u) => u.role === 'RECEPTIONIST');
        } else if (role === 'HEALTH_ASSISTANT') {
          user = DataStore.users.find((u) => u.role === 'HEALTH_ASSISTANT');
        } else {
          user = DataStore.users.find((u) => u.role === 'PATIENT');
        }
      }

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found. Please verify your credentials.' });
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
      } else if (user.role === 'RECEPTIONIST') {
        profile = DataStore.receptionists.find((r) => r.userId === user?.id) || DataStore.receptionists[0];
        extraPayload = { receptionistId: profile?.id, phcId: profile?.phcId };
      } else if (user.role === 'HEALTH_ASSISTANT') {
        profile = DataStore.healthAssistants.find((a) => a.userId === user?.id) || DataStore.healthAssistants[0];
        extraPayload = { assistantId: profile?.id, phcId: profile?.phcId };
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

  /**
   * GET /api/auth/me
   */
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
    } else if (user.role === 'RECEPTIONIST') {
      profile = DataStore.receptionists.find((r) => r.userId === user.id) || DataStore.receptionists[0];
    } else if (user.role === 'HEALTH_ASSISTANT') {
      profile = DataStore.healthAssistants.find((a) => a.userId === user.id) || DataStore.healthAssistants[0];
    }

    res.status(200).json({
      success: true,
      user,
      profile,
    });
  }
}

