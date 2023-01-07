import { Game } from '#lib/framework/index.js';
import { ApplyOptions } from '@sapphire/decorators';

import { getUserAvatarURL, join, seconds, InteractionMessageContentBuilder, roundZero } from '#lib/utilities';
import { checkClientReadyStatus, Collector, edit } from '#lib/utilities/discord/index.js';
import * as Blackjack from '#lib/utilities/games/blackjack/index.js';
import { bold, hyperlink, inlineCode } from '@discordjs/builders';
import { isNullOrUndefined, toTitleCase } from '@sapphire/utilities';
import type { ButtonInteraction } from 'discord.js';
import { Constants } from 'discord.js';

enum Control {
  HIT = 'hit',
  STAND = 'stand',
  FORFEIT = 'forfeit'
}

declare module '#lib/framework/structures/game/game.types' {
  interface Games {
    blackjack: never;
  }
}

@ApplyOptions<Game.Options>({
  id: 'blackjack',
  name: 'Blackjack',
  description: 'Play a game of blackjack!',
  detailedDescription:
    'Play a game of blackjack. This game was borrowed from Dank Memer, the original memey-currency bot used by millions of frog users.'
})
export default class BlackjackGame extends Game {
  public async play(context: Game.Context) {
    checkClientReadyStatus(context.command.client);

    const game = new Blackjack.Logic(context.command.user, context.command.client.user).start();
    const collector = new Collector({
      message: await context.responder.send(() => BlackjackGame.renderContent(context, game)),
      time: seconds(10),
      componentType: 'BUTTON',
      max: Infinity,
      filter: async (button) => {
        const contextual = button.user.id === context.command.user.id;
        await button.deferUpdate();
        return contextual;
      },
      end: async (ctx) => {
        if (ctx.wasInternallyStopped()) {
          game.setOutcome(Blackjack.Outcome.OTHER, "You didn't respond in time.");
          await context.responder.edit(() => BlackjackGame.renderContent(context, game));
          await context.end(true);
        }
      }
    });

    const update = async (button: ButtonInteraction) => {
      game.getOutcome();

      switch (game.outcome?.outcome) {
        case Blackjack.Outcome.WIN: {
          const winnings = roundZero(context.winnings
            .setBase(0.1)
            .setMultiplier(context.db.multiplier.value)
            .setRandom(Math.random() * 1.8)
            .calculate(context.db.bet.value))

          await context.db
            .run((db) => {
              context.schema.win(winnings);
              db.wallet.addValue(winnings);
              db.bank.space.addValue(winnings);
              db.energy.addValue();
            })
            .save();
          game.outcome.extra = `You won ${bold(winnings.toLocaleString())} coins. You now have ${bold(context.db.wallet.value.toLocaleString())} coins.`;

          break;
        }

        case Blackjack.Outcome.OTHER: {
          game.outcome.extra = "I won't bother with your stuff. You are keeping your money.";
          break;
        }

        case Blackjack.Outcome.LOSS: {
          await context.db
            .run((db) => {
              context.schema.lose(db.bet.value);
              db.wallet.subValue(db.bet.value);
              db.energy.subValue();
            })
            .save();
          game.outcome.extra = `You lost ${bold(context.db.bet.value.toLocaleString())} coins. You now have ${bold(
            context.db.wallet.value.toLocaleString()
          )} coins.`;
          break;
        }

        case Blackjack.Outcome.TIE: {
          game.outcome.extra = `Your wallet hasn't changed! You have ${bold(context.db.wallet.value.toLocaleString())} still.`;
          break;
        }
      }

      await edit(button, BlackjackGame.renderContent(context, game));

      if (!isNullOrUndefined(game.outcome)) {
        collector.collector!.stop('outcome');
        await context.end();
      }
    };

    for (const componentId of Object.values(Control)) {
      collector.actions.add(context.customId.create(componentId), async (ctx) => {
        switch (componentId) {
          case Control.HIT: {
            ctx.collector.resetTimer();

            game.player.deal(false);
            await update(ctx.interaction);
            break;
          }

          case Control.STAND: {
            game.player.stand();
            while (game.dealer.countHand() < Blackjack.Constants.BJ_DEALER_MAX) {
              game.dealer.deal(false);
            }

            await update(ctx.interaction);
            ctx.stop();
            break;
          }

          case Control.FORFEIT: {
            game.setOutcome(Blackjack.Outcome.OTHER, 'You ended the game.');

            await update(ctx.interaction);
            ctx.stop();

            await context.end(true);
            break;
          }
        }
      });
    }

    await collector.start();
  }

  private static renderContent(context: Game.Context, game: Blackjack.Logic) {
    const renderCard = (card: Blackjack.Card, index: number, hide: boolean): string => {
      return hyperlink(`${inlineCode(index > 0 && hide ? '?' : `${card.suit} ${card.face}`)}`, 'https://discord.gg/memer');
    };
    const renderHand = (player: Blackjack.Player, hide: boolean): string => {
      return join([
        `Cards - ${bold(player.hand.map((card, idx) => renderCard(card, idx, hide)).join('  '))}`,
        `Total - ${inlineCode(hide ? inlineCode(' ? ') : player.countHand().toString())}`
      ]);
    };

    return new InteractionMessageContentBuilder()
      .addEmbed((embed) =>
        embed
          .setAuthor({
            name: `${game.player.user.username}'s blackjack game`,
            iconURL: getUserAvatarURL(game.player.user)
          })
          .setColor(!isNullOrUndefined(game.outcome) ? Blackjack.Outcomes[game.outcome.outcome].color() : Constants.Colors.BLURPLE)
          .setDescription(
            isNullOrUndefined(game.outcome)
              ? ''
              : join([bold(`${Blackjack.Outcomes[game.outcome.outcome].message} ${game.outcome.reason}`), game.outcome.extra ?? ''])
          )
          .addFields(
            {
              name: `${game.player.user.username} (Player)`,
              value: renderHand(game.player, false),
              inline: true
            },
            {
              name: `${game.dealer.user.username} (Dealer)`,
              value: renderHand(game.dealer, !isNullOrUndefined(game.outcome) ? false : !game.player.stood),
              inline: true
            }
          )
          .setFooter({
            text: isNullOrUndefined(game.outcome) 
              ? 'K, Q, J = 10  |  A = 1 OR 11' 
              : game.outcome.outcome === Blackjack.Outcome.WIN && context.schema.wins.streak.isActive()
                ? `Win Streak: ${context.schema.wins.streak.display}`
                : game.outcome.outcome === Blackjack.Outcome.LOSS && context.schema.loses.streak.isActive()
                  ? `Lose Streak: ${context.schema.loses.streak.display}`
                  : ''
          })
      )
      .addRow((row) =>
        Object.values(Control).reduce(
          (row, customId) =>
            row.addButtonComponent((btn) =>
              btn
                .setCustomId(context.customId.create(customId))
                .setDisabled(!isNullOrUndefined(game.outcome))
                .setStyle(isNullOrUndefined(game.outcome) ? Constants.MessageButtonStyles.PRIMARY : Constants.MessageButtonStyles.SECONDARY)
                .setLabel(toTitleCase(customId))
            ),
          row
        )
      );
  }
}
