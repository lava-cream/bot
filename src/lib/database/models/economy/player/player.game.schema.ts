import { prop, CreateSubSchemaManager, SubSchema, CreateNumberValueSchema } from '#lib/database/structures/schema.js';
import type { Games } from '#lib/framework';

/**
 * Represents the game's coin statistics.
 * @since 6.0.0
 */
export class PlayerGamesStatisticCoinsSchema extends CreateNumberValueSchema(0) {
  /**
   * The highest coins added to the this coin statistic.
   */
  @prop({ type: Number })
  public highest!: number;

  /**
   * The stat's constructor.
   */
  public constructor() {
    super();
    this.highest = 0;
  }

  /**
   * Increments the coin value by a certain value.
   * @param value The value to add.
   * @returns This schema.
   */
  public override addValue(value: number): this {
    Reflect.set(this, 'highest', Math.max(this.highest, value));
    return super.addValue(value);
  }
}

/**
 * Represents the streak information of a game statistic.
 * @since 6.0.0
 */
export class PlayerGamesStatisticStreakSchema extends CreateNumberValueSchema(0) {
  /**
   * The highest streak.
   */
  @prop({ type: Number })
  public highest!: number;
  
  /**
   * The stat's constructor.
   */
  public constructor() {
    super();
    this.highest = 0;
  }

  /**
   * The display streak.
   */
  public get display() {
    return this.isActive() ? this.value - 1 : 0;
  }

  /**
   * Checks whether this is on a streak.
   * @returns A boolean.
   */
  public isActive() {
    return this.value > 1;
  }

  /**
   * Increments the streak value by 1.
   * @returns This schema.
   */
  public override addValue(): this {
    Reflect.set(this, 'highest', Math.max(this.highest, this.value + 1));
    return super.addValue(1);
  }
}

/**
 * Represents the game's statistics.
 * @since 6.0.0
 */
export class PlayerGamesStatisticSchema extends CreateNumberValueSchema(0) {
  /**
   * The statistic value.
   */
  public declare value: number;

  /**
   * The coins information.
   */
  @prop({ type: () => PlayerGamesStatisticCoinsSchema, immutable: true })
  public readonly coins!: PlayerGamesStatisticCoinsSchema;

  /**
   * The streak information.
   */
  @prop({ type: () => PlayerGamesStatisticStreakSchema, immutable: true })
  public readonly streak!: PlayerGamesStatisticStreakSchema;

  /**
   * The stat's constructor. 
   */
  public constructor() {
    super();
    this.coins = new PlayerGamesStatisticCoinsSchema();
    this.streak = new PlayerGamesStatisticStreakSchema();
  } 
}

/**
 * Represents a game schema.
 * @since 6.0.0
 */
export class PlayerGamesSchema extends SubSchema {
  public declare readonly id: Games.Keys;

  /**
   * The coins won, win streak, and amount of coins won.
   */
  @prop({ type: () => PlayerGamesStatisticSchema, immutable: true })
  public readonly wins!: PlayerGamesStatisticSchema;

  /**
   * The coins lost, lose streak, and amount of coins lost.
   */
  @prop({ type: () => PlayerGamesStatisticSchema, immutable: true })
  public readonly loses!: PlayerGamesStatisticSchema;

  /**
   * The timestamp of when the player last played this game.
   */
  @prop({ type: Number })
  public lastPlayedTimestamp!: number;
  
  /**
   * The schema's constructor.
   * @param id The id of the game.
   */
  public constructor(id: string) {
    super(id);
    this.wins = new PlayerGamesStatisticSchema();
    this.loses = new PlayerGamesStatisticSchema();
    this.lastPlayedTimestamp = 0;
  }

  /**
   * The player's winning rate.
   */
  public get winRate() {
    return (this.wins.value / (this.wins.value + this.loses.value)) || 0;
  }

  /**
   * The player's losing rate.
   */
  public get loseRate() {
    return (this.loses.value / (this.loses.value + this.wins.value)) || 0;
  }

  /**
   * The player's profit from this game.
   */
  public get profit() {
    return this.wins.coins.value - this.loses.coins.value;
  }

  /**
   * Sets this game as the most recently-played game.
   * @param date The date to set.
   * @returns This schema.
   */
  public setLastPlayed(date: Date | number): this {
    this.lastPlayedTimestamp = date instanceof Date ? date.getTime() : date;
    return this;
  }

  /**
   * Updates the {@link PlayerGamesSchema#wins} stats.
   * @param coins The coins to add towards the coin stats.
   * @returns This schema.
   */
  public win(coins: number) {
    this.wins.addValue(1).coins.addValue(coins);
    this.wins.streak.addValue();
    this.loses.streak.resetValue();
    return this;
  }

  /**
   * Updates the {@link PlayerGamesSchema#loses} stats.
   * @param coins The coins to add towards the coin stats.
   * @returns This schema.
   */
  public lose(coins: number) {
    this.loses.addValue(1).coins.addValue(coins);
    this.loses.streak.addValue();
    this.wins.streak.resetValue();
    return this;
  }
}

/**
 * The manager of player's games.
 * @since 6.0.0
 */
export class PlayerGamesManagerSchema extends CreateSubSchemaManager(PlayerGamesSchema) {
  /**
   * The most recently-played game.
   */
  public get lastGamePlayed(): PlayerGamesSchema | null {
    return this.entries.sort((a, b) => b.lastPlayedTimestamp - a.lastPlayedTimestamp).at(0) ?? null;
  }

  /**
   * Sets the timestamp of a specific game, marking it as the most recently-played game.
   * @param id The id of the game.
   * @param date The timestamp to set.
   * @returns The game schema.
   */
  public setLastPlayed(id: string, date: Date | number) {
    return (this.resolve(id) ?? this.create(id)).setLastPlayed(date);
  }
}
