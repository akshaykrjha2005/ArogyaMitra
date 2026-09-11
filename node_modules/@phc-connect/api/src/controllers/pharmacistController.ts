import { Request, Response } from 'express';
import { DataStore } from '../db/dataStore';
import { AuthRequest } from '../middleware/auth';
import { MedicineInventory, MedicineTransaction, Medicine } from '@phc-connect/types';

export class PharmacistController {
  public static async getInventoryOverview(req: AuthRequest, res: Response): Promise<void> {
    const phcId = (req.query.phcId as string) || req.user?.phcId || 'phc-001';
    const phc = DataStore.phcs.find((p) => p.id === phcId);

    const inventories = DataStore.inventories.filter((inv) => inv.phcId === phcId);

    const totalMedicines = inventories.length;
    const inStock = inventories.filter((i) => i.quantity > i.minimumStockLevel).length;
    const lowStock = inventories.filter((i) => i.quantity > 0 && i.quantity <= i.minimumStockLevel);
    const outOfStock = inventories.filter((i) => i.quantity === 0);

    // Expiring within 90 days
    const now = new Date();
    const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const expiringSoon = inventories.filter((i) => {
      const exp = new Date(i.expiryDate);
      return exp <= ninetyDays && i.quantity > 0;
    });

    res.status(200).json({
      success: true,
      phcName: phc?.name || 'Central PHC Dispensary',
      phcId,
      metrics: {
        totalMedicines,
        inStockCount: inStock,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
        expiringSoonCount: expiringSoon.length,
      },
      lowStockAlerts: lowStock,
      outOfStockAlerts: outOfStock,
      expiringSoonAlerts: expiringSoon,
      inventories,
    });
  }

  public static async getAllInventory(req: Request, res: Response): Promise<void> {
    const { phcId, category, search, status } = req.query;

    let inventories = DataStore.inventories;

    if (phcId) {
      inventories = inventories.filter((i) => i.phcId === phcId);
    }
    if (category) {
      inventories = inventories.filter((i) => i.medicine.category === category);
    }
    if (status) {
      inventories = inventories.filter((i) => i.status === status);
    }
    if (search) {
      const q = (search as string).toLowerCase();
      inventories = inventories.filter(
        (i) =>
          i.medicine.name.toLowerCase().includes(q) ||
          i.medicine.genericName.toLowerCase().includes(q) ||
          i.batchNumber.toLowerCase().includes(q)
      );
    }

    res.status(200).json({
      success: true,
      inventories,
      total: inventories.length,
    });
  }

  public static async addMedicine(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        name,
        genericName,
        category,
        strength,
        form,
        description,
        manufacturer,
        phcId,
        quantity,
        minimumStockLevel,
        batchNumber,
        expiryDate,
        supplier,
        costPerUnit,
      } = req.body;

      if (!name || !genericName || !category || !quantity || !batchNumber) {
        res.status(400).json({
          success: false,
          message: 'Medicine name, generic name, category, quantity, and batch number are required.',
        });
        return;
      }

      const targetPhcId = phcId || req.user?.phcId || 'phc-001';
      const medId = `med-${Date.now()}`;

      const newMedicine: Medicine = {
        id: medId,
        name,
        genericName,
        category,
        strength: strength || '500mg',
        form: form || 'Tablet',
        description: description || '',
        manufacturer: manufacturer || 'Jan Aushadhi Depot',
        isEssential: true,
      };

      DataStore.medicines.push(newMedicine);

      const qty = Number(quantity);
      const minStock = Number(minimumStockLevel) || 50;

      let status: 'In Stock' | 'Low Stock' | 'Out of Stock' = 'In Stock';
      if (qty === 0) status = 'Out of Stock';
      else if (qty <= minStock) status = 'Low Stock';

      const newInventory: MedicineInventory = {
        id: `inv-${targetPhcId}-${medId}`,
        medicineId: medId,
        phcId: targetPhcId,
        medicine: newMedicine,
        quantity: qty,
        minimumStockLevel: minStock,
        batchNumber,
        expiryDate: expiryDate || '2028-12-31',
        supplier: supplier || 'State Medical Services Corporation',
        costPerUnit: Number(costPerUnit) || 5.0,
        status,
        updatedAt: new Date().toISOString(),
      };

      DataStore.inventories.push(newInventory);

