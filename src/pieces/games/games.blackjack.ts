import { Game } from '#lib/framework/index.js';
import { ApplyOptions } from '@sapphire/decorators';

import { getUserAvatarURL, createComponentId, join, MessageActionRowBuilder, seconds } from '#lib/utilities';
import { Collector } from '#lib/utilities/discord/index.js';
import * as Blackjack from '#lib/utilities/games/blackjack/index.js';
import { bold, hyperlink, inlineCode } from '@discordjs/builders';
import { isNullOrUndefined, toTitleCase } from '@sapphire/utilities';
import type { ButtonInteraction, InteractionReplyOptions, MessageEditOptions, WebhookEditMessageOptions } from 'discord.js';
import { Constants, MessageEmbed } from 'discord.js';

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
    const game = new Blackjack.Logic(context.command.user, context.command.client!.user!);
    const collector = new Collector({
      message: await context.respond(<InteractionReplyOptions>BlackjackGame.renderMainContent(context, game)),
      time: seconds(10),
      idle: seconds(10),
      componentType: 'BUTTON',
      max: Infinity,
      filter: async (button) => {
        const contextual = button.user.id === context.command.user.id;
        await button.deferUpdate();
        return contextual;
      }
    });

    const update = async (button: ButtonInteraction) => {
      game.getOutcome();

      switch (game.outcome?.outcome) {
        case Blackjack.Outcome.WIN: {
          const { final } = Game.calculateWinnings({
            base: 0.4,
            bet: context.db.bet.value,
            multiplier: context.db.multiplier.value
          });

          await context.db
            .run((db) => {
              db.wallet.update({ value: db.wallet.value + final });
              if (!db.energy.isMaximumStars()) db.energy.update({ stars: db.energy.stars + 1 });
            })
            .save();
          game.outcome.extra = `You won ${bold(final.toLocaleString())} coins. You now have ${bold(context.db.wallet.value.toLocaleString())} coins.`;

          break;
        }

        case Blackjack.Outcome.OTHER: {
          await context.db.run((db) => db.wallet.update({ value: db.wallet.value - db.bet.value })).save();
          game.outcome.extra = 'The dealer is keeping your money to deal with your bullcrap.';
          break;
        }

        case Blackjack.Outcome.LOSS: {
          await context.db.run((db) => db.wallet.update({ value: db.wallet.value - db.bet.value })).save();
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

      await button.editReply(<WebhookEditMessageOptions>BlackjackGame.renderMainContent(context, game));
      if (!isNullOrUndefined(game.outcome)) {
        collector.collector!.stop('outcome');
        await context.end();
      }
    };

    for (const customId of Object.values(Control)) {
      const componentId = createComponentId({ customId, date: new Date(context.command.createdTimestamp) });

      collector.actions.add(componentId.customId, async (ctx) => {
        switch (customId) {
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
            ctx.collector.stop('stood');
            break;
          }

          case Control.FORFEIT: {
            game.setOutcome(Blackjack.Outcome.OTHER, 'You ended the game.');

            await update(ctx.interaction);
            ctx.collector.stop('forfeit');

            await context.end(true);
            break;
          }
        }
      });
    }

    collector.setEndAction(async (ctx) => {
      if (ctx.wasInternallyStopped()) {
        game.setOutcome(Blackjack.Outcome.OTHER, "You didn't respond in time.");
        await ctx.message.edit(<MessageEditOptions>BlackjackGame.renderMainContent(context, game));
        await context.end(true);
      }
    });

    await collector.start();
  }

  private static renderMainContent(
    context: Game.Context,
    game: Blackjack.Logic
  ): WebhookEditMessageOptions | InteractionReplyOptions | MessageEditOptions {
    const renderCard = (card: Blackjack.Card, index: number, hide: boolean): string => {
      return hyperlink(`${inlineCode(index > 0 && hide ? '?' : `${card.suit} ${card.face}`)}`, 'https://discord.gg/memer');
    };
    const renderHand = (player: Blackjack.Player, hide: boolean): string => {
      return join([
        `Cards - ${bold(player.hand.map((card, idx) => renderCard(card, idx, hide)).join('  '))}`,
        `Total - ${inlineCode(hide ? inlineCode(' ? ') : player.countHand().toString())}`
      ]);
    };

    const embeds = [
      new MessageEmbed()
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
        .addField(`${game.player.user.username} (Player)`, renderHand(game.player, false), true)
        .addField(
          `${game.dealer.user.username} (Dealer)`,
          renderHand(game.dealer, !isNullOrUndefined(game.outcome) ? false : !game.player.stood),
          true
        )
        .setFooter({
          text: isNullOrUndefined(game.outcome) ? 'K, Q, J = 10  |  A = 1 OR 11' : ''
        })
    ];

    const components = [
      Object.values(Control).reduce(
        (row, customId) =>
          row.addButtonComponent((btn) =>
            btn
              .setCustomId(createComponentId({ customId, date: new Date(context.command.createdTimestamp) }).customId)
              .setDisabled(!isNullOrUndefined(game.outcome))
              .setStyle(isNullOrUndefined(game.outcome) ? Constants.MessageButtonStyles.PRIMARY : Constants.MessageButtonStyles.SECONDARY)
              .setLabel(toTitleCase(customId))
          ),
        new MessageActionRowBuilder()
      )
    ];

    return { embeds, components };
  }
}
