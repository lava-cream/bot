import { Command, ApplicationCommandRegistry, CommandOptionsRunTypeEnum } from '@sapphire/framework';
import { CommandInteraction, Constants } from 'discord.js';
import { ApplyOptions } from '@sapphire/decorators';

import { createComponentId, Collector, join, MessageContentBuilder, randomColor, seconds, minutes } from '#lib/utilities';
import type { MessageOptions } from 'discord.js';
import { type Game, GameContext } from '#lib/framework';
import { isNullish } from '@sapphire/utilities';

enum PickerControl {
  Dropdown = 'picker_list',
  Cancel = 'picker_cancel'
}

enum EnergyControl {
  Energize = 'energy_energize',
  Cancel = 'energy_cancel'
}

enum Control {
  Proceed = 'game_proceed',
  Cancel = 'game_cancel'
}

@ApplyOptions<Command.Options>({
  name: 'play',
  description: 'Play games to earn coins.',
  runIn: [CommandOptionsRunTypeEnum.GuildText]
})
export default class PlayCommand extends Command {
  public override async chatInputRun(command: CommandInteraction<'cached'>) {
    await command.deferReply();

    const db = await this.container.db.players.fetch(command.user.id);
    if (db.wallet.isMaximumValue(db.upgrades.mastery.value)) {
      return void (await command.editReply(
        join(
          "You can't play now since you're already rich.",
          `The limit is ${db.wallet.getMaximumValue(db.upgrades.mastery.value).toLocaleString()} coins.`
        )
      ));
    }

    const game = await this.chooseGame(command);
    if (!game) return;

    const energized = await this.checkEnergy(command, game);
    if (!energized) return;

    const play = await this.promptPlay(command, game);
    if (!play) return;

    // return await game.play(new GameContext({ command, db, game }));
  }

  private renderGamePickerContent(command: CommandInteraction<'cached'>, ended = false): MessageOptions {
    const date = new Date(command.createdTimestamp);

    return new MessageContentBuilder()
      .addComponentRow((row) =>
        row.addSelectMenuComponent((menu) =>
          menu
            .setCustomId(createComponentId({ date, customId: PickerControl.Dropdown }).customId)
            .setPlaceholder('Select Game')
            .setDisabled(ended)
            .setMaxValues(1)
            .setOptions(
              this.container.stores.get('games').map((game) => ({
                label: game.name,
                value: game.id,
                description: game.description ?? void 0
              }))
            )
        )
      )
      .addComponentRow((row) =>
        row.addButtonComponent((btn) =>
          btn
            .setCustomId(createComponentId({ date, customId: PickerControl.Cancel }).customId)
            .setStyle(Constants.MessageButtonStyles.SECONDARY)
            .setLabel('End Interaction')
            .setDisabled(ended)
        )
      )
      .addEmbed((embed) =>
        embed
          .setTitle('Game Picker')
          .setColor(randomColor(true))
          .setDescription(join('Choose a game to play! Use the dropdown below to proceed.', 'Will choose a random one if you refuse to pick.'))
      );
  }

  private async chooseGame(command: CommandInteraction<'cached'>): Promise<Game | null> {
    return new Promise(async (resolve) => {
      const gamesStore = this.container.stores.get('games');
      const collector = new Collector({
        message: await command.editReply(this.renderGamePickerContent(command)),
        componentType: 'ACTION_ROW',
        max: Infinity,
        time: seconds(60),
        filter: async (menu) => {
          const context = menu.user.id === command.user.id;
          await menu.deferUpdate();
          return context;
        }
      });

      for (const customId of Object.values(Control)) {
        const componentId = createComponentId({ customId, date: new Date(command.createdTimestamp) });

        collector.actions.add(componentId.customId, async (ctx) => {
          if (ctx.interaction.isSelectMenu()) {
            for (const game of gamesStore.values()) {
              if (ctx.interaction.values.at(0) === game.id) {
                ctx.collector.stop(game.id);
                return resolve(game);
              }
            }
          }

          if (ctx.interaction.isButton()) {
            await ctx.interaction.editReply(this.renderGamePickerContent(command, true));
            ctx.collector.stop(ctx.interaction.customId);
            return resolve(null);
          }
        });
      }

      collector.setEndAction((ctx) => (ctx.wasInternallyStopped() ? resolve(null) : void 0));

      await collector.start();
    });
  }

  private renderEnergyPrompterMessage(energized: null | boolean) {
    return new MessageContentBuilder()
      .addEmbed((embed) =>
        embed
          .setTitle(isNullish(energized) || !energized ? 'Energy Dead' : 'Energy Restored')
          .setColor(isNullish(energized) ? Constants.Colors.NOT_QUITE_BLACK : energized ? Constants.Colors.GREEN : Constants.Colors.RED)
          .setDescription(
            isNullish(energized)
              ? 'Your energy died! You can restore it again by converting stars you earned from winning games into energy.'
              : energized
              ? 'Your energy has been restored. Goodluck playing!'
              : 'Okay then. Come back next time, I guess.'
          )
      )
      .addComponentRow((row) =>
        row
          .addButtonComponent((btn) =>
            btn
              .setLabel('1 Energy')
              .setDisabled(!isNullish(energized))
              .setCustomId(MessageComponentIdentifiers.EnergyProceed)
              .setStyle(
                isNullish(energized)
                  ? Constants.MessageButtonStyles.PRIMARY
                  : energized
                  ? Constants.MessageButtonStyles.SUCCESS
                  : Constants.MessageButtonStyles.SECONDARY
              )
          )
          .addButtonComponent((btn) =>
            btn
              .setLabel('Cancel')
              .setDisabled(!isNullish(energized))
              .setCustomId(MessageComponentIdentifiers.EnergyCancel)
              .setStyle(
                isNullish(energized)
                  ? Constants.MessageButtonStyles.PRIMARY
                  : energized
                  ? Constants.MessageButtonStyles.SECONDARY
                  : Constants.MessageButtonStyles.SUCCESS
              )
          )
      );
  }

