import type { MessageCreateOptions, MessageEditOptions, ReplyOptions } from 'discord.js';
import type { ActionRowComponentBuilder } from '../component/component.action-row.builder.js';

import { BaseMessageContentBuilder } from './content.base.builder.js';

export class MessageContentBuilder<Components extends ActionRowComponentBuilder = ActionRowComponentBuilder>
	extends BaseMessageContentBuilder<Components, 'SuppressEmbeds'>
	implements MessageCreateOptions
{
	public reply?: ReplyOptions;

	public setReplyOptions(replyOptions: ReplyOptions): this {
		this.reply = replyOptions;
		return this;
	}
}

export class MessageEditContentBuilder<Components extends ActionRowComponentBuilder = ActionRowComponentBuilder>
	extends BaseMessageContentBuilder<Components, 'SuppressEmbeds'>
	implements MessageEditOptions {}
