"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorController = void 0;
const dataStore_1 = require("../db/dataStore");
class DoctorController {
    static async getDoctorProfile(req, res) {
        const doctorId = req.params.id || req.user?.doctorId || 'doc-001';
        const doctor = dataStore_1.DataStore.doctors.find((d) => d.id === doctorId || d.doctorId === doctorId);
        if (!doctor) {
            res.status(404).json({ success: false, message: 'Doctor not found.' });
            return;
        }
        const phc = dataStore_1.DataStore.phcs.find((p) => p.id === doctor.phcId);
        res.status(200).json({
            success: true,
            doctor: {
                ...doctor,
                phcName: phc?.name,
            },
        });
    }
    static async updateAvailability(req, res) {
        const doctorId = req.params.id || req.user?.doctorId || 'doc-001';
        const { status } = req.body;
        const validStatuses = ['AVAILABLE', 'BUSY', 'OFFLINE', 'ON LEAVE'];
        if (!validStatuses.includes(status)) {
            res.status(400).json({ success: false, message: 'Invalid availability status.' });
            return;
        }
        const docIndex = dataStore_1.DataStore.doctors.findIndex((d) => d.id === doctorId || d.doctorId === doctorId);
        if (docIndex === -1) {
            res.status(404).json({ success: false, message: 'Doctor not found.' });
            return;
        }
        dataStore_1.DataStore.doctors[docIndex].status = status;
        res.status(200).json({
            success: true,
            message: `Doctor availability updated to ${status}`,
            doctor: dataStore_1.DataStore.doctors[docIndex],
        });
    }
    static async getDoctorQueue(req, res) {
        const doctorId = req.params.id || req.user?.doctorId || 'doc-001';
        const today = new Date().toISOString().split('T')[0];
        const allDoctorApts = dataStore_1.DataStore.appointments.filter((a) => a.doctorId === doctorId);
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
    static async getAllDoctors(req, res) {
        const { phcId, specialization, status } = req.query;
        let doctors = dataStore_1.DataStore.doctors.map((d) => {
            const phc = dataStore_1.DataStore.phcs.find((p) => p.id === d.phcId);
            return {
                ...d,
                phcName: phc?.name || 'Primary Health Centre',
            };
        });
        if (phcId) {
            doctors = doctors.filter((d) => d.phcId === phcId);
        }
        if (specialization) {
            doctors = doctors.filter((d) => d.specialization.toLowerCase().includes(specialization.toLowerCase()));
        }
        if (status) {
            doctors = doctors.filter((d) => d.status === status);
        }
        res.status(200).json({ success: true, doctors, total: doctors.length });
    }
    static async getAvailableDoctors(req, res) {
        const available = dataStore_1.DataStore.doctors
            .filter((d) => d.status === 'AVAILABLE')
            .map((d) => {
            const phc = dataStore_1.DataStore.phcs.find((p) => p.id === d.phcId);
            return {
                ...d,
                phcName: phc?.name,
            };
        });
        res.status(200).json({ success: true, doctors: available, count: available.length });
    }
    static async getPatientConsultationDetails(req, res) {
        const { patientId } = req.params;
        const patient = dataStore_1.DataStore.patients.find((p) => p.id === patientId || p.patientId === patientId);
        if (!patient) {
            res.status(404).json({ success: false, message: 'Patient not found.' });
            return;
        }
        const previousRecords = dataStore_1.DataStore.medicalRecords.filter((r) => r.patientId === patient.id);
        const recentAssessments = dataStore_1.DataStore.symptomAssessments.filter((s) => s.patientId === patient.id);
        const appointments = dataStore_1.DataStore.appointments.filter((a) => a.patientId === patient.id);
        res.status(200).json({
            success: true,
            patient,
            previousRecords,
            recentAssessments,
            appointments,
        });
    }
}
exports.DoctorController = DoctorController;
