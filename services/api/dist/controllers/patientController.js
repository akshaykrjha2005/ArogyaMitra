"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientController = void 0;
const dataStore_1 = require("../db/dataStore");
class PatientController {
    static async getProfile(req, res) {
        const patientId = req.params.id || req.user?.patientId || 'pat-0001';
        const patient = dataStore_1.DataStore.patients.find((p) => p.id === patientId || p.patientId === patientId);
        if (!patient) {
            res.status(404).json({ success: false, message: 'Patient profile not found.' });
            return;
        }
        res.status(200).json({ success: true, patient });
    }
    static async updateProfile(req, res) {
        const patientId = req.params.id || req.user?.patientId || 'pat-0001';
        const index = dataStore_1.DataStore.patients.findIndex((p) => p.id === patientId || p.patientId === patientId);
        if (index === -1) {
            res.status(404).json({ success: false, message: 'Patient not found.' });
            return;
        }
        dataStore_1.DataStore.patients[index] = {
            ...dataStore_1.DataStore.patients[index],
            ...req.body,
            updatedAt: new Date().toISOString(),
        };
        res.status(200).json({ success: true, patient: dataStore_1.DataStore.patients[index] });
    }
    static async getMedicalRecords(req, res) {
        const patientId = req.params.id || req.user?.patientId || 'pat-0001';
        const records = dataStore_1.DataStore.medicalRecords.filter((r) => r.patientId === patientId);
        res.status(200).json({ success: true, records });
    }
    static async getAppointments(req, res) {
        const patientId = req.params.id || req.user?.patientId || 'pat-0001';
        const appointments = dataStore_1.DataStore.appointments.filter((a) => a.patientId === patientId);
        res.status(200).json({ success: true, appointments });
    }
    static async getAllPatients(req, res) {
        const search = (req.query.search || '').toLowerCase();
        let patients = dataStore_1.DataStore.patients;
        if (search) {
            patients = patients.filter((p) => p.fullName.toLowerCase().includes(search) ||
                p.patientId.toLowerCase().includes(search) ||
                p.phone.includes(search));
        }
        res.status(200).json({ success: true, patients, total: patients.length });
    }
}
exports.PatientController = PatientController;
