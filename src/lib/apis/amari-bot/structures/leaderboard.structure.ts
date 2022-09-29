import type { APILeaderboard, APILeaderboardEntry, APIWeeklyLeaderboard, APIWeeklyLeaderboardEntry } from '../types/leaderboard.js';
import { Base } from './structure.js';

export const enum LeaderboardTypes {
  Levels = 1,
  Weekly = 2
}

export type GetLeaderboardType<T extends LeaderboardTypes> = T extends LeaderboardTypes.Levels ? APILeaderboard : APIWeeklyLeaderboard;

export type GetLeaderboardEntryType<T extends APILeaderboard | APIWeeklyLeaderboard> = T extends APILeaderboard
  ? APILeaderboardEntry
  : APIWeeklyLeaderboardEntry;

export class Leaderboard<
  Type extends APILeaderboard | APIWeeklyLeaderboard = APILeaderboard,
  EntryType extends GetLeaderboardEntryType<Type> = APILeaderboardEntry
> extends Base<Type> {
  public count: number;
  public totalCount: number;
  public entries: LeaderboardEntry<EntryType>[];

  public constructor(data: Type, public type: Type extends APILeaderboard ? LeaderboardTypes.Levels : LeaderboardTypes.Weekly) {
    super(data);
    this.count = data.count;
    this.totalCount = data.total_count;
    this.entries = data.data.map((entry) => {
      return this.isLevels()
        ? new LeaderboardEntry<APILeaderboardEntry>(entry as APILeaderboardEntry, LeaderboardTypes.Levels)
        : new LeaderboardEntry<APIWeeklyLeaderboardEntry>(entry as APIWeeklyLeaderboardEntry, LeaderboardTypes.Weekly);
    }) as LeaderboardEntry<EntryType>[];
  }

  public isLevels(): this is LevelsLeaderboard {
    return this.type === LeaderboardTypes.Levels;
  }

  public isWeekly(): this is WeeklyLeaderboard {
    return this.type === LeaderboardTypes.Weekly;
  }
}

export class LevelsLeaderboard extends Leaderboard<APILeaderboard, APILeaderboardEntry> {
  public declare type: LeaderboardTypes.Levels;
  public declare entries: LeaderboardEntry<APILeaderboardEntry>[];
}

export class WeeklyLeaderboard extends Leaderboard<APIWeeklyLeaderboard, APIWeeklyLeaderboardEntry> {
  public declare type: LeaderboardTypes.Weekly;
  public declare entries: LeaderboardEntry<APIWeeklyLeaderboardEntry>[];
}

export class LeaderboardEntry<T extends APILeaderboardEntry | APIWeeklyLeaderboardEntry> extends Base<T> {
  public id: string;
  public username: string;
  public xp: number;
  public level: number | null;

  public constructor(data: T, public type: T extends APILeaderboardEntry ? LeaderboardTypes.Levels : LeaderboardTypes.Weekly) {
    super(data);
    this.id = data.id;
    this.username = data.username;
    this.xp = data.exp;
    this.level = type === LeaderboardTypes.Levels ? (data as APILeaderboardEntry).level : null;
  }

  public isLevels(): this is LevelsLeaderboardEntry {
    return this.type === LeaderboardTypes.Levels;
  }

  public isWeekly(): this is WeeklyLeaderboardEntry {
    return this.type === LeaderboardTypes.Weekly;
  }
}

export class LevelsLeaderboardEntry extends LeaderboardEntry<APILeaderboardEntry> {
  public declare level: number;
}

export class WeeklyLeaderboardEntry extends LeaderboardEntry<APIWeeklyLeaderboardEntry> {
  public declare level: null;
}