  private renderNoEnergyMessage() {
    return new MessageContentBuilder().addEmbed((embed) =>
      embed.setTitle('Out of Energy').setColor(Constants.Colors.RED).setDescription('You no longer have energy to spend for playing games.')
    );
  }

  private checkEnergy(command: CommandInteraction<'cached'>, game: Game): Promise<boolean> {
    return new Promise(async (resolve) => {
      const db = await this.container.db.players.fetch(command.user.id);

      if (!db.energy.isExpired()) return resolve(true);
      if (db.energy.value < 1) {
        await command.editReply(this.renderNoEnergyMessage());
        return resolve(false);
      }

      const collector = new Collector({
        message: await command.editReply(this.renderEnergyPrompterMessage(null)),
        componentType: 'BUTTON',
        max: Infinity,
        time: seconds(60),
        filter: async (button) => {
          const context = button.user.id === command.user.id;
          await button.deferUpdate();
          return context;
        },
        end: async (ctx) => {
          if (ctx.wasInternallyStopped()) {
            await ctx.message.edit(this.renderEnergyPrompterMessage(false));
            return resolve(false);
          }
        }
      });

      collector.actions.add(MessageComponentIdentifiers.EnergyProceed, async (ctx) => {
        await db
          .run((db) =>
            db.energy.update({ value: db.energy.value - 1, expire: Date.now() + minutes(db.energy.getDefaultDuration(db.upgrades.tier.value)) })
          )
          .save();
        await ctx.interaction.editReply(this.renderEnergyPrompterMessage(true));
        ctx.collector.stop(ctx.interaction.customId);
        resolve(true);
      });

      collector.actions.add(MessageComponentIdentifiers.EnergyCancel, async (ctx) => {
        await ctx.interaction.editReply(this.renderEnergyPrompterMessage(false));
        ctx.collector.stop(ctx.interaction.customId);
        resolve(false);
      });

      await collector.start();
    });
  }

  private renderPrompterMessage(game: Game, command: CommandInteraction<'cached'>, picked: null | boolean) {
    return new MessageContentBuilder()
      .setAllowedMentions({ users: [command.user.id] })
      .setContent(command.user.toString())
      .addEmbed((embed) =>
        embed
          .setTitle(game.name)
          .setColor(isNullish(picked) ? Constants.Colors.BLURPLE : picked ? Constants.Colors.GREEN : Constants.Colors.RED)
          .setDescription(game.detailedDescription ?? 'No description provided.')
      )
      .addComponentRow((row) =>
        row
          .addButtonComponent((button) =>
            button
              .setStyle(
                isNullish(picked)
                  ? Constants.MessageButtonStyles.PRIMARY
                  : picked
                  ? Constants.MessageButtonStyles.SUCCESS
                  : Constants.MessageButtonStyles.SECONDARY
              )
              .setCustomId(MessageComponentIdentifiers.Proceed)
              .setDisabled(!isNullish(picked))
              .setLabel('Play')
          )
          .addButtonComponent((button) =>
            button
              .setStyle(
                isNullish(picked)
                  ? Constants.MessageButtonStyles.PRIMARY
                  : !picked
                  ? Constants.MessageButtonStyles.SUCCESS
                  : Constants.MessageButtonStyles.SECONDARY
              )
              .setCustomId(MessageComponentIdentifiers.Cancel)
              .setDisabled(!isNullish(picked))
              .setLabel('Cancel')
          )
      );
  }

  private async promptPlay(command: CommandInteraction<'cached'>, game): Promise<boolean> {
    return new Promise(async (resolve) => {
      const collector = new Collector({
        message: await command.followUp(this.renderPrompterMessage(game, command, null)),
        componentType: 'BUTTON',
        max: Infinity,
        time: seconds(60),
        filter: async (button) => {
          const context = button.user.id === command.user.id;
          await button.deferUpdate();
          return context;
        }
      });

      collector.actions.add(MessageComponentIdentifiers.Proceed, async (ctx) => {
        await ctx.interaction.editReply(this.renderPrompterMessage(game, command, true));
        ctx.collector.stop(ctx.interaction.customId);
        return resolve(true);
      });

      collector.actions.add(MessageComponentIdentifiers.Cancel, async (ctx) => {
        await ctx.interaction.editReply(this.renderPrompterMessage(game, command, false));
        await ctx.interaction.followUp('Ok, weirdo.');

        ctx.collector.stop(ctx.interaction.customId);
        return resolve(false);
      });

      await collector.start();
    });
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) => builder.setName(this.name).setDescription(this.description));
  }
}
