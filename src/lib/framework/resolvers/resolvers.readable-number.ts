import { type Result, ok, err } from '@sapphire/result';
import { isNullOrUndefined } from '@sapphire/utilities';
import { ResolverErrors } from '#lib/framework';

interface Readable {
  regex: RegExp;
  value: number;
}

const baseReadables: Readable[] = [
  { regex: /k$/gi, value: 1e3 },
  { regex: /m$/gi, value: 1e6 },
  { regex: /b$/gi, value: 1e9 },
  { regex: /t$/gi, value: 1e12 }
];

/**
 * Resolves a human readable number into a float or integer.
 * @param parameter The parameter to resolve from.
 * @param customReadables Your custom {@link Readable} objects.
 * @returns A number.
 * @since 5.0.0
 */
export const resolveReadableNumber = (parameter: string, customReadables?: Readable[]): Result<number, ResolverErrors.InvalidReadableNumber> => {
  const readables = [...baseReadables, ...(customReadables ?? [])];
  let parsed: number = null!;

  for (const { regex, value } of readables) {
    if (parameter.match(regex)) {
      const given = Number(parameter.replace(regex, ''));
      if (!Number.isInteger(given) || isNaN(given)) continue;
      else parsed = given * value;
    }
  }

  return isNullOrUndefined(parsed) ? err(ResolverErrors.InvalidReadableNumber) : ok(parsed);
};
