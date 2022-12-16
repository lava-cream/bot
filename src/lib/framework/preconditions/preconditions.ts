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
   * Guild Status
   * -------------
   * This precondition controls whether the guild can or cannot use the bot.
   */
  GuildStatus = 'GuildStatus',
  /**
   * User Owner Only
   * -----
   * This precondition exclusivates a command for the bot application's owner only.
   */
  UserOwnerOnly = 'UserOwnerOnly',
  /**
   * User Staff Permissions
   * -----
   * This precondition allows or disallows a user from running bot staff-only commands.
   */
  UserStaffPermissions = 'UserStaffPermissions',
  /**
   * User Status
   * -----
   * This precondition controls whether the user can or cannot use the bot.
   */
  UserStatus = 'UserStatus'
}
