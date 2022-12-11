import type { ChatInputCommandErrorPayload, UserError } from '@sapphire/framework';
import { Listener, Events } from '@sapphire/framework';

import { Constants, MessageEmbed } from 'discord.js';
import { send } from '#lib/utilities';
import { isCommandError, isCommandOptionError } from '#lib/framework';

export class ChatInputCommandErrorListener extends Listener<typeof Events.ChatInputCommandError> {
  public constructor(context: Listener.Context) {
    super(context, { name: Events.ChatInputCommandError, event: Events.ChatInputCommandError });
  }

  public async run(error: UserError, payload: ChatInputCommandErrorPayload): Promise<void> {
    const defaultEmbed = new MessageEmbed().setColor(Constants.Colors.RED).setDescription(error.message);

    if (isCommandError(error)) {
      await send(payload.interaction, (builder) => builder.addEmbed(() => defaultEmbed.setTitle('Command Error')));
    } else if (isCommandOptionError(error)) {
      await send(payload.interaction, (builder) => builder.addEmbed(() => defaultEmbed.setTitle('Command Input Error')));
    }

    this.container.logger.error('[CLIENT => COMMAND-HANDLER]', 'Unknown Error', error);
  }
}
