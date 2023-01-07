import { BuilderCallback, InteractionMessageContentBuilder, isMessageInstance, Responder } from '#lib/utilities';
import { isNullOrUndefined } from '@sapphire/utilities';
import type { CommandInteraction, GuildCacheMessage } from 'discord.js';

/**
 * Represents the game's responder utility.
 */
export class GameResponder extends Responder<'cached', CommandInteraction<'cached'>> {
  private messageId: string | null = null;

  public override async send(builder: BuilderCallback<InteractionMessageContentBuilder>) {
    const message = await super.send(builder);
    this.messageId = message.id;
    return message;
  }

  public override async edit(builder: BuilderCallback<InteractionMessageContentBuilder>): Promise<GuildCacheMessage<'cached'>> {
    const message = isNullOrUndefined(this.messageId)
      ? await super.edit(builder)
      : await this.target.webhook.editMessage(this.messageId, this.content.apply(builder));

    if (!isMessageInstance(message) || !message.inGuild())
      throw new Error();

    this.messageId = message.id;
    return message;
  }
}
