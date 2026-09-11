import { Request, Response } from 'express';
import { DataStore } from '../db/dataStore';
import { RecommendationService } from '../services/recommendationService';

export class PHCController {
  public static async getAllPHCs(req: Request, res: Response): Promise<void> {
    const { district, emergency } = req.query;

    let phcs = DataStore.phcs.map((phc) => {
      const phcDoctors = DataStore.doctors.filter((d) => d.phcId === phc.id);
      const availableDocs = phcDoctors.filter((d) => d.status === 'AVAILABLE');
      const inStockMeds = DataStore.inventories.filter((inv) => inv.phcId === phc.id && inv.quantity > 0);

      return {
        ...phc,
        availableDoctorsCount: availableDocs.length,
        totalDoctorsCount: phcDoctors.length,
        availableMedicinesCount: inStockMeds.length,
      };
    });

    if (district) {
      phcs = phcs.filter((p) => p.district.toLowerCase().includes((district as string).toLowerCase()));
    }
    if (emergency === 'true') {
      phcs = phcs.filter((p) => p.emergencyServices);
    }

    res.status(200).json({ success: true, phcs, total: phcs.length });
  }

  public static async getNearbyPHCs(req: Request, res: Response): Promise<void> {
    try {
      const lat = req.query.lat ? parseFloat(req.query.lat as string) : 28.6139;
      const lon = req.query.lon ? parseFloat(req.query.lon as string) : 77.209;
      const riskLevel = (req.query.riskLevel as any) || 'LOW';
      const medicineQuery = req.query.medicine as string;

      const ranked = RecommendationService.rankPHCs({
        patientLat: lat,
        patientLon: lon,
        riskLevel,
        requiredMedicineNames: medicineQuery ? [medicineQuery] : [],
        allPhcs: DataStore.phcs,
        allDoctors: DataStore.doctors,
        allInventories: DataStore.inventories.map((inv) => ({
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
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getPHCById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const phc = DataStore.phcs.find((p) => p.id === id || p.code === id);

    if (!phc) {
      res.status(404).json({ success: false, message: 'PHC not found.' });
      return;
    }

    const doctors = DataStore.doctors.filter((d) => d.phcId === phc.id);
    const availableDoctors = doctors.filter((d) => d.status === 'AVAILABLE');
    const inventories = DataStore.inventories.filter((inv) => inv.phcId === phc.id);
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

  public static async getPHCDoctors(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const doctors = DataStore.doctors.filter((d) => d.phcId === id);
    res.status(200).json({ success: true, doctors, count: doctors.length });
  }
}
