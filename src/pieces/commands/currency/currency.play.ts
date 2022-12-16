import { Command, ApplicationCommandRegistry, CommandOptionsRunTypeEnum, Result } from '@sapphire/framework';
import { CommandInteraction, Constants } from 'discord.js';
import { ApplyOptions } from '@sapphire/decorators';

import {
  Collector,
  randomColor,
  seconds,
  minutes,
  SelectMenuBuilder,
  InteractionMessageContentBuilder,
  ButtonBuilder,
  edit,
  ComponentId,
  getUserAvatarURL,
  DeferCommandInteraction
} from '#lib/utilities';
import { type Game, GameContext } from '#lib/framework';
import { isNullish, isNullOrUndefined } from '@sapphire/utilities';
import type { PlayerSchema } from '#lib/database';
import type { MessageSelectOptionData } from 'discord.js';

enum PickerControl {
  Dropdown = 'picker_list',
  Proceed = 'picker_proceed',
  Cancel = 'picker_cancel'
}

enum EnergyControl {
  Energize = 'energy_energize',
  Cancel = 'energy_cancel'
}

@ApplyOptions<Command.Options>({
  name: 'play',
  description: 'Play games to earn coins.',
  runIn: [CommandOptionsRunTypeEnum.GuildText]
})
export default class PlayCommand extends Command {
  @DeferCommandInteraction()
  public override async chatInputRun(command: CommandInteraction<'cached'>) {
    const db = await this.container.db.players.fetch(command.user.id);
    const game = await Result.fromAsync(this.chooseGame(command, Reflect.construct(ComponentId, [new Date(command.createdTimestamp)])));

    return game.inspectAsync(async (game) => {
      if (isNullOrUndefined(game)) return;

      const energized = await Result.fromAsync(this.checkEnergy(command, db));
      const context = Reflect.construct(GameContext, [{ command, db, game }]);

      await Result.fromAsync(energized.unwrap() ? game.play(context) : Promise.resolve(void 0));
    });
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
              this.container.stores.get('games').map(
                (g) =>
                  <MessageSelectOptionData>{
                    label: g.name,
                    value: g.id,
                    description: g.description ?? void 0,
                    default: g.id === game?.id
                  }
              )
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
              .setDisabled(isNullish(game) || ended)
          )
          .addButtonComponent((btn) =>
            btn
              .setCustomId(componentId.create(PickerControl.Cancel).id)
              .setStyle(Constants.MessageButtonStyles.SECONDARY)
              .setLabel('Cancel')
              .setDisabled(ended)
          )
      )
      .addEmbed((embed) =>
        embed
          .setTitle(isNullish(game) ? 'Game Picker' : game.name)
          .setColor(ended ? Constants.Colors.NOT_QUITE_BLACK : randomColor(true))
          .setDescription(
            isNullish(game) ? 'Choose a game to play! Use the dropdown below to proceed.' : game.detailedDescription ?? 'No description provided.'
          )
          .setFooter({ text: command.user.tag, iconURL: getUserAvatarURL(command.user) })
      );
  }

  private async chooseGame(command: CommandInteraction<'cached'>, componentId: ComponentId): Promise<Game | null> {
    return new Promise(async (resolve) => {
      const gamesStore = this.container.stores.get('games');
      const selection = new Map<string, Game>();
      const collector = new Collector({
        message: await edit(command, this.renderGamePickerContent(command, componentId, null)),
        max: Infinity,
        time: seconds(60),
        filter: async (component) => {
          const context = component.user.id === command.user.id;
          await component.deferUpdate();
          return context;
        },
        end: (ctx) => (ctx.wasInternallyStopped() ? resolve(null) : void 0)
      });

      for (const customId of Object.values(PickerControl)) {
        collector.actions.add(componentId.create(customId).id, async (ctx) => {
          if (ctx.interaction.isSelectMenu()) {
            const gameId = ctx.interaction.values.at(0) ?? null;
            const game = !isNullOrUndefined(gameId) ? gamesStore.find((g) => g.id === gameId) : null;

            if (!isNullOrUndefined(game)) {
              await edit(ctx.interaction, this.renderGamePickerContent(command, componentId, game));
              selection.set(command.id, game);
              ctx.collector.resetTimer();
              return;
            }
          }

          if (ctx.interaction.isButton()) {
            switch (ctx.interaction.customId) {
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
          .setTitle(isNullish(energized) || !energized ? 'Energy Dead' : 'Energy Recharged')
          .setColor(isNullish(energized) ? Constants.Colors.NOT_QUITE_BLACK : energized ? Constants.Colors.GREEN : Constants.Colors.RED)
          .setDescription(
            isNullish(energized)
              ? 'Your energy expired! Restore it by converting to energy the stars you earned from winning previous games.'
              : energized
              ? 'Your energy has been recharged. Goodluck playing!'
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
              .setEmoji('❌')
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
        actions: {
          [EnergyControl.Energize]: async (ctx) => {
            await db.run((db) => db.energy.subEnergy(1).setExpire(Date.now() + minutes(db.energy.getDefaultDuration(db.upgrades.tier)))).save();
            await edit(ctx.interaction, this.renderEnergyPrompterMessage(true));
            ctx.collector.stop(ctx.interaction.customId);
            resolve(true);
          },
          [EnergyControl.Cancel]: async (ctx) => {
            await edit(ctx.interaction, this.renderEnergyPrompterMessage(false));
            ctx.collector.stop(ctx.interaction.customId);
            resolve(false);
          }
        },
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

      await collector.start();
    });
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) => builder.setName(this.name).setDescription(this.description));
  }
}
