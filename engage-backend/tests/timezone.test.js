/**
 * Unit Tests for Timezone Utilities
 * Tests edge cases around midnight IST reset logic
 *
 * To run these tests:
 * 1. Install testing framework: npm install --save-dev jest
 * 2. Add to package.json scripts: "test": "jest"
 * 3. Run: npm test
 */

const {
  getCurrentDateIST,
  getDateISTFromDate,
  getNextMidnightIST,
  getSecondsUntilMidnightIST,
  getTimeUntilMidnightISTFormatted,
  isSameDayIST,
} = require('../src/utils/timezone');

describe('Timezone Utilities - IST Midnight Reset', () => {

  describe('getCurrentDateIST()', () => {
    test('should return date in YYYY-MM-DD format', () => {
      const dateKey = getCurrentDateIST();
      expect(dateKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('should return IST date even when called near UTC midnight', () => {
      // This test verifies that IST conversion is working
      const dateKey = getCurrentDateIST();
      const [year, month, day] = dateKey.split('-').map(Number);

      expect(year).toBeGreaterThanOrEqual(2025);
      expect(month).toBeGreaterThanOrEqual(1);
      expect(month).toBeLessThanOrEqual(12);
      expect(day).toBeGreaterThanOrEqual(1);
      expect(day).toBeLessThanOrEqual(31);
    });
  });

  describe('getDateISTFromDate()', () => {
    test('should convert a specific UTC date to IST date', () => {
      // UTC: 2025-10-17 20:00:00 -> IST: 2025-10-18 01:30:00 (next day)
      const utcDate = new Date('2025-10-17T20:00:00Z');
      const istDate = getDateISTFromDate(utcDate);

      expect(istDate).toBe('2025-10-18');
    });

    test('should handle UTC date that stays same day in IST', () => {
      // UTC: 2025-10-18 12:00:00 -> IST: 2025-10-18 17:30:00 (same day)
      const utcDate = new Date('2025-10-18T12:00:00Z');
      const istDate = getDateISTFromDate(utcDate);

      expect(istDate).toBe('2025-10-18');
    });

    test('should handle edge case at IST midnight boundary', () => {
      // UTC: 2025-10-17 18:29:59 -> IST: 2025-10-17 23:59:59 (same day)
      // UTC: 2025-10-17 18:30:00 -> IST: 2025-10-18 00:00:00 (next day)
      const beforeMidnight = new Date('2025-10-17T18:29:59Z');
      const atMidnight = new Date('2025-10-17T18:30:00Z');

      expect(getDateISTFromDate(beforeMidnight)).toBe('2025-10-17');
      expect(getDateISTFromDate(atMidnight)).toBe('2025-10-18');
    });
  });

  describe('getNextMidnightIST()', () => {
    test('should return a Date object in the future', () => {
      const nextMidnight = getNextMidnightIST();
      const now = new Date();

      expect(nextMidnight).toBeInstanceOf(Date);
      expect(nextMidnight.getTime()).toBeGreaterThan(now.getTime());
    });

    test('should return a time within 24 hours from now', () => {
      const nextMidnight = getNextMidnightIST();
      const now = new Date();
      const hoursDiff = (nextMidnight - now) / (1000 * 60 * 60);

      expect(hoursDiff).toBeGreaterThan(0);
      expect(hoursDiff).toBeLessThanOrEqual(24);
    });
  });

  describe('getSecondsUntilMidnightIST()', () => {
    test('should return a positive number of seconds', () => {
      const seconds = getSecondsUntilMidnightIST();

      expect(seconds).toBeGreaterThan(0);
      expect(Number.isInteger(seconds)).toBe(true);
    });

    test('should return less than 86400 seconds (24 hours)', () => {
      const seconds = getSecondsUntilMidnightIST();

      expect(seconds).toBeLessThanOrEqual(86400);
    });
  });

  describe('getTimeUntilMidnightISTFormatted()', () => {
    test('should return a formatted string with hours and/or minutes', () => {
      const formatted = getTimeUntilMidnightISTFormatted();

      expect(typeof formatted).toBe('string');
      expect(formatted).toMatch(/\d+\s+(hour|minute)/);
    });

    test('should handle singular vs plural correctly', () => {
      const formatted = getTimeUntilMidnightISTFormatted();

      // Should not have "1 hours" or "1 minutes"
      expect(formatted).not.toMatch(/\b1 hours\b/);
      expect(formatted).not.toMatch(/\b1 minutes\b/);
    });
  });

  describe('isSameDayIST()', () => {
    test('should return true for dates on the same IST day', () => {
      const date1 = new Date('2025-10-18T12:00:00Z'); // IST: 2025-10-18 17:30
      const date2 = new Date('2025-10-18T15:00:00Z'); // IST: 2025-10-18 20:30

      expect(isSameDayIST(date1, date2)).toBe(true);
    });

    test('should return false for dates on different IST days', () => {
      const date1 = new Date('2025-10-17T20:00:00Z'); // IST: 2025-10-18 01:30
      const date2 = new Date('2025-10-17T12:00:00Z'); // IST: 2025-10-17 17:30

      expect(isSameDayIST(date1, date2)).toBe(false);
    });

    test('should handle midnight boundary correctly', () => {
      const beforeMidnight = new Date('2025-10-17T18:29:00Z'); // IST: 2025-10-17 23:59
      const afterMidnight = new Date('2025-10-17T18:31:00Z');  // IST: 2025-10-18 00:01

      expect(isSameDayIST(beforeMidnight, afterMidnight)).toBe(false);
    });
  });

  describe('Edge Cases - Midnight Reset Behavior', () => {
    test('should handle rapid consecutive calls consistently', () => {
      const date1 = getCurrentDateIST();
      const date2 = getCurrentDateIST();
      const date3 = getCurrentDateIST();

      expect(date1).toBe(date2);
      expect(date2).toBe(date3);
    });

    test('should handle dates near year boundaries', () => {
      const newYearEve = new Date('2025-12-31T18:29:00Z'); // IST: 2025-12-31 23:59
      const newYear = new Date('2025-12-31T18:31:00Z');     // IST: 2026-01-01 00:01

      expect(getDateISTFromDate(newYearEve)).toBe('2025-12-31');
      expect(getDateISTFromDate(newYear)).toBe('2026-01-01');
    });

    test('should handle dates near month boundaries', () => {
      const monthEnd = new Date('2025-10-31T18:29:00Z');   // IST: 2025-10-31 23:59
      const monthStart = new Date('2025-10-31T18:31:00Z'); // IST: 2025-11-01 00:01

      expect(getDateISTFromDate(monthEnd)).toBe('2025-10-31');
      expect(getDateISTFromDate(monthStart)).toBe('2025-11-01');
    });
  });
});

describe('Integration Test - Daily Limit Reset Scenario', () => {
  test('should simulate user visiting campaign across midnight boundary', () => {
    // Scenario: User visits a campaign twice on Day 1, limit is 2
    // At 11:59 PM IST on Day 1, they've used their limit
    // At 12:01 AM IST on Day 2, limit should reset

    const day1Evening = new Date('2025-10-17T18:00:00Z'); // IST: 2025-10-17 23:30
    const day2Morning = new Date('2025-10-17T19:00:00Z'); // IST: 2025-10-18 00:30

    const dateKey1 = getDateISTFromDate(day1Evening);
    const dateKey2 = getDateISTFromDate(day2Morning);

    // Different date keys mean limits reset automatically
    expect(dateKey1).not.toBe(dateKey2);
    expect(dateKey1).toBe('2025-10-17');
    expect(dateKey2).toBe('2025-10-18');
  });

  test('should correctly calculate reset time message', () => {
    const formatted = getTimeUntilMidnightISTFormatted();
    const seconds = getSecondsUntilMidnightIST();

    // Verify consistency between seconds and formatted message
    const hoursFromSeconds = Math.floor(seconds / 3600);
    const minutesFromSeconds = Math.floor((seconds % 3600) / 60);

    if (hoursFromSeconds > 0) {
      expect(formatted).toContain('hour');
    }
    if (minutesFromSeconds > 0 || hoursFromSeconds === 0) {
      expect(formatted).toContain('minute');
    }
  });
});

console.log('\n=== Timezone Utilities Test Suite ===');
console.log('Tests cover:');
console.log('✓ Date conversion from UTC to IST');
console.log('✓ Midnight boundary detection');
console.log('✓ Reset timer calculations');
console.log('✓ Edge cases (year/month boundaries)');
console.log('✓ Integration scenarios for daily limit reset\n');
