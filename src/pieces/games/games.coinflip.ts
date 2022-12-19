import { Game } from '#lib/framework/index.js';
import { ApplyOptions } from '@sapphire/decorators';

import * as Common from '#lib/utilities/common/index.js';
import * as Discord from '#lib/utilities/discord/index.js';
import * as Coinflip from '#lib/utilities/games/coinflip/index.js';
import { bold } from '@discordjs/builders';
import { toTitleCase } from '@sapphire/utilities';
import { Constants } from 'discord.js';
import { checkClientReadyStatus, edit, InteractionMessageContentBuilder, percent } from '#lib/utilities';

declare module '#lib/framework/structures/game/game.types' {
  interface Games {
    coinflip: never;
  }
}

@ApplyOptions<Game.Options>({
  id: 'coinflip',
  name: 'Coin Flip',
  description: 'Flip a coin!',
  detailedDescription: "Classic coinflip that either makes you profit or lose a lot. It's balanced as all things should be."
})
export default class CoinFlipGame extends Game {
  public async play(context: Game.Context) {
    checkClientReadyStatus(context.command.client);

    const game = new Coinflip.Logic(context.command.user, context.command.client.user);
    const collector = new Discord.Collector({
      message: await context.respond(this.renderMainContent(context, game, false)),
      componentType: 'BUTTON',
      max: Infinity,
      time: Common.seconds(10),
      filter: async (button) => {
        const contextual = button.user.id === context.command.user.id;
        await button.deferUpdate();
        return contextual;
      },
      end: async (ctx) => {
        if (ctx.wasInternallyStopped()) {
          await context.db.run((db) => db.wallet.subValue(context.db.bet.value)).save();
          await context.edit(this.renderMainContent(context, game, true));
          await context.end(true);
          return;
        }

        await context.end();
      }
    });

    for (const side of Object.values(Coinflip.Side)) {
      collector.actions.add(context.customId.create(side).id, async (ctx) => {
        game.pick.call(game, side);

        switch (true) {
          case game.isWin(): {
            // 25% (0.25) to 175% (1.5+0.25)
            const won = Game.calculateWinnings({
              base: 0.25,
              multiplier: context.db.multiplier.value,
              bet: context.db.bet.value,
              random: Math.random() * 1.5,
            });

            await context.db
              .run((db) => {
                db.wallet.addValue(won.final);
                db.energy.addValue();
                context.win(won.final);
              })
              .save();

            await edit(ctx.interaction, this.renderMainContent(context, game, true, won.final));
            break;
          }

          case game.isLose(): {
            await context.db
              .run((db) => {
                db.wallet.subValue(db.bet.value);
                context.lose(db.bet.value);
              })
              .save();
            await edit(ctx.interaction, this.renderMainContent(context, game, true));
            break;
          }
        }

        ctx.collector.stop('called');
      });
    }

    await collector.start();
  }

  private renderMainContent(context: Game.Context, game: Coinflip.Logic, ended: boolean, won = 0) {
    return new InteractionMessageContentBuilder()
      .addEmbed((embed) =>
        embed
          .setAuthor({
            name: `${context.command.user.username}'s coinflip game`,
            iconURL: Discord.getUserAvatarURL(context.command.user)
          })
          .setDescription(
            Common.join(
              !game.hasPicked()
                ? !ended
                  ? Common.join(
                    'Guess what side of the coin it would flip up to.',
                    `You placed ${bold(context.db.bet.value.toLocaleString())} coins.`
                  )
                  : Common.join(
                    "You didn't respond in time. You lost your bet.\n",
                    `${bold('New Balance:')} ${context.db.wallet.value.toLocaleString()}`
                  )
                : Common.join(
                  `It was ${bold(game.opponent.value)}${game.isWin() ? '!' : '.'} You ${game.isWin() ? 'won' : 'lost'} ${bold((game.isWin() ? won : context.db.bet.value).toLocaleString())} coins.\n`,
                  game.isWin() ? `${bold('Percent Won:')} ${percent(won, context.db.bet.value)}` : '',
                  `${bold('New Balance:')} ${context.db.wallet.value.toLocaleString()}.`
                )
            )
          )
          .setColor(
            !game.hasPicked()
              ? !ended
                ? Constants.Colors.BLURPLE
                : Constants.Colors.NOT_QUITE_BLACK
              : game.isWin()
                ? Constants.Colors.GREEN
                : Constants.Colors.RED
          )
          .setFooter(
            !game.hasPicked()
              ? null 
              : context.dbGame.wins.streak.isActive() || context.dbGame.loses.streak.isActive()
                ? { text: `${game.isWin() ? 'Win' : 'Lose'} Streak: ${Reflect.get(context.dbGame, game.isWin() ? 'wins' : 'loses').streak.display}` }
                : null
          )
      )
      .addRow((row) =>
        Object.values(Coinflip.Side).reduce(
          (row, customId) =>
            row.addButtonComponent((btn) =>
              btn
                .setCustomId(context.customId.create(customId).id)
                .setLabel(toTitleCase(customId))
                .setDisabled(ended)
                .setStyle(
                  !game.hasPicked() && !ended
                    ? Constants.MessageButtonStyles.PRIMARY
                    : (game.player.value === Coinflip.Side.HEADS && customId === Coinflip.Side.HEADS) ||
                      (game.player.value === Coinflip.Side.TAILS && customId === Coinflip.Side.TAILS)
                      ? game.isWin()
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
