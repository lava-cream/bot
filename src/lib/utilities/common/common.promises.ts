import type { Awaitable } from 'discord.js';
import { setTimeout } from 'node:timers/promises';
import { minutes } from './common.dates.js';

/**
 * Creates a responsive timer that calls out a function every second while an internal timer is ticking until both ends.
 * @param duration The duration in seconds format.
 * @param callback The callback function to call every second.
 * @since 5.2.2
 */
export async function createResponsiveTimer<T>(duration: number, callback: (timeLeft: number) => Awaitable<T>): Promise<void> {
  await Promise.all<void>([
    new Promise<void>((resolve) => sleepFor(minutes(1)).then(() => resolve())),
    new Promise<void>(async (resolve) => {
      let secondsLeft = duration;
      
      while (secondsLeft > 0) {
        await callback(secondsLeft);
        await setTimeout(1_000, secondsLeft--);
      }

      return resolve();
    })
  ]);
}

/**
 * Checks if a promise has been fulfilled.
 * @param value The value to check for.
 * @returns A boolean.
 * @version 6.0.0 - Renamed to isPromiseFulfilled from isPromiseSettled
 * @since 5.2.2
 */
export function isPromiseFulfilled<T>(value: PromiseSettledResult<T>): value is PromiseFulfilledResult<T> {
  return value.status === 'fulfilled';
}

/**
 * Waits for a/all pending promise(s) to resolve before the timeout runs out.
 * Rejects if the timeout resolves first than any of the pending promise(s).
 * @param timeout The waiting period in milliseconds.
 * @param promises The pending promises to resolve.
 * @version 5.1.0
 * @since 4.5.0
 */
export function race<T>(timeout: number, ...promises: Promise<T>[]) {
  return Promise.race([sleepFor(timeout).then(Promise.reject), ...promises]);
}

/**
 * Delays operation of code by a certain duration.
 * @param ms The delay in milliseconds.
 * @version 4.7.2
 * @since 1.0.0
 */
export function sleepFor(ms: number) {
  return setTimeout(ms, ms);
}
