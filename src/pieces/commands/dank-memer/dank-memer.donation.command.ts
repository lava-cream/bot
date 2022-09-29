import type { CommandInteraction } from 'discord.js';
import { Command, ApplicationCommandRegistry, CommandOptionsRunTypeEnum } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';

@ApplyOptions<Command.Options>({
  name: 'donation',
  description: "Manage the server's donations.",
  runIn: [CommandOptionsRunTypeEnum.GuildText]
})
export default class DonationCommand extends Command {
  public override async chatInputRun(command: CommandInteraction<'cached'>) {}

  public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) => builder.setName(this.name).setDescription(this.description));
  }
}
