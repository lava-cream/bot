import type { Message, MessagePayload, TextChannel, Awaitable, ClientEvents as _ClientEvents, MessageCreateOptions, Guild } from 'discord.js';
import type { Loggers } from './logger.entries';
import { Piece, Resolvers, Result } from '@sapphire/framework';
import { isNullOrUndefined } from '@sapphire/utilities';
import { MessageContentBuilder, resolveElement } from '#lib/utilities';

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
	public constructor(public readonly guild: Guild, public readonly channelId: string) {}

	/**
	 * The text channel logger from the guild.
	 * @returns The text channel.
	 */
	public get channel(): TextChannel | null {
		const channel = Resolvers.resolveGuildTextChannel(this.channelId, this.guild);
		return channel.isOk() ? channel.unwrap() : null;
	}

	/**
	 * Posts the message in the logger channel.
	 * @param content The message content.
	 */
	public async post(content: MessageCreateOptions | MessagePayload): Promise<Message<true> | null> {
		if (isNullOrUndefined(this.channel)) return null;

		const resolvedMessage = await Result.fromAsync(this.channel.send(content));
		if (resolvedMessage.isErr()) return null;

		const message = resolvedMessage.unwrap();
		return message.inGuild() ? message : null;
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
	/**
	 * The id of this logger.
	 */
	public readonly id: K;
	public constructor(context: Piece.Context, options: LoggerOptions<K>) {
		super(context, options);
		this.id = options.id;
	}

	/**
	 * Creates a {@link LoggerHandler}.
	 * @param guildId The id of the guild.
	 * @param guildId The id of the logger channel.
	 */
	protected createHandler(guildId: string, channelId: string): boolean {
		const guild = this.container.client.guilds.resolve(guildId);

		if (!isNullOrUndefined(guild)) {
			const handler = this.resolveHandler(guild.id) ?? new LoggerHandler(guild, channelId);
			this.handlers.push(handler);
		}

		return !isNullOrUndefined(guild);
	}

	/**
	 * Resolves an existing handler.
	 * @param guildId The id of the guild.
	 */
	protected resolveHandler(guildId: string): LoggerHandler | null {
		return resolveElement(this.handlers, (handler) => handler.guild.id === guildId);
	}

	/**
	 * Renders the logger's message content.
	 * @param options Options to log the message.
	 */
	public abstract buildMessageContent(options: Loggers[K], builder: MessageContentBuilder): Awaitable<void>;

	/**
	 * Syncs the log channel for a specific guild.
	 * @param guild The guild to sync for.
	 */
	public abstract syncLogChannel(guild: Guild): Awaitable<unknown>;

	/**
	 * Creates a log message into the logger channel.
	 * @param options Options to log the message.
	 */
	public async createLog(options: Loggers[K]) {
		const handler = this.resolveHandler(options.guild.id);

		if (handler) {
			const contentBuilder = new MessageContentBuilder();
			await this.buildMessageContent(options, contentBuilder);
			await handler.post(contentBuilder);
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
	type JSON<K extends Loggers.Keys> = LoggerJSON<K> & { id: K };
	type LocationJSON = Piece.LocationJSON;
}
