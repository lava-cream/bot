import { PlayerDefaults, PlayerLevel, PlayerLimits, PlayerMasteryAddedLimits } from '#lib/utilities/constants/index.js';
import { CreateNumberValueSchema } from '#lib/database/structures/schema.js';

export class PlayerLevelsSchema extends CreateNumberValueSchema(PlayerDefaults.Level * PlayerLevel.ExperienceRatio) {
  public get level() {
    return Math.trunc(this.value / PlayerLevel.ExperienceRatio);
  }

  public isMaxLevel(mastery: number) {
    return this.level >= PlayerLimits.Level + PlayerMasteryAddedLimits.Level * mastery;
  }
}
