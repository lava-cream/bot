import { PlayerLimits, PlayerDefaults, PlayerTierRequirements, PlayerMasteryRequirements } from '#lib/utilities/constants/index.js';
import type { OmitFunctions } from '#lib/utilities/common/index.js';
import { prop } from '#lib/database/structures/schema.js';

export class PlayerUpgradesSchema {
  @prop({ type: () => PlayerLevelsTierSchema, immutable: true })
  public readonly tier!: PlayerLevelsTierSchema;

  @prop({ type: () => PlayerLevelsMasterySchema, immutable: true })
  public readonly mastery!: PlayerLevelsMasterySchema;

  public constructor() {
    this.tier = new PlayerLevelsTierSchema({ value: PlayerDefaults.Tier });
    this.mastery = new PlayerLevelsMasterySchema({ value: PlayerDefaults.Mastery });
  }
}

export class PlayerLevelsTierSchema {
  @prop({ type: Number })
  public value!: number;

  public constructor(options: OmitFunctions<Omit<PlayerLevelsTierSchema, 'requirements'>>) {
    this.value = options.value;
  }

  public update(options: Partial<OmitFunctions<Omit<PlayerLevelsTierSchema, 'requirements'>>>): this {
    return Object.assign(this, options);
  }

  public get requirements() {
    return this.isMaximumLevel()
      ? null
      : {
          wallet: PlayerTierRequirements.Wallet * (this.value + 1),
          level: PlayerTierRequirements.Level * (this.value + 1)
        };
  }

  public isMaximumLevel() {
    return this.value >= PlayerLimits.Tier;
  }
}

export class PlayerLevelsMasterySchema {
  @prop({ type: Number })
  public value!: number;

  public constructor(options: OmitFunctions<Omit<PlayerLevelsMasterySchema, 'requirements'>>) {
    this.value = options.value;
  }

  public update(options: Partial<OmitFunctions<Omit<PlayerLevelsMasterySchema, 'requirements'>>>): this {
    return Object.assign(this, options);
  }

  public get requirements() {
    return this.isMaximumLevel()
      ? null
      : {
          star: PlayerMasteryRequirements.Star * (this.value + 1),
          tier: PlayerMasteryRequirements.Tier * (this.value + 1)
        };
  }

  public isMaximumLevel() {
    return this.value >= PlayerLimits.Mastery;
  }
}
