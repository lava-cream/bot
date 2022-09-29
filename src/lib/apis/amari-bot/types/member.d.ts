/**
 * Represents an AmariBot guild member.
 * @version 1.0.0
 */
export interface APIMember {
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
   * The member's current level.
   */
  readonly level: number;
  /**
   * The member's  weekly experience points.
   */
  readonly weeklyExp?: number;
}
