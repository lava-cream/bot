import type { FirstArgument } from '@sapphire/utilities';
import { type Snowflake, Collection } from 'discord.js';

/**
 * Resolves an element inside an array.
 * @templat T The array's type.
 * @param array The array to resolve the item from.
 * @param filterFn The test to apply against the items of the array.
 * @returns The item or `null` if all items didn't pass the test.
 * @since 6.0.0
 */
export function resolveElement<T>(array: T[], filterFn: FirstArgument<T[]['filter']>): T | null {
  return array.find(filterFn) ?? null;
}

/**
 * Safely removes an element from the source array and returns the removed element if successful.
 * @template T The array's type.
 * @param array The array to remove the element from.
 * @param filterFn The filter function to call to find the element.
 * @returns The deleted element or `null` if none were removed.
 * @since 6.0.0
 */
export function removeElement<T>(array: T[], filterFn: FirstArgument<T[]['findIndex']>): T | null {
  const index = array.findIndex(filterFn);
  const removed = array.splice(index, index === -1 ? 0 : 1);

  return removed.at(0) ?? null;
}

/**
 * Pushes an element into the target array and returns the pushed element.
 * @template T The type of both the array and the item.
 * @param array The array to push into.
 * @param item The item to push.
 * @since 6.0.0
 */
export function pushElement<T>(array: T[], item: T): T {
  array.push(item);
  return item;
}

/**
 * Retrieves the amount of duplicating items within the array.
 * @param array The array to check the length from.
 * @param item The item to check.
 * @returns The amount of items in common.
 * @since 5.2.0
 */
export function getCommonItemsLength<T>(array: T[], item: T): number {
  return array.filter((elem) => elem === item).length;
}

/**
 * Reduces an array with supported `id` properties into a collection.
 * Heavily inspired by discord.js's way of caching stuff. It's cool.
 * @template T An object with an `id` property.
 * @param array The array to reduce.
 * @param collection The possible collection to set things into.
 * @example
 * ```typescript
 * Common.toCollection(user.items); // => Collection<string, UserItem>
 * ```
 * @since 4.2.0
 */
export function toCollection<T extends { id: Snowflake | string }>(
  array: T[],
  collection = new Collection<Snowflake, T>()
): Collection<Snowflake, T> {
  return array.reduce((coll, elem) => coll.set(elem.id, elem), collection);
}

/**
 * Returns one or more random items.
 * @template T The array's type.
 * @param array The array to extract the random items from.
 * @param amount The amount to extract. Falls back to the array length.
 * @param filterCommon Whether to filter out common elements from the source array or not.
 * @version 4.6.0
 * @since 3.0.0
 */
export function randomItems<T>(array: T[], amount = array.length, filterCommon = true): T[] {
  const items: T[] = [];

  while (items.length < amount) {
    const srcArray = filterCommon ? deepFilter(array, items) : array;
    items.push(randomItem(srcArray));
  }

  return items;
}

/**
 * Shuffles the items of an array.
 * @template T The array's type.
 * @param arr The array to shuffle.
 * @since 3.0.0
 */
export function shuffle<T>(arr: T[]): T[] {
  return arr.sort(() => Math.random() - 0.5);
}

/**
 * Exclude some items from the first array.
 * @template T The array's type.
 * @param src The source array to exclude the items from.
 * @param exc The items to exclude from the source array.
 * @since 2.0.0
 */
export function deepFilter<T>(src: readonly T[], exc: readonly T[]): T[] {
  return src.filter((s) => !exc.some((e) => e === s));
}

/**
 * Picks a random item from the array.
 * @template T The array's type.
 * @param array The array to pick the random item from.
 * @since 1.0.0
 */
export function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}
