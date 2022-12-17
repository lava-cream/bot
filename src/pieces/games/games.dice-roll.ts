import { Game } from '#lib/framework';
import { Collector, percent, getUserAvatarURL, join, seconds, checkClientReadyStatus, randomNumber } from '#lib/utilities';
import { bold, inlineCode } from '@discordjs/builders';
import { ApplyOptions } from '@sapphire/decorators';
import { WebhookEditMessageOptions, Constants, MessageEmbed, MessageButton, MessageActionRow } from 'discord.js';

import * as DiceRoll from '#lib/utilities/games/dice-roll/index.js';
import { Result } from '@sapphire/result';

declare module '#lib/framework/structures/game/game.types' {
  interface Games {
    diceroll: never;
  }
}

@ApplyOptions<Game.Options>({
  id: 'diceroll',
  name: 'Dice Roll',
  description: 'Roll a dice to win coins!',
  detailedDescription: 'Roll a dice to win coins. Whoever gets the highest rolled value wins.'
})
export class DiceRollGame extends Game {
  public async play(context: Game.Context) {
    checkClientReadyStatus(context.command.client);

    const game = new DiceRoll.Logic(context.command.client.user, context.command.user);
    const response = await Result.fromAsync(this.awaitResponse(context, game));

    await context.end(response.isErr());
  }

  public renderContentAndUpdate(ctx: Game.Context, game: DiceRoll.Logic): WebhookEditMessageOptions {
    const embed = new MessageEmbed().setAuthor({
      name: `${ctx.command.user.username}'s dice roll game`,
      iconURL: getUserAvatarURL(ctx.command.user)
    });
    const button = new MessageButton().setCustomId(ctx.customId.create('reveal').id).setDisabled(game.hasBothRolled());
    const row = new MessageActionRow().setComponents([button]);

    for (const user of [game.player.user, game.opponent.user]) {
      embed.addFields({
        name: user.username,
        value: `Rolled a ${inlineCode(
          game.hasBothRolled() ? (user.id === ctx.command.user.id ? game.player.value : game.opponent.value).toString() : '?'
        )}`,
        inline: true
      });
    }

    switch (true) {
      case !game.hasBothRolled() && game.outcome === DiceRoll.Outcome.NONE: {
        button.setLabel('Reveal').setStyle(Constants.MessageButtonStyles.PRIMARY);
        embed.setColor(Constants.Colors.BLURPLE).setDescription(`Your bet is ${bold(ctx.db.bet.value.toLocaleString())} coins.`);
        break;
      }

      case game.isWin(): {
        const { final } = Game.calculateWinnings({
          base: 0.5,
          multiplier: ctx.db.multiplier.value,
          bet: ctx.db.bet.value,
          random: randomNumber(0, 100) / 100
        });

        ctx.db.run((db) => {
          db.wallet.addValue(final);
          db.energy.addValue(+!db.energy.isMaxStars());
        });

        button.setLabel('Winner Winner').setStyle(Constants.MessageButtonStyles.SUCCESS);
        embed
          .setColor(Constants.Colors.GREEN)
          .setDescription(
            join(
              `You won ${bold(final.toLocaleString())} coins.\n`,
              `${bold('Percent Won:')} ${percent(final, ctx.db.bet.value)}`,
              `${bold('New Balance:')} ${ctx.db.wallet.value.toLocaleString()}`
            )
          );

        break;
      }

      case game.isTie(): {
        button.setLabel('LMAO').setStyle(Constants.MessageButtonStyles.SECONDARY);
        embed.setColor(Constants.Colors.YELLOW).setDescription(`Tie! You have ${bold(ctx.db.wallet.value.toLocaleString())} coins still.`);

        break;
      }

      case game.isLose(): {
        ctx.db.run((db) => db.wallet.subValue(db.bet.value));

        button.setLabel('Sucks to Suck').setStyle(Constants.MessageButtonStyles.DANGER);
        embed
          .setColor(Constants.Colors.RED)
          .setDescription(
            join(`You lost ${bold(ctx.db.bet.value.toLocaleString())} coins.\n`, `${bold('New Balance:')} ${ctx.db.wallet.value.toLocaleString()}`)
          );

        break;
      }

      default: {
        ctx.db.run((db) => db.wallet.subValue(db.bet.value));
        button.setLabel('Timed Out').setStyle(Constants.MessageButtonStyles.SECONDARY).setDisabled(true);
        embed
          .setColor(Constants.Colors.NOT_QUITE_BLACK)
          .setDescription(join(`You didn't respond in time. You lost your bet.`, `${bold('New Balance:')} ${ctx.db.wallet.value.toLocaleString()}`));

        break;
      }
    }

    return { embeds: [embed], components: [row] };
  }

  protected async awaitResponse(context: Game.Context, game: DiceRoll.Logic): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const collector = new Collector({
        message: await context.respond(this.renderContentAndUpdate(context, game)),
        componentType: 'BUTTON',
        max: Infinity,
        time: seconds(10),
        actions: {
          [context.customId.create('reveal').id]: async (ctx) => {
            game.roll();

            await ctx.interaction.editReply(this.renderContentAndUpdate(context, game));
            await context.db.save();
            ctx.collector.stop(ctx.interaction.customId);
          }
        },
        filter: async (button) => {
          const contextual = button.user.id === context.command.user.id;
          await button.deferUpdate();
          return contextual;
        },
        end: async (ctx) => {
          if (ctx.wasInternallyStopped()) {
            await context.db.run(db => db.wallet.subValue(db.bet.value)).save();
            await context.edit(this.renderContentAndUpdate(context, game));
            return reject();
          }

          return resolve();
        }
      });

      await collector.start();
    });
  }
}
