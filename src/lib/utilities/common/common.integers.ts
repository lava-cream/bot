import type { Mutable } from '@sapphire/utilities';
import type { HexColorString } from 'discord.js';
import { toHex } from './common.strings.js';
import { randomItem } from './index.js';

/**
 * Parses numbers from among the following formats:
 * * Identifiers (min | max | half | full)
 * * Shorthand readables (10k | 42m | 1t)
 * * Percentages (30%)
 * * Comma-separated numbers (1_000_000 | 5,562)
 * @param parameter The parameter to parse.
 * @param options Options for parsing.
 * @returns The parsed amount, `null` otherwise.
 * @since 6.0.0
 */
export function parseNumber(parameter: string | number, options: ParseNumberOptions): number | null {
  if (isNumber(parameter)) return parameter;

  if (typeof parameter === 'string') {
    switch (parameter.toLowerCase()) {
      case 'max': {
        return Math.min(options.maximum, options.amount);
      }

      case 'min': {
        return Math.min(options.minimum, options.amount);
      }

      case 'half': {
        return Math.round(options.amount / 2);
      }

      case 'full': {
        return options.amount;
      }
    }

    return [parseReadables(parameter), parsePercent(parameter, options.maximum), parseComma(parameter)].filter(isNumber).at(0) ?? null;
  }

  return null;
}

/**
 * Options to {@link parseNumber parse} a number.
 * @see parseNumber
 * @since 6.0.0
 */
export interface ParseNumberOptions {
  maximum: number;
  minimum: number;
  amount: number;
}

/**
 * Removes the comma or underscore separators of a number.
 * @param parameter The parameter to parse.
 * @since 6.0.0
 */
export function parseComma(parameter: string): number | null {
  const commas = [/,/gi, /_/gi];

  for (const comma of commas.values()) {
    if (parameter.match(comma)) {
      const replaced = Number(parameter.replace(comma, ''));
      if (!isNumber(replaced)) continue;
      return replaced;
    }
  }

  return null;
}

/**
 * Parses human readable numbers into valid integers.
 * @param parameter The parameter to parse.
 * @since 6.0.0
 */
export function parseReadables(parameter: string | number): number | null {
  if (isNumber(parameter)) return parameter;

  const readables: Readable[] = [
    { regex: /k$/gi, value: 1e3 },
    { regex: /m$/gi, value: 1e6 },
    { regex: /b$/gi, value: 1e9 },
    { regex: /t$/gi, value: 1e12 }
  ];

  for (const { regex, value } of readables.values()) {
    if (parameter.match(regex)) {
      const given = Number(parameter.replace(regex, ''));
      if (!Number.isInteger(given * value) || isNaN(given * value)) continue;
      return Math.round(given * value);
    }
  }

  return null;
}

/**
 * Represents a readable entry, commonly used by the {@link parseReadables} function.
 * @see parseReadables
 * @since 6.0.0
 */
interface Readable {
  regex: RegExp;
  value: number;
}

/**
 * Parses a percentage then returns the result if parsing turns out to be successful.
 * @param parameter The parameter to parse.
 * @param number The number to get the percentage from.
 * @since 6.0.0
 */
export function parsePercent(parameter: string, number: number): number | null {
  const PercentRegex = /%$/gi;

  return PercentRegex.exec(parameter) ? number * (Number(parameter.replace(PercentRegex, '')) / 100) : null;
}

/**
 * Checks if a value is a number.
 * @param x The value to check for.
 * @since 6.0.0
 */
export function isNumber<T>(x: T | unknown): x is number {
  return typeof x === 'number' && x !== NaN;
}

/**
 * Checks if a number has a decimal value.
 * @param number The number to check for.
 * @returns If the number has decimals.
 * @since 5.2.0
 */
export function hasDecimal(number: number): boolean {
  return Math.trunc(number) !== number;
}

/**
 * Rounds a number based from the location of the digit from the right. Scanned digits (from the right) will be transformed to concluding zeros.
 * @param n The number to round.
 * @param zeros The amount of zeros.
 * @returns The rounded number.
 * @version 6.0.0 - Add a limit to `zeros` as it will break the reader's brain if exceeds to 20.
 * @since 5.1.0
 */
export function roundZero(n: number, zeros = 1): number {
  const z = Number(`1e${Math.min(Math.max(zeros, 1), 20)}`);
  return Math.round(n / z) * z;
}

