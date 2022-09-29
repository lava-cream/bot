// @ts-check

import { randomInArray } from '../../utilities.js';

/**
 * @typedef {Object} Player
 * @prop {string} id
 * @prop {Card[]} hand
 */

/**
 * @typedef {Object} BlackjackOutcome
 * @prop {Outcome} outcome
 * @prop {string} reason
 * @prop {string} [extra]
 */

/**
 * @typedef {object} Card
 * @prop {Suits[number]} suit
 * @prop {Faces[number]} face
 * @prop {number} baseValue
 */

/**
 * @typedef {?BlackjackOutcome} OutcomeResult
 */

/** @enum {number} */
export const Constants = {
	BJ_WIN: 21,
  BJ_DEALER_MAX: 17,
  BJ_FACE: 10,
  BJ_ACE_MIN: 1,
  BJ_ACE_MAX: 11
};

export const Suits = /** @type {const} */ (['♠', '♥', '♦', '♣']);

export const Faces = /** @type {const} */ (['A', 'J', 'Q', 'K', ...Array.from({ length: 9 }, (_, i) => i + 2)]);

/** @enum {number} */
export const Outcome = {
	WIN: 1,
	LOSS: 2,
	TIE: 3,
	OTHER: 4,
};

/**
 * @type {Record<Outcome, string>}
 */
export const Outcomes = {
	[Outcome.WIN]: 'You win!',
	[Outcome.LOSS]: 'You lost ):',
	[Outcome.TIE]: 'You tied.',
	[Outcome.OTHER]: '',
};

export class Blackjack {
	/**
	 * @param {string} player
	 * @param {string} dealer
	 * @public
	 */
	constructor(player, dealer) {
		/** 
		 * @type {Player} 
		 * @readonly
		 */
		this.player = { id: player, hand: [] };
		/** 
		 * @type {Player}
		 * @readonly 
		 */
		this.dealer = { id: dealer, hand: [] };
		/**
		 * @type {OutcomeResult}
		 */
		this.outcome = null;
		/**
		 * @type {boolean}
		 */
		this.stood = false;
	}

	stand() {
		this.stood = true;
		return this;
	}

	/**
	 * @param {Player} player
	 * @param {boolean} initial
	 * @returns {void}
	 */
	deal(player, initial) {
		const face = randomInArray([...Faces.values()]);
    const suit = randomInArray([...Suits.values()]);

    if (player.hand.find((card) => card.face === face && card.suit === suit)) {
      return this.deal(player, initial);
    }

    /** @type {Card} */
    const card = {
      face,
      suit,
      baseValue: typeof face === 'number' ? face : face === 'A' ? Constants.BJ_ACE_MIN : Constants.BJ_FACE
    };

    if (initial && this.countHand([...player.hand, card]) >= Constants.BJ_WIN) {
      return this.deal(player, initial);
    }

    player.hand.push(card);
	}

	/**
	 * @protected
	 * @param {Card[]} cards
	 * @returns {number}
	 */
	countHandRaw(cards) {
    return cards.reduce((acc, curr) => curr.baseValue + acc, 0);
  }

  /**
   * @param {Card[]} hand
   * @returns {number}
   */
  countHand(hand) {
    for (const card of hand) {
      if (card.face === 'A') {
        card.baseValue = Constants.BJ_ACE_MAX;
      }
    }

    /** @type {Card | undefined} */
    let lowerAce;
    while (
      this.countHandRaw(hand) > Constants.BJ_WIN &&
      (lowerAce = hand.find((card) => card.face === 'A' && card.baseValue !== Constants.BJ_ACE_MIN))
    ) {
      lowerAce.baseValue = Constants.BJ_ACE_MIN;
    }

    return this.countHandRaw(hand);
  }

  /**
   * @param {string} reason
   * @returns {Record<'win' | 'loss' | 'tie' | 'other', (extra?: string) => OutcomeResult>}
   */
  reason(reason) {
    return {
      win: () =>
        (this.outcome = {
          outcome: Outcome.WIN,
          reason
        }),
      loss: () =>
        (this.outcome = {
          outcome: Outcome.LOSS,
          reason
        }),
      tie: () =>
        (this.outcome = {
          outcome: Outcome.TIE,
          reason
        }),
      other: (extra) =>
        (this.outcome = {
          outcome: Outcome.OTHER,
          reason,
          extra
        })
    };
  }

  /**
   * @param {boolean} [stood=false]
   * @returns {OutcomeResult}
   */
  getOutcome(stood = this.stood) {
    const playerScore = this.countHand(this.player.hand);
    const dealerScore = this.countHand(this.dealer.hand);

    if (playerScore === Constants.BJ_WIN) {
      this.reason('You got to 21.').win();
    } else if (dealerScore === Constants.BJ_WIN) {
      this.reason('The dealer got to 21 before you.').loss();
    } else if (playerScore <= Constants.BJ_WIN && this.player.hand.length === 5) {
      this.reason('You took 5 cards without going over 21.').win();
    } else if (dealerScore <= Constants.BJ_WIN && this.dealer.hand.length === 5) {
      this.reason('The dealer took 5 cards without going over 21.').loss();
    } else if (playerScore > Constants.BJ_WIN) {
      this.reason('You went over 21 and busted.').loss();
    } else if (dealerScore > Constants.BJ_WIN) {
      this.reason('The dealer went over 21 and busted.').win();
    } else if (stood && playerScore > dealerScore) {
      this.reason(
        `You stood with a higher score (${playerScore.toString()}) than the dealer (${
          dealerScore.toString()
        })`
      ).win();
    } else if (stood && dealerScore > playerScore) {
      this.reason(
        `You stood with a lower score (${playerScore.toString()}) than the dealer (${
          dealerScore.toString()
        })`
      ).loss();
    } else if (stood && dealerScore === playerScore) {
      this.reason('You tied with the dealer.').tie();
    }

    return this.outcome;
  }
}