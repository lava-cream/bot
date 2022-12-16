import type { Games } from '#lib/framework/structures/game/game.types';
import { Store } from '@sapphire/framework';
import { Game } from './game.piece.js';

export class GameStore extends Store<Game> {
  public constructor() {
    super(Game, { name: 'games' });
  }
}

export declare interface GameStore {
  get<T extends Games.Keys>(key: T): Game;
  get(key: string): undefined;
}

declare module '@sapphire/pieces' {
  interface StoreRegistryEntries {
    games: GameStore;
  }
}
