"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentController = void 0;
const dataStore_1 = require("../db/dataStore");
class AppointmentController {
    static async bookAppointment(req, res) {
        try {
            const { patientId, doctorId, phcId, date, timeSlot, reasonForVisit, symptoms, criticalityLevel, assessmentId, } = req.body;
            if (!doctorId || !phcId || !date || !timeSlot) {
                res.status(400).json({
                    success: false,
                    message: 'Doctor, PHC, Date, and Time Slot are required.',
                });
                return;
            }
            const patient = dataStore_1.DataStore.patients.find((p) => p.id === patientId || p.patientId === patientId) ||
                (req.user?.patientId ? dataStore_1.DataStore.patients.find((p) => p.id === req.user?.patientId) : dataStore_1.DataStore.patients[0]);
            const doctor = dataStore_1.DataStore.doctors.find((d) => d.id === doctorId || d.doctorId === doctorId);
            const phc = dataStore_1.DataStore.phcs.find((p) => p.id === phcId || p.code === phcId);
            if (!doctor || !phc) {
                res.status(404).json({ success: false, message: 'Selected doctor or PHC does not exist.' });
                return;
            }
            // Compute token number for that doctor on that date
            const existingOnDate = dataStore_1.DataStore.appointments.filter((a) => a.doctorId === doctor.id && a.date === date);
            const tokenNumber = existingOnDate.length + 1;
            const aptCount = dataStore_1.DataStore.appointments.length + 1;
            const appointmentNumber = `APT-2026-${aptCount.toString().padStart(4, '0')}`;
            const aptId = `apt-${Date.now()}`;
            const newAppointment = {
                id: aptId,
                appointmentNumber,
                patientId: patient?.id || 'pat-0001',
                patientName: patient?.fullName || 'Patient',
                patientAge: patient?.age || 30,
                patientGender: patient?.gender || 'Other',
                patientPhone: patient?.phone || '+91 98765 43210',
                doctorId: doctor.id,
                doctorName: doctor.fullName,
                doctorSpecialization: doctor.specialization,
                phcId: phc.id,
                phcName: phc.name,
                date,
                timeSlot,
                tokenNumber,
                reasonForVisit: reasonForVisit || 'General Clinical Consultation',
                symptoms: Array.isArray(symptoms) ? symptoms : symptoms ? [symptoms] : ['General Outpatient Symptoms'],
                criticalityLevel: criticalityLevel || 'LOW',
                status: 'Confirmed',
                assessmentId: assessmentId || null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            dataStore_1.DataStore.appointments.unshift(newAppointment);
            // Notification
            dataStore_1.DataStore.notifications.unshift({
                id: `notif-${Date.now()}`,
                patientId: patient?.id,
                title: 'Appointment Confirmed! 🩺',
                message: `Your appointment with ${doctor.fullName} at ${phc.name} is confirmed for ${date} at ${timeSlot} (Token #${tokenNumber}).`,
                type: 'APPOINTMENT_CONFIRMED',
                read: false,
                createdAt: new Date().toISOString(),
            });
            res.status(201).json({
                success: true,
                message: 'Appointment booked successfully.',
                appointment: newAppointment,
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getAppointments(req, res) {
        const { doctorId, phcId, patientId, date, status } = req.query;
        let appointments = dataStore_1.DataStore.appointments;
        if (doctorId) {
            appointments = appointments.filter((a) => a.doctorId === doctorId);
        }
        if (phcId) {
            appointments = appointments.filter((a) => a.phcId === phcId);
        }
        if (patientId) {
            appointments = appointments.filter((a) => a.patientId === patientId);
        }
        if (date) {
            appointments = appointments.filter((a) => a.date === date);
        }
        if (status) {
            appointments = appointments.filter((a) => a.status === status);
        }
        res.status(200).json({
            success: true,
            appointments,
            total: appointments.length,
        });
    }
    static async updateAppointmentStatus(req, res) {
        const { id } = req.params;
        const { status, consultationNotes, date, timeSlot } = req.body;
        const aptIndex = dataStore_1.DataStore.appointments.findIndex((a) => a.id === id || a.appointmentNumber === id);
        if (aptIndex === -1) {
            res.status(404).json({ success: false, message: 'Appointment not found.' });
            return;
        }
        const apt = dataStore_1.DataStore.appointments[aptIndex];
        if (status) {
            apt.status = status;
        }
        if (consultationNotes) {
            apt.consultationNotes = consultationNotes;
        }
        if (date) {
            apt.date = date;
        }
        if (timeSlot) {
            apt.timeSlot = timeSlot;
        }
        apt.updatedAt = new Date().toISOString();
        res.status(200).json({
            success: true,
            message: `Appointment updated successfully.`,
            appointment: apt,
        });
    }
    static async cancelAppointment(req, res) {
        const { id } = req.params;
        const aptIndex = dataStore_1.DataStore.appointments.findIndex((a) => a.id === id || a.appointmentNumber === id);
        if (aptIndex === -1) {
            res.status(404).json({ success: false, message: 'Appointment not found.' });
            return;
        }
        dataStore_1.DataStore.appointments[aptIndex].status = 'Cancelled';
        dataStore_1.DataStore.appointments[aptIndex].updatedAt = new Date().toISOString();
        res.status(200).json({
            success: true,
            message: 'Appointment cancelled successfully.',
            appointment: dataStore_1.DataStore.appointments[aptIndex],
        });
    }
    static async getAvailableSlots(req, res) {
        const { doctorId, date } = req.query;
        const standardSlots = [
            '09:00 AM',
            '09:30 AM',
            '10:00 AM',
            '10:30 AM',
            '11:00 AM',
            '11:30 AM',
            '12:00 PM',
            '12:30 PM',
            '02:00 PM',
            '02:30 PM',
            '03:00 PM',
            '03:30 PM',
        ];
        const booked = dataStore_1.DataStore.appointments
            .filter((a) => a.doctorId === doctorId && a.date === date && a.status !== 'Cancelled')
            .map((a) => a.timeSlot);
        const slots = standardSlots.map((slot) => ({
            time: slot,
            available: !booked.includes(slot),
        }));
        res.status(200).json({ success: true, doctorId, date, slots });
    }
}
exports.AppointmentController = AppointmentController;
