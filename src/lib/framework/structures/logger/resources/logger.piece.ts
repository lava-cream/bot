import type { Message, MessagePayload, TextChannel, Awaitable, ClientEvents as _ClientEvents, MessageOptions, Guild } from 'discord.js';
import type { Loggers } from './logger.entries';
import { Piece, Resolvers } from '@sapphire/framework';
import { isNullOrUndefined } from '@sapphire/utilities';
import { resolveElement } from '#lib/utilities';

/**
 * Represents a logger handler. A logger handler is an own instance of a guild that has it's own logger channel linked allowing us to:
 * * Fetch the logger channel as a {@link TextChannel text} channel.
 * * Post the message into the logger channel.
 */
export class LoggerHandler {
  /**
   * @param guild The guild where the log is belong to.
   * @param channelId The id of the logger channel.
   */
  protected constructor(public readonly guild: Guild, public readonly channelId: string) {}

  /**
   * Fetches the text channel logger from the guild.
   * @returns The text channel.
   */
  public async fetchChannel(): Promise<TextChannel | null> {
    const channel = await Resolvers.resolveGuildTextChannel(this.channelId, this.guild);
    return channel.isOk() ? channel.unwrap() : null;
  }

  /**
   * Posts the message in the logger channel.
   * @param content The message content.
   */
  public async postMessage(content: MessageOptions | MessagePayload): Promise<Message<true> | null> {
    const message = await (await this.fetchChannel())?.send(content);
    if (isNullOrUndefined(message) || !message.inGuild()) return null;

    return message;
  }

  /**
   * Creates a {@link LoggerHandler} instance.
   */
  public static create(guild: Guild, channelId: string) {
    return new LoggerHandler(guild, channelId);
  }
}

/**
 * Options to create a {@link Logger}.
 * @template K The logger entry.
 */
export interface LoggerOptions<K extends Loggers.Keys> extends Piece.Options {
  /**
   * The {@link T id} of the logger.
   */
  readonly id: K;
}

/**
 * The typed {@link Piece.JSON JSON} extension for a logger.
 * @template K The logger entry.
 */
export interface LoggerJSON<K extends Loggers.Keys> extends Piece.JSON {
  /**
   * The {@link T id} of the logger.
   */
  readonly id: K;
}

/**
 * Represents a logger.
 * @template K The logger entry.
 */
export abstract class Logger<K extends Loggers.Keys> extends Piece<LoggerOptions<K>> {
  /**
   * The {@link LoggerHandler handlers}.
   */
  public readonly handlers: LoggerHandler[] = [];
  public constructor(context: Piece.Context, options: LoggerOptions<K>) {
    super(context, options);
  }

  /**
   * The id of this logger.
   */
  public get id() {
    return this.options.id;
  }

  /**
   * Creates a {@link LoggerHandler}.
   * @param guildId The id of the guild.
   * @param guildId The id of the logger channel.
   */
  public createHandler(guildId: string, channelId: string): boolean {
    const guild = this.container.client.guilds.resolve(guildId);
    if (!guild) return false;

    this.handlers.push(this.resolveHandler(guild.id) ?? LoggerHandler.create(guild, channelId));
    return true;
  }

  /**
   * Resolves an existing handler.
   * @param guildId The id of the guild.
   */
  public resolveHandler(guildId: string): LoggerHandler | null {
    return resolveElement(this.handlers, (handler) => handler.guild.id === guildId);
  }

  /**
   * Renders the logger's message content.
   * @param options Options to log the message.
   */
  public abstract renderContent(options: Loggers[K]): Awaitable<MessageOptions | MessagePayload>;

  /**
   * Syncs the log channel for a specific guild.
   * @param guild The guild to sync for.
   */
  public abstract sync(guild: Guild): Awaitable<unknown>;

  /**
   * Creates a log message into the logger channel.
   * @param options Options to log the message.
   */
  public async log(options: Loggers[K]) {
    const handler = this.resolveHandler(options.guild.id);

    if (handler) {
      const content = await this.renderContent(options);
      await handler.postMessage(content);
    }

    return;
  }

  public override toJSON(): LoggerJSON<K> {
    return { id: this.id, ...super.toJSON() };
  }
}

export declare namespace Logger {
  type Options<K extends Loggers.Keys> = LoggerOptions<K>;
  type Context = Piece.Context;
  type JSON<K extends Loggers.Keys> = LoggerJSON<K>;
  type LocationJSON = Piece.LocationJSON;
}
