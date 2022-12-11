import { type OmitFunctions, pushElement, resolveElement, removeElement, toNearestReadable } from '#lib/utilities';
import typegoose, { types } from '@typegoose/typegoose';
import { Ctor, FirstArgument, isNullOrUndefined, Primitive } from '@sapphire/utilities';

export const {
  prop,
  pre,
  post,
  PropType,
  mongoose: { SchemaTypes }
} = typegoose;

/**
 * Casts a {@link Schema} type into a mongoose document.
 * @template T The {@link Schema schema} to cast.
 */
export type CastDocument<T extends Schema> = typegoose.DocumentType<T>;

/**
 * Creates a JSON type of the model.
 * @template T The {@link Schema schema} to cast.
 * @version 6.0.0
 */
export type CastJSON<T> = { readonly [P in keyof OmitFunctions<T>]: T[P] extends Primitive ? T[P] : CastJSON<T[P]> };

/**
 * Represents a union type of a document's id field type and the document type itself.
 * @template T The document type of a {@link Schema schema}.
 */
export type CreateResolvableSchemaType<T extends Schema> = T | T['_id'];

/**
 * Represents a database schema.
 * @version 5.2.6
 * @since 4.6.0
 */
export abstract class Schema {
  /**
   * The schema's document id.
   */
  @prop(<types.PropOptionsForString>{ type: String, immutable: true })
  public readonly _id!: string;

  /**
   * Allows the developer to run a function against this schema.
   * @param fn The function to call.
   * @since 6.0.0
   */
  public run(fn: (this: this, db: this) => unknown): this {
    fn.call(this, this);
    return this;
  }
}

/**
 * Represents a subschema model. In mongoose terms, it's a "subdocument" within an array.
 * @since 6.0.0
 */
export class SubSchema {
  /**
   * The id of this sub schema.
   */
  @prop({ type: String, immutable: true })
  public readonly id!: string;

  public constructor(id: string) {
    this.id = id;
  }
}

/**
 * Creates a manager for {@link SubSchema}s. Highly inspired by discord.js' method of holding cached objects.
 * @template TSchema The extended type of {@link SubSchema}.
 * @template Args The constructor parameters of {@link SubSchema}.
 * @param SubSchema The class to {@link prop} for a subschema manager's entries.
 * @since 6.0.0
 */
export function CreateSubSchemaManager<TSchema extends SubSchema, Args extends unknown[]>(SubSchema: Ctor<Args, TSchema>) {
  abstract class SubSchemaManager {
    /**
     * The entries of this manager.
     */
    @prop({ type: () => [SubSchema], immutable: true, default: [] })
    public readonly entries!: TSchema[];

    /**
     * The "keys" of this manager are all entry ids.
     */
    public get keys() {
      return this.entries.map((entry) => entry.id);
    }

    /**
     * Creates an entry into this manager.
     * @param args The constructor parameters.
     */
    public create(...args: ConstructorParameters<typeof SubSchema>) {
      return pushElement(this.entries, Reflect.construct(SubSchema, args));
    }

    /**
     * Resolves an entry within this manager.
     * @param id The id of the entry.
     */
    public resolve(id: string): TSchema | null {
      return resolveElement(this.entries, (entry) => entry.id === id);
    }

    /**
     * Applies {@link Array#find} against the entries of this subschema manager.
     * @param fn A function that must return a boolean based on the predicate.
     * @returns The found element.
     */
    public find(fn: FirstArgument<TSchema[]['find']>) {
      return resolveElement(this.entries, fn);
    }

    /**
     * Deletes an existing entry from this manager.
     * @param id The id of the entry to delete.
     */
    public delete(id: string): TSchema | null {
      return removeElement(this.entries, (entry) => entry.id === id);
    }
  }

  return SubSchemaManager;
}

/**
 * The allowed types of a value schema.
 */
export type ValueSchemaTypes = string | number | null;

/**
 * Creates a schema but only containing a `value` property.
 * @param defaultValue The default value.
 * @returns The {@link ValueSchema} class.
 * @since 6.0.0
 */
export function CreateValueSchema<T extends ValueSchemaTypes = ValueSchemaTypes>(defaultValue?: T) {
  abstract class ValueSchema {
    /**
     * The value of this schema.
     */
    @prop({ type: isNullOrUndefined(defaultValue) ? SchemaTypes.Mixed : typeof defaultValue === 'number' ? Number : String, default: defaultValue })
    public value!: T;

    /**
     * Sets the new value of this schema.
     * @param value The new value of this schema.
     * @returns This schema.
     */
    public setValue(value: T): this {
      this.value = value;
      return this;
    }

    /**
     * Resets this schema's value back to its default configured value.
     * @returns This schema.
     */
    public resetValue(): this {
      if (!isNullOrUndefined(defaultValue)) this.setValue(defaultValue);
      return this;
    }
  }

  return ValueSchema;
}

/**
 * Creates a {@link ValueSchema} with a string value.
 * @param defaultValue The default string value of the schema.
 * @returns A schema.
 * @since 6.0.0
 */
export function CreateStringValueSchema(defaultValue?: string) {
  /**
   * Represents a {@link ValueSchema} with a string value.
   */
  abstract class StringValueSchema extends CreateValueSchema(defaultValue) {
    /**
     * The trimmed version of this schema's value.
     */
    public get cleanValue() {
      return this.value.trim();
    }
  }

  return StringValueSchema;
}

/**
 * Creates a {@link ValueSchema} with a number value.
 * @param defaultValue The default number value of the schema.
 * @returns A schema.
 * @since 6.0.0
 */
export function CreateNumberValueSchema(defaultValue?: number) {
  /**
   * Represents a {@link ValueSchema} with a number value.
   */
  abstract class NumberValueSchema extends CreateValueSchema(defaultValue) {
    /**
     * Increments the current value of this schema.
     * @param value The value to add.
     * @returns This schema.
     */
    public addValue(value: number): this {
      return this.setValue(this.value + value);
    }

    /**
     * Decrements the current value of this schema.
     * @param value The value to deduct.
     * @returns This schema.
     */
    public subValue(value: number): this {
      return this.setValue(this.value - value);
    }

    /**
     * Formats this schema's value to its shorter form.
     * @param fractionDigits The decimal places to preserve.
     * @returns The shortened form.
     */
    public shortenValue(fractionDigits = 0) {
      return toNearestReadable(this.value, fractionDigits);
    }
  }

  return NumberValueSchema;
}
