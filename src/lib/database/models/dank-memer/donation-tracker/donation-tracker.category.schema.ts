import { prop, SchemaTypes, CreateSubSchemaManager, SubSchema } from '#lib/database/structures/schema.js';
import type { OmitFunctions } from '#lib/utilities/common/index.js';
import { isNullOrUndefined } from '@sapphire/utilities';

export class DonationTrackerCategorySchema extends SubSchema {
  @prop({ type: String })
  public name!: string;

  @prop({ type: Number })
  public multiplier!: number;

  @prop({ type: Number })
  public status!: DonationTrackerCategoryStatus;

  @prop({ type: Boolean })
  public default!: boolean;

  @prop({ type: () => DonationTrackerCategoryDonatorManagerSchema, immutable: true })
  public readonly donators!: DonationTrackerCategoryDonatorManagerSchema;

  @prop({ type: () => DonationTrackerCategoryLogsSchema, immutable: true })
  public readonly logs!: DonationTrackerCategoryLogsSchema;

  public constructor(options: OmitFunctions<Omit<DonationTrackerCategorySchema, 'donators' | 'logs'>> & { logs?: string }) {
    super(options.id);
    this.name = options.name;
    this.multiplier = options.multiplier;
    this.status = options.status;
    this.default = options.default;
    this.donators = new DonationTrackerCategoryDonatorManagerSchema();
    this.logs = new DonationTrackerCategoryLogsSchema({ id: options.logs ?? null });
  }

  public setName(name: string): this {
    this.name = name;
    return this;
  }

  public setMultiplier(multiplier: number): this {
    this.multiplier = multiplier;
    return this;
  }

  public setStatus(status: DonationTrackerCategoryStatus): this {
    this.status = status;
    return this;
  }

  public setDefault(value: boolean): this {
    this.default = value;
    return this;
  }
}

export const enum DonationTrackerCategoryStatus {
  Enabled = 1,
  Disabled = 2,
}

export class DonationTrackerCategoryManagerSchema extends CreateSubSchemaManager(DonationTrackerCategorySchema) {
  public get default() {
    return this.find(category => category.default) ?? null;
  }
}

export class DonationTrackerCategoryDonatorSchema extends SubSchema {
  @prop({ type: Number })
  public amount!: number;

  @prop({ type: () => DonationTrackerCategoryDonatorSeasonSchema, immutable: true })
  public readonly season!: DonationTrackerCategoryDonatorSeasonSchema;

  public constructor(options: OmitFunctions<Omit<DonationTrackerCategoryDonatorSchema, 'season'>>) {
    super(options.id);
    this.amount = options.amount;
    this.season = new DonationTrackerCategoryDonatorSeasonSchema({ streak: 0, value: 0, total: 0 });
  }

  public setAmount(amount: number): this {
    this.amount = amount;
    return this;
  }
}

export class DonationTrackerCategoryDonatorManagerSchema extends CreateSubSchemaManager(DonationTrackerCategoryDonatorSchema) {
}

export class DonationTrackerCategoryDonatorSeasonSchema {
  @prop({ type: Number })
  public value!: number;

  @prop({ type: Number })
  public streak!: number;

  @prop({ type: Number })
  public total!: number;

  public constructor(options: OmitFunctions<DonationTrackerCategoryDonatorSeasonSchema>) {
    this.value = options.value;
    this.streak = options.streak;
  }

  public setValue(value: number): this {
    this.value = value;
    return this;
  }

  public setStreak(streak: number): this {
    this.streak = streak;
    return this;
  }

  public setTotal(total: number): this {
    this.total = total;
    return this;
  }
}

export class DonationTrackerCategoryLogsSchema {
  @prop({ type: SchemaTypes.Mixed })
  public id!: string | null;

  public constructor(options: OmitFunctions<Omit<DonationTrackerCategoryLogsSchema, 'enabled'>>) {
    this.id = options.id;
  }

  public get enabled() {
    return !isNullOrUndefined(this.id);
  }

  public setId(id: string | null): this {
    this.id = id;
    return this;
  }
}
