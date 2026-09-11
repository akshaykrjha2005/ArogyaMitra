"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const api_1 = __importDefault(require("./routes/api"));
const dataStore_1 = require("./db/dataStore");
dotenv_1.default.config();
// Initialize in-memory repository with seed data
dataStore_1.DataStore.initialize();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: false,
}));
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
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
        service: 'PHC Connect (ArogyaMitra) Backend API',
        timestamp: new Date().toISOString(),
        metrics: {
            phcsCount: dataStore_1.DataStore.phcs.length,
            doctorsCount: dataStore_1.DataStore.doctors.length,
            patientsCount: dataStore_1.DataStore.patients.length,
            medicinesCount: dataStore_1.DataStore.medicines.length,
            appointmentsCount: dataStore_1.DataStore.appointments.length,
        },
    });
});
// Base API route
app.use('/api', api_1.default);
// Fallback route
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Welcome to PHC Connect – Smart Primary Healthcare Platform API',
        version: '1.0.0',
        documentation: '/api/health',
        endpoints: {
            auth: '/api/auth/*',
            patients: '/api/patients/*',
            doctors: '/api/doctors/*',
            phcs: '/api/phcs/*',
            appointments: '/api/appointments/*',
            symptoms: '/api/symptoms/*',
            consultations: '/api/doctor/consultation',
            medicines: '/api/medicines/*',
            pharmacist: '/api/pharmacist/*',
            admin: '/api/admin/analytics',
        },
    });
});
// Start server
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`====================================================`);
        console.log(`🚀 PHC Connect API Server running on port ${PORT}`);
        console.log(`🏥 Loaded ${dataStore_1.DataStore.phcs.length} PHCs, ${dataStore_1.DataStore.doctors.length} Doctors, ${dataStore_1.DataStore.medicines.length} Medicines`);
        console.log(`🩺 AI Triage & Safety Engine active`);
        console.log(`====================================================`);
    });
}
exports.default = app;
