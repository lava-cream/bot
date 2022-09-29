import type { Message, CommandInteraction, ContextMenuInteraction } from 'discord.js';
import type { PieceContext } from '@sapphire/framework';
import { Precondition } from '@sapphire/framework';

import { PreconditionNames } from '#lib/framework/preconditions/index.js';
import { GuildSchemaStatus } from '#lib/database/models/primary/guild/index.js';

export default class GuildBlockListener extends Precondition {
  public constructor(context: PieceContext) {
    super(context, { name: PreconditionNames.GuildBlockStatus, position: 2 });
  }

  private async sharedRun(guild: import('discord.js').Guild) {
    const db = await this.container.db.guilds.fetch(guild.id);

    return db.status === GuildSchemaStatus.Verified ? this.ok() : this.error({ identifier: this.name });
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
    [PreconditionNames.GuildBlockStatus]: never;
  }
}
