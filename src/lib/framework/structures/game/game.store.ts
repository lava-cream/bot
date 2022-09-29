import { Store } from '@sapphire/framework';
import { Game } from './game.piece.js';

export class GameStore extends Store<Game> {
  public constructor() {
    super(Game, { name: 'games' });
  }
}

declare module '@sapphire/pieces' {
  interface StoreRegistryEntries {
    games: GameStore;
  }
}
