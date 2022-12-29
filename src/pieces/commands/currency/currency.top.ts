import type { CommandInteraction } from 'discord.js';
import { Command, ApplicationCommandRegistry, CommandOptionsRunTypeEnum } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';

import type { PlayerSchema } from '#lib/database';
import type { MessageSelectOptionData } from 'discord.js';
import {
  randomColor,
  join,
  Collector,
  seconds,
  InteractionMessageContentBuilder,
  DeferCommandInteraction,
  edit,
  CustomIdentifier,
  pluralise,
  CustomId,
  getGuildIconURL
} from '#lib/utilities';
import { inlineCode, bold } from '@discordjs/builders';
import { toTitleCase } from '@sapphire/utilities';

enum ComponentIdentifiers {
  Paginator = 'paginator'
}

enum PageType {
  Wallet = 'wallet',
  Bank = 'bank',
  Star = 'star',
  Energy = 'energy'
}

const leaderboards: Record<PageType, (db: PlayerSchema) => number> = {
  [PageType.Wallet]: (db) => db.wallet.value,
  [PageType.Bank]: (db) => db.bank.value,
  [PageType.Star]: (db) => db.energy.value,
  [PageType.Energy]: (db) => db.energy.energy
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
    const customId = new CustomId(command.createdAt).create(ComponentIdentifiers.Paginator);
    const collector = new Collector({
      message: await edit(command, this.renderContent(command, activeType, dbs, customId, false)),
      componentType: 'SELECT_MENU',
      time: seconds(10),
      max: Infinity,
      actions: {
        [customId]: async (ctx) => {
          ctx.collector.resetTimer();
          activeType = ctx.interaction.values.at(0) as PageType;
          await edit(ctx.interaction, this.renderContent(command, activeType, dbs, customId, false));
        }
      },
      filter: async (menu) => {
        const context = menu.user.id === command.user.id;
        await menu.deferUpdate();
        return context;
      },
      end: async () => {
        await edit(command, this.renderContent(command, activeType, dbs, customId, true));
        return;
      }
    });

    await collector.start();
  }

  protected renderContent(command: CommandInteraction<'cached'>, page: PageType, dbs: PlayerSchema[], customId: CustomIdentifier<ComponentIdentifiers>, ended: boolean) {
    const leaderboard = dbs
      .map((db) => ({ db, value: Reflect.apply(Reflect.get(leaderboards, page), null, [db]) }))
      .filter(({ value }) => value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    return new InteractionMessageContentBuilder()
      .addEmbed((embed) =>
        embed
          .setTitle(`Top ${leaderboard.length} ${pluralise(toTitleCase(page), leaderboard.length)}`)
          .setColor(randomColor())
          .setDescription(
            leaderboard.length > 0
              ? join(
                ...leaderboard.map(({ db, value }, idx) => {
                  const user = this.container.client.users.resolve(db._id);
                  const emoji = (['🥇', '🥈', '🥉'] as const).at(idx) ?? '👏' as const; 

                  return `${inlineCode(emoji)} ${bold(value.toLocaleString())} - ${user?.tag ?? 'Unknown User'}`;
                })
              )
              : 'No players to show.'
          )
          .setFooter({ text: command.guild.name, iconURL: getGuildIconURL(command.guild) ?? void 0 })
      )
      .addRow((row) =>
        row.addSelectMenuComponent((menu) =>
          menu
            .setCustomId(customId)
            .setPlaceholder(toTitleCase(page))
            .setMaxValues(1)
            .setDisabled(ended)
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
