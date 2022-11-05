import type { GuildCacheMessage, CacheType, CommandInteraction, ButtonInteraction, SelectMenuInteraction } from 'discord.js';
import { type BuilderCallback, InteractionMessageContentBuilder } from '#lib/utilities';
import { isFunction } from '@sapphire/utilities';
import { Result } from '@sapphire/result';

/**
 * Represents a responder target.
 * @template Cached The cache type.
 */
export type ResponderTarget<Cached extends CacheType> = CommandInteraction<Cached> | ButtonInteraction<Cached> | SelectMenuInteraction<Cached>;

/**
 * Sends a response to an interaction.
 * @tempalte Cached The cached status of the target interaction.
 * @param target The target interaction.
 * @param builder The message content builder.
 * @since 6.0.0
 */
export async function send<Cached extends CacheType>(
  target: ResponderTarget<Cached>,
  builder: string | InteractionMessageContentBuilder | BuilderCallback<InteractionMessageContentBuilder>
): Promise<GuildCacheMessage<Cached>> {
  const content = new InteractionMessageContentBuilder().apply(
    isFunction(builder) ? builder : (content) => (typeof builder === 'string' ? content.setContent(builder) : builder)
  );
  const { deferred, replied } = target;

  switch (true) {
    case replied:
    case deferred: {
      return target.followUp(content);
    }

    case !replied:
    default: {
      return target.reply({ ...content, fetchReply: true });
    }
  }
}

/**
 * Edits the original response of an interaction.
 * @tempalte Cached The cached status of the target interaction.
 * @param target The target interaction.
 * @param builder The message content builder.
 * @since 6.0.0
 */
export async function edit<Cached extends CacheType>(
  target: ResponderTarget<Cached>,
  builder: string | InteractionMessageContentBuilder | BuilderCallback<InteractionMessageContentBuilder>
): Promise<GuildCacheMessage<Cached>> {
  const content = new InteractionMessageContentBuilder().apply(
    isFunction(builder) ? builder : (content) => (typeof builder === 'string' ? content.setContent(builder) : builder)
  );
  return await target.editReply(content);
}

/**
 * Deletes the response of an interaction.
 * @tempalte Cached The cached status of the target interaction.
 * @param target The target interaction.
 * @since 6.0.0
 */
export async function unsend<Cached extends CacheType, Target extends ResponderTarget<Cached>>(target: Target): Promise<boolean> {
  const result = await Result.fromAsync(target.deleteReply());
  return result.isOk();
}
