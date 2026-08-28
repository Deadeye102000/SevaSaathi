/**
 * Rules Engine for SevaSaathi
 * Pure deterministic logic operating on the full local employee object.
 * No AI or external API calls.
 */

/**
 * Checks if an employee is eligible for the requested leave duration.
 * Reads employee.leave_balance[leaveType].
 *
 * @param {Object} employee - The full local employee object
 * @param {string} leaveType - Leave type (e.g. 'casual', 'earned', 'medical')
 * @param {number} days - Number of leave days requested
 * @returns {{
 *   eligible: boolean,
 *   requested_days: number,
 *   current_balance: number,
 *   remaining_after: number,
 *   reason: string
 * }}
 */
export function checkLeaveEligibility(employee, leaveType, days) {
  const requestedDays = typeof days === 'number' ? days : Number(days) || 0;
  const balances = employee?.leave_balance || employee?.leaveBalances || {};
  const normalizedType = (leaveType || 'casual').toLowerCase();
  const currentBalance = typeof balances[normalizedType] === 'number'
    ? balances[normalizedType]
    : (Number(balances[normalizedType]) || 0);

  if (requestedDays <= 0) {
    return {
      eligible: false,
      leaveType: normalizedType,
      requested_days: requestedDays,
      current_balance: currentBalance,
      remaining_after: currentBalance,
      reason: 'Requested days must be greater than zero',
      requiresSpecialSanction: false,
      requiresMedicalDoc: false,
    };
  }

  if (currentBalance < requestedDays) {
    return {
      eligible: false,
      leaveType: normalizedType,
      requested_days: requestedDays,
      current_balance: currentBalance,
      remaining_after: currentBalance,
      reason: `Requested days (${requestedDays}) exceed available ${normalizedType} balance (${currentBalance})`,
      requiresSpecialSanction: false,
      requiresMedicalDoc: false,
    };
  }

  // Type-specific policy rules
  let requiresSpecialSanction = false;
  let specialSanctionReason = '';
  let requiresMedicalDoc = false;
  let medicalDocReason = '';

  if (normalizedType === 'casual' && requestedDays > 5) {
    requiresSpecialSanction = true;
    specialSanctionReason = 'Casual leave exceeding 5 consecutive days requires special sanction from the reporting officer.';
  } else if (normalizedType === 'earned' && requestedDays > 15) {
    requiresSpecialSanction = true;
    specialSanctionReason = 'Earned leave exceeding 15 days requires additional sanction from District Basic Education Officer (BSA).';
  } else if (normalizedType === 'medical' && requestedDays > 3) {
    requiresMedicalDoc = true;
    medicalDocReason = 'Medical certificate from a registered practitioner is required for medical leave exceeding 3 days.';
  }

  return {
    eligible: true,
    leaveType: normalizedType,
    requested_days: requestedDays,
    current_balance: currentBalance,
    remaining_after: currentBalance - requestedDays,
    reason: 'Sufficient balance',
    requiresSpecialSanction,
    specialSanctionReason,
    requiresMedicalDoc,
    medicalDocReason,
  };
}

/**
 * Submits a mock leave application after verifying eligibility.
 * Status is set to "Submitted" matching real Manav Sampada eHRMS status model.
 *
 * @param {Object} employee - The employee object
 * @param {string} leaveType - Leave type (e.g. 'casual', 'earned', 'medical')
 * @param {number} days - Number of leave days requested
 * @param {string} startDate - Start date of the leave
 * @param {string} endDate - End date of the leave
 * @param {boolean} [documentAttached=false] - Whether a medical certificate is attached
 * @returns {Object} Mock application object if eligible, or { error: string } if not eligible
 */
export function submitLeaveApplication(
  employee,
  leaveType,
  days,
  startDate,
  endDate,
  documentAttached = false
) {
  const eligibility = checkLeaveEligibility(employee, leaveType, days);

  if (!eligibility.eligible) {
    return {
      error: eligibility.reason,
    };
  }

  const normalizedType = (leaveType || 'casual').toLowerCase();
  const requestedDays = Number(days) || 0;

  if (normalizedType === 'medical' && requestedDays > 3 && !documentAttached) {
    return {
      error: 'Medical certificate required for leave exceeding 3 days.',
    };
  }

  const randomFourDigits = Math.floor(1000 + Math.random() * 9000);

  // Determine routing officer according to government jurisdiction
  let routedTo = employee?.reporting_officer ?? employee?.reportingOfficer ?? 'Smt. Anita Sharma, BSA';
  if (normalizedType === 'earned' && requestedDays > 15) {
    routedTo = 'District Basic Education Officer (BSA), Sitapur';
  }

  return {
    application_id: `LV-2026-${randomFourDigits}`,
    status: 'Submitted',
    routed_to: routedTo,
    leaveType: normalizedType,
    days: requestedDays,
    startDate,
    endDate,
    documentAttached: Boolean(documentAttached),
    specialSanctionRequired: eligibility.requiresSpecialSanction || false,
    specialSanctionReason: eligibility.specialSanctionReason || '',
  };
}

/**
 * Updates an application status to one of the real Manav Sampada eHRMS lifecycle states:
 * "Submitted", "Sent Back", "Approved", "Rejected", and optionally attaches a remark.
 *
 * @param {Object} application - The application object
 * @param {('Submitted'|'Sent Back'|'Approved'|'Rejected')} newStatus - New eHRMS status
 * @param {string} [remark=''] - Optional reporting officer remark/note
 * @returns {Object} Updated application object
 */
export function updateApplicationStatus(application, newStatus, remark = '') {
  const validStatuses = ['Submitted', 'Sent Back', 'Approved', 'Rejected'];
  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}. Must be one of: ${validStatuses.join(', ')}`);
  }

  return {
    ...application,
    status: newStatus,
    ...(remark ? { remark } : {}),
  };
}

/**
 * Backward compatibility helper for evaluating leave requests
 */
export function evaluateLeaveRequest(employee, leaveType, daysRequested) {
  const res = checkLeaveEligibility(employee, leaveType, daysRequested);
  return {
    eligible: res.eligible,
    reason: res.reason,
    remainingBalance: res.remaining_after,
  };
}

/**
 * Retrieves a summary of all leave balances for the employee
 */
export function getLeaveBalancesSummary(employee) {
  const balances = employee?.leave_balance || employee?.leaveBalances || {};
  return Object.entries(balances).map(([type, balance]) => ({
    type,
    balance: Number(balance) || 0,
  }));
}

const rulesEngine = {
  checkLeaveEligibility,
  submitLeaveApplication,
  updateApplicationStatus,
  evaluateLeaveRequest,
  getLeaveBalancesSummary,
};

export default rulesEngine;
