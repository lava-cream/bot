import { ApplyOptions } from '@sapphire/decorators';

import { Collector, seconds, getUserAvatarURL, join, InteractionMessageContentBuilder, edit } from '#lib/utilities';
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
        filter: async (button) => {
          const contextual = button.user.id === context.command.user.id;
          await button.deferUpdate();
          return contextual;
        },
        end: ctx => !ctx.wasInternallyStopped() ? resolve() : reject()
      });

      collector.actions.add(context.customId.create('reveal').id, async (ctx) => {
        await edit(ctx.interaction, EmojiPairGame.renderContent(logic, context, true));
        ctx.collector.stop(ctx.interaction.customId);
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
          .setLabel('Reveal')
          .setDisabled(ended)
          .setStyle(
            ended
              ? logic.isWin()
                ? Constants.MessageButtonStyles.SUCCESS
                : Constants.MessageButtonStyles.DANGER
              : Constants.MessageButtonStyles.PRIMARY
          )
      )
    );

    const description: string[] = [];
    description.push(logic.pair.map((p, idx) => (ended ? p.emoji : idx === 1 ? ':question:' : p.emoji)).join(' '));

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
        embed.setColor(Constants.Colors.GREEN);
        break;
      }

      default: {
        ctx.db.run((db) => db.wallet.subValue(db.bet.value));
        description.push("You didn't get an outstanding pair sad.");
        embed.setColor(Constants.Colors.RED);
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
      { emoji: ':pineapple:', multiplier: 1.5 },
      { emoji: ':apple:', multiplier: 1.2 },
      { emoji: ':carrot:', multiplier: 1 },
      { emoji: ':peach:', multiplier: 0.8 },
      { emoji: ':eggplant:', multiplier: 0.5 }
    ];
  }
}
