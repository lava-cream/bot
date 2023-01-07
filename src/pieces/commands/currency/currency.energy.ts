import { Command, ApplicationCommandRegistry, CommandOptionsRunTypeEnum } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';

import { bold, time, TimestampStyles } from '@discordjs/builders';
import { join, edit, InteractionMessageContentBuilder, CustomId, Collector, seconds, minutes, send, update, EmbedTemplates } from '#lib/utilities';
import { ButtonInteraction, Constants } from 'discord.js';
import type { PlayerSchema } from '#lib/database';

@ApplyOptions<Command.Options>({
  name: 'energy',
  description: 'Your energy information.',
  runIn: [CommandOptionsRunTypeEnum.GuildText]
})
export default class EnergyCommand extends Command {
  public override async chatInputRun(command: Command.ChatInputInteraction<'cached'>) {
    const db = await this.container.db.players.fetch(command.user.id);
    const componentId = new CustomId(new Date(command.createdTimestamp));

    if (!db.energy.isExpired()) {
      await send(command, EnergyCommand.renderContent(command, db, componentId, true, true));
      return;
    }

    const collector = new Collector({
      message: await send(command, EnergyCommand.renderContent(command, db, componentId, false, false)),
      componentType: 'BUTTON',
      max: Infinity,
      time: seconds(10),
      actions: {
        [componentId.create('energize')]: async ctx => {
          if (db.energy.energy < 1) {
            await send(ctx.interaction, EnergyCommand.renderNoEnergyContent());
            return;
          }

          await db.run((db) => db.energy.subEnergy(1).setExpire(Date.now() + minutes(db.energy.getDefaultDuration(db.upgrades.tier)))).save();
          await update(ctx.interaction, EnergyCommand.renderContent(ctx.interaction, db, componentId, true, true));
          return ctx.stop();
        }
      },
      filter: async (btn) => {
        const contextual = btn.user.id === command.user.id;
        return contextual;
      },
      end: async (ctx) => {
        if (ctx.wasInternallyStopped()) {
          await edit(command, EnergyCommand.renderContent(command, db, componentId, false, true));
          return;
        }
      }
    });

    await collector.start();
  }

  private static renderContent(interaction: Command.ChatInputInteraction<'cached'> | ButtonInteraction<'cached'>, db: PlayerSchema, componentId: CustomId, energized: boolean, ended: boolean) {
    return new InteractionMessageContentBuilder()
      .addEmbed((embed) =>
        embed
          .setTitle(`${interaction.user.username}'s energy`)
          .setColor(energized && ended ? Constants.Colors.DARK_GOLD : Constants.Colors.DARK_BUT_NOT_BLACK)
          .setDescription(
            join(
              `${bold('⭐ Stars:')} ${db.energy.toLocaleString()}`,
              `${bold('⚡ Energy:')} ${db.energy.energy.toLocaleString()}\n`,
              `Expire${db.energy.isExpired() ? 'd' : 's'} ${time(new Date(db.energy.expire), TimestampStyles.RelativeTime)}`
            )
          )
      )
      .addRow((row) =>
        row.addButtonComponent((btn) =>
          btn
            .setCustomId(componentId.create('energize'))
            .setStyle(Constants.MessageButtonStyles.SECONDARY)
            .setEmoji('⚡')
            .setDisabled(ended)
        )
      );
  }

  private static renderNoEnergyContent() {
    return new InteractionMessageContentBuilder().addEmbed(() =>
      EmbedTemplates.createSimple('You have no energy remaining to spend.')
    )
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
      , {
        idHints: ['1050341971127959582']
    });
  }
}
