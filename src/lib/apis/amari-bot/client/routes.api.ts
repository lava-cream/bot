import type { If } from '#lib/utilities/common/common.types';

/**
 * AmariBot API V1 routes.
 */
export class Routes {
  /**
   * Retrieves the leaderboard of a guild.
   * @param guildId The guild id.
   * @param weekly Whether the leaderboard is the weekly one.
   * @param raw Whether the leaderboard is raw or not.
   * @returns The guild leaderboard endpoint.
   */
  public static guildLeaderboard<G extends string, W extends boolean, R extends boolean>(
    guildId: G,
    weekly: W,
    raw: R
  ): If<R, `/guild/raw/${If<W, 'weekly', 'leaderboard'>}/${G}`, `/guild/${If<W, 'weekly', 'leaderboard'>}/${G}`>;
  public static guildLeaderboard(guildId: string, weekly: boolean, raw: string): string {
    return `/guild/${raw ? 'raw/' : ''}${weekly ? 'weekly' : 'leaderboard'}/${guildId}`;
  }

  /**
   * Retrieves a user data from a guild.
   * @param guildId The guild id.
   * @param userId The user id.
   * @returns The guild member endpoint.
   */
  public static guildMember(guildId: string, userId: string) {
    return `/guild/${guildId}/member/${userId}` as const;
  }

  /**
   * Retrieves the level rewards of a guild.
   * @param guildId The guild id.
   * @returns The guild rewards endpoint.
   */
  public static guildRewards(guildId: string) {
    return `/guild/rewards/${guildId}` as const;
  }
}
