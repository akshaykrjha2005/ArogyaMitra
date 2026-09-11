import { Request, Response } from 'express';
import { DataStore } from '../db/dataStore';
import { TriageEngine } from '../ai/triageEngine';

export class SymptomController {
  public static async assessSymptoms(req: Request, res: Response): Promise<void> {
    try {
      const {
        patientId,
        symptoms,
        duration,
        severity,
        age,
        existingConditions,
        allergies,
        currentMedications,
        vitalSigns,
        uploadedPhotoUrl,
        photoDescription,
      } = req.body;

      if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
        res.status(400).json({
          success: false,
          message: 'At least one symptom is required for assessment.',
        });
        return;
      }

      // If patientId is provided, pull stored medical history to enrich assessment
      let patientConditions = existingConditions || [];
      let patientAllergies = allergies || [];
      let patientMeds = currentMedications || [];
      let patientAge = Number(age) || 30;

      if (patientId) {
        const patient = DataStore.patients.find((p) => p.id === patientId || p.patientId === patientId);
        if (patient) {
          patientAge = patient.age;
          if (!existingConditions) patientConditions = patient.existingConditions;
          if (!allergies) patientAllergies = patient.allergies;
          if (!currentMedications) patientMeds = patient.currentMedications;
        }
      }

      const assessment = TriageEngine.evaluate({
        patientId,
        symptoms,
        duration: duration || '1-2 days',
        severity: severity || 'Moderate',
        age: patientAge,
        existingConditions: patientConditions,
        allergies: patientAllergies,
        currentMedications: patientMeds,
        vitalSigns,
        uploadedPhotoUrl,
        photoDescription,
      });

      // Save assessment
      DataStore.symptomAssessments.unshift(assessment);

      // If critical/emergency, send high priority notification
      if (assessment.riskLevel === 'EMERGENCY' || assessment.riskLevel === 'HIGH') {
        DataStore.notifications.unshift({
          id: `notif-${Date.now()}`,
          patientId,
          title: assessment.riskLevel === 'EMERGENCY' ? '🚨 URGENT MEDICAL ADVISORY' : '⚠️ Consult a Doctor Soon',
          message: assessment.recommendedAction,
          type: 'CRITICAL_TRIAGE',
          read: false,
          createdAt: new Date().toISOString(),
        });
      }

      res.status(200).json({
        success: true,
        assessment,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getAssessmentById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const assessment = DataStore.symptomAssessments.find((a) => a.id === id);

    if (!assessment) {
      res.status(404).json({ success: false, message: 'Assessment not found.' });
      return;
    }

    res.status(200).json({ success: true, assessment });
  }

  public static async getCommonSymptoms(req: Request, res: Response): Promise<void> {
    const symptomBank = [
      { name: 'Fever / High Temperature', category: 'General' },
      { name: 'Persistent Cough / Phlegm', category: 'Respiratory' },
      { name: 'Throat Pain / Irritation', category: 'Respiratory' },
      { name: 'Shortness of Breath', category: 'Respiratory', redFlag: true },
      { name: 'Chest Pain / Tightness', category: 'Cardiac', redFlag: true },
      { name: 'Severe Headache / Migraine', category: 'Neurology' },
      { name: 'Dizziness / Vertigo', category: 'Neurology' },
      { name: 'Stomach Pain / Cramping', category: 'Digestive' },
      { name: 'Vomiting / Nausea', category: 'Digestive' },
      { name: 'Diarrhea / Loose Stools', category: 'Digestive' },
      { name: 'Skin Rash / Itching / Redness', category: 'Dermatology' },
      { name: 'Joint Pain / Knee Stiffness', category: 'Orthopedics' },
      { name: 'Burning Urination / Frequency', category: 'Urology' },
      { name: 'Body Ache / Generalized Fatigue', category: 'General' },
      { name: 'Eye Redness / Watery Discharge', category: 'Ophthalmology' },
    ];

    res.status(200).json({ success: true, symptoms: symptomBank });
  }
}
