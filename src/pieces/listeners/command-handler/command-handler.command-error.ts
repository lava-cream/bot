import { type ChatInputCommandErrorPayload, UserError } from '@sapphire/framework';
import { Listener, Events } from '@sapphire/framework';

import { Constants } from 'discord.js';
import { createEmbed, Responder } from '#lib/utilities';
import { isCommandError, isCommandOptionError } from '#lib/framework';

export default class ChatInputCommandErrorListener extends Listener<typeof Events.ChatInputCommandError> {
  public constructor(context: Listener.Context) {
    super(context, { event: Events.ChatInputCommandError });
  }

  public async run(error: UserError, payload: ChatInputCommandErrorPayload): Promise<void> {
    console.log({ error });
    const responder = new Responder(payload.interaction);
    const embed = createEmbed(embed => embed.setColor(Constants.Colors.RED).setDescription('An unknown error occured.'));

    if (error instanceof UserError) {
      embed.setDescription(error.message);

      if (isCommandError(error)) {
        responder.content.addEmbed(() => embed.setTitle('Command Error'));
      } else if (isCommandOptionError(error)) {
        responder.content.addEmbed(() => embed.setTitle('Command Option Error'));
      }

      await responder.send();
    }

    this.container.logger.error('[CLIENT => COMMAND-HANDLER]', 'Command Error', error);
  }
}
