import { checkLeaveEligibility, submitLeaveApplication } from './rulesEngine';
import { parseUserIntent } from '../app/api/chat/route';

describe('Rules Engine & Intent Parser Unit Tests', () => {
  const mockEmployee = {
    employee_id: 'UP-EHRMS-88213',
    name: 'Ravi Kumar',
    department: 'Basic Education',
    reporting_officer: 'Smt. Anita Sharma, BSA',
    leave_balance: {
      casual: 8,
      earned: 22,
      medical: 12,
    },
  };

  describe('checkLeaveEligibility', () => {
    test('sufficient balance → eligible true', () => {
      const result = checkLeaveEligibility(mockEmployee, 'casual', 3);
      expect(result.eligible).toBe(true);
      expect(result.current_balance).toBe(8);
      expect(result.remaining_after).toBe(5);
      expect(result.reason).toBe('Sufficient balance');
    });

    test('insufficient balance → eligible false, correct reason message', () => {
      const result = checkLeaveEligibility(mockEmployee, 'casual', 15);
      expect(result.eligible).toBe(false);
      expect(result.current_balance).toBe(8);
      expect(result.reason).toContain('Requested days (15) exceed available casual balance (8)');
    });

    test('casual leave > 5 days requires special sanction', () => {
      const result = checkLeaveEligibility(mockEmployee, 'casual', 6);
      expect(result.eligible).toBe(true);
      expect(result.requiresSpecialSanction).toBe(true);
    });

    test('medical leave > 3 days requires medical doc', () => {
      const result = checkLeaveEligibility(mockEmployee, 'medical', 4);
      expect(result.eligible).toBe(true);
      expect(result.requiresMedicalDoc).toBe(true);
    });
  });

  describe('submitLeaveApplication', () => {
    test('eligible case → returns valid application object with eHRMS ID and Submitted status', () => {
      const result = submitLeaveApplication(
        mockEmployee,
        'casual',
        2,
        '2026-09-01',
        '2026-09-02'
      );

      expect(result.application_id).toMatch(/^LV-2026-\d{4}$/);
      expect(result.status).toBe('Submitted');
      expect(result.leaveType).toBe('casual');
      expect(result.days).toBe(2);
      expect(result.routed_to).toBe('Smt. Anita Sharma, BSA');
    });

    test('ineligible case → returns error, no application created', () => {
      const result = submitLeaveApplication(
        mockEmployee,
        'casual',
        20,
        '2026-09-01',
        '2026-09-20'
      );

      expect(result.error).toBeDefined();
      expect(result.application_id).toBeUndefined();
      expect(result.error).toContain('exceed available casual balance');
    });

    test('medical leave > 3 days without document → returns error', () => {
      const result = submitLeaveApplication(
        mockEmployee,
        'medical',
        5,
        '2026-09-01',
        '2026-09-05',
        false
      );

      expect(result.error).toContain('Medical certificate required');
    });
  });

  describe('parseUserIntent 3-Step Guided Flow vs Shortcut', () => {
    test('STEP 1: vague request ("mereko leave chahiye") → triggers ask_leave_type', () => {
      const intentResult = parseUserIntent('mereko leave chahiye');
      expect(intentResult.intent).toBe('ask_leave_type');
    });

    test('STEP 2: leave type given ("casual") → triggers ask_leave_days with leaveType casual', () => {
      const intentResult = parseUserIntent('casual');
      expect(intentResult.intent).toBe('ask_leave_days');
      expect(intentResult.leaveType).toBe('casual');
    });

    test('STEP 3: days given with pendingLeaveType ("3 din agle hafte se") → triggers apply_leave', () => {
      const intentResult = parseUserIntent('3 din agle hafte se', [], false, null, 'casual');
      expect(intentResult.intent).toBe('apply_leave');
      expect(intentResult.leaveType).toBe('casual');
      expect(intentResult.days).toBe(3);
    });

    test('SHORTCUT: single message with both leave type & days ("Mujhe agle hafte 3 din ki casual leave chahiye") → skips to apply_leave', () => {
      const intentResult = parseUserIntent('Mujhe agle hafte 3 din ki casual leave chahiye');
      expect(intentResult.intent).toBe('apply_leave');
      expect(intentResult.leaveType).toBe('casual');
      expect(intentResult.days).toBe(3);
    });
  });
});
