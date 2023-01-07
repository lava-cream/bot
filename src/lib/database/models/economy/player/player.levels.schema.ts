import { PlayerLimits } from '#lib/utilities/constants/index.js';
import { CreateNumberValueSchema } from '#lib/database/structures/schema.js';

/**
 * Represents the player's level information.
 * @since 6.0.0
 */
export class PlayerLevelsSchema extends CreateNumberValueSchema(0) {
  /**
   * The XP points.
   */
  public declare value: number;

  /**
   * The approximate level of the player.
   */
  public get level() {
    return Math.trunc(Math.sqrt(this.value / 100));
  }

  /**
   * The current level's XP target.
   */
  public get levelXPTarget() {
    return this.calcLevelXPTarget(this.level);
  }

  /**
   * The next level's XP target.
   */
  public get nextLevelXPTarget() {
    return this.calcLevelXPTarget(this.level + 1);
  }

  /**
   * Checks if the level of the player is already at max.
   * @returns A boolean.
   */
  public isMaxLevel() {
    return this.level >= PlayerLimits.Level;
  }

  /**
   * Calculates the XP target of a specific level.
   * @param level The level.
   * @returns The calculated value.
   */
  public calcLevelXPTarget(level: number) {
    return Math.trunc(level ** 2 * 100);
  }
}
