"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PHCController = void 0;
const dataStore_1 = require("../db/dataStore");
const recommendationService_1 = require("../services/recommendationService");
class PHCController {
    static async getAllPHCs(req, res) {
        const { district, emergency } = req.query;
        let phcs = dataStore_1.DataStore.phcs.map((phc) => {
            const phcDoctors = dataStore_1.DataStore.doctors.filter((d) => d.phcId === phc.id);
            const availableDocs = phcDoctors.filter((d) => d.status === 'AVAILABLE');
            const inStockMeds = dataStore_1.DataStore.inventories.filter((inv) => inv.phcId === phc.id && inv.quantity > 0);
            return {
                ...phc,
                availableDoctorsCount: availableDocs.length,
                totalDoctorsCount: phcDoctors.length,
                availableMedicinesCount: inStockMeds.length,
            };
        });
        if (district) {
            phcs = phcs.filter((p) => p.district.toLowerCase().includes(district.toLowerCase()));
        }
        if (emergency === 'true') {
            phcs = phcs.filter((p) => p.emergencyServices);
        }
        res.status(200).json({ success: true, phcs, total: phcs.length });
    }
    static async getNearbyPHCs(req, res) {
        try {
            const lat = req.query.lat ? parseFloat(req.query.lat) : 28.6139;
            const lon = req.query.lon ? parseFloat(req.query.lon) : 77.209;
            const riskLevel = req.query.riskLevel || 'LOW';
            const medicineQuery = req.query.medicine;
            const ranked = recommendationService_1.RecommendationService.rankPHCs({
                patientLat: lat,
                patientLon: lon,
                riskLevel,
                requiredMedicineNames: medicineQuery ? [medicineQuery] : [],
                allPhcs: dataStore_1.DataStore.phcs,
                allDoctors: dataStore_1.DataStore.doctors,
                allInventories: dataStore_1.DataStore.inventories.map((inv) => ({
                    phcId: inv.phcId,
                    medicineName: inv.medicine.name,
                    quantity: inv.quantity,
                })),
            });
            res.status(200).json({
                success: true,
                patientLocation: { latitude: lat, longitude: lon },
                recommendations: ranked,
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getPHCById(req, res) {
        const { id } = req.params;
        const phc = dataStore_1.DataStore.phcs.find((p) => p.id === id || p.code === id);
        if (!phc) {
            res.status(404).json({ success: false, message: 'PHC not found.' });
            return;
        }
        const doctors = dataStore_1.DataStore.doctors.filter((d) => d.phcId === phc.id);
        const availableDoctors = doctors.filter((d) => d.status === 'AVAILABLE');
        const inventories = dataStore_1.DataStore.inventories.filter((inv) => inv.phcId === phc.id);
        const inStockCount = inventories.filter((i) => i.quantity > 0).length;
        res.status(200).json({
            success: true,
            phc: {
                ...phc,
                availableDoctorsCount: availableDoctors.length,
                totalDoctorsCount: doctors.length,
                availableMedicinesCount: inStockCount,
            },
            doctors,
        });
    }
    static async getPHCDoctors(req, res) {
        const { id } = req.params;
        const doctors = dataStore_1.DataStore.doctors.filter((d) => d.phcId === id);
        res.status(200).json({ success: true, doctors, count: doctors.length });
    }
}
exports.PHCController = PHCController;
