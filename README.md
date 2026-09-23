# 🏥 ArogyaMitra (PHC Connect) – Smart Primary Healthcare Platform

A comprehensive, full-stack digital primary healthcare platform for Public Health Centres (PHCs) and Community Health Centres (CHCs). Featuring multilingual AI triage, dynamic patient queueing, electronic health records (EHR), digital prescriptions, real-time pharmacy inventory tracking, and district-level surveillance analytics.

---

## 🏗️ Architecture & Monorepo Structure

```
.
├── apps/
│   ├── patient-mobile/      # Patient PWA & Multilingual Mobile Web App (Port 3000)
│   └── web-dashboard/       # Clinical & Administrative Web Portal (Port 3001)
├── services/
│   └── api/                 # REST API & AI Triage Engine (Port 5000)
├── packages/
│   └── types/               # Shared TypeScript data models & schemas
├── docs/                    # Database, Architecture & API Documentation
└── infrastructure/          # Dockerfiles and Docker Compose configs
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18+ (Node 20+ recommended)
- **npm**: v9+

### 2. Install Dependencies
From the repository root:
```bash
npm install
```

### 3. Run Development Servers
To start the **Backend API**, **Patient Mobile App**, and **Staff Dashboard** concurrently:

```bash
npm run dev
```

> **Note for Windows PowerShell Users:** If PowerShell blocks script execution (`npm.ps1 cannot be loaded`), run:
> ```powershell
> Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
> npm run dev
> ```
> Or use `cmd.exe /c npm run dev`.

Individual services can also be launched independently:
- **API Server** (Port 5000): `npm run dev:api`
- **Patient Mobile App** (Port 3000): `npm run dev:patient`
- **Clinical & Admin Dashboard** (Port 3001): `npm run dev:dashboard`

---

## 🌐 Web Applications & Default Access

| Portal | URL | Description | Default Accounts |
| :--- | :--- | :--- | :--- |
| **Patient Mobile Web** | `http://localhost:3000` | Multilingual AI triage, doctor discovery, booking & health records | Pre-loaded with demo patient (`pat-0001` / Aakash Jha) |
| **Doctor & Staff Portal** | `http://localhost:3001` | Live OPD queues, clinical assessments, and digital prescriptions | Quick 1-Click Demo Login (`Dr. Rajesh Verma`, `Dr. Priya Sharma`, etc.) |
| **Pharmacy & Formulary** | `http://localhost:3001` | Batch tracking, low-stock alerts, dispensing records | 1-Click Login (`Suresh Nair`, `Ramesh Kumar`) |
| **District Admin** | `http://localhost:3001` | Footfall analytics, epidemiological surveillance, roster | 1-Click Login (`Dr. Vandana Rao - Medical Officer In-Charge`) |
| **Backend REST API** | `http://localhost:5000` | Health check and REST endpoints (`/api/*`) | Endpoint documentation at `http://localhost:5000` |

---

## 🧪 Testing & Verification

Run the full automated unit and integration test suite:
```bash
npm run test
```

Build all workspaces for production:
```bash
npm run build
```

---

## 🛡️ Key Features & AI Safety

1. **Deterministic AI Triage Rules**: Immediate red-flag detection (chest pain, stroke signs, severe respiratory distress) with escalation to 108/112 emergency services.
2. **Offline-Resilient Architecture**: Robust fallback responses and client-side caching.
3. **Comprehensive EHR & Prescriptions**: Integrated vital tracking, ICD diagnoses, and formulary-verified prescriptions.
4. **Real-time Inventory Tracking**: Batch-level expiration dates and automated reorder alerts for essential medicines.
