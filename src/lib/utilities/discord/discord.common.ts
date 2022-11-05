import {
  CommandInteraction,
  Interaction,
  CacheType,
  GuildMember,
  MessageAttachment,
  Message,
  User,
  Util,
  Constants,
  Guild,
  MessageActionRow,
  UserResolvable,
  GuildResolvable,
  ApplicationCommandOptionType
} from 'discord.js';
import { isNullOrUndefined } from '@sapphire/utilities';
import type { APIInteraction, APIMessage } from 'discord.js/node_modules/discord-api-types/v9.js';
import { Args, Result } from '@sapphire/framework';
import { minutes, regexHasGroup, StrictSnowflake } from '#lib/utilities/common/index.js';
import { SnowflakeRegex } from '@sapphire/discord-utilities';
import { fetch, FetchResultTypes } from '@sapphire/fetch';
import { DiscordSnowflake } from '@sapphire/snowflake';

/**
 * Represents the util for creating custom message component IDs. 
 * @since 6.0.0
 */
export class ComponentId {
  /**
   * The util's constructor.
   * @param date The date to base on.
   */
  public constructor(public date = new Date()) {}

  /**
   * Sets the new date context.
   * @param date The new date object to set.
   * @returns This util.
   */
  public setDate(date: Date): this {
    this.date = date;
    return this;
  }

  /**
   * Creates an ID with a snowflake assigned in it.
   * @param id The id to create.
   * @returns A {@link CustomId} object.
   */
  public create<Id extends string>(id: Id): CustomId<Id> {
    return {
      parts: { 
        id, 
        snowflake: DiscordSnowflake.generate({ timestamp: this.date.getTime() }) 
      },
      get id() { 
        return `${this.parts.snowflake}:${this.parts.id}` as const; 
      },
      toString() {
        return this.id;
      }
    };
  }
}

/**
 * Checks if a command contains a subcommand group.
 * @template Cached The command interaction's cache type.
 * @param command The command interaction to check from.
 * @param subcommandGroup The name of the subcommand group.
 * @since 6.0.0
 */
export function commandHasSubcommandGroupOption<Cached extends CacheType>(command: CommandInteraction<Cached>, subcommandGroup: string): boolean {
  return commandHasOption(command, subcommandGroup, 'SUB_COMMAND_GROUP');
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
 * Checks if an option from a subcommand in a command interaction exists.
 * @template Cached The command interaction's cached type.
 * @param command The source command interaction.
 * @param subcommandGroup The subcommand group to check it from.
 * @param subcommand The name of the subcommand to check.
 * @since 6.0.0
 */
export function commandHasSubcommandOption<Cached extends CacheType>(
  command: CommandInteraction<Cached>,
  subcommandGroup: string,
  subcommand: string
): boolean {
  return commandHasSubcommandGroupOption(command, subcommandGroup) && commandHasOption(command, subcommand, 'SUB_COMMAND');
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
 * Creates a unique component custom id that uses the `snowflake:customId` format.
 * @param id The value of the component id.
 * @param date The date to create the snowflake from.
 * @since 6.0.0
 */
export function createComponentId<Id extends string = string>(id: Id, date = new Date()): CustomId<Id> {
  return new ComponentId(date).create(id);
}

/**
 * The returned value of the {@link createComponentId} function.
 * @since 6.0.0
 */
export interface CustomId<out Id extends string> {
  parts: {
    id: Id;
    snowflake: bigint;
  };
  readonly id: `${bigint}:${Id}`;
  toString(): `${bigint}:${Id}`;
}

/**
 * Creates an attachment based from the attachment or url of the attachment provided.
 * @param attachmentOrUrl The url of the file to attach or a {@link MessageAttachment} instance.
 * @param fileName The name of the file attachment.
 * @since 5.2.5
 */
export async function fromAttachment(attachmentOrUrl: MessageAttachment | string, fileName?: string): Promise<MessageAttachment> {
  attachmentOrUrl = typeof attachmentOrUrl === 'string' ? attachmentOrUrl : attachmentOrUrl.url;
  const download = await fetch(attachmentOrUrl, FetchResultTypes.Buffer);
  return new MessageAttachment(download, fileName);
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
  return resolvable.guild!.id;
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
 * A type-guard checking if an {@link APIMessage} and {@link Message} is an actual {@link Message}.
 * A use case of this one would be checking for the returned value by a component/command interaction if it's a {@link Message} or not.
 * @param message The message to check for.
 * @returns A guarded type of {@link Message}.
 * @version 5.2.0
 * @since 5.0.0
 */
export function isMessageInstance<Cached extends boolean = boolean>(message: APIMessage | Message<Cached>): message is Message<Cached> {
  return hasSnowflakeIdentifier(message) && message instanceof Message;
}

/**
 * Checks if a specific thing is an interaction.
 * @param interaction The value to check for.
 * @returns A boolean.
 * @version 5.2.0
 * @since 5.0.0
 */
export function isInteraction<Cached extends CacheType = CacheType>(
  interaction: APIInteraction | Interaction<CacheType>
): interaction is Interaction<Cached> {
  return hasSnowflakeIdentifier(interaction) && interaction instanceof Interaction;
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
  return guild.iconURL({ dynamic: true, ...args[0] }) ?? null;
}

/**
 * Retrieves the user's highest role color.
 * @param member The source member.
 * @returns A hex color string.
 */
export function getHighestRoleColor(member: GuildMember) {
  const sorted = Util.discordSort(member.roles.cache.filter((r) => r.color !== 0));
  return sorted.last()?.color ?? Constants.Colors.NOT_QUITE_BLACK;
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
 * Disables all the components from user interaction.
 * @param rows The row of components to disable the components from.
 * @returns The rows with their components on a disabled state.
 */
export function disableMessageComponents(rows: MessageActionRow[]): MessageActionRow[] {
  return rows.map((row) => row.setComponents(row.components.map((c) => c.setDisabled(true))));
}

/**
 * Retrieves the user's avatar URL.
 * @param user The source user.
 * @param args The extra params.
 * @returns The user's avatar URL.
 */
export function getUserAvatarURL(user: User, ...args: Parameters<User['avatarURL']>): string {
  return user.avatarURL({ dynamic: true, ...args[0] }) ?? user.defaultAvatarURL;
}
