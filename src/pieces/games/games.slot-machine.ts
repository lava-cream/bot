import { ApplyOptions } from '@sapphire/decorators';
import { Game } from '#lib/framework/index.js';

import { Collector, seconds, getUserAvatarURL, join, InteractionMessageContentBuilder, edit, createEmbed, createButton } from '#lib/utilities';
import { Constants } from 'discord.js';
import { bold, inlineCode } from '@discordjs/builders';

import * as SlotMachine from '#lib/utilities/games/slot-machine/index.js';

declare module '#lib/framework/structures/game/game.types' {
  interface Games {
    slotmachine: never;
  }
}

@ApplyOptions<Game.Options>({
  id: 'slotmachine',
  name: 'Slot Machine',
  description: 'Spin for win!',
  detailedDescription: 'Test your chances at spinning the slot machine.'
})
export default class SlotMachineGame extends Game {
  public async play(context: Game.Context) {
    const machine = new SlotMachine.Logic(SlotMachineGame.emojis);
    const collector = new Collector({
      message: await context.respond(SlotMachineGame.renderContentAndUpdate(machine, context, false)),
      componentType: 'BUTTON',
      time: seconds(10),
      max: Infinity,
      actions: {
        [context.customId.create('spin')]: async (ctx) => {
          await edit(ctx.interaction, SlotMachineGame.renderContentAndUpdate(machine.reveal(), context, true));
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
          await context.edit(SlotMachineGame.renderContentAndUpdate(machine, context, true));
          await context.db.save();
          await context.end();
          return;
        }

        await context.end();
      }
    });

    await collector.start();
  }

  private static renderContentAndUpdate(machine: SlotMachine.Logic, ctx: Game.Context, ended: boolean) {
    const embed = createEmbed(embed => embed.setAuthor({ name: `${ctx.command.user.username}'s slot machine`, iconURL: getUserAvatarURL(ctx.command.user) }));
    const button = createButton(button => button.setCustomId(ctx.customId.create('spin')).setDisabled(machine.revealed || ended));
    const description: string[] = [];

    description.push(`${bold('>')} ${machine.slots.map((s) => (ended && machine.revealed ? s.emoji : '❓')).join('    ')} ${bold('<')}\n`);

    switch (true) {
      case !machine.revealed && !ended: {
        description.push(`You placed ${bold(ctx.db.bet.value.toLocaleString())} coins.`, 'Spin to reveal the outcome.');
        
        embed.setColor(Constants.Colors.BLURPLE);
        button.setLabel('Spin').setStyle(Constants.MessageButtonStyles.PRIMARY);
        break;
      }

      case !machine.revealed && ended: {
        ctx.db.run(db => {
          db.wallet.subValue(db.bet.value);
          db.energy.subValue();
          ctx.lose(db.bet.value);
        });

        description.push('Your time ran out. You lost your bet.', `You now have ${bold(ctx.db.wallet.value.toLocaleString())}`);

        embed.setColor(Constants.Colors.NOT_QUITE_BLACK);
        button.setLabel('Timed Out').setStyle(Constants.MessageButtonStyles.SECONDARY);
        break;
      }

      case machine.isJackpot() || machine.isWin(): {
        const { final } = Game.calculateWinnings({
          bet: ctx.db.bet.value,
          base: machine.multiplier,
          multiplier: ctx.db.multiplier.value,
          random: 0
        });

        ctx.db.run(db => {
          db.wallet.addValue(final);
          db.energy.addValue();
          ctx.win(final);
        });

        description.push(
          `${machine.isJackpot() ? bold('JACKPOT!') : ''} You won ${bold(final.toLocaleString())} coins.`,
          `${bold('Multiplier')} ${inlineCode(`${machine.multiplier.toLocaleString()}x`)}`,
          `You now have ${bold(ctx.db.wallet.value.toLocaleString())} coins.`
        );

        embed.setColor(machine.isJackpot() ? Constants.Colors.GOLD : Constants.Colors.GREEN);
        button.setLabel('Winner Winner').setStyle(Constants.MessageButtonStyles.SUCCESS);
        break;
      }

      case machine.isLose(): {
        ctx.db.run(db => {
          db.wallet.subValue(db.bet.value);
          db.energy.subValue();
          ctx.lose(db.bet.value);
        });

        description.push(
          `You lost ${bold(ctx.db.bet.value.toLocaleString())} coins.`,
          `You now have ${bold(ctx.db.wallet.value.toLocaleString())} coins.`
        );

        embed.setColor(Constants.Colors.RED);
        button.setLabel('Loser Loser').setStyle(Constants.MessageButtonStyles.DANGER);
        break;
      }
    }

    return new InteractionMessageContentBuilder()
      .addEmbed(embed => embed.setDescription(join(description)))
      .addRow(row => row.addButtonComponent(() => button));
  }

  private static get emojis(): SlotMachine.Emoji[] {
    return [
      { emoji: '9️⃣', multiplier: 3.0 },
      { emoji: '8️⃣', multiplier: 2.0 },
      { emoji: '7️⃣', multiplier: 2.0 },
      { emoji: '6️⃣', multiplier: 1.0 },
      { emoji: '5️⃣', multiplier: 1.0 },
      { emoji: '4️⃣', multiplier: 0.75 },
      { emoji: '3️⃣', multiplier: 0.75 },
      { emoji: '2️⃣', multiplier: 0.5 },
      { emoji: '1️⃣', multiplier: 0.5 }
    ];
  }
}
