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
  if (isNumber(parameter) || isNumber(Number(parameter))) return Number(parameter);

  if (typeof parameter === 'string') {
    switch (parameter.toLowerCase()) {
      case 'max': {
        return options.maximum;
      }

      case 'min': {
        return options.minimum;
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
  amount: number;
  maximum: number;
  minimum: number;
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
      const calculated = given * value;

      if (!Number.isInteger(calculated) || isNaN(calculated)) continue;
      return Math.round(calculated);
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
  return typeof x === 'number' && !Number.isNaN(Number(x));
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
 * Rounds a number based from the location of the digit from the right. Scanned digits (from the right) will be transformed to zeros.
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
export type Scattered = Mutable<{ value: number }>[];

/**
 * Scatters a certain amount into randomized amounts.
 * @param amount The amount to scatter into lengths of {@link Scattered scattered} elements. Consumed by the internal randomizer from this function.
 * @param length The length of {@link Scattered scattered} elements. When reduced, it should 100% be the {@link amount amount} too.
 * @returns An array of {@link Scattered scattered} elements.
 * @version 6.0.0 - Reduce code.
 * @since 5.1.0
 */
export function scatter(amount: number, length: number): Scattered {
  const mutate = (value: number): Scattered[number] => ({ value });
  const num = 100;

  const base = Math.floor(num / length);
  const scattered: Scattered = Array(length)
    .fill(null)
    .map(() => mutate(base));
  const baseTotal = base * length;
  const diff = num - baseTotal;

  for (let i = diff; i > 0; i--) {
    // Add 2 since we're deducting 1 from a random.
    randomItem(scattered).value += 2;
    // Deduct 1 to balance those who are higher (>=base) and lower (<base).
    randomItem(scattered).value--;
  }

  return scattered.map((s) => mutate(amount * (s.value / 100))).sort((a, b) => b.value - a.value);
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
  return Math.round(Math.random() * (max - min) + min);
}
