/**
 * Represents an enum of resolver error identifiers.
 * @version 5.2.0
 * @since 5.0.0
 */
export const enum ResolverErrors {
  /**
   * The parameter did not resolve into a command.
   */
  InvalidCommand = 'invalidCommand',
  /**
   * The parameter did not resolve into a percentage.
   */
  InvalidPercentage = 'invalidPercentage',
  /**
   * The parameter did not resolve into a readable number.
   */
  InvalidReadableNumber = 'invalidReadableNumber'
}
