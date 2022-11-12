import { prop, CreateSubSchemaManager, SubSchema, CreateValueSchema } from '#lib/database/structures/schema.js';
import { Mixin } from 'ts-mixer';

export class PlayerAdvancementsSchema extends Mixin(SubSchema, CreateValueSchema()) {
  @prop({ type: Boolean })
  public unlocked!: boolean;

  public setUnlocked(unlocked: this['unlocked']): this {
    this.unlocked = unlocked;
    return this;
  }
}

export class PlayerAdvancementsManagerSchema extends CreateSubSchemaManager(PlayerAdvancementsSchema) {
  public get unlocked() {
    return this.entries.filter(entry => entry.unlocked);
  }
}