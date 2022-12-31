import { Command, ApplicationCommandRegistry, CommandOptionsRunTypeEnum } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';

import { join, percent, edit, DeferCommandInteraction, getUserAvatarURL, toReadable, InteractionMessageContentBuilder } from '#lib/utilities';
import { bold, inlineCode } from '@discordjs/builders';
import { Constants, GuildMember } from 'discord.js';
import type { PlayerSchema } from '#lib/database';

@ApplyOptions<Command.Options>({
  name: 'balance',
  description: "Checks for the balance of you or someone else's.",
  runIn: [CommandOptionsRunTypeEnum.GuildText]
})
export default class BalanceCommand extends Command {
  @DeferCommandInteraction()
  public override async chatInputRun(command: Command.ChatInputInteraction<'cached'>) {
    const member = command.options.getMember('user') ?? command.member;
    const db = await this.container.db.players.fetch(member.user.id);

    return await edit(command, BalanceCommand.renderContent(member, db));
  }

  private static renderContent(member: GuildMember, db: PlayerSchema) {
    return new InteractionMessageContentBuilder()
      .addEmbed(embed => 
        embed
          .setAuthor({ name: `${member.user.username}'s balance`, iconURL: getUserAvatarURL(member.user) })
          .setColor(Constants.Colors.DARK_BUT_NOT_BLACK)
          .setDescription(
            join(
              `${bold('Wallet:')} ${db.wallet.toLocaleString()}`,
              `${bold('Bank:')} ${db.bank.toLocaleString()}/${db.bank.space.toLocaleString()} ${inlineCode(
                percent(db.bank.value, db.bank.space.value, 1)
              )}`
            )
          )
          .setFooter({ text: `Net Worth: ${toReadable(db.netWorth)}` })
      )
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addUserOption((option) => option.setName('user').setDescription('The user to check for.'))
      , {
        idHints: ['1050341967051108403']
      });
  }
}
