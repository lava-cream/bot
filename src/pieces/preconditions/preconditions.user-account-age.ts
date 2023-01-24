import type { Message, ChatInputCommandInteraction, ContextMenuCommandInteraction } from 'discord.js';
import { AllFlowsPrecondition, PieceContext } from '@sapphire/framework';

import type { User } from 'discord.js';
import { hours } from '#lib/utilities/common/index.js';
import { PreconditionNames } from '#lib/framework/preconditions/index.js';

export default class AccountAgePrecondition extends AllFlowsPrecondition {
	public constructor(context: PieceContext) {
		super(context, { name: PreconditionNames.UserAccountAge, position: 3 });
	}

	public override messageRun(message: Message) {
		return this.sharedRun(message.author);
	}

	public override chatInputRun(command: ChatInputCommandInteraction) {
		return this.sharedRun(command.user);
	}

	public override contextMenuRun(context: ContextMenuCommandInteraction) {
		return this.sharedRun(context.user);
	}

	public sharedRun(user: User) {
		return Date.now() - user.createdTimestamp > hours(24) ? this.ok() : super.error({ identifier: this.name });
	}
}

declare module '@sapphire/framework' {
	interface Preconditions {
		[PreconditionNames.UserAccountAge]: never;
	}
}
