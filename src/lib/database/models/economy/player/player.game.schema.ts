import { prop, CreateSubSchemaManager, SubSchema, CreateNumberValueSchema } from '#lib/database/structures/schema.js';
import type { Games } from '#lib/framework';

export class PlayerGamesStatisticCoinsSchema extends CreateNumberValueSchema(0) {}

export class PlayerGamesStatisticSchema extends CreateNumberValueSchema(0) {
  /**
   * The statistic.
   */
  public declare value: number;

  /**
   * The coins.
   */
  @prop({ type: () => PlayerGamesStatisticCoinsSchema, immutable: true })
  public readonly coins!: PlayerGamesStatisticCoinsSchema;

  @prop({ type: Number })
  public streak!: number;

  public constructor() {
    super();
    this.coins = new PlayerGamesStatisticCoinsSchema();
    this.streak = 0;
  } 

  public get displayStreak(): number {
    return this.onStreak() ? this.streak - 1 : 0;
  }

  public onStreak(): boolean {
    return this.streak > 1;
  }

  public addStreak(value = 1): this {
    this.streak += value;
    return this;
  }

  public resetStreak(): this {
    this.streak = 0;
    return this;
  }
}

export class PlayerGamesSchema extends SubSchema {
  public declare readonly id: Games.Keys;

  @prop({ type: () => PlayerGamesStatisticSchema, immutable: true })
  public readonly wins!: PlayerGamesStatisticSchema;

  @prop({ type: () => PlayerGamesStatisticSchema, immutable: true })
  public readonly loses!: PlayerGamesStatisticSchema;

  @prop({ type: () => PlayerGamesStatisticSchema, immutable: true })
  public readonly ties!: PlayerGamesStatisticSchema;

  @prop({ type: Number })
  public lastPlayedTimestamp!: number;

  public constructor(id: string) {
    super(id);
    this.wins = new PlayerGamesStatisticSchema();
    this.loses = new PlayerGamesStatisticSchema();
    this.ties = new PlayerGamesStatisticSchema();
    this.lastPlayedTimestamp = 0;
  }

  public setLastPlayed(date: Date | number): this {
    this.lastPlayedTimestamp = date instanceof Date ? date.getTime() : date;
    return this;
  }
}

export class PlayerGamesManagerSchema extends CreateSubSchemaManager(PlayerGamesSchema) {
  public get lastGamePlayed(): PlayerGamesSchema | null {
    return this.entries.sort((a, b) => b.lastPlayedTimestamp - a.lastPlayedTimestamp).at(0) ?? null;
  }

  public setLastPlayed(id: string, date: Date | number) {
    return (this.resolve(id) ?? this.create(id)).setLastPlayed(date);
  }
}
