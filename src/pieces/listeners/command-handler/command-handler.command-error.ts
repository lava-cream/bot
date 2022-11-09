import type { ChatInputCommandErrorPayload, UserError } from '@sapphire/framework';
import { Listener, Events } from '@sapphire/framework';

import { Constants, MessageEmbed } from 'discord.js';
import { join, send } from '#lib/utilities';
import { CommandOptionError } from '#lib/framework';
import { bold } from '@discordjs/builders';

export class ChatInputCommandErrorListener extends Listener<typeof Events.ChatInputCommandError> {
  public constructor(context: Listener.Context) {
    super(context, { name: Events.ChatInputCommandError });
  }

  public async run(error: UserError, payload: ChatInputCommandErrorPayload): Promise<void> {
    const defaultEmbed = new MessageEmbed()
      .setTitle('Command Error')
      .setColor(Constants.Colors.RED)
      .setDescription(error.message);

    if (ChatInputCommandErrorListener.isCommandOptionError(error)) {
      return void await send(payload.interaction, builder => 
        builder  
          .addEmbed(() => 
            defaultEmbed
              .setTitle('Command Input Error')  
              .addFields({
                name: 'Error Details',
                value: join(
                  `${bold('Command:')} ${payload.command.name}`,
                  `${bold('Option:')} ${error.option}`
                )
              })
          )
      );
    }

    await send(payload.interaction, builder => builder.addEmbed(() => defaultEmbed));
    this.container.logger.error(`[COMMAND] ${payload.command.name} ran into an error:`, error);
  }

  private static isCommandOptionError(error: UserError): error is CommandOptionError {
    return Reflect.has(error, 'option') && error instanceof CommandOptionError;
  }
}
