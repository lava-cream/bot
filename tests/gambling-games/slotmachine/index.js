// @ts-check
import { parseProcessArgs } from '../../utilities.js'

/**
 * @template T 
 * @param {T[]} array 
 * @param {T} item 
 * @returns number
 */
function getCommonItemsLength(array, item) {
  return array.filter((elem) => elem === item).length;
}

/**
 * @template T
 * @param {T[]} array 
 * @returns T
 */
function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * @template T
 * @param {T[]} src 
 * @param {T[]} exc 
 * @returns 
 */
function deepFilter(src, exc) {
  return src.filter((s) => !exc.some((e) => e === s));
}


/**
 * @template T
 * @param {T[]} array 
 * @param {number} amount 
 * @param {boolean} filterCommon 
 * @returns T[]
 */
function randomItems(array, amount = array.length, filterCommon = true) {
  /** @type {T[]} */
  const items = [];

  while (items.length < amount) {
    const srcArray = filterCommon ? deepFilter(array, items) : array;
    items.push(randomItem(srcArray));
  }

  return items;
}

/**
 * @typedef {object} EmojiMultiplier
 * @property {number} win
 * @property {number} jackpot
 */

/**
 * @typedef {object} Emoji
 * @property {string} emoji
 * @property {EmojiMultiplier} multiplier
 */

export class Logic {
  slots;
  revealed = false;

  /**
   * .
   * @param {Emoji[]} emojis 
   */
  constructor(emojis) {
    this.slots = randomItems(emojis, 3, false);
    this.emojis = emojis;
  }

  get common() {
    return this.slots.filter((slot, _, array) => getCommonItemsLength(array, slot) >= 2);
  }

  get multiplier() {
    const winningEmoji = this.common.at(0);
    return winningEmoji ? Reflect.get(winningEmoji.multiplier, this.isJackpot() ? 'jackpot' : 'win') : 0;
  }

  isJackpot() {
    return this.common.length === 3;
  }

  isWin() {
    return this.common.length === 2;
  }

  isLose() {
    return !this.isJackpot() || !this.isWin();
  }

  reroll() {
    this.slots = randomItems(this.emojis, 3, false);
    return this;
  }

  reveal() {
    this.revealed = true;
    return this;
  }
}

const stats = {
  jackpot: { count: 0, multi: 0 },
  wins: { count: 0, multi: 0 },
  loses: { count: 0, multi: 0 },
};

const args = parseProcessArgs('games', 'bet');
const games = args.games.toNumber();
const bet = args.bet.toNumber();

/**
 * @type {Emoji[]} 
 */
const emojis = [
  { emoji: '🔥', multiplier: { jackpot: 500, win: 10 } },
  { emoji: '🐉', multiplier: { jackpot: 250, win: 9 } },
  { emoji: '🌟', multiplier: { jackpot: 175, win: 8 } },
  { emoji: '⭐', multiplier: { jackpot: 150, win: 7 } },
  { emoji: '✨', multiplier: { jackpot: 125, win: 6 } },
  { emoji: '💍', multiplier: { jackpot: 100, win: 5 } },
  { emoji: '💎', multiplier: { jackpot: 75, win: 4 } },
  { emoji: '😎', multiplier: { jackpot: 50, win: 3 } },
  { emoji: '😏', multiplier: { jackpot: 25, win: 2 } },
  { emoji: '🤡', multiplier: { jackpot: 10, win: 1 } }
];
const machines = Array(games).fill(null).map(() => new Logic(emojis));

for (const machine of machines) {
  switch(true) {
    case machine.isJackpot(): {
      stats.jackpot.count++;
      stats.jackpot.multi += machine.multiplier;
      break;
    };

    case machine.isWin(): {
      stats.wins.count++;
      stats.wins.multi += machine.multiplier;
      break;
    };

    case machine.isLose(): {
      stats.loses.count++;
      break;
    };
  }
}

console.log(stats, { 
  jackpot: (stats.jackpot.multi * bet).toLocaleString(),
  wins: (stats.wins.multi * bet).toLocaleString(),
  loses: (stats.wins.count * bet).toLocaleString()
});