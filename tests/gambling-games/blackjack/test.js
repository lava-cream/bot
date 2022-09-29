import { Constants, Suits, Faces } from './logic.js';
import { randomInArray } from '../../utilities.js';

class Card {
	constructor(
		suit = randomInArray([...Suits.values()]),
		face = randomInArray([...Faces.values()])
	) {
		/** 
		 * @type {import('./logic.js').Suit} 
		 */
		this.suit = suit;
		/** 
		 * @type {import('./logic.js').Face} 
		 */
		this.face = face;
		/** 
		 * @type {number} 
		 */
		this.baseValue = typeof face === 'number' ? face : face === 'A' ? Constants.BJ_ACE_MIN : Constants.BJ_FACE;
	}
}

class Hand {
	/**
	 * @param {number} id
	 * @param {Card[]} cards
	 */
	constructor(id, cards = Array.from({ length: 2 }, () => new Card())) {
		/**
		 * @type {number}
		 */
		this.id = id;
		/** 
		 * @type {Card[]} 
		 */
		this.cards = [];
		this.set(cards);
	}

	/**
	 * Inserts a new card in this hand.
	 * @param {Card} card The new card to insert.
	 * @returns {Card}
	 */
	insert(card = new Card()) {
		if (this.duplicates(card)) return this.insert();
		this.cards.push(card);
		return card;
	}

	/**
	 * Checks whether the card to check for is a duplicate of an existing one from this hand.
	 * @param {Card} card
	 */
	duplicates(card) {
		return this.cards.some(c => c.face === card.face && c.suit === card.suit);
	}

	/**
	 * @param {Card[]} cards
	 */
	set(cards) {
		for (const card of cards.values()) {
			this.insert(card);
		}

		return this.cards;
	}

	/**
	 * @param {number} index
	 * @param {Card} card
	 */
	replace(index, card) {
		this.cards.splice(index, 1, card);
		return this;
	}

	/**
	 * Checks if this hand is splittable or not.
	 */
	isSplittable() {	
		return this.cards.length === 2 && this.cards.every((c1, _, c1s) => c1s.every(c2 => c2.baseValue === c1.baseValue));
	}
}

class PlayerHandManager {
	/**
	 * @param {Blackjack} player
	 */
	constructor(player) {
		/** 
		 * @type {Blackjack} player 
		 */
		this.player = player;
		/**
		 * The hands of the player.
		 * @type {Hand[]}
		 */
		this.hands = [new Hand(1)];
		/**
		 * The index of the current active hand.
		 * @type {number}
		 */
		this.index = 0;
	}

	/**
	 * Returns the active hand of the player.
	 */
	get active() {
		return this.hands.at(this.index);
	}

	/**
	 * Creates another hand of cards.
	 * @param {Card[]} cards
	 */
	createHand(cards) {
		const hand = new Hand(this.hands.length + 1, cards);
		this.hands.push(hand);
		return hand;
	}

	/**
	 * Toggles between existing hands by their respective indexes.
	 * @param {number} index
	 */
	switch(index) {
		this.index = index;
		return this;
	}

	/**
	 * Splits the active hand into 2, just what real game does. For now, as part of automated testing, we'll auto split every hand as much as possible.
	 * @param {Hand[]} hand
	 */
	split(hand) {
		return this.hands.splice(
			this.hands.indexOf(hand), 
			1, 
			...hand.cards.map(card => new Hand(this.hands.length + 1, [card, new Card()]))
		);
	}
}

class Blackjack {
	constructor() {
		/**
		 * The hands of the player.  
		 * @type {PlayerHandManager} 
		 */
		this.player = new PlayerHandManager(this);
		/**
		 * The hand of the opponent.
		 */
		this.opponent = new Hand(1);
	}
}

console.log(new Blackjack().player.hands.map(hand => hand.cards));