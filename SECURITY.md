# 🛡️ SevaSaathi Security & Privacy Architecture (Compliance One-Pager)

**UP Manav Sampada eHRMS AI Assistant**  
*Document Version: 1.0.0 · Classification: Public Security & Compliance Disclosure*

---

## 1. Zero-PII Privacy Architecture & Data Flow

SevaSaathi enforces a strict **Local-First Privacy Architecture** designed for high-security government HR applications. Personal Identifiable Information (PII) is **never** passed to third-party Large Language Model (LLM) providers. All identity validation, policy rules evaluations, and read-only records access remain strictly on government-controlled server infrastructure.

```
       ┌────────────────────────────────────────────────────────┐
       │               USER / EMPLOYEE (Client)                 │
       └───────────────────────────┬────────────────────────────┘
                                   │
                                   │ HTTPS / Encrypted Session
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │              ON-PREMISE SERVER BOUNDARY                │
       │                                                        │
       │  • Intent Parser & Keyword Gatekeeper                  │
       │  • Deterministic Rules Engine (lib/rulesEngine.js)     │
       │  • Encrypted Vercel KV / Redis Employee Data Store    │
       │  • PII Stripping & Anonymizer Middleware               │
       └───────┬────────────────────────────────────────┬───────┘
               │                                        │
    Local Interception                        Anonymized Derived
  (0 Bytes External Sent)                        Payload Only
               │                                        │
               ▼                                        ▼
┌─────────────────────────────┐        ┌─────────────────────────────┐
│    LOCAL RESPONSE ENGINE    │        │      LLM API PROVIDER       │
│                             │        │       (gpt-4o-mini)         │
│ • Service Book Details      │        │                             │
│ • Property Return Records   │        │ Payload Sent:               │
│ • Complaints & Vigilance    │        │ • leave_type: "casual"      │
│ • Colleague PII Refusals    │        │ • days_requested: 3         │
│                             │        │ • current_balance: 8        │
│                             │        │ • eligible: true            │
│                             │        │ • posting_category: "RURAL" │
│                             │        │ (Zero PII / Names / IDs)    │
└─────────────────────────────┘        └─────────────────────────────┘
```

---

## 2. Explicit Data Classification Matrix

| Data Field / Module | Destination | Handling Policy |
| :--- | :--- | :--- |
| **Employee Name** (`Ravi Kumar`, `Sunita Verma`, etc.) | 🔒 **Local Server Only** | Stripped before AI processing |
| **eHRMS Employee ID** (`UP-EHRMS-88213`) | 🔒 **Local Server Only** | Never transmitted externally |
| **Department & District** (`Basic Education`, `Sitapur`) | 🔒 **Local Server Only** | Kept on-premise for routing |
| **Service Book Records** (Joining date, postings) | 🔒 **Local Server Only** | Handled by local response engine |
| **Property Return Details** (Asset values & locations) | 🔒 **Local Server Only** | Strictly confidential; local only |
| **Disciplinary & Complaints Records** | 🔒 **Local Server Only** | Handled locally; zero AI exposure |
| **Uploaded Medical Certificates** (PDF / Images) | 🔒 **Local Server Only** | Processed server-side; not sent to AI |
| **Colleague Identity Queries** (Salary, bank accounts) | 🚫 **Blocked at Gate** | Intercepted & refused locally |
| **Anonymized Leave Parameters** (type, days, balance) | 🌐 **LLM API Provider** | Sanitized derived payload only |

---

## 3. Production Deployment & Model Sovereignty Path

### Current Prototype Stage
- Uses OpenAI API (`gpt-4o-mini`) strictly as an external natural language synthesizer.
- Derived payloads sent to OpenAI contain **zero identity markers** (no names, IDs, addresses, or document images).
- Governed under OpenAI API data privacy terms (API inputs are **not** used for model training).

### Production Roadmap & Government Cloud Swap
For full state-wide deployment across Uttar Pradesh:
1. **Self-Hosted LLM Deployment**: Replace external LLM API with an on-premise, fine-tuned open model (e.g., Llama-3-70B / Mistral) hosted inside **NIC (National Informatics Centre) Data Centres** or **MeitY-empaneled Government Cloud (GI Cloud / MeghRaj)**.
2. **Bhashini Integration**: Direct integration with Digital India's **BHASHINI AI** for official multi-dialect voice and translation support across Hindi, Awadhi, Bhojpuri, and Bundelkhandi.

---

## 4. Live Verification & Audit Trail

Every interaction—whether resolved locally with 0 bytes sent externally or via an anonymized AI call—is recorded in real-time in the compliance audit log.

- **Empirical Audit Evidence**: Inspect the live log at [`/audit`](https://sevasaathi-amber.vercel.app/audit)
- **JSON Payload Inspection**: Every entry visibly displays the exact JSON payload sent (or `null — zero data sent` for local interceptions).
