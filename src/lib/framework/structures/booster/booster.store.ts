import { Booster } from "./booster.piece.js";
import { Store } from "@sapphire/framework";

export class BoosterStore extends Store<Booster> {
  public constructor() {
    super(Booster, { name: 'boosters' });
  }

  public override get(key: string) {
    return super.find(booster => booster.id === key);
  }
}

declare module '@sapphire/pieces' {
  interface StoreRegistryEntries {
    boosters: BoosterStore;
  }
}
