import type { Message, CommandInteraction, ContextMenuInteraction } from 'discord.js';
import { AllFlowsPrecondition, PieceContext } from '@sapphire/framework';

import { PreconditionNames } from '#lib/framework/preconditions/index.js';
import { GuildSchemaStatus } from '#lib/database/models/primary/guild/index.js';

export default class GuildBlockListener extends AllFlowsPrecondition {
  public constructor(context: PieceContext) {
    super(context, { name: PreconditionNames.GuildStatus, position: 2 });
  }

  private async sharedRun(guild: import('discord.js').Guild) {
    const error = (message: string) => this.error({ identifier: this.name, message });
    const db = await this.container.db.guilds.fetch(guild.id);

    switch (db.status) {
      case GuildSchemaStatus.Unverified: {
        return error("We're still processing for the verification of this guild.");
      }

      case GuildSchemaStatus.Suspended: {
        return error('This guild was suspended by the developer. However, this is still revokeable.');
      }

      case GuildSchemaStatus.Terminated: {
        return error('This guild was terminated by the developer. This is not revokeable.');
      }

      default: {
        return this.ok();
      }
    }
  }

  public override messageRun(message: Message) {
    return !message.inGuild() ? this.ok() : this.sharedRun(message.guild);
  }

  public override chatInputRun(command: CommandInteraction) {
    return !command.inCachedGuild() ? this.ok() : this.sharedRun(command.guild);
  }

  public override contextMenuRun(context: ContextMenuInteraction) {
    return !context.inCachedGuild() ? this.ok() : this.sharedRun(context.guild);
  }
}

declare module '@sapphire/framework' {
  interface Preconditions {
    [PreconditionNames.GuildStatus]: never;
  }
}
