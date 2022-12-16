import type { Message, CommandInteraction, ContextMenuInteraction } from 'discord.js';
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
    return !message.inGuild() ? this.error({ identifier: this.name, message: 'Not in guild.' }) : this.sharedRun(message.guild);
  }

  public override chatInputRun(command: CommandInteraction) {
    return !command.inCachedGuild() ? this.error({ identifier: this.name, message: 'Not in guild.' }) : this.sharedRun(command.guild);
  }

  public override contextMenuRun(context: ContextMenuInteraction) {
    return !context.inCachedGuild() ? this.error({ identifier: this.name, message: 'Not in guild.' }) : this.sharedRun(context.guild);
  }
}

declare module '@sapphire/framework' {
  interface Preconditions {
    [PreconditionNames.GuildStatus]: never;
  }
}
