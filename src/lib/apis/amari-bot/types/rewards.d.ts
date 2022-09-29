/**
 * Represents the AmariBot guild rewards.
 * @version 1.0.0
 */
export interface APIRewards {
  /**
   * The total amount of role reward entries.
   */
  readonly count: number;
  /**
   * The role reward entries.
   */
  readonly data: APIRewardsEntry[];
}

/**
 * Represents a {@link APIRewards#data} entry.
 */
export interface APIRewardsEntry {
  /**
   * The id of the role reward.
   */
  readonly roleID: string;
  /**
   * The level to reach to obtain this role.
   */
  readonly level: number;
}
