import { Piece } from "@sapphire/framework";
import type { Games } from "../game";
import type { BoosterOptions, BoosterShopOffer, BoosterType } from "./booster.options.js";

/**
 * Represents a game boooster
 * @since 6.1.0
 */
export abstract class Booster extends Piece<BoosterOptions> implements BoosterOptions {
  public readonly id: string;
  public readonly description: string;
  public readonly shopOffers: BoosterShopOffer[];
  public readonly types: BoosterType[];
  public readonly excludedGames: Games.Keys[];
  public constructor(context: Piece.Context, options: BoosterOptions) {
    super(context, options);
    this.id = options.id;
    this.description = options.description;
    this.shopOffers = options.shopOffers;
    this.types = options.types;
    this.excludedGames = options.excludedGames ?? [];
  }

  public hasType(type: BoosterType): boolean {
    return this.types.includes(type);
  }
}

export declare namespace Booster {
  type Options = BoosterOptions;
  type Context = Piece.Context;
  type JSON = Piece.JSON;
  type LocationJSON = Piece.LocationJSON;
}