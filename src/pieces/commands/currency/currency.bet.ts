import { CommandInteraction, Constants } from 'discord.js';
import { Command, ApplicationCommandRegistry, CommandOptionsRunTypeEnum } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';

import { hasDecimal, edit, DeferCommandInteraction, parseNumber, join } from '#lib/utilities';
import { bold } from '@discordjs/builders';
import { isNullOrUndefined } from '@sapphire/utilities';
import { CommandError } from '#lib/framework';
import type { PlayerSchema } from '#lib/database';

@ApplyOptions<Command.Options>({
  name: 'bet',
  description: 'Edits your bet amount.',
  runIn: [CommandOptionsRunTypeEnum.GuildText]
})
export default class BetCommand extends Command {
  @DeferCommandInteraction()
  public override async chatInputRun(command: CommandInteraction<'cached'>) {
    const db = await this.container.db.players.fetch(command.user.id);
    const amount = command.options.getString('amount');

    if (isNullOrUndefined(amount)) {
      const isSufficient = db.bet.value >= db.wallet.value;

      return await edit(command, builder => 
        builder  
          .addEmbed(embed => 
            embed  
              .setColor(isSufficient ? Constants.Colors.DARK_RED : Constants.Colors.DARK_GREEN)
              .setDescription(
                join(
                  `Your bet right now is ${bold(db.bet.value.toLocaleString())} coins.`,
                  `You ${bold(isSufficient ? 'can' : 'cannot')} use your coins on games.`
                )
              )
          )
      );
    }

    const parsedAmount = parseNumber(amount, { 
      amount: db.bet.value, 
      minimum: db.minBet, 
      maximum: db.maxBet 
    });

    this.checkAmount(db, parsedAmount);

    await db.run((db) => db.bet.setValue(parsedAmount)).save();
    await edit(command, builder => 
      builder
        .addEmbed(embed => 
          embed  
            .setColor(Constants.Colors.GREEN)
            .setDescription(`You're now betting for ${bold(parsedAmount.toLocaleString())} coins.`)
            .setTimestamp(new Date(command.createdTimestamp))
        )
    );

    return;
  }

  public checkAmount(
    db: PlayerSchema.Document,
    parsedAmount: ReturnType<typeof parseNumber>
  ): asserts parsedAmount is number {
    if (isNullOrUndefined(parsedAmount) || hasDecimal(parsedAmount)) throw new CommandError('You need to pass an actual number.');
    if (parsedAmount === db.bet.value) throw new CommandError("Cannot change your bet due to it being exactly similar.");
    if (parsedAmount < db.minBet) throw new CommandError(`You can't bet lower than your minimum ${bold(db.minBet.toLocaleString())} limit.`);
    if (parsedAmount > db.maxBet) throw new CommandError(`You can't bet higher than your maximum ${bold(db.maxBet.toLocaleString())} limit.`);
    if (parsedAmount > db.wallet.value) throw new CommandError(`You only have ${bold(db.wallet.value.toLocaleString())} coins.`);
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption((option) =>
          option
            .setName('amount')
            .setDescription('Examples: 10k, 2t, 30%, 55.5% (% of max bet), min, max, half, full, 250_000 or 124,000.')
        )
    );
  }
}
