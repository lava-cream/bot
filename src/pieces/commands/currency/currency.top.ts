import type { CommandInteraction } from 'discord.js';
import { Command, ApplicationCommandRegistry, CommandOptionsRunTypeEnum } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';

import type { PlayerSchema } from '#lib/database';
import type { MessageSelectOptionData } from 'discord.js';
import {
  randomColor,
  join,
  createComponentId,
  Collector,
  seconds,
  InteractionMessageContentBuilder,
  DeferCommandInteraction,
  edit,
  CustomId,
  pluralise
} from '#lib/utilities';
import { inlineCode, bold } from '@discordjs/builders';
import { toTitleCase } from '@sapphire/utilities';

enum ComponentIdentifiers {
  Paginator = 'paginator'
}

enum PageType {
  Wallet = 'wallet',
  Bank = 'bank',
  Star = 'star'
}

const leaderboards: Record<PageType, (db: PlayerSchema) => number> = {
  [PageType.Wallet]: (db) => db.wallet.value,
  [PageType.Bank]: (db) => db.bank.value,
  [PageType.Star]: (db) => db.energy.value
};

@ApplyOptions<Command.Options>({
  name: 'top',
  description: 'View the leading players of the currency.',
  runIn: [CommandOptionsRunTypeEnum.GuildText]
})
export default class TopCommand extends Command {
  @DeferCommandInteraction()
  public override async chatInputRun(command: CommandInteraction<'cached'>) {
    let activeType: PageType = PageType.Wallet;

    const dbs = await this.container.db.players.fetchAll(true);
    const componentId = createComponentId(ComponentIdentifiers.Paginator, new Date(command.createdTimestamp));
    const collector = new Collector({
      message: await edit(command, this.renderContent(command, activeType, dbs, componentId)),
      componentType: 'SELECT_MENU',
      time: seconds(30),
      max: Infinity,
      filter: async (menu) => {
        const context = menu.user.id === command.user.id;
        await menu.deferUpdate();
        return context;
      },
      end: async () => {
        await edit(command, this.renderContent(command, activeType, dbs, componentId));
        return;
      }
    });

    collector.actions.add(componentId.id, async (ctx) => {
      activeType = ctx.interaction.values.at(0) as PageType;
      await edit(ctx.interaction, this.renderContent(command, activeType, dbs, componentId));
    });

    await collector.start();
  }

  protected renderContent(command: CommandInteraction<'cached'>, page: PageType, dbs: PlayerSchema[], componentId: CustomId<ComponentIdentifiers>) {
    const leaderboard = dbs
      .map((db) => ({ db, value: leaderboards[page](db) }))
      .filter(({ value }) => value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    return new InteractionMessageContentBuilder()
      .addEmbed((embed) =>
        embed
          .setTitle(`Top ${leaderboard.length} ${pluralise(toTitleCase(page), leaderboard.length)}`)
          .setColor(randomColor())
          .setDescription(
            join(
              ...leaderboard.map(({ db, value }, idx) => {
                const user = this.container.client.users.resolve(db._id);
                return `${inlineCode(`#${idx + 1}`)} ${bold(value.toLocaleString())} - ${user?.tag ?? 'Unknown User'}`;
              })
            )
          )
          .setFooter({ text: `Requested By: ${command.user.tag}` })
      )
      .addRow((row) =>
        row.addSelectMenuComponent((menu) =>
          menu
            .setCustomId(componentId.id)
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
      );
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) => builder.setName(this.name).setDescription(this.description));
  }
}
