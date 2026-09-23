# PHC Connect (ArogyaMitra) – REST API Reference

Base URL: `http://localhost:5000/api`

## Authentication & Profiles
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/auth/send-otp` | Generate & send 6-digit phone verification OTP | Public |
| `POST` | `/auth/verify-otp` | Verify 6-digit OTP code & log in or complete registration | Public |
| `POST` | `/auth/register` | Register new patient & generate Unique Patient ID (`PHC-PAT-2026-XXXX`) | Public |
| `POST` | `/auth/login` | Login with email/phone & role | Public |
| `GET` | `/auth/me` | Fetch currently authenticated user session | Authenticated |

## Patients & Medical Records (EHR)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/patients/me` | Get patient profile, allergies & chronic ailments | Patient |
| `GET` | `/patients/me/records` | Get tamper-proof doctor EHR clinical records | Patient |
| `GET` | `/patients/me/appointments` | Get appointments for the logged-in patient | Patient |
| `GET` | `/patients` | Search all patients (for clinic check-in) | Staff |

## AI Symptom Assessment & Triage
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/symptoms/assessment` | Run AI triage with multi-factor risk scoring & photo analysis | Public / Patient |
| `GET` | `/symptoms/assessment/:id` | Get specific symptom assessment breakdown | Public / Patient |
| `GET` | `/symptoms/common` | Fetch symptom list and red flag indicators | Public |

## PHC & Location Discovery
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/phcs/nearby?lat={lat}&lon={lon}` | Discover and rank nearby PHCs using GPS coordinates | Public |
| `GET` | `/phcs` | List all PHCs and CHCs in the directory | Public |
| `GET` | `/phcs/:id` | Get detailed PHC profile, departments & doctors | Public |

## Doctors & Clinical Workstation
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/doctors` | List all doctors with specialization & status | Public |
| `GET` | `/doctors/available` | List all doctors currently marked `AVAILABLE` | Public |
| `GET` | `/doctors/:id/queue` | Doctor's active waiting queue & stats | Doctor |
| `PATCH` | `/doctors/:id/availability` | Update duty status (`AVAILABLE`, `BUSY`, etc.) | Doctor |
| `POST` | `/doctor/consultation` | Record clinical notes, diagnosis, prescriptions & EHR | Doctor |

## Appointments
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/appointments` | Book appointment and receive queue token number | Patient / Staff |
| `GET` | `/appointments` | Filter appointments by date, doctor, or status | Authenticated |
| `GET` | `/appointments/slots` | Get real-time doctor available time slots | Public |
| `PATCH` | `/appointments/:id` | Check-in or update status | Authenticated |
| `DELETE` | `/appointments/:id` | Cancel appointment | Authenticated |

## Pharmacy & Medicine Inventory
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/medicines/availability` | Public medicine search across PHC dispensaries | Public |
| `GET` | `/pharmacist/overview` | Pharmacist KPI dashboard & low stock alerts | Pharmacist |
| `GET` | `/pharmacist/inventory` | Complete batch inventory list | Pharmacist |
| `POST` | `/pharmacist/inventory` | Add new medicine batch | Pharmacist |
| `POST` | `/pharmacist/dispense` | Dispense medicine and decrement inventory quantity | Pharmacist |

## Administration & Surveillance
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/admin/analytics` | Executive statistics, footfall trends & symptom charts | Admin |
| `GET` | `/notifications` | Fetch user alerts & appointment notifications | Authenticated |
