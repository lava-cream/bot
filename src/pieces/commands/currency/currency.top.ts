import { Command, ApplicationCommandRegistry, CommandOptionsRunTypeEnum } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';

import type { PlayerSchema } from '#lib/database';
import { Constants, MessageSelectOptionData, SelectMenuInteraction } from 'discord.js';
import {
  randomColor,
  join,
  Collector,
  seconds,
  InteractionMessageContentBuilder,
  edit,
  CustomIdentifier,
  pluralise,
  CustomId,
  getGuildIconURL,
  send,
  update,
  InteractionMessageUpdateBuilder,
  SelectMenuBuilder
} from '#lib/utilities';
import { bold } from '@discordjs/builders';
import { toTitleCase } from '@sapphire/utilities';
import type { APIApplicationCommandOptionChoice } from 'discord-api-types/v9';

enum ComponentIdentifiers {
  Paginator = 'paginator'
}

enum PageType {
  Wallet = 'wallet',
  Bank = 'bank',
  Star = 'star',
  Energy = 'energy'
}

@ApplyOptions<Command.Options>({
  name: 'top',
  description: 'View the player leaderboards.',
  runIn: [CommandOptionsRunTypeEnum.GuildText]
})
export default class TopCommand extends Command {
  private static leaderboards: Record<PageType, (db: PlayerSchema) => number> = {
    [PageType.Wallet]: (db) => db.wallet.value,
    [PageType.Bank]: (db) => db.bank.value,
    [PageType.Star]: (db) => db.energy.value,
    [PageType.Energy]: (db) => db.energy.energy
  };

  public override async chatInputRun(command: Command.ChatInputInteraction<'cached'>) {
    let activeType: PageType = command.options.getString('type') as PageType | null ?? PageType.Wallet;

    await send(command, builder => builder.addEmbed(
      embed => embed.setColor(Constants.Colors.DARK_BUT_NOT_BLACK).setDescription('Fetching...')
    ));

    const dbs = await this.container.db.players.fetchAll(true);

    for (const db of dbs.values()) {
      try {
        if (!command.client.users.resolve(db._id)) {
          await command.client.users.fetch(db._id, { cache: true, force: true });
        }
      } catch {}
    }

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
          await update(ctx.interaction, this.renderContent(ctx.interaction, activeType, dbs, customId, false));
        }
      },
      filter: async (menu) => {
        const context = menu.user.id === command.user.id;
        return context;
      },
      end: async () => {
        await edit(command, this.renderContent(command, activeType, dbs, customId, true));
        return;
      }
    });

    await collector.start();
  }

  protected renderContent(interaction: Command.ChatInputInteraction<'cached'>, page: PageType, dbs: PlayerSchema[], customId: CustomIdentifier<ComponentIdentifiers>, ended: boolean): InteractionMessageContentBuilder<SelectMenuBuilder>;
  protected renderContent(interaction: SelectMenuInteraction<'cached'>, page: PageType, dbs: PlayerSchema[], customId: CustomIdentifier<ComponentIdentifiers>, ended: boolean): InteractionMessageUpdateBuilder<SelectMenuBuilder>;
  protected renderContent(interaction: Command.ChatInputInteraction<'cached'> | SelectMenuInteraction<'cached'>, page: PageType, dbs: PlayerSchema[], customId: CustomIdentifier<ComponentIdentifiers>, ended: boolean): InteractionMessageContentBuilder<SelectMenuBuilder> | InteractionMessageUpdateBuilder<SelectMenuBuilder> {
    const leaderboard = dbs
      .map((db) => ({ db, value: Reflect.apply(Reflect.get(TopCommand.leaderboards, page), null, [db]) }))
      .filter(({ value }) => value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    return Reflect.construct<[], InteractionMessageUpdateBuilder<SelectMenuBuilder> | InteractionMessageContentBuilder<SelectMenuBuilder>>(interaction instanceof SelectMenuInteraction ? InteractionMessageUpdateBuilder : InteractionMessageContentBuilder, [])
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

                  return `${emoji} ${bold(value.toLocaleString())} - ${user?.tag ?? 'Unknown User'}`;
                })
              )
              : 'No players to show.'
          )
          .setFooter({ text: interaction.guild.name, iconURL: getGuildIconURL(interaction.guild) ?? void 0 })
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
    registry.registerChatInputCommand((builder) => 
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption(option => 
          option
            .setName('type')
            .setDescription('The leaderboard you want to view.')
            .addChoices(
              ...Object.entries(PageType).map(([name, value]) => (<APIApplicationCommandOptionChoice<string>>{ name, value }))
            )  
        )
      );
  }
}
