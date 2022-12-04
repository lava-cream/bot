import type { OmitFunctions } from '#lib/utilities/common/index.js';
import { prop, CreateSubSchemaManager, SubSchema } from '#lib/database/structures/schema.js';
import { PartyKeys } from '#lib/utilities';

export class PartyMemberSchema extends SubSchema {
  @prop({ type: Number })
  public coins!: number;

  @prop({ type: Number })
  public multiplier!: number;

  public constructor(options: OmitFunctions<PartyMemberSchema>) {
    super(options.id);
    this.coins = options.coins;
    this.multiplier = options.multiplier;
  }

  /**
   * The party member's calculated amount of keys to collect.
   */
  public get keys() {
    return Math.round(this.coins / PartyKeys.CoinsRatio);
  }

  /**
   * Sets the new value of the party member's coins.
   * @param coins The coins to set.
   * @returns This schema.
   */
  public setCoins(coins: number): this {
    this.coins = coins;
    return this;
  }

  /**
   * Adds a specific amount of coins towards the member's coins.
   * @param coins The coins to add.
   * @returns This schema.
   */
  public addCoins(coins: number): this {
    return this.setCoins(this.coins + coins);
  }

  /**
   * Subtracts a specific amount of coins to the member's coins.
   * @param coins The coins to subtract.
   * @returns This chema. 
   */
  public subCoins(coins: number): this {
    return this.setCoins(this.coins - coins);
  }

  /**
   * Converts and sets the specified amount of coins to keys.  
   * @param coins The amount of coins to convert.
   * @returns The calculated keys amount.
   */
  public convertCoinsToKeys(coins: number): number {
    const keys = Math.round(coins / PartyKeys.CoinsRatio);
    this.setCoins(this.coins - coins);
    return keys;
  }

  /**
   * Sets the new value of the party member's multiplier.
   * @param multiplier The multiplier to set.
   * @returns This schema.
   */
  public setMultiplier(multiplier: number): this {
    this.multiplier = multiplier;
    return this;
  }

  /**
   * Converts and sets the specified keys amount to multipliers. 
   * @param keys The amount of keys to convert.
   * @returns The gained multipliers.
   */
  public convertKeysToMultiplier(keys: number): number {
    const multiplier = Math.round(keys / PartyKeys.MultiplierRatio);
    this.setMultiplier(this.multiplier + multiplier);
    return multiplier;
  }
}

export class PartyMemberManagerSchema extends CreateSubSchemaManager(PartyMemberSchema) {}

