import type { PlayerSchema } from '#lib/database';
import type { Games } from '#lib/framework/structures/game/game.types';
import { Store } from '@sapphire/framework';
import { Game } from './game.piece.js';

export class GameStore extends Store<Game> {
  public constructor() {
    super(Game, { name: 'games' });
  }

  public override get<T extends Games.Keys>(key: T): Game;
  public override get(key: string): undefined;
  public override get(key: string) {
    return super.find(g => g.id === key);
  }

  public syncPlayerGames(player: PlayerSchema): PlayerSchema {
    for (const game of this.filter(g => !player.games.collection.has(g.id)).values()) {
      player.games.create(game.id);
    }

    return player;
  }
}

declare module '@sapphire/pieces' {
  interface StoreRegistryEntries {
    games: GameStore;
  }
}
