import { Command, ApplicationCommandRegistry, CommandOptionsRunTypeEnum } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';

import { hasDecimal, edit, DeferCommandInteraction, parseNumber, InteractionMessageContentBuilder } from '#lib/utilities';
import { bold } from '@discordjs/builders';
import { isNullOrUndefined } from '@sapphire/utilities';
import { CommandError } from '#lib/framework';
import type { PlayerSchema } from '#lib/database';
import { Constants } from 'discord.js';

@ApplyOptions<Command.Options>({
  name: 'bet',
  description: 'Edits your bet amount.',
  runIn: [CommandOptionsRunTypeEnum.GuildText]
})
export default class BetCommand extends Command {
  @DeferCommandInteraction()
  public override async chatInputRun(command: Command.ChatInputInteraction<'cached'>) {
    const db = await this.container.db.players.fetch(command.user.id);
    const amount = command.options.getString('amount');

    if (isNullOrUndefined(amount)) {
      return await edit(command, BetCommand.renderCurrentBetMessage(db));
    }

    const parsedAmount = parseNumber(amount, {
      amount: db.bet.value,
      minimum: db.minBet,
      maximum: db.maxBet
    });

    if (isNullOrUndefined(parsedAmount) || hasDecimal(parsedAmount)) throw new CommandError('You need to pass an actual number.');
    if (parsedAmount === db.bet.value) throw new CommandError('Cannot change your bet to the same one.');
    if (parsedAmount < db.minBet) throw new CommandError(`You can't bet lower than your minimum ${bold(db.minBet.toLocaleString())} limit.`);
    if (parsedAmount > db.maxBet) throw new CommandError(`You can't bet higher than your maximum ${bold(db.maxBet.toLocaleString())} limit.`);
    if (parsedAmount > db.wallet.value) throw new CommandError(`You only have ${bold(db.wallet.value.toLocaleString())} coins.`);

    await db.run((db) => db.bet.setValue(parsedAmount)).save();
    await edit(command, BetCommand.renderBetUpdatedMessage(db));
    return;
  }

  private static renderCurrentBetMessage(db: PlayerSchema) {
    return new InteractionMessageContentBuilder()
      .addEmbed(embed => 
        embed  
          .setColor(Constants.Colors.DARK_BUT_NOT_BLACK)
          .setDescription(`Your current bet is ${bold(db.bet.toLocaleString())} coins.`)
      )
  } 

  private static renderBetUpdatedMessage(db: PlayerSchema) {
    return new InteractionMessageContentBuilder()
      .addEmbed(embed => 
        embed  
          .setColor(Constants.Colors.DARK_BUT_NOT_BLACK)
          .setDescription(`You're now betting ${bold(db.bet.toLocaleString())} coins. Goodluck playing!`)
      )
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption((option) =>
          option.setName('amount').setDescription('Examples: 10k, 2t, 30%, 55.5% (% of max bet), min, max, half, full, 250_000 or 124,000.')
        )
      , {
        idHints: ['1050341969324408902']
      });
  }
}
