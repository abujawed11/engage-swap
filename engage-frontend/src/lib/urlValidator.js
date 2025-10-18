/**
 * Frontend URL Validator Integration
 *
 * Client-side utilities for validating URLs against EngageSwap policies.
 */

import { apiRequest } from './api';

/**
 * Validation states
 */
export const VALIDATION_STATE = {
  IDLE: 'IDLE',           // No validation in progress
  VERIFYING: 'VERIFYING', // Validation in progress
  VALID: 'VALID',         // URL passed validation
  INVALID: 'INVALID',     // URL failed validation (user error)
  RETRY: 'RETRY'          // Validation error (system error, should retry)
};

/**
 * Validate a URL against EngageSwap policies
 *
 * @param {string} url - The URL to validate
 * @returns {Promise<object>} Validation result
 */
export async function validateURL(url) {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/validator/check-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        } : {})
      },
      body: JSON.stringify({ url })
    });

    const data = await response.json();

    // Handle rate limiting
    if (response.status === 429) {
      return {
        state: VALIDATION_STATE.RETRY,
        message: data.error?.message || 'Too many validation requests. Please try again later.',
        retryAfter: data.error?.retry_after_seconds,
        correlationId: null
      };
    }

    // Handle validation result
    if (data.verdict === 'VALID') {
      return {
        state: VALIDATION_STATE.VALID,
        message: data.message || 'URL is valid and accessible',
        correlationId: data.correlation_id
      };
    } else if (data.verdict === 'INVALID') {
      return {
        state: VALIDATION_STATE.INVALID,
        message: data.message,
        rejectionReason: data.rejection_reason,
        userFriendly: data.user_friendly,
        correlationId: data.correlation_id
      };
    } else if (data.verdict === 'RETRY') {
      return {
        state: VALIDATION_STATE.RETRY,
        message: data.message || 'Unable to validate URL. Please try again.',
        correlationId: data.correlation_id
      };
    }

    // Unexpected response
    return {
      state: VALIDATION_STATE.RETRY,
      message: 'Unexpected validation response. Please try again.',
      correlationId: null
    };

  } catch (error) {
    console.error('URL validation error:', error);
    return {
      state: VALIDATION_STATE.RETRY,
      message: 'Network error. Please check your connection and try again.',
      correlationId: null
    };
  }
}

/**
 * Get user-friendly icon for validation state
 */
export function getValidationIcon(state) {
  switch (state) {
    case VALIDATION_STATE.IDLE:
      return null;
    case VALIDATION_STATE.VERIFYING:
      return '🔍';
    case VALIDATION_STATE.VALID:
      return '✅';
    case VALIDATION_STATE.INVALID:
      return '❌';
    case VALIDATION_STATE.RETRY:
      return '⚠️';
    default:
      return null;
  }
}

/**
 * Get CSS classes for validation state
 */
export function getValidationStyles(state) {
  switch (state) {
    case VALIDATION_STATE.IDLE:
      return '';
    case VALIDATION_STATE.VERIFYING:
      return 'border-blue-500 bg-blue-50';
    case VALIDATION_STATE.VALID:
      return 'border-green-500 bg-green-50';
    case VALIDATION_STATE.INVALID:
      return 'border-red-500 bg-red-50';
    case VALIDATION_STATE.RETRY:
      return 'border-yellow-500 bg-yellow-50';
    default:
      return '';
  }
}
