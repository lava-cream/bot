import type { Message, ChatInputCommandInteraction, ContextMenuCommandInteraction } from 'discord.js';
import { AllFlowsPrecondition, PieceContext } from '@sapphire/framework';

import { PreconditionNames } from '#lib/framework/preconditions/index.js';
import { GuildSchemaStatus } from '#lib/database/models/primary/guild/index.js';

export interface GuildStatusPreconditionContext {
	status: GuildSchemaStatus;
}

export default class GuildBlockListener extends AllFlowsPrecondition {
	public constructor(context: PieceContext) {
		super(context, { name: PreconditionNames.GuildStatus, position: 2 });
	}

	private async sharedRun(guild: import('discord.js').Guild) {
		const db = await this.container.db.guilds.fetch(guild.id);

		switch (db.status) {
			case GuildSchemaStatus.Unverified:
			case GuildSchemaStatus.Suspended:
			case GuildSchemaStatus.Terminated: {
				return this.error({
					identifier: this.name,
					context: { status: db.status } satisfies GuildStatusPreconditionContext
				});
			}

			default: {
				return this.ok();
			}
		}
	}

	public override messageRun(message: Message) {
		return !message.inGuild() ? this.ok() : this.sharedRun(message.guild);
	}

	public override chatInputRun(command: ChatInputCommandInteraction) {
		return !command.inCachedGuild() ? this.ok() : this.sharedRun(command.guild);
	}

	public override contextMenuRun(context: ContextMenuCommandInteraction) {
		return !context.inCachedGuild() ? this.ok() : this.sharedRun(context.guild);
	}
}

declare module '@sapphire/framework' {
	interface Preconditions {
		[PreconditionNames.GuildStatus]: GuildStatusPreconditionContext;
	}
}
