// @ts-check

/**
 * Creates a progress bar.
 * @param {number} percent A percentage between 1 and 100. 
 * @param {string} filled 
 * @param {string} empty 
 * @returns string
 */
export function progressBar(percent = 100, filled = '■', empty = '□') {
  percent = Math.max(0, Math.min(Math.trunc(percent / 10), 10));
  const repeat = Math.max(0, 10 - Math.min(10, Math.abs(percent)));
  return [filled.repeat(percent), empty.repeat(repeat)].join('');
}

/**
 * @typedef {Object} Scattered
 * @prop {number} value
 */

/**
 * @param {number} amount
 * @param {number} min
 * @param {number} max
 * @param {number} length
 */
export function scatter(amount, min, max, length) {
	/** @type {Scattered[]} */
  const scattered = [];
  const initialAmount = amount;
  const initialLength = length;

  /**
   * We don't wanna modify the length so let's adjust the max amount instead.
   */
  const adjust = () => {
    max = Math.round(max * length) > amount ? Math.round(amount / length) + length : max;
    min = min > max ? [max, max = min][0] : min;
  };

  adjust();

  console.log({ max, min });

  while (length > 0) {
    const random = randomNumber(min, max);
    scattered.push({ value: random });
    amount -= random;
    length--;
  }

  const sort = () => scattered.sort((a, b) => b.value - a.value);
  const getTotal = () => sort().reduce((p, c) => p + c.value, 0);

  switch (true) {
    case getTotal() === initialAmount:
      return scattered;

    case getTotal() < initialAmount: {
      const total = getTotal();
      for (let i = initialAmount - total; i > 0; i--) {
        const underMaxed = scattered.filter((s) => s.value < max);
        const random = randomInArray(underMaxed);
        if (random) random.value++;
      }

      for (let i = initialLength; i > 0; i--) {
        const allowed = scattered.filter((s) => s.value > min || s.value < max);
        const from = randomInArray(allowed.filter((a) => a.value - 1 >= min));
        const to = randomInArray(allowed.filter((a) => a.value + 1 <= max));
        if (to) {
          to.value++;
          from.value--;
        }
      }

      break;
    }

    default: {
      // Remove excess from all elements going above the length amount.
      const aboveLength = scattered.filter((s) => s.value > initialLength);
      for (const al of aboveLength) al.value -= al.value - initialLength;

      // Add the numbers to elements with missing numbers.
      if (getTotal() < initialAmount) {
        const underMaxed = scattered.filter((s) => s.value < initialLength);
        for (const um of underMaxed) {
          const difference = initialLength - um.value;
          const candidates = scattered.filter((s) => !underMaxed.includes(s)).filter((s) => s.value + difference <= max);
          const volunteer = randomInArray(candidates);
          if (volunteer) volunteer.value += difference;
        }
      }

      // Borrow item decrement, random (except the borrowed item) increment.
      for (let i = initialLength; i > 0; i--) {
        const from = randomInArray(scattered.filter((a) => a.value - 1 >= min));
        const to = randomInArray(scattered.filter((a) => a.value + 1 <= max));

        if (to) {
          to.value++;
          from.value--;
        }
      }

      break;
    }
  }

  return sort();
}

/**
 * @param {number} n
 * @param {number} zeros
 */
export function roundZero(n, zeros = 1) {
  const z = Number(`1e${Math.min(Math.max(zeros, 1), 20)}`);
  return Math.round(n / z) * z;
}

/**
 * @param {number} min
 * @param {number} max
 */
export function randomNumber(min, max) {
  return Math.round(Math.random() * (max - min + 1) + min);
}

/**
 * @template T
 * @param {T[]} array 
 * @returns {T}
 */
export function randomInArray(array) {
	return array[Math.floor(Math.random() * array.length)];
}

class Argument {
	/**
	 * @param {string} name
	 * @param {string} value
	 */
	constructor(name, value) {
		/**
		 * @type {string}
		 * @readonly
		 */
		this.name = name;
		/**
		 * @type {string}
		 * @readonly
		 */
		this.value = value;
	}

	toNumber() {
		return Number(this.value);
	}
}

/**
 * Maps the process arguments into the passed parameters.
 * @template {string[]} T
 * @param {T} names The argument names in order.
 * @returns {Record<T[number], Argument>}
 */
export const parseProcessArgs = (...names) => {
	/** @type {Record<T[number], Argument>} */
	const obj = Object.create({});

	for (const [index, value] of process.argv.slice(2).entries()) {
		const name = names.at(index);

		if (name) Reflect.set(obj, name, new Argument(name, value));
	}

	return obj;
};