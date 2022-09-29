import type { Guild } from 'discord.js';

/**
 * The logger entries. Use module augmentation against this interface to add types.
 */
export interface Loggers extends Record<LoggerType, BaseLoggerPayload> {}

export declare namespace Loggers {
  /**
   * The {@link Loggers} keys.
   */
  type Keys = keyof Loggers;
  /**
   * The {@link Loggers} values.
   */
  type Values = Loggers[Keys];
}

/**
 * This interface must be extended by the payloads of the loggers.
 * It serves as the main context of the log method in order to do tasks with it.
 */
export interface BaseLoggerPayload {
  /**
   * The source guild.
   */
  readonly guild: Guild;
}

/**
 * The logger entry types.
 */
export const enum LoggerType {
  DonationUpdate = 'donationUpdate'
}
