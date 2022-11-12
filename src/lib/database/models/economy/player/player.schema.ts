import { Schema, CastDocument, CastJSON, prop, CreateResolvableSchemaType } from '#lib/database/structures/schema.js';
import { PlayerDefaults, PlayerMasteryAddedLimits } from '#lib/utilities/constants/index.js';
import { PlayerWalletSchema } from './player.wallet.schema.js';
import { PlayerBankSchema } from './player.bank.schema.js';
import { PlayerEnergySchema } from './player.energy.schema.js';
import { PlayerLevelsSchema } from './player.levels.schema.js';
import { PlayerUpgradesSchema } from './player.upgrades.schema.js';
import { PlayerBetSchema } from './player.bet.schema.js';
import { PlayerMultiplierSchema } from './player.multiplier.schema.js';
import { PlayerAdvancementsManagerSchema } from './player.advancements.schema.js';
import { PlayerPartyManagerSchema } from './player.party.schema.js';
import { container } from '@sapphire/framework';

export class PlayerSchema extends Schema {
  @prop({ type: () => PlayerWalletSchema, immutable: true, default: new PlayerWalletSchema() })
  public readonly wallet!: PlayerWalletSchema;

  @prop({ type: () => PlayerBankSchema, immutable: true, default: new PlayerBankSchema() })
  public readonly bank!: PlayerBankSchema;

  @prop({ type: () => PlayerEnergySchema, immutable: true, default: new PlayerEnergySchema() })
  public readonly energy!: PlayerEnergySchema;

  @prop({ type: () => PlayerLevelsSchema, immutable: true, default: new PlayerLevelsSchema() })
  public readonly levels!: PlayerLevelsSchema;

  @prop({ type: () => PlayerUpgradesSchema, immutable: true, default: new PlayerUpgradesSchema() })
  public readonly upgrades!: PlayerUpgradesSchema;

  @prop({ type: () => PlayerBetSchema, immutable: true, default: new PlayerBetSchema() })
  public readonly bet!: PlayerBetSchema;

  @prop({ type: () => PlayerMultiplierSchema, immutable: true, default: new PlayerMultiplierSchema() })
  public readonly multiplier!: PlayerMultiplierSchema;

  @prop({ type: () => PlayerAdvancementsManagerSchema, immutable: true, default: new PlayerAdvancementsManagerSchema() })
  public readonly advancement!: PlayerAdvancementsManagerSchema;

  @prop({ type: () => PlayerPartyManagerSchema, immutable: true, default: new PlayerPartyManagerSchema() })
  public readonly party!: PlayerPartyManagerSchema;

  public get netWorth(): number {
    return this.wallet.value + this.bank.value;
  }

  public get maxBet(): number {
    return Math.round(PlayerDefaults.Bet + PlayerMasteryAddedLimits.Bet * this.upgrades.mastery);
  }

  public get minBet(): number {
    return Math.round(this.maxBet / 1_000);
  }

  public async calculateMultiplier() {
    let multiplier = this.multiplier.value;

    if (this.party.entries.length) {
      const parties = await Promise.all(this.party.entries.map(p => container.db.parties.fetch(p.id)));
      for (const party of parties.values()) multiplier += party.members.multiplier;
    }

    return multiplier;
  }
}

export declare namespace PlayerSchema {
  type Document = CastDocument<PlayerSchema>;
  type JSON = CastJSON<PlayerSchema>;
  type Resolvable = CreateResolvableSchemaType<PlayerSchema>;
}
