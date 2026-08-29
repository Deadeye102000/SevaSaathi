import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { getRelevantPolicy } from '@/lib/policyRetriever';
import { checkLeaveEligibility, submitLeaveApplication } from '@/lib/rulesEngine';

/**
 * Fully stateless: activeLeaveDraft and lastCreatedApplication are carried
 * per-request by the client in conversationState, guaranteeing reliability across
 * distributed serverless instances on Vercel.
 */

import { kv } from '@vercel/kv';

const DEFAULT_EMPLOYEE_ID = 'UP-EHRMS-88213';
const EMPLOYEE_KEY = `employee:${DEFAULT_EMPLOYEE_ID}`;
const APPLICATIONS_KEY = `employee:${DEFAULT_EMPLOYEE_ID}:applications`;

// Fallback in-memory/file storage if Vercel KV environment variables are not set locally
let inMemoryEmployeeStoreMap = {};
let inMemoryApplicationsStore = {};

function getFallbackDefaultEmployee(empId = 'UP-EHRMS-88213') {
  const targetId = empId || 'UP-EHRMS-88213';
  try {
    const filePath = path.join(process.cwd(), 'data', 'mock-employees.json');
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      if (data.trim()) {
        const parsed = JSON.parse(data);
        if (parsed && parsed[targetId]) {
          return parsed[targetId];
        }
      }
    }
  } catch (err) {
    console.error('Error reading mock employees data:', err);
  }

  try {
    const singlePath = path.join(process.cwd(), 'data', 'mock-employee.json');
    if (fs.existsSync(singlePath)) {
      const single = JSON.parse(fs.readFileSync(singlePath, 'utf-8'));
      if (single) return { ...single, employee_id: targetId };
    }
  } catch {}

  return {
    name: 'Ravi Kumar',
    employee_id: targetId,
    department: 'Basic Education',
    posting_district: 'Sitapur',
    posting_category: 'RURAL',
    reporting_officer: 'Smt. Anita Sharma, BSA',
    leave_balance: { casual: 8, earned: 22, medical: 12 },
    leave_history: [],
  };
}

/**
 * Retrieves the employee record from Vercel KV store (seeded with mock-employees.json if absent).
 * Server-side only: this never goes to the client or the AI.
 */
export async function getEmployeeFromKV(empId = 'UP-EHRMS-88213') {
  const targetId = empId || 'UP-EHRMS-88213';
  const key = `employee:${targetId}`;

  try {
    if (process.env.KV_REST_API_URL || process.env.VERCEL_KV_API_URL || process.env.KV_URL) {
      let data = await kv.get(key);
      if (!data) {
        data = getFallbackDefaultEmployee(targetId);
        await kv.set(key, data);
      }
      return data;
    }
  } catch (err) {
    console.warn('Vercel KV get employee error (using fallback):', err.message);
  }

  if (!inMemoryEmployeeStoreMap[targetId]) {
    inMemoryEmployeeStoreMap[targetId] = getFallbackDefaultEmployee(targetId);
  }
  return inMemoryEmployeeStoreMap[targetId];
}

/**
 * Persists an updated employee record to Vercel KV store.
 */
export async function saveEmployeeToKV(employee) {
  if (!employee || !employee.employee_id) return;
  const targetId = employee.employee_id;
  const key = `employee:${targetId}`;

  try {
    if (process.env.KV_REST_API_URL || process.env.VERCEL_KV_API_URL || process.env.KV_URL) {
      await kv.set(key, employee);
      return;
    }
  } catch (err) {
    console.warn('Vercel KV save employee error (using fallback):', err.message);
  }
  inMemoryEmployeeStoreMap[targetId] = employee;
}

/**
 * Persists a new leave application to Vercel KV store under application:LV-2026-XXXX.
 */
async function persistApplicationToKV(application) {
  try {
    if (process.env.KV_REST_API_URL || process.env.VERCEL_KV_API_URL || process.env.KV_URL) {
      await kv.set(`application:${application.id}`, application);
      try {
        await kv.lpush(APPLICATIONS_KEY, application.id);
      } catch {}
    }
  } catch (err) {
    console.warn('Vercel KV persist application error:', err.message);
  }
  inMemoryApplicationsStore[application.id] = application;
}

/**
 * Returns all leave applications across all employees for the reporting officer's dashboard.
 */
export async function getAllApplicationsFromKV() {
  const knownEmpIds = ['UP-EHRMS-88213', 'UP-EHRMS-94021', 'UP-EHRMS-72904'];
  const list = [];

  for (const empId of knownEmpIds) {
    const employee = await getEmployeeFromKV(empId);
    if (employee && Array.isArray(employee.leave_history)) {
      for (const app of employee.leave_history) {
        if (!list.some((a) => a.id === app.id)) {
          list.push({
            ...app,
            employee_name: employee.name || 'Employee',
            employee_id: employee.employee_id || empId,
            department: employee.department || 'Government Department',
            posting_district: employee.posting_district || 'District Office',
            reporting_officer: app.reporting_officer || employee.reporting_officer || 'Reporting Officer',
          });
        }
      }
    }
  }

  for (const app of Object.values(inMemoryApplicationsStore)) {
    if (app && !list.some((a) => a.id === app.id)) {
      list.unshift({
        ...app,
        employee_name: app.employee_name || 'Ravi Kumar',
        employee_id: app.employee_id || 'UP-EHRMS-88213',
        department: app.department || 'Basic Education',
        posting_district: app.posting_district || 'Sitapur',
        reporting_officer: app.reporting_officer || 'Reporting Officer',
      });
    }
  }

  return list;
}

/**
 * Updates application status and officer remark in KV and employee.leave_history.
 */
export async function updateApplicationStatusInKV(applicationId, newStatus, remark = '') {
  const employee = await getEmployeeFromKV();
  let found = false;

  if (Array.isArray(employee.leave_history)) {
    for (const app of employee.leave_history) {
      if (app.id === applicationId) {
        app.status = newStatus;
        if (remark) app.remark = remark;
        app.updatedAt = new Date().toISOString();
        found = true;
      }
    }
  }

  if (inMemoryApplicationsStore[applicationId]) {
    inMemoryApplicationsStore[applicationId].status = newStatus;
    if (remark) inMemoryApplicationsStore[applicationId].remark = remark;
    inMemoryApplicationsStore[applicationId].updatedAt = new Date().toISOString();
  }

  if (process.env.KV_REST_API_URL || process.env.VERCEL_KV_API_URL || process.env.KV_URL) {
    try {
      const app = await kv.get(`application:${applicationId}`);
      if (app) {
        app.status = newStatus;
        if (remark) app.remark = remark;
        app.updatedAt = new Date().toISOString();
        await kv.set(`application:${applicationId}`, app);
      }
    } catch (err) {
      console.warn('Vercel KV update application error:', err.message);
    }
  }

  await saveEmployeeToKV(employee);
  return { success: true, applicationId, status: newStatus, remark };
}

let inMemoryAuditLog = [];

/**
 * Persists an audit log entry to Vercel KV store (under list key 'audit_log')
 * with fallback to inMemoryAuditLog array.
 */
export async function logAuditEventToKV(entry) {
  const auditEntry = {
    id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    intent: entry.intent || 'unknown',
    api_call_made: Boolean(entry.api_call_made),
    payload_sent: entry.payload_sent ?? null,
    model: entry.model || (entry.api_call_made ? 'gpt-4o-mini' : 'none (local response)'),
    response_summary: (entry.response_summary || '').toString().slice(0, 120),
  };

  try {
    if (process.env.KV_REST_API_URL || process.env.VERCEL_KV_API_URL || process.env.KV_URL) {
      await kv.lpush('audit_log', auditEntry);
      await kv.ltrim('audit_log', 0, 99);
    }
  } catch (err) {
    console.warn('Vercel KV audit log error (using fallback):', err.message);
  }

  inMemoryAuditLog.unshift(auditEntry);
  if (inMemoryAuditLog.length > 100) {
    inMemoryAuditLog = inMemoryAuditLog.slice(0, 100);
  }
}

/**
 * Reads up to 50 audit log entries from Vercel KV store or local memory fallback.
 */
export async function getAuditLogsFromKV() {
  try {
    if (process.env.KV_REST_API_URL || process.env.VERCEL_KV_API_URL || process.env.KV_URL) {
      const logs = await kv.lrange('audit_log', 0, 49);
      if (Array.isArray(logs) && logs.length > 0) {
        return logs;
      }
    }
  } catch (err) {
    console.warn('Vercel KV get audit log error:', err.message);
  }
  return inMemoryAuditLog.slice(0, 50);
}

/**
 * Normalizes Hinglish and Hindi word-numbers to digit equivalents
 * so downstream regexes can parse them consistently.
 * Multi-word phrases (e.g. "ek hafte") must be replaced before single words.
 */
