import { getCommonItemsLength, randomItems } from '#lib/utilities';

export interface Emoji {
  emoji: string;
  multiplier: number;
}

export type Pair = Emoji[];

export class Logic {
  public pair: Pair;
  public revealed = false;

  public constructor(public readonly emojis: Emoji[]) {
    this.pair = randomItems(emojis, 2, false);
  }

  public get common(): readonly Emoji[] {
    return this.pair.filter((emoji, _, array) => getCommonItemsLength([...array.values()], emoji) === 2);
  }

  public get multiplier(): number {
    return this.pair.reduce((n, emoji) => n + emoji.multiplier, 0) ?? 0;
  }

  public isWin(): boolean {
    return this.common.length === 2;
  }

  public isLose(): boolean {
    return !this.isWin();
  }

  public reroll(): this {
    this.pair = randomItems(this.emojis, 2, false);
    return this;
  }

  public reveal(): this {
    this.revealed = true;
    return this;
  }
}
