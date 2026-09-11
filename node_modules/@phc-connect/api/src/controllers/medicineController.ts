import { Request, Response } from 'express';
import { DataStore } from '../db/dataStore';

export class MedicineController {
  public static async getPublicMedicineCatalog(req: Request, res: Response): Promise<void> {
    const { search, category } = req.query;

    let medicines = DataStore.medicines;

    if (category) {
      medicines = medicines.filter((m) => m.category === category);
    }
    if (search) {
      const q = (search as string).toLowerCase();
      medicines = medicines.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.genericName.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q)
      );
    }

    // Map public availability per PHC
    const publicList = medicines.map((med) => {
      const phcAvailability = DataStore.phcs.map((phc) => {
        const inv = DataStore.inventories.find(
          (i) => i.medicineId === med.id && i.phcId === phc.id
        );
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

  public static async getCategories(req: Request, res: Response): Promise<void> {
    const categories = Array.from(new Set(DataStore.medicines.map((m) => m.category)));
    res.status(200).json({ success: true, categories });
  }
}
