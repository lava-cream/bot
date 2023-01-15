import { Awaitable, Piece } from "@sapphire/framework";
import type { Game, Games } from "../game";
import type { BoosterOptions, BoosterShopEntry, BoosterType } from "./booster.options.js";

/**
 * Represents a game boooster
 * @since 6.1.0
 */
export abstract class Booster extends Piece<BoosterOptions> implements BoosterOptions {
  public readonly id: string;
  public readonly description: string;
  public readonly shopEntries: BoosterShopEntry[];
  public readonly type: BoosterType;
  public readonly excludedGames: Games.Keys[];
  public constructor(context: Piece.Context, options: BoosterOptions) {
    super(context, options);
    this.id = options.id;
    this.description = options.description;
    this.shopEntries = options.shopEntries;
    this.type = options.type;
    this.excludedGames = options.excludedGames ?? [];
  }

  /**
   * The booster's precondition in order to be triggered.
   * @param context The game's context.
   */
  public abstract preTrigger(context: Game.Context): Awaitable<boolean>;

  /**
   * Returns the value to apply towards the game's logic.
   * @param context The game's context.
   */
  public abstract trigger(context: Game.Context): Awaitable<number>;
}