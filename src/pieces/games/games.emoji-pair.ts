import { ApplyOptions } from '@sapphire/decorators';

import { Collector, seconds, getUserAvatarURL, join, InteractionMessageContentBuilder, edit, percent } from '#lib/utilities';
import { Game } from '#lib/framework/index.js';
import { Constants, MessageEmbed } from 'discord.js';
import { bold } from '@discordjs/builders';
import * as EmojiPair from '#lib/utilities/games/emoji-pair/index.js';

@ApplyOptions<Game.Options>({
  id: 'emojipair',
  name: 'Emoji Pair',
  description: 'Just pair it!',
  detailedDescription: 'Get an exact pair of the same emoji. The mood behind the emoji signifies how big you had won.'
})
export class EmojiPairGame extends Game {
  public async play(ctx: Game.Context) {
    const logic = new EmojiPair.Logic(EmojiPairGame.pairs);

    try {
      await EmojiPairGame.runCollector(logic, ctx);
      await ctx.db.save();
      await ctx.end();
    } catch {
      await ctx.end(true);
    }
  }

  private static runCollector(logic: EmojiPair.Logic, context: Game.Context): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const collector = new Collector({
        componentType: 'BUTTON',
        message: await context.respond(EmojiPairGame.renderContent(logic, context, false)),
        time: seconds(60),
        max: Infinity,
        actions: {
          [context.customId.create('reveal').id]: async (ctx) => {
            await edit(ctx.interaction, EmojiPairGame.renderContent(logic.reveal(), context, true));
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
            await context.db.run((db) => db.wallet.subValue(db.bet.value)).save();
            await context.edit(EmojiPairGame.renderContent(logic, context, true));
            return reject();
          }

          return resolve();
        }
      });

      await collector.start();
    });
  }

  private static renderContent(logic: EmojiPair.Logic, ctx: Game.Context, ended: boolean) {
    const embed = new MessageEmbed().setAuthor({ name: `${ctx.command.user.username}'s pairing game`, iconURL: getUserAvatarURL(ctx.command.user) });
    const builder = new InteractionMessageContentBuilder().addRow((row) =>
      row.addButtonComponent((btn) =>
        btn
          .setCustomId(ctx.customId.create('reveal').id)
          .setLabel(!logic.revealed ? (!ended ? 'Reveal' : 'Timed Out') : logic.isWin() ? 'Winner Winner' : 'Loser Loser')
          .setDisabled(ended)
          .setStyle(
            !logic.revealed && !ended
              ? Constants.MessageButtonStyles.PRIMARY
              : logic.revealed
              ? logic.isWin()
                ? Constants.MessageButtonStyles.SUCCESS
                : Constants.MessageButtonStyles.DANGER
              : Constants.MessageButtonStyles.SECONDARY
          )
      )
    );

    const description: string[] = [];
    description.push(logic.pair.map((p, idx) => (ended && logic.revealed ? p.emoji : idx === 1 ? ':question:' : p.emoji)).join(' '));

    switch (true) {
      case !ended: {
        description.push('Click the little button below to reveal the pair.');
        embed.setColor(Constants.Colors.BLURPLE);
        break;
      }

      case logic.isWin(): {
        const { final } = Game.calculateWinnings({
          base: logic.pair.at(0)!.multiplier,
          bet: ctx.db.bet.value,
          multiplier: ctx.db.multiplier.value,
          random: 0
        });

        ctx.db.run((db) => {
          db.wallet.addValue(final);
          db.energy.addValue(+!db.energy.isMaxStars());
        });
        description.push(`${bold('PAIRED!')} You won ${bold(final.toLocaleString())} coins.`);
        embed.setColor(Constants.Colors.GREEN).setFooter({ text: `Percent Won: ${percent(final, ctx.db.bet.value)}` });
        break;
      }

      case logic.isLose(): {
        ctx.db.run((db) => db.wallet.subValue(db.bet.value));
        description.push("You didn't get an outstanding pair sad. You lost your bet.");
        embed.setColor(Constants.Colors.RED);
        break;
      }

      default: {
        ctx.db.run((db) => db.wallet.subValue(db.bet.value));
        description.push("You didn't respond in time. You lost your bet.");
        embed.setColor(Constants.Colors.NOT_QUITE_BLACK);
        break;
      }
    }

    return builder.addEmbed(() => embed.setDescription(join(description)));
  }

  /**
   * The array of emojis to pair with.
   */
  private static get pairs(): EmojiPair.Emoji[] {
    return [
      { emoji: ':pineapple:', multiplier: 2 },
      { emoji: ':apple:', multiplier: 1 },
      { emoji: ':carrot:', multiplier: 0.75 },
      { emoji: ':peach:', multiplier: 0.5 },
      { emoji: ':eggplant:', multiplier: 0.25 }
    ];
  }
}
