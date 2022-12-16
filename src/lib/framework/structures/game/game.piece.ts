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
  public readonly id: string;
  public readonly description: string | null;
  public readonly detailedDescription: string | null;

  public constructor(context: PieceContext, options: GameOptions) {
    super(context, options);
    this.id = options.id;
    this.description = options.description ?? null;
    this.detailedDescription = options.detailedDescription ?? null;
  }

  public abstract play(context: GameContext): Awaitable<unknown>;

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
