import { ColorResolvable, Colors } from 'discord.js';

export const Suits = ['♠', '♥', '♦', '♣'] as const;
export const Faces = ['A', 'J', 'Q', 'K', ...Array.from({ length: 9 }, (_, i) => i + 2)] as const;

export const enum Constants {
	BJ_WIN = 21,
	BJ_DEALER_MAX = 17,
	BJ_FACE = 10,
	BJ_ACE_MIN = 1,
	BJ_ACE_MAX = 11
}

export enum Outcome {
	WIN = 1,
	LOSS,
	TIE,
	OTHER
}

export const Outcomes: Record<
	Outcome,
	{
		message: string;
		color: () => ColorResolvable;
	}
> = {
	[Outcome.WIN]: {
		message: 'You win!',
		color: () => Colors.Green
	},
	[Outcome.LOSS]: {
		message: 'You lost ):',
		color: () => Colors.Red
	},
	[Outcome.TIE]: {
		message: 'You tied.',
		color: () => Colors.Yellow
	},
	[Outcome.OTHER]: {
		message: '',
		color: () => Colors.Blurple
	}
};

export type OutcomeResult = {
	outcome: Outcome;
	reason: string;
	extra?: string;
} | null;
