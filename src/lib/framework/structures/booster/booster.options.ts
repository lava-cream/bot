import type { PieceOptions } from "@sapphire/framework";
import type { Games } from "../game";

/**
 * The shop entry type of this booster.
 */
export const enum BoosterShopOfferType {
  Quantity = 1,
  Duration = 2,
};

/**
 * The currency to use to purchase a booster.
 */
export const enum BoosterShopOfferUnit {
  Coins = 1,
  Star = 2,
  Energy = 3
};

export interface BoosterShopOffer {
  /**
   * The unique id of this shop entry.
   */
  id: string;
  /**
   * The price of this booster.
   */
  cost: number;
  /**
   * Whether purchasing this booster is based on:
   * * {@link BoosterShopOfferType.Quantity Quantity} - Increments the user's owned boosters.
   * * {@link BoosterShopOfferType.Duration Duration} - Activates the booster on purchase.
   */
  type: BoosterShopOfferType;
  /**
   * The currency to use to purchase a booster.
   */
  unit: BoosterShopOfferUnit;
  /**
   * If `type` is {@link BoosterShopOfferType.Quantity}, this should be a constant quantity.
   * If `type` is {@link BoosterShopOfferType.Duration}, this should either be:
   * * A constant duration in ms format.
   * * A custom RNG.
   */
  value: number | (() => number);
}

/**
 * Represents the booster's type.
 */
export const enum BoosterType {
  /**
   * Applies a multiplier towards the raw winnings from a game.
   */
  CoinMultiplier = 1,
  /**
   * Converts the winnings into bank space.
   */
  BankSpaceMultiplier = 2,
  /**
   * Adds a multiplier towards the final winnings from a game per winning streak.
   */
  WinStreakBonus = 3,
  /**
   * Saves the winning streak when a player loses a round of a game.
   */
  WinStreakSaver = 4,
}

export interface BoosterOptions extends PieceOptions {
  readonly id: string;
  readonly description: string;
  readonly shopOffers: BoosterShopOffer[];
  readonly types: BoosterType[];
  readonly excludedGames?: Games.Keys[];
}