function normalizeWordNumbers(text) {
  const replacements = [
    // Multi-word phrases first (order matters)
    [/\bek\s*hafte\b/gi,      '7 din'],
    [/\bdo\s*hafte\b/gi,      '14 din'],
    [/\bteen\s*hafte\b/gi,    '21 din'],
    [/\baadha\s*mahina\b/gi,  '15 din'],
    [/\baadhe\s*mahine\b/gi,  '15 din'],
    [/\bek\s*mahine\b/gi,     '30 din'],
    [/\bएक\s*हफ्ते\b/gi,      '7 दिन'],
    [/\bदो\s*हफ्ते\b/gi,      '14 दिन'],
    [/\bआधा\s*महीना\b/gi,     '15 दिन'],
    // Devanagari digit characters → ASCII
    [/१/g, '1'], [/२/g, '2'], [/३/g, '3'], [/४/g, '4'], [/५/g, '5'],
    [/६/g, '6'], [/७/g, '7'], [/८/g, '8'], [/९/g, '9'], [/०/g, '0'],
    // Single-word Hinglish numbers (word-boundary guarded)
    [/\bek\b/gi,      '1'],  [/\bdo\b/gi,      '2'],  [/\bteen\b/gi,    '3'],
    [/\bchar\b/gi,    '4'],  [/\bpaanch\b/gi,  '5'],  [/\bchhah\b/gi,   '6'],
    [/\bchah\b/gi,    '6'],  [/\bsaat\b/gi,    '7'],  [/\baath\b/gi,    '8'],
    [/\bnau\b/gi,     '9'],  [/\bdas\b/gi,     '10'],
    [/\bgyarah\b/gi,  '11'], [/\bbarah\b/gi,   '12'], [/\bterah\b/gi,   '13'],
    [/\bchaudah\b/gi, '14'], [/\bpandrah\b/gi, '15'], [/\bsolah\b/gi,   '16'],
    [/\bsatrah\b/gi,  '17'], [/\batharah\b/gi, '18'], [/\bunnees\b/gi,  '19'],
    [/\bbees\b/gi,    '20'],
    // Single-word Devanagari numbers
    [/\bएक\b/gi,     '1'],  [/\bदो\b/gi,    '2'],  [/\bतीन\b/gi,    '3'],
    [/\bचार\b/gi,    '4'],  [/\bपाँच\b/gi,  '5'],  [/\bछह\b/gi,     '6'],
    [/\bसात\b/gi,    '7'],  [/\bआठ\b/gi,    '8'],  [/\bनौ\b/gi,     '9'],
    [/\bदस\b/gi,     '10'], [/\bपंद्रह\b/gi, '15'], [/\bबीस\b/gi,    '20'],
  ];
  let result = text;
  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

/**
 * Resolves relative date expressions (kal se, aaj se, next week, etc.)
 * to a numeric day offset from today's date.
 *
 * @param {string} message - Original (non-lowercased) user message
 * @returns {number} Offset in days from today (0 = today)
 */
function resolveRelativeDateOffset(message) {
  const lower = message.toLowerCase();
  if (/\b(kal\s*se|from\s*tomorrow|tomorrow)\b/i.test(lower) || /कल\s*से/.test(message)) {
    return 1;
  }
  if (/\b(parso|parson|day\s*after\s*tomorrow)\b/i.test(lower) || /परसों\s*से/.test(message)) {
    return 2;
  }
  if (/\b(agle\s*(?:hafte|week)|next\s*week)\b/i.test(lower) || /अगले\s*हफ्ते/.test(message)) {
    return 7;
  }
  if (/\bnext\s*monday\b/i.test(lower)) {
    const day = new Date().getDay(); // 0=Sun, 1=Mon...
    return day === 1 ? 7 : (8 - day) % 7;
  }
  // "aaj se", "from today", "today", or no relative expression → offset 0 (today)
  return 0;
}

/**
 * Parses user message into structured intent and parameters,
 * supporting multi-turn drafts, Hindi/English inputs, and document requirements.
 */
export function parseUserIntent(message = '', conversationHistory = [], documentAttached = false, activeLeaveDraft = null, pendingLeaveType = null, pendingDays = null) {
  // Normalize Hinglish/Hindi word-numbers to digits before any regex matching
  const text = normalizeWordNumbers(message.toLowerCase().trim());

  // 1. Check for restricted query (salary, colleague, bank, aadhaar)
  const isRestrictedQuery =
    /\b(salary|colleague|collegue|bank|aadhaar|personal data|account number)\b/i.test(text) ||
    /वेतन|सैलरी|सहकर्मी|बैंक|आधार/i.test(text);

  if (isRestrictedQuery) {
    return { intent: 'restricted', leaveType: 'casual', days: 0 };
  }

  // 1b. Greeting / farewell — handled locally, no AI call
  const isGreeting =
    /^(namaste|namaskar|hello|hi|hey|good\s*morning|good\s*evening|shukriya|dhanyawad|thanks|thank\s*you|bye|goodbye|alvida|pranam|jai\s*hind)\b/i.test(text) ||
    /^(नमस्ते|नमस्कार|शुक्रिया|धन्यवाद|बाय|अलविदा|जय\s*हिंद|प्रणाम)/i.test(text);

  if (isGreeting) {
    return { intent: 'greeting', leaveType: 'casual', days: 0 };
  }

  // 2. Check for confirmation query (haan confirm karo, confirm, yes, haan, etc.) or document upload
  const isConfirm =
    /\b(confirm|haan\s*confirm|karo|kar\s*do|yes\s*confirm|proceed|theek\s*hai|yes|haan|uploaded|attached|certificate)\b/i.test(text) ||
    /कन्फर्म|हाँ|कर दो|स्वीकार|प्रमाण पत्र|सर्टिफिकेट/i.test(text) ||
    (documentAttached && activeLeaveDraft?.leaveType === 'medical');

  // Guard: don't fire confirm_apply if the message is actually a question
  const isQuestion =
    /[?？]/.test(text) ||
    /\b(kya|kitna|kitni|kitne|batao|bataiye|how\s*many|how\s*much|what\s*is|what\s*are|when|kab|kahan)\b/i.test(text) ||
    /क्या|कितना|कितनी|बताओ|बताइए/.test(text);

  const hasPriorDraft =
    Boolean(activeLeaveDraft) ||
    conversationHistory.some((m) => {
      const c = (m.content || m.text || '').toLowerCase();
      return c.includes('draft') || c.includes('ड्राफ्ट') || c.includes('पात्र') || c.includes('eligible') || c.includes('certificate') || c.includes('प्रमाण');
    });

  if (isConfirm && !isQuestion && (hasPriorDraft || text.includes('confirm') || documentAttached)) {
    return {
      intent: 'confirm_apply',
      leaveType: activeLeaveDraft?.leaveType || 'casual',
      days: activeLeaveDraft?.days || 3,
      startDate: activeLeaveDraft?.startDate || '2026-09-01',
      endDate: activeLeaveDraft?.endDate || '2026-09-03',
    };
  }

  // 3. Check for capability / help queries ("what can you do", "aap kya kya kr skte ho", etc.)
  const isCapabilities =
    /\b(what\s*(can|do)\s*you\s*do|capabilities|features|help|madad|kya\s*(?:kya\s*)?(?:kar|kr)\s*(?:sakte|skte|sakta|skta|sakti|skti)\s*ho|tum\s*kya\s*(?:kar|kr)\s*s(ak|k)?te\s*ho|who\s*are\s*you)\b/i.test(text) ||
    /आप\s*क्या(?:\s*क्या)?\s*कर\s*(?:सकते|सकती|सकता)\s*(?:हो|हैं)|क्या\s*कर\s*(?:सकते|सकती|सकता)\s*हो|क्षमताएं|मदद/i.test(text);

  if (isCapabilities) {
    return { intent: 'check_capabilities', leaveType: 'casual', days: 0 };
  }

  // 4. Check for read-only service book, career record, property return, complaints intents
  const isPropertyReturn =
    /\b(property\s*return|property|asset\s*declaration|assets\s*declared|sampatti)\b/i.test(text) ||
    /संपत्ति\s*विवरण|प्रॉपर्टी\s*रिटर्न|अचल\s*संपत्ति|संपत्ति/i.test(text);
  if (isPropertyReturn) {
    return { intent: 'check_property_return', leaveType: 'casual', days: 0 };
  }

  const isCareerRecord =
    /\b(career\s*record|career|appraisal|training|trainings|performance\s*record)\b/i.test(text) ||
    /करियर\s*रिकॉर्ड|करियर|प्रशिक्षण|वार्षिक\s*मूल्यांकन|अप्रेजल/i.test(text);
  if (isCareerRecord) {
    return { intent: 'check_career_record', leaveType: 'casual', days: 0 };
  }

  const isServiceBook =
    /\b(service\s*book|service\s*record|service\s*details|service\s*history|posting\s*history)\b/i.test(text) ||
    /सर्विस\s*बुक|सेवा\s*पुस्तिका|सेवा\s*अभिलेख/i.test(text);
  if (isServiceBook) {
    return { intent: 'check_service_book', leaveType: 'casual', days: 0 };
  }

  const isComplaints =
    /\b(complaint|complaints|shikayat|grievance|disciplinary)\b/i.test(text) ||
    /शिकायत|अनुशासन/i.test(text);
  if (isComplaints) {
    return { intent: 'check_complaints', leaveType: 'casual', days: 0 };
  }

  // 5. Check for status query (meri leave approve hui kya?, status, etc.)
  const isStatus =
    /\b(status|track|approve|approved|approval|kya\s*hua)\b/i.test(text) ||
    /स्थिति|स्टेटस|स्वीकृत|मंजूर|क्या हुआ|अप्रूव/i.test(text) ||
    /lv-2026-\d{4}/i.test(text);

  if (isStatus) {
    return { intent: 'check_status', leaveType: 'casual', days: 0 };
  }

  // 6. Detect leave type
  let hasExplicitLeaveType = false;
  let leaveType = 'casual';
  if (
    text.includes('earned') ||
    text.includes('अर्नड') ||
    text.includes('उपार्जित') ||
    /\b(el)\b/i.test(text)
  ) {
    leaveType = 'earned';
    hasExplicitLeaveType = true;
  } else if (
    text.includes('medical') ||
    text.includes('मेडिकल') ||
    text.includes('चिकित्सा') ||
    text.includes('sick') ||
    /\b(ml)\b/i.test(text)
  ) {
    leaveType = 'medical';
    hasExplicitLeaveType = true;
  } else if (
    text.includes('casual') ||
    text.includes('कैजुअल') ||
    text.includes('आकस्मिक') ||
    /\b(cl)\b/i.test(text)
  ) {
    leaveType = 'casual';
    hasExplicitLeaveType = true;
  } else if (pendingLeaveType) {
    leaveType = pendingLeaveType;
    hasExplicitLeaveType = true;
  }

  // 7. Detect days (word-numbers already normalized by normalizeWordNumbers above)
  let days = 1;
  const daysMatch =
    text.match(/(\d+)\s*(?:days?|din|divas|दिन)/i) ||
    text.match(/(?:for|of)\s*(\d+)\s*(?:days?|din)?/i) ||
    text.match(/(\d+)\s*(?:casual|earned|medical|cl|el|ml)/i);
  if (daysMatch) {
    days = parseInt(daysMatch[1], 10);
  }
  // Track whether days were explicitly stated (vs defaulted to 1)
  const hasExplicitDays = Boolean(daysMatch);

  // 8. Detect dates — resolve relative expressions ("kal se", "aaj se") to real ISO dates
  const dateRegex = /\b(\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/g;
  const dates = message.match(dateRegex) || [];

  const _today = new Date();
  const _addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r.toISOString().split('T')[0]; };
  const _startOffset = resolveRelativeDateOffset(message);
  const _computedStart = _addDays(_today, _startOffset);
  const _computedEnd   = _addDays(_today, _startOffset + Math.max(days - 1, 0));

  const startDate = dates[0] || _computedStart;
  const endDate   = dates[1] || _computedEnd;

  // 9. Check for general / all leaves query or apply without leave type specified
  const isGeneralLeaveQuery =
    /\b(all\s*leaves|show\s*leaves|show\s*all\s*leaves|types\s*of\s*leave|leave\s*types|chhutti|chhuttiyan|leaves|chutti)\b/i.test(text) ||
    /सभी\s*छुट्टियां|छुट्टियां|अवकाश\s*प्रकार|अवकाश/i.test(text);

  const isApply =
    /\b(apply|application|request|take|avail|need|want|chahiye|chhutti|chutti|leni|lena|daalni)\b/i.test(text) ||
    /चाहिए|आवेदन|लेनी|लेना|डालनी|छुट्टी/i.test(text) ||
    hasExplicitLeaveType ||
    Boolean(pendingLeaveType);

  const isBalance =
    /\b(balance|remaining|how many days|how much leave|available|left|kitna|kitni|shesh|bachi)\b/i.test(text) ||
    /बैलेंस|बची|शेष|कितनी/i.test(text);

  const hasExplicitDate =
    dates.length > 0 ||
    _startOffset !== 0 ||
    /\b(kal|aaj|today|tomorrow|somvar|mangalvar|budhvar|guruvar|shukravar|shanivar|ravivar|monday|tuesday|wednesday|thursday|friday|saturday|sunday|hafte|hafta|next week)\b/i.test(message) ||
    /(\d{1,2})\s*(?:st|nd|rd|th)?\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december|तारीख|ता०|से|को|अक्टूबर|सितंबर|अगस्त|जनवरी|फरवरी|मार्च|अप्रैल|मई|जून|जुलाई|नवंबर|दिसंबर)/i.test(message);

  // STEP 1: If user asks to apply or check leaves but specifies NEITHER leave type NOR days (and no pending type):
  if (!hasExplicitLeaveType && !pendingLeaveType && (isGeneralLeaveQuery || isApply || isBalance)) {
    return { intent: 'ask_leave_type', leaveType: 'casual', days: 0, startDate, endDate };
  }

  // STEP 2: If leave type is known (or pending), but days not yet given in this message or previously:
  if (isApply && (hasExplicitLeaveType || pendingLeaveType) && !hasExplicitDays && !pendingDays) {
    return { intent: 'ask_leave_days', leaveType, days: 0, startDate, endDate };
  }

  // STEP 3: If leave type and days are known, but date is missing:
  if (isApply && (hasExplicitDays || pendingDays) && !hasExplicitDate) {
    const finalDays = hasExplicitDays ? days : (pendingDays || 1);
    return { intent: 'ask_leave_date', leaveType, days: finalDays, startDate, endDate };
  }

  // STEP 4 / SHORTCUT: Leave type, days AND dates known!
  if (isApply && !text.includes('process') && !text.includes('rules') && !text.includes('how to')) {
    const finalDays = hasExplicitDays ? days : (pendingDays || 1);
    return { intent: 'apply_leave', leaveType, days: finalDays, startDate, endDate };
  }

  if (isBalance && !text.includes('rule') && !text.includes('lapses')) {
    return { intent: 'check_balance', leaveType, days, startDate, endDate };
  }

  // 10. Out-of-scope topics — local polite decline, no AI call needed
  const isOutOfScope =
    /\b(cricket|football|soccer|weather|mausam|news|khabar|movie|film|recipe|khana|politics|rajneeti|stock|share\s*market|bazar|bitcoin|crypto|lottery)\b/i.test(text) ||
    /क्रिकेट|मौसम|खबर|फिल्म|राजनीति|शेयर\s*बाज़ार/.test(text);

  if (isOutOfScope) {
    return { intent: 'out_of_scope', leaveType: 'casual', days: 0 };
  }

  return { intent: 'other', leaveType, days, startDate, endDate };
}

