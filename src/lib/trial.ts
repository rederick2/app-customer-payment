/**
 * Trial period utilities.
 * The trial starts the first time a user accesses the authenticated app
 * and is stored in `public.users.trial_started_at`.
 */

export const TRIAL_DURATION_DAYS = 30;

/**
 * Calculates the number of whole days remaining in the trial.
 * Returns 0 if the trial has already expired.
 */
export function getTrialDaysRemaining(trialStartedAt: string | null | undefined): number {
  if (!trialStartedAt) return TRIAL_DURATION_DAYS; // not started yet, full trial
  const start = new Date(trialStartedAt).getTime();
  const end = start + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;
  const remaining = end - Date.now();
  return Math.max(0, Math.floor(remaining / (24 * 60 * 60 * 1000)));
}

/**
 * Returns the exact milliseconds remaining in the trial (for live countdown).
 */
export function getTrialMsRemaining(trialStartedAt: string | null | undefined): number {
  if (!trialStartedAt) return TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;
  const start = new Date(trialStartedAt).getTime();
  const end = start + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;
  return Math.max(0, end - Date.now());
}

/**
 * Returns true if the trial period has passed.
 */
export function isTrialExpired(trialStartedAt: string | null | undefined): boolean {
  if (!trialStartedAt) return false; // never started → not expired
  return getTrialMsRemaining(trialStartedAt) === 0;
}

/**
 * Returns the expiry Date of the trial.
 */
export function getTrialExpiryDate(trialStartedAt: string): Date {
  return new Date(new Date(trialStartedAt).getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);
}
