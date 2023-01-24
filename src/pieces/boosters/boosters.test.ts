import { Booster, BoosterOfferType, BoosterOfferUnit, BoosterTypeKind } from '#lib/framework';
import { minutes } from '#lib/utilities';

export default class TestBooster extends Booster {
	public constructor(context: Booster.Context) {
		super(context, {
			id: 'test',
			name: 'Test Booster',
			description: 'This is just a drill.',
			excludedGames: ['slotmachine'],
			types: [
				{
					kind: BoosterTypeKind.CoinMultiplier,
					value: 100
				}
			],
			offers: [
				{
					id: 'coins.quantity.1',
					cost: 80_000_000,
					unit: BoosterOfferUnit.Coins,
					type: BoosterOfferType.Quantity,
					value: 4
				},
				{
					id: 'energy.duration.1',
					cost: 3,
					unit: BoosterOfferUnit.Energy,
					type: BoosterOfferType.Duration,
					value: minutes(15)
				}
			]
		});
	}
}
