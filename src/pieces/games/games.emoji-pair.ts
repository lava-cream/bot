import { ApplyOptions } from '@sapphire/decorators';

import { Collector, seconds, createComponentId, getUserAvatarURL, join, MessageContentBuilder } from '#lib/utilities';
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
      await ctx.edit(EmojiPairGame.renderContent(logic, ctx, true));
      await ctx.db.save();
      await ctx.end();
    } catch {
      await ctx.end(true);
    }
  }

  private static runCollector(logic: EmojiPair.Logic, ctx: Game.Context): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const collector = new Collector({
        componentType: 'BUTTON',
        message: await ctx.respond(EmojiPairGame.renderContent(logic, ctx, false)),
        time: seconds(10),
        max: Infinity,
        filter: async (button) => {
          const context = button.user.id === ctx.command.user.id;
          await button.deferUpdate();
          return context;
        }
      });

      collector.actions.add(createComponentId({ date: new Date(ctx.command.createdTimestamp), customId: 'reveal' }).customId, (ctx) =>
        ctx.collector.stop(ctx.interaction.customId)
      );
      collector.setEndAction((ctx) => (ctx.wasInternallyStopped() ? resolve() : reject()));

      await collector.start();
    });
  }

  private static renderContent(logic: EmojiPair.Logic, ctx: Game.Context, ended: boolean) {
    const embed = new MessageEmbed().setAuthor({ name: `${ctx.command.user.username}'s pairing game`, iconURL: getUserAvatarURL(ctx.command.user) });
    const builder = new MessageContentBuilder().addComponentRow((row) =>
      row.addButtonComponent((btn) =>
        btn
          .setCustomId(createComponentId({ date: new Date(ctx.command.createdTimestamp), customId: 'reveal' }).customId)
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
          db.wallet.update({ value: db.wallet.value + final });
          if (!db.energy.isMaximumStars()) db.energy.update({ stars: db.energy.stars + 1 });
        });
        description.push(`${bold('PAIRED!')} You won ${bold(final.toLocaleString())} coins.`);
        embed.setColor(Constants.Colors.GREEN);
        break;
      }

      default: {
        ctx.db.run((db) => db.wallet.update({ value: db.wallet.value - db.bet.value }));
        description.push("You didn't get an outstanding pair sad.");
        embed.setColor(Constants.Colors.RED);
        break;
      }
    }

    return builder.setEmbeds([embed.setDescription(join(description))]);
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