/**
 * Fallback local response generator matching real Manav Sampada eHRMS lifecycle states:
 * "Submitted", "Sent Back", "Approved", "Rejected" and read-only service book/record modules.
 */
function generateLocalResponse({
  message,
  intent,
  leaveType,
  days,
  derivedPayload,
  policyText,
  employee,
  needsMedicalDoc,
  lastCreatedApplication = null,
}) {
  const isHindi =
    /[\u0900-\u097F]/i.test(message) ||
    /\b(chhutti|chahiye|kya|mera|meri|namaste|din|batao|karo|haan|hai)\b/i.test(message);

  if (intent === 'greeting') {
    return isHindi
      ? 'नमस्ते! 🙏 मैं सेवासाथी हूँ — आपका सरकारी सेवा एवं अवकाश सहायक। कृपया बताएं, मैं आपकी किस प्रकार सहायता कर सकता हूँ?'
      : 'Namaste! 🙏 I am SevaSaathi, your Government Service & Leave Assistant. How can I help you today?';
  }

  if (intent === 'out_of_scope') {
    return isHindi
      ? 'नमस्ते। सेवासाथी केवल मानव संपदा eHRMS सेवाओं में सहायता के लिए अधिकृत है — अवकाश आवेदन, बैलेंस जांच, सेवा पुस्तिका, संपत्ति रिटर्न इत्यादि। यह विषय मेरे कार्यक्षेत्र से बाहर है।'
      : 'SevaSaathi is authorized only for Manav Sampada eHRMS services — leave applications, balance checks, service book, property return, and related queries. That topic falls outside my scope.';
  }

  if (intent === 'restricted') {
    return isHindi
      ? 'नमस्ते। SevaSaathi केवल आपके अवकाश नियमों, बैलेंस एवं सेवा प्रक्रियाओं में सहायता के लिए अधिकृत है। किसी सहकर्मी का वेतन, बैंक खाता अथवा व्यक्तिगत डेटा देखने या साझा करने की अनुमति नहीं है। कृपया इसके लिए आधिकारिक मानव संपदा पोर्टल (ehrms.upsdc.gov.in) का उपयोग करें।'
      : 'I can only assist with your leave applications, balance checks, and Manav Sampada service rules. For colleague salary, bank, or personal data, please use the official portal.';
  }

  const leaveNameHi =
    leaveType === 'earned'
      ? 'उपार्जित अवकाश (Earned Leave)'
      : leaveType === 'medical'
      ? 'चिकित्सा अवकाश (Medical Leave)'
      : 'आकस्मिक अवकाश (Casual Leave)';

  const leaveNameEn =
    leaveType === 'earned'
      ? 'Earned Leave (EL)'
      : leaveType === 'medical'
      ? 'Medical Leave (ML)'
      : 'Casual Leave (CL)';

  if (intent === 'apply_leave') {
    if (needsMedicalDoc) {
      return isHindi
        ? `नमस्ते! आपके eHRMS खाते में ${derivedPayload?.current_balance ?? 12} दिन का चिकित्सा अवकाश (Medical Leave) उपलब्ध है। नियमानुसार 3 दिन से अधिक के मेडिकल अवकाश के लिए सक्षम सरकारी या पंजीकृत चिकित्सक का मेडिकल प्रमाण पत्र (Medical Certificate) अपलोड करना अनिवार्य है। कृपया नीचे दिए गए बटन से मेडिकल प्रमाण पत्र (Image या PDF) अपलोड करें ताकि आवेदन आगे बढ़ाया जा सके।`
        : `Namaste! You have ${derivedPayload?.current_balance ?? 12} day(s) of Medical Leave available. A medical certificate from a registered practitioner is required for medical leave exceeding 3 days. Please upload your medical certificate (Image or PDF) below to proceed.`;
    }

    if (derivedPayload?.eligible) {
      if (leaveType === 'earned' && days > 15) {
        return isHindi
          ? `नमस्ते! आपके eHRMS खाते में ${derivedPayload.current_balance} दिन का उपार्जित अवकाश (Earned Leave) उपलब्ध है। नियमानुसार 15 दिन से अधिक के उपार्जित अवकाश के लिए जिला बेसिक शिक्षा अधिकारी (BSA) के अतिरिक्त अनुमोदन की आवश्यकता होती है। ${days} दिन की छुट्टी के लिए आप पात्र हैं (अवकाश के बाद ${derivedPayload.current_balance - days} दिन शेष रहेंगे)। मैंने आपका ${days} दिन का Earned Leave आवेदन ड्राफ्ट कर लिया है। क्या आप इसे सबमिट करने के लिए कन्फर्म करते हैं? (कृपया 'हाँ कन्फर्म करो' कहें)`
          : `Namaste! You have ${derivedPayload.current_balance} day(s) of Earned Leave available. As per eHRMS service rules, Earned Leave exceeding 15 days requires sanction from the District Basic Education Officer (BSA). You are eligible for ${days} day(s) (${derivedPayload.current_balance - days} day(s) will remain). I have drafted your Earned Leave application. Would you like to confirm and submit it? (Please say 'confirm')`;
      }

      if (leaveType === 'casual' && days > 5) {
        return isHindi
          ? `नमस्ते! आपके eHRMS खाते में ${derivedPayload.current_balance} दिन का आकस्मिक अवकाश (Casual Leave) उपलब्ध है। नियमानुसार आकस्मिक अवकाश एक बार में 5 दिन से अधिक लेने पर विशेष अनुमोदन अपेक्षित होता है। ${days} दिन की छुट्टी के लिए आप पात्र हैं (अवकाश के बाद ${derivedPayload.current_balance - days} दिन शेष रहेंगे)। मैंने आपका ${days} दिन का Casual Leave आवेदन ड्राफ्ट कर लिया है। क्या आप इसे सबमिट करने के लिए कन्फर्म करते हैं? (कृपया 'हाँ कन्फर्म करो' कहें)`
          : `Namaste! You have ${derivedPayload.current_balance} day(s) of Casual Leave available. Casual leave exceeding 5 consecutive days requires special sanction from your reporting officer. You are eligible for ${days} day(s) (${derivedPayload.current_balance - days} day(s) will remain). I have drafted your application. Would you like to confirm and submit it? (Please say 'confirm')`;
      }

      const docNoteHi = derivedPayload?.document_attached ? ' (मेडिकल प्रमाण पत्र संलग्न)' : '';
      const docNoteEn = derivedPayload?.document_attached ? ' (medical certificate attached)' : '';

      return isHindi
        ? `नमस्ते! आपके eHRMS खाते में ${derivedPayload.current_balance} दिन का ${leaveNameHi} उपलब्ध है। ${days} दिन की छुट्टी के लिए आप पूरी तरह पात्र हैं (अवकाश के बाद ${derivedPayload.current_balance - days} दिन शेष रहेंगे)। मैंने आपका ${days} दिन का ${leaveType} Leave आवेदन ड्राफ्ट कर लिया है${docNoteHi}। क्या आप इसे सबमिट करने के लिए कन्फर्म करते हैं? (कृपया 'हाँ कन्फर्म करो' कहें)`
        : `Namaste! You have ${derivedPayload.current_balance} day(s) of ${leaveNameEn} available. You are eligible for ${days} day(s). I have drafted your leave application${docNoteEn}. Would you like to confirm and submit it? (Please say 'confirm')`;
    }

    return isHindi
      ? `नमस्ते। आपके खाते में पर्याप्त ${leaveNameHi} शेष नहीं है। वर्तमान में आपके पास केवल ${derivedPayload?.current_balance ?? 0} दिन शेष हैं, जबकि आपने ${days} दिन का अनुरोध किया है। आप अवकाश अवधि घटा सकते हैं अथवा अन्य उपलब्ध अवकाश प्रकार चुन सकते हैं।`
      : `Namaste! You do not have sufficient ${leaveNameEn} balance for this request. You currently have ${derivedPayload?.current_balance ?? 0} day(s) available, but requested ${days} day(s). You may reduce the requested duration or select another available leave type.`;
  }

  if (intent === 'confirm_apply') {
    return isHindi
      ? `नमस्ते! आपका ${days} दिन का ${leaveNameHi} आवेदन सफलतापूर्वक सबमिट कर दिया गया है। वर्तमान स्टेटस 'Submitted' है। रिपोर्टिंग ऑफिसर द्वारा समीक्षा के बाद यह 'Approved' या 'Rejected' प्रदर्शित होगा, अथवा किसी संशोधन की आवश्यकता होने पर 'Sent Back' के रूप में दिखेगा।`
      : `Namaste! Your application for ${days} day(s) of ${leaveNameEn} has been submitted successfully. The current status is 'Submitted'. Once reviewed by your reporting officer, it will show as 'Approved' or 'Rejected', or 'Sent Back' if any changes are required.`;
  }

  if (intent === 'check_balance') {
    if (leaveType === 'earned') {
      return isHindi
        ? `नमस्ते! आपके मानव संपदा eHRMS रिकॉर्ड के अनुसार, आपके पास वर्तमान में ${derivedPayload?.current_balance ?? 22} दिन का उपार्जित अवकाश (Earned Leave - EL) शेष है। (नियम: प्रति वर्ष 30 दिन की दर से संचित, अधिकतम 300 दिन तक संचयन संभव, 15 दिन से अधिक पर जिला स्तर/BSA अनुमोदन आवश्यक)।`
        : `Namaste! According to your eHRMS record, your available Earned Leave (EL) balance is ${derivedPayload?.current_balance ?? 22} day(s). (Rules: accrues at 30 days/year, accumulable up to 300 days, applications exceeding 15 days require district office/BSA sanction).`;
    }
    if (leaveType === 'medical') {
      return isHindi
        ? `नमस्ते! आपके मानव संपदा eHRMS रिकॉर्ड के अनुसार, आपके पास वर्तमान में ${derivedPayload?.current_balance ?? 12} दिन का चिकित्सा अवकाश (Medical Leave - ML) शेष है। (नियम: 20 दिन/वर्ष अर्द्धवेतन पर देय, मेडिकल प्रमाण पत्र के आधार पर पूर्ण वेतन में परिवर्तित। 3 दिन से अधिक पर मेडिकल प्रमाण पत्र अनिवार्य)।`
        : `Namaste! According to your eHRMS record, your available Medical Leave (ML) balance is ${derivedPayload?.current_balance ?? 12} day(s). (Rules: credited at 20 days/year on half-pay, convertible to full pay with medical certificate. Medical certificate required for leave exceeding 3 days).`;
    }
    return isHindi
      ? `नमस्ते। आपके मानव संपदा eHRMS रिकॉर्ड के अनुसार, आपके पास वर्तमान में ${derivedPayload?.current_balance ?? 8} दिन का आकस्मिक अवकाश (Casual Leave - CL) शेष है। (नियम: प्रति वर्ष 14 दिन देय, एक बार में अधिकतम 5 दिन, वर्ष के अंत में स्वतः समाप्त)।`
      : `Namaste! According to your eHRMS record, your available Casual Leave (CL) balance is ${derivedPayload?.current_balance ?? 8} day(s). (Rules: up to 14 days/year, max 5 consecutive days without special sanction, lapses at year-end).`;
  }

  if (intent === 'check_status') {
    const historyApp = employee?.leave_history?.[0] || {
      id: 'LV-2026-0311',
      type: 'casual',
      days: 2,
      status: 'Approved',
      remark: 'Approved - enjoy your leave',
      reporting_officer: 'Smt. Anita Sharma, BSA',
    };
    const recentApp = lastCreatedApplication;
    const officer = historyApp.reporting_officer || employee?.reporting_officer || 'Smt. Anita Sharma, BSA';
    const remark = historyApp.remark ? ` — '${historyApp.remark}'` : '';

    if (isHindi) {
      let msg = `नमस्ते! आपका अवकाश आवेदन (ID: ${historyApp.id}) Approved (स्वीकृत) हो चुका है।\n\n• वर्तमान स्टेटस: Approved by ${officer}${remark}\n• विवरण: ${historyApp.days} दिन ${historyApp.type || 'Casual'} Leave`;
      if (recentApp && recentApp.id !== historyApp.id) {
        msg += `\n• हालिया आवेदन (ID: ${recentApp.id}): स्टेटस 'Submitted' (समीक्षाधीन; यदि संशोधन अपेक्षित होगा तो 'Sent Back' दिखेगा, अन्यथा 'Approved'/'Rejected')।`;
      }
      return msg;
    }

    let msg = `Namaste! Your leave application (ID: ${historyApp.id}) has been Approved.\n\n• Current Status: Approved by ${officer}${remark}\n• Details: ${historyApp.days} day(s) ${historyApp.type || 'Casual'} Leave`;
    if (recentApp && recentApp.id !== historyApp.id) {
      msg += `\n• Recent Application (ID: ${recentApp.id}): Status 'Submitted' (under review; will show as 'Sent Back' if changes are needed, or 'Approved'/'Rejected' once reviewed).`;
    }
    return msg;
  }

  if (intent === 'check_service_book') {
    return isHindi
      ? `नमस्ते! आपके सेवा अभिलेख (Service Book) के अनुसार, आपकी कुल सेवा अवधि ${derivedPayload?.years_of_service ?? 6.5} वर्ष है। आपका वर्तमान पद '${derivedPayload?.current_designation ?? 'Assistant Teacher'}' है तथा आपकी वर्तमान पदस्थापना जनपद ${derivedPayload?.current_posting_district ?? 'Sitapur'} में है। (सुरक्षा कारणों से विद्यालय व संस्थान का विवरण AI को नहीं भेजा गया है)`
      : `Namaste! According to your Service Book, you have completed ${derivedPayload?.years_of_service ?? 6.5} years of service as an '${derivedPayload?.current_designation ?? 'Assistant Teacher'}' posted in ${derivedPayload?.current_posting_district ?? 'Sitapur'} district. (Detailed school and institution names remain confidential on-premise).`;
  }

  if (intent === 'check_career_record') {
    return isHindi
      ? `नमस्ते! आपके करियर रिकॉर्ड के अनुसार, आपका नवीनतम वार्षिक मूल्यांकन (Annual Appraisal) '${derivedPayload?.latest_appraisal_rating ?? 'Very Good'}' दर्ज है, एवं आपने कुल ${derivedPayload?.trainings_count ?? 1} प्रशिक्षण सफलतापूर्वक पूर्ण किए हैं।`
      : `Namaste! In your career record, your latest annual appraisal rating is recorded as '${derivedPayload?.latest_appraisal_rating ?? 'Very Good'}', with ${derivedPayload?.trainings_count ?? 1} training(s) completed.`;
  }

  if (intent === 'check_property_return') {
    return isHindi
      ? `नमस्ते! आपकी वार्षिक संपत्ति विवरणी (Property Return) 'Filed' (दर्ज) है। आपकी अगली नियत तिथि (Next Due Date) 31 जनवरी 2027 है। (गोपनीयता नीति: संपत्ति का मूल्य एवं स्थान का ब्यौरा पूरी तरह स्थानीय सर्वर पर सुरक्षित रखा गया है)`
      : `Namaste! Your annual property return filing status is 'Filed', and your next filing due date is January 31, 2027. (Confidential asset details, valuation, and locations remain strictly local).`;
  }

  if (intent === 'check_complaints') {
    return isHindi
      ? `नमस्ते! आपके eHRMS रिकॉर्ड में वर्तमान में कोई शिकायत या अनुशासनात्मक मामला दर्ज नहीं है (शिकायत संख्या: ${derivedPayload?.complaint_count ?? 0})। आपका सेवा रिकॉर्ड पूर्णतः स्पष्ट है।`
      : `Namaste! There are no complaints or disciplinary actions on your record (complaint count: ${derivedPayload?.complaint_count ?? 0}). Your service record is completely clear.`;
  }

  if (intent === 'ask_leave_type') {
    const cl = employee?.leave_balance?.casual ?? 8;
    const el = employee?.leave_balance?.earned ?? 22;
    const ml = employee?.leave_balance?.medical ?? 12;
    return isHindi
      ? `नमस्ते! आपके eHRMS खाते में उपलब्ध अवकाश:
• आकस्मिक अवकाश (Casual Leave - CL): ${cl} दिन
• उपार्जित अवकाश (Earned Leave - EL): ${el} दिन
• चिकित्सा अवकाश (Medical Leave - ML): ${ml} दिन

कृपया बताएं कि आप किस प्रकार का अवकाश (Casual, Earned, या Medical) लेना चाहते हैं और कितने दिनों के लिए?`
      : `Namaste! Here are all your available leave balances:
• Casual Leave (CL): ${cl} day(s)
• Earned Leave (EL): ${el} day(s)
• Medical Leave (ML): ${ml} day(s)

Please let me know: which type of leave (Casual, Earned, or Medical) would you like to apply for and for how many days?`;
  }

  if (policyText) {
    return isHindi
      ? `नमस्ते। मानव संपदा सेवा नियमों के अनुसार संबंधित जानकारी निम्नलिखित है:\n\n${policyText}`
      : `Namaste! Based on the official service rules, here is the relevant guidance:\n\n${policyText}`;
  }

  return isHindi
    ? 'नमस्ते! मैं सेवा साथी हूँ। मैं आपके अवकाश आवेदन, शेष अवकाश जांचने, सेवा पुस्तिका, संपत्ति रिटर्न एवं मानव संपदा eHRMS नियमों से संबंधित प्रश्नों में सहायता कर सकता हूँ।'
    : 'Namaste! I am SevaSaathi, your Government Service and Leave Assistant. I can help you check balances, submit leave applications, verify service book details, and understand Manav Sampada eHRMS policies.';
}

