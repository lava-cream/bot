import { Game } from '#lib/framework/index.js';
import { ApplyOptions } from '@sapphire/decorators';

import { join, seconds, getUserAvatarURL, Collector, InteractionMessageContentBuilder, ButtonBuilder, edit, roundZero, EmbedTemplates } from '#lib/utilities';
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
    const logic = new Highlow.Logic(1, 10);
    const collector = new Collector({
      message: await context.responder.send(() => HighlowGame.renderContent(context, logic, null)),
      componentType: 'BUTTON',
      max: Infinity,
      time: seconds(10),
      filter: async (button) => {
        const contextual = button.user.id === context.command.user.id;
        await button.deferUpdate();
        return contextual;
      },
      end: async (ctx) => {
        if (ctx.wasInternallyStopped()) {
          await context.responder.edit(() => HighlowGame.renderContent(context, logic, null, true));
          await context.end(true);
          return;
        }

        await context.end();
      }
    });

    for (const componentId of Object.values(Control)) {
      collector.actions.add(context.customId.create(componentId), async (ctx) => {
        switch (componentId) {
          case Control.HIGHER: {
            logic.setGuess.call(logic, Highlow.Guess.HIGHER);
            break;
          };

          case Control.JACKPOT: {
            logic.setGuess.call(logic, Highlow.Guess.JACKPOT);
            break;
          };

          case Control.LOWER: {
            logic.setGuess.call(logic, Highlow.Guess.LOWER);
            break;
          };

          default: {
            logic.setGuess.call(logic, Highlow.Guess.NONE);
            break;
          };
        }

        if (!logic.hasGuessed()) return;

        const winnings = roundZero(context.winnings
          .setBase(logic.isJackpot() ? 10 : 0.75)
          .setMultiplier(logic.isJackpot() ? 0 : Math.random() * 0.5)
          .setRandom(logic.isJackpot() ? 0 : context.db.multiplier.value)
          .calculate(context.db.bet.value));

        switch (true) {
          case logic.isJackpot():
          case logic.isWin(): {
            await context.db
              .run(db => {
                context.schema.win(winnings);
                db.wallet.addValue(winnings);
                db.bank.space.addValue(winnings);
                db.energy.addValue();
              })
              .save();
            break;
          };

          case logic.isLose(): {
            await context.db
              .run(db => {
                context.schema.lose(db.bet.value);
                db.wallet.subValue(db.bet.value);
                db.energy.subValue();
              })
              .save();
            break;
          };
        }

        await edit(ctx.interaction, HighlowGame.renderContent(context, logic, winnings, true));
        return ctx.stop();
      });
    }

    await collector.start();
  }

  private static renderContent(context: Game.Context, logic: Highlow.Logic, winnings: number | null, ended = false) {
    return new InteractionMessageContentBuilder<ButtonBuilder>()
      .addEmbed(() =>
        EmbedTemplates.createCamouflaged(embed =>
          embed
            .setAuthor({
              iconURL: getUserAvatarURL(context.command.user),
              name: `${context.command.user.username}'s ${!logic.hasGuessed() ? '' : logic.isJackpot() ? 'jackpot ' : logic.isWin() ? 'winning ' : 'losing '
                }high-low game`
            })
            .setColor(
              !logic.hasGuessed() && !ended
                ? Constants.Colors.BLURPLE
                : logic.isJackpot() || logic.isWin() ? logic.isJackpot() ? Constants.Colors.GOLD : Constants.Colors.GREEN : ended ? Constants.Colors.RED : embed.color!
            )
            .setFooter(
              !logic.hasGuessed() || !ended
                ? null
                : context.schema.wins.streak.isActive() || context.schema.loses.streak.isActive()
                  ? { text: `${logic.isWin() || logic.isJackpot() ? 'Win' : 'Lose'} Streak: ${Reflect.get(context.schema, logic.isWin() || logic.isJackpot() ? 'wins' : 'loses').streak.display}` }
                  : null
            )
            .setDescription(
              !logic.hasGuessed()
                ? !ended
                  ? join(
                    `You placed ${bold(context.db.bet.value.toLocaleString())} coins.\n`,
                    `I just chose a secret number between ${logic.min} and ${logic.max}.`,
                    `Is the secret number ${italic('higher')} or ${italic('lower')} than ${bold(logic.hint.toLocaleString())}?`
                  )
                  : join("You didn't respond in time. You are keeping your money.\n", `You have ${bold(context.db.wallet.value.toLocaleString())} coins still.`)
                : join(
                  bold(`${logic.isJackpot() ? 'JACKPOT! ' : ''}You ${logic.isLose() ? 'lost' : 'won'} ${(logic.isLose() ? context.db.bet.value : (winnings ?? 0)).toLocaleString()
                    } coins${logic.isWin() ? '!' : '.'}\n`),
                  `Your hint was ${bold(logic.hint.toLocaleString())}. The hidden number was ${bold(logic.value.toLocaleString())}.`,
                  `You now have ${bold(context.db.wallet.value.toLocaleString())} coins.`
                )
            )
        )
      )
      .addRow((row) =>
        Object.values(Control).reduce(
          (row, customId) =>
            row.addButtonComponent((btn) =>
              btn
                .setCustomId(context.customId.create(customId))
                .setLabel(customId === Control.JACKPOT ? 'JACKPOT!' : toTitleCase(customId))
                .setDisabled(ended)
                .setStyle(
                  !logic.hasGuessed() && !ended
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
}
