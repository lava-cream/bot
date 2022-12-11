import type { CommandInteraction } from 'discord.js';
import { Command, ApplicationCommandRegistry, CommandOptionsRunTypeEnum } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';

import { getHighestRoleColor, join, percent, edit, DeferCommandInteraction } from '#lib/utilities';
import { bold, inlineCode } from '@discordjs/builders';

@ApplyOptions<Command.Options>({
  name: 'balance',
  description: "Checks for the balance of you or someone else's.",
  runIn: [CommandOptionsRunTypeEnum.GuildText]
})
export default class BalanceCommand extends Command {
  @DeferCommandInteraction()
  public override async chatInputRun(command: CommandInteraction<'cached'>) {
    const db = await this.container.db.players.fetch(command.user.id);
    const member = command.options.getMember('user') ?? command.member;

    await edit(command, (content) =>
      content.addEmbed((embed) =>
        embed
          .setTitle(`${member.user.username}'s balance`)
          .setColor(getHighestRoleColor(member))
          .setTimestamp(Date.now())
          .setDescription(
            join(
              `${bold('👛 Wallet:')} ${db.wallet.value.toLocaleString()}`,
              `${bold('💳 Bank:')} ${db.bank.value.toLocaleString()}/${db.bank.space.value.toLocaleString()} ${inlineCode(
                percent(db.bank.value, db.bank.space.value, 1)
              )}`,
              `${bold('💰 Net Worth:')} ${db.netWorth.toLocaleString()}`
            )
          )
      )
    );
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addUserOption((option) => option.setName('user').setDescription('The user to check for.'))
    );
  }
}
