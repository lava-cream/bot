import type { Message, CommandInteraction, ContextMenuInteraction } from 'discord.js';
import type { PieceContext } from '@sapphire/framework';
import { Precondition } from '@sapphire/framework';

import { PreconditionNames } from '#lib/framework/preconditions/index.js';
import { UserSchemaStatus } from '#lib/database/models/primary/user/index.js';
import type { User } from 'discord.js';

export default class UserBlockPrecondition extends Precondition {
  public constructor(context: PieceContext) {
    super(context, { name: PreconditionNames.UserStatus, position: 1 });
  }

  public async sharedRun(user: User) {
    const db = await this.container.db.users.fetch(user.id);

    return db.status === UserSchemaStatus.None ? this.ok() : this.error({ identifier: this.name });
  }

  public override messageRun(message: Message) {
    return this.sharedRun(message.author);
  }

  public override chatInputRun(command: CommandInteraction) {
    return this.sharedRun(command.user);
  }

  public override contextMenuRun(context: ContextMenuInteraction) {
    return this.sharedRun(context.user);
  }
}

declare module '@sapphire/framework' {
  interface Preconditions {
    [PreconditionNames.UserStatus]: never;
  }
}
