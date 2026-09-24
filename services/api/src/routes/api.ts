import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { PatientController } from '../controllers/patientController';
import { DoctorController } from '../controllers/doctorController';
import { PHCController } from '../controllers/phcController';
import { AppointmentController } from '../controllers/appointmentController';
import { ConsultationController } from '../controllers/consultationController';
import { PharmacistController } from '../controllers/pharmacistController';
import { ReceptionistController } from '../controllers/receptionistController';
import { MedicineController } from '../controllers/medicineController';
import { AnalyticsController } from '../controllers/analyticsController';
import { NotificationController } from '../controllers/notificationController';
import { ComplaintController } from '../controllers/complaintController';
import { CallController } from '../controllers/callController';
import { HealthAssistantController } from '../controllers/healthAssistantController';
import { SupportTicketController } from '../controllers/supportTicketController';
import { SharedNotesController } from '../controllers/sharedNotesController';
import { TimelineController } from '../controllers/timelineController';
import { AwarenessController } from '../controllers/awarenessController';
import { HealthCampController } from '../controllers/healthCampController';
import { EmergencyAlertController } from '../controllers/emergencyAlertController';
import { FollowUpController } from '../controllers/followUpController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// 1. Auth Endpoints
router.post('/auth/send-otp', AuthController.sendOtp);
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
router.get('/patients/:id/records', authenticateToken, PatientController.getMedicalRecords);
router.get('/patients/:id/appointments', authenticateToken, PatientController.getAppointments);
router.put('/patients/:id', authenticateToken, PatientController.updateProfile);
router.get('/patients/:id/timeline', authenticateToken, TimelineController.getPatientTimeline);

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

// 8. Receptionist & Pre-Consultation Endpoints
router.get('/receptionist/overview', authenticateToken, ReceptionistController.getOverview);
router.get('/receptionist/patients', authenticateToken, ReceptionistController.searchPatients);
router.post('/receptionist/patient', authenticateToken, ReceptionistController.registerPatient);
router.post('/receptionist/checkup', authenticateToken, ReceptionistController.recordCheckup);
router.get('/receptionist/checkups', authenticateToken, ReceptionistController.getCheckups);

// 9. Public Medicine Availability
router.get('/medicines/availability', MedicineController.getPublicMedicineCatalog);
router.get('/medicines/categories', MedicineController.getCategories);

// 10. Pharmacist & Inventory Endpoints
router.get('/pharmacist/overview', authenticateToken, PharmacistController.getInventoryOverview);
router.get('/pharmacist/inventory', authenticateToken, PharmacistController.getAllInventory);
router.post('/pharmacist/inventory', authenticateToken, PharmacistController.addMedicine);
router.patch('/pharmacist/inventory/:id', authenticateToken, PharmacistController.updateQuantity);
router.post('/pharmacist/dispense', authenticateToken, PharmacistController.dispenseMedicine);
router.get('/pharmacist/transactions', authenticateToken, PharmacistController.getTransactions);

// 11. PHC Admin Analytics
router.get('/admin/analytics', AnalyticsController.getAdminAnalytics);

// 12. Notifications
router.get('/notifications', authenticateToken, NotificationController.getNotifications);
router.patch('/notifications/:id/read', authenticateToken, NotificationController.markAsRead);

// 13. Grievances & Complaints Endpoints
router.post('/complaints', authenticateToken, ComplaintController.createComplaint);
router.get('/complaints/my', authenticateToken, ComplaintController.getMyComplaints);
router.get('/complaints/all', authenticateToken, ComplaintController.getAllComplaints);
router.get('/complaints', authenticateToken, ComplaintController.getAllComplaints);
router.get('/complaints/:id', authenticateToken, ComplaintController.getComplaintById);
router.patch('/complaints/:id/status', authenticateToken, ComplaintController.updateStatus);
router.patch('/complaints/:id/assign', authenticateToken, ComplaintController.assignComplaint);
router.post('/complaints/:id/reply', authenticateToken, ComplaintController.addReply);

// 14. Call Services, Telephony & Callback Endpoints
router.get('/call/helplines', CallController.getHelplines);
router.post('/call/callbacks', CallController.requestCallback);
router.get('/call/callbacks', authenticateToken, CallController.getCallbackQueue);
router.get('/call/callbacks/my', authenticateToken, CallController.getMyCallbacks);
router.get('/call/callbacks/:id', authenticateToken, CallController.getCallbackById);
router.patch('/call/callbacks/:id/status', authenticateToken, CallController.updateCallbackStatus);
router.post('/call/initiate', authenticateToken, CallController.initiateCall);
router.get('/call/session/:sessionId', CallController.getCallSession);
router.post('/call/session/:sessionId/hangup', CallController.hangupCall);
router.get('/call/logs', authenticateToken, CallController.getCallLogs);
router.post('/call/logs', authenticateToken, CallController.recordCallLog);

