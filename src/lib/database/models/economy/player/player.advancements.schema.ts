import { prop, CreateSubSchemaManager, SubSchema, SchemaTypes } from '#lib/database/structures/schema.js';

export class PlayerAdvancementsSchema extends SubSchema {
  @prop({ type: SchemaTypes.Mixed })
  public value!: string | number | null;

  @prop({ type: Boolean })
  public unlocked!: boolean;
}

export class PlayerAdvancementsManagerSchema extends CreateSubSchemaManager(PlayerAdvancementsSchema) {
  public get unlocked() {
    return this.entries.filter(entry => entry.unlocked);
  }
}