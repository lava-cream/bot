import { scatter, parseProcessArgs, roundZero } from '../utilities.js';

const args = parseProcessArgs('amount', 'min', 'max', 'length');

const amount = args.amount.toNumber();
const min = args.min.toNumber();
const max = args.max.toNumber();
const length = args.length.toNumber();

const scattered = scatter(100, min, max, length).map(n => ({ ...n, percent: Math.round(amount * (n.value / 100)).toLocaleString() }));

console.log({ total: scattered.reduce((n, c) => n + c.value, 0), scattered });