import { Game } from '#lib/framework/index.js';
import { ApplyOptions } from '@sapphire/decorators';

import * as Common from '#lib/utilities/common/index.js';
import * as Discord from '#lib/utilities/discord/index.js';
import * as Coinflip from '#lib/utilities/games/coinflip/index.js';
import { bold } from '@discordjs/builders';
import { toTitleCase } from '@sapphire/utilities';
import { Constants } from 'discord.js';
import { edit, InteractionMessageContentBuilder } from '#lib/utilities';

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
    const game = new Coinflip.Logic(context.command.user, context.command.client.user!);
    const collector = new Discord.Collector({
      message: await context.respond(this.renderMainContent(context, game, false)),
      componentType: 'BUTTON',
      max: Infinity,
      time: Common.seconds(60),
      filter: async (button) => {
        const contextual = button.user.id === context.command.user.id;
        await button.deferUpdate();
        return contextual;
      },
      end: async (ctx) => {
        if (ctx.wasInternallyStopped()) {
          await context.edit(this.renderMainContent(context, game, true));
          await context.end(true);
          return;
        }

        await context.end();
      }
    });

    for (const componentId of Object.values(Coinflip.Side)) {
      const customId = context.customId.create(componentId);

      collector.actions.add(customId.id, async (ctx) => {
        game.pick.call(game, componentId);

        switch (true) {
          case game.isWin(): {
            const won = Game.calculateWinnings({
              base: 0.25,
              multiplier: context.db.multiplier.value,
              bet: context.db.bet.value,
              random: Common.randomNumber(0, 10) / 10
            });

            await context.db
              .run((db) => {
                db.wallet.addValue(won.final);
                db.energy.addValue(+!db.energy.isMaxStars());
              })
              .save();

            await edit(ctx.interaction, this.renderMainContent(context, game, true, won.final));
            break;
          }

          case game.isLose(): {
            await context.db.run((db) => db.wallet.addValue(db.bet.value)).save();
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
              !game.isWin() && !game.isLose()
                ? 'Guess what side of the coin it would flip upon.'
                : Common.join(
                    `You ${game.isWin() ? 'won' : 'lost'} ${bold((game.isWin() ? won : context.db.bet.value).toLocaleString())} coins.\n`,
                    `${bold('New Balance:')} ${context.db.wallet.value.toLocaleString()}.`
                  )
            )
          )
          .setColor(!ended ? Constants.Colors.BLURPLE : game.isWin() ? Constants.Colors.GREEN : Constants.Colors.RED)
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
                  !ended
                    ? Constants.MessageButtonStyles.PRIMARY
                    : game.isWin()
                    ? game.opponent.value === customId
                      ? Constants.MessageButtonStyles.SUCCESS
                      : Constants.MessageButtonStyles.DANGER
                    : Constants.MessageButtonStyles.DANGER
                )
            ),
          row
        )
      );
  }
}
