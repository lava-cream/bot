import type { ChatInputCommandErrorPayload, UserError } from '@sapphire/framework';
import { Listener, Events } from '@sapphire/framework';

import { Constants } from 'discord.js';
import { send } from '#lib/utilities';

export class ChatInputCommandErrorListener extends Listener<typeof Events.ChatInputCommandError> {
  public constructor(context: Listener.Context) {
    super(context, { name: Events.ChatInputCommandError });
  }

  public async run(error: UserError, payload: ChatInputCommandErrorPayload): Promise<void> {
    this.container.logger.error(`[COMMAND] ${payload.command.name} ran into an error:`, error);

    await send(payload.interaction, builder => 
      builder  
        .addEmbed(embed => 
          embed  
            .setTitle('An error occured!')
            .setColor(Constants.Colors.RED)
            .setDescription(error.message)
        )
    );
  }
}
