/**
 * useURLValidation Hook
 *
 * React hook for debounced URL validation with state management.
 */

import { useState, useEffect, useRef } from 'react';
import { validateURL, VALIDATION_STATE } from '../lib/urlValidator';

const DEBOUNCE_DELAY = 500; // 500ms delay after user stops typing

/**
 * Hook for URL validation with debouncing
 *
 * @param {string} url - The URL to validate
 * @param {boolean} enabled - Whether validation is enabled
 * @returns {object} Validation state and result
 */
export function useURLValidation(url, enabled = true) {
  const [state, setState] = useState(VALIDATION_STATE.IDLE);
  const [result, setResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const debounceTimer = useRef(null);
  const abortController = useRef(null);

  useEffect(() => {
    // Reset state if URL is empty
    if (!url || url.trim() === '') {
      setState(VALIDATION_STATE.IDLE);
      setResult(null);
      setIsValidating(false);
      return;
    }

    // Skip validation if disabled
    if (!enabled) {
      return;
    }

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Abort any ongoing validation
    if (abortController.current) {
      abortController.current.abort();
    }

    // Set debounced validation
    debounceTimer.current = setTimeout(async () => {
      setState(VALIDATION_STATE.VERIFYING);
      setIsValidating(true);

      try {
        abortController.current = new AbortController();
        const validationResult = await validateURL(url);

        setState(validationResult.state);
        setResult(validationResult);
      } catch (error) {
        console.error('Validation error:', error);
        setState(VALIDATION_STATE.RETRY);
        setResult({
          state: VALIDATION_STATE.RETRY,
          message: 'An error occurred during validation. Please try again.'
        });
      } finally {
        setIsValidating(false);
      }
    }, DEBOUNCE_DELAY);

    // Cleanup on unmount or when URL changes
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [url, enabled]);

  /**
   * Manually trigger validation (bypasses debounce)
   */
  const validateNow = async () => {
    if (!url || url.trim() === '') {
      return;
    }

    // Clear debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    setState(VALIDATION_STATE.VERIFYING);
    setIsValidating(true);

    try {
      const validationResult = await validateURL(url);
      setState(validationResult.state);
      setResult(validationResult);
    } catch (error) {
      console.error('Validation error:', error);
      setState(VALIDATION_STATE.RETRY);
      setResult({
        state: VALIDATION_STATE.RETRY,
        message: 'An error occurred during validation. Please try again.'
      });
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * Reset validation state
   */
  const reset = () => {
    setState(VALIDATION_STATE.IDLE);
    setResult(null);
    setIsValidating(false);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    if (abortController.current) {
      abortController.current.abort();
    }
  };

  return {
    state,
    result,
    isValidating,
    isValid: state === VALIDATION_STATE.VALID,
    isInvalid: state === VALIDATION_STATE.INVALID,
    shouldRetry: state === VALIDATION_STATE.RETRY,
    validateNow,
    reset
  };
}