// 15. Human Health Assistant & Real-Time Chat Endpoints
router.get('/assistants', HealthAssistantController.getAllAssistants);
router.get('/assistants/available', HealthAssistantController.getAvailableAssistants);
router.patch('/assistants/:id/status', authenticateToken, HealthAssistantController.updateStatus);
router.post('/assistants/route', authenticateToken, HealthAssistantController.routeToAssistant);
router.get('/assistants/chat/sessions', authenticateToken, HealthAssistantController.getChatSessions);
router.get('/assistants/chat/sessions/:sessionId', authenticateToken, HealthAssistantController.getSessionDetails);
router.post('/assistants/chat/sessions/:sessionId/messages', authenticateToken, HealthAssistantController.sendMessage);
router.patch('/assistants/chat/sessions/:sessionId/read', authenticateToken, HealthAssistantController.markAsRead);
router.post('/assistants/chat/upload', HealthAssistantController.uploadAttachment);
router.patch('/assistants/chat/sessions/:sessionId/close', authenticateToken, HealthAssistantController.closeSession);
router.post('/assistants/chat/sessions/:sessionId/escalate-doctor', authenticateToken, HealthAssistantController.escalateToDoctor);

// 16. On-Call Support Tickets & Shared Care Notes Endpoints
router.post('/support/tickets', authenticateToken, SupportTicketController.createTicket);
router.get('/support/tickets', authenticateToken, SupportTicketController.getTickets);
router.get('/support/tickets/patient/:patientId', authenticateToken, SupportTicketController.getPatientTickets);
router.get('/support/tickets/:id', authenticateToken, SupportTicketController.getTicketById);
router.patch('/support/tickets/:id', authenticateToken, SupportTicketController.updateTicket);
router.post('/support/tickets/:id/resolve', authenticateToken, SupportTicketController.resolveTicket);
router.get('/support/quick-replies', SupportTicketController.getQuickReplies);
router.get('/support/shared-notes/:sessionId', authenticateToken, SharedNotesController.getSharedNotes);
router.put('/support/shared-notes/:sessionId', authenticateToken, SharedNotesController.saveSharedNotes);

// 17. Social Health Awareness & Public Education Endpoints
router.get('/awareness', AwarenessController.getAwarenessItems);
router.get('/awareness/alerts/active', AwarenessController.getActiveAlerts);
router.get('/awareness/:id', AwarenessController.getAwarenessItemById);
router.post('/awareness', authenticateToken, AwarenessController.createAwarenessItem);
router.put('/awareness/:id', authenticateToken, AwarenessController.updateAwarenessItem);
router.patch('/awareness/:id/publish', authenticateToken, AwarenessController.togglePublishStatus);
router.delete('/awareness/:id', authenticateToken, AwarenessController.deleteAwarenessItem);
router.post('/awareness/:id/share', AwarenessController.shareAwarenessItem);
router.post('/awareness/:id/like', AwarenessController.likeAwarenessItem);

// 18. Health Camp & Community Outreach Endpoints
router.get('/camps', HealthCampController.getAllCamps);
router.get('/camps/analytics', HealthCampController.getCampAnalytics);
router.get('/camps/registrations/my', authenticateToken, HealthCampController.getMyRegistrations);
router.get('/camps/:id', HealthCampController.getCampById);
router.post('/camps', authenticateToken, HealthCampController.createCamp);
router.put('/camps/:id', authenticateToken, HealthCampController.updateCamp);
router.post('/camps/:id/register', authenticateToken, HealthCampController.registerForCamp);
router.get('/camps/:id/registrations', authenticateToken, HealthCampController.getCampRegistrations);
router.patch('/camps/:id/registrations/:regId/attendance', authenticateToken, HealthCampController.updateAttendance);
router.post('/camps/:id/outcome', authenticateToken, HealthCampController.recordOutcome);
router.post('/camps/:id/reminders', authenticateToken, HealthCampController.sendCampReminders);

// 19. Emergency Pre-Alert & Casualty Inbound Triage Endpoints
router.get('/emergency-alerts', EmergencyAlertController.getAllAlerts);
router.get('/emergency-alerts/analytics/metrics', EmergencyAlertController.getMetrics);
router.get('/emergency-alerts/active/facility/:facilityId', EmergencyAlertController.getActiveFacilityAlerts);
router.get('/emergency-alerts/:id', EmergencyAlertController.getAlertById);
router.post('/emergency-alerts', authenticateToken, EmergencyAlertController.raiseEmergencyAlert);
router.post('/emergency-alerts/:id/acknowledge', authenticateToken, EmergencyAlertController.acknowledgeAlert);
router.patch('/emergency-alerts/:id/status', authenticateToken, EmergencyAlertController.updateAlertStatus);
router.post('/emergency-alerts/:id/instructions', authenticateToken, EmergencyAlertController.updateInstructions);

// 20. Patient Follow-up & Shared Continuity Tracking Endpoints
router.get('/follow-ups', authenticateToken, FollowUpController.getAllFollowUps);
router.get('/follow-ups/analytics/metrics', authenticateToken, FollowUpController.getMetrics);
router.get('/follow-ups/export/csv', FollowUpController.exportCsv);
router.get('/follow-ups/patient/:patientId', authenticateToken, FollowUpController.getPatientFollowUpHistory);
router.get('/follow-ups/:id', authenticateToken, FollowUpController.getFollowUpById);
router.post('/follow-ups', authenticateToken, FollowUpController.logFollowUp);
router.post('/follow-ups/referrals', authenticateToken, FollowUpController.createReferral);
router.patch('/follow-ups/referrals/:id/treatment-status', authenticateToken, FollowUpController.updateTreatmentStatus);
router.post('/follow-ups/reminders/trigger', authenticateToken, FollowUpController.triggerDueReminders);

export default router;


