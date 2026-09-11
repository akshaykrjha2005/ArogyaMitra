import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { PatientController } from '../controllers/patientController';
import { DoctorController } from '../controllers/doctorController';
import { PHCController } from '../controllers/phcController';
import { AppointmentController } from '../controllers/appointmentController';
import { ConsultationController } from '../controllers/consultationController';
import { PharmacistController } from '../controllers/pharmacistController';
import { MedicineController } from '../controllers/medicineController';
import { SymptomController } from '../controllers/symptomController';
import { AnalyticsController } from '../controllers/analyticsController';
import { NotificationController } from '../controllers/notificationController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// 1. Auth Endpoints
router.post('/auth/register', AuthController.registerPatient);
router.post('/auth/login', AuthController.login);
router.post('/auth/verify-otp', AuthController.verifyOtp);
router.get('/auth/me', authenticateToken, AuthController.getCurrentUser);

// 2. Patient Endpoints
router.get('/patients/me', authenticateToken, PatientController.getProfile);
router.get('/patients/me/records', authenticateToken, PatientController.getMedicalRecords);
router.get('/patients/me/appointments', authenticateToken, PatientController.getAppointments);
router.get('/patients', authenticateToken, PatientController.getAllPatients);
router.get('/patients/:id', authenticateToken, PatientController.getProfile);
router.put('/patients/:id', authenticateToken, PatientController.updateProfile);

// 3. AI Symptom Assessment Endpoints
router.post('/symptoms/assessment', SymptomController.assessSymptoms);
router.get('/symptoms/assessment/:id', SymptomController.getAssessmentById);
router.get('/symptoms/common', SymptomController.getCommonSymptoms);

// 4. PHC & Location Discovery Endpoints
router.get('/phcs/nearby', PHCController.getNearbyPHCs);
router.get('/phcs', PHCController.getAllPHCs);
router.get('/phcs/:id', PHCController.getPHCById);
router.get('/phcs/:id/doctors', PHCController.getPHCDoctors);

// 5. Doctor Endpoints
router.get('/doctors', DoctorController.getAllDoctors);
router.get('/doctors/available', DoctorController.getAvailableDoctors);
router.get('/doctors/:id', DoctorController.getDoctorProfile);
router.get('/doctors/:id/queue', authenticateToken, DoctorController.getDoctorQueue);
router.patch('/doctors/:id/availability', authenticateToken, DoctorController.updateAvailability);
router.get('/doctors/patient/:patientId', authenticateToken, DoctorController.getPatientConsultationDetails);

// 6. Appointment Endpoints
router.post('/appointments', authenticateToken, AppointmentController.bookAppointment);
router.get('/appointments', authenticateToken, AppointmentController.getAppointments);
router.get('/appointments/slots', AppointmentController.getAvailableSlots);
router.patch('/appointments/:id', authenticateToken, AppointmentController.updateAppointmentStatus);
router.delete('/appointments/:id', authenticateToken, AppointmentController.cancelAppointment);

// 7. Clinical Consultation & EHR Endpoints
router.post('/doctor/consultation', authenticateToken, ConsultationController.recordConsultation);
router.get('/records/:id', authenticateToken, ConsultationController.getRecordById);

// 8. Public Medicine Availability
router.get('/medicines/availability', MedicineController.getPublicMedicineCatalog);
router.get('/medicines/categories', MedicineController.getCategories);

// 9. Pharmacist & Inventory Endpoints
router.get('/pharmacist/overview', authenticateToken, PharmacistController.getInventoryOverview);
router.get('/pharmacist/inventory', authenticateToken, PharmacistController.getAllInventory);
router.post('/pharmacist/inventory', authenticateToken, PharmacistController.addMedicine);
router.patch('/pharmacist/inventory/:id', authenticateToken, PharmacistController.updateQuantity);
router.post('/pharmacist/dispense', authenticateToken, PharmacistController.dispenseMedicine);
router.get('/pharmacist/transactions', authenticateToken, PharmacistController.getTransactions);

// 10. PHC Admin Analytics
router.get('/admin/analytics', AnalyticsController.getAdminAnalytics);

// 11. Notifications
router.get('/notifications', authenticateToken, NotificationController.getNotifications);
router.patch('/notifications/:id/read', authenticateToken, NotificationController.markAsRead);

export default router;
