import { Booster } from "./booster.piece.js";
import { Store } from "@sapphire/framework";

export class BoosterStore extends Store<Booster> {
  public constructor() {
    super(Booster, { name: 'boosters' });
  }
}