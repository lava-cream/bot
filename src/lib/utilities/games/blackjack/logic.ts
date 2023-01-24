import { type OutcomeResult, Outcome, Constants } from './constants.js';
import { inlineCode, User } from 'discord.js';
import { Player } from './helpers.js';

export class Logic {
	public readonly player: Player;
	public readonly dealer: Player;
	public outcome: OutcomeResult;

	public constructor(player: User, dealer: User) {
		this.player = new Player(player);
		this.dealer = new Player(dealer);
		this.outcome = null;
	}

	public get stood() {
		return this.player.stood;
	}

	public start(): this {
		for (let i = 0; i < 2; i++) {
			this.player.deal(true);
			this.dealer.deal(true);
		}

		return this;
	}

	public setOutcome(outcome: Outcome, reason: string, extra?: string): Exclude<OutcomeResult, null> {
		return (this.outcome = { outcome, reason, extra });
	}

	public getOutcome(): OutcomeResult {
		const playerScore = this.player.countHand();
		const dealerScore = this.dealer.countHand();

		if (playerScore === Constants.BJ_WIN) {
			this.setOutcome(Outcome.WIN, 'You got to 21.');
		} else if (dealerScore === Constants.BJ_WIN) {
			this.setOutcome(Outcome.LOSS, 'The dealer got to 21 before you.');
		} else if (playerScore <= Constants.BJ_WIN && this.player.hand.length === 5) {
			this.setOutcome(Outcome.WIN, 'You took 5 cards without going over 21.');
		} else if (dealerScore <= Constants.BJ_WIN && this.dealer.hand.length === 5) {
			this.setOutcome(Outcome.LOSS, 'The dealer took 5 cards without going over 21.');
		} else if (playerScore > Constants.BJ_WIN) {
			this.setOutcome(Outcome.LOSS, 'You went over 21 and busted.');
		} else if (dealerScore > Constants.BJ_WIN) {
			this.setOutcome(Outcome.WIN, 'The dealer went over 21 and busted.');
		} else if (this.stood && playerScore > dealerScore) {
			this.setOutcome(
				Outcome.WIN,
				`You stood with a higher score (${inlineCode(playerScore.toString())}) than the dealer (${inlineCode(dealerScore.toString())})`
			);
		} else if (this.stood && dealerScore > playerScore) {
			this.setOutcome(
				Outcome.LOSS,
				`You stood with a lower score (${inlineCode(playerScore.toString())}) than the dealer (${inlineCode(dealerScore.toString())})`
			);
		} else if (this.stood && dealerScore === playerScore) {
			this.setOutcome(Outcome.TIE, 'You tied with the dealer.');
		}

		return this.outcome;
	}
}