/**
 * Represents a scattered element.
 * @see {@link scatter} for more details.
 * @since 5.1.0
 */
export type Scattered = Mutable<{ value: number }>;

/**
 * Scatters a certain amount into randomized amounts. Probably the best and COMPLICATED code I wrote, EVER.
 * @param amount The amount to scatter into lengths of {@link Scattered scattered} elements. Consumed by the internal randomizer from this function.
 * @param min The minimum number to randomize from. Should be at least 1 lower than the length or else you'll fuck things up.
 * @param max The maximum number to randomize from. Doesn't matter if it's lower than the length, as long as it's not a negative or else you'll break the laws of physics.
 * @param length The length of {@link Scattered scattered} elements. When reduced, it should 100% be the {@link amount amount} too.
 * @returns An array of {@link Scattered scattered} elements.
 * @since 5.1.0
 */
export function scatter(amount: number, min: number, max: number, length: number): Scattered[] {
  const scattered: Scattered[] = [];
  const initialAmount = amount;
  const initialLength = length;

  while (length > 0) {
    const random = randomNumber(min, max);
    scattered.push({ value: random });
    amount -= random;
    length--;
  }

  const getTotal = () => scattered.reduce((p, c) => p + c.value, 0);

  switch (true) {
    case getTotal() === initialAmount:
      return scattered;

    case getTotal() <= initialAmount: {
      const total = getTotal();
      for (let i = initialAmount - total; i > 0; i--) {
        const underMaxed = scattered.filter((s) => s.value < max);
        const random = randomItem(underMaxed);
        if (random) random.value++;
      }

      for (let i = initialLength; i > 0; i--) {
        const allowed = scattered.filter((s) => s.value > min || s.value < max);
        const from = randomItem(allowed.filter((a) => a.value - 1 >= min));
        const to = randomItem(allowed.filter((a) => a.value + 1 <= max));
        if (to) {
          to.value++;
          from.value--;
        }
      }

      break;
    }

    default: {
      // Remove excess from all elements going above the length amount.
      const aboveLength = scattered.filter((s) => s.value > initialLength);
      for (const al of aboveLength) al.value -= al.value - initialLength;

      // Add the numbers to elements with missing numbers.
      if (getTotal() < initialAmount) {
        const underMaxed = scattered.filter((s) => s.value < initialLength);
        for (const um of underMaxed) {
          const difference = initialLength - um.value;
          const candidates = scattered.filter((s) => !underMaxed.includes(s)).filter((s) => s.value + difference <= max);
          const volunteer = randomItem(candidates);
          if (volunteer) volunteer.value += difference;
        }
      }

      // Borrow item decrement, random (except the borrowed item) increment.
      for (let i = initialLength; i > 0; i--) {
        const from = randomItem(scattered.filter((a) => a.value - 1 >= min));
        const to = randomItem(scattered.filter((a) => a.value + 1 <= max));
        if (to) {
          to.value++;
          from.value--;
        }
      }

      break;
    }
  }

  return scattered;
}

/**
 * Returns the numerical value of a roman numeral.
 * @param roman The roman number to parse.
 * @since 3.0.0
 */
export function deromanize(roman: string): number {
  const romans = ['I', 'V', 'X', 'L', 'C', 'D', 'M'] as const;
  const values = [1, 5, 10, 50, 100, 500, 1000] as const;
  const _roman = [...roman] as unknown as typeof romans;

  let result = 0;
  for (let i = 0; i < _roman.length; i -= -1) {
    const current = values[romans.indexOf(_roman[i])];
    const next = values[romans.indexOf(_roman[i + 1])];

    if (current < next) {
      result += next - current;
      i++;
    } else {
      result += current;
    }
  }

  return result;
}

/**
 * Generates a random, hexadecimal color code.
 * @param hex Whether to convert the random color to a hex string.
 * @since 1.0.0
 */
export function randomColor(hex: true): HexColorString;
export function randomColor(hex?: false): number;
export function randomColor(hex?: boolean) {
  const random = Math.random() * 0xffffff;
  return hex ? toHex(random) : random;
}

/**
 * Generates a random number between 2 starting and ending points.
 * @param min The minimum possible number.
 * @param max The maximum possible number.
 * @returns The random, whole number.
 * @since 1.0.0
 */
export function randomNumber(min: number, max: number): number {
  return Math.round(Math.random() * (max - min + 1) + min);
}
