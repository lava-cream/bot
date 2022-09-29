import { ResolverErrors } from '#lib/framework';
import { regexHasGroup } from '#lib/utilities';
import { Result } from '@sapphire/result';
import { isNullOrUndefined } from '@sapphire/utilities';

/**
 * Resolves a percentage.
 * @param parameter The parameter to resolve.
 * @returns The percentage, or an error identifier.
 * @since 5.2.0
 */
export const resolvePercentage = (parameter: string): Result<number, ResolverErrors.InvalidPercentage> => {
  return Result.from(() => {
    const PERCENTAGE_REGEX = /(?<percentage>\d+)%$/gi;
    const match = PERCENTAGE_REGEX.exec(parameter);

    if (isNullOrUndefined(match) || !regexHasGroup(match, 'percentage')) throw ResolverErrors.InvalidPercentage;
    return Number(match.groups.percentage);
  });
};
