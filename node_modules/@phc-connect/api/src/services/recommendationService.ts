import { PHC, DoctorProfile, TriageRiskLevel } from '@phc-connect/types';

export interface RecommendationParams {
  patientLat?: number | null;
  patientLon?: number | null;
  symptoms?: string[];
  riskLevel?: TriageRiskLevel;
  requiredMedicineNames?: string[];
  specializationNeeded?: string;
  allPhcs: PHC[];
  allDoctors: DoctorProfile[];
  allInventories: { phcId: string; medicineName: string; quantity: number }[];
}

export interface PHCRecommendationResult {
  phc: PHC;
  distanceKm: number;
  availableDoctors: DoctorProfile[];
  availableDoctorsCount: number;
  matchedMedicinesAvailable: string[];
  estimatedWaitMinutes: number;
  score: number;
  recommendationReason: string;
}

export class RecommendationService {
  /**
   * Calculates great-circle distance between two points on the earth in km
   */
  public static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  public static rankPHCs(params: RecommendationParams): PHCRecommendationResult[] {
    // Default reference coordinates if patient location not provided (e.g. Center of sample district)
    const refLat = params.patientLat ?? 28.6139;
    const refLon = params.patientLon ?? 77.209;

    const results: PHCRecommendationResult[] = params.allPhcs.map((phc) => {
      const distanceKm = this.calculateDistance(refLat, refLon, phc.latitude, phc.longitude);

      // Filter doctors at this PHC
      const phcDoctors = params.allDoctors.filter((d) => d.phcId === phc.id);
      const availableDoctors = phcDoctors.filter((d) => d.status === 'AVAILABLE');

      // Check medicine availability
      const phcStock = params.allInventories.filter((inv) => inv.phcId === phc.id && inv.quantity > 0);
      const matchedMeds: string[] = [];

      if (params.requiredMedicineNames && params.requiredMedicineNames.length > 0) {
        for (const reqMed of params.requiredMedicineNames) {
          const match = phcStock.find((inv) =>
            inv.medicineName.toLowerCase().includes(reqMed.toLowerCase())
          );
          if (match) {
            matchedMeds.push(match.medicineName);
          }
        }
      }

      // Calculate estimated wait time based on doctor count and status
      const totalDocs = phcDoctors.length;
      const activeDocs = availableDoctors.length;
      let estimatedWaitMinutes = 15;
      if (activeDocs === 0) {
        estimatedWaitMinutes = 45;
      } else if (activeDocs >= 2) {
        estimatedWaitMinutes = 10;
      }

      // Compute Ranking Score (Higher is better)
      // Factors: Proximity (heavy weight), Doctor Availability, Emergency Service readiness
      let score = 100 - distanceKm * 4; // closer is better

      if (availableDoctors.length > 0) {
        score += 25 * availableDoctors.length;
      }
      if (phc.emergencyServices) {
        score += params.riskLevel === 'HIGH' || params.riskLevel === 'EMERGENCY' ? 40 : 10;
      }
      if (matchedMeds.length > 0) {
        score += matchedMeds.length * 10;
      }

      let reason = 'Closest PHC with regular outpatient services';
      if (params.riskLevel === 'EMERGENCY' || params.riskLevel === 'HIGH') {
        if (phc.emergencyServices) {
          reason = '24/7 Emergency & Resuscitation equipped facility with highest medical priority';
        } else if (availableDoctors.length > 0) {
          reason = `Has ${availableDoctors.length} currently available doctor(s) on-site`;
        }
      } else if (availableDoctors.length > 0) {
        reason = `${availableDoctors.length} Medical Officer(s) on duty with minimal wait time`;
      }

      return {
        phc: {
          ...phc,
          distanceKm,
          availableDoctorsCount: availableDoctors.length,
          estimatedWaitMinutes,
        },
        distanceKm,
        availableDoctors,
        availableDoctorsCount: availableDoctors.length,
        matchedMedicinesAvailable: matchedMeds,
        estimatedWaitMinutes,
        score,
        recommendationReason: reason,
      };
    });

    // Sort by score descending (best match first)
    return results.sort((a, b) => b.score - a.score);
  }

  public static findNearestAvailableDoctors(
    patientLat?: number | null,
    patientLon?: number | null,
    allPhcs: PHC[] = [],
    allDoctors: DoctorProfile[] = []
  ): (DoctorProfile & { distanceKm: number; phc: PHC })[] {
    const refLat = patientLat ?? 28.6139;
    const refLon = patientLon ?? 77.209;

    const availableDocs = allDoctors.filter((d) => d.status === 'AVAILABLE');

    const mapped = availableDocs.map((doc) => {
      const phc = allPhcs.find((p) => p.id === doc.phcId) || {
        id: doc.phcId,
        name: doc.phcName || 'Primary Health Centre',
        latitude: refLat,
        longitude: refLon,
      } as PHC;

      const distanceKm = RecommendationService.calculateDistance(
        refLat,
        refLon,
        phc.latitude,
        phc.longitude
      );

      return {
        ...doc,
        distanceKm,
        phc,
      };
    });

    return mapped.sort((a, b) => a.distanceKm - b.distanceKm);
  }
}
