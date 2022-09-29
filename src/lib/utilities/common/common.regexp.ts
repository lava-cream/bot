import { isNullOrUndefined } from '@sapphire/utilities';

/**
 * Checks if the resulting array result matches all the groups specified.
 * @param result A {@link RegExpExecArray} array.
 * @param groups The groups to check for.
 * @returns A boolean if the groups match all the regex groups.
 * @since 5.2.0
 */
export function regexHasAllGroups<GS extends string[]>(
  result: RegExpExecArray,
  ...groups: GS
): result is typeof result & { groups: Record<GS[number], string> } {
  return groups.every((group) => regexHasGroup(result, group));
}

/**
 * Checks if a {@link RegExpExecArray} has any of the specified groups.
 * @param result A {@link RegExpExecArray} array.
 * @param groups The groups to check for.
 * @returns A boolean if the exec array has one of the groups.
 * @since 5.2.0
 */
export function regexHasAnyGroups<GS extends string[]>(
  result: RegExpExecArray,
  ...groups: GS
): result is typeof result & { groups: Partial<Record<GS[number], string>> } {
  return groups.some((group) => regexHasGroup(result, group));
}

/**
 * Checks if the resulting exec array matches a specific group.
 * @template G The group's type to check for.
 * @param result A {@link RegExpExecArray} array.
 * @param group The group to check for.
 * @returns A {@link RegExpExecArray} with `groups` property a {@link Record}<{@link G}, string> of strings.
 * @since 5.2.0
 */
export function regexHasGroup<G extends string>(result: RegExpExecArray, group: G): result is typeof result & { groups: Record<G, string> } {
  return !isNullOrUndefined(result.groups?.[group]);
}
