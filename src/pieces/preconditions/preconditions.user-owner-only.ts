import type { Message, ChatInputCommandInteraction, ContextMenuCommandInteraction } from 'discord.js';
import { AllFlowsPrecondition, PieceContext } from '@sapphire/framework';

import type { User } from 'discord.js';
import { PreconditionNames } from '#lib/framework/preconditions/index.js';

export default class OwnerOnlyPrecondition extends AllFlowsPrecondition {
	public constructor(context: PieceContext) {
		super(context, { name: PreconditionNames.UserOwnerOnly });
	}

	private async sharedRun(user: User) {
		if (!user.client.isReady()) {
			return this.error({
				identifier: this.name,
				message: 'The bot is still loading...'
			});
		}

		const app = await user.client.application.fetch();

		return app.owner?.id !== user.id ? this.error({ identifier: this.name }) : this.ok();
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
}

declare module '@sapphire/framework' {
	interface Preconditions {
		[PreconditionNames.UserOwnerOnly]: never;
	}
}
