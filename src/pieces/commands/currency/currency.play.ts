import { Command, ApplicationCommandRegistry, CommandOptionsRunTypeEnum, Result } from '@sapphire/framework';
import { Constants } from 'discord.js';
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
  CustomId,
  getUserAvatarURL,
  DeferCommandInteraction
} from '#lib/utilities';
import { type Game, GameContext, Games } from '#lib/framework';
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
  public override async chatInputRun(command: Command.ChatInputInteraction<'cached'>) {
    const db = await this.container.db.players.fetch(command.user.id);
    const customId = Reflect.construct(CustomId, [command.createdAt]);
    const game = await Result.fromAsync(this.chooseGame(command, db, customId));

    return game.inspectAsync(async (game) => {
      if (isNullOrUndefined(game)) return;

      const energized = await Result.fromAsync(this.checkEnergy(command, db, customId));
      const context = Reflect.construct(GameContext, [{ command, db, game }]);
      if (energized.isOk() && energized.unwrap()) return await context.play();
    });
  }

  private renderGamePickerContent(command: Command.ChatInputInteraction<'cached'>, componentId: CustomId, game: Game | null, ended = false) {
    return new InteractionMessageContentBuilder<ButtonBuilder | SelectMenuBuilder>()
      .addRow((row) =>
        row.addSelectMenuComponent((menu) =>
          menu
            .setCustomId(componentId.create(PickerControl.Dropdown))
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
              .setCustomId(componentId.create(PickerControl.Proceed))
              .setStyle(Constants.MessageButtonStyles.SUCCESS)
              .setLabel('Play')
              .setDisabled(isNullish(game) || ended)
          )
          .addButtonComponent((btn) =>
            btn
              .setCustomId(componentId.create(PickerControl.Cancel))
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
            isNullish(game) ? 'Choose a game to play from the dropdown below.' : game.detailedDescription ?? 'No description provided.'
          )
          .setFooter({ text: command.user.tag, iconURL: getUserAvatarURL(command.user) })
      );
  }

  private async chooseGame(command: Command.ChatInputInteraction<'cached'>, db: PlayerSchema.Document, componentId: CustomId): Promise<Game | null> {
    return new Promise(async (resolve) => {
      const gamesStore = this.container.stores.get('games');
      const selection = new Map<string, Game>();
      const collector = new Collector({
        message: await edit(command, this.renderGamePickerContent(command, componentId, !isNullOrUndefined(db.games.lastGamePlayed) ? gamesStore.get(db.games.lastGamePlayed.id) : null)),
        max: Infinity,
        time: seconds(60),
        filter: async (component) => {
          const context = component.user.id === command.user.id;
          await component.deferUpdate();
          return context;
        },
        end: (ctx) => (ctx.wasInternallyStopped() ? resolve(null) : void 0)
      });

      if (!isNullOrUndefined(db.games.lastGamePlayed)) {
        selection.set(command.user.id, gamesStore.get(db.games.lastGamePlayed.id));
      }

      for (const customId of Object.values(PickerControl)) {
        collector.actions.add(componentId.create(customId), async (ctx) => {
          if (ctx.interaction.isSelectMenu()) {
            const gameId = ctx.interaction.values.at(0) as Games.Keys ?? null;
            const game = !isNullOrUndefined(gameId) ? gamesStore.get(gameId) : null;

            if (!isNullOrUndefined(game)) {
              await edit(ctx.interaction, this.renderGamePickerContent(command, componentId, game));
              selection.set(command.user.id, game);
              ctx.collector.resetTimer();
              return;
            }
          }

          if (ctx.interaction.isButton()) {
            switch (ctx.interaction.customId) {
              case componentId.create(PickerControl.Proceed): {
                const game = selection.get(command.user.id);
                if (isNullOrUndefined(game)) return;

                await db.run(db => db.games.setLastPlayed(game.id, command.createdAt)).save();
                await edit(ctx.interaction, this.renderGamePickerContent(command, componentId, game, true));
                ctx.collector.stop(ctx.interaction.customId);
                return resolve(game);
              }

              case componentId.create(PickerControl.Cancel): {
                await edit(ctx.interaction, this.renderGamePickerContent(command, componentId, selection.get(command.user.id) ?? null, true));
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

  private renderEnergyPrompterMessage(customId: CustomId, energized: null | boolean) {
    return new InteractionMessageContentBuilder()
      .addEmbed((embed) =>
        embed
          .setTitle(isNullish(energized) || !energized ? 'Energy Expired' : 'Energy Recharged')
          .setColor(isNullish(energized) ? Constants.Colors.NOT_QUITE_BLACK : energized ? Constants.Colors.GREEN : Constants.Colors.RED)
          .setDescription(
            isNullish(energized)
              ? 'Your energy expired! Convert the stars you currently have into energy.'
              : energized
              ? 'Your energy has been recharged. Goodluck playing!'
              : 'Okay then. Come back next time, I guess.'
          )
      )
      .addRow((row) =>
        row
          .addButtonComponent((btn) =>
            btn
              .setLabel('Recharge')
              .setDisabled(!isNullish(energized))
              .setCustomId(customId.create(EnergyControl.Energize))
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
              .setCustomId(customId.create(EnergyControl.Cancel))
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

  private checkEnergy(command: Command.ChatInputInteraction<'cached'>, db: PlayerSchema.Document, customId: CustomId): Promise<boolean> {
    return new Promise(async (resolve) => {
      if (!db.energy.isExpired()) return resolve(true);
      if (db.energy.energy < 1) {
        await edit(command, this.renderNoEnergyMessage());
        return resolve(false);
      }

      const collector = new Collector({
        message: await edit(command, this.renderEnergyPrompterMessage(customId, null)),
        componentType: 'BUTTON',
        max: Infinity,
        time: seconds(60),
        actions: {
          [customId.create(EnergyControl.Energize)]: async (ctx) => {
            await db.run((db) => db.energy.subEnergy(1).setExpire(Date.now() + minutes(db.energy.getDefaultDuration(db.upgrades.tier)))).save();
            await edit(ctx.interaction, this.renderEnergyPrompterMessage(customId, true));
            ctx.collector.stop(ctx.interaction.customId);
            resolve(true);
          },
          [customId.create(EnergyControl.Cancel)]: async (ctx) => {
            await edit(ctx.interaction, this.renderEnergyPrompterMessage(customId, false));
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
            await edit(command, this.renderEnergyPrompterMessage(customId, false));
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
