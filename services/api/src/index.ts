import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';
import { DataStore } from './db/dataStore';
import { ChatSocketServer } from './services/chatSocketServer';

dotenv.config();

// Initialize in-memory repository with seed data
DataStore.initialize();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Real-time WebSocket & WebRTC signaling server
ChatSocketServer.initialize(server);

app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'HEALTHY',
    service: 'ArogyaMitra Backend API',
    timestamp: new Date().toISOString(),
    metrics: {
      phcsCount: DataStore.phcs.length,
      doctorsCount: DataStore.doctors.length,
      patientsCount: DataStore.patients.length,
      healthAssistantsCount: DataStore.healthAssistants.length,
      chatSessionsCount: DataStore.chatSessions.length,
      healthCampsCount: DataStore.healthCamps.length,
      emergencyAlertsCount: DataStore.emergencyPreAlerts.length,
      medicinesCount: DataStore.medicines.length,
      appointmentsCount: DataStore.appointments.length,
    },
  });
});

// Base API route
app.use('/api', apiRoutes);

// Fallback route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to ArogyaMitra – Smart Primary Healthcare Platform API',
    version: '1.0.0',
    documentation: '/api/health',
    endpoints: {
      auth: '/api/auth/*',
      patients: '/api/patients/*',
      assistants: '/api/assistants/*',
      emergencyAlerts: '/api/emergency-alerts/*',
      camps: '/api/camps/*',
      awareness: '/api/awareness/*',
      doctors: '/api/doctors/*',
      phcs: '/api/phcs/*',
      appointments: '/api/appointments/*',
      consultations: '/api/doctor/consultation',
      medicines: '/api/medicines/*',
      pharmacist: '/api/pharmacist/*',
      admin: '/api/admin/analytics',
      websocket: 'ws://localhost:5000/ws/chat',
    },
  });
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`🚀 ArogyaMitra API Server running on port ${PORT} (0.0.0.0)`);
    console.log(`🏥 Loaded ${DataStore.phcs.length} PHCs, ${DataStore.doctors.length} Doctors, ${DataStore.healthAssistants.length} Health Assistants`);
    console.log(`💬 Real-time WebSocket & WebRTC Calling active on /ws/chat`);
    console.log(`🌐 Social Awareness & On-Call Support Engines active`);
    console.log(`====================================================`);
  });
}

export { app, server };
export default app;

