import { ApplyOptions } from '@sapphire/decorators';

import { Collector, seconds, getUserAvatarURL, join, InteractionMessageContentBuilder, edit, percent, randomItem, createEmbed, createButton } from '#lib/utilities';
import { Game } from '#lib/framework/index.js';
import { Constants } from 'discord.js';
import { bold } from '@discordjs/builders';
import * as EmojiPair from '#lib/utilities/games/emoji-pair/index.js';

declare module '#lib/framework/structures/game/game.types' {
  interface Games {
    emojipair: never;
  }
}

@ApplyOptions<Game.Options>({
  id: 'emojipair',
  name: 'Emoji Pair',
  description: 'Just pair it!',
  detailedDescription: 'Get an exact pair of the same emoji. The mood behind the emoji signifies how big you had won.'
})
export default class EmojiPairGame extends Game {
  public async play(context: Game.Context) {
    const logic = new EmojiPair.Logic(EmojiPairGame.pairs);
    const collector = new Collector({
      componentType: 'BUTTON',
      message: await context.respond(EmojiPairGame.renderContentAndUpdate(logic, context, false)),
      time: seconds(10),
      max: Infinity,
      actions: {
        [context.customId.create('reveal')]: async (ctx) => {
          await edit(ctx.interaction, EmojiPairGame.renderContentAndUpdate(logic.reveal(), context, true));
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
          await context.edit(EmojiPairGame.renderContentAndUpdate(logic, context, true));
          await context.end(true);
          return;
        }

        await context.end();
      }
    });

    await collector.start();
  }

  private static renderContentAndUpdate(logic: EmojiPair.Logic, ctx: Game.Context, ended: boolean) {
    const embed = createEmbed(embed => embed.setAuthor({ name: `${ctx.command.user.username}'s pairing game`, iconURL: getUserAvatarURL(ctx.command.user) }));
    const button = createButton(button => button.setCustomId(ctx.customId.create('reveal')).setDisabled(logic.revealed || ended));
    const description: string[] = [];

    description.push(`${bold('[')} ${logic.pair.map((e, idx) => (ended && logic.revealed ? e.emoji : idx === 1 ? '❓' : e.emoji)).join('    ')} ${bold(']')}\n`)

    switch (true) {
      case !logic.revealed && !ended: {
        description.push('Click the button below to reveal the pair.');

        embed.setColor(Constants.Colors.BLURPLE);
        button.setLabel('Reveal').setStyle(Constants.MessageButtonStyles.PRIMARY);
        break;
      }
      
      case !logic.revealed && ended: {
        ctx.db.run(db => {
          ctx.lose(db.bet.value);
          db.wallet.subValue(db.bet.value);
          db.energy.subValue();
        });

        description.push("You didn't respond in time. You lost your bet.", `You now have ${bold(ctx.db.wallet.value.toLocaleString())} coins.`);

        embed.setColor(Constants.Colors.NOT_QUITE_BLACK);
        button.setLabel('Timed Out').setStyle(Constants.MessageButtonStyles.SECONDARY);
        break;
      }

      case logic.isWin(): {
        const { final } = Game.calculateWinnings({
          base: randomItem(logic.pair).multiplier,
          bet: ctx.db.bet.value,
          multiplier: ctx.db.multiplier.value,
          random: 0
        });

        ctx.db.run((db) => {
          ctx.win(final);
          db.wallet.addValue(final);
          db.energy.addValue();
        });

        description.push(`${bold('PAIRED!')} You won ${bold(final.toLocaleString())} coins.`, `You now have ${bold(ctx.db.wallet.value.toLocaleString())} coins.`);

        embed.setColor(Constants.Colors.GREEN).setFooter({ text: `Percent Won: ${percent(final, ctx.db.bet.value)}` });
        button.setLabel('Winner Winner').setStyle(Constants.MessageButtonStyles.SUCCESS);
        break;
      }

      case logic.isLose(): {
        ctx.db.run(db => {
          ctx.lose(db.bet.value);
          db.wallet.subValue(db.bet.value);
          db.energy.subValue();
        });

        description.push("You didn't get a unique pair sad. You lost your bet.", `You now have ${bold(ctx.db.wallet.value.toLocaleString())} coins.`);

        embed.setColor(Constants.Colors.RED);
        button.setLabel('Loser Loser').setStyle(Constants.MessageButtonStyles.DANGER);
        break;
      }
    }

    return new InteractionMessageContentBuilder()
      .addEmbed(() => embed.setDescription(join(description)))
      .addRow(row => row.addButtonComponent(() => button));
  }

  /**
   * The array of emojis to pair with.
   */
  private static get pairs(): EmojiPair.Emoji[] {
    return [
      { emoji: '💰', multiplier: 5 },
      { emoji: '💶', multiplier: 4 },
      { emoji: '💵', multiplier: 3 },
      { emoji: '💸', multiplier: 2 },
      { emoji: '🪙', multiplier: 1 }
    ];
  }
}
