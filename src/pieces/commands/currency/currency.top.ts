import type { CommandInteraction } from 'discord.js';
import { Command, ApplicationCommandRegistry, CommandOptionsRunTypeEnum } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';

import type { PlayerSchema } from '#lib/database';
import { MessageEmbed, MessageSelectOptionData, WebhookEditMessageOptions, MessageActionRow, MessageSelectMenu } from 'discord.js';
import { randomColor, join, createComponentId, Collector, seconds } from '#lib/utilities';
import { inlineCode, bold } from '@discordjs/builders';
import { toTitleCase, noop } from '@sapphire/utilities';

enum ComponentIdentifiers {
  Paginator = 'paginator'
}

enum PageType {
  Wallet = 'wallet',
  Bank = 'bank'
}

@ApplyOptions<Command.Options>({
  name: 'top',
  description: 'View the leading players of the currency.',
  runIn: [CommandOptionsRunTypeEnum.GuildText]
})
export default class TopCommand extends Command {
  public override async chatInputRun(command: CommandInteraction<'cached'>) {
    await command.deferReply();

    let activeType: PageType = PageType.Wallet;

    const dbs = await this.container.db.players.fetchAll(true);
    const collector = new Collector({
      message: await command.editReply(this.renderContent(command, activeType, dbs)),
      componentType: 'SELECT_MENU',
      time: seconds(30),
      max: Infinity,
      filter: async (menu) => {
        const context = menu.user.id === command.user.id;
        await menu.deferUpdate();
        return context;
      }
    });

    collector.actions.add(
      createComponentId({ date: new Date(command.createdTimestamp), customId: ComponentIdentifiers.Paginator }).customId,
      async (ctx) => {
        switch ((activeType = ctx.interaction.values.at(0) as PageType)) {
          case PageType.Wallet:
          case PageType.Bank: {
            await ctx.interaction.editReply(this.renderContent(command, activeType, dbs));
            break;
          }
        }
      }
    );

    collector.setEndAction(async (ctx) => {
      const content = this.renderContent(command, activeType, dbs);
      return void (await ctx.message.edit(content).catch(noop));
    });

    await collector.start();
  }

  protected renderContent(command: CommandInteraction<'cached'>, page: PageType, dbs: PlayerSchema[]): WebhookEditMessageOptions {
    const embed = new MessageEmbed().setColor(randomColor());

    switch (page) {
      case PageType.Wallet: {
        const wallets = dbs
          .filter((db) => db.wallet.value > 0)
          .sort((a, b) => b.wallet.value - a.wallet.value)
          .slice(0, 10);

        embed.setTitle(`Top ${wallets.length} wallets`);
        embed.setDescription(
          join(
            ...wallets.map((db, idx) => {
              const user = this.container.client.users.resolve(db._id);
              return `${inlineCode(`#${idx + 1}`)} ${bold(db.wallet.value.toLocaleString())} - ${user?.tag ?? 'Unknown User'}`;
            })
          )
        );

        break;
      }

      case PageType.Bank: {
        const banks = dbs
          .filter((db) => db.bank.value > 0)
          .sort((a, b) => b.bank.value - a.bank.value)
          .slice(0, 10);

        embed.setTitle(`Top ${banks.length} banks`);
        embed.setDescription(
          join(
            ...banks.map((db, idx) => {
              const user = this.container.client.users.resolve(db._id);
              return `${inlineCode(`#${idx + 1}`)} ${bold(db.bank.value.toLocaleString())} - ${user?.tag ?? 'Unknown User'}`;
            })
          )
        );

        break;
      }
    }

    return {
      embeds: [embed],
      components: [
        new MessageActionRow<MessageSelectMenu>().addComponents(
          new MessageSelectMenu()
            .setCustomId(createComponentId({ date: new Date(command.createdTimestamp), customId: ComponentIdentifiers.Paginator }).customId)
            .setPlaceholder(toTitleCase(page))
            .setMaxValues(1)
            .setOptions(
              ...Object.values(PageType).map(
                (id) =>
                  <MessageSelectOptionData>{
                    label: toTitleCase(id),
                    value: id,
                    default: id === page
                  }
              )
            )
        )
      ]
    };
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) => builder.setName(this.name).setDescription(this.description));
  }
}
