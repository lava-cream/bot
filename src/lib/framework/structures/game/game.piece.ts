import type { PieceContext, PieceOptions } from '@sapphire/framework';
import { Piece } from '@sapphire/framework';
import type { Awaitable } from 'discord.js';
import type { GameContext } from './game.context.js';
import type { GameStore } from './game.store.js';
import { roundZero } from '#lib/utilities';

export interface GameOptions extends PieceOptions {
  id: string;
  description?: string | null;
  detailedDescription?: string | null;
  interactionsLimit?: number;
}

export interface GameCalculateWinningsOptions {
  base?: number;
  bet: number;
  multiplier?: number;
  random?: number;
}

export interface GameCalculatedWinnings {
  raw: number;
  final: number;
}

export abstract class Game extends Piece<GameOptions> implements GameOptions {
  public declare readonly store: GameStore;
  /**
   * The game's unique identifier.
   */
  public readonly id: string;
  /**
   * The short description of this game.
   */
  public readonly description: string | null;
  /**
   * A more in-depth description of what this game does.
   */
  public readonly detailedDescription: string | null;
  /**
   * This limit represents the amount of times the player could only undergo a game loop.
   */
  public readonly interactionsLimit: number;
  
  /**
   * The default interactions limit.
   */
  public static DefaultInteractionsLimit = 30;

  public constructor(context: PieceContext, options: GameOptions) {
    super(context, options);
    this.id = options.id;
    this.description = options.description ?? null;
    this.detailedDescription = options.detailedDescription ?? null;
    this.interactionsLimit = options.interactionsLimit ?? Game.DefaultInteractionsLimit;
  }

  /**
   * Main method to call to actually run and play this game.
   * @param context The game's controller.
   */
  public abstract play(context: GameContext): Awaitable<unknown>;

  /**
   * Calculates for the coins the player is about to win.
   * @param options Options to calculate winnings.
   * @returns The winnings object.
   */
  protected static calculateWinnings(options: GameCalculateWinningsOptions): Readonly<GameCalculatedWinnings> {
    const { base = 0, random = Math.random(), multiplier = 0, bet } = options;
    const raw = Math.round(bet * (random + base));
    const final = Math.round(raw + raw * (multiplier / 100));

    return Object.freeze({ raw, final: roundZero(final) });
  }
}

export declare namespace Game {
  type Options = GameOptions;
  type Context = GameContext;
  type JSON = Piece.JSON;
  type LocationJSON = Piece.LocationJSON;

  type CalculatedWinnings = GameCalculatedWinnings;
}
