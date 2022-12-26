import type { HexColorString } from 'discord.js';
import { DiscordSnowflake } from '@sapphire/snowflake';
import { filterNullishAndEmpty, isNullOrUndefined } from '@sapphire/utilities';

/**
 * Transforms a numerical value into something humans could easily read.
 * The original {@link toReadable} util will be depreciated after the next minor release.
 * This makes use of the internal {@link Intl} global namespace. Credits to Fireship.
 * @param x The number to format.
 * @param maximumFractionDigits The possible amount of decimals to show.
 * @returns A shorthand number string.
 * @since 6.0.0
 */
export function toNearestReadable(x: number, maximumFractionDigits = 2): string {
  return Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits }).format(x);
}

/**
 * Creates a "Now" ID string.
 * A "Now" id string has the following characteristics:
 * * It's only 6 characters long.
 * * All characters are alphanumeric.
 * * All non-numerical characters are uppercased.
 * * It always ends with the number zero (0).
 * @param date A date object which the util should rely on.
 * @returns A unique identification string.
 * @since 6.0.0
 */
export function createNowId(date = new Date()): string {
  return Math.round(date.getTime() * 0xffffff)
    .toString(36)
    .toUpperCase()
    .slice(-7, -1);
}

/**
 * Transforms the value against the base number into a percent.
 * @param value The value.
 * @param base The ceiling.
 * @param decimals The decimal places to keep.
 * @returns A string in `100%` format.
 * @since 6.0.0
 */
export function percent(value: number, base: number, decimals = 0): `${string}%` {
  return `${(Math.round((value / base) * 100) || 0).toFixed(decimals)}%`;
}

/**
 * Pluralises a word based from a given amount.
 * @param word The word to pluralise.
 * @param amount The amount to base from.
 * @returns The pluralised word.
 * @since 5.1.0
 */
export function pluralise(word: string, amount: number): string {
  switch (true) {
    case amount < 2: {
      return word;
    }

    case word.endsWith('fe'): {
      return `${word.substring(0, word.length - 2)}ves`;
    }

    case word.endsWith('y'): {
      return `${word.substring(0, word.length - 1)}ies`;
    }

    case word.endsWith('z'): {
      return `${word}es`;
    }

    default: {
      return `${word}s`;
    }
  }
}

/**
 * The ordinal suffixes.
 * @private
 */
const enum OrdinalSuffixes {
  FIRST = 'st',
  SECOND = 'nd',
  THIRD = 'rd',
  OTHER = 'th'
}

/**
 * Transform a number into an ordinal string.
 * @param number The number to transform.
 * @param withComma Whether to format the number by adding commas or not.
 * @returns The ordinal string.
 * @since 5.1.0
 */
export function toOrdinal(number: number, withComma = true): string {
  const stringed = withComma ? number.toLocaleString() : number.toString();
  const transform = (suffix: OrdinalSuffixes) => `${stringed.concat(suffix)}`;
  const end = stringed.slice(-2);

  switch (true) {
    default:
    case !isNullOrUndefined(end.match(/\d00$/gi)):
    case !isNullOrUndefined(end.match(/1(?:1|2|3)$/gi)): {
      return transform(OrdinalSuffixes.OTHER);
    }

    case end.endsWith('1'): {
      return transform(OrdinalSuffixes.FIRST);
    }

    case end.endsWith('2'): {
      return transform(OrdinalSuffixes.SECOND);
    }

    case end.endsWith('3'): {
      return transform(OrdinalSuffixes.THIRD);
    }
  }
}

/**
 * Returns the hex string format.
 * @param color The color in hex format.
 * @returns A hex color.
 * @since 4.7.2
 */
export function toHex(color: number): HexColorString {
  return `#${color.toString(16).padStart(6, '0')}`;
}

/**
 * Generates a random discord snowflake.
 * @param timestamp The timestamp.
 * @version 4.5.0
 * @since 4.3.0
 */
