import { Command, ApplicationCommandRegistry, CommandOptionsRunTypeEnum } from '@sapphire/framework';
import { CommandInteraction, Constants } from 'discord.js';
import { ApplyOptions } from '@sapphire/decorators';

import { Collector, join, randomColor, seconds, minutes, SelectMenuBuilder, InteractionMessageContentBuilder, ButtonBuilder, edit, send, ComponentId, getUserAvatarURL } from '#lib/utilities';
import { type Game, GameContext } from '#lib/framework';
import { isNullish, isNullOrUndefined } from '@sapphire/utilities';
import type { PlayerSchema } from '#lib/database';

enum PickerControl {
  Dropdown = 'picker_list',
  Proceed = 'picker_proceed',
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
    if (db.wallet.isMaxValue(db.upgrades.mastery)) {
      return void (await edit(
        command,
        join(
          "You can't play games right now since your wallet is full.",
          `Your limit is ${db.wallet.getMaxValue(db.upgrades.mastery).toLocaleString()} coins.`
        )
      ));
    }

    const componentId = new ComponentId(new Date(command.createdTimestamp));
    const game = await this.chooseGame(command, componentId);
    if (isNullOrUndefined(game)) return;

    const energized = await this.checkEnergy(command, db);
    const play = energized ? await this.promptPlay(command, game) : false;