let inMemoryRateLimitMap = new Map();

/**
 * Enforces rate limiting per IP address (max 30 requests per minute).
 */
async function checkRateLimit(request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  const windowSec = 60;
  const maxReqs = 30;
  const kvKey = `ip:rate_limit:${ip}`;

  try {
    if (process.env.KV_REST_API_URL || process.env.VERCEL_KV_API_URL || process.env.KV_URL) {
      const current = await kv.incr(kvKey);
      if (current === 1) {
        await kv.expire(kvKey, windowSec);
      }
      if (current > maxReqs) {
        return { allowed: false, count: current };
      }
      return { allowed: true, count: current };
    }
  } catch (err) {
    console.warn('Vercel KV rate limit error (using fallback):', err.message);
  }

  const now = Date.now();
  const entry = inMemoryRateLimitMap.get(ip) || { count: 0, resetAt: now + windowSec * 1000 };

  if (now > entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + windowSec * 1000;
  } else {
    entry.count += 1;
  }

  inMemoryRateLimitMap.set(ip, entry);

  if (entry.count > maxReqs) {
    return { allowed: false, count: entry.count };
  }
  return { allowed: true, count: entry.count };
}

export async function POST(request) {
  try {
    // 1. Rate Limiting Check (30 reqs/min)
    const rateLimit = await checkRateLimit(request);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a minute before sending more messages.' },
        { status: 429 }
      );
    }

    let message = '';
    let conversationHistory = [];
    let documentAttached = false;
    let activeLeaveDraft = null;
    let lastCreatedApplication = null;
    let pendingLeaveType = null;
    let pendingDays = null;

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      message = (formData.get('message') || '').toString();
      const docVal = formData.get('documentAttached');
      documentAttached = docVal === 'true' || docVal === true;
      const historyRaw = formData.get('conversationHistory');
      if (historyRaw) {
        try {
          conversationHistory = JSON.parse(historyRaw.toString());
        } catch {
          conversationHistory = [];
        }
      }
      const stateRaw = formData.get('conversationState');
      if (stateRaw) {
        try {
          const parsed = typeof stateRaw === 'string' ? JSON.parse(stateRaw) : stateRaw;
          if (parsed && typeof parsed === 'object') {
            activeLeaveDraft = parsed.activeLeaveDraft ?? null;
            lastCreatedApplication = parsed.lastCreatedApplication ?? null;
            pendingLeaveType = parsed.pendingLeaveType ?? null;
            pendingDays = parsed.pendingDays ?? null;
          }
        } catch {}
      }
      if (!activeLeaveDraft && formData.get('activeLeaveDraft')) {
        try {
          activeLeaveDraft = JSON.parse(formData.get('activeLeaveDraft').toString());
        } catch {}
      }
      if (!lastCreatedApplication && formData.get('lastCreatedApplication')) {
        try {
          lastCreatedApplication = JSON.parse(formData.get('lastCreatedApplication').toString());
        } catch {}
      }
    } else {
      const body = await request.json();
      message = body.message || '';
      const docVal = body.documentAttached;
      documentAttached = docVal === 'true' || docVal === true;
      conversationHistory = body.conversationHistory || [];
      const convState = body.conversationState || {};
      activeLeaveDraft = convState.activeLeaveDraft ?? body.activeLeaveDraft ?? null;
      lastCreatedApplication = convState.lastCreatedApplication ?? body.lastCreatedApplication ?? null;
      pendingLeaveType = convState.pendingLeaveType ?? body.pendingLeaveType ?? null;
      pendingDays = convState.pendingDays ?? body.pendingDays ?? null;
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { error: 'Message cannot be empty.' },
        { status: 400 }
      );
    }

    // 2. Load full employee record from Vercel KV store by employeeId
    const urlObj = new URL(request.url);
    let reqEmpId = urlObj.searchParams.get('emp') || request.headers.get('x-employee-id');
    if (!reqEmpId && typeof formData !== 'undefined' && formData.get('employeeId')) {
      reqEmpId = formData.get('employeeId').toString();
    }
    if (!reqEmpId) reqEmpId = 'UP-EHRMS-88213';

    const employee = await getEmployeeFromKV(reqEmpId.toString());

    // 3. Parse intent
    const { intent, leaveType, days, startDate, endDate } = parseUserIntent(
      message,
      conversationHistory,
      documentAttached,
      activeLeaveDraft,
      pendingLeaveType
    );

    // 3A. READ-ONLY INTENTS: Intercept check_service_book, check_career_record,
    // check_property_return, check_complaints, check_capabilities, ask_leave_type so they NEVER call OpenAI API.
    // They read full records directly on-premise from local mock-employee.json,
    // construct local response templates, and return sentToAI: null with full staysLocal record.
    if (['check_service_book', 'check_career_record', 'check_property_return', 'check_complaints', 'check_capabilities', 'ask_leave_type', 'ask_leave_days', 'ask_leave_date', 'greeting', 'out_of_scope'].includes(intent)) {
      const isDevanagari = /[\u0900-\u097F]/.test(message);
      let localReply = '';
      let accessedLocalRecord = {};

      if (intent === 'check_service_book') {
        const sb = employee?.service_book || {};
        const years = employee?.service_years ?? 6.5;
        const designation = employee?.designation || 'Assistant Teacher';
        const district = employee?.posting_district || 'Sitapur';
        const school = sb.postings?.[0]?.school || 'GPS Sitapur East';
        const qualification = sb.education?.[0]?.qualification || 'B.Ed';
        const institution = sb.education?.[0]?.institution || 'Lucknow University';

        localReply = isDevanagari
          ? `नमस्ते! आपकी Service Book के अनुसार: ${years} साल की सेवा, current designation: ${designation}, posting: ${district} district (${school})। सेवा में कार्यग्रहण तिथि: ${sb.joining_date || '2019-07-15'}, योग्यता: ${qualification} (${institution})।`
          : `Namaste! Aapki Service Book ke anusaar: ${years} saal ki sewa, current designation: ${designation}, posting: ${district} district (${school}, joining: ${sb.joining_date || '2019-07-15'}, qualification: ${qualification} from ${institution}).`;

        accessedLocalRecord = {
          service_book_status: 'Read locally only (0 bytes sent to AI)',
          joining_date: sb.joining_date || '2019-07-15',
          designation_history: `${designation} (2019-07-15 to present)`,
          postings: `${school}, ${district}`,
          education: `${qualification}, ${institution} (2018)`,
        };
      } else if (intent === 'check_career_record') {
        const career = employee?.career_record || {};
        const rating = career.annual_appraisals?.[0]?.rating || 'Very Good';
        const appraisalYear = career.annual_appraisals?.[0]?.year || 2025;
        const trainingsCount = career.trainings_attended?.length || 1;
        const latestTraining = career.trainings_attended?.[0]?.name || 'Digital Classroom Training';
        const trainingDate = career.trainings_attended?.[0]?.date || '2025-03-10';

        localReply = isDevanagari
          ? `नमस्ते! आपके Career Record के अनुसार: नवीनतम वार्षिक मूल्यांकन (Annual Appraisal ${appraisalYear}) '${rating}' दर्ज है, एवं आपने कुल ${trainingsCount} प्रशिक्षण पूर्ण किए हैं (${latestTraining})।`
          : `Namaste! Aapke career record ke anusaar: latest annual appraisal (${appraisalYear}) '${rating}' hai, aur kul ${trainingsCount} training(s) attend ki hain (${latestTraining}, ${trainingDate}).`;

        accessedLocalRecord = {
          career_record_status: 'Read locally only (0 bytes sent to AI)',
          annual_appraisals: `Year ${appraisalYear}: ${rating}`,
          trainings_attended: `${latestTraining} (${trainingDate})`,
        };
      } else if (intent === 'check_property_return') {
        const prop = employee?.property_return || {};
        const status = prop.status || 'Filed';
        const nextDueDate = prop.next_due_date || '2027-01-31';
        const lastFiledDate = prop.last_filed_date || '2026-01-31';
        const assetsCount = prop.assets_declared_count || 3;
        const assetDetail = prop.assets_declared_detail?.[0]
          ? `${prop.assets_declared_detail[0].type}, ${prop.assets_declared_detail[0].location} (${prop.assets_declared_detail[0].value_declared})`
          : 'Residential Property, Sitapur (₹18,00,000)';

        localReply = isDevanagari
          ? `नमस्ते! आपका Property Return '${status}' है, अगली due date ${nextDueDate} है (पिछली फाइलिंग: ${lastFiledDate})। कुल घोषित संपत्तियां: ${assetsCount} (${assetDetail})।`
          : `Namaste! Aapka property return '${status}' hai, agli due date ${nextDueDate} hai (last filed: ${lastFiledDate}). Declared assets: ${assetsCount} (${assetDetail}).`;

        accessedLocalRecord = {
          property_return_status: 'Read locally only (0 bytes sent to AI)',
          last_filed_date: lastFiledDate,
          filing_status: status,
          next_due_date: nextDueDate,
          assets_declared_count: assetsCount,
          assets_declared_detail: `${assetDetail} [Strictly Confidential — Local Only]`,
        };
      } else if (intent === 'check_complaints') {
        const comp = employee?.complaints || {};
        const count = comp.submitted?.length || 0;
        const note = comp.status_note || 'No complaints on record';

        localReply = isDevanagari
          ? `नमस्ते! आपके eHRMS रिकॉर्ड पर कोई शिकायत या अनुशासनात्मक मामला दर्ज नहीं है (${count} complaints, status: '${note}')। आपका सेवा रिकॉर्ड पूर्णतः स्वच्छ है।`
          : `Namaste! Aapke record par koi complaint ya disciplinary action nahi hai (${count} complaints, status: '${note}'). Service record clean hai.`;

        accessedLocalRecord = {
          complaints_status: 'Read locally only (0 bytes sent to AI)',
          complaints_submitted: `${count} on record`,
          status_note: note,
        };
      } else if (intent === 'check_capabilities') {
        localReply = isDevanagari
          ? `नमस्ते! मैं **सेवासाथी (SevaSaathi)** हूँ — उत्तर प्रदेश मानव संपदा eHRMS का शासकीय सेवा एवं अवकाश सहायक। मैं आपकी निम्नलिखित सेवाओं में **शून्य डेटा जोखिम (Zero PII Exposure)** के साथ सहायता कर सकता हूँ:

1. 📝 **अवकाश आवेदन (Leave Applications):**
   • आकस्मिक (CL), उपार्जित (EL) एवं चिकित्सा (ML) अवकाश के लिए आवेदन
   • 3 दिन से अधिक के मेडिकल अवकाश पर मेडिकल सर्टिफिकेट संलग्न करना
   • तत्काल आवेदन ड्राफ्ट एवं यूनिक eHRMS Application ID के साथ सबमिशन

2. 📊 **अवकाश बैलेंस व पात्रता (Balance & Rules):**
   • शेष आकस्मिक, उपार्जित व मेडिकल अवकाश का बैलेंस चेक करना
   • अवकाश नियमों के अनुसार पात्रता का स्वतः सत्यापन

3. 🔍 **आवेदन स्थिति ट्रैकिंग (Status Tracking):**
   • अवकाश आवेदनों का लाइव स्टेटस ('Submitted', 'Approved', 'Rejected', 'Sent Back')
   • रिपोर्टिंग ऑफिसर (BSA / सक्षम प्राधिकारी) का अनुमोदन व रिमार्क देखना

4. 📖 **सेवा पुस्तिका (Service Book):**
   • कुल सेवा अवधि (Years of Service), वर्तमान पद (Designation), पदस्थापना जनपद एवं शैक्षणिक योग्यता

5. 📈 **करियर रिकॉर्ड (Career Record):**
   • नवीनतम वार्षिक मूल्यांकन (Annual Appraisal Rating) एवं पूर्ण किए गए सरकारी प्रशिक्षण

6. 🏠 **वार्षिक संपत्ति रिटर्न (Property Return):**
   • संपत्ति विवरणी फाइलिंग स्थिति, अंतिम तिथि एवं अगली ड्यू डेट (संपत्ति मूल्य व स्थान 100% स्थानीय सर्वर पर सुरक्षित)

7. ⚖️ **शिकायत एवं सतर्कता (Complaints & Vigilance):**
   • eHRMS रिकॉर्ड पर शिकायत अथवा अनुशासनात्मक स्थिति की जांच

🔒 **डेटा सुरक्षा गारंटी:** आपका व्यक्तिगत डेटा (नाम, आधार, वेतन, बैंक खाता आदि) कभी भी बाहरी AI को नहीं भेजा जाता है। आप नीचे दिए गए सुझाव चिप्स पर क्लिक करके या सीधे लिखकर पूछ सकते हैं!`
          : `Namaste! I am **SevaSaathi**, your AI-powered Government Service & Leave Assistant for UP Manav Sampada eHRMS. Here is everything I can assist you with — with **Zero PII Exposure**:

1. 📝 **Leave Applications (अवकाश आवेदन):**
   • Apply for Casual Leave (CL), Earned Leave (EL), and Medical Leave (ML)
   • Medical certificate attachment support for leaves exceeding 3 days
   • Instant draft generation & formal submission with a unique eHRMS Application ID

2. 📊 **Leave Balance & Entitlements (शेष अवकाश):**
   • Check available CL, EL, and ML balances anytime
   • Automated policy rules verification before applying

3. 🔍 **Application Status Tracking (आवेदन स्थिति):**
   • Live tracking across official states: 'Submitted', 'Approved', 'Rejected', or 'Sent Back'
   • View reporting officer notes and remarks (e.g. Smt. Anita Sharma, BSA)

4. 📖 **Service Book Details (सेवा पुस्तिका):**
   • Check years of service, designation history, posting district, and qualifications

5. 📈 **Career & Appraisal Record (करियर रिकॉर्ड):**
   • View latest Annual Appraisal rating and government trainings attended

6. 🏠 **Property Return Status (संपत्ति रिटर्न):**
   • Check filing status, last filed date, and next due date (all confidential asset values remain strictly on-premise)

7. ⚖️ **Complaints & Vigilance (शिकायत रिकॉर्ड):**
   • Verify disciplinary record and complaint status

🔒 **Privacy Guarantee:** No personal identity data is ever transmitted to external AI models. Click any quick-prompt chip below or ask in Hindi or English!`;

        accessedLocalRecord = {
          assistant_capabilities: 'Leave Applications, Balance Checks, Service Book, Career Record, Property Return, Complaints',
          privacy_architecture: 'Zero PII to AI — On-premise local policy evaluation',
        };
      } else if (intent === 'ask_leave_type') {
        const cl = employee?.leave_balance?.casual ?? 8;
        const el = employee?.leave_balance?.earned ?? 22;
        const ml = employee?.leave_balance?.medical ?? 12;

        localReply = isDevanagari
          ? `नमस्ते! आपके पास ये अवकाश विकल्प उपलब्ध हैं:
🌿 Casual Leave: ${cl} दिन उपलब्ध
💼 Earned Leave: ${el} दिन उपलब्ध
🏥 Medical Leave: ${ml} दिन उपलब्ध

आप कौन सी अवकाश लेना चाहते हैं?`
          : `Namaste! Aapke paas ye leave options hain:
🌿 Casual Leave: ${cl} days available
💼 Earned Leave: ${el} days available  
🏥 Medical Leave: ${ml} days available

Aap kaunsi leave lena chahte hain?`;

        accessedLocalRecord = {
          all_leaves_balance: `Casual: ${cl} days, Earned: ${el} days, Medical: ${ml} days`,
          prompt_for_selection: 'Waiting for employee leave type selection (Casual, Earned, Medical)',
        };
      } else if (intent === 'greeting') {
        const isHindiUser = isDevanagari || /\b(namaste|namaskar|shukriya|dhanyawad)\b/i.test(message);
        localReply = isHindiUser
          ? 'नमस्ते! 🙏 मैं सेवासाथी हूँ — आपका सरकारी सेवा एवं अवकाश सहायक। कृपया बताएं, मैं आपकी किस प्रकार सहायता कर सकता हूँ?'
          : 'Namaste! 🙏 I am SevaSaathi, your Government Service & Leave Assistant. How can I help you today?';
        accessedLocalRecord = { intent_handled: 'greeting — local only, 0 bytes sent to AI' };
      } else if (intent === 'out_of_scope') {
        localReply = isDevanagari
          ? 'नमस्ते। सेवासाथी केवल मानव संपदा eHRMS सेवाओं में सहायता के लिए अधिकृत है — अवकाश आवेदन, बैलेंस जांच, सेवा पुस्तिका, संपत्ति रिटर्न इत्यादि। यह विषय मेरे कार्यक्षेत्र से बाहर है।'
          : 'SevaSaathi is authorized only for Manav Sampada eHRMS services — leave applications, balance checks, service book, property return, and related queries. That topic falls outside my scope.';
        accessedLocalRecord = { intent_handled: 'out_of_scope — local only, 0 bytes sent to AI' };
      } else if (intent === 'ask_leave_days') {
        const leaveNameEn =
          leaveType === 'earned'  ? 'Earned Leave'
          : leaveType === 'medical' ? 'Medical Leave'
          : 'Casual Leave';
        const leaveNameHi =
          leaveType === 'earned'  ? 'उपार्जित अवकाश (Earned Leave)'
          : leaveType === 'medical' ? 'चिकित्सा अवकाश (Medical Leave)'
          : 'आकस्मिक अवकाश (Casual Leave)';
        const balance = employee?.leave_balance?.[leaveType] ?? 0;

        localReply = isDevanagari
          ? `ठीक है, ${leaveNameHi}। कितने दिन चाहिए, और किस तारीख से?`
          : `Theek hai, ${leaveNameEn}. Kitne din chahiye, aur kis tareekh se?`;

        accessedLocalRecord = {
          intent_handled: `ask_leave_days (${leaveType}) — local only, 0 bytes sent to AI`,
          balance_shown: `${leaveType}: ${balance} days`,
        };
      } else if (intent === 'ask_leave_date') {
        const leaveNameEn =
          leaveType === 'earned'  ? 'Earned Leave'
          : leaveType === 'medical' ? 'Medical Leave'
          : 'Casual Leave';
        const leaveNameHi =
          leaveType === 'earned'  ? 'उपार्जित अवकाश (Earned Leave)'
          : leaveType === 'medical' ? 'चिकित्सा अवकाश (Medical Leave)'
          : 'आकस्मिक अवकाश (Casual Leave)';

        localReply = isDevanagari
          ? `ठीक है, ${days} दिन की ${leaveNameHi}। कृपया अवकाश प्रारंभ की तारीख (start date) बताएं? (जैसे '15 सितंबर से' या 'कल से')`
          : `Theek hai, ${days} day(s) of ${leaveNameEn}. Kripya chhutti ki shuruat ki tareekh (start date) batayein? (e.g. '15 September se' ya 'kal se')`;

        accessedLocalRecord = {
          intent_handled: `ask_leave_date (${leaveType}, ${days} days) — local only, 0 bytes sent to AI`,
          prompt_for_date: 'Waiting for employee start date selection',
        };
      }

      await logAuditEventToKV({
        intent,
        api_call_made: false,
        payload_sent: null,
        model: 'none (local response)',
        response_summary: localReply.slice(0, 120),
      });

      const nextPendingType = (intent === 'ask_leave_days' || intent === 'ask_leave_date') ? leaveType : null;
      const nextPendingDays = intent === 'ask_leave_date' ? days : null;

      return NextResponse.json({
        aiMessage: localReply,
        reply: localReply,
        requiresMedicalDocument: false,
        conversationState: {
          activeLeaveDraft,
          lastCreatedApplication,
          pendingLeaveType: nextPendingType,
          pendingDays: nextPendingDays,
        },
        activeLeaveDraft,
        lastCreatedApplication,
        pendingLeaveType: nextPendingType,
        pendingDays: nextPendingDays,
        dataBoundary: {
          staysLocal: {
            name: employee?.name || '',
            employee_id: employee?.employee_id || '',
            department: employee?.department || '',
            posting_district: employee?.posting_district || '',
            uploaded_document: 'None',
            ...accessedLocalRecord,
          },
          sentToAI: null,
        },
      });
    }

    // 4. Handle derived payload according to intent
    let derivedPayload = null;
    let submissionResult = null;
    let needsMedicalDoc = false;

    if (intent === 'apply_leave') {
      const eligibility = checkLeaveEligibility(employee, leaveType, days);

      // Check if medical leave exceeding 3 days requires a medical certificate
      const isMedicalOver3 = leaveType === 'medical' && days > 3;
      if (isMedicalOver3 && !documentAttached) {
        needsMedicalDoc = true;
      }

      activeLeaveDraft = {
        leaveType,
        days,
        startDate,
        endDate,
        current_balance: eligibility.current_balance,
        eligible: eligibility.eligible,
        documentAttached: Boolean(documentAttached),
        documentRequired: isMedicalOver3,
        requiresSpecialSanction: eligibility.requiresSpecialSanction || false,
        specialSanctionReason: eligibility.specialSanctionReason || '',
      };

      derivedPayload = {
        leave_type: leaveType,
        days_requested: days,
        current_balance: eligibility.current_balance,
        eligible: eligibility.eligible,
        posting_category: employee?.posting_category || 'RURAL',
        ...(isMedicalOver3 ? { document_required: true, document_attached: Boolean(documentAttached) } : {}),
        ...(eligibility.requiresSpecialSanction ? { requires_special_sanction: true, sanction_reason: eligibility.specialSanctionReason } : {}),
      };
    } else if (intent === 'confirm_apply') {
      const draft = activeLeaveDraft || {
        leaveType: 'casual',
        days: 3,
        startDate: '2026-09-01',
        endDate: '2026-09-03',
        current_balance: 8,
        documentAttached: false,
      };

      const docFlag = documentAttached || draft.documentAttached || false;

      submissionResult = submitLeaveApplication(
        employee,
        draft.leaveType,
        draft.days,
        draft.startDate,
        draft.endDate,
        docFlag
      );

      if (submissionResult.error) {
        needsMedicalDoc = true;
        derivedPayload = {
          leave_type: draft.leaveType,
          days_requested: draft.days,
          current_balance: draft.current_balance ?? 12,
          eligible: false,
          error: submissionResult.error,
          posting_category: employee?.posting_category || 'RURAL',
        };
      } else {
        lastCreatedApplication = {
          id: submissionResult.application_id,
          type: draft.leaveType,
          days: draft.days,
          status: 'Submitted', // eHRMS first-state term
          routed_to: submissionResult.routed_to,
          documentAttached: docFlag,
          specialSanctionRequired: submissionResult.specialSanctionRequired || false,
          specialSanctionReason: submissionResult.specialSanctionReason || '',
          submittedAt: new Date().toISOString(),
        };
        activeLeaveDraft = null;

        // Deduct leave balance in employee record & update leave_history
        const normType = (draft.leaveType || 'casual').toLowerCase();
        if (employee.leave_balance && typeof employee.leave_balance[normType] === 'number') {
          employee.leave_balance[normType] = Math.max(0, employee.leave_balance[normType] - Number(draft.days));
        }

        if (!Array.isArray(employee.leave_history)) {
          employee.leave_history = [];
        }
        employee.leave_history.unshift(lastCreatedApplication);

        // Persist updated employee record & new application object in Vercel KV
        await saveEmployeeToKV(employee);
        await persistApplicationToKV(lastCreatedApplication);

        derivedPayload = {
          leave_type: draft.leaveType,
          days_requested: draft.days,
          current_balance: employee.leave_balance?.[normType] ?? draft.current_balance ?? 8,
          eligible: true,
          posting_category: employee?.posting_category || 'RURAL',
          status: 'Submitted',
          ...(docFlag ? { document_attached: true } : {}),
          ...(submissionResult.specialSanctionRequired ? { requires_special_sanction: true, routed_authority: submissionResult.routed_to } : {}),
        };
      }
    } else if (intent === 'check_balance') {
      const eligibility = checkLeaveEligibility(employee, leaveType, days);

      derivedPayload = {
        leave_type: leaveType,
        days_requested: days,
        current_balance: eligibility.current_balance,
        eligible: eligibility.current_balance > 0,
        posting_category: employee?.posting_category || 'RURAL',
      };
    } else {
      // restricted, check_status, other: NO employee data lookup attempted -> sentToAI is null
      derivedPayload = null;
    }

    // 5. Fetch matched policy text
    const policyText = intent === 'restricted' ? '' : getRelevantPolicy(message);

    // 6. Call OpenAI API with eHRMS status terminology
    const systemPrompt =
      'You are SevaSaathi, an AI assistant for UP government employees using Manav Sampada eHRMS. You only ever receive anonymized, derived data — never employee names, IDs, or department details. Respond in the same language the user wrote in (Hindi or English), warmly and simply, like a helpful colleague, not a form. Use real Manav Sampada eHRMS status terminology throughout: an application starts as "Submitted" (never "Pending"), and after review by the reporting officer becomes "Approved" or "Rejected", or "Sent Back" if revisions or clarifications are needed. When confirming a submitted application, explicitly state that the application status is "Submitted" (not "Pending") and mention that it will show as "Sent Back" if the reporting officer needs changes, or "Approved"/"Rejected" once reviewed. When reporting a status check, report the exact status ("Approved", "Submitted", "Sent Back", "Rejected") and include the reporting officer\'s remark if one exists on the application (e.g. Approved by Smt. Anita Sharma — "Approved - enjoy your leave"). For service book, career record, property return, and complaints inquiries, answer warmly and accurately based only on the provided derived payload. If the user asks for anything outside official service records — colleague salary, others\' personal data, bank or Aadhaar details — politely decline and tell them to use the verified official portal for that.';

    let userMessageContent = '';
    if (derivedPayload) {
      userMessageContent += `[Derived Payload]\n${JSON.stringify(derivedPayload, null, 2)}\n\n`;
    }
    if (policyText) {
      userMessageContent += `[Matched Policy Text]\n${policyText}\n\n`;
    }
    userMessageContent += `[User Message]\n${message}`;

    const formattedHistory = Array.isArray(conversationHistory)
      ? conversationHistory
          .slice(-6)
          .map((item) => ({
            role: item.role || (item.sender === 'user' ? 'user' : 'assistant'),
            content: item.content || item.text || '',
          }))
          .filter((item) => item.content && (item.role === 'user' || item.role === 'assistant'))
      : [];

    const openAiMessages = [
      { role: 'system', content: systemPrompt },
      ...formattedHistory,
      { role: 'user', content: userMessageContent },
    ];

    let aiResponse = '';
    const apiKey = process.env.OPENAI_API_KEY;

    if (apiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            messages: openAiMessages,
            temperature: 0.6,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          aiResponse = data.choices?.[0]?.message?.content || '';
        } else {
          aiResponse = generateLocalResponse({
            message,
            intent,
            leaveType,
            days,
            derivedPayload,
            policyText,
            employee,
            needsMedicalDoc,
            lastCreatedApplication,
          });
        }
      } catch {
        aiResponse = generateLocalResponse({
          message,
          intent,
          leaveType,
          days,
          derivedPayload,
          policyText,
          employee,
          needsMedicalDoc,
          lastCreatedApplication,
        });
      }
    } else {
      aiResponse = generateLocalResponse({
        message,
        intent,
        leaveType,
        days,
        derivedPayload,
        policyText,
        employee,
        needsMedicalDoc,
        lastCreatedApplication,
      });
    }

    // 7. Append real routing/ID details SEPARATELY on the server (not via the AI)
    let finalAiMessage = aiResponse.trim();
    if (submissionResult && submissionResult.application_id) {
      const routingOfficer =
        submissionResult.routed_to || employee?.reporting_officer || 'Reporting Officer';
      let details = `\n\nApplication ID: ${submissionResult.application_id}, Status: Submitted, sent to ${routingOfficer}`;
      if (submissionResult.documentAttached || submissionResult.leaveType === 'medical') {
        details += `\nMedical certificate: attached.`;
      }
      if (submissionResult.specialSanctionRequired && submissionResult.specialSanctionReason) {
        details += `\nSpecial Sanction Note: ${submissionResult.specialSanctionReason}`;
      }
      finalAiMessage = `${finalAiMessage}${details}`;
    }

    // Log audit event to Vercel KV
    await logAuditEventToKV({
      intent,
      api_call_made: Boolean(process.env.OPENAI_API_KEY && intent !== 'restricted'),
      payload_sent: derivedPayload,
      model: process.env.OPENAI_API_KEY && intent !== 'restricted' ? (process.env.OPENAI_MODEL || 'gpt-4o-mini') : 'none (local response)',
      response_summary: finalAiMessage.slice(0, 120),
    });

    // 8. Return to client with strict data boundary and document upload indicator
    return NextResponse.json({
      aiMessage: finalAiMessage,
      reply: finalAiMessage, // Backwards compatibility for ChatWindow
      requiresMedicalDocument: Boolean(needsMedicalDoc),
      conversationState: {
        activeLeaveDraft,
        lastCreatedApplication,
        pendingLeaveType: null,
        pendingDays: null,
      },
      activeLeaveDraft,
      lastCreatedApplication,
      pendingLeaveType: null,
      pendingDays: null,
      dataBoundary: {
        staysLocal: {
          name: employee?.name || '',
          employee_id: employee?.employee_id || '',
          department: employee?.department || '',
          posting_district: employee?.posting_district || '',
          uploaded_document: documentAttached ? 'Medical certificate (unprocessed)' : 'None',
          ...(employee?.property_return
            ? { assets_declared_detail: 'Residential Property (₹18,00,000) [Confidential]' }
            : {}),
        },
        sentToAI: derivedPayload,
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing the chat request.' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  const urlObj = new URL(request.url || 'http://localhost/api/chat');
  const reqEmpId = urlObj.searchParams.get('emp') || request.headers.get('x-employee-id') || 'UP-EHRMS-88213';
  const employee = await getEmployeeFromKV(reqEmpId.toString());
  return NextResponse.json({
    status: 'online',
    service: 'SevaSaathi Chat API',
    employee_id: employee?.employee_id,
    employee_name: employee?.name,
    department: employee?.department,
    employeeConfigured: Boolean(employee && Object.keys(employee).length > 0),
    leave_balance: employee?.leave_balance || { casual: 8, earned: 22, medical: 12 },
    leave_history: employee?.leave_history || [],
  });
}