export function createDiscordSnowflake(timestamp = Date.now()): string {
  return DiscordSnowflake.generate({ timestamp }).toString();
}

/**
 * Transforms a number to some readable format.
 * @param x The number to transform.
 * @param decimals The decimals to retain.
 * @example
 * ```typescript
 *  const parsed = toReadable(420_200);
 *
 *  console.log(parsed); // 420.2K
 * ```
 * @example
 * ```typescript
 *  const parsed = toReadable(950_000);
 *
 *  console.log(parsed); // 0.95M
 * ```
 * @version 5.2.2
 * @since 4.3.0
 */
export function toReadable(x: number, decimals = 1): string {
  const format = (n: number, i: string) => {
    const fixed = (x / n).toFixed(decimals);
    return `${Number(fixed.endsWith('0') ? Number(fixed) * 1 : fixed)}${i}`;
  };

  const data = [
    { point: 9 * 100e15, value: 100e18, suffix: 'QT' },
    { point: 9 * 100e12, value: 100e15, suffix: 'QD' },
    { point: 9 * 100e9, value: 1e12, suffix: 'T' },
    { point: 9 * 100e6, value: 1e9, suffix: 'B' },
    { point: 9 * 100e3, value: 1e6, suffix: 'M' },
    { point: 9 * 100, value: 1e3, suffix: 'K' }
  ] as const;

  for (const { point, value, suffix } of data) {
    if (x >= point) return format(value, suffix);
  }

  return x.toString();
}

/**
 * Joins an array of strings to commas but leaving the last 2 items separated with "and".
 * @template T Array of strings to join.
 * @param array The array to join with.
 * @version 4.5.0
 * @since 4.2.0
 */
export function joinAnd<T extends string>(array: T[]): string {
  if (array.length < 2) return array.join(' ');

  const { length, pop, slice, [length - 2]: s2l } = array;
  const [last, exc] = [pop.call(array), slice.call(array, 0, length - 2)];

  return [...exc, [s2l, last].join(' and ')].join(', ');
}

/**
 * A typeguard to check whether the first param is an array or not.
 * @param strings The strings to check.
 * @since 4.5.0
 */
function isSingleParamArray(strings: unknown[]): strings is [string[]] {
  return Array.isArray(strings[0]);
}

/**
 * Joins an array of strings by a newline.
 * @param strings The strings to join.
 * @version 6.0.0 - Make use of {@link Array#at}.
 * @since 4.0.0
 */
export function join(strings: string[]): string;
export function join(...strings: string[]): string;
export function join(...strings: [string[]] | string[]): string {
  return isSingleParamArray(strings)
    ? (
      !isNullOrUndefined(strings.at(0))
        ? strings.at(0)!.filter(filterNullishAndEmpty).join('\n')
        : ''
    )
    : strings.filter(filterNullishAndEmpty).join('\n');
}

/**
 * Creates a unique progress bar.
 * @param percent A valid number between 1 and 10.
 * @param filled The completed parts for the progress bar.
 * @param empty The empty character to place.
 * @version 4.5.0
 * @since 3.0.0
 */
export function progressBar(percent = 1, filled = '■', empty = '□'): string {
  const repeat = Math.max(0, 10 - Math.min(10, Math.abs(percent)));
  return `${filled.repeat(percent)}${empty.repeat(repeat)}`;
}

/**
 * Converts a number (up to 3,000) to roman numerals.
 * @param x The number to convert into roman numeral form.
 * @version 4.5.0
 * @since 3.0.0
 */
export function toRoman(x: number): string {
  const upperRomans = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L'] as const;
  const lowerRomans = ['XL', 'X', 'IX', 'V', 'IV', 'I'] as const;

  let values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  let romans = [...upperRomans, ...lowerRomans] as const;
  let roman = '';
  let index = 0;

  while (index < romans.length) {
    roman += romans[index].repeat(x / values[index]);
    x %= values[index];
    index++;
  }

  return roman;
}
