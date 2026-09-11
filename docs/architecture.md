# PHC Connect (ArogyaMitra) – System Architecture

## 1. Executive Summary
**PHC Connect (ArogyaMitra)** is an intelligent primary healthcare management and clinical triage ecosystem tailored for Primary Health Centres (PHCs) and Community Health Centres (CHCs). It connects patients, doctors, pharmacists, and health administrators into a cohesive, secure digital network.

---

## 2. High-Level Architecture Diagram

```mermaid
graph TD
    subgraph Client Layer
        A[Patient Mobile Web App<br/>(Port 3000)]
        B[Doctor Clinical Workstation<br/>(Port 3001)]
        C[Pharmacist Dispensary Portal<br/>(Port 3001)]
        D[PHC Admin Analytics Dashboard<br/>(Port 3001)]
    end

    subgraph API & Gateway Layer
        E[REST API Gateway / Express Server<br/>(Port 5000)]
        F[Auth & RBAC Middleware]
        G[AI Clinical Triage Engine]
        H[PHC & Doctor Recommendation Service]
        I[Appointment & Queue State Machine]
        J[EHR & Consultation Service]
        K[Medicine Inventory & Dispensing]
        L[District Surveillance & Analytics]
    end

    subgraph Data & Storage Layer
        M[(PostgreSQL Database / Prisma ORM)]
        N[(In-Memory Seed Data Repository)]
    end

    A -->|REST / JSON| E
    B -->|REST / JSON| E
    C -->|REST / JSON| E
    D -->|REST / JSON| E

    E --> F
    F --> G & H & I & J & K & L
    G & H & I & J & K & L --> M & N
```

---

## 3. Monorepo Organization

```
/
├── apps/
│   ├── patient-mobile/     # Responsive patient application with dual mobile-frame & web modes
│   └── web-dashboard/      # Unified portal for Doctors, Pharmacists, and PHC Administrators
├── services/
│   └── api/                # REST API backend, AI Triage Engine, Prisma Schema, Seed Data
├── packages/
│   └── types/              # Shared TypeScript definitions, models, and interfaces
├── infrastructure/         # Docker Compose, Dockerfiles, and environment configurations
└── docs/                   # System architecture, API documentation, and database schemas
```

---

## 4. AI Clinical Triage & Safety Invariants

1. **Assistive Guidance Only**: The AI symptom triage system is an assistive decision-support tool, not a doctor.
2. **Emergency Red Flag Overrides**: If red flag symptoms (such as crushing chest pain, radiating left arm numbness, sudden speech difficulty, severe respiratory distress) are detected, the engine unconditionally sets risk level to `EMERGENCY` and triggers immediate 108/112 emergency calls.
3. **Multi-Factor Risk Scoring**: Evaluates symptom duration, pain acuity, patient age, preexisting chronic diseases (e.g. Diabetes, Hypertension, Asthma), and known drug allergies.
4. **Mandatory Disclaimer**: Every AI output includes a prominent clinical disclaimer.

---

## 5. Security & Privacy Guardrails

- **Role-Based Access Control (RBAC)**: Distinct permissions for `PATIENT`, `DOCTOR`, `PHARMACIST`, and `ADMIN`.
- **Read-Only Electronic Health Records**: Doctor-authored consultation notes and prescriptions cannot be altered by patients.
- **Privacy Partitioning**: Patients can only view whether a medicine is "In Stock" at a PHC, protecting sensitive warehouse quantity figures and supplier costs.
- **Audit Logging**: All medicine dispensing and status transitions are recorded with timestamps and operator credentials.
