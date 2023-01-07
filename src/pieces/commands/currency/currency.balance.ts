import { Command, ApplicationCommandRegistry } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';

import { join, percent, send, toReadable, InteractionMessageContentBuilder } from '#lib/utilities';
import { bold, inlineCode } from '@discordjs/builders';
import type { User } from 'discord.js';
import type { PlayerSchema } from '#lib/database';
import { EmbedTemplates } from '#lib/utilities';

@ApplyOptions<Command.Options>({
  name: 'balance',
  description: "Checks for the balance of yours or someone else's."
})
export default class BalanceCommand extends Command {
  public override async chatInputRun(command: Command.ChatInputInteraction) {
    const user = command.options.getUser('user') ?? command.user;
    const db = await this.container.db.players.fetch(user.id);

    await send(command, BalanceCommand.renderContent(user, db));
  }

  private static renderContent(user: User, db: PlayerSchema) {
    return new InteractionMessageContentBuilder()
      .addEmbed(() => 
        EmbedTemplates
          .createSimple(join(
            `${bold('Wallet:')} ${db.wallet.toLocaleString()}`,
            `${bold('Bank:')} ${db.bank.toLocaleString()}/${db.bank.space.toLocaleString()} ${inlineCode(
              percent(db.bank.value, db.bank.space.value, 1)
            )}`
          ))
          .setTitle(`${user.username}'s balance`)
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
      }
    );
  }
}
