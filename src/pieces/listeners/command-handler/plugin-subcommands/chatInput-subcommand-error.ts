import { Listener, UserError } from '@sapphire/framework';
import { ChatInputSubcommandErrorPayload, SubcommandPluginEvents } from '@sapphire/plugin-subcommands';

import { send } from '#lib/utilities';
import { MessageEmbed, Constants } from 'discord.js';
import { isCommandError, isCommandOptionError } from '#lib/framework';

export class ChatInputSubcommandErrorListener extends Listener<typeof SubcommandPluginEvents.ChatInputSubcommandError> {
  public constructor(context: Listener.Context) {
    super(context, { name: SubcommandPluginEvents.ChatInputSubcommandError, event: SubcommandPluginEvents.ChatInputSubcommandError });
  }

  public async run(error: unknown, payload: ChatInputSubcommandErrorPayload) {
    if (!(error instanceof UserError)) {
      this.container.logger.error('[CLIENT => COMMAND-HANDLER => PLUGIN-SUBCOMMMANDS]', 'Unknown Error', error);
      return;
    }

    const defaultEmbed = new MessageEmbed()
      .setColor(Constants.Colors.RED)
      .setDescription(error.message);

    if (isCommandError(error)) {
      await send(payload.interaction, builder => builder.addEmbed(() => defaultEmbed.setTitle('Command Error')));
    } else if (isCommandOptionError(error)) {
      await send(payload.interaction, builder => builder.addEmbed(() => defaultEmbed.setTitle('Command Input Error')));
    }

    return;
  }
}