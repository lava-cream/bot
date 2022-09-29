import { randomItem } from '#lib/utilities';
import type { User } from 'discord.js';
import { Constants, Faces, Suits } from './constants.js';

export interface ICard {
  suit: typeof Suits[number];
  face: typeof Faces[number];
  baseValue: number;
}

export class Card implements ICard {
  public readonly suit: typeof Suits[number];
  public readonly face: typeof Faces[number];
  public baseValue: number;

  public constructor(options: ICard | Card) {
    this.suit = options.suit;
    this.face = options.face;
    this.baseValue = options.baseValue;
  }
}

export interface IPlayer {
  user: User;
  hand: Card[];
}

export class Player implements IPlayer {
  public readonly hand: Card[] = [];
  public stood = false;

  public constructor(public readonly user: User) {}

  public stand() {
    return (this.stood = true);
  }

  public deal(initial: boolean): void {
    const face = randomItem([...Faces.values()]);
    const suit = randomItem([...Suits.values()]);

    if (this.hand.find((card) => card.face === face && card.suit === suit)) {
      return this.deal(initial);
    }

    const card: Card = {
      face,
      suit,
      baseValue: typeof face === 'number' ? face : face === 'A' ? Constants.BJ_ACE_MIN : Constants.BJ_FACE
    };

    if (initial && this.countHand([...this.hand, card]) >= Constants.BJ_WIN) {
      return this.deal(initial);
    }

    this.hand.push(card);
  }

  public countHand(hand = this.hand): number {
    for (const card of hand.values()) {
      if (card.face === 'A') {
        card.baseValue = Constants.BJ_ACE_MAX;
      }
    }

    let lowerAce: Card | undefined;
    while (
      this.countHandRaw(hand) > Constants.BJ_WIN &&
      (lowerAce = hand.find((card) => card.face === 'A' && card.baseValue !== Constants.BJ_ACE_MIN))
    ) {
      lowerAce.baseValue = Constants.BJ_ACE_MIN;
    }

    return this.countHandRaw(hand);
  }

  public countHandRaw(hand = this.hand): number {
    return hand.reduce((n, card) => card.baseValue + n, 0);
  }
}
