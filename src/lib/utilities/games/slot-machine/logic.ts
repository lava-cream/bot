import { getCommonItemsLength, randomItems } from '#lib/utilities';

export interface Emoji {
  emoji: string;
  multiplier: number;
}

export class Logic {
  public slots: Emoji[];

  public constructor(public readonly emojis: Emoji[]) {
    this.slots = randomItems(emojis, 3, false);
  }

  public get common(): Emoji[] {
    return this.slots.filter((slot, _, array) => getCommonItemsLength(array, slot) === 3);
  }

  public get multiplier() {
    return this.common.reduce((n, emoji) => n + emoji.multiplier, 0);
  }

  public isWin() {
    return this.common.length === 3;
  }

  public isLose() {
    return this.common.length <= 2;
  }

  public reroll() {
    this.slots = randomItems(this.emojis, 3, false);
    return this;
  }
}
