import { Side, Outcome } from './constants.js';
import { randomItem } from '#lib/utilities';
import type { User } from 'discord.js';
import { Player } from './helpers.js';

export class Logic {
  public readonly player: Player;
  public readonly opponent: Player;

  public constructor(player: User, opponent: User) {
    this.player = new Player(player);
    this.opponent = new Player(opponent);
  }

  public pick(playerSide: Side): asserts this is Logic.Picked {
    this.player.pick(playerSide);
    this.opponent.pick(randomItem(Object.values(Side)));
  }

  public get outcome(): Outcome {
    switch (true) {
      case !this.player.hasPicked(): {
        return Outcome.NONE;
      }

      case this.player.wonAgainst(this.opponent): {
        return Outcome.WIN;
      }

      default: {
        return Outcome.LOSE;
      }
    }
  }

  public hasPicked(): this is Logic.Picked {
    return this.outcome !== Outcome.NONE;
  }

  public isWin(): this is Logic.Picked {
    return this.outcome === Outcome.WIN;
  }

  public isLose(): this is Logic.Picked {
    return this.outcome === Outcome.LOSE;
  }
}

export declare namespace Logic {
  class Picked extends Logic {
    public override readonly player: Player.Picked;
    public override readonly opponent: Player.Picked;
    public override get outcome(): Exclude<Outcome, Outcome.NONE>;
  }
}
