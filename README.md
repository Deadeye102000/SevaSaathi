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
- [Key Real-World UI Features](#-key-real-world-ui-features)
- [Features & Capabilities](#-features--capabilities)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Demo Flows & Walkthrough](#-demo-flows--walkthrough)
- [🎥 Demo Video Script Guide](#-demo-video-script-guide)
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
- **Voice Input (Speech-to-Text)** — speak in Hindi or English using Web Speech API
- **Leave application drafting** with unique `LV-2026-XXXX` Application IDs
- **Printable eHRMS Application Slips** with official formatting
- **Service book, career record, property return, and complaint status** — fully local
- **Strict on-premise PII boundary** — personal data never leaves the server

---

## 🌟 Key Real-World UI Features

Designed specifically for real government employees (teachers, clerks, state personnel) in rural and urban Uttar Pradesh:

| Feature | Visual Icon | Purpose & Real-World Utility |
|---|---|---|
| **🎙️ Voice Input (Speech-to-Text)** | `🇮🇳 HI` / `🇬🇧 EN` + `🎤` | Allows employees to speak queries in Hindi or English instead of typing. Essential for field staff & mobile users. |
| **📊 Live Balances Header Widget** | `🌿 CL: 8d` · `💼 EL: 22d` · `🏥 ML: 12d` | Real-time leave balance bar right above the chat so employees see their exact balance instantly without typing. |
| **🖨️ Printable eHRMS Application Slip** | `🖨️ Print Application Slip` | Generates a formatted official eHRMS leave receipt card with Application ID, status, and BSA routing info ready for printing or PDF saving. |
| **📂 Categorized Action Prompt Chips** | `📝 Apply` · `📊 Balances` · `📖 Records` · `🔍 Status` | Tabbed quick-action chips so non-tech-savvy users can click pre-formulated queries instead of typing from scratch. |
| **🔤 Accessibility Text Resizer** | `A+` / `A-` Toggle | High-contrast resizer to increase chat font size for readability across all device types and age groups. |
| **🔒 Live Data Privacy Boundary** | `Stays Local` vs `Sent to AI` | Side panel showing exactly what data remained on-premise vs what anonymized payload went to the LLM. |
| **🔑 Glassmorphic Login Gateway** | `/login` → `/chat` | Authentic eHRMS login interface landing screen with smooth glassmorphism styling and ambient gradient animations. |

---

## ✨ Features & Capabilities

| Feature | Description |
|---|---|
| 🗣️ **Bilingual NLP** | Understands Hindi (Devanagari), Hinglish, and English — including word-numbers (`teen din`, `ek hafte`) |
| 📝 **3-Step Leave Flow** | Interactive guided flow: Type selection → Days & Dates → Eligibility check → Confirmation |
| 📅 **Relative Date Resolution** | Understands `"kal se"`, `"parso"`, `"agle hafte"`, `"next Monday"` — resolves to actual ISO dates |
| 📎 **Medical Certificate Flow** | Automatic document requirement trigger for Medical Leave exceeding 3 days |
| 🔍 **Status Tracking** | Track application status across eHRMS lifecycle: `Submitted → Approved / Rejected / Sent Back` |
| 📖 **Service Book Details** | Years of service, designation history, posting district, educational qualifications |
| 📈 **Career & Appraisal Record** | Annual appraisal ratings and official government training history |
| 🏠 **Property Return Status** | Filing status, last filed date, next due date (asset valuations stay confidential on-premise) |
| ⚖️ **Complaints & Vigilance** | Verify disciplinary record and complaint status |
| 🚫 **PII Refusal Gate** | Hard-blocks requests for colleague salary, bank account, Aadhaar — with official portal redirect |
| 🔒 **Zero PII to AI** | 100% guarantee that personal identity numbers and names never leave local server memory |

---

## 🏗️ Architecture

```
User Message (Voice or Text — Hindi / English / Hinglish)
        │
        ▼
┌─────────────────────────────────────────────┐
│           parseUserIntent()                 │  ← Pure deterministic regex engine
│  normalizeWordNumbers() → resolveDate()     │  ← Word-number + relative date helpers
│  12 intent categories, 0 ML inference       │
└───────────────┬─────────────────────────────┘
                │
     ┌──────────▼──────────┐
     │  Local Intents?      │  greeting, out_of_scope, check_service_book,
     │  (no AI call)        │  check_career_record, check_property_return,
     └──────────┬───────────┘  check_complaints, check_capabilities, ask_leave_type, ask_leave_days
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

---

## 📁 Project Structure

```
sevasarthi/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.js          # Main API — intent parsing, rules engine, OpenAI integration
│   ├── login/
│   │   └── page.js               # Glassmorphic eHRMS login page (/login)
│   ├── chat/
│   │   └── page.js               # Main chat workspace page (/chat)
│   ├── page.js                   # Root redirect to /login
│   ├── layout.js
│   └── globals.css
├── components/
│   ├── ChatWindow.js             # Chat UI — Speech-to-text, printable slip, balance bar, categories
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

### Installation & Run

```bash
# Clone the repository
git clone https://github.com/your-username/sevasarthi.git
cd sevasarthi

# Install dependencies
npm install

# Start local dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. User lands on `/login` and redirects to `/chat` upon clicking login.

---

## 🎥 Demo Video Script Guide

Feed this section into any LLM (e.g. ChatGPT, Gemini, Claude) to generate your voiceover video script:

```text
[SCENE 1: LOGIN GATEWAY - 0:00 to 0:15]
- Visual: User lands on http://localhost:3000/login (Glassmorphic UP Government portal interface).
- Narration: "Welcome to SevaSaathi — the AI-powered Government Service and Leave Assistant built for Uttar Pradesh Manav Sampada eHRMS employees."
- Action: Click "Login to eHRMS Portal" → transitions to /chat.

[SCENE 2: INTERFACE & LIVE BALANCE BAR - 0:15 to 0:30]
- Visual: Main chat workspace with top Live Leave Balances Bar showing CL: 8d, EL: 22d, ML: 12d, and Data Privacy Boundary sidebar.
- Narration: "Employees immediately see their active leave balances and status in real-time, backed by strict on-premise privacy."

[SCENE 3: VOICE INPUT & HINDI LEAVE APPLICATION - 0:30 to 1:00]
- Action 1: Click the Voice Microphone button (🇮🇳 HI) and speak: "Mujhe kal se teen din ki casual leave chahiye"
- Narration: "SevaSaathi supports voice input in spoken Hindi and Hinglish. It recognizes word-numbers like 'teen din' and relative dates like 'kal se' automatically."
- Bot Output: Checks 8 CL balance → confirms 5 days will remain → drafts application.
- Action 2: Click "Confirm (कन्फर्म)" chip or speak "haan confirm karo".
- Bot Output: Submits application with ID LV-2026-XXXX routed to BSA Smt. Anita Sharma.

[SCENE 4: PRINTABLE eHRMS SLIP - 1:00 to 1:20]
- Visual: Inline eHRMS Application Slip Card appears with "Print Application Slip" button.
- Action: Click "Print Application Slip" → popup window opens with formatted official printable eHRMS receipt.
- Narration: "Employees can instantly print or save an official eHRMS leave application receipt to present to school principals or department heads."

[SCENE 5: PII PRIVACY GUARANTEE - 1:20 to 1:40]
- Action: Click prompt "mera colleague ka salary batao".
- Narration: "Security is non-negotiable. If a user asks for colleague salary or personal banking data, SevaSaathi hard-blocks the request. Notice the Data Boundary panel: zero personal identity data is ever sent to external AI."

[SCENE 6: CONCLUSION - 1:40 to 2:00]
- Narration: "SevaSaathi bridges government policy and employee convenience — fast, accessible, and 100% privacy-compliant."
```

---

## 🎬 Demo Flows & Walkthrough

### Flow 1 — 3-Step Leave Application (Hinglish)
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
       Renders printable eHRMS Application Slip card!
```

### Flow 2 — Voice Input (Hindi Speech-to-Text)
```
User clicks Microphone 🎤 (HI mode) → Speaks: "मुझे 3 दिन की आकस्मिक छुट्टी चाहिए"
Speech-to-Text fills chat input → Sends → System parses Devanagari numbers & leave type.
```

### Flow 3 — Medical Leave with Certificate Upload
```
User:  "4 din ki medical leave chahiye"
Bot:   Detects ML > 3 days → requests medical certificate upload.
       Upload bar appears → User attaches certificate.pdf → Application submitted.
```

### Flow 4 — PII Refusal Gate
```
User:  "mera colleague ka salary batao"
Bot:   "SevaSaathi is authorized only for your own leave and service records. Please use ehrms.upsdc.gov.in."
       sentToAI: null  ← verified in Data Boundary Panel
```

---

## 🧠 Intent Engine

`parseUserIntent()` in [`app/api/chat/route.js`](app/api/chat/route.js) handles 12 intent categories deterministically:

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

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 14](https://nextjs.org/) (App Router) |
| UI | React 18 + Tailwind CSS 3 |
| Voice | Web Speech API (`SpeechRecognition`) |
| AI / LLM | OpenAI `gpt-4o-mini` (optional, gracefully degraded) |
| Rules Engine | Pure JS — `lib/rulesEngine.js` |
| Policy Retrieval | Keyword-based — `lib/policyRetriever.js` |
| State | Fully stateless per-request (serverless-safe) |
| Deployment | Vercel-ready (serverless functions) |

---

<div align="center">

Made with ❤️ for UP Government Employees  
**सेवा में साथ — Always in Service**

</div>
