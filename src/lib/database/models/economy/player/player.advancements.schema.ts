import { prop, CreateSubSchemaManager, SubSchema, SchemaTypes, ValueSchemaTypes } from '#lib/database/structures/schema.js';

/**
 * Augmentable interface to insert valid {@link PlayerAdvancementsSchema} ID entries
 */
export interface IPlayerAdvancements {}

export class PlayerAdvancementsSchema extends SubSchema {
  @prop({ type: SchemaTypes.Mixed })
  public value!: ValueSchemaTypes;

  @prop({ type: Boolean })
  public unlocked!: boolean;

  public setUnlocked(unlocked: this['unlocked']): this {
    this.unlocked = unlocked;
    return this;
  }

  public setValue(value: number): this {
    this.value = value;
    return this;
  }
}

export class PlayerAdvancementsManagerSchema extends CreateSubSchemaManager(PlayerAdvancementsSchema) {
  public get unlocked() {
    return this.entries.filter(entry => entry.unlocked);
  }
}