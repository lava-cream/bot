import type { Message, CommandInteraction, ContextMenuInteraction } from 'discord.js';
import type { PieceContext } from '@sapphire/framework';
import { Precondition } from '@sapphire/framework';

import type { User } from 'discord.js';
import { PreconditionNames } from '#lib/framework/preconditions/index.js';

export default class OwnerOnlyPrecondition extends Precondition {
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

    return app.owner?.id !== user.id 
      ? this.error({ identifier: this.name })
      : this.ok();
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
    [PreconditionNames.UserOwnerOnly]: never;
  }
}
