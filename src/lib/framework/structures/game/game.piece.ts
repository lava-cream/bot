import type { PieceContext, PieceOptions } from '@sapphire/framework';
import { Piece } from '@sapphire/framework';
import type { Awaitable } from 'discord.js';
import type { GameContext } from './game.context.js';
import type { GameStore } from './game.store.js';

export interface GameOptions extends PieceOptions {
  id: string;
  description?: string | null;
  detailedDescription?: string | null;
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

  public constructor(context: PieceContext, options: GameOptions) {
    super(context, options);
    this.id = options.id;
    this.description = options.description ?? null;
    this.detailedDescription = options.detailedDescription ?? null;
  }

  /**
   * Main method to call to actually run and play this game.
   * @param context The game's controller.
   */
  public abstract play(context: GameContext): Awaitable<unknown>;
}

export declare namespace Game {
  type Options = GameOptions;
  type Context = GameContext;
  type JSON = Piece.JSON;
  type LocationJSON = Piece.LocationJSON;
}
