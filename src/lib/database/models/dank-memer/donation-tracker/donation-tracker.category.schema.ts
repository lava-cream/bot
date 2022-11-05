import { prop, SchemaTypes, CreateSubSchemaManager, SubSchema } from '#lib/database/structures/schema.js';
import type { OmitFunctions } from '#lib/utilities/common/index.js';

export class DonationTrackerCategorySchema extends SubSchema {
  @prop({ type: String })
  public name!: string;

  @prop({ type: Number })
  public multiplier!: number;

  @prop({ type: Number })
  public status!: DonationTrackerCategoryStatus;

  @prop({ type: () => DonationTrackerCategoryDonatorManagerSchema, immutable: true })
  public readonly donators!: DonationTrackerCategoryDonatorManagerSchema;

  @prop({ type: () => DonationTrackerCategoryLogsSchema, immutable: true })
  public readonly logs!: DonationTrackerCategoryLogsSchema;

  public constructor(options: OmitFunctions<Omit<DonationTrackerCategorySchema, 'logs'>>) {
    super(options.id);
    this.name = options.name;
    this.multiplier = options.multiplier;
    this.status = options.status;
    this.donators = new DonationTrackerCategoryDonatorManagerSchema();
    this.logs = new DonationTrackerCategoryLogsSchema({ id: null, enabled: false });
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
}

export const enum DonationTrackerCategoryStatus {
  Enabled = 1,
  Disabled = 2,
}

export class DonationTrackerCategoryManagerSchema extends CreateSubSchemaManager(DonationTrackerCategorySchema) {
}

export class DonationTrackerCategoryDonatorSchema extends SubSchema {
  @prop({ type: Number })
  public amount!: number;

  @prop({ type: Number })
  public count!: number;

  @prop({ type: () => DonationTrackerCategoryDonatorSeasonSchema, immutable: true })
  public readonly season!: DonationTrackerCategoryDonatorSeasonSchema;

  public constructor(options: OmitFunctions<Omit<DonationTrackerCategoryDonatorSchema, 'season'>>) {
    super(options.id);
    this.amount = options.amount;
    this.count = options.count;
    this.season = new DonationTrackerCategoryDonatorSeasonSchema({ streak: 0, value: 0 });
  }

  public setAmount(amount: number): this {
    this.amount = amount;
    return this;
  }

  public setCount(count: number): this {
    this.count = count;
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
}

export class DonationTrackerCategoryLogsSchema {
  @prop({ type: SchemaTypes.Mixed })
  public id!: string | null;

  @prop({ type: Boolean })
  public enabled!: boolean;

  public constructor(options: OmitFunctions<DonationTrackerCategoryLogsSchema>) {
    this.id = options.id;
    this.enabled = options.enabled;
  }

  public setId(id: string | null): this {
    this.id = id;
    return this;
  }

  public setEnabled(enabled: boolean): this {
    this.enabled = enabled;
    return this;
  }
}
