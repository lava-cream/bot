import { getCommonItemsLength, randomItems } from '#lib/utilities';

export interface Emoji {
  emoji: string;
  multiplier: EmojiMultiplier;
}

export interface EmojiMultiplier {
  win: number;
  jackpot: number;
}

export class Logic {
  public slots: Emoji[];
  public revealed = false;

  public constructor(public readonly emojis: Emoji[]) {
    this.slots = randomItems(emojis, 3, false);
  }

  public get common(): Emoji[] {
    return this.slots.filter((slot, _, array) => getCommonItemsLength(array, slot) >= 2);
  }

  public get multiplier() {
    const winningEmoji = this.common.at(0);
    return winningEmoji ? Reflect.get(winningEmoji.multiplier, this.isJackpot() ? 'jackpot' : 'win') : 0;
  }

  public isJackpot() {
    return this.common.length === 3;
  }

  public isWin() {
    return this.common.length === 2;
  }

  public isLose() {
    return !this.isJackpot() || !this.isWin();
  }

  public reroll() {
    this.slots = randomItems(this.emojis, 3, false);
    return this;
  }

  public reveal(): this {
    this.revealed = true;
    return this;
  }
}
