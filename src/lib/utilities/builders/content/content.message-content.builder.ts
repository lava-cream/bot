import type { MessageFlagsString, MessageOptions, MessageEditOptions, ReplyOptions } from 'discord.js';
import type { MessageActionRowBuilderComponents } from '../component/component.action-row.builder.js';

import { BaseMessageContentBuilder } from './content.base.builder.js';

export class MessageContentBuilder<Components extends MessageActionRowBuilderComponents = MessageActionRowBuilderComponents>
  extends BaseMessageContentBuilder<Components, 'SUPPRESS_EMBEDS'>
  implements MessageOptions
{
  public reply?: ReplyOptions;

  public setReplyOptions(replyOptions: ReplyOptions): this {
    this.reply = replyOptions;
    return this;
  }
}

export class MessageEditContentBuilder<Components extends MessageActionRowBuilderComponents = MessageActionRowBuilderComponents>
  extends BaseMessageContentBuilder<Components, MessageFlagsString>
  implements MessageEditOptions {}
