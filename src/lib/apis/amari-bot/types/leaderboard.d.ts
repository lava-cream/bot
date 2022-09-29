/**
 * Represents an AmariBot guild leaderboard.
 * @version 1.0.0
 */
export interface APILeaderboard {
  /**
   * The amount of members from this page of the leaderboard.
   */
  readonly count: number;
  /**
   * The total amount of members who has an entry in this leaderboard.
   */
  readonly total_count: number;
  /**
   * The members who are in this page of the leaderboard.
   */
  readonly data: APILeaderboardEntry[];
}

/**
 * Represents a {@link APILeaderboard#data} entry.
 */
export interface APILeaderboardEntry {
  /**
   * The member's user id.
   */
  readonly id: string;
  /**
   * The member's username.
   */
  readonly username: string;
  /**
   * The member's level experience points.
   */
  readonly exp: number;
  /**
   * The member's level.
   */
  readonly level: number;
}

/**
 * Represents an AmariBot weekly leaderboard.
 * @version 1.0.0
 */
export interface APIWeeklyLeaderboard extends Omit<APILeaderboard, 'data'> {
  /**
   * The members who are in this page of the weekly leaderboard.
   */
  readonly data: APIWeeklyLeaderboardEntry[];
}

/**
 * Represents a {@link APIWeeklyLeaderboard#data} entry.
 */
export type APIWeeklyLeaderboardEntry = Omit<APILeaderboardEntry, 'level'>;
