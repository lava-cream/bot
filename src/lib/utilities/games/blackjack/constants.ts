import { Constants as DiscordConstants, ColorResolvable } from 'discord.js';

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
    color: () => DiscordConstants.Colors.GREEN
  },
  [Outcome.LOSS]: {
    message: 'You lost ):',
    color: () => DiscordConstants.Colors.RED
  },
  [Outcome.TIE]: {
    message: 'You tied.',
    color: () => DiscordConstants.Colors.YELLOW
  },
  [Outcome.OTHER]: {
    message: '',
    color: () => DiscordConstants.Colors.BLURPLE
  }
};

export type OutcomeResult = {
  outcome: Outcome;
  reason: string;
  extra?: string;
} | null;
