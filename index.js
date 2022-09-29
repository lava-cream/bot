// max | min | half | 30% | 250k | 250,000 | 250_000 | 30m
const Config = {
	coins: 10_000_000,
	maxBet: 250_000,
	get minBet() {
		return Math.round(this.maxBet / 1_000);
	}
};


/**
 * @param {number} x
 * @returns {x is number}
 */
const isNumber = (x) => typeof x === 'number' && x !== NaN;


/**
 * @typedef {Object} Readable
 * @prop {number} value
 * @prop {RegExp} regex
 */

/**
 * @param {string | number} parameter
 * @returns {number | null}
 */
const parseReadable = (parameter) => {
	if (isNumber(parameter)) return parameter;

	/** @type {Readable[]} */
	const readables = [
		{ regex: /k$/gi, value: 1e3 },
		{ regex: /m$/gi, value: 1e6 },
		{ regex: /b$/gi, value: 1e9 },
		{ regex: /t$/gi, value: 1e12 },
	];

	for (const { regex, value } of readables) {
    if (parameter.match(regex)) {
      const given = Number(parameter.replace(regex, ''));
      if (!Number.isInteger(given * value) || isNaN(given * value)) continue;
      return Math.round(given * value);
    }
  }

  return null;
};
	
/**
 * @param {string} parameter
 * @param {number} number
 * @returns {number | null}
 */
const parsePercent = (parameter, number) => {
	const PercentRegex = /%$/gi;

	return PercentRegex.exec(parameter) 
		? (number * (parameter.replace(PercentRegex, '') / 100)) 
		: null;
}

/**
 * @param {string} parameter
 * @returns {number | null}
 */
const parseComma = (parameter) => {
	const commas = [/,/gi, /_/gi];

	for (const comma of commas.values()) {
		if (parameter.match(comma)) {
			const replaced = Number(parameter.replace(comma, ''));
			if (!isNumber(replaced)) continue;
			return replaced;
		}
	}

	return null;
}

/**
 * @typedef {Object} ParseAmountOptions
 * @prop {number} minimum
 * @prop {number} maximum
 * @prop {number} coins
 */

/**
 * @param {string | number} parameter 
 * @param {ParseAmountOptions} options
 * @returns {number | null}
 */
const parse = (parameter, options) => {
	if (isNumber(parameter)) return parameter;

	if (typeof parameter === 'string') {
    switch(parameter.toLowerCase()) {
      case 'max': {
        return Math.min(options.maximum, options.amount);
      };

      case 'min': {
        return Math.min(options.minimum, options.amount);
      };

      case 'half': {
        return Math.round(options.amount / 2);
      };

      case 'full': {
        return options.amount;
      }
    }

    const readable = parseReadable(parameter);
    const percentage = parsePercent(parameter, options.maximum);
    const comma = parseComma(parameter);

    const results = [readable, percentage, comma].filter(isNumber);

    return results.at(0) ?? null;
  }

  return null;
};

console.log(parse('k5', { coins: Config.coins, maximum: Config.maxBet, minimum: Config.minBet }));