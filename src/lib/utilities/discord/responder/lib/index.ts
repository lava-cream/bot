import type { GuildCacheMessage, CacheType, CommandInteraction, ButtonInteraction, SelectMenuInteraction } from 'discord.js';
import { type BuilderCallback, InteractionMessageContentBuilder, CustomId } from '#lib/utilities';
import { isFunction } from '@sapphire/utilities';
import { Result } from '@sapphire/result';

/**
 * Represents a responder target.
 * @template Cached The cache type.
 */
export type ResponderTarget<Cached extends CacheType> = CommandInteraction<Cached> | ButtonInteraction<Cached> | SelectMenuInteraction<Cached>;

/**
 * Represents the responder content.
 */
export type ResponderContent = string | InteractionMessageContentBuilder | BuilderCallback<InteractionMessageContentBuilder>;

/**
 * Sends a response to an interaction.
 * @template Cached The cached status of the target interaction.
 * @template Target The target interaction's type.
 * @param target The target interaction.
 * @param builder The message content builder.
 * @since 6.0.0
 */
export async function send<Cached extends CacheType>(
  target: ResponderTarget<Cached>,
  builder: ResponderContent
): Promise<GuildCacheMessage<Cached>> {
  const content = new InteractionMessageContentBuilder().apply(
    isFunction(builder) ? builder : (content) => (typeof builder === 'string' ? content.setContent(builder) : builder)
  );
  const { deferred, replied } = target;

  switch (true) {
    case deferred && !replied: {
      return target.editReply(content);
    }

    case replied: {
      return target.followUp(content);
    }

    default: {
      return target.reply({ ...content, fetchReply: true });
    }
  }
}

/**
 * Edits the original response of an interaction.
 * @template Cached The cached status of the target interaction.
 * @template Target The target interaction's type.
 * @param target The target interaction.
 * @param builder The message content builder.
 * @since 6.0.0
 */
export async function edit<Cached extends CacheType>(
  target: ResponderTarget<Cached>,
  builder: ResponderContent
): Promise<GuildCacheMessage<Cached>> {
  const content = new InteractionMessageContentBuilder().apply(
    isFunction(builder) ? builder : (content) => (typeof builder === 'string' ? content.setContent(builder) : builder)
  );
  return await target.editReply(content);
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
export class Responder<Cached extends CacheType> {
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
  public constructor(public target: ResponderTarget<Cached>) {
    this.customId = new CustomId(this.target.createdAt);
  }

  /**
   * Sends a message through the interaction with the current built content.
   * @returns A message object.
   */
  public send(builder: BuilderCallback<InteractionMessageContentBuilder>): Promise<GuildCacheMessage<Cached>> {
    return send(this.target, this.content.apply(builder));
  }

  /**
   * Edits the target interaction with the current built content.
   * @returns A message object.
   */
  public edit(builder: BuilderCallback<InteractionMessageContentBuilder>): Promise<GuildCacheMessage<Cached>> {
    return edit(this.target, this.content.apply(builder));
  }

  /**
   * Unsends or basically deletes the response of the interaction.
   * @returns A boolean indicating the success of the operation.
   */
  public unsend(): Promise<boolean> {
    return unsend(this.target);
  }
}