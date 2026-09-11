"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicineController = void 0;
const dataStore_1 = require("../db/dataStore");
class MedicineController {
    static async getPublicMedicineCatalog(req, res) {
        const { search, category } = req.query;
        let medicines = dataStore_1.DataStore.medicines;
        if (category) {
            medicines = medicines.filter((m) => m.category === category);
        }
        if (search) {
            const q = search.toLowerCase();
            medicines = medicines.filter((m) => m.name.toLowerCase().includes(q) ||
                m.genericName.toLowerCase().includes(q) ||
                m.category.toLowerCase().includes(q));
        }
        // Map public availability per PHC
        const publicList = medicines.map((med) => {
            const phcAvailability = dataStore_1.DataStore.phcs.map((phc) => {
                const inv = dataStore_1.DataStore.inventories.find((i) => i.medicineId === med.id && i.phcId === phc.id);
                const isAvailable = !!inv && inv.quantity > 0;
                return {
                    phcId: phc.id,
                    phcName: phc.name,
                    phcType: phc.type,
                    district: phc.district,
                    status: isAvailable ? 'Available' : 'Out of Stock',
                    isAvailable,
                };
            });
            const totalPhcsAvailable = phcAvailability.filter((p) => p.isAvailable).length;
            return {
                id: med.id,
                name: med.name,
                genericName: med.genericName,
                category: med.category,
                strength: med.strength,
                form: med.form,
                isEssential: med.isEssential,
                overallStatus: totalPhcsAvailable > 0 ? 'Available at nearby PHCs' : 'Currently Unavailable',
                phcAvailability,
            };
        });
        res.status(200).json({
            success: true,
            medicines: publicList,
            total: publicList.length,
        });
    }
    static async getCategories(req, res) {
        const categories = Array.from(new Set(dataStore_1.DataStore.medicines.map((m) => m.category)));
        res.status(200).json({ success: true, categories });
    }
}
exports.MedicineController = MedicineController;
