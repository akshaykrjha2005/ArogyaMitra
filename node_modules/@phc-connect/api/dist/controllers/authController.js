"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const dataStore_1 = require("../db/dataStore");
const auth_1 = require("../middleware/auth");
class AuthController {
    static async registerPatient(req, res) {
        try {
            const { fullName, age, gender, phone, email, address, latitude, longitude, emergencyContactName, emergencyContactPhone, emergencyContactRelation, bloodGroup, allergies, existingConditions, currentMedications, medicalHistoryNotes, } = req.body;
            if (!fullName || !phone) {
                res.status(400).json({ success: false, message: 'Name and phone are required.' });
                return;
            }
            // Check if user exists
            let existingUser = dataStore_1.DataStore.users.find((u) => u.phone === phone);
            if (existingUser) {
                const patient = dataStore_1.DataStore.patients.find((p) => p.userId === existingUser?.id);
                const token = (0, auth_1.generateToken)({
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
            const count = dataStore_1.DataStore.patients.length + 1;
            const patientIdCode = `PHC-PAT-2026-${count.toString().padStart(4, '0')}`;
            const userId = `user-pat-${Date.now()}`;
            const patId = `pat-${Date.now()}`;
            const newUser = {
                id: userId,
                fullName,
                phone,
                email: email || null,
                role: 'PATIENT',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            const newPatient = {
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
            dataStore_1.DataStore.users.push(newUser);
            dataStore_1.DataStore.patients.push(newPatient);
            const token = (0, auth_1.generateToken)({
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
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async login(req, res) {
        try {
            const { email, phone, role } = req.body;
            let user = null;
            if (phone) {
                user = dataStore_1.DataStore.users.find((u) => u.phone === phone);
            }
            else if (email) {
                user = dataStore_1.DataStore.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
            }
            if (!user) {
                // Fallback default role-based demo accounts
                if (role === 'DOCTOR') {
                    user = dataStore_1.DataStore.users.find((u) => u.role === 'DOCTOR');
                }
                else if (role === 'PHARMACIST') {
                    user = dataStore_1.DataStore.users.find((u) => u.role === 'PHARMACIST');
                }
                else if (role === 'ADMIN') {
                    user = dataStore_1.DataStore.users.find((u) => u.role === 'ADMIN');
                }
                else {
                    user = dataStore_1.DataStore.users.find((u) => u.role === 'PATIENT');
                }
            }
            if (!user) {
                res.status(404).json({ success: false, message: 'User not found.' });
                return;
            }
            let profile = null;
            let extraPayload = {};
            if (user.role === 'PATIENT') {
                profile = dataStore_1.DataStore.patients.find((p) => p.userId === user?.id) || dataStore_1.DataStore.patients[0];
                extraPayload = { patientId: profile?.id };
            }
            else if (user.role === 'DOCTOR') {
                profile = dataStore_1.DataStore.doctors.find((d) => d.userId === user?.id) || dataStore_1.DataStore.doctors[0];
                extraPayload = { doctorId: profile?.id, phcId: profile?.phcId };
            }
            else if (user.role === 'PHARMACIST') {
                profile = dataStore_1.DataStore.pharmacists.find((p) => p.userId === user?.id) || dataStore_1.DataStore.pharmacists[0];
                extraPayload = { pharmacistId: profile?.id, phcId: profile?.phcId };
            }
            else if (user.role === 'ADMIN') {
                profile = dataStore_1.DataStore.admins.find((a) => a.userId === user?.id) || dataStore_1.DataStore.admins[0];
                extraPayload = { adminId: profile?.id, phcId: profile?.phcId };
            }
            const token = (0, auth_1.generateToken)({
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
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async verifyOtp(req, res) {
        const { phone, otp } = req.body;
        // Simulate OTP verification (e.g. 123456 or any 6-digit code)
        if (!phone) {
            res.status(400).json({ success: false, message: 'Phone number is required.' });
            return;
        }
        let user = dataStore_1.DataStore.users.find((u) => u.phone === phone);
        let patient = null;
        if (!user) {
            // Auto-register new patient
            const count = dataStore_1.DataStore.patients.length + 1;
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
                gender: 'Other',
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
            dataStore_1.DataStore.users.push(user);
            dataStore_1.DataStore.patients.push(patient);
        }
        else {
            patient = dataStore_1.DataStore.patients.find((p) => p.userId === user?.id);
        }
        const token = (0, auth_1.generateToken)({
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
    static async getCurrentUser(req, res) {
        const userId = req.user?.id;
        const user = dataStore_1.DataStore.users.find((u) => u.id === userId) || dataStore_1.DataStore.users[0];
        let profile = null;
        if (user.role === 'PATIENT') {
            profile = dataStore_1.DataStore.patients.find((p) => p.userId === user.id) || dataStore_1.DataStore.patients[0];
        }
        else if (user.role === 'DOCTOR') {
            profile = dataStore_1.DataStore.doctors.find((d) => d.userId === user.id) || dataStore_1.DataStore.doctors[0];
        }
        else if (user.role === 'PHARMACIST') {
            profile = dataStore_1.DataStore.pharmacists.find((p) => p.userId === user.id) || dataStore_1.DataStore.pharmacists[0];
        }
        else if (user.role === 'ADMIN') {
            profile = dataStore_1.DataStore.admins.find((a) => a.userId === user.id) || dataStore_1.DataStore.admins[0];
        }
        res.status(200).json({
            success: true,
            user,
            profile,
        });
    }
}
exports.AuthController = AuthController;
