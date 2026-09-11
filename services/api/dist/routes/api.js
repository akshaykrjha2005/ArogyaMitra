"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const patientController_1 = require("../controllers/patientController");
const doctorController_1 = require("../controllers/doctorController");
const phcController_1 = require("../controllers/phcController");
const appointmentController_1 = require("../controllers/appointmentController");
const consultationController_1 = require("../controllers/consultationController");
const pharmacistController_1 = require("../controllers/pharmacistController");
const medicineController_1 = require("../controllers/medicineController");
const symptomController_1 = require("../controllers/symptomController");
const analyticsController_1 = require("../controllers/analyticsController");
const notificationController_1 = require("../controllers/notificationController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// 1. Auth Endpoints
router.post('/auth/register', authController_1.AuthController.registerPatient);
router.post('/auth/login', authController_1.AuthController.login);
router.post('/auth/verify-otp', authController_1.AuthController.verifyOtp);
router.get('/auth/me', auth_1.authenticateToken, authController_1.AuthController.getCurrentUser);
// 2. Patient Endpoints
router.get('/patients/me', auth_1.authenticateToken, patientController_1.PatientController.getProfile);
router.get('/patients/me/records', auth_1.authenticateToken, patientController_1.PatientController.getMedicalRecords);
router.get('/patients/me/appointments', auth_1.authenticateToken, patientController_1.PatientController.getAppointments);
router.get('/patients', auth_1.authenticateToken, patientController_1.PatientController.getAllPatients);
router.get('/patients/:id', auth_1.authenticateToken, patientController_1.PatientController.getProfile);
router.put('/patients/:id', auth_1.authenticateToken, patientController_1.PatientController.updateProfile);
// 3. AI Symptom Assessment Endpoints
router.post('/symptoms/assessment', symptomController_1.SymptomController.assessSymptoms);
router.get('/symptoms/assessment/:id', symptomController_1.SymptomController.getAssessmentById);
router.get('/symptoms/common', symptomController_1.SymptomController.getCommonSymptoms);
// 4. PHC & Location Discovery Endpoints
router.get('/phcs/nearby', phcController_1.PHCController.getNearbyPHCs);
router.get('/phcs', phcController_1.PHCController.getAllPHCs);
router.get('/phcs/:id', phcController_1.PHCController.getPHCById);
router.get('/phcs/:id/doctors', phcController_1.PHCController.getPHCDoctors);
// 5. Doctor Endpoints
router.get('/doctors', doctorController_1.DoctorController.getAllDoctors);
router.get('/doctors/available', doctorController_1.DoctorController.getAvailableDoctors);
router.get('/doctors/:id', doctorController_1.DoctorController.getDoctorProfile);
router.get('/doctors/:id/queue', auth_1.authenticateToken, doctorController_1.DoctorController.getDoctorQueue);
router.patch('/doctors/:id/availability', auth_1.authenticateToken, doctorController_1.DoctorController.updateAvailability);
router.get('/doctors/patient/:patientId', auth_1.authenticateToken, doctorController_1.DoctorController.getPatientConsultationDetails);
// 6. Appointment Endpoints
router.post('/appointments', auth_1.authenticateToken, appointmentController_1.AppointmentController.bookAppointment);
router.get('/appointments', auth_1.authenticateToken, appointmentController_1.AppointmentController.getAppointments);
router.get('/appointments/slots', appointmentController_1.AppointmentController.getAvailableSlots);
router.patch('/appointments/:id', auth_1.authenticateToken, appointmentController_1.AppointmentController.updateAppointmentStatus);
router.delete('/appointments/:id', auth_1.authenticateToken, appointmentController_1.AppointmentController.cancelAppointment);
// 7. Clinical Consultation & EHR Endpoints
router.post('/doctor/consultation', auth_1.authenticateToken, consultationController_1.ConsultationController.recordConsultation);
router.get('/records/:id', auth_1.authenticateToken, consultationController_1.ConsultationController.getRecordById);
// 8. Public Medicine Availability
router.get('/medicines/availability', medicineController_1.MedicineController.getPublicMedicineCatalog);
router.get('/medicines/categories', medicineController_1.MedicineController.getCategories);
// 9. Pharmacist & Inventory Endpoints
router.get('/pharmacist/overview', auth_1.authenticateToken, pharmacistController_1.PharmacistController.getInventoryOverview);
router.get('/pharmacist/inventory', auth_1.authenticateToken, pharmacistController_1.PharmacistController.getAllInventory);
router.post('/pharmacist/inventory', auth_1.authenticateToken, pharmacistController_1.PharmacistController.addMedicine);
router.patch('/pharmacist/inventory/:id', auth_1.authenticateToken, pharmacistController_1.PharmacistController.updateQuantity);
router.post('/pharmacist/dispense', auth_1.authenticateToken, pharmacistController_1.PharmacistController.dispenseMedicine);
router.get('/pharmacist/transactions', auth_1.authenticateToken, pharmacistController_1.PharmacistController.getTransactions);
// 10. PHC Admin Analytics
router.get('/admin/analytics', analyticsController_1.AnalyticsController.getAdminAnalytics);
// 11. Notifications
router.get('/notifications', auth_1.authenticateToken, notificationController_1.NotificationController.getNotifications);
router.patch('/notifications/:id/read', auth_1.authenticateToken, notificationController_1.NotificationController.markAsRead);
exports.default = router;
