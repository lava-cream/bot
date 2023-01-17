import type { PlayerBoosterSchema } from "#lib/database/models/economy/player/player.booster.schema";
import type { Booster } from "./booster.piece";
import { BoosterType } from "./booster.options.js";

export class BoosterPayload {
  public constructor(public piece: Booster, public schema: PlayerBoosterSchema) { }

  public get coinMultiplier() {
    return this.schema.values.getValue(BoosterType.CoinMultiplier);
  }

  public get bankSpaceMultiplier() {
    return this.schema.values.getValue(BoosterType.BankSpaceMultiplier);
  }

  public get winStreakBonus() {
    return this.schema.values.getValue(BoosterType.WinStreakBonus);
  }

  public get winStreakSaver() {
    return this.schema.values.getValue(BoosterType.WinStreakSaver);
  }
}