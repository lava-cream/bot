import type { PieceOptions } from '@sapphire/framework';
import type { Games } from '../game';

/**
 * The shop entry type of this booster.
 */
export const enum BoosterOfferType {
	Quantity = 1,
	Duration = 2
}

/**
 * The currency to use to purchase a booster.
 */
export const enum BoosterOfferUnit {
	Coins = 1,
	Star = 2,
	Energy = 3
}

export interface BoosterOffer {
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
	 * * {@link BoosterOfferType.Quantity Quantity} - Increments the user's owned boosters.
	 * * {@link BoosterOfferType.Duration Duration} - Activates the booster on purchase.
	 */
	type: BoosterOfferType;
	/**
	 * The currency to use to purchase a booster.
	 */
	unit: BoosterOfferUnit;
	/**
	 * If `type` is {@link BoosterOfferType.Quantity}, this should be a constant quantity.
	 * If `type` is {@link BoosterOfferType.Duration}, this should either be:
	 * * A constant duration in ms format.
	 * * A custom RNG.
	 */
	value: number | (() => number);
}

/**
 * Represents a booster value type.
 */
export const enum BoosterTypeKind {
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
	WinStreakSaver = 4
}

export interface BoosterType {
	kind: BoosterTypeKind;
	/**
	 * The booster's value for this type.
	 */
	value: number | { min: number; max: number };
}

export interface BoosterOptions extends PieceOptions {
	readonly id: string;
	readonly description: string;
	readonly offers: BoosterOffer[];
	readonly types: BoosterType[];
	readonly excludedGames?: Games.Keys[];
}
