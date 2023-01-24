import type {
	InteractionEditReplyOptions,
	InteractionReplyOptions,
	InteractionUpdateOptions,
	MessageFlagsString,
	WebhookEditMessageOptions
} from 'discord.js';
import type { ActionRowComponentBuilder } from '../component/component.action-row.builder.js';

import { BaseMessageContentBuilder } from './content.base.builder.js';

abstract class BaseInteractionMessageContentBuilder<
	Components extends ActionRowComponentBuilder = ActionRowComponentBuilder,
	Flags extends MessageFlagsString = MessageFlagsString
> extends BaseMessageContentBuilder<Components, Flags> {}

export class InteractionMessageContentBuilder<Components extends ActionRowComponentBuilder = ActionRowComponentBuilder>
	extends BaseInteractionMessageContentBuilder<Components, 'SuppressEmbeds' | 'Ephemeral'>
	implements InteractionReplyOptions, InteractionEditReplyOptions
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

export class InteractionMessageUpdateBuilder<Components extends ActionRowComponentBuilder = ActionRowComponentBuilder>
	extends BaseInteractionMessageContentBuilder<Components, 'SuppressEmbeds'>
	implements InteractionUpdateOptions
{
	public fetchReply?: boolean;

	public setFetchReply(fetchReply: boolean): this {
		this.fetchReply = fetchReply;
		return this;
	}
}
