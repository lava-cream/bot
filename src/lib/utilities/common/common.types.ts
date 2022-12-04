import type { AliasStore, Store } from '@sapphire/framework';
import type { PickByValue, Ctor } from '@sapphire/utilities';
import type { Awaitable } from 'discord.js';

/**
 * Creates a callback function type.
 * @template A The arguments of the function.
 * @template R The return type.
 * @template This The `this` type.
 * @since 6.0.0
 */
export type Callback<A extends unknown[], R, This> = (this: This, ...args: A) => R;

/**
 * Extracts the piece's type from a store.
 * @template S The store to extract the type from.
 * @version 6.0.0 - Added type support for AliasStore
 * @since 5.2.2
 */
export type ExtractPieceType<S> = S extends Store<infer P> | AliasStore<infer P> ? P : never;

/**
 * Represents the stricter type of a discord snowflake which is, a stringified bigint.
 * Once upon a time discord.js used to have this type for {@link import('discord.js').Snowflake} but a lot of TS developers don't understand so it was reverted back.
 * @since 5.1.0
 */
export type StrictSnowflake = `${bigint}`;

/**
 * Omits function values from an object.
 * @template O The object to omit from.
 * @version 5.2.6
 * @since 5.1.0
 */
export type OmitFunctions<O> = Omit<O, PickByValue<O, Function>>;

export type { If } from 'discord.js';

/**
 * Extracts the value from a promise.
 * @template V A resolvable promise.
 * @version 6.0.0 - Add support for `Awaitable` types.
 * @since 4.3.0
 */
export type ExtractPromiseType<V> = V extends Promise<infer P> | Awaitable<infer P> ? P : never;

/**
 * Creates a function type.
 * @template A The arguments of the function.
 * @template R The return value of the function.
 * @template P Whether the function should return a promise or not.
 * @template This The `this` scope of this function.
 * @since 6.0.0 - Add support for `this` scopes.
 * @since 4.3.0
 */
export type TFunction<A extends unknown[], R, P extends boolean = boolean, This = unknown> = (
  this: This,
  ...args: A
) => P extends true ? Promise<R> : P extends false ? R : Awaitable<R>;

/**
 * Creates an instantiable type of a class constructor.
 * @param T The constructor to cast.
 * @version 6.0.0 - Use {@link Ctor}.
 * @since 4.2.0
 */
export type Constructor<T> = Ctor<T extends new (...args: infer A) => any ? A : [], T>;
