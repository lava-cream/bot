import { ApplyOptions } from '@sapphire/decorators';
import { Game } from '#lib/framework/index.js';

import { Collector, seconds, getUserAvatarURL, join, InteractionMessageContentBuilder, ButtonBuilder } from '#lib/utilities';
import { Constants, MessageEmbed } from 'discord.js';
import { bold, inlineCode } from '@discordjs/builders';

import * as SlotMachine from '#lib/utilities/games/slot-machine/index.js';

declare module '#lib/framework/structures/game/game.types' {
  interface Games {
    slotmachine: never;
  }
}

@ApplyOptions<Game.Options>({
  id: 'slotmachine',
  name: 'Slot Machine'
})
export default class SlotMachineGame extends Game {
  public async play(ctx: Game.Context) {
    const machine = new SlotMachine.Logic(SlotMachineGame.emojis);

    try {
      await SlotMachineGame.runCollector(machine, ctx);
      await ctx.edit(SlotMachineGame.renderContent(machine, ctx, true));
      await ctx.db.save();
      await ctx.end();
    } catch {
      await ctx.end(true);
    }
  }

  private static runCollector(machine: SlotMachine.Logic, ctx: Game.Context): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const collector = new Collector({
        message: await ctx.respond(SlotMachineGame.renderContent(machine, ctx, false)),
        componentType: 'BUTTON',
        time: seconds(60),
        max: Infinity,
        filter: async (button) => {
          const context = button.user.id === ctx.command.user.id;
          await button.deferUpdate();
          return context;
        },
        end: ctx => !ctx.wasInternallyStopped() ? resolve() : reject()
      });

      collector.actions.add(ctx.customId.create('reveal').id, (ctx) => ctx.collector.stop(ctx.interaction.customId));

      await collector.start();
    });
  }

  private static renderContent(machine: SlotMachine.Logic, ctx: Game.Context, ended: boolean) {
    const embed = new MessageEmbed();
    const builder = new InteractionMessageContentBuilder<ButtonBuilder>().addEmbed(() => embed);
    const description: string[] = [];

    const revealButton = new ButtonBuilder({
      customId: ctx.customId.create('reveal').id,
      style: Constants.MessageButtonStyles.PRIMARY,
      disabled: ended,
      label: 'Reveal'
    });

    embed.setAuthor({
      name: `${ctx.command.user.username}'s slot machine`,
      iconURL: getUserAvatarURL(ctx.command.user)
    });

    description.push(`${bold('>')} ${machine.slots.map((s) => (ended ? s.emoji : ':question:')).join('    ')} ${bold('<')}\n`);
    builder.addRow((row) => row.addButtonComponent(() => revealButton));

    switch (true) {
      case !ended: {
        description.push(`You placed ${bold(ctx.db.bet.value.toLocaleString())} coins.`, `Click ${bold(revealButton.label!)} to reveal the outcome.`);
        embed.setColor(Constants.Colors.BLURPLE);
        break;
      }

      case machine.isWin(): {
        const { final } = Game.calculateWinnings({
          bet: ctx.db.bet.value,
          base: machine.multiplier,
          multiplier: ctx.db.multiplier.value,
          random: 0
        });

        ctx.db.run((db) => {
          db.wallet.addValue(final);
          db.energy.addValue(+!db.energy.isMaxStars());
        });

        description.push(
          `${bold('JACKPOT!')} You won ${bold(final.toLocaleString())} coins.`,
          `${bold('Multiplier')} ${inlineCode(`${machine.multiplier.toLocaleString()}x`)}`,
          `You now have ${bold(ctx.db.wallet.value.toLocaleString())} coins.`
        );

        embed.setColor(Constants.Colors.GREEN);
        revealButton.setLabel('Winner Winner').setStyle(Constants.MessageButtonStyles.SUCCESS);
        break;
      }

      default: {
        ctx.db.run((db) => db.wallet.subValue(db.bet.value));
        description.push(`You lost ${bold(ctx.db.bet.value.toLocaleString())} coins.`, `You now have ${bold(ctx.db.wallet.value.toLocaleString())} coins.`);
        embed.setColor(Constants.Colors.RED);
        revealButton.setLabel('Loser Loser').setStyle(Constants.MessageButtonStyles.DANGER);
        break;
      }
    }

    embed.setDescription(join(description));
    return builder;
  }

  private static get emojis(): SlotMachine.Emoji[] {
    return [
      { emoji: ':credit_card:', multiplier: 10 },
      { emoji: ':moneybag:', multiplier: 5 },
      { emoji: ':dollar:', multiplier: 5 },
      { emoji: ':coin:', multiplier: 5 },
      { emoji: ':crown:', multiplier: 2.5 },
      { emoji: ':trophy:', multiplier: 2.5 },
      { emoji: ':medal:', multiplier: 2.5 },
      { emoji: ':trident:', multiplier: 2.5 }
    ];
  }
}
