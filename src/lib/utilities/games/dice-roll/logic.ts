import type { User } from 'discord.js';
import { randomNumber } from '#lib/utilities';
import { isNullOrUndefined } from '@sapphire/utilities';

export class Player {
  public value: number | null = null;

  public constructor(public readonly user: User) {}

  public roll(min = 1, max = 6): asserts this is Player.Rolled {
    this.value = randomNumber(min, max);
  }

  public hasRolled(): this is Player.Rolled {
    return !isNullOrUndefined(this.value);
  }

  public wonAgainst(opponent: Player): boolean {
    if (!this.hasRolled() || !opponent.hasRolled()) return false;
    return this.value > opponent.value;
  }

  public tiedAgainst(opponent: Player): boolean {
    if (!this.hasRolled() || !opponent.hasRolled()) return false;
    return this.value === opponent.value;
  }

  public lostAgainst(opponent: Player): boolean {
    if (!this.hasRolled() || !opponent.hasRolled()) return false;
    return this.value < opponent.value;
  }
}

export declare namespace Player {
  class Rolled extends Player {
    public override value: number;
  }
}

export const enum Outcome {
  NONE = 0,
  WIN = 1,
  LOSE = 2,
  TIE = 3
}

export class Logic {
  public readonly player: Player;
  public readonly opponent: Player;

  public constructor(player: User, opponent: User) {
    this.player = new Player(player);
    this.opponent = new Player(opponent);
  }

  public roll(): asserts this is Logic.Rolled {
    this.player.roll();
    this.opponent.roll();
  }

  public hasBothRolled(): this is Logic.Rolled {
    return this.player.hasRolled() && this.opponent.hasRolled();
  }

  public get outcome(): Outcome {
    switch (true) {
      case this.player.wonAgainst(this.opponent): {
        return Outcome.WIN;
      }

      case this.player.tiedAgainst(this.opponent): {
        return Outcome.TIE;
      }

      case this.player.lostAgainst(this.opponent): {
        return Outcome.LOSE;
      }

      default: {
        return Outcome.NONE;
      }
    }
  }

  public isWin(): this is Logic.Rolled {
    return this.outcome === Outcome.WIN;
  }

  public isTie(): this is Logic.Rolled {
    return this.outcome === Outcome.TIE;
  }

  public isLose(): this is Logic.Rolled {
    return this.outcome === Outcome.LOSE;
  }
}

export declare namespace Logic {
  class Rolled extends Logic {
    public override get outcome(): Exclude<Outcome, Outcome.NONE>;
    public override readonly player: Player.Rolled;
    public override readonly opponent: Player.Rolled;
  }
}
