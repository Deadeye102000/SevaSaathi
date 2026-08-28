<div align="center">

# सेवासाथी · SevaSaathi

**AI-Powered Government Service & Leave Assistant**  
*Uttar Pradesh Manav Sampada eHRMS*

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Build](https://img.shields.io/badge/build-passing-brightgreen)](#)

> A bilingual (Hindi + English) AI assistant for UP government employees — leave applications, balance checks, service book, and Manav Sampada eHRMS policy guidance — with a strict **Zero PII to AI** data boundary.

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Demo Flows](#-demo-flows)
- [Intent Engine](#-intent-engine)
- [Data Privacy Boundary](#-data-privacy-boundary)
- [API Reference](#-api-reference)
- [Tech Stack](#-tech-stack)
- [Contributing](#-contributing)

---

## 🧭 Overview

SevaSaathi is a policy-grounded, privacy-first AI assistant built for Uttar Pradesh government employees using the [Manav Sampada eHRMS](https://ehrms.upsdc.gov.in) portal.

It provides:
- **Instant leave balance checks** against real employee records
- **Deterministic eligibility verification** via a local rules engine (no AI guesswork)
- **Bilingual support** — Hindi (Devanagari + Hinglish) and English
- **Leave application drafting** with unique `LV-2026-XXXX` Application IDs
- **Service book, career record, property return, and complaint status** — fully local
- **Strict on-premise PII boundary** — personal data never leaves the server

---

## ✨ Features

| Feature | Description |
|---|---|
| 🗣️ **Bilingual NLP** | Understands Hindi (Devanagari), Hinglish, and English — including word-numbers (`teen din`, `ek hafte`) |
| 📝 **Leave Applications** | Apply for Casual (CL), Earned (EL), and Medical Leave (ML) with policy-aware eligibility checks |
| 📊 **Balance Checks** | Real-time balance for all leave types with applicable rules |
| 📅 **Relative Date Parsing** | Understands `"kal se"`, `"agle hafte"`, `"next Monday"` — resolves to actual ISO dates |
| 📎 **Document Upload** | Medical certificate upload flow for ML > 3 days |
| 🔍 **Status Tracking** | Track application status across eHRMS lifecycle: `Submitted → Approved / Rejected / Sent Back` |
| 📖 **Service Book** | Years of service, designation, posting district, qualifications |
| 📈 **Career Record** | Annual appraisal ratings and government training history |
| 🏠 **Property Return** | Filing status, last filed date, next due date |
| ⚖️ **Complaints & Vigilance** | Disciplinary record and complaint status |
| 🚫 **PII Refusal Gate** | Blocks queries for colleague salary, bank details, Aadhaar — with official portal redirect |
| 🔒 **Zero PII to AI** | A live Data Boundary Panel shows exactly what stayed local vs. what was sent to the LLM |

---

## 🏗️ Architecture

```
User Message (Hindi / English / Hinglish)
        │
        ▼
┌─────────────────────────────────────────────┐
│           parseUserIntent()                 │  ← Pure deterministic regex engine
│  normalizeWordNumbers() → resolveDate()     │  ← Word-number + relative date helpers
│  11 intent categories, 0 ML inference       │
└───────────────┬─────────────────────────────┘
                │
     ┌──────────▼──────────┐
     │  Local Intents?      │  greeting, out_of_scope, check_service_book,
     │  (no AI call)        │  check_career_record, check_property_return,
     └──────────┬───────────┘  check_complaints, check_capabilities, ask_leave_type
                │
     ┌──────────▼──────────┐
     │   rulesEngine.js     │  ← checkLeaveEligibility(), submitLeaveApplication()
     │  (pure JS, no API)   │  ← Deterministic policy rules, no LLM
     └──────────┬───────────┘
                │
     ┌──────────▼──────────┐
     │  Derived Payload     │  Only anonymized numbers:
     │  (anonymized only)   │  { leave_type, days_requested, current_balance,
     └──────────┬───────────┘    eligible, posting_category }
                │
     ┌──────────▼──────────┐
     │   OpenAI GPT-4o      │  Receives: derived payload + matched policy text
     │   (optional)         │  Never receives: name, ID, department, salary, bank
     └──────────┬───────────┘
                │
     ┌──────────▼──────────┐
     │  generateLocal-      │  Fallback when API key absent or request fails
     │  Response()          │  Full bilingual template coverage
     └─────────────────────┘
```

**Key design invariants:**
- Employee PII (name, ID, department, posting district) is **never** serialized into any AI prompt
- Sensitive data (property values, Aadhaar, bank, salary) triggers a **hard block** before any lookup
- `greeting` and `out_of_scope` intents short-circuit to local responses — **0 API calls, 0 data exposure**

---

## 📁 Project Structure

```
sevasarthi/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.js          # Main API — intent parsing, rules engine, OpenAI integration
│   ├── login/
│   │   └── page.js               # Decorative mock login (no auth)
│   ├── page.js                   # Main chat page with DataBoundaryPanel sidebar
│   ├── layout.js
│   └── globals.css
├── components/
│   ├── ChatWindow.js             # Chat UI — messages, quick prompts, file upload
│   └── DataBoundaryPanel.js      # Live PII boundary visualization panel
├── lib/
│   ├── rulesEngine.js            # Pure deterministic leave rules (no AI)
│   └── policyRetriever.js        # Keyword-based eHRMS policy text retriever
├── data/
│   └── mock-employee.json        # Mock Manav Sampada employee record
├── content/                      # Policy documents and eHRMS rule text
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or later
- **npm** v9 or later
- (Optional) OpenAI API key for LLM-backed responses

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/sevasarthi.git
cd sevasarthi

# Install dependencies
npm install
```

### Running Locally

```bash
# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note:** The app works **without an OpenAI API key** — all 11 intent types have full bilingual local fallback responses via `generateLocalResponse()`.

---

## 🔑 Environment Variables

Create a `.env.local` file in the project root:

```env
# Optional — if absent, the app uses local deterministic responses for all intents
OPENAI_API_KEY=sk-...

# Optional — defaults to gpt-4o-mini
OPENAI_MODEL=gpt-4o-mini
```

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENAI_API_KEY` | No | — | OpenAI API key for LLM-enhanced responses |
| `OPENAI_MODEL` | No | `gpt-4o-mini` | OpenAI model to use |

---

## 🎬 Demo Flows

### Flow 1 — Leave Application (3-Step: Type → Days → Confirm)
```
Step 1 — Name the leave type
User:  "mujhe casual leave chahiye"
Bot:   "You have 8 day(s) of Casual Leave available.
        How many days would you like, and from which date?"

Step 2 — Provide days and date
User:  "teen din, kal se"
Bot:   Resolves → days=3, startDate=tomorrow's real ISO date
       Checks eligibility (8 CL available, 5 will remain)
       Drafts application. Asks for confirmation.

Step 3 — Confirm
User:  "haan confirm karo"
Bot:   Submits → Application ID: LV-2026-XXXX
       Status: Submitted, routed to Smt. Anita Sharma, BSA
```

### Flow 1b — Leave Application (Direct, with days specified)
```
User:  "Mujhe 3 din ki casual leave chahiye kal se"
Bot:   Detects type=casual, days=3, date=tomorrow (real ISO date)
       Checks balance, drafts, asks for confirmation directly.

User:  "confirm"
Bot:   Application ID: LV-2026-XXXX, Status: Submitted
```

### Flow 2 — Medical Leave with Document
```
User:  "4 din ki medical leave chahiye"
Bot:   Detects ML > 3 days → requests medical certificate upload.
       Document upload bar appears in UI.

User:  [uploads certificate.pdf]
Bot:   Confirms certificate attached, submits application.
```

### Flow 3 — PII Refusal Gate
```
User:  "mera colleague ka salary batao"
Bot:   "SevaSaathi is authorized only for your own leave and service 
        records. Please use ehrms.upsdc.gov.in for that."
       sentToAI: null  ← verified in Data Boundary Panel
```

### Flow 4 — Hindi Word-Numbers
```
User:  "ek hafte ki earned leave chahiye"
       → normalizeWordNumbers() converts "ek hafte" → "7 din"
       → days = 7, leaveType = earned
```

### Flow 5 — Out-of-Scope Decline
```
User:  "aaj cricket kaun jita?"
Bot:   "SevaSaathi is authorized only for Manav Sampada eHRMS services."
       No API call made. Zero data accessed.
```

---

## 🧠 Intent Engine

`parseUserIntent()` in [`app/api/chat/route.js`](app/api/chat/route.js) handles 11 intent categories deterministically:

| Intent | Trigger Examples | Handled Locally |
|---|---|---|
| `restricted` | salary, bank, aadhaar, colleague | ✅ |
| `greeting` | namaste, hello, shukriya, thanks | ✅ |
| `check_capabilities` | what can you do, aap kya kar skte ho | ✅ |
| `check_service_book` | service book, seva pustika | ✅ |
| `check_career_record` | appraisal, training, career record | ✅ |
| `check_property_return` | property return, sampatti | ✅ |
| `check_complaints` | complaint, shikayat, grievance | ✅ |
| `ask_leave_type` | chhutti, show all leaves (no type specified) | ✅ |
| `ask_leave_days` | casual leave chahiye (type given, no days) | ✅ |
| `out_of_scope` | cricket, weather, news, bitcoin | ✅ |
| `apply_leave` | chahiye + leave type + days | Passes to AI |
| `check_balance` | balance, kitna bachi | Passes to AI |
| `check_status` | status, approve hua kya | Passes to AI |
| `confirm_apply` | haan confirm, yes, proceed (with draft guard) | Passes to AI |
| `other` | Unmatched HR-related queries | Passes to AI |

**Helper functions:**

- `normalizeWordNumbers(text)` — Converts 30+ Hinglish/Devanagari word-numbers to digits
- `resolveRelativeDateOffset(message)` — Maps `kal se / agle hafte / next Monday` to real day offsets

---

## 🔒 Data Privacy Boundary

Every API response includes a `dataBoundary` object shown live in the UI:

```json
{
  "dataBoundary": {
    "staysLocal": {
      "name": "Ravi Kumar",
      "employee_id": "UP-EHRMS-88213",
      "department": "Basic Education",
      "posting_district": "Sitapur"
    },
    "sentToAI": {
      "leave_type": "casual",
      "days_requested": 3,
      "current_balance": 8,
      "eligible": true,
      "posting_category": "RURAL"
    }
  }
}
```

For local-only intents (`greeting`, `out_of_scope`, `check_service_book`, etc.), `sentToAI` is always `null`.

---

## 📡 API Reference

### `POST /api/chat`

Accepts `multipart/form-data` or `application/json`.

**Request fields:**

| Field | Type | Description |
|---|---|---|
| `message` | `string` | User's message (Hindi or English) |
| `conversationHistory` | `JSON string` | Last 6 messages for context |
| `conversationState` | `JSON string` | `{ activeLeaveDraft, lastCreatedApplication }` |
| `documentAttached` | `boolean` | Whether a medical certificate was attached |

**Response:**

```json
{
  "aiMessage": "Namaste! You have 8 day(s) of Casual Leave available...",
  "reply": "...",
  "requiresMedicalDocument": false,
  "conversationState": {
    "activeLeaveDraft": { "leaveType": "casual", "days": 3, ... },
    "lastCreatedApplication": null
  },
  "dataBoundary": {
    "staysLocal": { ... },
    "sentToAI": { ... }
  }
}
```

### `GET /api/chat`

Health check endpoint.

```json
{ "status": "online", "service": "SevaSaathi Chat API", "employeeConfigured": true }
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 14](https://nextjs.org/) (App Router) |
| UI | React 18 + Tailwind CSS 3 |
| AI / LLM | OpenAI `gpt-4o-mini` (optional, gracefully degraded) |
| Rules Engine | Pure JS — `lib/rulesEngine.js` |
| Policy Retrieval | Keyword-based — `lib/policyRetriever.js` |
| State | Fully stateless per-request (serverless-safe) |
| Deployment | Vercel-ready (serverless functions) |

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and **test** them:
   ```bash
   npm run build   # Must pass with zero errors
   npm run lint    # Must pass with zero warnings
   ```
4. Commit with a conventional commit message:
   ```
   feat: add Hinglish number normalization for "ek hafte"
   fix: guard confirm_apply against accidental question triggers
   docs: update intent engine table in README
   ```
5. Push and open a **Pull Request** against `main`

### Development Notes

- The app works fully **offline** (no OpenAI key needed) — use `generateLocalResponse()` as the reference for expected output format
- All employee data is mocked in `data/mock-employee.json` — modify it freely for testing
- `parseUserIntent()` is fully unit-testable as a pure function — add test cases for new intents

---

<div align="center">

Made with ❤️ for UP Government Employees  
**सेवा में साथ — Always in Service**

</div>