      // Record transaction
      DataStore.transactions.unshift({
        id: `txn-${Date.now()}`,
        medicineId: medId,
        medicineName: name,
        phcId: targetPhcId,
        type: 'RESTOCKED',
        quantity: qty,
        dispensedBy: req.user?.fullName || 'Lead Pharmacist',
        batchNumber,
        notes: 'Initial stock entry / restock',
        timestamp: new Date().toISOString(),
      });

      res.status(201).json({
        success: true,
        message: 'Medicine and batch added to inventory successfully.',
        inventory: newInventory,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async updateQuantity(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { quantity, minimumStockLevel, expiryDate, notes } = req.body;

    const invIndex = DataStore.inventories.findIndex((i) => i.id === id);
    if (invIndex === -1) {
      res.status(404).json({ success: false, message: 'Inventory item not found.' });
      return;
    }

    const inv = DataStore.inventories[invIndex];
    const prevQty = inv.quantity;
    const newQty = quantity !== undefined ? Number(quantity) : inv.quantity;

    inv.quantity = newQty;
    if (minimumStockLevel !== undefined) {
      inv.minimumStockLevel = Number(minimumStockLevel);
    }
    if (expiryDate) {
      inv.expiryDate = expiryDate;
    }

    if (inv.quantity === 0) inv.status = 'Out of Stock';
    else if (inv.quantity <= inv.minimumStockLevel) inv.status = 'Low Stock';
    else inv.status = 'In Stock';

    inv.updatedAt = new Date().toISOString();

    // Log transaction
    const diff = newQty - prevQty;
    if (diff !== 0) {
      DataStore.transactions.unshift({
        id: `txn-${Date.now()}`,
        medicineId: inv.medicineId,
        medicineName: inv.medicine.name,
        phcId: inv.phcId,
        type: diff > 0 ? 'RESTOCKED' : 'ADJUSTMENT',
        quantity: Math.abs(diff),
        dispensedBy: req.user?.fullName || 'Pharmacist',
        batchNumber: inv.batchNumber,
        notes: notes || `Stock updated from ${prevQty} to ${newQty}`,
        timestamp: new Date().toISOString(),
      });
    }

    res.status(200).json({
      success: true,
      message: 'Inventory updated successfully.',
      inventory: inv,
    });
  }

  public static async dispenseMedicine(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        inventoryId,
        quantity,
        patientId,
        patientName,
        prescriptionId,
        notes,
      } = req.body;

      if (!inventoryId || !quantity) {
        res.status(400).json({
          success: false,
          message: 'Inventory ID and dispensing quantity are required.',
        });
        return;
      }

      const invIndex = DataStore.inventories.findIndex((i) => i.id === inventoryId);
      if (invIndex === -1) {
        res.status(404).json({ success: false, message: 'Medicine batch not found.' });
        return;
      }

      const inv = DataStore.inventories[invIndex];
      const dispenseQty = Number(quantity);

      if (inv.quantity < dispenseQty) {
        res.status(400).json({
          success: false,
          message: `Insufficient stock. Requested: ${dispenseQty}, Available: ${inv.quantity}`,
        });
        return;
      }

      inv.quantity -= dispenseQty;
      if (inv.quantity === 0) inv.status = 'Out of Stock';
      else if (inv.quantity <= inv.minimumStockLevel) inv.status = 'Low Stock';
      else inv.status = 'In Stock';
      inv.updatedAt = new Date().toISOString();

      const txn: MedicineTransaction = {
        id: `txn-${Date.now()}`,
        medicineId: inv.medicineId,
        medicineName: inv.medicine.name,
        phcId: inv.phcId,
        type: 'DISPENSED',
        quantity: dispenseQty,
        patientId: patientId || null,
        patientName: patientName || 'Walk-in Patient',
        prescriptionId: prescriptionId || null,
        dispensedBy: req.user?.fullName || 'Dispensary Pharmacist',
        batchNumber: inv.batchNumber,
        notes: notes || 'Dispensed as per prescription',
        timestamp: new Date().toISOString(),
      };

      DataStore.transactions.unshift(txn);

      res.status(200).json({
        success: true,
        message: `Successfully dispensed ${dispenseQty} unit(s) of ${inv.medicine.name}.`,
        inventory: inv,
        transaction: txn,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getTransactions(req: AuthRequest, res: Response): Promise<void> {
    const phcId = (req.query.phcId as string) || req.user?.phcId;
    let txns = DataStore.transactions;

    if (phcId) {
      txns = txns.filter((t) => t.phcId === phcId);
    }

    res.status(200).json({ success: true, transactions: txns, total: txns.length });
  }
}
