import type { CommandInteraction } from 'discord.js';
import type { ChatInputCommand } from '@sapphire/framework';
import { Listener, Events } from '@sapphire/framework';

export class ChatInputCommandFinishListener extends Listener<typeof Events.ChatInputCommandFinish> {
  public constructor(context: Listener.Context) {
    super(context, { name: Events.ChatInputCommandFinish });
  }

  public async run(interaction: CommandInteraction, command: ChatInputCommand) {
    this.container.logger.info(
      '[LISTENER]',
      `${interaction.user.tag} (ID: ${interaction.user.id}) used the command "${command.name}" in ${interaction.channelId}`
    );
  }
}
