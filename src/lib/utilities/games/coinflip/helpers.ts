import { isNullOrUndefined } from '@sapphire/utilities';
import type { Side } from './constants.js';
import type { User } from 'discord.js';

export class Player {
  public value: Side | null = null;

  public constructor(public readonly user: User) {}

  public pick(side: Side): asserts this is Player.Picked {
    this.value = side;
  }

  public hasPicked(): this is Player.Picked {
    return !isNullOrUndefined(this.value);
  }

  public wonAgainst(opponent: Player): boolean {
    if (!opponent.hasPicked() || !this.hasPicked()) return false;
    return opponent.value === this.value;
  }
}

export declare namespace Player {
  class Picked extends Player {
    public override value: Side;
  }
}
