import type { PieceOptions } from "@sapphire/framework";
import type { Games } from "../game";

export const enum BoosterShopEntryType {
  Quantity = 1,
  Duration = 2,
};

export const enum BoosterShopEntryUnit {
  Coins = 1,
  Stars = 2,
  Energy = 3
};

export interface BoosterShopEntry {
  cost: number;
  type: BoosterShopEntryType;
  duration: number;
  unit: BoosterShopEntryUnit;
}

export const enum BoosterType {
  CoinMultiplier = 1,
  BankSpaceMultiplier = 2,
  WinStreakBonus = 1,
}

export interface BoosterOptions extends PieceOptions {
  readonly id: string;
  readonly description: string;
  readonly shopEntries: BoosterShopEntry[];
  readonly type: BoosterType;
  readonly excludedGames?: Games.Keys[];
}
