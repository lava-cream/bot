import { randomNumber } from '#lib/utilities';

export const enum Guess {
  NONE = 0,
  LOWER = 1,
  JACKPOT = 2,
  HIGHER = 3
}

export const enum Outcome {
  JACKPOT = 1,
  WIN = 2,
  LOSE = 3
}

export class Logic {
  public value: number;
  public hint: number;
  public guess: Guess;

  public constructor(public min: number, public max: number) {
    this.value = randomNumber(min, max);
    this.hint = randomNumber(min, max);
    this.guess = Guess.NONE;
  }

  public get outcome(): Outcome {
    switch (true) {
      case this.guess === Guess.JACKPOT && this.value === this.hint: {
        return Outcome.JACKPOT;
      }

      case this.value > this.hint && this.guess === Guess.HIGHER:
      case this.value < this.hint && this.guess === Guess.LOWER: {
        return Outcome.WIN;
      }

      default: {
        return Outcome.LOSE;
      }
    }
  }

  public isLose(): boolean {
    return this.outcome === Outcome.LOSE;
  }

  public isJackpot(): boolean {
    return this.outcome === Outcome.JACKPOT;
  }

  public isWin(): boolean {
    return this.outcome === Outcome.WIN;
  }

  public hasGuessed(): this is Logic.Guessed {
    return this.guess !== Guess.NONE;
  }

  public setGuess(guess: Guess): asserts this is Logic.Guessed {
    this.guess = guess;
  }
}

export declare namespace Logic {
  class Guessed extends Logic {
    public override guess: Exclude<Guess, Guess.NONE>;
  }
}
