import type { InteractionReplyOptions, WebhookEditMessageOptions } from 'discord.js';
import type { MessageActionRowBuilderComponents } from '../component/component.action-row.builder.js';

import { BaseMessageContentBuilder } from './content.base.builder.js';

export class InteractionMessageContentBuilder<Components extends MessageActionRowBuilderComponents = MessageActionRowBuilderComponents>
  extends BaseMessageContentBuilder<Components, 'SUPPRESS_EMBEDS' | 'EPHEMERAL'>
  implements InteractionReplyOptions, WebhookEditMessageOptions
{
  public ephemeral?: boolean;
  public fetchReply?: boolean;
  public threadId?: WebhookEditMessageOptions['threadId'];

  public setEphemeral(ephemeral: boolean): this {
    this.ephemeral = ephemeral;
    return this;
  }

  public setFetchReply(fetchReply: boolean): this {
    this.fetchReply = fetchReply;
    return this;
  }

  public setThreadId(threadId: WebhookEditMessageOptions['threadId']): this {
    this.threadId = threadId;
    return this;
  }
}
