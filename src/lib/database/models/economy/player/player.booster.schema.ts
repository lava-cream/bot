import { CreateNumberValueSchema, CreateSubSchemaManager, prop, SubSchema } from "#lib/database/structures/schema.js";
import type { OmitFunctions } from "#lib/utilities";

export class PlayerBoosterQuantitySchema extends CreateNumberValueSchema(0) {}

export class PlayerBoosterSchema extends SubSchema {
  @prop({ type: Number })
  public value!: number;
  
  @prop({ type: () => PlayerBoosterQuantitySchema, immutable: true })
  public readonly quantity!: PlayerBoosterQuantitySchema;

  @prop({ type: Number })
  public expire: number;

  public constructor(id: string, options: OmitFunctions<Omit<PlayerBoosterSchema, 'id'>>) {
    super(id);
    this.expire = options.expire;
    this.quantity = new PlayerBoosterQuantitySchema();
    this.value = options.value;
  }

  public isExpired(): boolean {
    return this.expire > Date.now();
  }

  public setExpire(expire: number) {
    this.expire = expire;
    return this;
  }
}

export class PlayerBoosterManagerSchema extends CreateSubSchemaManager(PlayerBoosterSchema) {
  public get activated(): PlayerBoosterSchema[] {
    return this.entries.filter(booster => !booster.isExpired());
  }

  public use(id: string, expire: number) {
    return this.resolve(id)?.setExpire(expire);
  }
}