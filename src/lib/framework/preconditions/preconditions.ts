/**
 * Our custom precondition's names. Names are in `PascalCase`.
 * @since 5.2.0
 */
export const enum PreconditionNames {
  /**
   * User Account Age
   * -----
   * This precondition prevents a user from running any commands if their account's created timestamp is less than the configured minimum acocunt age.
   */
  UserAccountAge = 'UserAccountAge',
  /**
   * Guild Block Status
   * -----
   * This precondition prevents any user from running any commands inside a guild who's blocked from using the bot.
   */
  GuildBlockStatus = 'GuildBlockStatus',
  /**
   * User Owner Only
   * -----
   * This precondition exclusivates a command for the bot application's owner only.
   */
  UserOwnerOnly = 'UserOwnerOnly',
  /**
   * User Staff Permissions
   * -----
   * This precondition prevents a user from running staff-only commands. Staff-only commands are configured on a guild basis and should be managed by people with `Administrator` permissions.
   */
  UserStaffPermissions = 'UserStaffPermissions',
  /**
   * User Block Status
   * -----
   * This precondition prevents a user from running commands because they were blocked by the bot owner.
   */
  UserBlockStatus = 'UserBlockStatus'
}
