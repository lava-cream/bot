import { randomInArray, parseProcessArgs, randomNumber } from '../utilities.js';

/**
 * Creates an array of 10-based percentages.
 * @param {number} length The length of the percentage array.
 */
const createPercentages = (length) => {
  const num = 100;

  const base = Math.floor(num / length);
  /** @type {Array<{ value: number }>} */
  const ns = Array(length).fill(null).map(() => ({ value: base }));
  const baseTotal = base * length;
  const diff = num - baseTotal;

  for (let i = length; i > 0; i--) {
    // Add 2 since we're deducting 1 from a random.
    randomInArray(ns).value += 1;
    // Deduct 1 to balance those who are higher (>=base) and lower (<base).
    randomInArray(ns).value--;
  }

  return { num, base, baseTotal, diff, ns, nsTotal: ns.reduce((n, c) => n + c.value, 0) };
};

const args = parseProcessArgs('number', 'length');

const number = args.number.toNumber();
const length = args.length.toNumber();

const formatter = Intl.NumberFormat('en-us', { notation: 'compact', maximumFractionDigits: 2 });

console.log(
  createPercentages(length).ns
    .map((n => number * (n.value / 100)))
    .sort((a, b) => b - a)
    .map(formatter.format)
);