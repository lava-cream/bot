import { PlayerLimits, PlayerDefaults, PlayerTierRequirements, PlayerMasteryRequirements } from '#lib/utilities/constants/index.js';
import { prop } from '#lib/database/structures/schema.js';

export class PlayerUpgradesSchema {
  @prop({ type: Number, immutable: true })
  public readonly tier!: number;

  @prop({ type: Number, immutable: true })
  public readonly mastery!: number;

  public constructor() {
    this.tier = PlayerDefaults.Tier;
    this.mastery = PlayerDefaults.Mastery;
  }

  public get requirements() {
    return new PlayerUpgradesRequirementManager(this);
  }

  public isMaxTier() {
    return this.tier >= PlayerLimits.Tier;
  }

  public isMaxMastery() {
    return this.mastery >= PlayerLimits.Mastery;
  }
}

export class PlayerUpgradesRequirementManager {
  public constructor(private context: PlayerUpgradesSchema) {}

  public get tier() {
    return this.context.isMaxTier()
      ? null
      : {
          wallet: PlayerTierRequirements.Wallet * (this.context.tier + 1),
          level: PlayerTierRequirements.Level * (this.context.tier + 1)
        };
  }

  public get mastery() {
    return this.context.isMaxMastery()
      ? null
      : {
          star: PlayerMasteryRequirements.Star * (this.context.mastery + 1),
          tier: PlayerMasteryRequirements.Tier * (this.context.mastery + 1)
        };
  }
}
