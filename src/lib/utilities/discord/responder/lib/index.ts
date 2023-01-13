import type { GuildCacheMessage, CacheType, CommandInteraction, ButtonInteraction, SelectMenuInteraction, ModalSubmitInteraction } from 'discord.js';
import { type BuilderCallback, InteractionMessageContentBuilder, CustomId, InteractionMessageUpdateBuilder, MessageActionRowBuilderComponents } from '#lib/utilities';
import { isFunction, isNullOrUndefined } from '@sapphire/utilities';
import { Result } from '@sapphire/result';

/**
 * Represents a responder target.
 * @template Cached The cache type.
 */
export type ResponderTarget<Cached extends CacheType> = CommandInteraction<Cached> | ButtonInteraction<Cached> | SelectMenuInteraction<Cached> | ModalSubmitInteraction<Cached>;

/**
 * Represents the responder content.
 */
export type ResponderContent<Components extends MessageActionRowBuilderComponents> = string | InteractionMessageContentBuilder<Components> | BuilderCallback<InteractionMessageContentBuilder<Components>>;

/**
 * Sends a response to an interaction.
 * @template Cached The cached status of the target interaction.
 * @template Components The type of the components of the content.
 * @param target The target interaction.
 * @param content The message content builder.
 * @returns A message object.
 * @since 6.0.0
 */
export async function send<Cached extends CacheType, Components extends MessageActionRowBuilderComponents>(
  target: ResponderTarget<Cached>,
  content: ResponderContent<Components>
): Promise<GuildCacheMessage<Cached>> {
  const builder = new InteractionMessageContentBuilder<Components>().apply(isFunction(content) ? content : (builder) => typeof content === 'string' ? builder.setContent(content) : content);
  const { deferred, replied } = target;

  switch (true) {
    case deferred && !replied: {
      return target.editReply(builder);
    }

    case replied: {
      return target.followUp(builder);
    }

    default: {
      return target.reply({ ...builder, fetchReply: true });
    }
  }
}

/**
 * Edits the original response of an interaction.
 * @template Cached The cached status of the target interaction.
 * @template Components The type of the components of the content.
 * @param target The target interaction.
 * @param content The message content builder.
 * @returns A message object.
 * @since 6.0.0
 */
export async function edit<Cached extends CacheType, Components extends MessageActionRowBuilderComponents>(
  target: ResponderTarget<Cached>,
  content: ResponderContent<Components>
): Promise<GuildCacheMessage<Cached>> {
  const builder = new InteractionMessageContentBuilder<Components>().apply(isFunction(content) ? content : (builder) => typeof content === 'string' ? builder.setContent(content) : content);

  return await target.editReply(builder);
}

/**
 * Updates a message component interaction.
 * @template Cached The cached status of the target interaction.
 * @template Components The type of the components of the content.
 * @param target The target interaction.
 * @param content The message content.
 * @returns A message object.
 * @since 6.0.0
 */
export async function update<Cached extends CacheType, Components extends MessageActionRowBuilderComponents>(
  target: Exclude<ResponderTarget<Cached>, CommandInteraction<Cached>>,
  content: Exclude<ResponderContent<Components>, string> // | InteractionMessageUpdateBuilder<Components> | BuilderCallback<InteractionMessageUpdateBuilder<Components>>
): Promise<GuildCacheMessage<Cached>> {
  content = isFunction(content) ? new InteractionMessageContentBuilder<Components>().apply(content) : content;

  const builder = Object.assign(new InteractionMessageUpdateBuilder<Components>(), content);

  return await target.update({ ...builder, fetchReply: true });
}

/**
 * Deletes the response of an interaction.
 * @template Cached The cached status of the target interaction.
 * @template Target The target interaction's type.
 * @param target The target interaction.
 * @since 6.0.0
 */
export async function unsend<Cached extends CacheType, Target extends ResponderTarget<Cached>>(target: Target): Promise<boolean> {
  const result = await Result.fromAsync(target.deleteReply());
  return result.isOk();
}

/**
 * Class-based responder utility.
 * @template Cached The cached status of the target interaction.
 * @template Target The target interaction's type.
 * @since 6.0.0
 */
export class Responder<Cached extends CacheType, Target extends ResponderTarget<Cached>> {
  /**
   * The content builder.
   */
  public content = new InteractionMessageContentBuilder();
  /**
   * The {@link CustomId} utility to easily create unique message component custom IDs.
   */
  public customId: CustomId;

  /**
   * The responder's constructor.
   * @param target The target interaction.
   */
  public constructor(public target: Target) {
    this.customId = new CustomId(this.target.createdAt);
  }

  /**
   * Sends a message through the interaction with the current built content.
   * @param builder The message content builder.
   * @returns A message object.
   */
  public send(builder?: BuilderCallback<InteractionMessageContentBuilder>): Promise<GuildCacheMessage<Cached>> {
    return send(this.target, isNullOrUndefined(builder) ? this.content : this.content.apply(builder));
  }

  /**
   * Edits the target interaction with the current built content.
   * @param builder The message content builder.
   * @returns A message object.
   */
  public edit(builder?: BuilderCallback<InteractionMessageContentBuilder>): Promise<GuildCacheMessage<Cached>> {
    return edit(this.target, isNullOrUndefined(builder) ? this.content : this.content.apply(builder));
  }

  /**
   * Unsends or basically deletes the response of the interaction.
   * @returns A boolean indicating the success of the operation.
   */
  public unsend(): Promise<boolean> {
    return unsend(this.target);
  }
}