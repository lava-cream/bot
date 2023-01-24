import {
	CommandInteraction,
	CacheType,
	GuildMember,
	AttachmentBuilder,
	Message,
	User,
	Guild,
	UserResolvable,
	GuildResolvable,
	ApplicationCommandOptionType,
	MessageActionRowComponent,
	ActionRow,
	createComponentBuilder,
	MessageActionRowComponentBuilder
} from 'discord.js';
import { isNullOrUndefined } from '@sapphire/utilities';
import { Args, Result, SapphireClient } from '@sapphire/framework';
import { minutes, regexHasGroup, StrictSnowflake } from '#lib/utilities/common/index.js';
import { SnowflakeRegex } from '@sapphire/discord-utilities';
import { fetch, FetchResultTypes } from '@sapphire/fetch';
import { DiscordSnowflake } from '@sapphire/snowflake';
import { Colors } from 'discord.js';
import { ActionRowBuilder } from '../builders';

export function disableMessageComponents<T extends MessageActionRowComponent>(rows: ActionRow<T>[]) {
	return rows.map((row) => {
		const disabledComponents: MessageActionRowComponentBuilder[] = row.components.map((c) => createComponentBuilder(c.data).setDisabled(true));
		return new ActionRowBuilder<MessageActionRowComponentBuilder>(row).setComponents(disabledComponents);
	});
}

/**
 * Asserts the working client as ready.
 * @param client The discord client to check for.
 * @since 6.0.0
 */
export function checkClientReadyStatus<T extends SapphireClient>(client: T): asserts client is typeof client & SapphireClient<true> {
	if (!client.isReady()) {
		throw new Error('The active client is not ready.');
	}
}

/**
 * Create a unique message component custom identifier.
 * @since 6.0.0
 */
export class CustomId {
	/**
	 * The discord snowflake to use for the custom ID.
	 */
	public snowflake: bigint;

	/**
	 * The utility's constructor.
	 * @param date The date. This is the basis of the snowflake.
	 */
	public constructor(public date = new Date()) {
		this.snowflake = DiscordSnowflake.generate({ timestamp: this.date.getTime() });
	}

	/**
	 * Sets the new date context.
	 * @param date The new date object to set.
	 * @returns This util.
	 */
	public setDate(date: Date): this {
		this.date = date;
		this.snowflake = DiscordSnowflake.generate({ timestamp: date.getTime() });
		return this;
	}

	/**
	 * Creates an ID with a snowflake assigned in it.
	 * @param id The id to create.
	 * @returns A {@link CustomIdentifier} string.
	 */
	public create<Id extends string>(id: Id): CustomIdentifier<Id> {
		return `${this.snowflake}:${id}`;
	}
}

/**
 * Checks if the command interaction's token has already expired.
 * @template Cached The command interaction's cache type.
 * @param command The command interaction to check for.
 * @since 6.0.0
 */
export function isCommandInteractionExpired<Cached extends CacheType>(command: CommandInteraction<Cached>): boolean {
	return Date.now() - command.createdTimestamp >= minutes(15);
}

/**
 * Checks if an option from a command interaction exists.
 * @template Cached The command interaction's cached type.
 * @param command The source command interaction.
 * @param name The option's name to check.
 * @param type The option's type to check for.
 * @since 6.0.0
 */
export function commandHasOption<Cached extends CacheType>(
	command: CommandInteraction<Cached>,
	name: string,
	type: ApplicationCommandOptionType
): boolean {
	return command.options.data.some((opt) => opt.name === name && opt.type === type);
}

/**
 * A unique customId for a message component.
 * @since 6.0.0
 */
export type CustomIdentifier<Id extends string> = `${bigint}:${Id}`;

/**
 * Creates an attachment based from the attachment or url of the attachment provided.
 * @param attachmentOrUrl The url of the file to attach or a {@link AttachmentBuilder} instance.
 * @param fileName The name of the file attachment.
 * @since 5.2.5
 */
export async function fromAttachment(url: string, fileName?: string): Promise<AttachmentBuilder> {
	const download = await fetch(url, FetchResultTypes.Buffer);
	return new AttachmentBuilder(download, { name: fileName });
}

/**
 * Resolves the guild's id from a {@link GuildResolvable}.
 * @param resolvable A {@link GuildResolvable} value.
 * @returns The guild's id.
 * @since 5.2.0
 */
export function fromGuildResolvable(resolvable: GuildResolvable): string {
	if (typeof resolvable === 'string') return resolvable;
	if (resolvable instanceof Guild) return resolvable.id;
	if (isNullOrUndefined(resolvable.guild)) throw new Error();
	return resolvable.guild.id;
}

/**
 * Resolves the user's id from a {@link UserResolvable}.
 * @param resolvable A {@link UserResolvable} value.
 * @returns The user's id.
 * @since 5.2.0
 */
export function fromUserResolvable(resolvable: UserResolvable): string {
	if (typeof resolvable === 'string') return resolvable;
	if (resolvable instanceof Message) return resolvable.author.id;
	return resolvable.id;
}

/**
 * Checks if the value has a discord snowflake `id` property.
 * @param value The object to check for.
 * @returns A boolean.
 * @since 5.2.0
 */
export function hasSnowflakeIdentifier<T extends { id: string }>(value: T): value is T & { id: StrictSnowflake } {
	const snowflakeTest = SnowflakeRegex.exec(value.id);
	return !isNullOrUndefined(snowflakeTest) && regexHasGroup(snowflakeTest, 'id');
}

/**
 * Retrieves the author of the referenced message, or the user from a sapphire argument.
 * @param message The message to get the referenced user from.
 * @param args A sapphire argument instance.
 * @returns The user. Falls back to the message author.
 * @version 4.7.2
 * @since 4.3.0
 */
export async function getReferencedUser(message: Message, args: Args): Promise<User> {
	const refMessage = await getReferenceMessage(message);
	if (refMessage.isErr()) return message.author;

	const user = await args.pickResult('user');
	return user.isOk() ? user.unwrap() : refMessage.unwrap().author;
}

/**
 * Retrieves the icon of a guild.
 * @param guild The source guild.
 * @param args The extra parameters.
 * @returns The guild icon or `null` if none.
 */
export function getGuildIconURL(guild: Guild, ...args: Parameters<Guild['iconURL']>): string | null {
	return guild.iconURL(...args) ?? null;
}

/**
 * Retrieves the user's highest role color.
 * @param member The source member.
 * @returns A hex color string.
 */
export function getHighestRoleColor(member: GuildMember) {
	const sorted = member.roles.cache.filter((r) => r.color !== 0).sort((a, b) => b.position - a.position);
	return sorted.last()?.color ?? Colors.NotQuiteBlack;
}

/**
 * Retrieves the referenced message of a message. AKA The replied message.
 * @param message The message to get the reference from.
 * @returns A message object or `null` if not found.
 * @version 4.7.2
 * @since 4.2.0
 */
export function getReferenceMessage(message: Message): Promise<Result<Message, null>> {
	return Result.fromAsync(async () => {
		try {
			return await message.fetchReference();
		} catch {
			throw null;
		}
	});
}

/**
 * Retrieves the user's avatar URL.
 * @param user The source user.
 * @param args The extra params.
 * @returns The user's avatar URL.
 */
export function getUserAvatarURL(user: User, ...args: Parameters<User['avatarURL']>): string {
	return user.avatarURL(...args) ?? user.defaultAvatarURL;
}
