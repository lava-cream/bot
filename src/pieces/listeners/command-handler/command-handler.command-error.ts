import type { ChatInputCommandErrorPayload, UserError } from '@sapphire/framework';
import { Listener, Events } from '@sapphire/framework';

import { Constants, InteractionReplyOptions } from 'discord.js';
import { bold } from '@discordjs/builders';

export class ChatInputCommandErrorListener extends Listener<typeof Events.ChatInputCommandError> {
  public constructor(context: Listener.Context) {
    super(context, { name: Events.ChatInputCommandError });
  }

  private getContent = (_error: UserError, _payload: ChatInputCommandErrorPayload): InteractionReplyOptions => ({
    embeds: [
      {
        title: 'Error Encountered',
        color: Constants.Colors.RED,
        description: `OOPS We ran through an error. Please yell at my owner ${bold(this.container.client.owner!.tag)} to fix this problem.`
      }
    ]
  });

  public async run(error: UserError, payload: ChatInputCommandErrorPayload): Promise<void> {
    this.container.logger.error(`[COMMAND] ${payload.command.name} ran into an error:`, error.stack ?? error);
    await payload.interaction.webhook.send(this.getContent(error, payload));
  }
}
