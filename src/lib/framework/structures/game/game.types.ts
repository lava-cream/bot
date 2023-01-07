/**
 * The game entries. Contains game-to-never pairs.
 */
export interface Games {}

export declare namespace Games {
  /**
   * The game IDs.
   */
  type Keys = keyof Games;

  /**
   * Never values.
   */
  type Value = Games[Keys];
}