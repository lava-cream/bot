import { Time } from '@sapphire/time-utilities';

/**
 * Converts an hour value into milliseconds.
 * @param h The time in hours.
 * @returns The calculated time.
 * @since 5.0.0
 */
export function hours(h: number) {
  return h * Time.Hour;
}

/**
 * Converts a day value into milliseconds.
 * @param d The time in days.
 * @returns The calculated time.
 * @since 4.5.0
 */
export function days(d: number) {
  return d * Time.Day;
}

/**
 * Converts a minute value into milliseconds.
 * @param m The time in minutes.
 * @returns The calculated time.
 * @since 4.5.0
 */
export function minutes(m: number) {
  return m * Time.Minute;
}

/**
 * Converts a second value into milliseconds.
 * @param t The time in seconds.
 * @returns The calculated time.
 * @since 4.5.0
 */
export function seconds(t: number) {
  return t * Time.Second;
}