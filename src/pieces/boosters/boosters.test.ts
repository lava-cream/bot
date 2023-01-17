import { Booster, BoosterShopOfferType, BoosterShopOfferUnit, BoosterType } from "#lib/framework";
import { minutes } from "#lib/utilities";

export default class TestBooster extends Booster {
  public constructor(context: Booster.Context) {
    super(context, {
      id: 'test',
      name: 'Test Booster',
      description: 'This is just a drill.',
      types: [BoosterType.CoinMultiplier],
      excludedGames: ['slotmachine'],
      shopOffers: [
        {
          id: 'coins.quantity.1',
          cost: 80_000_000,
          unit: BoosterShopOfferUnit.Coins,
          type: BoosterShopOfferType.Quantity,
          value: 4
        },
        {
          id: 'coins.duration.1',
          cost: 3,
          unit: BoosterShopOfferUnit.Energy,
          type: BoosterShopOfferType.Duration,
          value: minutes(15)
        }
      ]
    });
  }
}