    return play ? await game.play(new GameContext({ command, db, game })) : void 0;
  }

  private renderGamePickerContent(command: CommandInteraction<'cached'>, componentId: ComponentId, game: Game | null, ended = false) {
    return new InteractionMessageContentBuilder<ButtonBuilder | SelectMenuBuilder>()
      .addRow((row) =>
        row.addSelectMenuComponent((menu) =>
          menu
            .setCustomId(componentId.create(PickerControl.Dropdown).id)
            .setPlaceholder('Select Game')
            .setDisabled(ended)
            .setMaxValues(1)
            .setOptions(
              this.container.stores.get('games').map((g) => ({
                label: g.name,
                value: g.id,
                description: g.description ?? void 0,
                default: g.id === game?.id
              }))
            )
        )
      )
      .addRow((row) =>
        row
          .addButtonComponent((btn) => 
            btn
              .setCustomId(componentId.create(PickerControl.Proceed).id)
              .setStyle(Constants.MessageButtonStyles.SUCCESS)
              .setLabel('Play')
              .setDisabled(isNullish(game))
          )
          .addButtonComponent((btn) =>
            btn
              .setCustomId(componentId.create(PickerControl.Cancel).id)
              .setStyle(Constants.MessageButtonStyles.SECONDARY)
              .setLabel('End Interaction')
              .setDisabled(ended)
          )
      )
      .addEmbed((embed) =>
        embed
          .setTitle('Game Picker')
          .setColor(ended ? Constants.Colors.NOT_QUITE_BLACK : randomColor(true))
          .setDescription(isNullish(game) ? 'Choose a game to play! Use the dropdown below to proceed.' : game.detailedDescription ?? 'No description provided.')
          .setFooter({ text: command.user.tag, iconURL: getUserAvatarURL(command.user) })
      );
  }

  private async chooseGame(command: CommandInteraction<'cached'>, componentId: ComponentId): Promise<Game | null> {
    return new Promise(async (resolve) => {
      const gamesStore = this.container.stores.get('games');
      const selection = new Map<string, Game>();
      const collector = new Collector({
        message: await edit(command, this.renderGamePickerContent(command, componentId, null)),
        // componentType: 'ACTION_ROW',
        max: Infinity,
        time: seconds(60),
        filter: async (component) => {
          const context = component.user.id === command.user.id;
          await component.deferUpdate();
          return context;
        },
        end: ctx => ctx.wasInternallyStopped() ? resolve(null) : void 0
      });

      for (const customId of Object.values(PickerControl)) {
        collector.actions.add(componentId.create(customId).id, async (ctx) => {
          if (ctx.interaction.isSelectMenu()) {
            const gameId = ctx.interaction.values.at(0) ?? null;
            const game = !isNullOrUndefined(gameId) ? gamesStore.find(g => g.id === gameId) : null;

            if (!isNullOrUndefined(game)) {
              await edit(ctx.interaction, this.renderGamePickerContent(command, componentId, game, true));
              selection.set(command.id, game);
              ctx.collector.resetTimer();
              return;
            }
          }

          if (ctx.interaction.isButton()) {
            switch(ctx.interaction.customId) {
              case componentId.create(PickerControl.Proceed).id: {
                const game = selection.get(command.id)!;
                await edit(ctx.interaction, this.renderGamePickerContent(command, componentId, game, true));
                return resolve(game);
              }

              case componentId.create(PickerControl.Cancel).id: {
                await edit(ctx.interaction, this.renderGamePickerContent(command, componentId, null, true));
                ctx.collector.stop(ctx.interaction.customId);
                return resolve(null);
              }
            }
          }
        });
      }

      await collector.start();
    });
  }

  private renderEnergyPrompterMessage(energized: null | boolean) {
    return new InteractionMessageContentBuilder()
      .addEmbed((embed) =>
        embed
          .setTitle(isNullish(energized) || !energized ? 'Energy Dead' : 'Energy Restored')
          .setColor(isNullish(energized) ? Constants.Colors.NOT_QUITE_BLACK : energized ? Constants.Colors.GREEN : Constants.Colors.RED)
          .setDescription(
            isNullish(energized)
              ? 'Your energy expired! You can restore it again by converting the stars you earned from winning games into energy.'
              : energized
                ? 'Your energy has been restored. Goodluck playing!'
                : 'Okay then. Come back next time, I guess.'
          )
      )
      .addRow((row) =>
        row
          .addButtonComponent((btn) =>
            btn
              .setLabel('Use')
              .setDisabled(!isNullish(energized))
              .setCustomId(EnergyControl.Energize)
              .setEmoji('⚡')
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
              .setCustomId(EnergyControl.Cancel)
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
    return new InteractionMessageContentBuilder().addEmbed((embed) =>
      embed.setTitle('Out of Energy').setColor(Constants.Colors.RED).setDescription('You no longer have energy to spend for playing games.')
    );
  }

  private checkEnergy(command: CommandInteraction<'cached'>, db: PlayerSchema.Document): Promise<boolean> {
    return new Promise(async (resolve) => {
      if (!db.energy.isExpired()) return resolve(true);
      if (db.energy.value < 1) {
        await edit(command, this.renderNoEnergyMessage());
        return resolve(false);
      }

      const collector = new Collector({
        message: await edit(command, this.renderEnergyPrompterMessage(null)),
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
            await edit(command, this.renderEnergyPrompterMessage(false));
            return resolve(false);
          }
        }
      });

      collector.actions.add(EnergyControl.Energize, async (ctx) => {
        await db
          .run((db) =>
            db.energy.subEnergy(1).setExpire(Date.now() + minutes(db.energy.getDefaultDuration(db.upgrades.tier)))
          )
          .save();
        await edit(ctx.interaction, this.renderEnergyPrompterMessage(true));
        ctx.collector.stop(ctx.interaction.customId);
        resolve(true);
      });

      collector.actions.add(EnergyControl.Cancel, async (ctx) => {
        await edit(ctx.interaction, this.renderEnergyPrompterMessage(false));
        ctx.collector.stop(ctx.interaction.customId);
        resolve(false);
      });

      await collector.start();
    });
  }

  private renderPrompterMessage(game: Game, command: CommandInteraction<'cached'>, picked: null | boolean) {
    return new InteractionMessageContentBuilder()
      .setAllowedMentions({ users: [command.user.id] })
      .setContent(command.user.toString())
      .addEmbed((embed) =>
        embed
          .setTitle(game.name)
          .setColor(isNullish(picked) ? Constants.Colors.BLURPLE : picked ? Constants.Colors.GREEN : Constants.Colors.RED)
          .setDescription(game.detailedDescription ?? 'No description provided.')
      )
      .addRow((row) =>
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
              .setCustomId(Control.Proceed)
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
              .setCustomId(Control.Cancel)
              .setDisabled(!isNullish(picked))
              .setLabel('Cancel')
          )
      );
  }

  private async promptPlay(command: CommandInteraction<'cached'>, game: Game): Promise<boolean> {
    return new Promise(async (resolve) => {
      const collector = new Collector({
        message: await send(command, this.renderPrompterMessage(game, command, null)),
        componentType: 'BUTTON',
        max: Infinity,
        time: seconds(60),
        filter: async (button) => {
          const context = button.user.id === command.user.id;
          await button.deferUpdate();
          return context;
        }
      });

      collector.actions.add(Control.Proceed, async (ctx) => {
        await edit(ctx.interaction, this.renderPrompterMessage(game, command, true));
        ctx.collector.stop(ctx.interaction.customId);
        return resolve(true);
      });

      collector.actions.add(Control.Cancel, async (ctx) => {
        await edit(ctx.interaction, this.renderPrompterMessage(game, command, false));
        await send(ctx.interaction, 'Ok then.');

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
