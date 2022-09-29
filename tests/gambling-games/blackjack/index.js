import { parseProcessArgs, randomNumber, roundZero } from '../../utilities.js';
import { Constants, Blackjack, Outcome, Outcomes } from './logic.js';

const args = parseProcessArgs('coins', 'bet', 'multi', 'base', 'games', 'repeat');
const bet = args.bet.toNumber();
const multi = args.multi.toNumber();
const base = args.base.toNumber();
let repeat = args.repeat.toNumber();
let games = args.games.toNumber();
let coins = args.coins.toNumber();

const stats = {
	wins: 0,
	loses: 0,
	ties: 0
};

function calculateWinnings() {
	const raw = Math.round(bet * (Math.random() + base));
	const winnings = Math.round(raw + (raw * (multi / 100)));

	return roundZero(winnings);
}

/**
 * @param {boolean} once
 * @param {number} bet
 */
const play = (once = true, bet) => {
	const game = new Blackjack('JustBrian', 'Dank Memer');

	for (let i = 0; i < 2; i++) {
    game.deal(game.player, true);
    game.deal(game.dealer, true);
  }

  const update = () => {
  	game.getOutcome();

  	switch(game.outcome?.outcome) {
  		case Outcome.WIN: {
  			const winnings = calculateWinnings();
  			coins += winnings;
  			stats.wins++;
  			game.outcome.extra = `You won ⏣ ${winnings.toLocaleString()}. You now have ⏣ ${coins.toLocaleString()}.`;
  			break;
  		};

  		case Outcome.LOSS: {
  			coins -= bet;
  			stats.loses++;
        game.outcome.extra = `You lost ⏣ ${bet.toLocaleString()}. You now have ⏣ ${coins.toLocaleString()}.`;
        break;
      }

      case Outcome.TIE: {
      	stats.ties++;
        game.outcome.extra = `Your wallet hasn't changed! You have ⏣ ${coins.toLocaleString()} still.`;
        break;
      }

  		case Outcome.OTHER: {
        game.outcome.extra = 'The dealer is keeping your money to deal with your bullcrap.';
        break;
      }
  	}
  };

  const hit = () => {
  	game.deal(game.player, false);
  	update();
  };

  const stand = () => {
  	game.stand();
  	while (game.countHand(game.dealer.hand) < Constants.BJ_DEALER_MAX) {
      game.deal(game.dealer, false);
    }

    update();
  };

  const run = () => {
  	const firstDealerCard = game.dealer.hand.at(0);
  	const firstDealerCardValue = typeof firstDealerCard.face === 'string' ? 10 : firstDealerCard.face;
  	const getPlayerCardTotal = () => game.countHandRaw(game.player.hand);

  	const isPlayer12AndDealerHas2or3 = () => getPlayerCardTotal() === 12 && [2, 3].includes(firstDealerCardValue);
  	const isPlayer12to16AndDealerIsLess6 = () => [12, 13, 14, 15, 16].includes(getPlayerCardTotal()) && firstDealerCardValue <= 6;

  	while(!game.outcome && (isPlayer12AndDealerHas2or3() || (![2, 3].includes(firstDealerCardValue) && isPlayer12to16AndDealerIsLess6()))) {
  		switch(true) {
  			case isPlayer12AndDealerHas2or3(): {
	  			hit();
	  			break;
	  		};

				case isPlayer12to16AndDealerIsLess6(): {
					stand();
					break;
				};
  		}
  	}

  	const isSoft17OrLess = () => getPlayerCardTotal() <= 17 && game.player.hand.filter(card => card.face === 'A' && card.baseValue === Constants.BJ_ACE_MIN).length >= 1;
  	while(!game.outcome && isSoft17OrLess()) {
  		hit();
  	}

  	const isHard7Above = () => [7, 8, 9].includes(game.player.hand.filter(card => card.face !== 'A').reduce((n, card) => card.baseValue + n, 0)) && game.player.hand.filter(card => card.face === 'A' && card.baseValue === Constants.BJ_ACE_MAX).length === 1;
  	const isHard7AboveButDealerIs9Above = () => isHard7Above() && [9, 10, Constants.BJ_ACE_MAX].includes(firstDealerCardValue)

  	while(!game.outcome && (isHard7AboveButDealerIs9Above() || isHard7Above())) {
  		switch(true) {
  			case isHard7AboveButDealerIs9Above(): {
  				hit();
  				break;
  			};

  			case isHard7Above(): {
  				stand();
  				break;
  			};
  		}
  	}

  	while(!game.outcome && getPlayerCardTotal() < Constants.BJ_DEALER_MAX) {
  		hit();
  	}

  	if (!game.outcome) stand();
  };

  run();

  if (once) {
  	console.log({ 
	  	stats: stats,
	  	game: { 
	  		...game, 
	  		playerSum: game.countHandRaw(game.player.hand),
	  		dealerSum: game.countHandRaw(game.dealer.hand),
	  		player: game.player.hand.map(card => card.face),
	  		dealer: game.dealer.hand.map(card => card.face),
	  	} 
	  });
  }
};

while(games > 0) {
	play(false, Math.min(bet, coins));
	games--;

	if (coins <= 0) {
		break;
	}
}

console.log({ ...stats, coins: coins.toLocaleString(), games: Object.values(stats).reduce((p, c) => p + c) });
