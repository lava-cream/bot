import { ApplyOptions } from '@sapphire/decorators';
import { Game } from '#lib/framework/index.js';

import { Collector, seconds, getUserAvatarURL, join, InteractionMessageContentBuilder, ButtonBuilder, edit } from '#lib/utilities';
import { Constants, MessageEmbed } from 'discord.js';
import { bold, inlineCode } from '@discordjs/builders';

import * as SlotMachine from '#lib/utilities/games/slot-machine/index.js';
import { Result } from '@sapphire/result';

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
    const result = await Result.fromAsync(SlotMachineGame.runCollector(machine, context));

    return context.end(result.isErr());
  }

  private static runCollector(machine: SlotMachine.Logic, context: Game.Context): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const collector = new Collector({
        message: await context.respond(SlotMachineGame.renderContentAndUpdate(machine, context, false)),
        componentType: 'BUTTON',
        time: seconds(60),
        max: Infinity,
        actions: {
          [context.customId.create('reveal').id]: async (ctx) => {
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
        end: (ctx) => (!ctx.wasInternallyStopped() ? resolve() : reject())
      });

      await collector.start();
    });
  }

  private static renderContentAndUpdate(machine: SlotMachine.Logic, ctx: Game.Context, ended: boolean) {
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

    switch (true) {
      case !ended: {
        description.push(`You placed ${bold(ctx.db.bet.value.toLocaleString())} coins.`, `Click ${bold(revealButton.label!)} for the outcome.`);
        embed.setColor(Constants.Colors.BLURPLE);
        break;
      }

      case machine.isJackpot() || machine.isWin(): {
        const { final } = Game.calculateWinnings({
          bet: ctx.db.bet.value,
          base: machine.multiplier,
          multiplier: ctx.db.multiplier.value,
          random: 0
        });

        ctx.db.run((db) => {
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
        revealButton.setLabel('Winner Winner').setStyle(Constants.MessageButtonStyles.SUCCESS);
        break;
      }

      default: {
        ctx.lose(ctx.db.bet.value);
        ctx.db.run((db) => db.wallet.subValue(db.bet.value));
        description.push(
          `You lost ${bold(ctx.db.bet.value.toLocaleString())} coins.`,
          `You now have ${bold(ctx.db.wallet.value.toLocaleString())} coins.`
        );
        embed.setColor(Constants.Colors.RED);
        revealButton.setLabel('Loser Loser').setStyle(Constants.MessageButtonStyles.DANGER);
        break;
      }
    }

    embed.setDescription(join(description));
    return builder.addRow((row) => row.addButtonComponent(() => revealButton));
  }

  private static get emojis(): SlotMachine.Emoji[] {
    return [
      { emoji: '9️⃣', multiplier: 1.5 },
      { emoji: '8️⃣', multiplier: 1.5 },
      { emoji: '7️⃣', multiplier: 1.0 },
      { emoji: '6️⃣', multiplier: 1.0 },
      { emoji: '5️⃣', multiplier: 1.0 },
      { emoji: '4️⃣', multiplier: 1.0 },
      { emoji: '3️⃣', multiplier: 0.5 },
      { emoji: '2️⃣', multiplier: 0.5 },
      { emoji: '1️⃣', multiplier: 0.5 }
    ];
  }
}
