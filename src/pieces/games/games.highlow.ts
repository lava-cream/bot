import { Game } from '#lib/framework/index.js';
import { ApplyOptions } from '@sapphire/decorators';

import { join, percent, seconds, getUserAvatarURL, randomNumber, Collector, InteractionMessageContentBuilder, ButtonBuilder } from '#lib/utilities';
import * as Highlow from '#lib/utilities/games/highlow/index.js';
import { toTitleCase } from '@sapphire/utilities';
import { Constants } from 'discord.js';
import { bold, italic } from '@discordjs/builders';

enum Control {
  LOWER = 'lower',
  JACKPOT = 'jackpot',
  HIGHER = 'higher'
}

declare module '#lib/framework/structures/game/game.types' {
  interface Games {
    highlow: never;
  }
}

@ApplyOptions<Game.Options>({
  id: 'highlow',
  name: 'Highlow',
  description: 'Your favorite assorted event game has finally arrived!',
  detailedDescription: 'Experience one of the most successful event game here in Memers Crib. You are one step away from disaster!'
})
export default class HighlowGame extends Game {
  public async play(context: Game.Context) {
    const logic = new Highlow.Logic(1, 100);

    try {
      await context.edit(this.renderMainContent(context, logic, { raw: 0, final: 0 }));
      await this.awaitAction(context, logic);
      await context.end();
    } catch {
      await context.end(true);
    }
  }

  public renderMainContent(context: Game.Context, logic: Highlow.Logic, winnings: Game.CalculatedWinnings) {
    return new InteractionMessageContentBuilder<ButtonBuilder>()
      .addEmbed((embed) =>
        embed
          .setAuthor({
            iconURL: getUserAvatarURL(context.command.user),
            name: `${context.command.user.username}'s ${
              !logic.hasGuessed() ? '' : logic.isJackpot() ? 'jackpot' : logic.isWin() ? 'winning' : 'losing'
            } high-low game`
          })
          .setColor(
            logic.isJackpot() || logic.isWin() ? Constants.Colors.GREEN : logic.isLose() ? Constants.Colors.RED : Constants.Colors.NOT_QUITE_BLACK
          )
          .setFooter(
            !logic.hasGuessed()
              ? null
              : { text: logic.isWin() || logic.isJackpot() ? `Percent Won: ${percent(winnings.final, context.db.bet.value)}` : 'loser loser' }
          )
          .setDescription(
            !logic.hasGuessed()
              ? join(
                  `You placed ${bold(context.db.bet.value.toLocaleString())} coins.\n`,
                  `I just chose a secret number between ${logic.min} and ${logic.max}.`,
                  `Is the secret number ${italic('higher')} or ${italic('lower')} than ${bold(logic.hint.toLocaleString())}.`
                )
              : join(
                  `${logic.isJackpot() ? bold('JACKPOT! ') : ''}You ${logic.isLose() ? 'lost' : 'won'} ${bold(
                    (logic.isLose() ? context.db.bet.value : winnings.final).toLocaleString()
                  )} coins.`,
                  `Your hint was ${bold(logic.hint.toLocaleString())}. The hidden number was ${bold(logic.value.toLocaleString())}.`,
                  `You now have ${bold(context.db.wallet.value.toLocaleString())} coins.`
                )
          )
      )
      .addRow((row) =>
        Object.values(Control).reduce(
          (row, customId) =>
            row.addButtonComponent((btn) =>
              btn
                .setCustomId(context.customId.create(customId).id)
                .setLabel(customId === Control.JACKPOT ? 'JACKPOT!' : toTitleCase(customId))
                .setDisabled(logic.hasGuessed())
                .setStyle(
                  !logic.hasGuessed()
                    ? Constants.MessageButtonStyles.PRIMARY
                    : (logic.guess === Highlow.Guess.HIGHER && customId === Control.HIGHER) ||
                      (logic.guess === Highlow.Guess.JACKPOT && customId === Control.JACKPOT) ||
                      (logic.guess === Highlow.Guess.LOWER && customId === Control.LOWER)
                    ? logic.isWin() || logic.isJackpot()
                      ? Constants.MessageButtonStyles.SUCCESS
                      : Constants.MessageButtonStyles.DANGER
                    : Constants.MessageButtonStyles.SECONDARY
                )
            ),
          row
        )
      );
  }

  public async awaitAction(context: Game.Context, logic: Highlow.Logic) {
    return new Promise<void>(async (resolve, reject) => {
      const collector = new Collector({
        message: await context.command.fetchReply(),
        componentType: 'BUTTON',
        max: Infinity,
        time: seconds(10),
        filter: async (button) => {
          const contextual = button.user.id === context.command.user.id;
          await button.deferUpdate();
          return contextual;
        },
        end: ctx => ctx.wasInternallyStopped() ? resolve() : reject()
      });

      for (const componentId of Object.values(Control)) {
        const customId = context.customId.create(componentId);

        collector.actions.add(customId.id, async (ctx) => {
          switch (customId.id) {
            case Control.HIGHER: {
              const winnings = Game.calculateWinnings({
                base: 0.5,
                bet: context.db.bet.value,
                multiplier: context.db.multiplier.value,
                random: randomNumber(1, 10) / 10
              });

              logic.setGuess(Highlow.Guess.HIGHER);
              await context.db
                .run((db) => {
                  db.wallet.addValue(logic.isWin() ? winnings.final : -db.bet.value);
                  db.energy.addValue(+!db.energy.isMaxStars());
                })
                .save();
              await ctx.interaction.editReply(this.renderMainContent(context, logic, winnings));

              ctx.collector.stop(ctx.interaction.customId);
              break;
            }

            case Control.JACKPOT: {
              const winnings = Game.calculateWinnings({
                base: 100,
                bet: context.db.bet.value,
                multiplier: context.db.multiplier.value,
                random: 0
              });

              logic.setGuess(Highlow.Guess.JACKPOT);
              await context.db
                .run((db) => db.wallet.addValue(logic.isJackpot() ? winnings.final : -db.bet.value))
                .save();
              await ctx.interaction.editReply(this.renderMainContent(context, logic, winnings));

              ctx.collector.stop(ctx.interaction.customId);
              break;
            }

            case Control.LOWER: {
              const winnings = Game.calculateWinnings({
                base: 0.5,
                bet: context.db.bet.value,
                multiplier: context.db.multiplier.value,
                random: randomNumber(1, 10) / 10
              });

              logic.setGuess(Highlow.Guess.LOWER);
              await context.db.run((db) => db.wallet.addValue(logic.isWin() ? winnings.final : -db.bet.value)).save();
              await ctx.interaction.editReply(this.renderMainContent(context, logic, winnings));

              ctx.collector.stop(ctx.interaction.customId);
              break;
            }
          }
        });
      }

      await collector.start();
    });
  }
}
